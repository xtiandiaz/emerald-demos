import { System, Vector, EMath } from '@emerald'
import { createCoin } from './entities'
import type { DodgeComponents } from './components'
import type { DodgeSignals } from './signals'

export const controlsSystem = new System<DodgeComponents, DodgeSignals>()
controlsSystem.init = (stage, _, input) => {
  const player = stage.getFirstEntityByTag('player')
  return [
    input.connectContainerEvent('pointermove', (e) => {
      player?.position.copyFrom(e.global)
    }),
  ]
}

export const spawningSystem = new System<DodgeComponents, DodgeSignals>()
spawningSystem.init = (stage, signals, _) => {
  return [
    signals.connect('item-collected', () => {
      createCoin(stage)
    }),
  ]
}

export const chasingSystem = new System<DodgeComponents, DodgeSignals>()
chasingSystem.fixedUpdate = (stage, _, dT) => {
  const player = stage.getFirstEntityByTag('player')
  if (!player) {
    return
  }
  const foes = stage.getEntitiesByTag('foe')
  let direction = new Vector()
  let rotationDir = 0
  let currentAngle = 0
  let targetAngle = 0

  for (const foe of foes) {
    const foeBody = foe.getComponent('rigid-body')!
    const foeSettings = foe.getComponent('foe-settings')!

    player.position.subtract(foeBody.position, direction).normalize(direction)
    currentAngle = foeBody.rotation
    targetAngle = Math.acos(direction.x)
    targetAngle = direction.y < 0 ? 2 * Math.PI - targetAngle : targetAngle
    let angleDiff = targetAngle - currentAngle
    if (Math.abs(angleDiff) > Math.PI) {
      if (targetAngle < currentAngle) {
        targetAngle += 2 * Math.PI
      } else {
        currentAngle += 2 * Math.PI
      }
    }
    angleDiff = targetAngle - currentAngle
    rotationDir = EMath.sign(angleDiff)

    foeBody.rotation += rotationDir * foeSettings.angularSpeed * dT

    foeBody.velocity.set(
      foeSettings.linearSpeed * Math.cos(foeBody.rotation),
      foeSettings.linearSpeed * Math.sin(foeBody.rotation),
    )
  }
}

export const interactionSystem = new System<DodgeComponents, DodgeSignals>()
interactionSystem.fixedUpdate = (stage, signals) => {
  const playerId = stage.getFirstEntityByTag('player')?.id
  if (!playerId) {
    return
  }
  const sensor = stage.getComponent('collision-sensor', playerId)
  sensor?.collidedIds.forEach((id) => {
    switch (stage.getEntityTag(id)) {
      case 'collectible':
        stage.removeEntity(id)
        signals.emit('item-collected', { points: 1 })
        break
      case 'foe':
        stage.removeEntity(playerId)
        console.log('Game over!')
        break
    }
  })
}

export const difficultySystem = new System<DodgeComponents, DodgeSignals>()
difficultySystem.init = (stage, signals) => {
  return [
    signals.connect('item-collected', (_) => {
      stage.getAllComponents('foe-settings').forEach((fs) => {
        fs.linearSpeed += 0.1
        fs.angularSpeed += 0.01
      })
    }),
  ]
}
