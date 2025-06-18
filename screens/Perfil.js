import React from 'react';
import { View, Text } from 'react-native';
import { auth } from '../services/firebase';

export default function Perfil() {
  const user = auth.currentUser;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Seu Perfil</Text>
      {user ? (
        <View style={{ marginTop: 10 }}>
          <Text>Email: {user.email}</Text>
          <Text>ID: {user.uid}</Text>
        </View>
      ) : (
        <Text>Usuário não encontrado.</Text>
      )}
    </View>
  );
}
