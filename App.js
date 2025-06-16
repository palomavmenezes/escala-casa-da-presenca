// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // <-- IMPORTANTE

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import PerfilScreen from './screens/PerfilScreen';
import RegisterMinisterScreen from './screens/RegisterMinisterScreen';
// Importando a tela de Adicionar Músicas
import AdicionarMusicasScreen from './screens/AdicionarMusicasScreen';
import MusicasScreen from './screens/Musicas/MusicasScreen';
import DetalhesScreen from './screens/Musicas/DetalhesScreen';
// Importando as telas de Escalas
import EscalasScreen from './screens/Escalas/EscalasScreen'
import CriarEscalasScreen from './screens/Escalas/CriarEscalasScreen';
import EscalaDetalhesScreen from './screens/Escalas/EscalaDetalhesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Antes do login */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Cadastro' }} />

          {/* Após login */}
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Bem-vindo' }} />
          <Stack.Screen name="Escalas" component={EscalasScreen} />
          <Stack.Screen name="CriarEscalas" component={CriarEscalasScreen} />
          <Stack.Screen name="Musicas" component={MusicasScreen} />
          <Stack.Screen name="AdicionarMusicas" component={AdicionarMusicasScreen} />
          <Stack.Screen name="MusicaDetalhes" component={DetalhesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EscalaDetalhes" component={EscalaDetalhesScreen} options={{ title: 'Detalhes da Escala' }} />
          {/* Perfil e Membros */}
          <Stack.Screen name="Perfil" component={PerfilScreen} />
          <Stack.Screen name="Membros" component={RegisterMinisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
