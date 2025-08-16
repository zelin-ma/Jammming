// components/App/App.jsx
import SearchBar from '../src/components/SearchBar/SearchBar';
import SearchResults from '../src/components/SearchResults/SearchResults';
import Playlist from '../src/components/Playlist/Playlist';
import './App.css';
import {useState,useEffect} from 'react';
import { ensureSpotifyToken } from "../src/utils/spotifyAuth.js";
import { spotifyFetch, savePlaylist } from './utils/spotifyApi.js';


function App() {

  const [searchResults, setSearchResults] = useState([]);
  const [playlistName, setPlaylistName] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState([]);

  useEffect(() => {
    ensureSpotifyToken();
  }, []);

  const searchSpotify = async (term) => {
    try {
      const data = await spotifyFetch(
        `/v1/search?q=${encodeURIComponent(term)}&type=track`
      );
      // 提取所需字段
      const tracks = data.tracks.items.map((item) => ({
        id: item.id,
        name: item.name,
        artist: item.artists?.[0]?.name,
        album: item.album?.name,
        uri: item.uri,
      }));
      setSearchResults(tracks);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // 保存播放列表到 Spotify
  const savePlaylistToSpotify = async () => {
    if (!playlistName || playlistTracks.length === 0) return;
    const trackUris = playlistTracks.map((track) => track.uri);
    try {
      await savePlaylist(playlistName, trackUris);
      // 清空并重置
      setPlaylistName('New Playlist');
      setPlaylistTracks([]);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const addTrack = (track) => {
    setPlaylistTracks(prev => prev.some(t => t.id === track.id) ? prev : [...prev, track]);
  };

  const updatePlaylistName = (newName) => {
    setPlaylistName(newName);
  }


  const removeTracks = (track) => {
    setPlaylistTracks(prev => prev.filter(saved => saved.id !== track.id))
  };


  return (
    <div>
      <h1 className='header'>Jammming</h1>
      <SearchBar onSearch={searchSpotify} />
      <div className="App-content">
          <SearchResults 
            searchResults={searchResults}
            onAdd={addTrack} />
          <Playlist
            playlistName={playlistName}
            onNameChange={updatePlaylistName}
            playlistTracks={playlistTracks}
            onRemove={removeTracks}
            onSave={savePlaylistToSpotify} />
      </div>  
    </div>
  );
}

export default App;

