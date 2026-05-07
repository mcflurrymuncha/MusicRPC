import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  openMusicApp: () => ipcRenderer.invoke('open-music-app'),
  getCurrentTrack: () => ipcRenderer.invoke('get-current-track'),
  onTrackUpdate: (callback: (track: MediaTrack) => void) => {
    ipcRenderer.on('track-update', (_event, track) => callback(track));
  },
  onRpcError: (callback: (message: string) => void) => {
    ipcRenderer.on('rpc-error', (_event, message) => callback(message));
  }
});

export interface MediaTrack {
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  state: 'playing' | 'paused' | 'stopped';
}
