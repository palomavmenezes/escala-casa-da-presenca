import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/ui/Button';
import styles from './AdicionarMusica.styles';

const CantorAvatar = ({ foto, nome, subtitulo, onRemove, highlight }) => {
  return (
    <View style={[styles.cantorBox]}> 
      <View style={[styles.avatar, highlight && { borderColor: '#4ADE80', borderWidth: 2 }]}> 
        {foto ? (
          <Image source={{ uri: foto }} style={{ width: 60, height: 60, borderRadius: 30 }} />
        ) : (
          <Ionicons name="person" size={36} color="#A0A0A0" />
        )}
      </View>
      {onRemove && (
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.nomeCantor} numberOfLines={1}>{nome}</Text>
      <Text style={styles.subtituloCantor}>{subtitulo}</Text>
    </View>
  );
};

export default CantorAvatar; 