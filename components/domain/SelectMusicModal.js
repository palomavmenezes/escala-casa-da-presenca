import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import Modal from '../ui/Modal';
import theme from '../theme';

export default function SelectMusicModal({ visible, onClose, musicas = [], musicasSelecionadas = [], onSelect, musicaSearchQuery, setMusicaSearchQuery }) {
  return (
    <Modal visible={visible} onClose={onClose} title="Buscar e Selecionar Músicas">
      <TextInput
        style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, marginBottom: 10 }}
        placeholder="Buscar música por nome..."
        value={musicaSearchQuery}
        onChangeText={setMusicaSearchQuery}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="off"
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {musicas.length > 0 ? (
          musicas.map(musica => {
            const isSelected = musicasSelecionadas.some(ms => ms.musicaId === musica.id);
            return (
              <TouchableOpacity
                key={musica.id}
                onPress={() => onSelect(musica)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.secondary : theme.colors.white,
                  borderRadius: 8,
                  marginBottom: 5,
                  paddingHorizontal: 10,
                }}
                disabled={isSelected}
              >
                <Text style={{ flex: 1, color: theme.colors.text }}>{musica.nome}</Text>
                {isSelected && <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>ADICIONADA</Text>}
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={{ textAlign: 'center', color: theme.colors.gray }}>Nenhuma música encontrada ou disponível.</Text>
        )}
      </ScrollView>
    </Modal>
  );
} 