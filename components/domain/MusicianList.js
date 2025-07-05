import React from 'react';
import { View } from 'react-native';
import MusicianCard from './MusicianCard';

export default function MusicianList({ musicians, onEditAreas, onRemove }) {
  return (
    <View>
      {musicians.map((m, idx) => (
        <MusicianCard
          key={m.userId || idx}
          nome={m.nome}
          foto={m.foto}
          iniciais={m.iniciais}
          areas={m.areas}
          onEditAreas={() => onEditAreas(m)}
          onRemove={() => onRemove(m)}
        />
      ))}
    </View>
  );
} 