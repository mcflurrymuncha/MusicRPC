import { ipcRenderer } from 'electron';

type MediaTrack = {
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  state: 'playing' | 'paused' | 'not playing';
};

const selectors = {
  title: 'figure.now-playing__media .now-playing__title',
  artist: 'figure.now-playing__media .now-playing__artists',
  album: 'figure.now-playing__media .now-playing__album',
  artwork: '.focus-item__artwork img',
  playPause: '.playback-controls__button--play-pause'
};

function queryText(selector: string): string {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() ?? '';
}

function queryArtwork(): string {
  const image = document.querySelector<HTMLImageElement>(selectors.artwork);
  if (image?.src) {
    return image.src;
  }
  return '';
}

function getPlaybackState(): 'playing' | 'paused' | 'not playing' {
  const button = document.querySelector(selectors.playPause);
  if (!button) {
    return 'not playing';
  }

  const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() ?? '';
  if (ariaLabel.includes('pause')) {
    return 'playing';
  }
  if (ariaLabel.includes('play')) {
    return 'paused';
  }
  return 'not playing';
}

function buildTrackInfo(): MediaTrack {
  return {
    title: queryText(selectors.title),
    artist: queryText(selectors.artist),
    album: queryText(selectors.album),
    artworkUrl: queryArtwork(),
    state: getPlaybackState()
  };
}

let lastSent: MediaTrack | null = null;

function tracksDiffer(a: MediaTrack | null, b: MediaTrack) {
  if (!a) return true;
  return a.title !== b.title || a.artist !== b.artist || a.album !== b.album || a.state !== b.state;
}

function pollTrackInfo() {
  const track = buildTrackInfo();
  if (tracksDiffer(lastSent, track) && track.title) {
    lastSent = track;
    ipcRenderer.send('track-info', track);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setInterval(pollTrackInfo, 2500);
});
