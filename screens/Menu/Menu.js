import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import styles from './Menu.styles';

export default function Menu({ isVisible, onClose }) {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [churchLogoUrl, setChurchLogoUrl] = useState(null);
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

      // 1. Encontra a igreja e o perfil do usuário logado
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

      // 2. Busca o logo da igreja
      const igrejaDocRef = doc(db, 'igrejas', igrejaId);
      const igrejaDocSnap = await getDoc(igrejaDocRef);
      setChurchLogoUrl(igrejaDocSnap.exists() && igrejaDocSnap.data().logoURL ? igrejaDocSnap.data().logoURL : null);

      // 3. ATUALIZAÇÃO: Busca notificações não lidas da nova localização
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

  useFocusEffect(
    React.useCallback(() => {
      // Garante que os dados do menu são recarregados sempre que a tela de Home (que renderiza o Menu) ganha foco
      // E também apenas quando o menu está visível, para evitar buscas desnecessárias.
      if (isVisible) {
        fetchMenuData();
      }
    }, [isVisible, fetchMenuData])
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Sair', 'Você foi desconectado.');
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Erro ao sair', error.message);
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getInitials = (firstName = '', lastName = '') => {
    const firstInitial = firstName.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  if (!isVisible) return null;

  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
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

              {churchLogoUrl ? (
                <View style={styles.churchLogoContainer}>
                  <Image source={{ uri: churchLogoUrl }} style={styles.churchLogo} />
                </View>
              ) : (
                userProfile.igrejaId && <Text style={styles.menuItemText}>{userProfile.igrejaNome || 'Sua Igreja'}</Text>
              )}

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