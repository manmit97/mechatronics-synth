export function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/✅/g, '<span style="color: #4ade80">✅</span>')
    .replace(/🔧|🤖|🎉|→|⚠️|💡|🔄|⚡|➕|💰|📐|🧱|🗑️|🔗/g, (m) => `<span>${m}</span>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}
