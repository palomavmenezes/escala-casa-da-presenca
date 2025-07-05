import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useHome } from '../hooks/useHome';
import Menu from './Menu/Menu';
import BottomTab from '../components/layout/BottomTab';
import EscalaCard from '../components/domain/EscalaCard';
import DonationCard from '../components/domain/DonationCard';
import Button from '../components/ui/Button';
import theme from '../components/theme';
import styles from './Home.styles';
import GroupLogo from '../components/ui/GroupLogo';
import { useUser } from '../contexts/UserContext';

export default function Home() {
  const navigation = useNavigation();
  const route = useRoute();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { userProfile, loading: userLoading } = useUser();

  const {
    cultos,
    isLoadingCultos,
    errorCultos,
    unreadNotificationsCount,
    retryLoad,
    userParams,
    initializeHomeData
  } = useHome(route.params);

  // Tentar recarregar dados se o contexto do usuário ainda não estiver pronto
  useEffect(() => {
    if (!userLoading && !userProfile && errorCultos === 'Carregando dados do usuário...') {
      // Aguardar um pouco e tentar novamente
      const timer = setTimeout(() => {
        initializeHomeData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userLoading, userProfile, errorCultos, initializeHomeData]);

  return (
    <>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
          <Ionicons name="menu" size={30} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <GroupLogo size={50} />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notificacoes')}>
          <Ionicons name="notifications-outline" size={30} color={theme.colors.primary} />
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Próximos cultos</Text>

        {/* Renderização condicional para carregamento, erro ou conteúdo */}
        {isLoadingCultos ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loadingIndicator} />
        ) : errorCultos ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorCultos}</Text>
            <Button
              title="Tentar Novamente"
              onPress={retryLoad}
              style={styles.retryButton}
              iconRight="refresh"
            />
          </View>
        ) : (
          <ScrollView style={styles.scroll}>
            {cultos.length > 0 ? (
              cultos.map((culto) => (
                <TouchableOpacity
                  key={culto.id}
                  onPress={() => navigation.navigate('EscalaDetalhes', { escala: { id: culto.id, igrejaId: culto.igrejaId } })}
                >
                  <EscalaCard escala={culto} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noCultosText}>
                Você não está escalado para nenhum culto futuro no momento.
              </Text>
            )}

            <DonationCard />
          </ScrollView>
        )}

        {/* Componente Menu (Modal) */}
        <Menu
          isVisible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
          userId={userParams.userId}
          igrejaId={userParams.igrejaId}
          isLider={userParams.isLider}
          isMinisterForCults={true}
        />

      </View>

      {/* BottomTab */}
      <BottomTab
        navigation={navigation}
        userId={userParams.userId}
        igrejaId={userParams.igrejaId}
        isLider={userParams.isLider}
        isMinisterForCults={userParams.isMinisterForCults === true || userParams.isMinisterForCults === 'true'}
      />
    </>
  );
}