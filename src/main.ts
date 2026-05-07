import fs from 'fs';
import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as RPC from 'discord-rpc';
import { getWindowsMediaTrack, MediaTrack } from './windowsMedia';

const DISCORD_CLIENT_ID = 'YOUR_DISCORD_APP_ID';
let mainWindow: BrowserWindow | null = null;
let rpcClient: RPC.Client | null = null;
let currentTrack: MediaTrack | null = null;
let trackPollHandle: NodeJS.Timeout | null = null;

function getArtworkFolder(): string {
  return path.join(app.getAppPath(), 'artwork');
}

const artworkKeyMap: Record<string, string> = {
  // Example mapping:
  // 'Adele - Easy On Me': 'adele_easy_on_me'
};

function normalizeArtworkKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveDiscordArtworkKey(track: MediaTrack): string {
  const lookup = `${track.artist} - ${track.title}`;
  if (artworkKeyMap[lookup]) {
    return artworkKeyMap[lookup];
  }

  const fileKey = normalizeArtworkKey(lookup);
  const artworkPath = getArtworkFolder();
  const candidateFiles = [`${fileKey}.png`, `${fileKey}.jpg`, `${fileKey}.jpeg`];

  if (candidateFiles.some((fileName) => fs.existsSync(path.join(artworkPath, fileName)))) {
    return fileKey;
  }

  return 'default_media';
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (trackPollHandle) {
      clearInterval(trackPollHandle);
      trackPollHandle = null;
    }
  });
}

function setupDiscordRpc() {
  rpcClient = new RPC.Client({ transport: 'ipc' });

  rpcClient.on('ready', () => {
    updatePresence();
  });

  rpcClient.login({ clientId: DISCORD_CLIENT_ID }).catch((error) => {
    console.error('Discord RPC login failed:', error);
    if (mainWindow) {
      mainWindow.webContents.send('rpc-error', error.message || 'Discord RPC login failed');
    }
  });
}

function isTrackChanged(newTrack: MediaTrack | null, oldTrack: MediaTrack | null | null): boolean {
  if (!oldTrack && newTrack) {
    return true;
  }

  if (!newTrack && oldTrack) {
    return true;
  }

  if (!newTrack || !oldTrack) {
    return false;
  }

  return (
    oldTrack.title !== newTrack.title ||
    oldTrack.artist !== newTrack.artist ||
    oldTrack.album !== newTrack.album ||
    oldTrack.state !== newTrack.state
  );
}

function updatePresence() {
  if (!rpcClient) {
    return;
  }

  if (!currentTrack || !currentTrack.title) {
    rpcClient.clearActivity().catch(console.error);
    return;
  }

  rpcClient.setActivity({
    details: currentTrack.title,
    state: `${currentTrack.artist} — ${currentTrack.album}`,
    type: currentTrack.state === 'playing' ? 2 : 0,
    largeImageKey: resolveDiscordArtworkKey(currentTrack),
    largeImageText: currentTrack.title,
    smallImageKey: currentTrack.state === 'playing' ? 'play' : 'pause',
    smallImageText: currentTrack.state === 'playing' ? 'Listening' : 'Paused',
  }).catch(console.error);
}

async function refreshTrackInfo() {
  let nextTrack: MediaTrack | null = null;

  if (process.platform === 'win32') {
    nextTrack = await getWindowsMediaTrack();
  }

  if (!isTrackChanged(nextTrack, currentTrack)) {
    return;
  }

  currentTrack = nextTrack;
  updatePresence();

  if (mainWindow) {
    mainWindow.webContents.send('track-update', currentTrack);
  }
}

function startTrackPolling() {
  refreshTrackInfo().catch(console.error);
  trackPollHandle = setInterval(() => {
    refreshTrackInfo().catch(console.error);
  }, 2500);
}

app.on('ready', () => {
  createMainWindow();
  setupDiscordRpc();
  startTrackPolling();
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle('open-music-app', async () => {
  await shell.openExternal('mswindowsmusic:');
});

ipcMain.handle('get-current-track', () => {
  return currentTrack;
});
