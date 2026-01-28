import { Assets } from 'pixi.js'
import { Collision, PhysicsSystem, Scene } from '@emerald'
import type { DodgeComponents } from './components'
import { createBound, createCollectible, createFoe, createPlayer } from './entities'
import { DodgeSystems } from './systems'
import type { DodgeSignals } from './signals'
import { DodgeCollisionLayer, type Face } from './types'

const collisionLayerMap: Collision.LayerMap = new Map([
  [DodgeCollisionLayer.PLAYER, DodgeCollisionLayer.COLLECTIBLE],
  [DodgeCollisionLayer.FOE, DodgeCollisionLayer.PLAYER],
  [
    DodgeCollisionLayer.BULLET,
    DodgeCollisionLayer.PLAYER | DodgeCollisionLayer.BOUND | DodgeCollisionLayer.BULLET,
  ],
])

export namespace DodgeScenes {
  export class Main extends Scene<DodgeComponents, DodgeSignals> {
    constructor() {
      super([
        new PhysicsSystem({ iterations: 1, collisionLayerMap, debug: { rendersColliders: false } }),
        new DodgeSystems.PlayerControls(),
        new DodgeSystems.Spawning(),
        new DodgeSystems.Chasing(),
        new DodgeSystems.Shooting(),
        new DodgeSystems.Interaction(),
        new DodgeSystems.Difficulty(),
      ])
    }

    build(): void {
      Array<Face>('top', 'right', 'bottom', 'left').forEach((f) => createBound(this, f))

      createPlayer(this)
      createFoe(this, 2)

      for (let i = 0; i < 4; i++) {
        createCollectible(this)
      }
    }
  }
}
