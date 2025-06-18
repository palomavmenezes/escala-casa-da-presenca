import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// O BottomTab agora recebe isLider e isMinisterForCults como props
export default function BottomTab({ isLider, isMinisterForCults }) {
  const navigation = useNavigation();
  const route = useRoute();

  const activeColor = '#003D29';
  const inactiveColor = '#c1c1c1';

  const isActive = (screenName) => route.name === screenName;

  // Lógica de permissão: Apenas isLider = true OU isMinisterForCults = true
  const canManageScales = isLider === true || isMinisterForCults === true;

  return (
    <View style={styles.container}>
      {/* Início */}
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
        <FontAwesome5 name="compass" size={20} color={isActive('Home') ? activeColor : inactiveColor} />
        <Text style={[styles.label, isActive('Home') && styles.activeLabel]}>Início</Text>
      </TouchableOpacity>

      {/* Ministros */}
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Ministers')}>
        <MaterialIcons name="event" size={20} color={isActive('Ministers') ? activeColor : inactiveColor} />
        <Text style={[styles.label, isActive('Ministers') && styles.activeLabel]}>Ministros</Text>
      </TouchableOpacity>

      {/* Botão central (Criar Escalas) - Visível apenas para usuários autorizados */}
      {canManageScales && (
        <View style={styles.centerTabItem}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => navigation.navigate('CriarEscalas')}
          >
            <FontAwesome5 name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Louvores */}
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Musicas')}>
        <FontAwesome5 name="music" size={20} color={isActive('Musicas') ? activeColor : inactiveColor} />
        <Text style={[styles.label, isActive('Musicas') && styles.activeLabel]}>Louvores</Text>
      </TouchableOpacity>

      {/* Escalas - Visível apenas para usuários autorizados */}
     
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Escalas')}>
        <MaterialIcons name="edit" size={20} color={isActive('Escalas') ? activeColor : inactiveColor} />
        <Text style={[styles.label, isActive('Escalas') && styles.activeLabel]}>Escalas</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabItem: {
    flex: 1, // Pode precisar de flex:1 para manter o espaçamento mesmo que invisível
    alignItems: 'center',
    justifyContent: 'flex-start',
    top: -30,
  },
  label: {
    fontSize: 12,
    color: '#c1c1c1',
    marginTop: 2,
  },
  activeLabel: {
    color: '#003D29',
    fontWeight: 'bold',
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#003D29',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});