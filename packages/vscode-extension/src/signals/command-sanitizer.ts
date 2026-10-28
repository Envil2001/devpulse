const MAX_LENGTH = 150;
const MAX_SEGMENTS = 3;

const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

const WRAPPERS: Readonly<Record<string, ReadonlySet<string>>> = {
  sudo: new Set([
    '-u',
    '--user',
    '-g',
    '--group',
    '-h',
    '--host',
    '-p',
    '--prompt',
    '-C',
    '--close-from',
    '-r',
    '--role',
    '-t',
    '--type',
    '-U',
    '--other-user',
    '-D',
    '--chdir',
    '-R',
    '--chroot',
  ]),
  env: new Set(['-u', '--unset', '-C', '--chdir', '-S', '--split-string']),
  time: new Set(['-f', '--format', '-o', '--output']),
  nohup: new Set(),
  command: new Set(),
  exec: new Set(['-a']),
  npx: new Set(['-p', '--package', '-c', '--call', '--cache', '--userconfig']),
  bunx: new Set(['-p', '--package']),
};

const SAFE_BINARIES: ReadonlySet<string> = new Set([
  // shells
  'bash',
  'sh',
  'zsh',
  'fish',
  'dash',
  'ksh',
  // coreutils
  'ls',
  'pwd',
  'echo',
  'cat',
  'grep',
  'egrep',
  'fgrep',
  'find',
  'mkdir',
  'rmdir',
  'rm',
  'cp',
  'mv',
  'touch',
  'chmod',
  'chown',
  'ln',
  'stat',
  'head',
  'tail',
  'less',
  'more',
  'wc',
  'sort',
  'uniq',
  'cut',
  'sed',
  'awk',
  'tr',
  'tee',
  'xargs',
  'diff',
  'tar',
  'gzip',
  'gunzip',
  'zip',
  'unzip',
  'ps',
  'kill',
  'killall',
  'pkill',
  'top',
  'df',
  'du',
  'free',
  'uname',
  'hostname',
  'whoami',
  'id',
  'date',
  'uptime',
  'sleep',
  'true',
  'false',
  'test',
  'expr',
  'which',
  'whereis',
  'man',
  'printf',
  'printenv',
  'mktemp',
  'timeout',
  'watch',
  'yes',
  'seq',
  // network
  'curl',
  'wget',
  'ssh',
  'scp',
  'rsync',
  'ping',
  'dig',
  'nslookup',
  'netstat',
  'ss',
  'lsof',
  // editors
  'vim',
  'vi',
  'nano',
  'emacs',
  'code',
  'open',
  'xdg-open',
  // runtimes
  'node',
  'deno',
  'python3',
  'ruby',
  'perl',
  'php',
  'java',
  'javac',
  'dotnet',
  'gcc',
  'g++',
  'clang',
  'clang++',
  // build / test
  'tsc',
  'eslint',
  'prettier',
  'jest',
  'vitest',
  'mocha',
  'webpack',
  'vite',
  'rollup',
  'esbuild',
  'tsx',
  'ts-node',
  'nodemon',
  'pytest',
  'mypy',
  'ruff',
  'black',
  'flake8',
  'pylint',
  'rubocop',
  'rspec',
  'rake',
  // cloud / infra
  'kubectl',
  'helm',
  'terraform',
  'aws',
  'gcloud',
  'az',
  'doctl',
  'heroku',
  'fly',
  'vercel',
  'netlify',
  'ansible',
  'ansible-playbook',
  'vagrant',
  'packer',
  'pulumi',
  'cdk',
  'serverless',
  'sam',
  // containers
  'podman',
  'minikube',
  'kind',
  'docker-compose',
  // vcs
  'svn',
  'hg',
  // misc
  'jq',
  'yq',
  'sqlite3',
  'psql',
  'mysql',
  'redis-cli',
  'systemctl',
  'service',
  'journalctl',
  'dmesg',
  'openssl',
  'gpg',
  'ssh-keygen',
  'screen',
  'tmux',
]);

const GIT_VALUE_FLAGS: ReadonlySet<string> = new Set([
  '-C',
  '-c',
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--exec-path',
  '-n',
  '--max-count',
  '--author',
  '--committer',
  '--since',
  '--until',
  '--grep',
  '--format',
  '-S',
  '-G',
  '--file',
  '--output',
]);

const DOCKER_VALUE_FLAGS: ReadonlySet<string> = new Set([
  '-H',
  '--host',
  '-c',
  '--context',
  '--config',
  '-l',
  '--log-level',
  '--tlscacert',
  '--tlscert',
  '--tlskey',
]);

const MAKE_VALUE_FLAGS: ReadonlySet<string> = new Set([
  '-C',
  '--directory',
  '-f',
  '--file',
  '-j',
  '--jobs',
  '-I',
  '--include-dir',
  '-o',
  '--old-file',
  '-W',
  '--what-if',
  '-l',
  '--load-average',
]);

const CARGO_VALUE_FLAGS: ReadonlySet<string> = new Set([
  '--manifest-path',
  '-Z',
  '--config',
  '-C',
  '-j',
  '--jobs',
  '--target',
  '-p',
  '--package',
  '--features',
  '--target-dir',
]);

const GO_VALUE_FLAGS: ReadonlySet<string> = new Set(['-C', '-o']);

