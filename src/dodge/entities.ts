import { Graphics, Point, type PointData } from 'pixi.js'
import {
  type Stage,
  type VectorData,
  Collider,
  Collision,
  Entity,
  RigidBody,
  Screen,
  Tweener,
} from '@emerald'
import type { DodgeComponents } from './components'
import { DodgeCollisionLayer, DodgeColor, type Face } from './types'
import { RayCast } from '@emerald/components/RayCast'

export function createPlayer(stage: Stage<DodgeComponents>) {
  const radius = 24

  stage
    .createSimpleEntity({
      tag: 'player',
      position: { x: Screen.width / 2, y: Screen.height / 2 },
      children: [new Graphics().circle(0, 0, radius).fill({ color: DodgeColor.PLAYER })],
    })
    .addComponents({
      'player-settings': { radius },
      collider: Collider.circle(radius, {
        layer: DodgeCollisionLayer.PLAYER,
      }),
      'ray-cast': new RayCast([
        'platform',
        Collision.ray(new Point(), new Point(0, 1), 200, DodgeCollisionLayer.BOUND),
      ]),
    })
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
      scale: { x: 0, y: 0 },
      children: [new Graphics().circle(0, 0, 12).stroke({ color: DodgeColor.PLAYER, width: 3 })],
      onInit: (container) => {
        Tweener.shared.to(container, { vars: { scale: 1 } })
      },
    })
    .addComponents({
      collider: Collider.circle(12, {
        layer: DodgeCollisionLayer.COLLECTIBLE,
      }),
    })
}

export function createFoe(stage: Stage<DodgeComponents>, edge: number) {
  const radius = 40
  const padding = -100
  const position: PointData = {
    x: edge % 2 == 0 ? Screen.width / 2 : edge % 4 == 1 ? Screen.width - padding : padding,
    y: edge % 2 == 0 ? (edge % 4 == 0 ? padding : Screen.height - padding) : Screen.height / 2,
  }
  const rotation = (((edge % 4) + 1) * Math.PI) / 2

  stage
    .createSimpleEntity({
      tag: 'foe',
      position,
      rotation,
      children: [
        new Graphics()
          .roundPoly(0, 0, radius, 3, 4, Math.PI / 2)
          .stroke({ color: DodgeColor.FOE, width: 4 })
          .fill({ color: DodgeColor.FOE, alpha: 0.25 }),
      ],
    })
    .addComponents({
      collider: Collider.regularPolygon(radius, 3, { layer: DodgeCollisionLayer.FOE }),
      'rigid-body': new RigidBody({
        isKinematic: true,
        friction: { dynamic: 0 },
        restitution: 0,
      }),
      'foe-settings': { radius, linearSpeed: 2, angularSpeed: 0.25 },
      'ray-cast': new RayCast([
        'platform',
        Collision.ray(new Point(), new Point(0, 1), 200, DodgeCollisionLayer.BOUND),
      ]),
    })
}

export function createBullet(
  stage: Stage<DodgeComponents>,
  position: PointData,
  velocity: VectorData,
): Entity<DodgeComponents> {
  return stage
    .createSimpleEntity({
      tag: 'bullet',
      position,
      rotation: Math.PI / 4,
      children: [new Graphics().circle(0, 0, 8).stroke({ color: DodgeColor.FOE, width: 4 })],
    })
    .addComponents({
      collider: Collider.circle(8, {
        layer: DodgeCollisionLayer.BULLET,
      }),
      'rigid-body': new RigidBody({
        isKinematic: true,
        initialVelocity: velocity,
        restitution: 1,
        friction: { static: 0, dynamic: 0 },
      }),
    })
}

export function createBound(stage: Stage<DodgeComponents>, face: Face) {
  type Size = { w: number; h: number }

  const thickness = 100
  const [position, size] = ((): [PointData, Size] => {
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
      position,
      children: [
        new Graphics()
          .rect(position.x + -size.w / 2, position.y + -size.h / 2, size.w, size.h)
          .fill({ color: 0xffffff }),
      ],
    })
    .addComponents({
      collider: Collider.rectangle(size.w, size.h, {
        layer: DodgeCollisionLayer.BOUND,
      }),
      'rigid-body': new RigidBody({
        isStatic: true,
        friction: { static: 0, dynamic: 0 },
        restitution: 1,
      }),
    })
}
