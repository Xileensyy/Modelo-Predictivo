import React, { useState, useEffect } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import Menu from './Menu';
import './MapView.css';

// Configura el icono del marcador personalizado
const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png', // Ruta a tu imagen personalizada
  iconSize: [32, 32], // Tamaño del icono
  iconAnchor: [16, 32], // Punto del icono que estará en la posición del marcador
  popupAnchor: [0, -32], // Punto desde el que se abrirá el popup en relación al icono
});

const AddGeocoderControl = ({ setForecast }) => {
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
      const { temperature, windSpeed, nextHoursForecast } = await getWeatherData(center.lat, center.lng);

      // Crear y añadir el marcador con el popup
      L.marker(center, { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>${name}</b><br>Temperatura: ${temperature}°C<br>Velocidad del viento: ${windSpeed} km/h`)
        .openPopup();

      // Actualiza las predicciones para mostrar en el popup de la esquina superior izquierda
      updateForecastPopup(nextHoursForecast);

      map.setView(center, 13);
    });

    // Coordenadas Viña del Mar
    map.setView([-33.0257, -71.5510], 13);
  }, [map]);

  const getWeatherData = async (lat, lon) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=9051c7a0628cb29598922cf70f3bf23c&units=metric`);
      const data = await response.json();
      
      const currentWeather = data.list[0]; // El clima actual
      const nextHoursForecast = data.list.slice(1, 5); // Las predicciones de las proximas horas
  
      const temperature = currentWeather.main.temp; // Temperatura en grados Celsius
      const windSpeed = currentWeather.wind.speed * 3.6; // Velocidad del viento en km/h (convertir de m/s a km/h)
      
      return { temperature, windSpeed, nextHoursForecast };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return { temperature: 'N/A', windSpeed: 'N/A', nextHoursForecast: [] };
    }
  };

  const updateForecastPopup = (forecast) => {
    if (!forecast || forecast.length === 0) return;

    const popupContent = forecast.map(item => {
      const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `<div>Hora: ${time}<br>Temperatura: ${item.main.temp}°C<br>Viento: ${(item.wind.speed * 3.6).toFixed(2)} km/h</div>`;
    }).join('<hr>');

    // Mostrar el contenido en el div del popup
    const forecastPopup = document.getElementById('forecast-popup');
    if (forecastPopup) {
      forecastPopup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.8); padding: 10px; border-radius: 5px; box-shadow: 0 0 5px rgba(0,0,0,0.2);">
          <span>Predicciones</span>
          <button id="minimize-btn" style="background: transparent; border: none; cursor: pointer; font-size: 14px;">&minus;</button>
        </div>
        <div id="forecast-content" style="padding: 10px;">${popupContent}</div>
      `;

      // Agregar el evento para minimizar el popup
      const minimizeBtn = document.getElementById('minimize-btn');
      const forecastContent = document.getElementById('forecast-content');

      if (minimizeBtn && forecastContent) {
        minimizeBtn.addEventListener('click', () => {
          if (forecastContent.style.display === 'none') {
            forecastContent.style.display = 'block';
            minimizeBtn.textContent = '−'; // Cambia el texto del botón a "+"
          } else {
            forecastContent.style.display = 'none';
            minimizeBtn.textContent = '+'; // Cambia el texto del botón a "-"
          }
        });
      }
    }
  };

  return null;
};

// Componente para la leyenda de temperatura
const Legend = () => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '50px',
      right: '10px',
      background: 'rgba(255, 255, 255, 0.8)',
      padding: '10px',
      borderRadius: '5px',
      boxShadow: '0 0 5px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      <h4>Leyenda de Temperatura</h4>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '20px', height: '20px', background: "#DDA0DD", marginRight: '10px' }}></div>
        <span>-90°C a -30°C</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '20px', height: '20px', background: '#0080ff', marginRight: '10px' }}></div>
        <span>-30°C a 0°C</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '20px', height: '20px', background: '#00ffff', marginRight: '10px' }}></div>
        <span>0°C a 10°C</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '20px', height: '20px', background: '#ffff00', marginRight: '10px' }}></div>
        <span>10°C a 20°C</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '20px', height: '20px', background: '#ff8000', marginRight: '10px' }}></div>
        <span>20°C a 30°C</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '20px', height: '20px', background: '#ff0000', marginRight: '10px' }}></div>
        <span>30°C a 40°C</span>
      </div>
    </div>
  );
};

const LayerControl = ({ selectedLayer }) => {
  const map = useMap();

  useEffect(() => {
    let defaultLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    if (!map.hasLayer(defaultLayer)) {
      defaultLayer.addTo(map);
    }

    map.eachLayer((layer) => {
      if (layer !== defaultLayer && layer.options && layer.options.attribution !== '© OpenStreetMap contributors') {
        map.removeLayer(layer);
      }
    });

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
    } else if (selectedLayer === 'rain') {
      layer = L.tileLayer(
        'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=9051c7a0628cb29598922cf70f3bf23c',
        {
          attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
        }
      );
    } else if (selectedLayer === 'heat') {
      layer = L.tileLayer(
        'https://tile.openweathermap.org/map/heat_new/{z}/{x}/{y}.png?appid=9051c7a0628cb29598922cf70f3bf23c',
        {
          attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
        }
      );
    }else if (selectedLayer === 'clouds') {
        layer = L.tileLayer(
          'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=9051c7a0628cb29598922cf70f3bf23c',
          {
            attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
            opacity: 1, // Ajusta la opacidad si es necesario
          }
        );
    } else if (selectedLayer === 'satellite') {
      layer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
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
  const [selectedLayer, setSelectedLayer] = useState('normal');

  return (
    <div>
      <MapContainer style={{ height: '100vh', width: '100%' }} center={[-33.0257, -71.5510]} zoom={13}>
        <AddGeocoderControl />
        <AddFailureMarkers />
        <LayerControl selectedLayer={selectedLayer} />
        {selectedLayer === 'temperature' && <Legend />}
      </MapContainer>
      <Menu setSelectedLayer={setSelectedLayer} />
      <div
        id="forecast-popup"
        style={{
          position: 'absolute',
          top: '50px',
          right: '10px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        }}
      ></div>
    </div>
  );
};

const getElectricFailureData = async () => {
  // Simula la obtención de datos de fallas eléctricas
  return [
    {
      id: 1,
      lat: -33.0257,
      lng: -71.5510,
      severity: 'Alta',
      time: '23:00',
      cause: 'Viento fuerte',
    },
    {
      id: 2,
      lat: -33.0357,
      lng: -71.5610,
      severity: 'Media',
      time: '23:30',
      cause: 'Sobrecalentamiento',
    },
    // Más fallas eléctricas...
  ];
};


// PopUP De fallas Electricas
const AddFailureMarkers = () => {
  const map = useMap();

  useEffect(() => {
    const loadFailureMarkers = async () => {
      const failures = await getElectricFailureData();
      failures.forEach(failure => {
        L.marker([failure.lat, failure.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <b>Predicción Falla Eléctrica</b><br>
            Severidad: ${failure.severity}<br>
            Hora: ${failure.time}<br>
            Causa: ${failure.cause}
          `)
          .openPopup();
      });
    };

    loadFailureMarkers();
  }, [map]);

  return null;
};


export default MapView;
