import { ComponentTypes, EntityData, IComponent, IEntityData } from './components'
import { EntityType, IEntity } from './entity'
import { ISystem } from './systems'

export interface IECS {
  entities: (IEntity | null)[]
  entityData: (IEntityData | null)[]
  systems: ISystem[]
  entityCount: number

  createNewEntity(type: EntityType, initial: Partial<IComponent>, enabledComponents: ComponentTypes[]): IEntity,
  destroyEntity(entity: IEntity): void,
  hasComponent(entity: IEntity, component: ComponentTypes): boolean,
  getComponent<T = IEntityData>(entity: IEntity, component: ComponentTypes): T | undefined,
  enableComponent(entity: IEntity, component: ComponentTypes): IEntity,
  disableComponent(entity: IEntity, component: ComponentTypes): IEntity,
}

export class ECS implements IECS {
  entities: (IEntity | null)[]
  entityData: (IEntityData | null)[]
  systems: ISystem[]

  private freedEntityIds: number[]
  private _entityCount;

  constructor(...systems: ISystem[]) {
    this.entities = []
    this.entityData = []
    this.systems = systems ?? []
    this.freedEntityIds = []

    this._entityCount = 0
  }

  createNewEntity(type: EntityType, initial: Partial<IEntityData> = {}, enabledComponents: ComponentTypes[]): IEntity {
    // find entity id
    const id = (this.freedEntityIds.length > 0)
      ? this.freedEntityIds.pop()
      : this.entities.length

    if (id === undefined) {
      throw new Error('No more entities available')
    }

    // create entity and component data
    const entity: IEntity = {
      id: id,
      componentMask: 0,
      type
    }
    const component = new EntityData(initial)

    // enable components masks
    for (const componentType of enabledComponents) {
      this.enableComponent(entity, componentType)
    }

    // add entity and component to arrays
    this.entities[entity.id] = entity
    this.entityData[entity.id] = component

    // increment entity count
    this._entityCount++

    // return reference to id
    return entity
  }

  destroyEntity(entity: IEntity) {
    const index = this.entities.indexOf(entity)
    if (index == -1) {
      throw new Error('Entity not found')
    }

    return this.destroyEntityById(index)
  }

  destroyEntityById(id: number) {
    if (id > this.entities.length - 1) {
      throw new Error('Entity not found. Id out of range')
    }

    this.entities[id] = null
    this.entityData[id] = null
    this.freedEntityIds.push(id)
    this._entityCount--

    return id
  }

  hasComponent(entity: IEntity, component: ComponentTypes): boolean {
    return (entity.componentMask & component) === component
  }

  getComponent<T extends IComponent>(entity: IEntity, component: ComponentTypes): T | undefined {
    if (this.hasComponent(entity, component)) {
      return this.entityData[entity.id] as unknown as T
    }

    return undefined
  }

  enableComponent(entity: IEntity, component: ComponentTypes): IEntity {
    entity.componentMask |= component
    return entity
  }

  disableComponent(entity: IEntity, component: ComponentTypes): IEntity {
    entity.componentMask &= ~component
    return entity
  }

  isEntityIdFree(id: number): boolean {
    return this.entities[id] === null || this.entities[id] === undefined
  }
  
  update(dt: number) {
    for(const system of this.systems) {
      system.preUpdate(this, dt)
    }

    for (const system of this.systems) {
      for (const entity of this.entities) {
        if (entity === undefined || entity === null) {
          continue
        }

        system.update(this, dt, entity)
      }
    }

    for (const system of this.systems) {
      system.postUpdate(this, dt)
    }
  }

  public get entityCount(): number {
    return this._entityCount
  }
}
