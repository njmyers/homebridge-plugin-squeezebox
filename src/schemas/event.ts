export const EventData = {
  title: 'EventData',
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
  },
} as const;
