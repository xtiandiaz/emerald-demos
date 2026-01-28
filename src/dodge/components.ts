import type { Component, Components } from '@emerald'

export interface PlayerAttributes extends Component {
  radius: number
}

export interface FoeAttributes extends Component {
  radius: number
}
export interface FoeState extends Component {
  linearSpeed: number
  angularSpeed: number
  lastShotTimestamp: number
}

export interface DodgeComponents extends Components {
  'foe-attributes': FoeAttributes
  'foe-state': FoeState
  'player-attributes': PlayerAttributes
}
