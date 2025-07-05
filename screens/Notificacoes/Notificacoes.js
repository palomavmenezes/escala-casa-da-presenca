// screens/Notificacoes/Notificacoes.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NotificationList from '../../components/domain/NotificationList';
import { useNotifications } from '../../hooks/useNotifications';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import theme from '../../components/theme';
import { useNavigation } from '@react-navigation/native';

export default function NotificacoesScreen() {
  const [igrejaId, setIgrejaId] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [erroPerfil, setErroPerfil] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchIgrejaId = async () => {
      setLoadingPerfil(true);
      setErroPerfil('');
      try {
        const user = auth.currentUser;
        if (!user) {
          setErroPerfil('Usuário não autenticado');
          setLoadingPerfil(false);
          return;
        }
        // Procurar o perfil do usuário em todas as igrejas
        const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
        let foundIgrejaId = null;
        for (const docIgreja of igrejasSnapshot.docs) {
          const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', user.uid);
          const usuarioDocSnap = await getDoc(usuarioDocRef);
          if (usuarioDocSnap.exists()) {
            foundIgrejaId = docIgreja.id;
            break;
          }
        }
        if (!foundIgrejaId) {
          setErroPerfil('Usuário não pertence a nenhuma igreja.');
        } else {
          setIgrejaId(foundIgrejaId);
        }
      } catch (e) {
        setErroPerfil('Erro ao buscar perfil do usuário.');
      } finally {
        setLoadingPerfil(false);
      }
    };
    fetchIgrejaId();
  }, []);

  const {
    notifications,
    loading,
    error,
    handleApproveMember,
    handleDenyMember,
    handleMarkAsRead,
    fetchUserAndNotifications,
  } = useNotifications(igrejaId);

  // Atualizar notificações quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      if (igrejaId) {
        fetchUserAndNotifications();
      }
    }, [igrejaId, fetchUserAndNotifications])
  );

  function handleNotificationPress(notification) {
    // Notificações de escala (criação, alteração, cancelamento)
    if (
      notification.type === 'escala_criada' ||
      notification.type === 'escala_alterada' ||
      notification.type === 'escala_cancelada' ||
      notification.type === 'scale_created' ||
      notification.type === 'scale_altered' ||
      notification.type === 'scale_cancelled'
    ) {
      navigation.navigate('EscalaDetalhes', {
        escala: {
          id: notification.escalaId,
          igrejaId: notification.igrejaId,
        }
      });
    } 
    // Notificações de menção em comentário
    else if (notification.type === 'mencao_comentario' || notification.type === 'mention_comment') {
      navigation.navigate('EscalaDetalhes', {
        escala: {
          id: notification.escalaId,
          igrejaId: notification.igrejaId,
        },
        comentarioId: notification.comentarioId,
        scrollToComment: true, // Flag para rolar até o comentário
      });
    }
    // Notificações de solicitação de cadastro não são clicáveis
    // (já tratado no NotificationCard)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8, backgroundColor: '#fff' }}>
      {loadingPerfil ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : erroPerfil ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red', fontSize: 16 }}>{erroPerfil}</Text>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
        </View>
      ) : (
        <NotificationList
          notifications={notifications}
          igrejaId={igrejaId}
          onAprovar={handleApproveMember}
          onRejeitar={handleDenyMember}
          onCardPress={handleNotificationPress}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </SafeAreaView>
  );
}