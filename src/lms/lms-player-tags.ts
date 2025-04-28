/**
 * Enum for LMS Player Tags.
 * These are the common tags used for player and track information.
 */
export enum LMSTag {
  /** Artist name */
  Artist = 'a',

  /** Duration in seconds */
  Duration = 'd',

  /** Album name */
  Album = 'l',

  /** Track number */
  TrackNumber = 'k',

  /** Track title (name) */
  TrackTitle = 'n',

  /** Player type (e.g., squeezebox, player) */
  PlayerType = 'p',

  /** Volume level (0-100 or other scale) */
  Volume = 'v',

  /** Playback mode (e.g., play, pause) */
  PlayMode = 'm',

  /** Track ID (unique identifier for a track) */
  TrackID = 'i',

  /** Player state (e.g., playing, paused, stopped) */
  PlayerState = 's',

  /** Genre (music type) */
  Genre = 't',

  /** Rating (e.g., number of stars) */
  Rating = 'r',

  /** URL for artwork or cover image */
  Url = 'u',

  /** Bitrate of the track */
  Bitrate = 'b',

  /** Player name */
  PlayerName = 'y',

  /** Date the track was added */
  DateAdded = 'z',

  /** Playlist name */
  PlaylistName = 'q',

  /** Index of the track in the playlist */
  PlaylistIndex = 'x',

  /** Custom field (this could be any custom tag set by the server) */
  CustomField = 'c',

  /** Custom ID field for the song */
  SongID = 'f',
}
