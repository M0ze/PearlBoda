/**
 * Progressive enhancement hook for non-React/legacy embeds.
 * The React surface has the same lightweight bike composition in CSS; this
 * module exposes an accessible canvas fallback for pages that opt into it.
 */
export function initHeroBikeAnimation(canvas) {
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const context = canvas.getContext('2d')
  if (!context) return
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = canvas.clientWidth * ratio
    canvas.height = canvas.clientHeight * ratio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  const draw = (time) => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    context.clearRect(0, 0, width, height)
    const x = width * .58 + Math.sin(time / 1400) * 12
    const y = height * .58 + Math.sin(time / 420) * 4
    context.strokeStyle = '#22d3ee'
    context.shadowColor = '#22d3ee'
    context.shadowBlur = 14
    context.lineWidth = 3
    for (const offset of [-42, 42]) {
      context.beginPath()
      context.arc(x + offset, y, 38, 0, Math.PI * 2)
      context.stroke()
    }
    context.shadowBlur = 0
    context.strokeStyle = '#facc15'
    context.lineWidth = 7
    context.beginPath()
    context.moveTo(x - 42, y)
    context.lineTo(x - 5, y - 35)
    context.lineTo(x + 42, y)
    context.lineTo(x - 42, y)
    context.stroke()
    requestAnimationFrame(draw)
  }
  resize()
  window.addEventListener('resize', resize, { passive: true })
  requestAnimationFrame(draw)
}
