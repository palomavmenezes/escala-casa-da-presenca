import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import NotificationCard from './NotificationCard';
import { db } from '../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function NotificationList({
  notifications = [],
  onAprovar,
  onRejeitar,
  onCardPress,
  onMarkAsRead,
  igrejaId,
}) {
  const [allUsers, setAllUsers] = useState([]);

  // Buscar todos os usuários da igreja uma única vez (como em EscalaDetalhes)
  useEffect(() => {
    async function fetchAllUsers() {
      if (igrejaId) {
        try {
          const usuariosRef = collection(db, 'igrejas', igrejaId, 'usuarios');
          const usuariosSnap = await getDocs(usuariosRef);
          const users = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllUsers(users);
        } catch (error) {
          console.error('Erro ao buscar usuários:', error);
        }
      }
    }
    fetchAllUsers();
  }, [igrejaId]);

  if (!notifications.length) {
    return (
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Text style={{ color: '#888', fontSize: 16 }}>Nenhuma notificação encontrada.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <NotificationCard
          notification={item}
          allUsers={allUsers}
          onPress={onCardPress ? () => onCardPress(item) : undefined}
          onMarkAsRead={onMarkAsRead ? () => onMarkAsRead(item) : undefined}
          onAprovar={
            (item.type === 'novo_membro' || item.type === 'member_approval') && onAprovar
              ? () => onAprovar(item)
              : undefined
          }
          onRejeitar={
            (item.type === 'novo_membro' || item.type === 'member_approval') && onRejeitar
              ? () => onRejeitar(item)
              : undefined
          }
        />
      )}
      contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 0, paddingTop: 8 }}
    />
  );
} 