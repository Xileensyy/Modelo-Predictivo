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
      bottom: '400px',
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
    layer1: true,
    layer2: true,
    layer3: true,
    layer4: true,
    layer5: true,
    layer6: true,
    layer7: true,
  });
  const [showKMLList, setShowKMLList] = useState(false); // Estado para mostrar la lista de KML
  const mapRef = useRef();

  const kmlLayerRefs = useRef([...Array(7)].map(() => null));

  const kmlPaths = [
    '/KML/LT26_Penablanca_-_Miraflores_C2_110kV_R01.kml',
    '/KML/LT34 La Pólvora - Laguna Verde 110kV R01.kml',
    '/KML/LT35_Agua_Santa_-_Miraflores_110kV_R01.kml',
    '/KML/LT37 Agua Santa - Placilla 110kV R01.kml',
    '/KML/LT38 Torquemada - Concón 110kV R01.kml',
    '/KML/LT42 Torquemada - Miraflores 110kV R01.kml',
    '/KML/LT74 Agua Santa - La Pólvora 110kV R01.kml',
  ];

  const kmlNames = [
    'Peñablanca - Miraflores',
    'La Pólvora - Laguna Verde',
    'Agua Santa - Miraflores',
    'Agua Santa - Placilla',
    'Torquemada - Concón',
    'Torquemada - Miraflores',
    'Agua Santa - La Pólvora',
  ];

  const kmlColors = [
    'red',
    'yellow',
    'yellow',
    'lime',
    'yellow',
    'yellow',
    'yellow',
  ];

// Define inicialmente la constante probabilities vacía o con valores predeterminados
const [probabilities, setProbabilities] = useState([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);

useEffect(() => {
  const intervalId = setInterval(() => {
    fetch('https://g87jo5nbme.execute-api.us-east-1.amazonaws.com/dev')
  .then(response => {
    // Verifica si la respuesta es exitosa
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    // Aquí extraemos el cuerpo (body) de la respuesta y actualizamos probabilities
    setProbabilities(data.body);
    console.log('1')
  })
  .catch(error => console.error('Error:', error));
  }, 5000)
  return () => clearInterval(intervalId)
}, []);
  const lineColors = probabilities.map((prob, index) => (prob > 0.7 ? 'black' : kmlColors[index])); //Color linea de transmision dependiendo de la probabilidad 

  const loadKML = (index, kmlPath, color) => {
    if (mapRef.current) {
      const kmlLayer = omnivore.kml(kmlPath)
        .on('ready', function () {
          kmlLayer.setStyle({ color, weight: 3, opacity: 1 }); //Estilo del KMZ

          const bounds = kmlLayer.getBounds();
          const center = bounds.getCenter();
          const probability = probabilities[index];

          if (layerVisibility[`layer${index + 1}`]) {
            const marker = L.marker(center, {
              icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="color: ${probability > 0.7 ? 'red' : 'black'}; font-weight:semibold;">${(probability * 100).toFixed(0)}%</div>`, //Color numero probabilidad
                iconSize: [30, 30]
              })
            });
            marker.addTo(mapRef.current);
            kmlLayerRefs.current[index].marker = marker; // Guardar referencia al marcador
          }
        })
        .on('error', function (e) {
          console.error(`Error loading KML: `, e);
        });

      if (kmlLayerRefs.current[index]) {
        mapRef.current.removeLayer(kmlLayerRefs.current[index].layer);
        if (kmlLayerRefs.current[index].marker) {
          mapRef.current.removeLayer(kmlLayerRefs.current[index].marker);
        }
      }

      if (layerVisibility[`layer${index + 1}`]) {
        kmlLayer.addTo(mapRef.current);
        kmlLayerRefs.current[index] = { layer: kmlLayer }; // Guardar referencia de la capa
      }
    }
  };

  const handleCheckboxChange = (layer, index) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));

    if (layerVisibility[layer]) {
      mapRef.current.removeLayer(kmlLayerRefs.current[index].layer);
      if (kmlLayerRefs.current[index].marker) {
        mapRef.current.removeLayer(kmlLayerRefs.current[index].marker);
      }
    } else {
      loadKML(index, kmlPaths[index], lineColors[index]);
    }
  };

  const toggleKMLList = () => {
    setShowKMLList(!showKMLList);
  };

  const handleSelectAll = (isSelected) => {
    const newVisibility = { ...layerVisibility };
    Object.keys(newVisibility).forEach((layer, index) => {
      newVisibility[layer] = isSelected;
      if (isSelected) {
        loadKML(index, kmlPaths[index], lineColors[index]);
      } else {
        mapRef.current.removeLayer(kmlLayerRefs.current[index].layer);
        if (kmlLayerRefs.current[index].marker) {
          mapRef.current.removeLayer(kmlLayerRefs.current[index].marker);
        }
      }
    });
    setLayerVisibility(newVisibility);
  };

  useEffect(() => {
    kmlLayerRefs.current.forEach((layer) => {
      if (layer) {
        mapRef.current.removeLayer(layer);
      }
    });

    kmlPaths.forEach((path, index) => {
      loadKML(index, path, lineColors[index]);
    });
  }, [selectedLayer, layerVisibility, probabilities, lineColors]);

  useEffect(() => {
    setLayerVisibility({
      layer1: true,
      layer2: true,
      layer3: true,
      layer4: true,
      layer5: true,
      layer6: true,
      layer7: true,
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
        <LayerControl selectedLayer={selectedLayer} />
        {selectedLayer === 'temperature' && <Legend />}
      </MapContainer>

      <Menu setSelectedLayer={setSelectedLayer} />

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
        <button onClick={toggleKMLList}>
          {showKMLList ? 'Ocultar KML' : 'Chilquinta KML'}
        </button>

        {showKMLList && (
          <div>
            <input
              type="checkbox"
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <label>Seleccionar/Deseleccionar Todos</label>
            {Object.keys(layerVisibility).map((layer, index) => {
              const probability = probabilities[index];
              return (
                <div key={layer}>
                  <input
                    type="checkbox"
                    checked={layerVisibility[layer]}
                    onChange={() => handleCheckboxChange(layer, index)}
                  />
                  <label style={{ color: probability > 0 ? 'red' : 'black' }}>
                    {kmlNames[index]}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};







export default MapView;
