const MAX_LENGTH = 150;
const MAX_SEGMENTS = 3;

const SEGMENT_SEPARATOR = /\s*(?:&&|\|\||;|\||\r?\n)\s*/;
const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

const WRAPPER_BINARIES: ReadonlySet<string> = new Set([
  'sudo',
  'time',
  'env',
  'nohup',
  'command',
  'exec',
  'npx',
  'bunx',
  'yarn',
]);

const SMART_COMMANDS: Record<string, (args: Array<string>) => Array<string>> = {
  git: (args) => args.slice(0, 1),

  npm: (args) => sanitizePackageManager(args),
  pnpm: (args) => sanitizePackageManager(args),
  yarn: (args) => sanitizePackageManager(args),
  bun: (args) => sanitizePackageManager(args),

  docker: (args) => args.slice(0, 1),
  make: (args) => args.slice(0, 1),
  go: (args) => args.slice(0, 1),
  cargo: (args) => args.slice(0, 1),
  python: (args) => (args[0] === '-m' ? ['-m', args[1]] : []),
};

function sanitizePackageManager(args: Array<string>): Array<string> {
  if (args.length === 0) return [];
  const action = args[0];

  if ((action === 'run' || action === 'run-script') && args.length > 1) {
    return [action, args[1]];
  }

  if (['install', 'i', 'add', 'remove', 'rm', 'uninstall'].includes(action)) {
    return args.length > 1 ? [action, '[pkg]'] : [action];
  }

  return [action];
}

function baseName(token: string): string {
  return (token.split(/[\\/]/).pop() ?? token).replace(/\.(?:exe|cmd|bat)$/i, '').toLowerCase();
}

function sanitizeSegment(segment: string): string | null {
  const tokens = segment.split(/\s+/).filter(Boolean);

  const start = tokens.findIndex(
    (token) => !ENV_ASSIGNMENT.test(token) && !WRAPPER_BINARIES.has(baseName(token)),
  );

  if (start === -1) return null;

  const rawBinary = tokens[start];
  const args = tokens.slice(start + 1).filter((t) => !t.startsWith('-'));
  const binary = baseName(rawBinary);

  if (Object.prototype.hasOwnProperty.call(SMART_COMMANDS, binary)) {
    const safeArgs = SMART_COMMANDS[binary](args);
    return [binary, ...safeArgs].join(' ');
  }

  return binary;
}

export function sanitizeCommand(raw: string): string {
  const joined = raw
    .split(SEGMENT_SEPARATOR)
    .map((element) => sanitizeSegment(element))
    .filter((segment): segment is string => segment !== null)
    .slice(0, MAX_SEGMENTS)
    .join(' && ');

  return joined.length > MAX_LENGTH ? `${joined.slice(0, MAX_LENGTH)}…` : joined;
}
