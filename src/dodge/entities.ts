import { Graphics, Point, type PointData } from 'pixi.js'
import {
  type Stage,
  type VectorData,
  Collider,
  CollisionSensor,
  Entity,
  RigidBody,
  Screen,
} from '@emerald'
import type { DodgeComponents } from './components'
import { DodgeCollisionLayer, DodgeColor, type Face } from './types'

export function createPlayer(stage: Stage<DodgeComponents>) {
  stage
    .createSimpleEntity({
      tag: 'player',
      position: { x: Screen.width / 2, y: Screen.height / 2 },
      children: [new Graphics().circle(0, 0, 24).fill({ color: DodgeColor.PLAYER })],
    })
    .addComponent({
      'collision-sensor': new CollisionSensor(Collider.circle(24), {
        layer: DodgeCollisionLayer.PLAYER,
      }),
    })
}

export function createCoin(stage: Stage<DodgeComponents>) {
  const padding = 50
  stage
    .createSimpleEntity({
      tag: 'collectible',
      children: [new Graphics().circle(0, 0, 12).stroke({ color: DodgeColor.PLAYER, width: 2 })],
      position: {
        x: padding + Math.random() * (Screen.width - 2 * padding),
        y: padding + Math.random() * (Screen.height - 2 * padding),
      },
    })
    .addComponent({
      'collision-sensor': new CollisionSensor(Collider.circle(12), {
        layer: DodgeCollisionLayer.COLLECTIBLE,
      }),
    })
}

export function createFoe(stage: Stage<DodgeComponents>, edge: number) {
  const radius = 36
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
          .stroke({ color: DodgeColor.FOE, width: 4 }),
      ],
    })
    .addComponent({
      'rigid-body': new RigidBody(Collider.regularPolygon(radius, 3), {
        layer: DodgeCollisionLayer.FOE,
        isKinematic: true,
        initialPosition,
        initialRotation,
        friction: { dynamic: 0 },
        restitution: 0,
      }),
      'foe-settings': { radius, linearSpeed: 2, angularSpeed: 0.25 },
    })
}

export function createBullet(
  stage: Stage<DodgeComponents>,
  initialPosition: PointData,
  initialVelocity: VectorData,
): Entity<DodgeComponents> {
  return stage
    .createSimpleEntity({
      tag: 'bullet',
      rotation: Math.PI / 4,
      children: [new Graphics().circle(0, 0, 8).stroke({ color: DodgeColor.FOE, width: 4 })],
    })
    .addComponent({
      'rigid-body': new RigidBody(Collider.circle(8), {
        layer: DodgeCollisionLayer.BULLET,
        isKinematic: true,
        initialPosition,
        initialVelocity,
        restitution: 1,
        friction: { static: 0, dynamic: 0 },
      }),
    })
}

export function createBound(stage: Stage<DodgeComponents>, face: Face) {
  type Size = { w: number; h: number }

  const thickness = 100
  const [initialPosition, size] = ((): [PointData, Size] => {
    switch (face) {
      case 'top':
        return [
          new Point(Screen.width / 2, -thickness / 2),
          { w: Screen.width + thickness * 2, h: thickness },
        ]
      case 'right':
        return [
          new Point(Screen.width + thickness / 2, Screen.height / 2),
          { w: thickness, h: Screen.height },
        ]
      case 'bottom':
        return [
          new Point(Screen.width / 2, Screen.height + thickness / 2),
          { w: Screen.width + thickness * 2, h: thickness },
        ]
      case 'left':
        return [new Point(-thickness / 2, Screen.height / 2), { w: thickness, h: Screen.height }]
    }
  })()
  stage
    .createSimpleEntity({
      tag: 'bound',
      children: [
        new Graphics()
          .rect(initialPosition.x + -size.w / 2, initialPosition.y + -size.h / 2, size.w, size.h)
          .fill({ color: 0xffffff }),
      ],
    })
    .addComponent({
      'rigid-body': new RigidBody(Collider.rectangle(size.w, size.h), {
        isStatic: true,
        layer: DodgeCollisionLayer.BOUND,
        initialPosition,
        friction: { static: 0, dynamic: 0 },
        restitution: 1,
      }),
    })
}
