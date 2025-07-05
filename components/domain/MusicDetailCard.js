import React from 'react';
import { View, Text } from 'react-native';
import theme from '../theme';

export default function MusicDetailCard({ musica }) {
  return (
    <View style={{ backgroundColor: theme.colors.white, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>{musica.nome}</Text>
      <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'center' }}>
        <Text style={{ color: theme.colors.secondary, fontWeight: '600', fontSize: 14, marginRight: 10 }}>Tom: {musica.tom}</Text>
        {musica.cantor && (
          <Text style={{ color: theme.colors.primary, fontSize: 14 }}>Cantor: <Text style={{ fontWeight: '600' }}>{musica.cantor}</Text></Text>
        )}
      </View>
      {musica.observacao && (
        <Text style={{ color: theme.colors.gray, fontSize: 13, marginTop: 4 }}>{musica.observacao}</Text>
      )}
    </View>
  );
} 