import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMusicas } from '../../hooks/useMusicas';
import BottomTab from '../../components/layout/BottomTab';
import theme from '../../components/theme';

export default function Musicas() {
  const navigation = useNavigation();
  const {
    musicas,
    loading,
    error,
    search,
    setSearch,
    userChurchId,
  } = useMusicas();

  useEffect(() => {
    navigation.setOptions({ title: 'Lista de Músicas' });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando músicas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#232D3F" style={{ marginLeft: 8, marginRight: 6 }} />
          <TextInput
            placeholder="Buscar..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#B0B0B0"
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AdicionarMusica', { igrejaId: userChurchId })}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>ADICIONAR MÚSICA</Text>
          <Ionicons name="arrow-forward" size={22} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <FlatList
          data={musicas.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={item => item.id}
          style={{ marginTop: 10 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('MusicaDetalhes', { musica: item })}
              activeOpacity={0.85}
            >
              <View style={styles.iconBox}>
                <Ionicons name="musical-notes" size={32} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.autor} numberOfLines={1}>{(item.cantorOriginal || item.autor || 'Não preenchido').toUpperCase()}</Text>
                <Text style={styles.nomeMusica} numberOfLines={1}>{item.nome}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>Nenhuma música cadastrada para a sua igreja.</Text>}
        />
      </View>
      <BottomTab />
    </>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#232D3F',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 13,
    marginBottom: 18,
    marginTop: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#c5c5c5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  autor: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  nomeMusica: {
    color: '#232D3F',
    fontWeight: 'bold',
    fontSize: 17,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#003D29',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F6FA',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
};