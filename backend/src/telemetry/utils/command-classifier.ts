export type CommandKind = 'test' | 'build' | 'lint' | 'install' | 'git' | 'other';

const PACKAGE_MANAGER = String.raw`(?:npm|pnpm|yarn|bun)`;

function packageScript(name: string): RegExp {
  return new RegExp(
    String.raw`\b${PACKAGE_MANAGER}\s+(?:run\s+)?${name}(?:[:.-][\w.-]+)?(?=\s|$)`,
    'i',
  );
}

const GIT_PATTERNS = [/^\s*git(?:\.exe)?\b/i];

const INSTALL_PATTERNS = [
  new RegExp(String.raw`\b${PACKAGE_MANAGER}\s+(?:install|i|add|ci)\b`, 'i'),
  /\b(?:pip|pip3)\s+install\b/i,
  /\bpython(?:3)?\s+-m\s+pip\s+install\b/i,
  /\buv\s+(?:add|sync|pip\s+install)\b/i,
  /\bpoetry\s+(?:add|install)\b/i,
  /\bcargo\s+(?:install|add)\b/i,
  /\bgo\s+get\b/i,
  /\b(?:composer\s+(?:install|require)|bundle\s+install|gem\s+install)\b/i,
  /\bdotnet\s+add\s+package\b/i,
];

const TEST_PATTERNS = [
  packageScript('test'),
  /\b(?:vitest|jest|mocha|pytest|phpunit|rspec)\b/i,
  /\bplaywright\s+test\b/i,
  /\bcypress\s+run\b/i,
  /\b(?:cargo|go|dotnet)\s+test\b/i,
  /\b(?:mvnw?|gradlew?)\b.*\btest\b/i,
];

const BUILD_PATTERNS = [
  packageScript('build'),
  /\b(?:tsc|webpack|esbuild|rollup)\b/i,
  /\b(?:vite|next|ng)\s+build\b/i,
  /\b(?:cargo|go|dotnet)\s+build\b/i,
  /\bcmake\s+--build\b/i,
  /\bdocker\s+build\b/i,
  /\bmake\b/i,
  /\b(?:mvnw?|gradlew?)\b.*\b(?:package|assemble|build)\b/i,
];

const LINT_PATTERNS = [
  packageScript('lint'),
  /\b(?:eslint|prettier|ruff|black|flake8|pylint|mypy|golangci-lint|shellcheck)\b/i,
  /\bcargo\s+clippy\b/i,
  /\bgo\s+vet\b/i,
];

function matchesAny(command: string, patterns: ReadonlyArray<RegExp>): boolean {
  return patterns.some((pattern) => pattern.test(command));
}

export function classifyCommand(command: string): CommandKind {
  const normalized = command.trim();

  if (!normalized) return 'other';

  if (matchesAny(normalized, GIT_PATTERNS)) return 'git';
  if (matchesAny(normalized, INSTALL_PATTERNS)) return 'install';
  if (matchesAny(normalized, TEST_PATTERNS)) return 'test';
  if (matchesAny(normalized, LINT_PATTERNS)) return 'lint';
  if (matchesAny(normalized, BUILD_PATTERNS)) return 'build';

  return 'other';
}
