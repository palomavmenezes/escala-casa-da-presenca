import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy, // Certifique-se de importar orderBy
  limit,   // Certifique-se de importar limit
} from 'firebase/firestore';

import Menu from './Menu/Menu';
import styles from './Home.styles';

import BottomTab from '../components/BottomTab';
import EscalaCard from '../components/Escalas/EscalaCard';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const navigation = useNavigation();
  const route = useRoute();

  const { userId: paramUserId, igrejaId: paramIgrejaId, isLider = false, isMinisterForCults = false } = route.params || {};

  const [cultos, setCultos] = useState([]);
  const [isLoadingCultos, setIsLoadingCultos] = useState(true);
  const [errorCultos, setErrorCultos] = useState('');
  const [userChurchIdState, setUserChurchIdState] = useState(paramIgrejaId);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const initializeHomeData = async () => {
      setIsLoadingCultos(true);
      setErrorCultos('');

      const currentUserId = auth.currentUser?.uid || paramUserId;
      let currentIgrejaId = paramIgrejaId || userChurchIdState;

      if (!currentUserId) {
        setErrorCultos('Usuário não autenticado. Por favor, faça login novamente.');
        setIsLoadingCultos(false);
        navigation.replace('Login');
        return;
      }

      if (!currentIgrejaId) {
        try {
          const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));

          let foundIgrejaId = null;
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
          } else {
            setErrorCultos('Não foi possível encontrar a igreja associada ao seu usuário. Faça login novamente.');
            setIsLoadingCultos(false);
            return;
          }
        } catch (error) {
          setErrorCultos('Erro ao buscar dados da igreja. Verifique sua conexão.');
          setIsLoadingCultos(false);
          return;
        }
      }

      if (currentUserId && currentIgrejaId) {
        await buscarCultos(currentUserId, currentIgrejaId);
        await fetchUnreadNotificationsCount(currentIgrejaId, currentUserId);
      } else {
        setErrorCultos('Erro crítico: dados incompletos após tentativa de busca.');
      }
      setIsLoadingCultos(false);
    };

    initializeHomeData();
  }, [route.params]);

  const logout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Erro ao sair', error.message);
    }
  };

  const buscarCultos = async (currentUserId, currentIgrejaId) => {
    try {
      const escalasRef = collection(db, 'igrejas', currentIgrejaId, 'escalas');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Define para o início do dia atual, ignorando a hora

      // --- PRIMEIRA CONSULTA: Escalas onde o usuário é o 'criadoPor' ---
      const qCriador = query(
        escalasRef,
        where('criadoPor', '==', currentUserId),
        where('dataCulto', '>=', hoje.toISOString().split('T')[0]), // Compara com string 'AAAA-MM-DD'
        orderBy('dataCulto', 'asc')
      );
      const snapshotCriador = await getDocs(qCriador);

      let allFutureScales = [];

      snapshotCriador.forEach(doc => {
        const data = doc.data();
        allFutureScales.push({
          id: doc.id,
          ...data,
          dataCulto: new Date(data.dataCulto + 'T00:00:00'), // Converte para Date object
          igrejaId: currentIgrejaId,
        });
      });

      // --- SEGUNDA CONSULTA: Buscar TODAS as escalas futuras e filtrar no frontend ---
      // Esta abordagem é necessária porque 'array-contains' em objetos ({userId, roles})
      // não permite buscar apenas pelo 'userId' dentro do objeto de forma flexível no Firestore.
      // E o Firestore não suporta queries OR diretas para múltiplos campos.
      const qAllFuture = query(
        escalasRef,
        where('dataCulto', '>=', hoje.toISOString().split('T')[0]),
        orderBy('dataCulto', 'asc')
      );
      const snapshotAllFuture = await getDocs(qAllFuture);

      snapshotAllFuture.forEach(doc => {
        const data = doc.data();
        // Verifica se o usuário atual está em 'usuariosEscalados' por userId
        const isUserInvolvedAsEscalado = data.usuariosEscalados?.some(
          escalado => escalado.userId === currentUserId
        );
        const isAlreadyAdded = allFutureScales.some(s => s.id === doc.id); // Evita duplicatas de escalas

        if (isUserInvolvedAsEscalado && !isAlreadyAdded) {
          allFutureScales.push({
            id: doc.id,
            ...data,
            dataCulto: new Date(data.dataCulto + 'T00:00:00'), // Converte para Date object
            igrejaId: currentIgrejaId,
          });
        }
      });

      // --- ORDENAR TODOS OS CULTOS COMBINADOS E LIMITAR AOS 5 MAIS PRÓXIMOS ---
      const cultosFinais = allFutureScales
        .sort((a, b) => a.dataCulto.getTime() - b.dataCulto.getTime())
        .slice(0, 5); // Limita aos 5 mais próximos

      setCultos(cultosFinais);

    } catch (error) {
      console.error('Erro ao buscar cultos:', error);
      setErrorCultos('Erro ao carregar seus cultos. Verifique sua conexão e permissões.');
    }
  };

  const fetchUnreadNotificationsCount = async (currentIgrejaId, currentUserId) => {
    try {
      // Ajuste para ler as notificações da subcoleção do usuário
      const notificationsRef = collection(db, 'igrejas', currentIgrejaId, 'usuarios', currentUserId, 'notificacoes');
      const qNotifications = query(
        notificationsRef,
        where('read', '==', false)
      );
      const notificationsSnap = await getDocs(qNotifications);
      setUnreadNotificationsCount(notificationsSnap.size);
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas na Home:', error);
      setUnreadNotificationsCount(0); // Em caso de erro, assume 0
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar / Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
          <Ionicons name="menu" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notificacoes')}>
          <Ionicons name="notifications-outline" size={30} color="#333" />
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Próximos Cultos</Text>

      {/* Renderização condicional para carregamento, erro ou conteúdo */}
      {isLoadingCultos ? (
        <ActivityIndicator size="large" color="#003D29" style={styles.loadingIndicator} />
      ) : errorCultos ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorCultos}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setErrorCultos('');
              setIsLoadingCultos(true);
              navigation.replace('Home');
            }}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          {cultos.length > 0 ? (
            cultos.map((culto) => (
              <TouchableOpacity
                key={culto.id}
                onPress={() => navigation.navigate('EscalaDetalhes', { escala: { id: culto.id, igrejaId: culto.igrejaId } })}
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

      {/* Componente Menu (Modal) */}
      <Menu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userId={paramUserId}
        igrejaId={userChurchIdState}
        isLider={isLider}
        isMinisterForCults={isMinisterForCults}
      />

      {/* REPASSA os parâmetros para o BottomTab */}
      <BottomTab
        navigation={navigation}
        userId={paramUserId}
        igrejaId={userChurchIdState}
        isLider={isLider}
        isMinisterForCults={isMinisterForCults}
      />
    </View>
  );
}