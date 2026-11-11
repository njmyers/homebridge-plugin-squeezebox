# homebridge-plugin-squeezebox

A [Homebridge](https://homebridge.io) plugin that brings Squeezebox players into Apple HomeKit through [Lyrion Music Server](https://lyrion.org) (formerly Logitech Media Server, LMS).

Point the plugin at one or more LMS servers and it discovers every player on each one. Each player appears in the Home app as a TV-style speaker accessory with:

- **Power** on and off
- **Volume and mute**, adjustable from the Apple TV Remote in Control Center
- **Your LMS favorites as inputs**: picking an input plays that favorite (the first 10 favorites are shown)
- **Remote control** from the Apple TV Remote: play/pause, next and previous track, skip forward or back 10 seconds, and restart the current track

State stays in sync in both directions. The plugin subscribes to LMS for player status and favorites changes, so changes made in other apps show up in HomeKit without polling.

## Requirements

- Homebridge 1.8 or 2.x
- Node.js 22.12+, 24, or 26
- Lyrion Music Server (or Logitech Media Server) reachable from the Homebridge host, with its HTTP port (default 9000) and CLI port (default 9090) open

## Installation

The plugin is published under the `beta` tag:

```sh
npm install -g @njmyers/homebridge-plugin-squeezebox@beta
```

Or search for `@njmyers/homebridge-plugin-squeezebox` in the Homebridge UI.

## Configuration

Add a `SqueezeboxHomebridgePlugin` entry to the `platforms` array in your Homebridge `config.json`, or use the settings form in the Homebridge UI. Add one entry under `accessories` for each LMS server.

```json
{
  "platform": "SqueezeboxHomebridgePlugin",
  "accessories": [
    {
      "name": "Home LMS",
      "host": "192.168.1.50",
      "ports": {
        "http": 9000,
        "cli": 9090
      }
    }
  ]
}
```

| Option | Required | Description |
| --- | --- | --- |
| `name` | Yes | A label for the server. |
| `host` | Yes | Hostname or IP address of the LMS server. |
| `ports.http` | Yes | LMS HTTP port, used for JSON-RPC commands and status subscriptions. Default `9000`. |
| `ports.cli` | Yes | LMS CLI port, used for change notifications such as favorites updates. Default `9090`. |

You don't configure players individually. Every player the server reports is added, and players that disappear from the server are removed from Homebridge on the next start.

If a server can't be reached at startup, the plugin logs an error and skips it, so the rest of Homebridge keeps running.

## Adding players to the Home app

HomeKit requires TV accessories to be published outside the Homebridge bridge, so each player has to be added on its own:

1. In the Home app, tap **+** → **Add Accessory** → **More options…**
2. Select the player and enter the setup code from your Homebridge config (the bridge `pin`).

## Development

```sh
npm install
npm run build          # compile TypeScript to dist/
npm run lint
npm run watch          # rebuild, link, and run a local Homebridge with test/hbConfig
npm run build-types    # regenerate TypeScript types from the LMS JSON schemas
npm run subscribe-lms  # log live LMS events, without Homebridge
npm run clean          # clear the local Homebridge cache in test/hbConfig
```

## License

Apache-2.0
