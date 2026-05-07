
const titleEl = document.getElementById('track-title') as HTMLElement;
const artistEl = document.getElementById('track-artist') as HTMLElement;
const albumEl = document.getElementById('track-album') as HTMLElement;
const stateEl = document.getElementById('track-state') as HTMLElement;
const artworkEl = document.getElementById('track-artwork') as HTMLImageElement;
const openButton = document.getElementById('open-music') as HTMLButtonElement;
const statusEl = document.getElementById('status-message') as HTMLElement;

function updateUI(track: MediaTrack | null) {
  if (!track || !track.title) {
    titleEl.textContent = 'No track detected';
    artistEl.textContent = '-';
    albumEl.textContent = '-';
    stateEl.textContent = 'Waiting for media playback...';
    artworkEl.src = '';
    return;
  }

  titleEl.textContent = track.title;
  artistEl.textContent = track.artist;
  albumEl.textContent = track.album;
  stateEl.textContent = track.state === 'playing' ? 'Playing' : 'Paused';
  artworkEl.src = track.artworkUrl || '';
}

openButton.addEventListener('click', () => {
  window.electron.openMusicApp();
});

window.electron.onTrackUpdate((track) => {
  updateUI(track);
  statusEl.textContent = 'Discord Rich Presence updated.';
});

window.electron.onRpcError((message) => {
  statusEl.textContent = `Discord RPC Error: ${message}`;
});

window.addEventListener('DOMContentLoaded', async () => {
  const currentTrack = await window.electron.getCurrentTrack();
  updateUI(currentTrack);
});
