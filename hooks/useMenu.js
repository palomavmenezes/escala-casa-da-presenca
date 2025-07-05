import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export const useMenu = (isVisible) => {
  const [userProfile, setUserProfile] = useState(null);
  const [groupLogoUrl, setGroupLogoUrl] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState('');

  const fetchMenuData = useCallback(async () => {
    setLoadingProfile(true);
    setErrorProfile('');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setErrorProfile('Usuário não autenticado.');
      setLoadingProfile(false);
      return;
    }

    try {
      let userDocData = null;
      let igrejaId = null;

      // Encontra a igreja e o perfil do usuário logado
      const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
      for (const docIgreja of igrejasSnapshot.docs) {
        const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
        const usuarioDocSnap = await getDoc(usuarioDocRef);
        if (usuarioDocSnap.exists()) {
          userDocData = { id: usuarioDocSnap.id, ...usuarioDocSnap.data() };
          igrejaId = docIgreja.id;
          break;
        }
      }

      if (!userDocData || !igrejaId) {
        setErrorProfile('Perfil de usuário ou igreja não encontrados.');
        setLoadingProfile(false);
        return;
      }

      setUserProfile(userDocData);

      // Busca o logo do grupo
      const igrejaDocRef = doc(db, 'igrejas', igrejaId);
      const igrejaDocSnap = await getDoc(igrejaDocRef);
      setGroupLogoUrl(igrejaDocSnap.exists() && igrejaDocSnap.data().logo ? igrejaDocSnap.data().logo : null);

      // Busca notificações não lidas
      const notificationsRef = collection(db, 'igrejas', igrejaId, 'usuarios', currentUser.uid, 'notificacoes');
      const qNotifications = query(
        notificationsRef,
        where('read', '==', false)
      );
      const notificationsSnap = await getDocs(qNotifications);
      setUnreadNotificationsCount(notificationsSnap.size);

    } catch (e) {
      console.error('Erro ao carregar dados do menu:', e);
      setErrorProfile('Erro ao carregar dados do perfil.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Sair', 'Você foi desconectado.');
      return { shouldNavigateToLogin: true };
    } catch (error) {
      Alert.alert('Erro ao sair', error.message);
      console.error('Erro ao fazer logout:', error);
      return { shouldNavigateToLogin: false };
    }
  };

  const getInitials = (firstName = '', lastName = '') => {
    const firstInitial = firstName.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  useEffect(() => {
    if (isVisible) {
      fetchMenuData();
    }
  }, [isVisible, fetchMenuData]);

  return {
    userProfile,
    groupLogoUrl,
    unreadNotificationsCount,
    loadingProfile,
    errorProfile,
    handleLogout,
    getInitials,
  };
}; 