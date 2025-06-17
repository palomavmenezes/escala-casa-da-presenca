import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import BottomTab from '../../components/BottomTab';

export default function MusicasScreen() {
  const navigation = useNavigation();
  const [musicas, setMusicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const carregarMusicas = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'musicas'));
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMusicas(lista);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      carregarMusicas();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('MusicaDetalhes', { musica: item })}
    >
      <View style={styles.iconBox}>
        <Ionicons name="musical-notes" size={28} color="white" />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.autor}>{item.autor || 'AUTOR DESCONHECIDO'}</Text>
        <Text style={styles.nome}>{item.nome}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6ACF9E" style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Buscar..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor="#ccc"
        />
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AdicionarMusicas')}
      >
        <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.addButtonText}>Adicionar Música</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#003D29" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={musicas.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              Nenhuma música cadastrada.
            </Text>
          }
        />
      )}
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    flexDirection: 'row',
    backgroundColor: '#2F4F4F',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginLeft: 8,
  },
  filterText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#2F4F4F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  autor: {
    color: '#6ACF9E',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  nome: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6ACF9E',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
