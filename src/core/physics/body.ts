import { IVector2 } from '../vector2';
import { Transform } from './transform';

export interface IPhysicsBody extends Transform {
  radius: number;
  velocity: IVector2;
  acceleration: IVector2;
  dragScale: number;
}
