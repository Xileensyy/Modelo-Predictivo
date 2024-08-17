import React from 'react';
import VinaMap from './images/VinaMapa.png';
import TempMap from './images/Temperatura.png';
import WindMap from './images/Wind.png';


const Menu = ({ setLayer }) => {
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '10px', // Espacio entre botones
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  const iconStyle = {
    width: '24px',
    height: '24px',
    marginRight: '10px',
  };

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
      <button style={buttonStyle} onClick={() => setLayer(null)}>
        <img src={VinaMap} alt="Default" style={iconStyle} />
        Normal
      </button>
      <button style={buttonStyle} onClick={() => setLayer('temperature')}>
        <img src={TempMap} alt="Temperature" style={iconStyle} />
        Temperatura
      </button>
      <button style={buttonStyle} onClick={() => setLayer('wind')}>
        <img src={WindMap} alt="Wind" style={iconStyle} />
        Viento
      </button>
    </div>
  );
};

export default Menu;
