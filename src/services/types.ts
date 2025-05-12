import { LMSPlayerStatus } from '../lms/index.js';
import { FavoritesEvent, SubscriptionEvent } from '../schemas/types/index.js';

export enum EventName {
  Status = 'status',
  Favorites = 'favorites',
  Subscription = 'subscription',
}

export type Event<N extends EventName, T> = {
  name: N;
  message: T;
};

export type Events =
  | Event<EventName.Status, LMSPlayerStatus>
  | Event<EventName.Favorites, FavoritesEvent>
  | Event<EventName.Subscription, SubscriptionEvent>;

export interface Subscriber {
  on(event: Events): void;
}
