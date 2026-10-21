// Fades out the splash written into index.html once the page's own screens
// are up, then removes it so later errors no longer report to it.
export function finish() {
  const loader = document.getElementById('loader')
  if (!loader) return
  loader.classList.add('done')
  window.setTimeout(() => loader.remove(), 700)
}
