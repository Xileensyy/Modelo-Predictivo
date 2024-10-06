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


//Simulación de obtención de datos API
const getElectricFailureData = async () => {
  return [
    {
      id: 1,
      lat: -33.0257,
      lng: -71.5510,
      severity: 'Alta',
      time: '23:00',
      cause: 'Viento fuerte',
      probability:'999%',

    },
    {
      id: 2,
      lat: -33.0357,
      lng: -71.5610,
      severity: 'Media',
      time: '23:30',
      cause: 'Sobrecalentamiento',
      probability:'999%',
    },
    // Más fallas eléctricas...
  ];
};


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
      bottom: '200px',
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
    layer1: false,
    layer2: false,
    layer3: false,
    layer4: false,
    layer5: false,
    layer6: false,
    layer7: false,
  });
  const mapRef = useRef();

  const kmlLayerRefs = useRef([
    null, // kmlLayerRef1
    null, // kmlLayerRef2
    null, // kmlLayerRef3
    null, // kmlLayerRef4
    null, // kmlLayerRef5
    null, // kmlLayerRef6
    null, // kmlLayerRef7
  ]);

  const kmlPaths = [
    '/KML/LT26_Penablanca_-_Miraflores_C2_110kV_R01.kml',
    '/KML/LT34 La Pólvora - Laguna Verde 110kV R01.kml',
    '/KML/LT35_Agua_Santa_-_Miraflores_110kV_R01.kml',
    '/KML/LT37 Agua Santa - Placilla 110kV R01.kml',
    '/KML/LT38 Torquemada - Concón 110kV R01.kml',
    '/KML/LT42 Torquemada - Miraflores 110kV R01.kml',
    '/KML/LT74 Agua Santa - La Pólvora 110kV R01.kml',
  ];

  // Nombres personalizados para cada KML
  const kmlNames = [
    'Peñablanca - Miraflores',
    'La Pólvora - Laguna Verde',
    'Agua Santa - Miraflores',
    'Agua Santa - Placilla',
    'Torquemada - Concón',
    'Torquemada - Miraflores',
    'Agua Santa - La Pólvora',
  ];

  // Colores para cada KML
  const kmlColors = [
    'red',
    'yellow',
    'yellow',
    'lime',
    'yellow',
    'yellow',
    'yellow',
  ];

  const loadKML = (index, kmlPath, color) => {
    if (mapRef.current) {
      const kmlLayer = omnivore.kml(kmlPath)
        .on('ready', function () {
          kmlLayer.setStyle({ color, weight: 2, opacity: 1 });
        })
        .on('error', function (e) {
          console.error(`Error loading KML: `, e);
        });

      if (kmlLayerRefs.current[index]) {
        mapRef.current.removeLayer(kmlLayerRefs.current[index]);
      }

      // Añadir el KML solo si su capa está visible
      if (layerVisibility[`layer${index + 1}`]) {
        kmlLayer.addTo(mapRef.current);
      }
      kmlLayerRefs.current[index] = kmlLayer;
    }
  };

  useEffect(() => {
    // Limpiar capas KML existentes al cambiar de capa
    kmlLayerRefs.current.forEach((layer) => {
      if (layer) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Cargar los KMLs según la visibilidad y el color correspondiente
    kmlPaths.forEach((path, index) => {
      loadKML(index, path, kmlColors[index]);
    });
  }, [selectedLayer, layerVisibility]);

  const handleCheckboxChange = (layer) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  useEffect(() => {
    // Reiniciar la visibilidad al cargar el componente
    setLayerVisibility({
      layer1: false,
      layer2: false,
      layer3: false,
      layer4: false,
      layer5: false,
      layer6: false,
      layer7: false,
    });
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer ref={mapRef} style={{ height: '100vh', width: '100%' }} center={[-33.0257, -71.5510]} zoom={13}>
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <AddGeocoderControl />
        <AddFailureMarkers />
        <LayerControl selectedLayer={selectedLayer} />
        {selectedLayer === 'temperature' && <Legend />}
      </MapContainer>
  
      <Menu setSelectedLayer={setSelectedLayer} />
  
      {/* Contenedor para las predicciones meteorológicas */}
      <div
        id="forecast-popup"
        style={{
          position: 'absolute',
          top: '400px',
          left: '10px', // Cambiado para que no se superponga
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        }}
      >
        <div id="forecast-content"></div>
      </div>
  
      {/* Contenedor para los filtros de selección de líneas */}
      <div
        id="line-selection-popup"
        style={{
          position: 'absolute',
          bottom: '30px',  // Ajustado para evitar superposición
          right: '10px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        }}
      >
        {Object.keys(layerVisibility).map((layer, index) => (
          <div key={layer}>
            <input
              type="checkbox"
              checked={layerVisibility[layer]}
              onChange={() => handleCheckboxChange(layer)}
            />
            <label>{kmlNames[index]}</label> {/* Usamos nombres personalizados aquí */}
          </div>
        ))}
      </div>
    </div>
  );
  
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
            Causa: ${failure.cause}<br>
            Probabilidad de ocurrencia: ${failure.probability}<br>
          `)
          .openPopup();
      });
    };

    loadFailureMarkers();
  }, [map]);

  return null;
};


export default MapView;
