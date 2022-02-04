export interface Vector2 {
  x: number
  y: number
}

const distance = (a: Vector2, b: Vector2): number =>
  Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)

const subtract = (b: Vector2, a: Vector2): Vector2 => {
  return { x: b.x - a.x, y: b.y - a.y }
}

const length = (v: Vector2): number => Math.sqrt((v.x ** 2 + v.y ** 2))

const normalize = (v: Vector2): Vector2 => {
  const mag = length(v)
  return { x: v.x / mag, y: v.y / mag }
}

const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y

const angle = (a: Vector2, b: Vector2): number => dot(a, b) / (length(a) * length(b))

export const mathv2 = {
  distance,
  subtract,
  length,
  normalize,
  dot,
  angle
}
