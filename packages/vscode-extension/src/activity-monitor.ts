import * as vscode from 'vscode';

// Два возможных состояния: программист работает (active) или отошел (idle)
export type ActivityState = 'active' | 'idle';

/**
 * Событие смены состояния. changedAt — момент, когда переход СЕМАНТИЧЕСКИ произошел,
 * а не момент, когда об этом узнал подписчик. Для обычных переходов это одно и то же;
 * для детекта сна — нет (реальное начало простоя раньше момента пробуждения, которым
 * мы это обнаруживаем).
 */
export interface ActivityStateChange {
  state: ActivityState;
  changedAt: number;
}

/** Время (2 минуты = 120 000 мс) бездействия, после которого мы считаем юзера "idle" */
const DEFAULT_IDLE_THRESHOLD_MS = 120_000;

/**
 * Отсрочка перед переходом в idle при потере фокуса окна VS Code.
 * Если юзер быстро переключился в браузер и вернулся — не считаем это простоем.
 */
const WINDOW_BLUR_GRACE_MS = 10_000;

/**
 * Как часто проверяем, не спала ли система (мс).
 * setInterval/setTimeout в Node.js замораживаются на время сна ОС —
 * это и есть механизм детекта: сравниваем ОЖИДАЕМЫЙ интервал между тиками с РЕАЛЬНЫМ.
 */
const SLEEP_CHECK_INTERVAL_MS = 15_000;

/**
 * Во сколько раз реальный интервал должен превысить ожидаемый, чтобы считать это сном,
 * а не просто временной задержкой event loop (GC-пауза, тяжелая синхронная операция).
 */
const SLEEP_DRIFT_TOLERANCE = 3;

/**
 * Важная функция-фильтр.
 * В VS Code есть много "скрытых" документов (например, окно настроек, панель вывода логов).
 * Нам нужно считать время только если человек работает с РЕАЛЬНЫМ файлом на диске ('file')
 * или новым несохраненным файлом ('untitled').
 */
function isTrackedTextDocument(document: vscode.TextDocument): boolean {
  if (document.isClosed) {
    return false;
  }
  const { scheme } = document.uri;
  return scheme === 'file' || scheme === 'untitled';
}

export class ActivityMonitor implements vscode.Disposable {
  private state: ActivityState; // Текущий статус
  private idleTimer: ReturnType<typeof setTimeout> | undefined; // Тот самый 2-минутный таймер
  private blurTimer: ReturnType<typeof setTimeout> | undefined; // Отсрочка idle при потере фокуса окна
  private sleepCheckTimer: ReturnType<typeof setInterval> | undefined; // Пульс для детекта сна системы
  private lastSleepCheckAt: number = Date.now(); // Момент последней проверки — точка отсчета для дрифта
  private readonly disposables: Array<vscode.Disposable> = []; // Корзина для мусора (отписки)

  // Создаем нашу "радиостанцию". Через нее мы будем кричать на весь плагин: "СТАТУС ИЗМЕНИЛСЯ!"
  private readonly emitter = new vscode.EventEmitter<ActivityStateChange>();

  // Публичная частота этой радиостанции. Телеметрия (Менеджер) подпишется именно сюда.
  readonly onDidChangeActivityState = this.emitter.event;

  constructor(
    private readonly idleThresholdMs: number = DEFAULT_IDLE_THRESHOLD_MS,
    private readonly log?: vscode.OutputChannel,
  ) {
    // 1. При запуске проверяем: окно VS Code сейчас в фокусе? Если да -> active, иначе -> idle
    this.state = vscode.window.state.focused ? 'active' : 'idle';

    // 2. Развешиваем "жучки" на все действия пользователя
    this.registerListeners();

    // 3. Запускаем фоновый пульс, который поймает сон системы даже без активности юзера
    this.startSleepDetection();

    // 4. Если окно в фокусе, сразу запускаем обратный отсчет на 2 минуты
    if (this.state === 'active') {
      this.scheduleIdleTransition();
    }
  }

  // Позволяет другим классам спросить: "Он сейчас работает?"
  get currentState(): ActivityState {
    return this.state;
  }

