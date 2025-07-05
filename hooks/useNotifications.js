import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';

function getRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr atrás`;
  return date.toLocaleDateString('pt-BR');
}

// Função para buscar dados do remetente
const getSenderData = async (senderId) => {
  try {
    // Buscar em todas as igrejas
    const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
    for (const docIgreja of igrejasSnapshot.docs) {
      const userDoc = await getDoc(doc(db, 'igrejas', docIgreja.id, 'usuarios', senderId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          senderName: userData.nome || '',
          senderPhoto: userData.foto || null,
          senderSobrenome: userData.sobrenome || ''
        };
      }
    }
    return { senderName: '', senderPhoto: null, senderSobrenome: '' };
  } catch (error) {
    console.error('Erro ao buscar dados do remetente:', error);
    return { senderName: '', senderPhoto: null, senderSobrenome: '' };
  }
};

export const useNotifications = (igrejaId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  const currentUser = auth.currentUser;

  const fetchUserAndNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (!currentUser || !igrejaId) {
        setError('Usuário ou igreja não definida');
        setLoading(false);
        return;
      }

      // Buscar perfil do usuário
      const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
      let userProfile = null;
      let userChurchId = null;

      for (const docIgreja of igrejasSnapshot.docs) {
        const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
        const usuarioDocSnap = await getDoc(usuarioDocRef);

        if (usuarioDocSnap.exists()) {
          userProfile = { id: currentUser.uid, ...usuarioDocSnap.data() };
          userChurchId = docIgreja.id;
          break;
        }
      }

      if (!userProfile) {
        setError('Perfil do usuário não encontrado');
        setLoading(false);
        return;
      }

      setCurrentUserProfile(userProfile);

      // Verificar se o usuário tem permissão para acessar notificações
      if (!userProfile.aprovado && userChurchId !== igrejaId) {
        setError('Usuário não tem permissão para acessar notificações');
        setLoading(false);
        return;
      }

      // Buscar notificações apenas se o usuário tem permissão
      try {
        const notificationsRef = collection(db, 'igrejas', userChurchId, 'usuarios', currentUser.uid, 'notificacoes');
        const qNotifications = query(notificationsRef, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(qNotifications, (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(notifs);
        }, (error) => {
          console.error('Erro ao carregar notificações:', error);
          // Não definir erro global, apenas log local
          setNotifications([]);
        });

        return () => unsubscribe();
      } catch (notificationError) {
        console.error('Erro ao configurar listener de notificações:', notificationError);
        setNotifications([]);
      }

    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, [currentUser, igrejaId]);

  useEffect(() => {
    fetchUserAndNotifications();
  }, [fetchUserAndNotifications]);

  const handleApproveMember = async (notification) => {
    try {
      console.log('handleApproveMember - notification recebida:', notification);
      console.log('handleApproveMember - campos da notificação:', {
        id: notification?.id,
        igrejaId: notification?.igrejaId,
        userId: notification?.userId,
        novoMembroId: notification?.novoMembroId,
        type: notification?.type
      });

      if (!notification || !notification.igrejaId || !notification.id) {
        console.log('handleApproveMember - validação falhou:', {
          hasNotification: !!notification,
          hasIgrejaId: !!notification?.igrejaId,
          hasId: !!notification?.id
        });
        Alert.alert('Erro', 'Dados da notificação inválidos');
        return;
      }

      // Usar userId ou novoMembroId, dependendo de qual existe
      const userId = notification.userId || notification.novoMembroId;
      if (!userId) {
        console.log('handleApproveMember - userId/novoMembroId não encontrado');
        Alert.alert('Erro', 'ID do usuário não encontrado na notificação');
        return;
      }

      const { igrejaId } = notification;
      
      // Atualizar status do usuário para aprovado
      const userRef = doc(db, 'igrejas', igrejaId, 'usuarios', userId);
      await updateDoc(userRef, { aprovado: true });

      // Remover notificação
      const notificationRef = doc(db, 'igrejas', igrejaId, 'usuarios', auth.currentUser.uid, 'notificacoes', notification.id);
      await deleteDoc(notificationRef);

      // Atualizar lista local
      setNotifications(prev => prev.filter(n => n.id !== notification.id));

      Alert.alert('Sucesso', 'Membro aprovado com sucesso!');
    } catch (err) {
      console.error('Erro ao aprovar membro:', err);
      Alert.alert('Erro', 'Não foi possível aprovar o membro');
    }
  };

  const handleDenyMember = async (notification) => {
    try {
      console.log('handleDenyMember - notification recebida:', notification);
      console.log('handleDenyMember - campos da notificação:', {
        id: notification?.id,
        igrejaId: notification?.igrejaId,
        userId: notification?.userId,
        novoMembroId: notification?.novoMembroId,
        type: notification?.type
      });

      if (!notification || !notification.igrejaId || !notification.id) {
        console.log('handleDenyMember - validação falhou:', {
          hasNotification: !!notification,
          hasIgrejaId: !!notification?.igrejaId,
          hasId: !!notification?.id
        });
        Alert.alert('Erro', 'Dados da notificação inválidos');
        return;
      }

      // Usar userId ou novoMembroId, dependendo de qual existe
      const userId = notification.userId || notification.novoMembroId;
      if (!userId) {
        console.log('handleDenyMember - userId/novoMembroId não encontrado');
        Alert.alert('Erro', 'ID do usuário não encontrado na notificação');
        return;
      }

      const { igrejaId } = notification;
      
      // Remover usuário da igreja
      const userRef = doc(db, 'igrejas', igrejaId, 'usuarios', userId);
      await deleteDoc(userRef);

      // Remover notificação
      const notificationRef = doc(db, 'igrejas', igrejaId, 'usuarios', auth.currentUser.uid, 'notificacoes', notification.id);
      await deleteDoc(notificationRef);

      // Atualizar lista local
      setNotifications(prev => prev.filter(n => n.id !== notification.id));

      Alert.alert('Sucesso', 'Solicitação rejeitada');
    } catch (err) {
      console.error('Erro ao rejeitar membro:', err);
      Alert.alert('Erro', 'Não foi possível rejeitar a solicitação');
    }
  };

  const handleMarkAsRead = async (notification) => {
    try {
      const { igrejaId } = notification;
      
      // Marcar como lida
      const notificationRef = doc(db, 'igrejas', igrejaId, 'usuarios', auth.currentUser.uid, 'notificacoes', notification.id);
      await updateDoc(notificationRef, { read: true });

      // Atualizar lista local
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  // Criar notificação
  const createNotification = async (notificationData) => {
    if (!igrejaId || !notificationData.recipientId) return;
    if (notificationData.criadoPor === notificationData.recipientId) return; // Não cria notificação para si mesmo
    // Buscar dados do remetente
    let senderData = { senderName: '', senderPhoto: '' };
    if (notificationData.criadoPor) {
      senderData = await getSenderData(notificationData.criadoPor);
    }
    try {
      const notificationRef = collection(db, 'igrejas', igrejaId, 'usuarios', notificationData.recipientId, 'notificacoes');
      await addDoc(notificationRef, {
        ...notificationData,
        ...senderData,
        timestamp: new Date(),
        read: false
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!currentUser || !igrejaId) return;

    try {
      const batch = [];
      notifications.forEach(notification => {
        if (!notification.read) {
          const notificationRef = doc(db, 'igrejas', igrejaId, 'usuarios', currentUser.uid, 'notificacoes', notification.id);
          batch.push(updateDoc(notificationRef, { read: true }));
        }
      });
      await Promise.all(batch);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Deletar notificação
  const deleteNotification = async (notificationId) => {
    if (!currentUser || !igrejaId) return;

    try {
      const notificationRef = doc(db, 'igrejas', igrejaId, 'usuarios', currentUser.uid, 'notificacoes', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  // Deletar notificações relacionadas a um comentário
  const deleteCommentNotifications = async (comentarioId, comentarioTexto, autorId) => {
    if (!igrejaId || !comentarioId || !comentarioTexto || !autorId) return;

    try {
      // 1. Extrair menções do texto do comentário
      const mencoes = comentarioTexto.match(/@([\wÀ-ÿ]+(?: [\wÀ-ÿ]+)?)/g) || [];
      
      if (mencoes.length === 0) return; // Não há menções para excluir

      // 2. Buscar usuários mencionados na igreja atual
      const usuariosRef = collection(db, 'igrejas', igrejaId, 'usuarios');
      const usuariosSnapshot = await getDocs(usuariosRef);
      const usuarios = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Para cada menção, encontrar o usuário correspondente
      for (const mencao of mencoes) {
        const nomeMencao = mencao.replace('@', '').trim().toLowerCase();
        const usuariosMencionados = usuarios.filter(u => {
          const nomeCompleto = (u.nome + (u.sobrenome ? ' ' + u.sobrenome : '')).trim().toLowerCase();
          return nomeCompleto === nomeMencao || u.nome.toLowerCase() === nomeMencao;
        });

        // 4. Para cada usuário mencionado, tentar excluir a notificação
        for (const usuario of usuariosMencionados) {
          if (usuario.id !== autorId) { // Não excluir notificação do próprio autor
            try {
              // Buscar notificação específica de menção para este usuário
              const notificacoesRef = collection(db, 'igrejas', igrejaId, 'usuarios', usuario.id, 'notificacoes');
              const q = query(
                notificacoesRef, 
                where('type', '==', 'mencao_comentario'),
                where('comentarioId', '==', comentarioId),
                where('criadoPor', '==', autorId)
              );
              
              const notificacoesSnapshot = await getDocs(q);
              
              // Excluir cada notificação encontrada
              for (const docNotificacao of notificacoesSnapshot.docs) {
                await deleteDoc(doc(db, 'igrejas', igrejaId, 'usuarios', usuario.id, 'notificacoes', docNotificacao.id));
              }
            } catch (error) {
              console.error(`Erro ao excluir notificação para usuário ${usuario.id}:`, error);
              // Continua tentando excluir as outras notificações mesmo se uma falhar
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao deletar notificações do comentário:', error);
    }
  };

  // Funções específicas para cada tipo de notificação

  // 1. Notificação de nova escala criada
  const notifyEscalaCriada = async (escalaData, usuariosEscalados) => {
    const notifications = usuariosEscalados.map(usuario => ({
      type: 'escala_criada',
      title: 'Nova escala criada',
      message: `Você foi escalado para o culto de ${escalaData.dataCulto}`,
      igrejaId,
      escalaId: escalaData.id,
      escalaDate: escalaData.dataCulto,
      eventType: 'created',
      recipientId: usuario.userId,
      criadoPor: currentUser.uid
    }));

    for (const notification of notifications) {
      await createNotification(notification);
    }
  };

  // 2. Notificação de novo membro para aprovação
  const notifyNovoMembro = async (novoMembro, liderId) => {
    await createNotification({
      type: 'novo_membro',
      title: 'Novo membro aguardando aprovação',
      message: `${novoMembro.nome} ${novoMembro.sobrenome || ''} solicitou participação no grupo`,
      igrejaId,
      novoMembroId: novoMembro.id,
      eventType: 'pending_approval',
      recipientId: liderId,
      criadoPor: novoMembro.id
    });
  };

  // 3. Notificação de menção em comentário
  const notifyMencao = async (comentario, usuarioMencionado, escalaId) => {
    await createNotification({
      type: 'mencao_comentario',
      title: 'Você foi mencionado',
      message: `mencionou você em um comentário`,
      igrejaId,
      escalaId,
      comentarioId: comentario.id,
      comentarioTexto: comentario.texto,
      eventType: 'mentioned',
      recipientId: usuarioMencionado.id,
      criadoPor: currentUser.uid
    });
  };

  // 4. Notificação de escala alterada/cancelada
  const notifyEscalaAlterada = async (escalaData, usuariosEscalados, tipo) => {
    const action = tipo === 'cancelled' ? 'cancelada' : 'alterada';
    const notifications = usuariosEscalados.map(usuario => ({
      type: tipo === 'cancelled' ? 'escala_cancelada' : 'escala_alterada',
      title: `Escala ${action}`,
      message: `A escala para ${escalaData.dataCulto} foi ${action}`,
      igrejaId,
      escalaId: escalaData.id,
      escalaDate: escalaData.dataCulto,
      eventType: tipo,
      recipientId: usuario.userId,
      criadoPor: currentUser.uid
    }));

    for (const notification of notifications) {
      await createNotification(notification);
    }
  };

  return {
    notifications,
    loading,
    error,
    currentUserProfile,
    fetchUserAndNotifications,
    handleApproveMember,
    handleDenyMember,
    handleMarkAsRead,
    createNotification,
    markAllAsRead,
    deleteNotification,
    deleteCommentNotifications,
    notifyEscalaCriada,
    notifyNovoMembro,
    notifyMencao,
    notifyEscalaAlterada
  };
}; 