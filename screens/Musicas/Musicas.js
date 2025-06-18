import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Image, Alert // Added Alert for error messages
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, doc, getDoc, query } from 'firebase/firestore'; // Imported doc, getDoc, query
import { db, auth } from '../../services/firebase'; // Imported auth
import { Ionicons } from '@expo/vector-icons';
import BottomTab from '../../components/BottomTab';

export default function Musicas() {
  const navigation = useNavigation();
  const [musicas, setMusicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userChurchId, setUserChurchId] = useState(null); // New state to store the user's church ID
  const [telaErro, setTelaErro] = useState(''); // State to display errors

  // Function to load the user's church ID
  const fetchUserChurchId = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setTelaErro('Usuário não autenticado. Faça login para ver as músicas.');
        return null;
      }

      let foundIgrejaId = null;
      // Query all 'igrejas' to find the one the user belongs to
      const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));

      for (const docIgreja of igrejasSnapshot.docs) {
        const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
        const usuarioDocSnap = await getDoc(usuarioDocRef);

        if (usuarioDocSnap.exists()) {
          foundIgrejaId = docIgreja.id;
          break;
        }
      }

      if (!foundIgrejaId) {
        setTelaErro('Não foi possível encontrar a igreja associada ao seu usuário.');
        return null;
      }
      return foundIgrejaId;

    } catch (error) {
      console.error('Erro ao buscar ID da igreja do usuário:', error);
      setTelaErro('Erro ao carregar dados da sua igreja.');
      return null;
    }
  };

  const carregarMusicas = async () => {
    setLoading(true);
    setTelaErro(''); // Clear previous errors

    const idDaIgreja = await fetchUserChurchId();

    if (!idDaIgreja) {
      setLoading(false);
      return; // Stop if church ID not found or error occurred
    }

    setUserChurchId(idDaIgreja); // Set the user's church ID once found

    try {
      // Query 'musicas' subcollection within the specific church
      const musicasRef = collection(db, 'igrejas', idDaIgreja, 'musicas');
      const snap = await getDocs(musicasRef);
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMusicas(lista);
    } catch (error) {
      console.error('Erro ao buscar músicas da igreja:', error);
      setTelaErro('Erro ao carregar as músicas da sua igreja.');
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
        {/* 'cantorOriginal' from your new structure corresponds to 'autor' in your old rendering */}
        <Text style={styles.autor}>{item.cantorOriginal || 'AUTOR DESCONHECIDO'}</Text>
        <Text style={styles.nome}>{item.nome}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando músicas...</Text>
      </View>
    );
  }

  if (telaErro) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{telaErro}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        onPress={() => navigation.navigate('AdicionarMusica', { igrejaId: userChurchId })} // Pass userChurchId to AdicionarMusica
      >
        <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.addButtonText}>Adicionar Música</Text>
      </TouchableOpacity>

      <FlatList
        data={musicas.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            Nenhuma música cadastrada para a sua igreja.
          </Text>
        }
      />
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
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
  // Added for error container button consistency
  button: {
    backgroundColor: '#6ACF9E',
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
    width: '80%', // Adjust width as needed
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
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