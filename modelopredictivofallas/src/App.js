import React, { useState } from 'react';
import MapView from './views/MapView'; // Asegúrate de que la ruta es correcta
import Menu from './views/Menu'; // Menú para seleccionar capas

function App() {
  const [layer, setLayer] = useState('temperature'); // Estado para la capa seleccionada

  return (
    <div className="App">
      <Menu setLayer={setLayer} /> {/* Pasamos la función para cambiar la capa */}
      <MapView layer={layer} /> {/* Pasamos la capa seleccionada al MapView */}
    </div>
  );
}

export default App;
