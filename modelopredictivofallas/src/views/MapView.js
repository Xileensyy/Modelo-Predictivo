import React, { useState, useEffect, useRef} from 'react';
import { MapContainer,TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import Menu from './Menu';
import './MapView.css';
import omnivore from 'leaflet-omnivore';



// Icono del marcador personalizado
const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png', // Ruta imagen personalizada
  iconSize: [32, 32], // Tamaño del icono
  iconAnchor: [16, 32], // Punto del icono que estará en la posición del marcador
  popupAnchor: [0, -32], // Punto desde el que se abrirá el popup en relación al icono
});



const AddGeocoderControl = ({ setForecast }) => {
  const map = useMap();

  useEffect(() => {
    map.zoomControl.remove(); //Eliminar botones control de zoom

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
        .bindPopup(`<b>${name}</b><br>Temperatura: ${temperature}°C<br>Velocidad del viento: ${windSpeed.toFixed(3)} km/h`)

        .openPopup();

      // Actualiza las predicciones para mostrar en el popup de la esquina superior izquierda
      updateForecastPopup(nextHoursForecast);

      map.setView(center, 13);
    });

    // Coordenadas Viña del Mar
    map.setView([-33.0257, -71.5510], 12);
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

  //Actualización predicciones siguientes 3 horas
  const updateForecastPopup = (forecast) => {
    if (!forecast || forecast.length === 0) return;
  
    const popupContent = forecast.map(item => {
      const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `<div>Hora: ${time}<br>Temperatura: ${item.main.temp}°C<br>Viento: ${(item.wind.speed * 3.6).toFixed(2)} km/h</div>`;
    }).join('<hr>');
  
    // Mostrar el contenido en el div del popup
    const forecastPopup = document.getElementById('forecast-content');
    if (forecastPopup) {
      forecastPopup.innerHTML = popupContent;
    }
  };
  

  return null;
};

// Componente para la leyenda de temperatura
const Legend = () => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '180px',
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

//Creditos
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

//Vista de mapa principal

