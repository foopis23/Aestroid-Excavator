export interface IVector2 {
  x: number
  y: number
}

const distance = (a: IVector2, b: IVector2): number =>
  Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)

const subtract = (b: IVector2, a: IVector2): IVector2 => {
  return { x: b.x - a.x, y: b.y - a.y }
}

const length = (v: IVector2): number => Math.sqrt((v.x ** 2 + v.y ** 2))

const normalize = (v: IVector2): IVector2 => {
  const mag = length(v)
  return { x: v.x / mag, y: v.y / mag }
}

const dot = (a: IVector2, b: IVector2): number => a.x * b.x + a.y * b.y

const angle = (a: IVector2, b: IVector2): number => dot(a, b) / (length(a) * length(b))

export const mathv2 = {
  distance,
  subtract,
  length,
  normalize,
  dot,
  angle
}