const PM_VALUE_FLAGS: ReadonlySet<string> = new Set([
  '--filter',
  '--prefix',
  '--registry',
  '--cache',
  '--userconfig',
  '--store',
  '--dir',
  '-C',
  '--reporter',
  '--loglevel',
]);

function takePositional(
  args: ReadonlyArray<string>,
  valueFlags: ReadonlySet<string>,
  limit: number,
): Array<string> {
  const result: Array<string> = [];
  let i = 0;
  while (i < args.length && result.length < limit) {
    const a = args[i];
    if (a.startsWith('-')) {
      i += valueFlags.has(a) ? 2 : 1;
    } else {
      result.push(a);
      i += 1;
    }
  }
  return result;
}

function sanitizePackageManager(args: ReadonlyArray<string>): Array<string> {
  const pos = takePositional(args, PM_VALUE_FLAGS, 2);
  if (pos.length === 0) return [];
  const action = pos[0];

  if ((action === 'run' || action === 'run-script') && pos.length > 1) {
    return [action, pos[1]];
  }
  if (['install', 'i', 'add', 'remove', 'rm', 'uninstall'].includes(action)) {
    return pos.length > 1 ? [action, '[pkg]'] : [action];
  }
  return [action];
}

type ArgSanitizer = (args: ReadonlyArray<string>) => ReadonlyArray<string>;

const SMART_COMMANDS: Readonly<Partial<Record<string, ArgSanitizer>>> = {
  git: (args) => takePositional(args, GIT_VALUE_FLAGS, 1),
  npm: sanitizePackageManager,
  pnpm: sanitizePackageManager,
  yarn: sanitizePackageManager,
  bun: sanitizePackageManager,
  docker: (args) => takePositional(args, DOCKER_VALUE_FLAGS, 1),
  make: (args) => takePositional(args, MAKE_VALUE_FLAGS, 1),
  go: (args) => takePositional(args, GO_VALUE_FLAGS, 1),
  cargo: (args) => takePositional(args, CARGO_VALUE_FLAGS, 1),
  python: (args) => {
    const idx = args.indexOf('-m');
    if (idx !== -1 && idx + 1 < args.length) return ['-m', args[idx + 1]];
    return [];
  },
};

function baseName(token: string): string {
  return (token.split(/[\\/]/).pop() ?? token).replace(/\.(?:exe|cmd|bat)$/i, '').toLowerCase();
}

function tokenize(input: string): Array<string> {
  const tokens: Array<string> = [];
  let current = '';
  let started = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (ch === '"' || ch === "'") {
      started = true;
      const quote = ch;
      i++;
      while (i < input.length && input[i] !== quote) {
        if (quote === '"' && input[i] === '\\' && i + 1 < input.length) {
          current += input[i + 1];
          i += 2;
        } else {
          current += input[i];
          i++;
        }
      }
      if (i < input.length) i++;
    } else if (/\s/.test(ch)) {
      if (started) {
        tokens.push(current);
        current = '';
        started = false;
      }
      i++;
    } else {
      current += ch;
      started = true;
      i++;
    }
  }
  if (started) tokens.push(current);
  return tokens;
}

function splitSegments(input: string): Array<string> {
  const segments: Array<string> = [];
  let current = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      current += ch;
      i++;
      while (i < input.length) {
        const c = input[i];
        current += c;
        if (quote === '"' && c === '\\' && i + 1 < input.length) {
          current += input[i + 1];
          i += 2;
          continue;
        }
        if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if ((ch === '&' && input[i + 1] === '&') || (ch === '|' && input[i + 1] === '|')) {
      segments.push(current);
      current = '';
      i += 2;
      continue;
    }
    if (ch === '|' || ch === ';' || ch === '\n') {
      segments.push(current);
      current = '';
      i += 1;
      continue;
    }
    current += ch;
    i++;
  }
  if (current) segments.push(current);
  return segments;
}

interface FoundCommand {
  binary: string;
  args: ReadonlyArray<string>;
}

function findCommand(tokens: ReadonlyArray<string>): FoundCommand | null {
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (ENV_ASSIGNMENT.test(token)) {
      i++;
      continue;
    }

    const bin = baseName(token);
    const wrapperFlags = WRAPPERS[bin];
    if (Object.hasOwn(WRAPPERS, bin)) {
      i++;
      while (i < tokens.length && tokens[i].startsWith('-')) {
        i += wrapperFlags.has(tokens[i]) ? 2 : 1;
      }
      continue;
    }

    if (token.startsWith('-')) return null;

    if (token.includes('/') || token.includes('\\')) return null;

    return { binary: bin, args: tokens.slice(i + 1) };
  }
  return null;
}

function sanitizeSegment(segment: string): string | null {
  const tokens = tokenize(segment);
  const found = findCommand(tokens);
  if (!found) return null;

  const { binary, args } = found;
  const sanitizer = SMART_COMMANDS[binary];
  if (sanitizer) {
    return [binary, ...sanitizer(args)].join(' ');
  }
  if (SAFE_BINARIES.has(binary)) {
    return binary;
  }
  return null;
}

export function sanitizeCommand(raw: string): string {
  const joined = splitSegments(raw)
    .map((segment) => sanitizeSegment(segment))
    .filter((segment): segment is string => segment !== null)
    .slice(0, MAX_SEGMENTS)
    .join(' && ');

  return joined.length > MAX_LENGTH ? `${joined.slice(0, MAX_LENGTH)}…` : joined;
}
