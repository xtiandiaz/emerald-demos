import { Game, type Disconnectable, type Signals } from '@emerald'
import type { DodgeComponents } from './components'
import type { DodgeSignals } from './signals'

export interface DodgeState extends Game.State {
  isOver: boolean
  score: number
  bestScore?: number
}

export class Dodge extends Game<DodgeComponents, DodgeSignals, DodgeState> {
  connect(signals: Signals.Bus<DodgeSignals>, state: DodgeState): Disconnectable[] {
    return [
      signals.connect('item-collected', (s) => {
        state.score += s.points
      }),
      signals.connect('entity-removed', (s) => {
        state.isOver = s.tag == 'player'
      }),
    ]
  }
}
