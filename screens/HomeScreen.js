import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

import BottomTab from '../components/BottomTab';
import EscalaCard from '../components/Escalas/EscalaCard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { userId, igrejaId, isLider } = route.params || { userId: null, igrejaId: null, isLider: false };

  const [cultos, setCultos] = useState([]);
  const [isLoadingCultos, setIsLoadingCultos] = useState(true);
  const [errorCultos, setErrorCultos] = useState('');
  const [userChurchIdState, setUserChurchIdState] = useState(igrejaId);

  useEffect(() => {
    const initializeHomeData = async () => {
      setIsLoadingCultos(true);
      setErrorCultos('');
      
      let currentUserId = auth.currentUser?.uid;
      let currentIgrejaId = igrejaId;

      if (!currentUserId) {
        setErrorCultos('Usuário não autenticado. Por favor, faça login novamente.');
        setIsLoadingCultos(false);
        navigation.replace('Login');
        return;
      }

      if (!currentIgrejaId) {
        console.log("HomeScreen: igrejaId ausente na rota, buscando do perfil do usuário...");
        try {
          let foundIgrejaId = null;
          const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));

          for (const docIgreja of igrejasSnapshot.docs) {
            const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUserId);
            const usuarioDocSnap = await getDoc(usuarioDocRef);

            if (usuarioDocSnap.exists()) {
              foundIgrejaId = docIgreja.id;
              break;
            }
          }

          if (foundIgrejaId) {
            currentIgrejaId = foundIgrejaId;
            setUserChurchIdState(foundIgrejaId);
            console.log("HomeScreen: igrejaId encontrado no perfil do usuário:", currentIgrejaId);
          } else {
            setErrorCultos('Não foi possível encontrar a igreja associada ao seu usuário. Faça login novamente.');
            setIsLoadingCultos(false);
            return;
          }
        } catch (error) {
          console.error('HomeScreen: Erro ao buscar igrejaId do usuário:', error);
          setErrorCultos('Erro ao carregar dados da sua igreja. Tente novamente.');
          setIsLoadingCultos(false);
          return;
        }
      }

      if (currentUserId && currentIgrejaId) {
        console.log("HomeScreen: userId e igrejaId disponíveis. Buscando cultos...");
        buscarCultos(currentUserId, currentIgrejaId);
      } else {
        setIsLoadingCultos(false);
        setErrorCultos('Erro crítico: dados de usuário ou igreja incompletos após tentativa de busca.');

      }
    };

    initializeHomeData();
  }, [route.params]);

  const logout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Erro ao sair', error.message);
      console.error('Erro ao fazer logout:', error);
    }
  };

  const buscarCultos = async (currentUserId, currentIgrejaId) => {
    setIsLoadingCultos(true);
    setErrorCultos('');
    try {
      const escalasRef = collection(db, 'igrejas', currentIgrejaId, 'escalas');


      const q = query(escalasRef, where('usuariosEscalados', 'array-contains', currentUserId));
      const querySnapshot = await getDocs(q);

      const hoje = new Date();
      const dadosCultos = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataCulto: new Date(data.dataCulto + 'T00:00:00'),
          igrejaId: currentIgrejaId,
        };
      });

      const futuros = dadosCultos
        .filter(c => {
          return !isNaN(c.dataCulto.getTime()) && c.dataCulto >= hoje;
        })
        .sort((a, b) => a.dataCulto.getTime() - b.dataCulto.getTime());

      setCultos(futuros);
    } catch (error) {
      console.error('Erro ao buscar cultos na HomeScreen:', error);
      setErrorCultos('Erro ao carregar seus cultos. Verifique sua conexão e permissões.');
    } finally {
      setIsLoadingCultos(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Próximos Cultos</Text>

      {/* Conditional rendering for loading, error, or content */}
      {isLoadingCultos ? (
        <ActivityIndicator size="large" color="#003D29" style={styles.loadingIndicator} />
      ) : errorCultos ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorCultos}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.replace('Login')}>
            <Text style={styles.retryButtonText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          {cultos.length > 0 ? (
            cultos.map((culto) => (
              <TouchableOpacity
                key={culto.id}
                onPress={() => navigation.navigate('EscalaDetalhes', { escala: culto })}
              >
                <EscalaCard escala={culto} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noCultosText}>Você não está escalado para nenhum culto futuro no momento.</Text>
          )}

          {/* Card de doação */}
          <View style={styles.doacaoCard}>
            <Text style={styles.doacaoTitulo}>Faça uma doação!</Text>
            <Text style={styles.doacaoTexto}>Quer ajudar a manter o App ativo? Faça uma doação.</Text>
            <TouchableOpacity style={styles.botaoDoar} onPress={() => Linking.openURL('https://link.da.doacao')}>
              <Text style={styles.botaoTexto}>DOAR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* REPASSA os parâmetros para o BottomTab */}
      <BottomTab navigation={navigation} userId={userId} igrejaId={userChurchIdState} isLider={isLider} onLogout={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  scroll: {
    flex: 1,
  },
  doacaoCard: {
    backgroundColor: '#D1FAE5',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  doacaoTitulo: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#003D29',
  },
  doacaoTexto: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#555',
  },
  botaoDoar: {
    backgroundColor: '#111827',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  noCultosText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#003D29',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});