// KmlMap.js
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import omnivore from 'leaflet-omnivore'; // Asegúrate de importar omnivore aquí

const KmlLayer = () => {
  const map = useMap();

  useEffect(() => {
    const kmlLayer = omnivore.kml('/KML/LT26_Penablanca_-_Miraflores_C2_110kV_R01.kml').addTo(map);

    kmlLayer.on('ready', function() {
      map.fitBounds(kmlLayer.getBounds());
    });

    return () => {
      map.removeLayer(kmlLayer); // Remueve la capa cuando el componente se desmonte
    };
  }, [map]);

  return null; // No necesitas renderizar nada aquí
};

const KmlMap = () => {
  return (
    <MapContainer style={{ height: '500px', width: '100%' }} center={[-33.0257, -71.5510]} zoom={13}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <KmlLayer />
    </MapContainer>
  );
};

