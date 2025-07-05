import React from 'react';
import { View, Image, Text } from 'react-native';
import { useUser } from '../../contexts/UserContext';

export default function GroupLogo({ size = 60, style }) {
  const { userProfile } = useUser();
  const logo = userProfile?.logo;
  const nomeIgreja = userProfile?.nomeIgreja || 'Sua Igreja';



  if (logo) {
    return (
      <Image
        source={{ uri: logo }}
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#eee' }, style]}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: '#888', fontWeight: 'bold', fontSize: size / 4, textAlign: 'center' }}>{nomeIgreja}</Text>
    </View>
  );
} 