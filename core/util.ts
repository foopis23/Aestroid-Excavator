export const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max)

export function moveTowards (current: number, towards: number, maxStep: number): number {
  if (Math.abs(current - towards) < 0.01) return towards

  const diff = towards - current
  const direction = Math.abs(diff) / diff

  if (Math.abs(diff) < maxStep) maxStep = Math.abs(diff)

  return current + (direction * maxStep)
}

export class Queue<T> {
  private data : T[]

  public get length() : number {
    return this.data.length
  }

  public push(v: T) {
    this.data.push(v)
  }

  public pop(): T {
    return this.data.shift()
  }
}
