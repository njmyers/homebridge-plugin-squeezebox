import { LMSPlayerStatus } from '../lms/index.js';

export interface StatusSubscriber {
  update(message: LMSPlayerStatus): void;
}
