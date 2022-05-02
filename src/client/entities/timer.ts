import { BASE_RESOLUTION } from './../config';
import { Container, Text } from 'pixi.js';
import { ECS } from '../../core/ecs';
import { EntityType } from '../../core/entity';
import { COLOR_SCHEME } from '../config';
import { ComponentTypes, IEntityData } from './../../core/components';

export function createGameTimer(parent: Container, ecs: ECS, initial: Partial<IEntityData>) {
  const timerWrapper = new Container();

  const timerGraphics = new Text('0', {
    fontFamily: 'Arial',
    fill: COLOR_SCHEME.pickup,
    align: 'center',
    fontSize: 48,
    fontWeight: 'bold',
  })

  timerGraphics.name = 'timerDisplay'
  timerGraphics.pivot.y = 0.5
  timerGraphics.zIndex = 1
  timerGraphics.position.x = BASE_RESOLUTION.x / 2

  timerWrapper.addChild(timerGraphics)
  parent.addChild(timerWrapper)

  return ecs.createNewEntity(
    EntityType.GameTimer,
    {
      ...initial,
      graphics: timerGraphics,
    },
    [
      ComponentTypes.Timer,
      ComponentTypes.Graphics
    ]
  )
}