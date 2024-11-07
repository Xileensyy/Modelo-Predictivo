import React from 'react';
import VinaMap from './images/VinaMapa.png';
import TempMap from './images/Temperatura.png';
import WindMap from './images/Wind.png';
import RainMap from './images/Rain.png';
import SatelliteMap from './images/Satellite.png';
import CloudsMap from './images/Clouds.png';

const Menu = ({ setSelectedLayer, selectedLayer }) => {
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'Arial',
    fontWeight: 'bold',
  };

  const iconStyle = {
    width: '29px',
    height: '29px',
    marginRight: '10px',
  };

  // Cambia el estilo del botón si está activo
  const isActive = (layer) => (
    selectedLayer === layer
      ? { backgroundColor: 'black', color: 'white' }
      : {}
  );

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
      <button
        style={{ ...buttonStyle, ...isActive('normal') }}
        onClick={() => setSelectedLayer('normal')}
      >
        <img src={VinaMap} alt="Default" style={iconStyle} />
         Normal
      </button>
      <button
        style={{ ...buttonStyle, ...isActive('satellite') }}
        onClick={() => setSelectedLayer('satellite')}
      >
        <img src={SatelliteMap} alt="Satellite" style={iconStyle} />
        Satelital
      </button>
      <button
        style={{ ...buttonStyle, ...isActive('temperature') }}
        onClick={() => setSelectedLayer('temperature')}
      >
        <img src={TempMap} alt="Temperature" style={iconStyle} />
        Temperatura
      </button>
      <button
        style={{ ...buttonStyle, ...isActive('wind') }}
        onClick={() => setSelectedLayer('wind')}
      >
        <img src={WindMap} alt="Wind" style={iconStyle} />
        Viento
      </button>
      <button
        style={{ ...buttonStyle, ...isActive('rain') }}
        onClick={() => setSelectedLayer('rain')}
      >
        <img src={RainMap} alt="Rain" style={iconStyle} />
        Lluvia
      </button>
      <button
        style={{ ...buttonStyle, ...isActive('clouds') }}
        onClick={() => setSelectedLayer('clouds')}
      >
        <img src={CloudsMap} alt="Clouds" style={iconStyle} />
        Nubes
      </button>
    </div>
  );
};



export default Menu;
