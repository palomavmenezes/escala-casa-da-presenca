// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';

import DashboardScreen from './screens/DashboardScreen';
import EscalasScreen from './screens/EscalasScreen';
import PerfilScreen from './screens/PerfilScreen';
import MembrosScreen from './screens/RegisterMinisterScreen';
import RegisterMinisterScreen from './screens/RegisterMinisterScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Antes do login */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Cadastro' }} />

        {/* Após login */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Bem-vindo' }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Escalas" component={EscalasScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="Membros" component={RegisterMinisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
