import { FavoritesEvent } from './favorites.js';
import { PlayerStatusEvent } from './player.js';

export const SubscriptionSuccessEvent = {
  title: 'SubscriptionSuccessEvent',
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

export const SubscriptionFailureEvent = {
  title: 'SubscriptionFailureEvent',
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
    error: {
      type: 'string',
      description: 'The reason why the subscription failed',
    },
  },
  required: ['successful', 'channel', 'id', 'error'],
} as const;

export const SubscriptionEvent = {
  title: 'SubscriptionEvent',
  type: 'object',
  oneOf: [SubscriptionSuccessEvent, SubscriptionFailureEvent],
};

export const ChannelEvent = {
  title: 'ChannelEvent',
  oneOf: [PlayerStatusEvent, FavoritesEvent, SubscriptionEvent],
};
