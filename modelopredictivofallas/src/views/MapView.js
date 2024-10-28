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
      bottom: '130px',
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
      { name: 'LT02 66kV', path: '/KML/LT01 Las Vegas - FFCC.Rungue 44kV R01.kml' },
      { name: 'Las Vegas FFCC - San Pedro', path: '/KML/LT03 Las Vegas FFCC - San Pedro C1 y C2 44kV R01.kml' },
      { name: 'Pachacama - La Calera 44kV', path: '/KML/LT04 Pachacama - La Calera 44kV R01.kml' },
      { name: 'Las Vegas - Estancilla', path: '/KML/LT07 Las Vegas - Estancilla 44kV R01.kml' },
      { name: 'Las Vegas FFCC - Los Andes', path: '/KML/LT07 Las Vegas FFCC - Los Andes C1 y C2 44kV R01.kml' },
      { name: 'Los Andres - Hermanos Clark', path: '/KML/LT08 Los Andres - Hermanos Clark 44kV (Juncal) R01.kml' },
      { name: 'La Calera - El Melon', path: '/KML/LT09 La Calera - El Melon 44kV R02.kml' },
      { name: 'Catemu - Los Ángeles', path: '/KML/LT11 Catemu - Los Ángeles 44kV R01.kml' },
      { name: 'Arranque - San Felipe 44kV', path: '/KML/LT22 Arranque San Felipe 44kV R01.kml' },
      { name: 'El Melón - Túnel', path: '/KML/LT25 El Melón - Túnel El Melón 44kV R01.kml' },
      { name: 'Estancilla - Catemu', path: '/KML/LT57 Estancilla - Catemu 44kV R01.kml' },
      { name: 'Laguna Verde - San Antonio', path: '/KML/LT12 C2 Laguna Verde San Antonio 66KV R02.kml' }, 
      { name: 'Arranque - San Sebastian', path: '/KML/LT15 Arranque San Sebastian C2 Y C1 66kV R01.kml' }, 
      { name: 'Litoral Central - Casablanca C1', path: '/KML/LT16 Litoral Central Casablanca C1 66kV R01.kml' },
      { name: 'Litoral Central - San Jerónimo', path: '/KML/LT63 Litoral Central San Jerónimo 66kV R01.kml' },
      // Añade más elementos de 44kV-66kV según sea necesario
    ],
    Group4: [
      { name: 'San Pedro - Miraflores', path: '/KML/LT02 San Pedro - Miraflores CTO N° 1 110 kV R01.kml' },
      { name: 'La Pólvora - Valparaíso', path: '/KML/LT13 La Pólvora - Valparaíso 110kV R01.kml' },
      { name: 'Achupallas - Concón', path: '/KML/LT14 Achupallas - Concón 110kV R01.kml' },
      { name: 'Arranque - Placeres', path: '/KML/LT17 Arranque Placeres 110kV R00.kml' }, //
      { name: 'Arranque - Quilpué', path: '/KML/LT18 Arranque Quilpué 110kV R01.kml' },
      { name: 'Arranque - San Rafael', path: '/KML/LT21 Arranque San Rafael 110kV R00.kml' }, 
      { name: 'La Pólvora - Playa Ancha', path: '/KML/LT23 La Pólvora - Playa Ancha 110kV R01.kml' },
      { name: 'Arranque - Reñaca', path: '/KML/LT24 Arranque Reñaca 110kV R01.kml' }, //
      { name: 'Peñablanca - Miraflores', path: '/KML/LT26 Peñablanca - Miraflores C2 110kV R01.kml' },
      { name: 'Melipilla - San Antonio', path: '/KML/LT28 Melipilla - San Antonio C1 Leyda C2 110kV R01.kml' },
      { name: 'Arranque - San Felipe 110kV', path: '/KML/LT29 Arranque San Felipe 110kV R01.kml' }, //
      { name: 'La Pólvora - Laguna Verde', path: '/KML/LT34 La Pólvora - Laguna Verde 110kV R01.kml' },
      { name: 'Agua Santa - Miraflores', path: '/KML/LT35 Agua Santa - Miraflores 110kV R01.kml' },
      { name: 'Las Vegas - Cristalería', path: '/KML/LT36 Las Vegas - Cristalería 110kV R01.kml' },
      { name: 'Agua Santa - Placilla', path: '/KML/LT37 Agua Santa - Placilla 110kV R01.kml' },
      { name: 'Torquemada - Concón', path: '/KML/LT38 Torquemada - Concón 110kV R01.kml' },
      { name: 'Concón - Bosquemar', path: '/KML/LT39 Concón - Bosquemar 110kV R01.kml' },
      { name: 'San Pedro - Peñablanca', path: '/KML/LT40 San Pedro - Peñablanca C2 110kV R01.kml' },
      { name: 'Arranque - Mayaca', path: '/KML/LT51 Arranque Mayaca 110kV R01.kml' }, //
      { name: 'Agua Santa - La Pólvora', path: '/KML/LT74 Agua Santa - La Pólvora 110kV R01.kml' },
      { name: 'Ventanas - Torquemada', path: '/KML/LT41 Ventanas - Torquemada 110kV R01.kml' },
      { name: 'Torquemada - Miraflores', path: '/KML/LT42 Torquemada - Miraflores 110kV R01.kml' },
      { name: 'Subterránea Ventanas', path: '/KML/LT43 Subterránea Ventanas - Quintero R01.kml' }, //110kv?
      { name: 'Ventanas - San Pedro', path: '/KML/LT44 Ventanas - San Pedro 110kV R02.kml' },
      { name: 'Quillota - San Pedro', path: '/KML/LT45 Quillota - San Pedro 110kV R01.kml' },
      { name: 'San Pedro - Las Vegas', path: '/KML/LT46 San Pedro - Las Vegas 110kV R01.kml' },
      { name: 'Pachacama - La Calera 110kV', path: '/KML/LT47 Pachacama - La Calera 110kV R01.kml' },
      { name: 'Cerro Navia - Las Vegas', path: '/KML/LT48 Cerro Navia - Las Vegas 110kV R03.kml' },
      { name: 'Seccionadora Ventanas - Puchuncaví - Torquemada', path: '/KML/LT75 Seccionadora Ventanas - Puchuncaví - Torquemada (C2) 110kV R01.kml' },
       //
      // Añade más elementos de 110kV según sea necesario
    ],
    Group5: [
      { name: 'San Luis - Agua Santa', path: '/KML/LT30 San Luis - Agua Santa 220kV R01.kml' },
      // Añade más elementos de 220kV según sea necesario
    ],
  };

  const kmlColors = (line) => {
    const color = line.color || 'defaultColor'; // Si color no está definido, usa un color por defecto
    const probabilidad = line.probabilidad || 0; // Si probabilidad no está definida, usa un valor predeterminado
    return { color, probabilidad };
  };
 

  const [probabilities, setProbabilities] = useState({
    Group1: [0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ,0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,0.0, 0.0,0.0, 0.0,0.0, 0.0, 0.0,0.0, 0.0,0.0, 0.0,0.0, 0.0,0.0, 0.0, 0.0,0.0, 0.0,0.0,],
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

  //Color de linea
const lineColors = Object.keys(kmlGroups).flatMap(group => {
  return kmlGroups[group].map((line, index) => {
      const probabilidad = probabilities[group] && probabilities[group][index] !== undefined 
                           ? probabilities[group][index] 
                           : 0; // Proporcionar un valor predeterminado si no existe
      const color = probabilidad > 0.7 ? 'black' : kmlColors(line).color;
      return color;
  });
});

  const loadKML = (kmlPath, color, index, group) => {
    if (mapRef.current) {
      const kmlLayer = omnivore.kml(kmlPath)
        .on('ready', function () {
          kmlLayer.setStyle({ color, weight: 3, opacity: 1 });
          const bounds = kmlLayer.getBounds();
          const center = bounds.getCenter();
          const probability = probabilities[group][index]; // Cambiado para acceder correctamente

          const marker = L.marker(center, {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div style="color: ${probability > 0.7 ? 'red' : 'black'}; font-weight:bold;">${(probability * 100).toFixed(0)}%</div>`,
              iconSize: [30, 30]
            })
          });

          marker.on('click', () => {
            setPopupContent(`Probabilidad: ${(probability * 100).toFixed(0)}%`);
            setPopupVisible(true);
          });

          marker.addTo(mapRef.current);
          kmlLayerRefs.current[group][index].marker = marker;

          kmlLayer.on('click', () => {
            setPopupContent(`Capa: ${kmlGroups[group][index].name}, Probabilidad: ${(probability * 100).toFixed(0)}%`);
            setPopupVisible(true);
          });

          if (layerVisibility[group]) {
            kmlLayer.addTo(mapRef.current);
            kmlLayerRefs.current[group][index].layer = kmlLayer;
          }
        })
        .on('error', function (e) {
          console.error("Error loading KML: ", e);
        });

      if (kmlLayerRefs.current[group][index].layer) {
        mapRef.current.removeLayer(kmlLayerRefs.current[group][index].layer);
        if (kmlLayerRefs.current[group][index].marker) {
          mapRef.current.removeLayer(kmlLayerRefs.current[group][index].marker);
        }
      }
    }
  };

  const handleSelectAll = (isSelected) => {
    const newVisibility = { Group1: isSelected, Group2: isSelected };
    setLayerVisibility(newVisibility);
  };

  useEffect(() => {
    Object.keys(kmlGroups).forEach((group) => {
      kmlGroups[group].forEach((kml, kmlIndex) => {
        loadKML(kml.path, lineColors[kmlIndex], kmlIndex, group);
      });
    });
  }, []); // Solo se ejecuta una vez al montar

  useEffect(() => {
    Object.keys(kmlGroups).forEach((group) => {
      kmlGroups[group].forEach((kml, kmlIndex) => {
        if (layerVisibility[group]) {
          loadKML(kml.path, lineColors[kmlIndex], kmlIndex, group);
        } else {
          if (kmlLayerRefs.current[group][kmlIndex].layer) {
            mapRef.current.removeLayer(kmlLayerRefs.current[group][kmlIndex].layer);
          }
          if (kmlLayerRefs.current[group][kmlIndex].marker) {
            mapRef.current.removeLayer(kmlLayerRefs.current[group][kmlIndex].marker);
          }
        }
      });
    });
  }, [layerVisibility, probabilities, lineColors]);

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

      {/* Popup liviano */}
      {popupVisible && (
        <div
          id="popup"
          style={{
            position: 'absolute',
            top: '5%',
            left: '45%',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0 0 5px rgba(0,0,0,0.2)',
          }}
        >
          <h2>Información</h2>
          <p>{popupContent}</p>
          <button onClick={() => setPopupVisible(false)}>Cerrar</button>
        </div>
      )}

      {/* Forecast Popup reintegrado */}
      <div
        id="forecast-popup"
        style={{
          position: 'absolute',
          top: '400px',
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

      <div
        id="line-selection-popup"
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '10px',
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
          return 'Chilquinta';
        case 'Group2':
          return 'CTNG';
        case 'Group3':
          return '44kV-66kV';
        case 'Group4':
          return '110kV';
        case 'Group5':
          return '220kV';
        default:
          return 'Grupo desconocido';
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