const MapView = () => {
  const [selectedLayer, setSelectedLayer] = useState('normal');
  const [layerVisibility, setLayerVisibility] = useState({
    Group1: false, //Chilquinta
    Group2: false, //CTNG
    Group3: false, // 44kV-66kV
    Group4: false, // 110kV
    Group5: false, // 220kV
  });
  const mapRef = useRef();
  const kmlLayerRefs = useRef({
    Group1: [...Array(39)].map(() => ({ layer: null, marker: null })),
    Group2: [...Array(9)].map(() => ({ layer: null, marker: null })),
    Group3: [...Array(15)].map(() => ({ layer: null, marker: null })), // Cantidad de KMZ en 44kV-66kV
    Group4: [...Array(29)].map(() => ({ layer: null, marker: null })), // Cantidad de KMZ en 110kV
    Group5: [...Array(1)].map(() => ({ layer: null, marker: null })), // Cantidad de KMZ en 220kV
  });

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupContent, setPopupContent] = useState('');

  const kmlGroups = {
    Group1: [
      { name: 'Las Vegas - Rungue LT01 44kV', path: '/KML/LT01 Las Vegas - FFCC.Rungue 44kV R01.kml', color: 'lime', probabilidad: 0.8},
      { name: 'San Pedro - Miraflores 110kV', path: '/KML/LT02 San Pedro - Miraflores CTO N° 1 110 kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Las Vegas FFCC - San Pedro 44kV', path: '/KML/LT03 Las Vegas FFCC - San Pedro C1 y C2 44kV R01.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'Pachacama - La Calera 44kV', path: '/KML/LT04 Pachacama - La Calera 44kV R01.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'Las Vegas - Estancilla 44kV', path: '/KML/LT07 Las Vegas - Estancilla 44kV R01.kml', color: 'lime', probabilidad: 0.8 },
      { name: 'Las Vegas FFCC - Los Andes', path: '/KML/LT07 Las Vegas FFCC - Los Andes C1 y C2 44kV R01.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'Los Andres - Hermanos Clark 44kV', path: '/KML/LT08 Los Andres - Hermanos Clark 44kV (Juncal) R01.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'La Calera - El Melon 44kV', path: '/KML/LT09 La Calera - El Melon 44kV R02.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'Catemu - Los Ángeles 44kV', path: '/KML/LT11 Catemu - Los Ángeles 44kV R01.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'Laguna Verde - San Antonio 66kV', path: '/KML/LT12 C2 Laguna Verde San Antonio 66KV R02.kml' , color: 'lime', probabilidad: 0.8}, // Inclui el guión en los nombres entre lineas en todos los que tienen (//)
      { name: 'La Pólvora - Valparaíso 110kV', path: '/KML/LT13 La Pólvora - Valparaíso 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Achupallas - Concón 110kV', path: '/KML/LT14 Achupallas - Concón 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Arranque - San Sebastian 66kV', path: '/KML/LT15 Arranque San Sebastian C2 Y C1 66kV R01.kml', color: 'lime', probabilidad: 0.8 }, //
      { name: 'Litoral Central - Casablanca C1 66kV', path: '/KML/LT16 Litoral Central Casablanca C1 66kV R01.kml' , color: 'lime', probabilidad: 0.8}, //
      { name: 'Arranque - Placeres 110kV', path: '/KML/LT17 Arranque Placeres 110kV R00.kml' , color: 'yellow', probabilidad: 0.8}, //
      { name: 'Arranque - Quilpué 110kV', path: '/KML/LT18 Arranque Quilpué 110kV R01.kml', color: 'yellow', probabilidad: 0.8 }, //
      { name: 'Laguna Verde - Sa Antonio', path: '/KML/LT19 Laguna Verde Sa Antonio C1-R01.kml' , color: 'lime', probabilidad: 0.8}, // De cuantos KV es la liena
      { name: 'Arranque - San Rafael 110kV', path: '/KML/LT21 Arranque San Rafael 110kV R00.kml' , color: 'yellow', probabilidad: 0.8}, //
      { name: 'Arranque - San Felipe 44kV', path: '/KML/LT22 Arranque San Felipe 44kV R01.kml' , color: 'lime', probabilidad: 0.8}, //
      { name: 'La Pólvora - Playa Ancha 110kV', path: '/KML/LT23 La Pólvora - Playa Ancha 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Arranque - Reñaca 110kV', path: '/KML/LT24 Arranque Reñaca 110kV R01.kml' , color: 'yellow', probabilidad: 0.8}, //
      { name: 'El Melón - Túnel 44kV', path: '/KML/LT25 El Melón - Túnel El Melón 44kV R01.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'Peñablanca - Miraflores 110kV', path: '/KML/LT26 Peñablanca - Miraflores C2 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Melipilla - San Antonio 110kV', path: '/KML/LT28 Melipilla - San Antonio C1 Leyda C2 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Arranque - San Felipe 110kV', path: '/KML/LT29 Arranque San Felipe 110kV R01.kml' , color: 'yellow', probabilidad: 0.8}, //
      { name: 'San Luis - Agua Santa 220kV', path: '/KML/LT30 San Luis - Agua Santa 220kV R01.kml' , color: 'red', probabilidad: 0.8},
      { name: 'Litoral Central - Casablanca CT02 66kV', path: '/KML/LT32 Litoral Central - Casablanca CTO2 66kV R01.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'Arranque - Quintay 66kV', path: '/KML/LT33 Arranque Quintay 66kV R01.kml', color: 'lime', probabilidad: 0.8 }, //
      { name: 'La Pólvora - Laguna Verde 110kV', path: '/KML/LT34 La Pólvora - Laguna Verde 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Agua Santa - Miraflores 110kV', path: '/KML/LT35 Agua Santa - Miraflores 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Las Vegas - Cristalería 110kV', path: '/KML/LT36 Las Vegas - Cristalería 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Agua Santa - Placilla 110kV', path: '/KML/LT37 Agua Santa - Placilla 110kV R01.kml' , color: 'yellow', probabilidad: 0 },
      { name: 'Torquemada - Concón 110kV', path: '/KML/LT38 Torquemada - Concón 110kV R01.kml', color: 'yellow', probabilidad: 0.8 },
      { name: 'Concón - Bosquemar 110kV', path: '/KML/LT39 Concón - Bosquemar 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'San Pedro - Peñablanca 110kV', path: '/KML/LT40 San Pedro - Peñablanca C2 110kV R01.kml', color: 'yellow', probabilidad: 0.8 },
      { name: 'Arranque - Mayaca 110kV', path: '/KML/LT51 Arranque Mayaca 110kV R01.kml' , color: 'yellow', probabilidad: 0.8}, //
      { name: 'Estancilla - Catemu 44kV', path: '/KML/LT57 Estancilla - Catemu 44kV R01.kml' , color: 'lime', probabilidad: 0.8},
      { name: 'Litoral Central - San Jerónimo 66kV', path: '/KML/LT63 Litoral Central San Jerónimo 66kV R01.kml' , color: 'lime', probabilidad: 0.8}, //
      { name: 'Agua Santa - La Pólvora 110kV', path: '/KML/LT74 Agua Santa - La Pólvora 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
    ],
    Group2: [
      { name: 'Ventanas - Torquemada 110kV', path: '/KML/LT41 Ventanas - Torquemada 110kV R01.kml', color: 'yellow', probabilidad: 0.8 },
      { name: 'Torquemada - Miraflores 110kV', path: '/KML/LT42 Torquemada - Miraflores 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Subterránea Ventanas 110kV', path: '/KML/LT43 Subterránea Ventanas - Quintero R01.kml' , color: 'yellow', probabilidad: 0.8}, //110kv?
      { name: 'Ventanas - San Pedro 110kV', path: '/KML/LT44 Ventanas - San Pedro 110kV R02.kml', color: 'yellow', probabilidad: 0.8 },
      { name: 'Quillota - San Pedro 110kV', path: '/KML/LT45 Quillota - San Pedro 110kV R01.kml', color: 'yellow', probabilidad: 0.8 },
      { name: 'San Pedro - Las Vegas 110kV', path: '/KML/LT46 San Pedro - Las Vegas 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Pachacama - La Calera 110kV', path: '/KML/LT47 Pachacama - La Calera 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Cerro Navia - Las Vegas 110kV', path: '/KML/LT48 Cerro Navia - Las Vegas 110kV R03.kml' , color: 'yellow', probabilidad: 0.8},
      { name: 'Seccionadora Ventanas - Puchuncaví - Torquemada 110kV', path: '/KML/LT75 Seccionadora Ventanas - Puchuncaví - Torquemada (C2) 110kV R01.kml' , color: 'yellow', probabilidad: 0.8},
    ],
    Group3: [
      { name: 'LT02 66kV', path: '/KML/LT01 Las Vegas - FFCC.Rungue 44kV R01.kml' , color: 'lime', probabilidad: 0.0 },
      { name: 'Las Vegas FFCC - San Pedro', path: '/KML/LT03 Las Vegas FFCC - San Pedro C1 y C2 44kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'Pachacama - La Calera 44kV', path: '/KML/LT04 Pachacama - La Calera 44kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'Las Vegas - Estancilla', path: '/KML/LT07 Las Vegas - Estancilla 44kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'Las Vegas FFCC - Los Andes', path: '/KML/LT07 Las Vegas FFCC - Los Andes C1 y C2 44kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'Los Andres - Hermanos Clark', path: '/KML/LT08 Los Andres - Hermanos Clark 44kV (Juncal) R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'La Calera - El Melon', path: '/KML/LT09 La Calera - El Melon 44kV R02.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'Catemu - Los Ángeles', path: '/KML/LT11 Catemu - Los Ángeles 44kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'Arranque - San Felipe 44kV', path: '/KML/LT22 Arranque San Felipe 44kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'El Melón - Túnel', path: '/KML/LT25 El Melón - Túnel El Melón 44kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'Estancilla - Catemu', path: '/KML/LT57 Estancilla - Catemu 44kV R01.kml', color: 'lime', probabilidad: 0.8 },
      { name: 'Laguna Verde - San Antonio', path: '/KML/LT12 C2 Laguna Verde San Antonio 66KV R02.kml' , color: 'lime', probabilidad: 0.8 }, 
      { name: 'Arranque - San Sebastian', path: '/KML/LT15 Arranque San Sebastian C2 Y C1 66kV R01.kml' , color: 'lime', probabilidad: 0.8 }, 
      { name: 'Litoral Central - Casablanca C1', path: '/KML/LT16 Litoral Central Casablanca C1 66kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      { name: 'Litoral Central - San Jerónimo', path: '/KML/LT63 Litoral Central San Jerónimo 66kV R01.kml' , color: 'lime', probabilidad: 0.8 },
      // Añade más elementos de 44kV-66kV según sea necesario
    ],
    Group4: [
      { name: 'San Pedro - Miraflores', path: '/KML/LT02 San Pedro - Miraflores CTO N° 1 110 kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'La Pólvora - Valparaíso', path: '/KML/LT13 La Pólvora - Valparaíso 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Achupallas - Concón', path: '/KML/LT14 Achupallas - Concón 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Arranque - Placeres', path: '/KML/LT17 Arranque Placeres 110kV R00.kml' , color: 'yellow', probabilidad: 0.0 }, //
      { name: 'Arranque - Quilpué', path: '/KML/LT18 Arranque Quilpué 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Arranque - San Rafael', path: '/KML/LT21 Arranque San Rafael 110kV R00.kml' , color: 'yellow', probabilidad: 0.0 }, 
      { name: 'La Pólvora - Playa Ancha', path: '/KML/LT23 La Pólvora - Playa Ancha 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Arranque - Reñaca', path: '/KML/LT24 Arranque Reñaca 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 }, //
      { name: 'Peñablanca - Miraflores', path: '/KML/LT26 Peñablanca - Miraflores C2 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Melipilla - San Antonio', path: '/KML/LT28 Melipilla - San Antonio C1 Leyda C2 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Arranque - San Felipe 110kV', path: '/KML/LT29 Arranque San Felipe 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 }, //
      { name: 'La Pólvora - Laguna Verde', path: '/KML/LT34 La Pólvora - Laguna Verde 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Agua Santa - Miraflores', path: '/KML/LT35 Agua Santa - Miraflores 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Las Vegas - Cristalería', path: '/KML/LT36 Las Vegas - Cristalería 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Agua Santa - Placilla', path: '/KML/LT37 Agua Santa - Placilla 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Torquemada - Concón', path: '/KML/LT38 Torquemada - Concón 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Concón - Bosquemar', path: '/KML/LT39 Concón - Bosquemar 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'San Pedro - Peñablanca', path: '/KML/LT40 San Pedro - Peñablanca C2 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Arranque - Mayaca', path: '/KML/LT51 Arranque Mayaca 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 }, //
      { name: 'Agua Santa - La Pólvora', path: '/KML/LT74 Agua Santa - La Pólvora 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Ventanas - Torquemada', path: '/KML/LT41 Ventanas - Torquemada 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Torquemada - Miraflores', path: '/KML/LT42 Torquemada - Miraflores 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Subterránea Ventanas', path: '/KML/LT43 Subterránea Ventanas - Quintero R01.kml' , color: 'yellow', probabilidad: 0.0}, //110kv?
      { name: 'Ventanas - San Pedro', path: '/KML/LT44 Ventanas - San Pedro 110kV R02.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Quillota - San Pedro', path: '/KML/LT45 Quillota - San Pedro 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'San Pedro - Las Vegas', path: '/KML/LT46 San Pedro - Las Vegas 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Pachacama - La Calera 110kV', path: '/KML/LT47 Pachacama - La Calera 110kV R01.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Cerro Navia - Las Vegas', path: '/KML/LT48 Cerro Navia - Las Vegas 110kV R03.kml' , color: 'yellow', probabilidad: 0.0 },
      { name: 'Seccionadora Ventanas - Puchuncaví - Torquemada', path: '/KML/LT75 Seccionadora Ventanas - Puchuncaví - Torquemada (C2) 110kV R01.kml' , color: 'yellow', probabilidad: 0.8 },
       //
      // Añade más elementos de 110kV según sea necesario
    ],
    Group5: [
      { name: 'San Luis - Agua Santa', path: '/KML/LT30 San Luis - Agua Santa 220kV R01.kml' , color: 'red'},
      // Añade más elementos de 220kV según sea necesario
    ],
  };

 

  const [probabilities, setProbabilities] = useState({
    Group1: [0.9, 0.8, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ,0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,0.0, 0.0,0.0, 0.0,0.0, 0.0, 0.0,0.0, 0.0,0.0, 0.0,0.0, 0.0,0.0, 0.0, 0.0,0.0, 0.0,0.0,],
    Group2: [0.0, 0.0,0.0, 0.0,0.0, 0.0,0.0, 0.0, 0.0 ],
    Group3: Array(15).fill(0.0), // Probabilidades para 44kV-66kV
    Group4: Array(29).fill(0.0), // Probabilidades para 110kV
    Group5: Array(1).fill(0.0),  // Probabilidades para 220kV
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch('https://g87jo5nbme.execute-api.us-east-1.amazonaws.com/dev')
        .then(response => response.json())
        .then(data => {
          // Asegúrate de que los datos se ajusten a la estructura esperada
          setProbabilities(data.body);
        })
        .catch(error => console.error('Error:', error));
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);



// Función para obtener color y probabilidad
const kmlColors = (line) => {
    const color = line.color; // Obtiene el color directamente
    const probabilidad = line.probabilidad !== undefined ? line.probabilidad : 0; // Asigna 0 si no está definida
    return { color, probabilidad };
};



const loadKML = (kmlPath, color, index, group) => {
  if (mapRef.current) {
      if (!kmlLayerRefs.current[group]) {
          kmlLayerRefs.current[group] = {};
      }
      if (!kmlLayerRefs.current[group][index]) {
          kmlLayerRefs.current[group][index] = {};
      }

      // Elimina capas existentes
      if (kmlLayerRefs.current[group][index].layer) {
          mapRef.current.removeLayer(kmlLayerRefs.current[group][index].layer);
      }
      if (kmlLayerRefs.current[group][index].marker) {
          mapRef.current.removeLayer(kmlLayerRefs.current[group][index].marker);
      }

      // Carga la capa KML
      const kmlLayer = omnivore.kml(kmlPath)
          .on('ready', function () {
              const probability = probabilities[group] && probabilities[group][index] !== undefined 
                                 ? probabilities[group][index] 
                                 : 0; // Obtener probabilidad correctamente
              
              // Configuración inicial de la capa KML
              kmlLayer.setStyle({ color, weight: 3, opacity: 1 });
              
              // Si la probabilidad es mayor a 0.7, añade el efecto de parpadeo
              if (probability > 0.7) {
                  let visible = true;
                  const blinkInterval = setInterval(() => {
                      kmlLayer.setStyle({
                          color: visible ? color : 'orange', // Alterna entre color y negro
                          weight: 5,
                          opacity: visible ? 1 : 0.3, // Alterna opacidad
                      });
                      visible = !visible;
                  }, 500); // Intervalo de 500ms (0.5s)
                  
                  // Guardar el intervalo en la referencia de la capa para poder limpiar después
                  kmlLayerRefs.current[group][index].blinkInterval = blinkInterval;
              }
              
              const bounds = kmlLayer.getBounds();
              const center = bounds.getCenter();

              if (probability > 0.7) {
                  const markerColor = 'red'; // Color rojo para probabilidad > 0.7
                  const marker = L.marker(center, {
                      icon: L.divIcon({
                          className: 'custom-marker',
                          html: `<div style="color: ${markerColor}; font-weight:bold;">${(probability * 100).toFixed(0)}%</div>`,
                          iconSize: [30, 30],
                      }),
                  });

                  // Manejador de clic para el marcador
                  marker.on('click', () => {
                      setPopupContent(`Probabilidad: ${(probability * 100).toFixed(0)}%`);
                      setPopupVisible(true);
                  });

                  marker.addTo(mapRef.current); // Agregar el marcador al mapa
                  kmlLayerRefs.current[group][index].marker = marker; // Guardar referencia del marcador
              }

              // Manejador de clic para la capa KML
              kmlLayer.on('click', () => {
                  setPopupContent(`Capa: ${kmlGroups[group][index].name}, Probabilidad: ${(probability * 100).toFixed(0)}%`);
                  setPopupVisible(true);
              });

              // Agrega la capa al mapa si es visible
              if (layerVisibility[group]) {
                  kmlLayer.addTo(mapRef.current);
                  kmlLayerRefs.current[group][index].layer = kmlLayer;
              }
          })
          .on('error', function (e) {
              console.error("Error loading KML: ", e);
          });
  }
};

// Limpieza de intervalos cuando se desmonta el componente o se recargan capas
useEffect(() => {
  return () => {
      // Limpiar todos los intervalos de parpadeo al desmontar
      Object.keys(kmlLayerRefs.current).forEach(group => {
          Object.keys(kmlLayerRefs.current[group]).forEach(index => {
              const ref = kmlLayerRefs.current[group][index];
              if (ref.blinkInterval) {
                  clearInterval(ref.blinkInterval);
              }
          });
      });
  };
}, []);



// useEffect para actualizar las capas según la visibilidad
useEffect(() => {
  Object.keys(kmlGroups).forEach((group) => {
      kmlGroups[group].forEach((kml, kmlIndex) => {
          const { color } = kmlColors(kml); // Obtén el color

          // Condición modificada: sólo carga la capa si está activa o si está marcada en `layerVisibility`
          if (layerVisibility[group]) {
              loadKML(kml.path, color, kmlIndex, group);
          } else {
              // Aquí remueve las capas solo si `layerVisibility` está en falso
              if (kmlLayerRefs.current[group][kmlIndex].layer) {
                  mapRef.current.removeLayer(kmlLayerRefs.current[group][kmlIndex].layer);
              }
              if (kmlLayerRefs.current[group][kmlIndex].marker) {
                  mapRef.current.removeLayer(kmlLayerRefs.current[group][kmlIndex].marker);
              }
          }
      });
  });
}, [selectedLayer, layerVisibility, probabilities]);


  const handleSelectAll = (isSelected) => {
    const newVisibility = { Group1: isSelected, Group2: isSelected };
    setLayerVisibility(newVisibility);
  };

 

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer ref={mapRef} style={{ height: '100vh', width: '100%' }} center={[-33.0257, -71.5510]} zoom={13}>
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <AddGeocoderControl />
        <LayerControl selectedLayer={selectedLayer} />
        {selectedLayer === 'temperature' && <Legend />}
      </MapContainer>

      <Menu setSelectedLayer={setSelectedLayer} />

    {/* Popup Linea KMZ */}
{popupVisible && (
  <div
    id="popup"
    style={{
      position: 'absolute',
      top: '5%',
      left: '45%',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      maxWidth: '400px',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
    }}
  >
    {/* Botón de cierre en forma de "X" */}
    <button
      onClick={() => setPopupVisible(false)}
      style={{
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'none',
        border: 'none',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
      }}
    >
      &times;
    </button>

    {/* Información de las lineas al clickearlas */}
    {(() => {
      const probabilidad = parseInt(popupContent.match(/Probabilidad: (\d+)%/)[1]);
      const nombreLinea = popupContent.match(/Capa: (.*),/)[1];
      
      return (
        <>
          <div
            style={{
              width: '25%',
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: probabilidad > 70 ? 'red' : '#007bff',
            }}
          >
            {probabilidad}%
          </div>

          <div style={{ width: '75%', paddingLeft: '10px' }}>
            <p style={{ margin: 0 }}>{nombreLinea}</p>
          </div>
        </>
      );
    })()}
  </div>
)}




      {/* Popup información siguiente 3 horas*/}
      <div
        id="forecast-popup"
        style={{
          position: 'absolute',
          top: '389px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        }}
      >
        <div id="forecast-content"></div>
      </div>

    {/* Popup selección de lineas*/}
      <div
        id="line-selection-popup"
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        }}
      >
        <div>
          <input
            type="checkbox"
            onChange={(e) => handleSelectAll(e.target.checked)}
            checked={layerVisibility.Group1 && layerVisibility.Group2}
          />
          <label>TODOS</label>
          {Object.keys(kmlGroups).map((group) => (
            <div key={group}>
              <input
                type="checkbox"
                checked={layerVisibility[group]}
                onChange={() =>
                  setLayerVisibility((prev) => ({
                    ...prev,
                    [group]: !prev[group],
                  }))
                }
              />
               <label>
    {(() => {
       switch (group) {
        case 'Group1':
          return <span style={{ color: '#333' }}>Chilquinta</span>;
        case 'Group2':
          return <span style={{ color: '#333' }}>CTNG</span>;
        case 'Group3':
          return <span style={{ color: 'green', fontWeight: 'bold' }}>44kV-66kV</span>;
        case 'Group4':
          return <span style={{ color: 'orange', fontWeight: 'bold' }}>110kV</span>;
        case 'Group5':
          return <span style={{ color: 'red', fontWeight: 'bold' }}>220kV</span>;
        default:
          return <span style={{ color: '#333' }}>Grupo desconocido</span>;
      }
    })()}
  </label>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


















export default MapView;