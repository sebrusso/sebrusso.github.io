// Runs before first paint so the page never flashes the wrong theme. This is a
// static export, so the server has no idea what the visitor prefers — the class
// has to be set synchronously in <head>, before the body renders.
const script = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    // Private mode, blocked storage: fall through to the light default.
  }
})();
`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
