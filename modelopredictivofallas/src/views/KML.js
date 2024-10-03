import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-kml'; // Importar la librería para manejar KML

const AddKMLLayer = () => {
  const map = useMap();

  useEffect(() => {
    // Cargar el archivo KML usando fetch
    fetch('/KML/LT26_Penablanca_-_Miraflores_C2_110kV_R01.kml') // Ruta a tu archivo KML
      .then(response => response.text())
      .then(kmlText => {
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlText, 'text/xml');
        const kmlLayer = new L.KML(kml);
        
        // Añadir la capa KML al mapa
        map.addLayer(kmlLayer);
        map.fitBounds(kmlLayer.getBounds()); // Ajustar el mapa para que encaje con las líneas del KML
      })
      .catch(error => {
        console.error('Error cargando el archivo KML:', error);
      });
  }, [map]);

  return null;
};

const MapView = () => {
  return (
    <MapContainer center={[-33.0257, -71.5510]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <AddKMLLayer />
    </MapContainer>
  );
};

export default MapView;
