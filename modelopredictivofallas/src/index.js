import { AppRegistry } from 'react-native';  // Importa AppRegistry de React Native
import App from './App';  // Importa el componente principal App
import reportWebVitals from './reportWebVitals';  // Importa la herramienta para medir el rendimiento

// Registra el componente principal de la aplicación
AppRegistry.registerComponent('nombre-del-proyecto', () => App);

// Ejecuta la aplicación, renderizándola en el elemento con id 'root'
AppRegistry.runApplication('nombre-del-proyecto', {
  initialProps: {},
  rootTag: document.getElementById('root')
});

// Llama a reportWebVitals para medir y reportar el rendimiento
reportWebVitals();
