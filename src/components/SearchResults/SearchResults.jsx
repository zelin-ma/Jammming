// components/SearchResults/SearchResults.jsx
import TrackList from '../TrackList/TrackList';
import './SearchResults.css';

function SearchResults({ searchResults, onAdd }) {
  // 假设 searchResults 是来自 props 或 context
  return (
    <div className='Results-container'>
      <h2>Results</h2>
      <TrackList tracks={searchResults} onAdd={onAdd} isRemoval={false} />
    </div>
  );
}

export default SearchResults;
