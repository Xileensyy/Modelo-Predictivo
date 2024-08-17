import React, { useState, useEffect } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import Menu from './Menu';

// Configura el icono del marcador personalizado
const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png', // Ruta a tu imagen personalizada
  iconSize: [32, 32], // Tamaño del icono
  iconAnchor: [16, 32], // Punto del icono que estará en la posición del marcador
  popupAnchor: [0, -32], // Punto desde el que se abrirá el popup en relación al icono
});

const AddGeocoderControl = () => {
  const map = useMap();

  useEffect(() => {
    const geocoder = L.Control.Geocoder.nominatim();
    const control = L.Control.geocoder({
      geocoder,
      defaultMarkGeocode: false,
    }).addTo(map);

    control.on('markgeocode', async (e) => {
      const { center, name } = e.geocode;

      // Obtener la temperatura y velocidad del viento
      const { temperature, windSpeed } = await getWeatherData(center.lat, center.lng);

      // Crear y añadir el marcador con el popup
      L.marker(center, { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>${name}</b><br>Temperatura: ${temperature}°C<br>Velocidad del viento: ${windSpeed} km/h`)
        .openPopup();

      map.setView(center, 13);
    });

    map.setView([-33.0257, -71.5510], 13);
  }, [map]);

  const getWeatherData = async (lat, lon) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=9051c7a0628cb29598922cf70f3bf23c&units=metric`);
      const data = await response.json();
      const temperature = data.main.temp; // Temperatura en grados Celsius
      const windSpeed = data.wind.speed * 3.6; // Velocidad del viento en km/h (convertir de m/s a km/h)
      return { temperature, windSpeed };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return { temperature: 'N/A', windSpeed: 'N/A' };
    }
  };

  return null;
};

const LayerControl = ({ selectedLayer }) => {
  const map = useMap();

  useEffect(() => {
    // Asegúrate de que la capa predeterminada esté siempre activa
    let defaultLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    // Añadir capa predeterminada si no está ya añadida
    if (!map.hasLayer(defaultLayer)) {
      defaultLayer.addTo(map);
    }

    // Limpiar capas adicionales si es necesario
    map.eachLayer((layer) => {
      if (layer !== defaultLayer && layer.options && layer.options.attribution !== '© OpenStreetMap contributors') {
        map.removeLayer(layer);
      }
    });

    // Añadir capa seleccionada
    let layer;

    if (selectedLayer === 'temperature') {
      layer = L.tileLayer(
        'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=9051c7a0628cb29598922cf70f3bf23c',
        {
          attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
        }
      );
    } else if (selectedLayer === 'wind') {
      layer = L.tileLayer(
        'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=9051c7a0628cb29598922cf70f3bf23c',
        {
          attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
        }
      );
    }

    if (layer) {
      layer.addTo(map);
    }
  }, [selectedLayer, map]);

  return null;
};


const MapView = () => {
  const [selectedLayer, setSelectedLayer] = useState(null);

  return (
    <MapContainer
      center={[-33.0257, -71.5510]} 
      zoom={13} 
      style={{ height: '100vh', width: '100%' }} 
    >
      <LayerControl selectedLayer={selectedLayer} />
      <AddGeocoderControl />
      <Menu setLayer={setSelectedLayer} />
    </MapContainer>
  );
};

export default MapView;
