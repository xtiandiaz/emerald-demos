import type { FederatedPointerEvent, Point } from 'pixi.js'
import {
  type Disconnectable,
  System,
  Vector,
  Screen,
  Stage,
  Entity,
  Collision,
  EMath,
} from '@emerald'
import { createBullet, createCollectible } from './entities'
import type { DodgeComponents } from './components'
import type { DodgeSignals } from './signals'
import { DodgeCollisionLayer } from './types'

export namespace DodgeSystems {
  const DodgeSystem = System<DodgeComponents, DodgeSignals>

  interface PlayerControlState {
    playerStartPos: Point
    playerTargetPos: Point
    controlStartPoint?: Point
  }
  export class PlayerControls extends DodgeSystem {
    private state?: PlayerControlState

    init(
      stage: Stage<DodgeComponents>,
      toolkit: System.InitToolkit<DodgeSignals>,
    ): Disconnectable[] {
      const player = () => stage.getFirstEntityByTag('player')
      return [
        toolkit.input.connectContainerEvent('pointerdown', (e) =>
          this.handlePointerInput(e, player()),
        ),
        toolkit.input.connectContainerEvent('globalpointermove', (e) =>
          this.handlePointerInput(e, player()),
        ),
        toolkit.input.connectContainerEvent('pointerup', (e) =>
          this.handlePointerInput(e, player()),
        ),
      ]
    }

    update(stage: Stage<DodgeComponents>): void {
      const player = stage.getFirstEntityByTag('player')
      if (!this.state || !player) {
        return
      }
      const nextPos = player.position.add(
        this.state.playerTargetPos.subtract(player).divideByScalar(4),
      )
      const padding = player.getComponent('player-attributes')!.radius
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

  export class Spawning extends DodgeSystem {
    init(
      stage: Stage<DodgeComponents>,
      toolkit: System.InitToolkit<DodgeSignals>,
    ): Disconnectable[] {
      return [
        toolkit.signals.connect('item-collected', () => {
          createCollectible(stage)
        }),
      ]
    }
  }

  export class Chasing extends DodgeSystem {
    fixedUpdate(
      stage: Stage<DodgeComponents>,
      toolkit: System.UpdateToolkit<DodgeSignals>,
      dT: number,
    ): void {
      const player = stage.getFirstEntityByTag('player')
      if (!player) {
        return
      }
      const foes = stage.getEntitiesByTag('foe')
      let direction = new Vector()
      let rotationDir = 0
      let currentAngle = 0
      let targetAngle = 0
      let angleDiff = 0

      for (const foe of foes) {
        const foeBody = foe.getComponent('rigid-body')!
        const foeState = foe.getComponent('foe-state')!

        player.position.subtract(foeBody.position, direction).normalize(direction)
        currentAngle = foeBody.rotation
        targetAngle = Math.acos(direction.x)
        if (direction.y < 0) {
          targetAngle = 2 * Math.PI - targetAngle
        }
        angleDiff = targetAngle - currentAngle
        if (Math.abs(angleDiff) > Math.PI) {
          angleDiff += (targetAngle < currentAngle ? 1 : -1) * 2 * Math.PI
        }
        rotationDir = EMath.sign(angleDiff)

        foeBody.rotation += rotationDir * foeState.angularSpeed * dT

        foeBody.velocity.set(
          foeState.linearSpeed * Math.cos(foeBody.rotation),
          foeState.linearSpeed * Math.sin(foeBody.rotation),
        )
      }
    }
  }

  export class Shooting extends DodgeSystem {
    fixedUpdate(
      stage: Stage<DodgeComponents>,
      toolkit: System.UpdateToolkit<DodgeSignals>,
      dT: number,
    ): void {
      const foe = stage.getFirstEntityByTag('foe')
      if (!foe) {
        return
      }
      const now = Date.now()
      const state = foe.getComponent('foe-state')!
      if (now - state.lastShotTimestamp < 5000) {
        return
      }
      const body = foe.getComponent('rigid-body')!
      const ray = Collision.ray(
        foe.position,
        body.direction,
        Screen.width * 0.5,
        DodgeCollisionLayer.PLAYER,
      )
      const radius = foe.getComponent('foe-attributes')!.radius
      if (toolkit.rayCaster.cast(ray)) {
        createBullet(
          stage,
          foe.position.add(body.direction.multiplyScalar(radius)),
          body.velocity.multiplyScalar(1.5),
        )
        state.lastShotTimestamp = now
      }
    }
  }

  export class Interaction extends DodgeSystem {
    fixedUpdate(
      stage: Stage<DodgeComponents>,
      toolkit: System.UpdateToolkit<DodgeSignals>,
      dT: number,
    ): void {
      const playerId = stage.getFirstEntityByTag('player')?.id
      if (!playerId) {
        return
      }
      const sensor = stage.getComponent('collider', playerId)
      sensor?.contacts.forEach((_, colliderId) => {
        switch (stage.getEntityTag(colliderId)) {
          case 'collectible':
            stage.removeEntity(colliderId)
            toolkit.signals.emit('item-collected', { points: 1 })
            break
          case 'foe':
          case 'bullet':
            stage.removeEntity(playerId)
            break
        }
      })
    }
  }

  export class Difficulty extends DodgeSystem {
    init(
      stage: Stage<DodgeComponents>,
      toolkit: System.InitToolkit<DodgeSignals>,
    ): Disconnectable[] {
      return [
        toolkit.signals.connect('item-collected', (_) => {
          stage.getComponents('foe-state').forEach((fs) => {
            fs.linearSpeed += 0.1
            fs.angularSpeed += 0.01
          })
        }),
      ]
    }
  }
}
