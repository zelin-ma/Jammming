// components/SearchBar/SearchBar.jsx
import { useState } from 'react';
import './SearchBar.css';

function SearchBar({onSearch}) {
  const [term, setTerm] = useState('');

  return (
    <div className='Searchbar-container'>
      <input
        className='Searchbar-Input'
        type="text"
        placeholder="Enter a song, album, or artist"
        onChange={(e) => setTerm(e.target.value)}
      />
      <button onClick={() => onSearch(term)} className='Search-Button'>Search</button>
    </div>
  );
}

export default SearchBar;
