import { Graphics, type PointData } from 'pixi.js'
import { type Stage, Collider, CollisionSensor, RigidBody, Screen } from '@emerald'
import type { DodgeComponents } from './components'
import { DodgeCollisionLayer } from './types'

export function createPlayer(stage: Stage<DodgeComponents>) {
  stage
    .createSimpleEntity({
      tag: 'player',
      position: { x: Screen.width / 2, y: Screen.height / 2 },
      children: [new Graphics().circle(0, 0, 25).fill({ color: 0xffffff })],
    })
    .addComponent([
      'collision-sensor',
      new CollisionSensor(Collider.circle(25), { layer: DodgeCollisionLayer.PLAYER }),
    ])
}

export function createCoin(stage: Stage<DodgeComponents>) {
  const padding = 50
  stage
    .createSimpleEntity({
      tag: 'collectible',
      position: {
        x: padding + Math.random() * (Screen.width - 2 * padding),
        y: padding + Math.random() * (Screen.height - 2 * padding),
      },
      children: [new Graphics().circle(0, 0, 12).stroke({ color: 0xffffff, width: 2 })],
    })
    .addComponent([
      'collision-sensor',
      new CollisionSensor(Collider.circle(12), { layer: DodgeCollisionLayer.COLLECTIBLE }),
    ])
}

export function createFoe(stage: Stage<DodgeComponents>, edge: number) {
  const radius = 35
  const padding = -100
  const initialPosition: PointData = {
    x: edge % 2 == 0 ? Screen.width / 2 : edge % 4 == 1 ? Screen.width - padding : padding,
    y: edge % 2 == 0 ? (edge % 4 == 0 ? padding : Screen.height - padding) : Screen.height / 2,
  }
  const initialRotation = (((edge % 4) + 1) * Math.PI) / 2

  stage
    .createSimpleEntity({
      tag: 'foe',
      children: [
        new Graphics()
          .regularPoly(0, 0, radius, 3, Math.PI / 2)
          .stroke({ color: 0xff0088, width: 4 }),
      ],
    })
    .addComponent(
      [
        'rigid-body',
        new RigidBody(Collider.regularPolygon(radius, 3), {
          layer: DodgeCollisionLayer.FOE,
          isKinematic: true,
          initialPosition,
          initialRotation,
          friction: { dynamic: 0 },
          restitution: 0,
        }),
      ],
      ['foe-settings', { linearSpeed: 2, angularSpeed: 0.25 }],
    )
}

// function createLimits(stage: Stage<DemoComponents>) {
//   const padding = -100
//   stage
//     .createSimpleEntity({
//       tag: 'limit',
//       position: { x: Screen.width - padding, y: Screen.height / 2 },
//     })
//     .addComponent([
//       'collision-sensor',
//       new CollisionSensor(Collider.rectangle(100, Screen.height - padding * 2)),
//     ])
// }
