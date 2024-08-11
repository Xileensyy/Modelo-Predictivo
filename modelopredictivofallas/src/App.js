import React from 'react';  // Importa React
import { StyleSheet, Text, View } from 'react-native';  // Importa componentes y API de estilos de React Native

// Define el componente App
export default function App() {
  return (
    // Usa el componente View como contenedor principal
    <View style={styles.container}>
      {/* Usa el componente Text para mostrar texto */}
      <Text>¡Hola, React Native Web!</Text>
    </View>
  );
}

// Define estilos para los componentes usando StyleSheet de React Native
const styles = StyleSheet.create({
  container: {
    flex: 1,  // Hace que el contenedor ocupe todo el espacio disponible
    justifyContent: 'center',  // Centra el contenido verticalmente
    alignItems: 'center',  // Centra el contenido horizontalmente
    backgroundColor: '#F5FCFF',  // Establece el color de fondo
  },
  welcome: {
    fontSize: 20,  // Tamaño de fuente
    textAlign: 'center',  // Alineación del texto
    margin: 10,  // Margen alrededor del texto
  },
});