  /**
   * Развешиваем слушатели событий VS Code.
   */
  private registerListeners(): void {
    this.disposables.push(
      // 1. Изменился текст (человек печатает или удаляет код)
      vscode.workspace.onDidChangeTextDocument((event) => {
        // Если это не реальный файл или изменений по факту 0 — игнорируем
        if (!isTrackedTextDocument(event.document) || event.contentChanges.length === 0) return;
        this.pulseActivity(); // РЕГИСТРИРУЕМ ПУЛЬС!
      }),
      // 2. Человек выделил текст мышкой или передвинул курсор стрелочками
      vscode.window.onDidChangeTextEditorSelection((event) => {
        if (!isTrackedTextDocument(event.textEditor.document)) return;
        this.pulseActivity();
      }),
      // 3. Человек проскроллил код (изменилась видимая область)
      vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
        if (!isTrackedTextDocument(event.textEditor.document)) return;
        this.pulseActivity();
      }),
      // 4. Человек переключился на другую вкладку с файлом
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor === undefined || !isTrackedTextDocument(editor.document)) return;
        this.pulseActivity();
      }),
      // 5. Окно VS Code потеряло или получило фокус (свернул редактор / развернул)
      vscode.window.onDidChangeWindowState((windowState) => {
        if (windowState.focused) {
          this.pulseActivity(); // Вернулись в окно -> активен, отменяем отложенный idle
        } else {
          this.clearIdleTimer(); // Обычный idle-таймер больше не актуален без фокуса
          this.scheduleBlurIdleTransition(); // Даем 10 сек на случай быстрого переключения обратно
        }
      }),
      // 6. Фокус перешел на интегрированный терминал (запуск команд — тоже работа)
      vscode.window.onDidChangeActiveTerminal((terminal) => {
        if (terminal === undefined) return; // Фокус ушел с терминала — не считаем это активностью
        this.pulseActivity();
      }),
      // 7. Открыли новую вкладку терминала
      vscode.window.onDidOpenTerminal(() => {
        this.pulseActivity();
      }),
      // 8. Запустили сессию отладки (пошаговая отладка — это работа без правок текста)
      vscode.debug.onDidStartDebugSession(() => {
        this.pulseActivity();
      }),
      // 9. Добавили/убрали/изменили брейкпоинт
      vscode.debug.onDidChangeBreakpoints(() => {
        this.pulseActivity();
      }),
      // 10. Создали файл через Explorer (или программно через workspace.fs)
      vscode.workspace.onDidCreateFiles(() => {
        this.pulseActivity();
      }),
      // 11. Удалили файл через Explorer
      vscode.workspace.onDidDeleteFiles(() => {
        this.pulseActivity();
      }),
      // 12. Переименовали файл через Explorer
      vscode.workspace.onDidRenameFiles(() => {
        this.pulseActivity();
      }),
    );
  }

  /**
   * ЭТО СЕРДЦЕ КЛАССА. "Пульс активности".
   * Вызывается ПРИ ЛЮБОМ чихе пользователя (печать, скролл, клик, терминал, дебаг...).
   */
  private pulseActivity(): void {
    this.clearBlurTimer(); // Любая активность отменяет отложенный idle от потери фокуса окна

    // Если до этого юзер спал ('idle'), переводим его в 'active'
    if (this.state === 'idle') {
      this.transitionTo('active');
    }
    // Запускаем 2-минутный таймер заново!
    this.scheduleIdleTransition();
  }

  /**
   * Запуск или перезапуск таймера бездействия.
   */
  private scheduleIdleTransition(): void {
    this.clearIdleTimer(); // Сбрасываем старый таймер

    // Заводим новый будильник. Если он прозвенит (через 2 мин) — статус станет 'idle'
    this.idleTimer = setTimeout(() => {
      this.idleTimer = undefined;
      this.transitionTo('idle');
    }, this.idleThresholdMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== undefined) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }

  /**
   * Запуск отложенного перехода в idle при потере фокуса окна.
   * Даем WINDOW_BLUR_GRACE_MS на случай, если юзер просто на секунду отвлекся.
   */
  private scheduleBlurIdleTransition(): void {
    this.clearBlurTimer();

    this.blurTimer = setTimeout(() => {
      this.blurTimer = undefined;
      this.transitionTo('idle');
    }, WINDOW_BLUR_GRACE_MS);
  }

  private clearBlurTimer(): void {
    if (this.blurTimer !== undefined) {
      clearTimeout(this.blurTimer);
      this.blurTimer = undefined;
    }
  }

  /**
   * Запускаем фоновый "пульс" каждые SLEEP_CHECK_INTERVAL_MS.
   * Во время сна системы сам setInterval замораживается вместе с процессом —
   * после пробуждения он сработает с опозданием, и мы поймаем это по разнице во времени.
   */
  private startSleepDetection(): void {
    this.lastSleepCheckAt = Date.now();

    this.sleepCheckTimer = setInterval(() => {
      const now = Date.now();
      const previousCheckpoint = this.lastSleepCheckAt;
      const elapsed = now - previousCheckpoint;
      this.lastSleepCheckAt = now;

      if (elapsed > SLEEP_CHECK_INTERVAL_MS * SLEEP_DRIFT_TOLERANCE) {
        const sleptSeconds = Math.round((elapsed - SLEEP_CHECK_INTERVAL_MS) / 1000);
        this.log?.appendLine(`[activity] system sleep detected, ~${String(sleptSeconds)}s`);

        // Сон однозначно означает простой — независимо от того, что показывали обычные таймеры
        this.clearIdleTimer();
        this.clearBlurTimer();

        // Важно: помечаем начало простоя моментом ПОСЛЕДНЕЙ УДАЧНОЙ проверки (до сна),
        // а не моментом пробуждения — иначе весь сон засчитается в предыдущий active-период.
        this.transitionTo('idle', previousCheckpoint);
      }
    }, SLEEP_CHECK_INTERVAL_MS);
  }

  private clearSleepCheckTimer(): void {
    if (this.sleepCheckTimer !== undefined) {
      clearInterval(this.sleepCheckTimer);
      this.sleepCheckTimer = undefined;
    }
  }

  /**
   * Физическое изменение статуса и уведомление остальных.
   * changedAt по умолчанию — "сейчас", но детект сна передает более раннее время.
   */
  private transitionTo(next: ActivityState, changedAt: number = Date.now()): void {
    if (this.state === next) return; // Если статус не поменялся — ничего не делаем

    this.state = next;
    this.log?.appendLine(`[activity] ${next}`); // Пишем в логи (для отладки)
    this.emitter.fire({ state: next, changedAt }); // 📣 КРИЧИМ В РАДИОСТАНЦИЮ: "Статус изменился!"
  }

  // Уборка за собой при закрытии плагина
  dispose(): void {
    this.clearIdleTimer();
    this.clearBlurTimer();
    this.clearSleepCheckTimer();
    this.emitter.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
