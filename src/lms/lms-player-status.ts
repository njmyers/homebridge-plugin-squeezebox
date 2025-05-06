import { PlayerStatus } from '../schemas/types/index.js';

export class LMSPlayerStatus {
  volume: number;
  active: 0 | 1;
  mute: 0 | 1;
  mode: string;

  constructor(data: PlayerStatus) {
    if (!LMSPlayerStatus.isZeroOrOne(data.power)) {
      throw new Error('Invalid power value');
    }

    this.volume = Math.max(0, data['mixer volume']);
    this.mute = this.volume > 0 ? 0 : 1;
    this.active = data.power;
    this.mode = data.mode;
  }

  private static isZeroOrOne(value: number): value is 0 | 1 {
    return value === 0 || value === 1;
  }
}
