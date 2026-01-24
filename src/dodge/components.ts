import type { Component, Components } from '@emerald'

export interface PlayerSettings extends Component {
  radius: number
}

export interface FoeSettings extends Component {
  radius: number
  linearSpeed: number
  angularSpeed: number
}

export interface DodgeComponents extends Components {
  'foe-settings': FoeSettings
  'player-settings': PlayerSettings
}
