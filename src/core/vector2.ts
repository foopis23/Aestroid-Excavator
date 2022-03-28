export interface IVector2 {
  x: number
  y: number
}

export class Vector2 implements IVector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  public static distance(a: IVector2, b: IVector2): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
  }

  public static subtract (b: IVector2, a: IVector2): IVector2 {
    return { x: b.x - a.x, y: b.y - a.y }
  }

  public static mag(v: IVector2): number {
    return Math.sqrt((v.x ** 2 + v.y ** 2))
  }

  public static normalize(v: IVector2): IVector2 {
    const mag = Vector2.mag(v)
    return { x: v.x / mag, y: v.y / mag }
  }

  public static dot (a: IVector2, b: IVector2): number {
    return a.x * b.x + a.y * b.y
  } 

  public static angle (a: IVector2, b: IVector2): number {
    return Vector2.dot(a, b) / (Vector2.mag(a) * Vector2.mag(b))
  }
}
