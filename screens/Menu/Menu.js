// components/Menu/Menu.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import  styles  from './Menu.styles';

export default function Menu({ isVisible, onClose }) { // Recebe isVisible e onClose para controlar o Modal
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [churchLogoUrl, setChurchLogoUrl] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState('');

  // Função para buscar dados do usuário, igreja e contagem de notificações
  const fetchMenuData = async () => {
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

      // 1. Tentar encontrar o perfil do usuário em alguma igreja
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

      // 2. Buscar logo da igreja
      const igrejaDocRef = doc(db, 'igrejas', igrejaId);
      const igrejaDocSnap = await getDoc(igrejaDocRef);
      if (igrejaDocSnap.exists() && igrejaDocSnap.data().logoURL) {
        setChurchLogoUrl(igrejaDocSnap.data().logoURL);
      } else {
        setChurchLogoUrl(null); // Sem logo ou não encontrado
      }

      // 3. Contar notificações não lidas
      // Notificações para o usuário logado que não foram lidas
      const notificationsRef = collection(db, 'igrejas', igrejaId, 'notificacoes');
      const qNotifications = query(
        notificationsRef,
        where('read', '==', false),
        where('targetUserId', '==', currentUser.uid) // Notificações diretas para ele
        // Se usar 'recipients' array, precisaria de uma query 'array-contains'
        // where('recipients', 'array-contains', currentUser.uid)
      );
      const notificationsSnap = await getDocs(qNotifications);
      setUnreadNotificationsCount(notificationsSnap.size);

    } catch (e) {
      console.error('Erro ao carregar dados do menu:', e);
      setErrorProfile('Erro ao carregar dados do perfil.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Use useFocusEffect para recarregar dados quando o menu é focado (aberto)
  useFocusEffect(
    React.useCallback(() => {
      if (isVisible) { // Apenas busca dados se o menu estiver visível
        fetchMenuData();
      }
    }, [isVisible]) // Recarrega sempre que a visibilidade do menu mudar
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Sair', 'Você foi desconectado.');
      navigation.replace('Login'); // Redireciona para a tela de Login
    } catch (error) {
      Alert.alert('Erro ao sair', error.message);
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Helper para gerar iniciais se não houver foto
  const getInitials = (firstName = '', lastName = '') => {
    const firstInitial = firstName.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  if (!isVisible) return null; // Não renderiza nada se não estiver visível

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose} // Permite fechar com o botão de voltar no Android
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          {loadingProfile ? (
            <ActivityIndicator size="large" color="#003D29" />
          ) : errorProfile ? (
            <Text style={styles.errorText}>{errorProfile}</Text>
          ) : userProfile ? (
            <>
              {/* Seção de Perfil do Usuário */}
              <View style={styles.profileContainer}>
                {userProfile.foto ? (
                  <Image source={{ uri: userProfile.foto }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImage}>
                    <Text style={styles.profileInitials}>{getInitials(userProfile.nome, userProfile.sobrenome)}</Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{userProfile.nome} {userProfile.sobrenome}</Text>
                  {userProfile.area && (
                    <View style={styles.profileRoleBadge}>
                      <Text style={styles.profileRoleText}>{userProfile.area}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Logo da Igreja */}
              {churchLogoUrl ? (
                <View style={styles.churchLogoContainer}>
                  <Image source={{ uri: churchLogoUrl }} style={styles.churchLogo} />
                </View>
              ) : (
                 // Opcional: Mostrar nome da igreja se não houver logo
                 userProfile.igrejaId && <Text style={styles.menuItemText}>{userProfile.igrejaNome || 'Sua Igreja'}</Text>
              )}


              {/* Itens do Menu de Navegação */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('MinhaConta'); }}>
                <Feather name="user" size={20} color="#333" />
                <Text style={styles.menuItemText}>Minha Conta</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Notificacoes'); }}>
                <Ionicons name="notifications-outline" size={20} color="#333" />
                <Text style={styles.menuItemText}>Notificações</Text>
                {unreadNotificationsCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Escalas'); }}>
                <MaterialIcons name="event" size={20} color="#333" />
                <Text style={styles.menuItemText}>Escalas</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Musicas'); }}>
                <FontAwesome5 name="music" size={20} color="#333" />
                <Text style={styles.menuItemText}>Músicas</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Configuracoes'); }}>
                <Feather name="settings" size={20} color="#333" />
                <Text style={styles.menuItemText}>Configurações</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); Alert.alert('Ajuda', 'Entre em contato para suporte.'); }}>
                <Feather name="help-circle" size={20} color="#333" />
                <Text style={styles.menuItemText}>Ajuda</Text>
              </TouchableOpacity>

              {/* Botão Sair */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialIcons name="logout" size={20} color="#dc3545" />
                <Text style={styles.logoutButtonText}>Sair</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}