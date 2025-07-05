import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import CantorAvatar from './CantorAvatar';
import { Ionicons } from '@expo/vector-icons';
import styles from './AdicionarMusica.styles';

const CantoresSelecionados = ({ cantores, onRemove, onAdicionar }) => {
  return (
    <View style={[styles.cantoresContainer, { marginBottom: 28 }]}> 
      {cantores.map((cantor, idx) => (
        <CantorAvatar
          key={cantor.id || idx}
          foto={cantor.foto}
          nome={cantor.nome}
          onRemove={onRemove ? () => onRemove(cantor.id) : undefined}
          highlight
        />
      ))}
      {/* Botão de adicionar */}
      <TouchableOpacity style={[styles.cantorBox]} onPress={onAdicionar}>
        <View style={[styles.avatar, styles.avatarAdd]}> 
          <Ionicons name="add" size={32} color="#6ACF9E" />
        </View>
        <Text style={styles.nomeCantor}>Adicionar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CantoresSelecionados; 