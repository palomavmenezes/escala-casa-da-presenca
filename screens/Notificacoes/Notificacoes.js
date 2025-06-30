import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import BottomTab from '../../components/BottomTab';
import styles from './Notificacoes.styles';

export default function NotificacoesScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [telaErro, setTelaErro] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState(null); // Para verificar se é líder

  const ITEMS_PER_LOAD = 20;

  const fetchUserAndNotifications = async () => {
    setLoading(true);
    setTelaErro('');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setTelaErro('Usuário não autenticado. Faça login para ver as notificações.');
      setLoading(false);
      return;
    }

    try {
      let userProfile = null;
      let foundIgrejaId = null;

      // Primeiro, encontra a igreja do usuário logado
      const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
      for (const docIgreja of igrejasSnapshot.docs) {
        const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
        const usuarioDocSnap = await getDoc(usuarioDocRef);
        if (usuarioDocSnap.exists()) {
          userProfile = { id: usuarioDocSnap.id, ...usuarioDocSnap.data() };
          foundIgrejaId = docIgreja.id;
          break;
        }
      }

      if (!userProfile || !foundIgrejaId) {
        setTelaErro('Perfil de usuário ou ID da igreja não encontrados.');
        setLoading(false);
        return;
      }

      setCurrentUserProfile(userProfile); // Guarda o perfil para verificar se é líder

      // AGORA, LÊ AS NOTIFICAÇÕES DIRETAMENTE DA SUBCOLEÇÃO DO USUÁRIO
      const notificationsRef = collection(db, 'igrejas', foundIgrejaId, 'usuarios', currentUser.uid, 'notificacoes');
      const q = query(
        notificationsRef,
        orderBy('timestamp', 'desc'),
        limit(ITEMS_PER_LOAD)
      );
      const snapshot = await getDocs(q);

      const loadedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        read: !!doc.data().read, // Garante que 'read' seja um booleano
        timestamp: doc.data().timestamp?.toDate(), // Converte Firestore Timestamp para Date
      }));

      setNotifications(loadedNotifications);

    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setTelaErro('Erro ao carregar notificações. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserAndNotifications();
    }, [])
  );

  // A função handleApproveMember e handleDenyMember ainda precisam da referência correta da notificação
  // que é o caminho dentro da subcoleção do usuário, não na raiz 'notificacoes' da igreja.
  const handleApproveMember = async (notificationId, memberId, memberEmail, igrejaId) => {
    Alert.alert(
      'Aprovar Membro',
      `Tem certeza que deseja aprovar ${memberEmail}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            try {
              const memberRef = doc(db, 'igrejas', igrejaId, 'usuarios', memberId);
              await updateDoc(memberRef, { aprovado: true });

              // AQUI MUDA: A notificação está na subcoleção do líder que a recebeu
              const notificationRef = doc(db, 'igrejas', igrejaId, 'usuarios', auth.currentUser.uid, 'notificacoes', notificationId);
              await deleteDoc(notificationRef);

              Alert.alert('Sucesso', `${memberEmail} aprovado com sucesso!`);
              fetchUserAndNotifications();
            } catch (e) {
              console.error('Erro ao aprovar membro:', e);
              Alert.alert('Erro', `Não foi possível aprovar o membro. ${e.message}`);
            }
          }
        }
      ]
    );
  };

  const handleDenyMember = async (notificationId, memberId, memberEmail, igrejaId) => {
    Alert.alert(
      'Negar Membro',
      `Tem certeza que deseja negar ${memberEmail}? Esta ação irá desativar o acesso dele.`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            try {
              const memberRef = doc(db, 'igrejas', igrejaId, 'usuarios', memberId);
              await updateDoc(memberRef, { aprovado: false });

              // AQUI MUDA: A notificação está na subcoleção do líder que a recebeu
              const notificationRef = doc(db, 'igrejas', igrejaId, 'usuarios', auth.currentUser.uid, 'notificacoes', notificationId);
              await deleteDoc(notificationRef);

              Alert.alert('Sucesso', `${memberEmail} negado e acesso desativado.`);
              fetchUserAndNotifications();
            } catch (e) {
              console.error('Erro ao negar membro:', e);
              Alert.alert('Erro', `Não foi possível negar o membro. ${e.message}`);
            }
          }
        }
      ]
    );
  };

  const handleMarkAsRead = async (notificationId, igrejaId) => {
    try {
      // AQUI MUDA: A notificação está na subcoleção do usuário que a recebeu
      const notificationRef = doc(db, 'igrejas', igrejaId, 'usuarios', auth.currentUser.uid, 'notificacoes', notificationId);
      await updateDoc(notificationRef, { read: true });
      fetchUserAndNotifications();
    } catch (e) {
      console.error('Erro ao marcar como lida:', e);
      Alert.alert('Erro', `Não foi possível marcar a notificação como lida. ${e.message}`);
    }
  };

  const renderNotificationItem = ({ item }) => {
    const isUnread = !item.read;
    const timestampFormatted = item.timestamp
      ? item.timestamp.toLocaleString('pt-BR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Data desconhecida';

    return (
      <View style={[styles.card, isUnread && styles.cardUnread]}>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTimestamp}>{timestampFormatted}</Text>

        {/* Verificando se o tipo é de aprovação E se o usuário atual é líder */}
        {item.type === 'member_approval' && currentUserProfile?.isLider && (
          <View>
            <Text style={styles.notificationMeta}>Nome: {item.memberName}</Text>
            <Text style={styles.notificationMeta}>Email: {item.memberEmail}</Text>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() =>
                  handleApproveMember(item.id, item.memberId, item.memberEmail, item.igrejaId)
                }
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Aprovar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.denyButton]}
                onPress={() =>
                  handleDenyMember(item.id, item.memberId, item.memberEmail, item.igrejaId)
                }
              >
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Negar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {item.type?.startsWith('scale_') && (
          <View>
            <Text style={styles.notificationMeta}>
              Escala: {item.escalaDate} ({item.eventType?.replace('scale_', '')})
            </Text>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
                onPress={() =>
                  navigation.navigate('EscalaDetalhes', { // <--- MUDANÇA AQUI
                    escala: { id: item.escalaId, igrejaId: item.igrejaId },
                  })
                }
              >
                <Ionicons name="eye-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Ver Escala</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isUnread && (
          <TouchableOpacity
            style={styles.markAsReadButton}
            onPress={() => handleMarkAsRead(item.id, item.igrejaId)}
          >
            <Text style={styles.markAsReadText}>Marcar como lida</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (telaErro) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{telaErro}</Text>
      </View>
    );
  }

  return (
    <><View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma notificação encontrada.</Text>} />
    </View><BottomTab /></>
  );
}