import { LMSPlayerStatus } from '../lms/index.js';
import { FavoritesEvent, SubscriptionEvent } from '../schemas/types/index.js';

export interface StatusSubscriber {
  status?: (message: LMSPlayerStatus) => void;
  favorites?: (message: FavoritesEvent) => void;
  subscription?: (message: SubscriptionEvent) => void;
}
