import { ensureSpotifyToken } from './spotifyAuth';

export async function spotifyFetch(path, options = {}) {
  const token = await ensureSpotifyToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  const res = await fetch(`https://api.spotify.com${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(`Spotify API error ${res.status}`);
  return res.json();
}

export async function savePlaylist(name, trackUris) {
  // 获取当前用户 ID
  const me = await spotifyFetch('/v1/me');
  const userId = me.id;
  // 创建新的播放列表（默认为私密）
  const playlist = await spotifyFetch(`/v1/users/${userId}/playlists`, {
    method: 'POST',
    body: JSON.stringify({ name, public: false }),
  });
  // 向播放列表添加歌曲
  await spotifyFetch(`/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    body: JSON.stringify({ uris: trackUris }),
  });
  return playlist;
}