export {};

declare global {
  interface MediaTrack {
    title: string;
    artist: string;
    album: string;
    artworkUrl: string;
    state: 'playing' | 'paused' | 'stopped';
  }

  interface Window {
    electron: {
      openMusicApp: () => Promise<void>;
      getCurrentTrack: () => Promise<MediaTrack | null>;
      onTrackUpdate: (callback: (track: MediaTrack) => void) => void;
      onRpcError: (callback: (message: string) => void) => void;
    };
  }
}
