import React from 'react';
import { FlatList, Text, View } from 'react-native';
import MusicaCard from './MusicaCard';
import styles from '../../screens/Musicas/AdicionarMusica.styles';

const MusicaList = ({ musicas = [], search = '', onMusicaPress }) => {
  const filtered = musicas.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()));

  if (!filtered.length) {
    return (
      <View style={{ marginTop: 20 }}>
        <Text style={{ textAlign: 'center' }}>
          Nenhuma música cadastrada para a sua igreja.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <MusicaCard
          nome={item.nome}
          autor={item.cantorOriginal}
          onPress={() => onMusicaPress(item)}
        />
      )}
      contentContainerStyle={styles.list}
    />
  );
};

export default MusicaList; 