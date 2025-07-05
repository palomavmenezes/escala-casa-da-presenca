import React from 'react';
import { View, Text, Image } from 'react-native';
import theme from '../theme';

export default function MinistersGrid({ ministros, getIniciais }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
      {ministros.map((m) => (
        <View key={m.userId || m.id} style={{ alignItems: 'center', width: 80, position: 'relative', padding: 5 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.secondary }}>
            {m.foto ? (
              <Image source={{ uri: m.foto }} style={{ width: 60, height: 60, borderRadius: 30 }} />
            ) : (
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 18 }}>{getIniciais(m.nome, m.sobrenome)}</Text>
            )}
          </View>
          <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: '600', textAlign: 'center', marginTop: 2 }} numberOfLines={1}>{m.nome}</Text>
          {m.areas && <Text style={{ fontSize: 12, color: theme.colors.gray, textAlign: 'center' }} numberOfLines={2}>{m.areas}</Text>}
        </View>
      ))}
    </View>
  );
} 