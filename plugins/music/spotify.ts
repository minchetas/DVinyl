// Fork-only: optional Spotify embed/link on the music detail page.
// Client Credentials flow — no user-level Spotify auth needed, just an app's own
// client id/secret (from Settings or env), used to resolve an album id to embed/link to.

const TIMEOUT_MS = 8000;
const _tokenCache: Record<string, { token: string; expiry: number }> = {};

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  const cached = _tokenCache[clientId];
  if (cached && now < cached.expiry) return cached.token;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!resp.ok) throw new Error(`Spotify token request failed: ${resp.status}`);
  const data: any = await resp.json();

  _tokenCache[clientId] = {
    token: data.access_token,
    expiry: now + (data.expires_in - 60) * 1000,
  };
  return _tokenCache[clientId].token;
}

export async function searchAlbumId(clientId: string, clientSecret: string, artist: string, title: string): Promise<string | null> {
  const token = await getAccessToken(clientId, clientSecret);
  const q = encodeURIComponent(`${artist} ${title}`);
  const resp = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=album&limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!resp.ok) throw new Error(`Spotify search failed: ${resp.status}`);
  const data: any = await resp.json();
  const items = data.albums?.items;
  return items && items.length > 0 ? items[0].id : null;
}

export function getSpotifyCreds(settings: any): { clientId: string; clientSecret: string } {
  const music = settings?.pluginSettings?.music || {};
  const clientId = music.spotifyClientId || process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = music.spotifyClientSecret || process.env.SPOTIFY_CLIENT_SECRET || '';
  return { clientId, clientSecret };
}

// 'off' (feature disabled), 'link' (enabled, no valid credentials — opens Spotify search
// in a new tab), 'embed' (enabled with credentials — resolves and shows an inline player).
export function getSpotifyMode(settings: any): 'off' | 'link' | 'embed' {
  if (!settings?.pluginSettings?.music?.spotifyEnabled) return 'off';
  const { clientId, clientSecret } = getSpotifyCreds(settings);
  return clientId && clientSecret ? 'embed' : 'link';
}
