import Ajv, { Schema } from 'ajv';
import {
  Player,
  PlayersResponse,
  PlayerStatus,
  PlayerStatusResponse,
  PlayerStatusEvent,
  SubscriptionStatusEvent,
  ChannelEvent,
} from './player';
import * as T from './types';

export const Schemas = {
  Player,
  PlayersResponse,
  PlayerStatus,
  PlayerStatusResponse,
  PlayerStatusEvent,
  SubscriptionStatusEvent,
  ChannelEvent,
};

const ajv = new Ajv();
function create<T>(schema: Schema) {
  return { validate: ajv.compile<T>(schema) };
}

export const Validators = {
  Player: create<T.Player>(Player),
  PlayersResponse: create<T.PlayersResponse>(PlayersResponse),
  PlayerStatus: create<T.PlayerStatus>(PlayerStatus),
  PlayerStatusResponse: create<T.PlayerStatusResponse>(PlayerStatusResponse),
  PlayerStatusEvent: create<T.PlayerStatusEvent>(PlayerStatusEvent),
  SubscriptionStatusEvent: create<T.SubscriptionStatusEvent>(
    SubscriptionStatusEvent,
  ),
  ChannelEvent: create<T.ChannelEvent>(ChannelEvent),
};
