import React from 'react';
import ListEntry from './ListEntry.jsx';

const List = ({presets, getPreset, setPreset}) => {



  return (
    <ul className='list-group list-group-flush'>
      {presets.map((params, index) => {
        return <ListEntry params={params} key={index} getPreset={getPreset} setPreset={setPreset}/>
      })}
    </ul>
  );
}









export default List;