// components/Playlist/Playlist.jsx
import TrackList from '../TrackList/TrackList';
import './Playlist.css';


function Playlist({ playlistName, onNameChange, playlistTracks, onRemove, onSave}) {
  return (
    <div className='Playlist-container'>
      <input 
        value={playlistName}
        onChange={(e) => onNameChange(e.target.value)} />
      <TrackList tracks={playlistTracks} onRemove={onRemove} isRemoval={true} />
      <button
        className='Playlist-save'
        onClick={onSave}
        disabled={playlistTracks.length === 0}>Save to Spotify</button>
    </div>
  );
}

export default Playlist;
