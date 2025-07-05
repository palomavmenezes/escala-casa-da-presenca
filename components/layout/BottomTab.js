// components/BottomTab.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import theme from '../theme';
import { useUser } from '../../contexts/UserContext';

export default function BottomTab() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useUser();

  const isLider = userProfile?.isLider === true;
  const isMinisterForCults = userProfile?.isMinisterForCults === true;

  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.gray;

  const isActive = (screenName) => route.name === screenName;

  const onlyBasicTabs = !isLider && !isMinisterForCults;

  return (
    <View style={[styles.container, onlyBasicTabs && { justifyContent: 'center' }]}>
      {onlyBasicTabs ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
          {/* Início */}
          <View style={styles.tabItem}>
            <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Home')}>
              <FontAwesome5 name="compass" size={20} color={isActive('Home') ? activeColor : inactiveColor} />
              <Text style={[styles.label, isActive('Home') && styles.activeLabel]}>Início</Text>
            </TouchableOpacity>
          </View>
          {/* Músicas */}
          <View style={styles.tabItem}>
            <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Musicas')}>
              <FontAwesome5 name="music" size={20} color={isActive('Musicas') ? activeColor : inactiveColor} />
              <Text style={[styles.label, isActive('Musicas') && styles.activeLabel]}>Músicas</Text>
            </TouchableOpacity>
          </View>
          {/* Escalas */}
          <View style={styles.tabItem}>
            <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Escalas')}>
              <MaterialIcons name="edit" size={20} color={isActive('Escalas') ? activeColor : inactiveColor} />
              <Text style={[styles.label, isActive('Escalas') && styles.activeLabel]}>Escalas</Text>
            </TouchableOpacity>
          </View>
          {/* Calendário - só para membros (não líderes) */}
          {!isLider && (
            <View style={styles.tabItem}>
              <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('CalendarioResponsaveis')}>
                <FontAwesome5 name="calendar-alt" size={20} color={isActive('CalendarioResponsaveis') ? activeColor : inactiveColor} />
                <Text style={[styles.label, isActive('CalendarioResponsaveis') && styles.activeLabel]}>Calendário</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <>
          {/* Início */}
          <View style={styles.tabItem}>
            <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Home')}>
              <FontAwesome5 name="compass" size={20} color={isActive('Home') ? activeColor : inactiveColor} />
              <Text style={[styles.label, isActive('Home') && styles.activeLabel]}>Início</Text>
            </TouchableOpacity>
          </View>
          {/* Ministros - só para líderes */}
          <View style={styles.tabItem}>
            {isLider && (
              <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Musicos')}>
                <MaterialIcons name="person" size={20} color={isActive('Musicos') ? activeColor : inactiveColor} />
                <Text style={[styles.label, isActive('Musicos') && styles.activeLabel]}>Músicos</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Botão central - só para responsáveis por repertórios/escalas ou líderes */}
          <View className={styles.centerTabItem}>
            {(isMinisterForCults === true || isLider === true) && (
              <TouchableOpacity
                style={styles.fabButton}
                onPress={() => navigation.navigate('CriarEscalas')}
              >
                <FontAwesome5 name="plus" size={20} color={isActive('CriarEscalas') ? activeColor : inactiveColor} />
                <Text style={[styles.label, isActive('CriarEscalas') && styles.activeLabel]}>Criar Escala</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Músicas */}
          <View style={styles.tabItem}>
            <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Musicas')}>
              <FontAwesome5 name="music" size={20} color={isActive('Musicas') ? activeColor : inactiveColor} />
              <Text style={[styles.label, isActive('Musicas') && styles.activeLabel]}>Músicas</Text>
            </TouchableOpacity>
          </View>
          {/* Escalas */}
          <View style={styles.tabItem}>
            <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('Escalas')}>
              <MaterialIcons name="edit" size={20} color={isActive('Escalas') ? activeColor : inactiveColor} />
              <Text style={[styles.label, isActive('Escalas') && styles.activeLabel]}>Escalas</Text>
            </TouchableOpacity>
          </View>
          {/* Calendário - só para não líderes */}
          {!isLider && (
            <View style={styles.tabItem}>
              <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate('CalendarioResponsaveis')}>
                <FontAwesome5 name="calendar-alt" size={20} color={isActive('CalendarioResponsaveis') ? activeColor : inactiveColor} />
                <Text style={[styles.label, isActive('CalendarioResponsaveis') && styles.activeLabel]}>Calendário</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 2,
  },
  activeLabel: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  fabButton: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
