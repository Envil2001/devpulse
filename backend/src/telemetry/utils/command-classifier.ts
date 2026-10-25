export type CommandKind = 'test' | 'build' | 'lint' | 'install' | 'git' | 'ai' | 'other';

const KIND_PRIORITY: ReadonlyArray<CommandKind> = ['test', 'build', 'lint', 'install', 'git'];

const SEGMENT_SEPARATOR = /\s*(?:&&|\|\||;|\||\r?\n)\s*/;
const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const QUOTED_TOKEN = /^["'`]/;

const WRAPPER_BINARIES: ReadonlySet<string> = new Set([
  'sudo',
  'time',
  'env',
  'nohup',
  'command',
  'exec',
]);

const RUNNER_BINARIES: ReadonlySet<string> = new Set([
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'npx',
  'python',
  'python3',
]);

const INSTALL_WORDS: ReadonlySet<string> = new Set([
  'install',
  'i',
  'add',
  'ci',
  'remove',
  'uninstall',
  'update',
  'upgrade',
]);

const SCRIPT_KINDS: ReadonlyMap<string, CommandKind> = new Map<string, CommandKind>([
  ['test', 'test'],
  ['tests', 'test'],
  ['e2e', 'test'],
  ['build', 'build'],
  ['compile', 'build'],
  ['bundle', 'build'],
  ['lint', 'lint'],
  ['format', 'lint'],
  ['fmt', 'lint'],
  ['typecheck', 'lint'],
]);

const TOOL_KINDS: ReadonlyMap<string, CommandKind> = new Map<string, CommandKind>([
  ['vitest', 'test'],
  ['jest', 'test'],
  ['mocha', 'test'],
  ['pytest', 'test'],
  ['rspec', 'test'],
  ['tsc', 'build'],
  ['webpack', 'build'],
  ['esbuild', 'build'],
  ['make', 'build'],
  ['cmake', 'build'],
  ['eslint', 'lint'],
  ['prettier', 'lint'],
  ['biome', 'lint'],
  ['ruff', 'lint'],
  ['black', 'lint'],
  ['claude', 'ai'],
  ['aider', 'ai'],
  ['ollama', 'ai'],
  ['sgpt', 'ai'],
  ['cody', 'ai'],
]);

const SUBCOMMAND_KINDS: ReadonlyMap<string, ReadonlyMap<string, CommandKind>> = new Map([
  [
    'cargo',
    new Map<string, CommandKind>([
      ['test', 'test'],
      ['build', 'build'],
      ['check', 'build'],
      ['clippy', 'lint'],
      ['fmt', 'lint'],
      ['install', 'install'],
      ['add', 'install'],
    ]),
  ],
  [
    'go',
    new Map<string, CommandKind>([
      ['test', 'test'],
      ['build', 'build'],
      ['vet', 'lint'],
      ['get', 'install'],
      ['install', 'install'],
    ]),
  ],
  [
    'dotnet',
    new Map<string, CommandKind>([
      ['test', 'test'],
      ['build', 'build'],
      ['restore', 'install'],
    ]),
  ],
  ['docker', new Map<string, CommandKind>([['build', 'build']])],
  ['vite', new Map<string, CommandKind>([['build', 'build']])],
  ['playwright', new Map<string, CommandKind>([['test', 'test']])],
  ['pip', new Map<string, CommandKind>([['install', 'install']])],
  ['pip3', new Map<string, CommandKind>([['install', 'install']])],
  [
    'make',
    new Map<string, CommandKind>([
      ['test', 'test'],
      ['lint', 'lint'],
    ]),
  ],
  ['gh', new Map<string, CommandKind>([['copilot', 'ai']])],
]);

function baseName(token: string): string {
  const name = token.split(/[\\/]/).pop() ?? token;
  return name.replace(/\.(?:exe|cmd|bat)$/i, '').toLowerCase();
}
function resolveWord(word: string): CommandKind | null {
  const key = word.split(':')[0] ?? word;

  if (INSTALL_WORDS.has(key)) return 'install';
  return SCRIPT_KINDS.get(key) ?? TOOL_KINDS.get(key) ?? null;
}

function classifySegment(segment: string): CommandKind {
  const tokens = segment.split(/\s+/).filter((token) => token !== '');
  const start = tokens.findIndex(
    (token) => !ENV_ASSIGNMENT.test(token) && !WRAPPER_BINARIES.has(baseName(token)),
  );

  if (start === -1) return 'other';

  const [rawBinary, ...args] = tokens.slice(start);
  const binary = baseName(rawBinary);
  const positionals = args.filter((arg) => !arg.startsWith('-') && !QUOTED_TOKEN.test(arg));

  if (binary === 'git') return 'git';

  if (RUNNER_BINARIES.has(binary)) {
    for (const word of positionals) {
      const kind = resolveWord(word);
      if (kind !== null) return kind;
    }
    return binary === 'yarn' && positionals.length === 0 ? 'install' : 'other';
  }

  const bySubcommand = SUBCOMMAND_KINDS.get(binary)?.get(positionals[0]);

  return bySubcommand ?? TOOL_KINDS.get(binary) ?? 'other';
}

export function classifyCommand(command: string): CommandKind {
  const kinds = new Set(
    command.split(SEGMENT_SEPARATOR).map((segment) => classifySegment(segment)),
  );
  return KIND_PRIORITY.find((kind) => kinds.has(kind)) ?? 'other';
}
