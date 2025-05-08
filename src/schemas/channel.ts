import { FavoritesEvent } from './favorites.js';
import { PlayerStatusEvent } from './player.js';

export const SubscriptionEvent = {
  title: 'SubscriptionEvent',
  type: 'object',
  properties: {
    successful: {
      type: 'boolean',
      description: 'Subscription status',
    },
    channel: {
      type: 'string',
      description: 'Channel name',
    },
    id: {
      type: 'string',
      description: 'ID of the subscription',
    },
    clientId: {
      type: 'string',
      description: 'Client ID',
    },
  },
  required: ['successful', 'channel', 'id', 'clientId'],
} as const;

export const ChannelEvent = {
  title: 'ChannelEvent',
  oneOf: [PlayerStatusEvent, FavoritesEvent, SubscriptionEvent],
};
