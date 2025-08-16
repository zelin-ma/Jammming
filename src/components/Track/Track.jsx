// components/Track/Track.jsx

function Track({ track, onAdd, onRemove, isRemoval }) {
  const handleAdd = () => onAdd(track);
  const handleRemove = () => onRemove(track);

  return (
    <div className="Track">
      <div className="Track-info">
        <h3>{track.name}</h3>
        <p>{track.artist} | {track.album}</p>
      </div>
      {isRemoval
        ? <button onClick={handleRemove}>-</button>
        : <button onClick={handleAdd}>+</button>
      }
    </div>
  );
}

export default Track;
