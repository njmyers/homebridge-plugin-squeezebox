/**
 * Enum for LMS Commands.
 * These are the common commands used to interact with the player.
 */
export enum LMSCommands {
  /** Get the status of the player */
  Status = 'status',

  Players = 'players',

  /** Play the current track */
  Play = 'play',

  /** Pause the current track */
  Pause = 'pause',

  /** Stop the current track */
  Stop = 'stop',

  /** Skip to the next track in the playlist */
  Next = 'next',

  /** Skip to the previous track in the playlist */
  Previous = 'previous',

  /** Set the volume level */
  Volume = 'volume',

  /** Mute the player */
  Mute = 'mute',

  /** Unmute the player */
  Unmute = 'unmute',

  /** Seek to a specific time in the current track */
  Seek = 'seek',

  /** Add a track to the playlist */
  AddToPlaylist = 'addto_playlist',

  /** Remove a track from the playlist */
  RemoveFromPlaylist = 'remove_from_playlist',

  /** Get the playlist from the player */
  Playlist = 'playlist',

  /** Clear the current playlist */
  ClearPlaylist = 'clear_playlist',

  /** Shuffle the playlist */
  Shuffle = 'shuffle',

  /** Repeat the playlist */
  Repeat = 'repeat',

  /** Set the player mode (e.g., play, pause) */
  Mode = 'mode',

  /** Change the player's current track or playlist position */
  Position = 'position',

  /** Get or set the player's current track info */
  TrackInfo = 'trackinfo',

  /** Add a player to a group */
  AddToGroup = 'add_to_group',

  /** Remove a player from a group */
  RemoveFromGroup = 'remove_from_group',

  /** Set a custom volume for a group of players */
  GroupVolume = 'group_volume',

  /** Set the player to an idle state */
  Idle = 'idle',

  /** Restart the player */
  Restart = 'restart',

  /** Set the delay (in seconds) before the player goes into sleep mode after the track finishes */
  JiveEndOfTrackSleep = 'jiveendoftracksleep',
}
