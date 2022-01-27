import React from 'react';
import axios from 'axios';


const ListEntry = ({params, getPreset, setPreset}) => {

  const toDelete = () => {
    axios.delete('http://localhost:4544/api/presets', { data: {presetid: params.presetid}})
    .then((res) => {
      console.log(res);
      getPreset();
    })
    .catch((err) => {
      console.log(err);
    })
  }




  return (

    <li className='list-group-item'>
      <div className='row'>
        <div className='col-10'>
          <p onClick={setPreset} style={{cursor: 'pointer'}} id={params.presetid}>{params.presetName}</p>
        </div>
        <div className='col-2'>
          <p onClick={toDelete} style={{cursor: 'pointer'}}>❌</p>
        </div>
      </div>

    </li>
  )
}




export default ListEntry;