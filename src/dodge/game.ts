import { type Collision, CollisionSensorSystem, Game, PhysicsSystem, Scene } from '@emerald'
import type { DodgeComponents } from './components'
import { createPlayer, createCoin, createFoe, createBound } from './entities'
import {
  chasingSystem,
  controlsSystem,
  difficultySystem,
  shootingSystem,
  spawningSystem,
  interactionSystem,
} from './systems'
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

const scene = new Scene<DodgeComponents, DodgeSignals>('main', [
  new PhysicsSystem({ collisionLayerMap, debug: { rendersCollisions: false } }),
  new CollisionSensorSystem({ collisionLayerMap }),
  controlsSystem,
  spawningSystem,
  chasingSystem,
  shootingSystem,
  interactionSystem,
  difficultySystem,
])
scene.build = (stage) => {
  Array<Face>('top', 'right', 'bottom', 'left').forEach((f) => createBound(stage, f))

  createPlayer(stage)

  for (const _ of new Array(3)) {
    createCoin(stage)
  }

  createFoe(stage, 2)
}

const scoreDiv = document.getElementById('score')!

const game = new Game({ isPaused: false, score: 0 }, [scene])
game.connect = (signals, state) => {
  return [
    signals.connect('item-collected', (s) => {
      state.score += s.points
      scoreDiv.innerText = state.score.toString()
    }),
  ]
}

export default game
