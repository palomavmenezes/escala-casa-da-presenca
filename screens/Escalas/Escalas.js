import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator, // Added for loading indicator
  Alert // Added for displaying error alerts
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../../services/firebase'; // Import auth
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore'; // Import doc, getDoc, query, where
import EscalaCard from '../../components/Escalas/EscalaCard';
import BottomTab from '../../components/BottomTab';

export default function Escalas() {
  const navigation = useNavigation();
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(true); // New state for loading
  const [userChurchId, setUserChurchId] = useState(null); // New state for church ID
  const [telaErro, setTelaErro] = useState(''); // State to display errors

  // Function to fetch the user's church ID
  const fetchUserChurchId = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setTelaErro('Usuário não autenticado. Faça login para ver as escalas.');
      return null;
    }

    try {
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

  const fetchEscalas = async () => {
    setLoading(true);
    setTelaErro(''); // Clear previous errors

    const idDaIgreja = await fetchUserChurchId();

    if (!idDaIgreja) {
      setLoading(false);
      return; // Stop if church ID not found or error occurred
    }

    setUserChurchId(idDaIgreja); // Store the found church ID

    try {
      // Query 'escalas' subcollection within the specific church
      const escalasRef = collection(db, 'igrejas', idDaIgreja, 'escalas');
      // Optional: Add a query to filter by date directly in Firestore for efficiency
      const hoje = new Date();
      const snapshot = await getDocs(escalasRef);

      const escalasData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          // Convert dataCulto to Date object. Assuming data.dataCulto is a string like "YYYY-MM-DD"
          return {
            id: doc.id,
            ...data,
            dataCulto: new Date(data.dataCulto + 'T00:00:00'), // Add T00:00:00 to ensure correct date interpretation
          };
        })
        .filter(e => !isNaN(e.dataCulto) && e.dataCulto >= hoje) // Filter dates from today onwards
        .sort((a, b) => a.dataCulto.getTime() - b.dataCulto.getTime()); // Sort by date

      setEscalas(escalasData);
    } catch (error) {
      console.error('Erro ao buscar escalas da igreja:', error);
      setTelaErro('Erro ao carregar as escalas da sua igreja. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect to reload data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchEscalas();
    }, [])
  );

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando escalas...</Text>
      </View>
    );
  }

  // Render error state
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
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Escalas</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CriarEscalas', { igrejaId: userChurchId })} // Pass userChurchId
          >
            <Text style={styles.addButtonText}>+ Nova escala</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subTitle}>Próximas escalas</Text>

        <FlatList
          data={escalas}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('EscalaDetalhes', { escala: { ...item, igrejaId: userChurchId } })}>
              {/* ADICIONADO: Garantindo que igrejaId seja passado para DetalhesEscala */}
              <EscalaCard escala={item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma escala futura cadastrada para a sua igreja.</Text>}
        />
      </View>
      <BottomTab />
    </>
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
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003D29',
  },
  addButton: {
    backgroundColor: '#003D29',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  subTitle: {
    fontSize: 16,
    color: '#003D29',
    marginBottom: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
    marginTop: 20,
  },
});