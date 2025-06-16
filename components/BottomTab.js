// components/BottomTab.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BottomTab() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Ícone 1 */}
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
        <FontAwesome5 name="compass" size={20} color="#003D29" />
        <Text style={[styles.label, { color: '#003D29', fontWeight: 'bold' }]}>Início</Text>
      </TouchableOpacity>

      {/* Ícone 2 */}
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Ministers')}>
        <MaterialIcons name="event" size={20} color="#c1c1c1" />
        <Text style={styles.label}>Ministros</Text>
      </TouchableOpacity>

      {/* Botão + centralizado */}
      <View style={styles.centerTabItem}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate('CriarEscalas')}
        >
          <FontAwesome5 name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Ícone 4 */}
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Musicas')}>
        <FontAwesome5 name="music" size={20} color="#c1c1c1" />
        <Text style={styles.label}>Louvores</Text>
      </TouchableOpacity>

      {/* Ícone 5 */}
      <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Escalas')}>
        <MaterialIcons name="edit" size={20} color="#c1c1c1" />
        <Text style={styles.label}>Escalas</Text>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    top: -30, // Levanta o botão acima dos outros
  },
  label: {
    fontSize: 12,
    color: '#c1c1c1',
    marginTop: 2,
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
