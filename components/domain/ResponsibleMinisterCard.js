import React from 'react';
import { View, Text, Image } from 'react-native';
import theme from '../theme';

export default function ResponsibleMinisterCard({ nome, sobrenome, foto, getIniciais }) {
  return (
    <View style={{ backgroundColor: theme.colors.primary, borderRadius: 30, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
      {foto ? (
        <Image source={{ uri: foto }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: theme.colors.secondary, marginRight: 12 }} />
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 18 }}>{getIniciais(nome, sobrenome)}</Text>
        </View>
      )}
      <View>
        <Text style={{ color: theme.colors.secondary, fontSize: 15 }}>Criador do Repertório</Text>
        <Text style={{ color: '#fff', fontSize: 16 }}>{nome} {sobrenome}</Text>
      </View>
    </View>
  );
} 