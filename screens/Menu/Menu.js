import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import { useMenu } from '../../hooks/useMenu';
import Button from '../../components/ui/Button';
import theme from '../../components/theme';
import styles from './Menu.styles';
import GroupLogo from '../../components/ui/GroupLogo';

export default function Menu({ isVisible, onClose, isLider }) {
  const navigation = useNavigation();
  const {
    userProfile,
    groupLogoUrl,
    unreadNotificationsCount,
    loadingProfile,
    errorProfile,
    handleLogout,
    getInitials,
  } = useMenu(isVisible);

  const handleLogoutPress = async () => {
    const result = await handleLogout();
    if (result.shouldNavigateToLogin) {
      navigation.replace('Login');
    }
  };

  if (!isVisible) return null;

  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
            <Ionicons name="close" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          {loadingProfile ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : errorProfile ? (
            <Text style={styles.errorText}>{errorProfile}</Text>
          ) : userProfile ? (
            <>
              {/* Logo do Grupo - sempre exibir, centralizado */}
              <View style={styles.churchLogoContainer}>
                <GroupLogo size={80} />
              </View>

              <View style={styles.profileContainer}>
                {userProfile.foto ? (
                  <Image source={{ uri: userProfile.foto }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImage}>
                    <Text style={styles.profileInitials}>{getInitials(userProfile.nome, userProfile.sobrenome)}</Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.welcomeText}>Bem-vindo(a)</Text>
                  <Text style={styles.profileName}>{userProfile.nome} {userProfile.sobrenome}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('MinhaConta'); }}>
                <Feather name="user" size={20} color={theme.colors.primary} />
                <Text style={styles.menuItemText}>Minha Conta</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Notificacoes'); }}>
                <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.menuItemText}>Notificações</Text>
                {unreadNotificationsCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Escalas'); }}>
                <MaterialIcons name="event" size={20} color={theme.colors.primary} />
                <Text style={styles.menuItemText}>Escalas</Text>
              </TouchableOpacity>

              {/* Ministros/Músicos - só para líderes */}
              {isLider && (
                <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('Musicos'); }}>
                  <MaterialIcons name="person" size={20} color={theme.colors.primary} />
                  <Text style={styles.menuItemText}>Músicos</Text>
                </TouchableOpacity>
              )}

              {/* Botão Calendário - só para líderes */}
              {isLider && (
                <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); navigation.navigate('CalendarioResponsaveis'); }}>
                  <Feather name="calendar" size={20} color={theme.colors.primary} />
                  <Text style={styles.menuItemText}>Calendário</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); Alert.alert('Ajuda', 'Entre em contato para suporte.'); }}>
                <Feather name="help-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.menuItemText}>Ajuda</Text>
              </TouchableOpacity>

              <Button 
                title="Sair" 
                onPress={handleLogoutPress}
                style={styles.logoutButton}
                iconLeft="log-out-outline"
                variant="secondary"
              />
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}