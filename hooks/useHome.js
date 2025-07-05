import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';

export const useHome = (routeParams) => {
  const { userId: paramUserId, igrejaId: paramIgrejaId } = routeParams || {};

  const [cultos, setCultos] = useState([]);
  const [isLoadingCultos, setIsLoadingCultos] = useState(true);
  const [errorCultos, setErrorCultos] = useState('');
  const [userChurchIdState, setUserChurchIdState] = useState(paramIgrejaId);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [userProfile, setUserProfile] = useState({});

  const buscarCultos = async (currentUserId, currentIgrejaId) => {
    try {
      const escalasRef = collection(db, 'igrejas', currentIgrejaId, 'escalas');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Primeira consulta: Escalas onde o usuário é o 'criadoPor'
      const qCriador = query(
        escalasRef,
        where('criadoPor', '==', currentUserId),
        where('dataCulto', '>=', hoje.toISOString().split('T')[0]),
        orderBy('dataCulto', 'asc')
      );
      const snapshotCriador = await getDocs(qCriador);

      let allFutureScales = [];

      snapshotCriador.forEach(doc => {
        const data = doc.data();
        allFutureScales.push({
          id: doc.id,
          ...data,
          dataCulto: new Date(data.dataCulto + 'T00:00:00'),
          igrejaId: currentIgrejaId,
        });
      });

      // Segunda consulta: Buscar todas as escalas futuras e filtrar no frontend
      const qAllFuture = query(
        escalasRef,
        where('dataCulto', '>=', hoje.toISOString().split('T')[0]),
        orderBy('dataCulto', 'asc')
      );
      const snapshotAllFuture = await getDocs(qAllFuture);

      snapshotAllFuture.forEach(doc => {
        const data = doc.data();
        const isUserInvolvedAsEscalado = data.usuariosEscalados?.some(
          escalado => escalado.userId === currentUserId
        );
        const isAlreadyAdded = allFutureScales.some(s => s.id === doc.id);

        if (isUserInvolvedAsEscalado && !isAlreadyAdded) {
          allFutureScales.push({
            id: doc.id,
            ...data,
            dataCulto: new Date(data.dataCulto + 'T00:00:00'),
            igrejaId: currentIgrejaId,
          });
        }
      });

      const cultosFinais = allFutureScales
        .sort((a, b) => a.dataCulto.getTime() - b.dataCulto.getTime())
        .slice(0, 5);

      setCultos(cultosFinais);

    } catch (error) {
      console.error('Erro ao buscar cultos:', error);
      setErrorCultos('Erro ao carregar seus cultos. Verifique sua conexão e permissões.');
    }
  };

  const setupUnreadNotificationsListener = (currentIgrejaId, currentUserId) => {
    try {
      const notificationsRef = collection(db, 'igrejas', currentIgrejaId, 'usuarios', currentUserId, 'notificacoes');
      const qNotifications = query(
        notificationsRef,
        where('read', '==', false)
      );
      
      const unsubscribe = onSnapshot(qNotifications, (snapshot) => {
        const newCount = snapshot.size;
        // Só atualiza se o valor realmente mudou
        setUnreadNotificationsCount(prevCount => {
          if (prevCount !== newCount) {
            return newCount;
          }
          return prevCount;
        });
      }, (error) => {
        console.error('Erro ao escutar notificações não lidas na Home:', error);
        setUnreadNotificationsCount(0);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener de notificações na Home:', error);
      setUnreadNotificationsCount(0);
      return null;
    }
  };

  const initializeHomeData = async () => {
    setIsLoadingCultos(true);
    setErrorCultos('');

    const currentUserId = auth.currentUser?.uid || paramUserId;
    let currentIgrejaId = paramIgrejaId || userChurchIdState;

    if (!currentUserId) {
      setErrorCultos('Usuário não autenticado. Por favor, faça login novamente.');
      setIsLoadingCultos(false);
      return { shouldNavigateToLogin: true };
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
          // Não fazer signOut imediatamente, apenas mostrar erro
          setErrorCultos('Carregando dados do usuário...');
          setIsLoadingCultos(false);
          return { shouldNavigateToLogin: false };
        }
      } catch (error) {
        setErrorCultos('Erro ao buscar dados da igreja. Verifique sua conexão.');
        setIsLoadingCultos(false);
        return { shouldNavigateToLogin: false };
      }
    }

    if (currentUserId && currentIgrejaId) {
      await buscarCultos(currentUserId, currentIgrejaId);
      // Buscar perfil do usuário
      try {
        const usuarioDocRef = doc(db, 'igrejas', currentIgrejaId, 'usuarios', currentUserId);
        const usuarioDocSnap = await getDoc(usuarioDocRef);
        if (usuarioDocSnap.exists()) {
          setUserProfile(usuarioDocSnap.data());
        } else {
          setUserProfile({});
        }
      } catch (e) {
        setUserProfile({});
      }
      setIsLoadingCultos(false);
      return { shouldNavigateToLogin: false, igrejaId: currentIgrejaId, userId: currentUserId };
    } else {
      setErrorCultos('Erro crítico: dados incompletos após tentativa de busca.');
      setIsLoadingCultos(false);
      return { shouldNavigateToLogin: false };
    }
  };

  const retryLoad = () => {
    setErrorCultos('');
    setIsLoadingCultos(true);
    initializeHomeData();
  };

  useEffect(() => {
    let unsubscribe = null;
    
    const setupData = async () => {
      const result = await initializeHomeData();
      
      if (result && !result.shouldNavigateToLogin && result.igrejaId && result.userId) {
        // Configurar listener em tempo real para notificações após inicialização
        unsubscribe = setupUnreadNotificationsListener(result.igrejaId, result.userId);
      }
    };
    
    setupData();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [routeParams]);

  return {
    cultos,
    isLoadingCultos,
    errorCultos,
    userChurchIdState,
    unreadNotificationsCount,
    initializeHomeData,
    retryLoad,
    userParams: {
      userId: paramUserId,
      igrejaId: userChurchIdState,
      isLider: userProfile.isLider === true,
      isMinisterForCults: userProfile.isMinisterForCults === true
    }
  };
}; 