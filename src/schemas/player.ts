export const Player = {
  title: 'Player',
  type: 'object',
  additionalProperties: false,
  properties: {
    connected: {
      type: 'number',
      description: 'Connection status',
    },
    power: {
      type: 'number',
      description: 'Power status',
    },
    canpoweroff: {
      type: 'number',
      description: 'Can power off',
    },
    displaytype: {
      type: 'string',
      description: 'Display type',
    },
    firmware: {
      anyOf: [{ type: 'number' }, { type: 'string' }],
      description: 'Firmware version',
    },
    uuid: {
      anyOf: [{ type: 'null' }, { type: 'string' }],
      description: 'UUID',
    },
    seq_no: {
      type: 'number',
      description: 'Sequence number',
    },
    isplaying: {
      type: 'number',
      description: 'Is playing status',
    },
    playerindex: {
      anyOf: [{ type: 'number' }, { type: 'string' }],
      description: 'Player index',
    },
    playerid: {
      type: 'string',
      description: 'Player ID',
    },
    model: {
      type: 'string',
      description: 'Model',
    },
    ip: {
      type: 'string',
      description: 'IP address',
    },
    isplayer: {
      type: 'number',
      description: 'Is player status',
    },
    name: {
      type: 'string',
      description: 'Player name',
    },
    modelname: {
      type: 'string',
      description: 'Model name',
    },
  },
  required: [
    'connected',
    'power',
    'canpoweroff',
    'displaytype',
    'firmware',
    'uuid',
    'seq_no',
    'isplaying',
    'playerindex',
    'playerid',
    'model',
    'ip',
    'isplayer',
    'name',
    'modelname',
  ],
} as const;

export const PlayersResponse = {
  title: 'PlayersResponse',
  type: 'object',
  properties: {
    method: {
      type: 'string',
      description: 'Method name',
    },
    result: {
      type: 'object',
      description: 'Players result response object',
      additionalProperties: false,
      properties: {
        count: {
          type: 'number',
          description: 'Number of players',
        },
        players_loop: {
          type: 'array',
          description: 'Array of players',
          items: Player,
        },
      },
      required: ['count', 'players_loop'],
    },
  },
  required: ['result', 'method'],
} as const;

export const Playlist = {
  title: 'Playlist',
  type: 'object',
  additionalProperties: false,
  properties: {
    'playlist index': {
      type: 'number',
      description: 'Playlist index',
    },
    'title': {
      type: 'string',
      description: 'Title of the playlist item',
    },
    'id': {
      type: 'string',
      description: 'ID of the playlist item',
    },
  },
  required: ['playlist index', 'title', 'id'],
} as const;

export const PlayerStatus = {
  title: 'PlayerStatus',
  type: 'object',
  additionalProperties: true,
  properties: {
    'playlist_tracks': {
      type: 'number',
      description: 'Number of tracks in the playlist',
    },
    'playlist repeat': {
      type: 'number',
      description: 'Playlist repeat status',
    },
    'power': {
      type: 'number',
      description: 'Power status',
    },
    'playlist shuffle': {
      type: 'number',
      description: 'Playlist shuffle status',
    },
    'time': {
      type: 'number',
      description: 'Current time in the track',
    },
    'player_name': {
      type: 'string',
      description: 'Player name',
    },
    'playlist mode': {
      type: 'string',
      description: 'Playlist mode',
    },
    'signalstrength': {
      type: 'number',
      description: 'Signal strength',
    },
    'digital_volume_control': {
      type: 'number',
      description: 'Digital volume control status',
    },
    'rate': {
      type: 'number',
      description: 'Rate of playback',
    },
    'remoteMeta': {
      type: 'object',
      description: 'Metadata of the remote source',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
          description: 'ID of the remote source',
        },
        title: {
          type: 'string',
          description: 'Title of the remote source',
        },
      },
      required: ['id', 'title'],
    },
    'playlist_loop': {
      type: 'array',
      description: 'Array of playlists',
      items: Playlist,
    },
    'can_seek': {
      type: 'number',
      description: 'Can seek status',
    },
    'randomplay': {
      type: 'number',
      description: 'Random play status',
    },
    'playlist_cur_index': {
      anyOf: [{ type: 'number' }, { type: 'string' }],
      description: 'Current index of the playlist',
    },
    'mode': {
      type: 'string',
      description: 'Playback mode',
    },
    'playlist_timestamp': {
      type: 'number',
      description: 'Timestamp of the playlist',
    },
    'current_title': {
      type: 'string',
      description: 'Current title of the track',
    },
    'use_volume_control': {
      type: 'number',
      description: 'Use volume control status',
    },
    'seq_no': {
      type: 'number',
      description: 'Sequence number',
    },
    'mixer volume': {
      type: 'number',
      description: 'Mixer volume level',
    },
    'player_connected': {
      type: 'number',
      description: 'Player connection status',
    },
    'remote': {
      type: 'number',
      description: 'Remote status',
    },
    'player_ip': {
      type: 'string',
      description: 'IP address of the player',
    },
    'playlist_repeat': {
      type: 'number',
      description: 'Playlist repeat status',
    },
    'duration': {
      type: 'number',
      description: 'Duration of the track',
    },
    'replay_gain': {
      type: 'string',
      description: 'Replay gain status',
    },
  },
} as const;

export const PlayerStatusResponse = {
  title: 'PlayerStatusResponse',
  type: 'object',
  properties: {
    method: {
      type: 'string',
      description: 'Method name',
    },
    result: {
      description: 'Player status response object',
      additionalProperties: false,
      type: 'object',
      oneOf: [PlayerStatus],
    },
  },
  required: ['result', 'method'],
} as const;

export const PlayerStatusEvent = {
  title: 'PlayerStatusEvent',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'Player ID',
    },
    channel: {
      type: 'string',
      description: 'Channel name',
    },
    ext: {
      type: 'object',
      description: 'Extension data',
      properties: {
        priority: {
          type: 'string',
          description: 'Currently unknown what this field means',
        },
      },
    },
    data: {
      description: 'Player status event object',
      additionalProperties: false,
      type: 'object',
      oneOf: [PlayerStatus],
    },
  },
  required: ['data'],
} as const;

export const SubscriptionStatusEvent = {
  title: 'SubscriptionStatusEvent',
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
  oneOf: [PlayerStatusEvent, SubscriptionStatusEvent],
};
