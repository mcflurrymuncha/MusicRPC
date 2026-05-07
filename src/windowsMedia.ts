import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface MediaTrack {
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  state: 'playing' | 'paused' | 'stopped';
}

const powershellScript = `Add-Type -AssemblyName System.Runtime.WindowsRuntime;
$manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult();
if (-not $manager) { exit 0 }
$current = $manager.GetCurrentSession();
if ($null -ne $current -and $current.SourceAppUserModelId -notmatch 'spotify') {
  $session = $current
} else {
  $session = $manager.GetSessions() | Where-Object { $_.SourceAppUserModelId -notmatch 'spotify' } | Select-Object -First 1;
}
if (-not $session) { exit 0 }
$props = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult();
$status = $session.GetPlaybackInfo().PlaybackStatus.ToString();
$result = @{
  title = $props.Title
  artist = $props.Artist
  album = $props.AlbumTitle
  artworkUrl = ''
  state = if ($status -eq 'Playing') { 'playing' } elseif ($status -eq 'Paused') { 'paused' } else { 'stopped' }
};
$result | ConvertTo-Json -Compress;`;

export async function getWindowsMediaTrack(): Promise<MediaTrack | null> {
  try {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      powershellScript
    ], {
      windowsHide: true,
      timeout: 6000,
      maxBuffer: 1024 * 1024
    });

    const trimmed = stdout?.toString().trim();
    if (!trimmed) {
      return null;
    }

    const parsed = JSON.parse(trimmed) as MediaTrack;
    if (!parsed || !parsed.title) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Windows media track query failed:', error);
    return null;
  }
}
