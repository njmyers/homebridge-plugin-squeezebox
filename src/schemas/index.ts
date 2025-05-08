import Ajv, { Schema } from 'ajv';
import {
  Player,
  PlayersResponse,
  PlayerStatus,
  PlayerStatusResponse,
  PlayerStatusEvent,
} from './player.js';
import { Favorite, FavoritesEvent, FavoritesResponse } from './favorites.js';
import { ChannelEvent, SubscriptionEvent } from './channel.js';
import * as T from './types/index.js';

export const Schemas = {
  Player,
  PlayersResponse,
  PlayerStatus,
  PlayerStatusResponse,
  PlayerStatusEvent,
  Favorite,
  FavoritesResponse,
  FavoritesEvent,
  SubscriptionEvent,
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
  Favorite: create<T.Favorite>(Favorite),
  FavoritesEvent: create<T.FavoritesEvent>(FavoritesEvent),
  FavoritesResponse: create<T.FavoritesResponse>(FavoritesResponse),
  SubscriptionEvent: create<T.SubscriptionEvent>(SubscriptionEvent),
  ChannelEvent: create<T.ChannelEvent>(ChannelEvent),
};
