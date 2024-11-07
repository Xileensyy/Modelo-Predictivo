import React, { useState } from 'react';
import MapView from './views/MapView'; // Asegúrate de que la ruta es correcta
import Menu from './views/Menu'; // Menú para seleccionar capas

function App() {
  const [selectedLayer, setSelectedLayer] = useState('normal'); // Estado para la capa seleccionada

  return (
    <div className="App">
      <MapView selectedLayer={selectedLayer} setSelectedLayer={setSelectedLayer} />
 



  



      {/* Logo en la esquina inferior izquierda */}
      <img 
        src="ElecPreTX.png" 
        alt="Logo"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '20px',
          width: '80px',       // Ajusta el tamaño del logo
          height: 'auto',      // Mantiene la proporción de la imagen
          opacity: '0.8',      // Un poco transparente
          zIndex: 1000         // Asegura que esté encima de otros elementos
        }}
      />
    </div>
  );
}

export default App;
