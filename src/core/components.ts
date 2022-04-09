import { Container } from "pixi.js";
import { Vector2 } from "simple-game-math";

export enum ComponentTypes {
  Transform = 1,
  RigidBody = 2,
  Collider = 4,
  PlayerInput = 8,
  LocalPlayer = 16,
  Graphics = 32,
  TransformSync = 64,
  TriggerCollider = 128,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IComponent { }

export interface TransformComponent extends IComponent {
  position: Vector2.IVector2;
  rotation: number;
}

export interface RigidBodyComponent extends IComponent {
  velocity: Vector2.IVector2;
  acceleration: Vector2.IVector2;
  hasDrag: boolean;
  maxAcceleration: number;
}

export interface ColliderComponent extends IComponent {
  size: Vector2.IVector2;
  type: 'circle' | 'rectangle';
  static: boolean;
  priority: number;
}

export interface TriggerColliderComponent extends IComponent {
  triggerSize: Vector2.IVector2;
  triggerShape: 'circle' | 'rectangle';
}

export interface PlayerInputComponent extends IComponent {
  moveInput: Vector2.IVector2;
  lookRot: number;
  inputBuffer: {moveInput: Vector2.IVector2, lookRot: number, time: number}[];
}

export interface LocalPlayerComponent extends IComponent {
  isLocalPlayer: boolean;
}

export interface GraphicsComponent extends IComponent {
  graphics: Container | null;
}

export interface TransformSyncComponent extends IComponent {
  transformBuffer: { value: TransformComponent, time: number }[];
  localTransformBuffer: {value: TransformComponent, time: number}[];
}

export interface IEntityData extends TransformComponent, RigidBodyComponent, ColliderComponent, PlayerInputComponent, LocalPlayerComponent, GraphicsComponent, TransformSyncComponent, TriggerColliderComponent { }

export class EntityData implements IEntityData {
  static: boolean
  moveInput: Vector2.IVector2
  lookRot: number
  size: Vector2.IVector2
  type: 'circle' | 'rectangle'
  velocity: Vector2.IVector2
  acceleration: Vector2.IVector2
  position: Vector2.IVector2
  rotation: number
  maxAcceleration: number
  isLocalPlayer: boolean;
  graphics: Container | null;
  hasDrag: boolean;
  priority: number;
  transformBuffer: { value: TransformComponent, time: number }[];
  inputBuffer: { moveInput: Vector2.IVector2; lookRot: number; time: number; }[];
  localTransformBuffer: { value: TransformComponent; time: number; }[];
  triggerSize: Vector2.IVector2;
  triggerShape: "circle" | "rectangle";

  constructor(initial: Partial<IEntityData> = {}) {
    this.static = initial.static ?? true
    this.hasDrag = initial.hasDrag ?? true
    this.moveInput = initial.moveInput ?? { x: 0, y: 0 }
    this.lookRot = initial.lookRot ?? 0
    this.size = initial.size ?? { x: 30, y: 30 }
    this.type = initial.type ?? 'circle'
    this.velocity = initial.velocity ?? { x: 0, y: 0 }
    this.acceleration = initial.acceleration ?? { x: 0, y: 0 }
    this.position = initial.position ?? { x: 0, y: 0 }
    this.rotation = initial.rotation ?? 0
    this.maxAcceleration = initial.maxAcceleration ?? 0
    this.isLocalPlayer = initial.isLocalPlayer ?? false
    this.graphics = initial.graphics ?? null
    this.priority = initial.priority ?? 0
    this.transformBuffer = initial.transformBuffer ?? []
    this.inputBuffer = initial.inputBuffer ?? []
    this.localTransformBuffer = initial.localTransformBuffer ?? []
    this.triggerSize = initial.triggerSize ?? { x: 1, y: 1 }
    this.triggerShape = initial.triggerShape ?? "circle"
  }
}
