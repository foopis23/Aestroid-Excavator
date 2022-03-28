export namespace Util {
  export const clamp = (v: number, min: number, max: number): number =>
    Math.min(Math.max(v, min), max)

  export function moveTowards(current: number, towards: number, maxStep: number): number {
    if (Math.abs(current - towards) < 0.01) return towards

    const diff = towards - current
    const direction = Math.abs(diff) / diff

    if (Math.abs(diff) < maxStep) maxStep = Math.abs(diff)

    return current + (direction * maxStep)
  }

  export function lerp(start: number, end: number, step: number) {
    return start * (1 - step) + end * step
  }
}
