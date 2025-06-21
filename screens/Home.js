import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

import Menu from './Menu/Menu';
import styles from './Home.styles'; // Importa os estilos da Home

import BottomTab from '../components/BottomTab';
import EscalaCard from '../components/Escalas/EscalaCard';
import { Ionicons } from '@expo/vector-icons'; // Para o ícone de notificação e menu

export default function Home() {
  const navigation = useNavigation();
  const route = useRoute();

  const { userId, igrejaId, isLider, isMinisterForCults } = route.params || { userId: null, igrejaId: null, isLider: false, isMinisterForCults: false };

  const [cultos, setCultos] = useState([]);
  const [isLoadingCultos, setIsLoadingCultos] = useState(true);
  const [errorCultos, setErrorCultos] = useState('');
  const [userChurchIdState, setUserChurchIdState] = useState(igrejaId);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Estado para controlar a visibilidade do menu
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0); // Contagem de notificações não lidas

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
        } else {
          setErrorCultos('Não foi possível encontrar a igreja associada ao seu usuário. Faça login novamente.');
          setIsLoadingCultos(false);
          return;
        }
      }

      if (currentUserId && currentIgrejaId) {
        buscarCultos(currentUserId, currentIgrejaId);
        fetchUnreadNotificationsCount(currentIgrejaId, currentUserId); // Busca a contagem de notificações
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
      console.error('Erro ao buscar cultos na Home:', error);
      setErrorCultos('Erro ao carregar seus cultos. Verifique sua conexão e permissões.');
    } finally {
      setIsLoadingCultos(false);
    }
  };

  // Função para buscar a contagem de notificações não lidas
  const fetchUnreadNotificationsCount = async (currentIgrejaId, currentUserId) => {
    try {
      const notificationsRef = collection(db, 'igrejas', currentIgrejaId, 'notificacoes');
      const qNotifications = query(
        notificationsRef,
        where('read', '==', false),
        where('targetUserId', '==', currentUserId) // Assume que notificações são direcionadas
      );
      const notificationsSnap = await getDocs(qNotifications);
      setUnreadNotificationsCount(notificationsSnap.size);
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
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
        <Text style={styles.headerTitle}>Home</Text> {/* Título central da Home */}
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
                onPress={() => navigation.navigate('DetalhesEscala', { escala: culto })}
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
        // Passa as props do usuário para o Menu
        userId={userId}
        igrejaId={userChurchIdState} // Use o ID da igreja que foi efetivamente carregado/determinado
        isLider={isLider}
        isMinisterForCults={isMinisterForCults}
      />

      {/* REPASSA os parâmetros para o BottomTab */}
      <BottomTab
        navigation={navigation}
        userId={userId}
        igrejaId={userChurchIdState}
        isLider={isLider}
        isMinisterForCults={isMinisterForCults}
      />
    </View>
  );
}