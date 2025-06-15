import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const logout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace('Login');
      })
      .catch(error => alert(error.message));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Grupo de Louvor!</Text>

      <View style={styles.menu}>
        <Button title="Dashboard" onPress={() => navigation.navigate('Dashboard')} />
      </View>
      <View style={styles.menu}>
        <Button title="Escalas" onPress={() => navigation.navigate('Escalas')} />
      </View>
      <View style={styles.menu}>
        <Button title="Perfil" onPress={() => navigation.navigate('Perfil')} />
      </View>
      <View style={styles.menu}>
        <Button title="Membros" onPress={() => navigation.navigate('Membros')} />
      </View>

      <View style={{ marginTop: 30 }}>
        <Button title="Sair" color="red" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 30, textAlign: 'center' },
  menu: { marginBottom: 15 },
});
