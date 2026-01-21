import type { Signal, Signals } from '@emerald'

interface ItemCollected extends Signal {
  points: number
}

export interface DodgeSignals extends Signals {
  'item-collected': ItemCollected
}
