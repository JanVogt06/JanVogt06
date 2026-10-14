// Drives the loading screen written into index.html.
const loader = document.getElementById('loader')!
const text = loader.querySelector('.loader-text')!

let shown = 0

// The bar only ever moves forwards, even when a new download announcing its
// size makes the estimate dip.
export function progress(fraction: number, label?: string) {
  shown = Math.min(1, Math.max(shown, fraction))
  loader.dataset.state = 'loading'
  loader.style.setProperty('--progress', String(shown))
  if (label) text.textContent = label
}

// Fades the screen out once the first frame is on screen, then removes it so
// later errors no longer report to it.
export function finish() {
  progress(1)
  loader.classList.add('done')
  window.setTimeout(() => loader.remove(), 700)
}

// Lets the browser paint the screen before a long stretch of work.
export function breathe() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}
