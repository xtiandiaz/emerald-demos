import { Collision, CollisionSensorSystem, Game, PhysicsSystem, Scene } from '@emerald'
import type { DodgeComponents } from './components'
import { createPlayer, createCoin, createFoe } from './entities'
import {
  chasingSystem,
  controlsSystem,
  difficultySystem,
  interactionSystem,
  spawningSystem,
} from './systems'
import type { DodgeSignals } from './signals'
import { DodgeCollisionLayer } from './types'

const collisionLayerMap: Collision.LayerMap = new Map([
  [DodgeCollisionLayer.PLAYER, DodgeCollisionLayer.COLLECTIBLE],
  [DodgeCollisionLayer.FOE, DodgeCollisionLayer.PLAYER],
])

const scene = new Scene<DodgeComponents, DodgeSignals>('main', [
  new PhysicsSystem({ collisionLayerMap }),
  new CollisionSensorSystem({ collisionLayerMap }),
  controlsSystem,
  spawningSystem,
  interactionSystem,
  chasingSystem,
  difficultySystem,
])
scene.build = (stage) => {
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
