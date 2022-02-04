const keyMap: Record<string, boolean> = {}

window.addEventListener('keydown', (e) => {
  keyMap[e.key] = true
})

window.addEventListener('keyup', (e) => {
  keyMap[e.key] = false
})

export const isKeyDown = (key: string): boolean => keyMap[key]
