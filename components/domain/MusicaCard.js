import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../components/theme';

const MusicaCard = ({ nome, autor, onPress }) => (
  <TouchableOpacity
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    }}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={{
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: '#4ADE80',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 18,
    }}>
      <Ionicons name="musical-notes" size={32} color="#fff" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#4ADE80', fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase', marginBottom: 2 }} numberOfLines={1}>
        {autor || 'MINISTÉRIO'}
      </Text>
      <Text style={{ color: '#232D3F', fontWeight: 'bold', fontSize: 17 }} numberOfLines={1}>
        {nome}
      </Text>
    </View>
  </TouchableOpacity>
);

export default MusicaCard; 