export type CodeType = 'curl' | 'ts' | 'python' | 'json';

export function highlightCode(code: string, type: CodeType): string {
  if (type === 'json') {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let cls = 'text-green-spring';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'text-neutral-100 font-medium';
            }
          } else if (/true|false/.test(match)) {
            cls = 'text-purple-aspid font-semibold';
          } else if (/null/.test(match)) {
            cls = 'text-neutral-500';
          } else {
            cls = 'text-orange-signal font-mono';
          }
          return `<span class="${cls}">${match}</span>`;
        },
      );
  }

  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]*)"/g, '<span class="text-green-spring">"$1"</span>')
    .replace(
      /\b(curl|const|await|async|fetch|import|requests|def|return)\b/g,
      '<span class="text-purple-aspid font-medium">$1</span>',
    )
    .replace(
      /\b(GET|POST|PUT|PATCH|DELETE)\b/g,
      '<span class="text-green-spring font-bold">$1</span>',
    )
    .replace(/(-X|-H)\b/g, '<span class="text-neutral-400 font-semibold">$1</span>')
    .replace(
      /(https?:\/\/[^\s"\\]+)/g,
      '<span class="text-blue-frosty underline underline-offset-2">$1</span>',
    );
}
