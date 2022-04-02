export enum EntityType {
  Player = 1,
  Asteroid = 2,
  Material = 3,
  Goal = 4,
}

export interface IEntity {
  id: number,
  componentMask: number
}