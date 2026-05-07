# MusicRPC

Electron + TypeScript app that reads currently playing media from Windows media sessions and updates Discord Rich Presence.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app:
   ```bash
   npm start
   ```

## Notes

- The app reads currently playing media from the Windows media session manager.
- Discord Rich Presence updates whenever a new song is detected from the active media session.
- Spotify is intentionally excluded from capture.
- Discord image artwork is only supported via Discord application assets, so local files must be mapped to an uploaded asset key.
- To use local artwork:
  1. Put image files in an `artwork/` folder next to the app root.
  2. Name them using the normalized track key, e.g. `playboi_carti_sky.png`.
  3. Upload the same images to your Discord application assets and use the matching key in `src/main.ts`.
