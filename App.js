// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // <-- IMPORTANTE

// Importando Cadastros
import RegisterScreen from './screens/Cadastro/RegisterScreen';
import RegisterMinisterScreen from './screens/Cadastro/RegisterMinisterScreen';

// Importando telas de login e home
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PerfilScreen from './screens/PerfilScreen';

// Importando a tela de Adicionar Músicas
import AdicionarMusicasScreen from './screens/Musicas/AdicionarMusicasScreen';
import MusicasScreen from './screens/Musicas/MusicasScreen';
import DetalhesScreen from './screens/Musicas/DetalhesScreen';

// Importando as telas de Escalas
import EscalasScreen from './screens/Escalas/EscalasScreen'
import CriarEscalasScreen from './screens/Escalas/CriarEscalasScreen';
import EscalaDetalhesScreen from './screens/Escalas/EscalaDetalhesScreen';

// Importando a tela de Pagamento
import PagamentoScreen from './screens/Pagamentos/PagamentoScreen'; 
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Antes do login */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Cadastro' }} />
          <Stack.Screen name="RegisterMinister" component={RegisterMinisterScreen} options={{ title: 'Cadastro de Ministro' }} />
          <Stack.Screen name="Pagamento" component={PagamentoScreen} options={{ title: 'Detalhes de Pagamento' }} />

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
