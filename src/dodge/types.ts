export type Face = 'top' | 'right' | 'bottom' | 'left'

export enum DodgeCollisionLayer {
  PLAYER = 1 << 0,
  COLLECTIBLE = 1 << 1,
  FOE = 1 << 2,
  BULLET = 1 << 3,
  BOUND = 1 << 4,
}

export enum DodgeColor {
  PLAYER = 0xffffff,
  FOE = 0xff0055,
}
