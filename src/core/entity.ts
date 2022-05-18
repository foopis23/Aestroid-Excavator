export enum EntityType {
  Player = 1,
  Asteroid = 2,
  Material = 3,
  Goal = 4,
  Projectile = 5,
  GameTimer = 6,
}

export interface IEntity {
  id: number,
  componentMask: number,
  type: EntityType
}