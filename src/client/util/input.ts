import { Container } from 'pixi.js'
import { Vector2 } from 'simple-game-math'
const keyMap: Record<string, boolean> = {}

window.addEventListener('keydown', (e) => {
  keyMap[e.key] = true
})

window.addEventListener('keyup', (e) => {
  keyMap[e.key] = false
})

export function useMousePos (container: Container): { getMousePos: () => {x: number, y: number}, destroy: () => void} {
  const mousePos: Vector2.IVector2 = { x: 0, y: 0 }

  container.addListener('mousemove', (e): void => {
    mousePos.x = e.data.global.x
    mousePos.y = e.data.global.y
  })

  const getMousePos = (): Vector2.IVector2 => {
    return {
      x: mousePos.x / container.scale.x,
      y: mousePos.y / container.scale.y
    }
  }
  const destroy = (): void => {
    container.removeListener('mousemove')
  }

  return {
    getMousePos,
    destroy
  }
}

export const isKeyDown = (key: string): boolean => keyMap[key]
