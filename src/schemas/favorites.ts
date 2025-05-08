import { EventData } from './event.js';

export const Favorite = {
  title: 'Favorite',
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      description: 'ID of the favorite item',
    },
    name: {
      type: 'string',
      description: 'Name of the favorite item',
    },
    type: {
      type: 'string',
      description: 'Type of the favorite item',
    },
    image: {
      type: 'string',
      description: 'Image URL of the favorite item',
    },
    isaudio: {
      type: 'number',
      description: 'Audio status of the favorite item',
    },
    hasitems: {
      type: 'number',
      description: 'Items status of the favorite item',
    },
  },
  required: ['id', 'name', 'image', 'isaudio', 'hasitems'],
} as const;

export const Favorites = {
  title: 'Favorites',
  type: 'object',
  description: 'Collection of favorites',
  additionalProperties: false,
  properties: {
    count: {
      type: 'number',
      description: 'Number of favorites',
    },
    title: {
      type: 'string',
      description: 'Title of the favorites list',
    },
    loop_loop: {
      type: 'array',
      description: 'Array of favorite items',
      items: Favorite,
    },
  },
  required: ['count', 'title', 'loop_loop'],
};

export const FavoritesResponse = {
  title: 'FavoritesResponse',
  type: 'object',
  additionalProperties: false,
  properties: {
    method: {
      type: 'string',
      description: 'Method name',
    },
    result: {
      oneOf: [Favorites],
    },
  },
  required: ['result', 'method'],
} as const;

export const FavoritesEvent = {
  title: 'FavoritesEvent',
  type: 'object',
  allOf: [
    EventData,
    {
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          oneOf: [Favorites],
        },
      },
    },
  ],
} as const;
