import * as PIXI from 'pixi.js'
import { Vector2 } from './vector2'
const keyMap: Record<string, boolean> = {}

window.addEventListener('keydown', (e) => {
  keyMap[e.key] = true
})

window.addEventListener('keyup', (e) => {
  keyMap[e.key] = false
})

export function useMousePos (container: PIXI.Container): { getMousePos: () => {x: number, y: number}, destroy: () => void} {
  const mousePos: Vector2 = { x: 0, y: 0 }

  const listener = (e: any): void => {
    mousePos.x = e.data.global.x
    mousePos.y = e.data.global.y
  }

  container.addListener('mousemove', listener)

  const getMousePos = (): Vector2 => mousePos
  const destroy = (): void => {
    container.removeListener('mousemove', listener)
  }

  return {
    getMousePos,
    destroy
  }
}

export const isKeyDown = (key: string): boolean => keyMap[key]
