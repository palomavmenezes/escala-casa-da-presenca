import React from 'react';
import { View, Text, Button } from 'react-native';
import { auth } from '../services/firebase';

export default function DashboardScreen({ navigation }) {
  const logout = () => {
    auth.signOut().then(() => {
      navigation.replace('Login');
    });
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Bem-vindo à Dashboard!</Text>
      <Button title="Ver Escalas" onPress={() => navigation.navigate('Escalas')} />
      <Button title="Perfil" onPress={() => navigation.navigate('Perfil')} />
      <Button title="Membros" onPress={() => navigation.navigate('Membros')} />
      <Button title="Sair" onPress={logout} color="red" />
    </View>
  );
}
