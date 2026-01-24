import {
  System,
  Vector,
  EMath,
  Screen,
  ConnectableUtils,
  Input,
  Stage,
  type Disconnectable,
  type Signals,
  Entity,
} from '@emerald'
import { createBullet, createCoin } from './entities'
import type { DodgeComponents } from './components'
import type { DodgeSignals } from './signals'
import type { FederatedPointerEvent, Point } from 'pixi.js'

interface PlayerControlState {
  playerStartPos: Point
  playerTargetPos: Point
  controlStartPoint?: Point
}
export class PlayerControlsSystem extends System<DodgeComponents, DodgeSignals> {
  private state?: PlayerControlState

  init(
    stage: Stage<DodgeComponents>,
    signals: Signals.Bus<DodgeSignals>,
    input: Input.Provider,
  ): Disconnectable[] {
    const player = () => stage.getFirstEntityByTag('player')
    return [
      input.connectContainerEvent('pointerdown', (e) => this.handlePointerInput(e, player())),
      input.connectContainerEvent('globalpointermove', (e) => this.handlePointerInput(e, player())),
      input.connectContainerEvent('pointerup', (e) => this.handlePointerInput(e, player())),
    ]
  }

  update(stage: Stage<DodgeComponents>, signals: Signals.Emitter<DodgeSignals>, dT: number): void {
    const player = stage.getFirstEntityByTag('player')
    if (!this.state || !player) {
      return
    }
    const nextPos = player.position.add(
      this.state.playerTargetPos.subtract(player).divideByScalar(4),
    )
    const padding = player.getComponent('player-settings')!.radius
    // TODO make rectangle and inset by radius of player
    nextPos.x = EMath.clamp(nextPos.x, padding, Screen.width - padding)
    nextPos.y = EMath.clamp(nextPos.y, padding, Screen.height - padding)

    player.position.copyFrom(nextPos)
  }

  private handlePointerInput(e: FederatedPointerEvent, player?: Entity<DodgeComponents>) {
    if (!player) {
      return
    }
    switch (e.type) {
      case 'pointerdown':
        this.state = {
          controlStartPoint: e.global.clone(),
          playerStartPos: player.position.clone(),
          playerTargetPos: player.position.clone(),
        }
        break
      case 'pointermove':
        if (!this.state?.controlStartPoint) {
          break
        }
        const dPos = e.global.subtract(this.state.controlStartPoint).multiplyScalar(3)
        const tPos = this.state.playerStartPos.add(dPos)
        if (tPos.x <= 0 || tPos.x >= Screen.width) {
          this.state.controlStartPoint!.x = e.globalX
          this.state.playerStartPos.x = EMath.clamp(tPos.x, 0, Screen.width)
        }
        if (tPos.y <= 0 || tPos.y >= Screen.height) {
          this.state.controlStartPoint!.y = e.globalY
          this.state.playerStartPos.y = EMath.clamp(tPos.y, 0, Screen.height)
        }
        this.state.playerTargetPos.set(tPos.x, tPos.y)
        break
      case 'pointerup':
        this.state!.controlStartPoint = undefined
        break
    }
  }
}

export const controlsSystem = new System<DodgeComponents, DodgeSignals>()
controlsSystem.init = (stage, _, input) => {
  return [
    input.connectContainerEvent('pointermove', (e) => {
      stage.getFirstEntityByTag('player')?.position.copyFrom(e.global)
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

export const interactionSystem = new System<DodgeComponents, DodgeSignals>()
interactionSystem.fixedUpdate = (stage, signals) => {
  const playerId = stage.getFirstEntityByTag('player')?.id
  if (!playerId) {
    return
  }
  const sensor = stage.getComponent('collider', playerId)
  sensor?.contacts.forEach((_, colliderId) => {
    switch (stage.getEntityTag(colliderId)) {
      case 'collectible':
        stage.removeEntity(colliderId)
        signals.emit('item-collected', { points: 1 })
        break
      case 'foe':
      case 'bullet':
        stage.removeEntity(playerId)
        console.log('Game over!')
        break
    }
  })
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

export const shootingSystem = new System<DodgeComponents, DodgeSignals>()
shootingSystem.init = (stage) => {
  return [
    ConnectableUtils.timer(5000, true, () => {
      if (!stage.hasEntitiesByTag('player')) return

      const foe = stage.getFirstEntityByTag('foe')
      if (!foe) return

      const settings = foe.getComponent('foe-settings')!
      const body = foe.getComponent('rigid-body')!

      createBullet(
        stage,
        foe.position.add(body.direction.multiplyScalar(settings.radius)),
        body.velocity.multiplyScalar(1.5).clampMagnitude(10),
      )
    }),
  ]
}

export const difficultySystem = new System<DodgeComponents, DodgeSignals>()
difficultySystem.init = (stage, signals) => {
  return [
    signals.connect('item-collected', (_) => {
      stage.getComponents('foe-settings').forEach((fs) => {
        fs.linearSpeed += 0.1
        fs.angularSpeed += 0.01
      })
    }),
  ]
}
