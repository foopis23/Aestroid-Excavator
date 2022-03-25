import * as PIXI from 'pixi.js'
import { IVector2 } from '../../core/vector2'
const keyMap: Record<string, boolean> = {}

window.addEventListener('keydown', (e) => {
  keyMap[e.key] = true
})

window.addEventListener('keyup', (e) => {
  keyMap[e.key] = false
})

export function useMousePos (container: PIXI.Container): { getMousePos: () => {x: number, y: number}, destroy: () => void} {
  const mousePos: IVector2 = { x: 0, y: 0 }

  container.addListener('mousemove', (e): void => {
    mousePos.x = e.data.global.x
    mousePos.y = e.data.global.y
  })

  const getMousePos = (): IVector2 => mousePos
  const destroy = (): void => {
    container.removeListener('mousemove')
  }

  return {
    getMousePos,
    destroy
  }
}

export const isKeyDown = (key: string): boolean => keyMap[key]
