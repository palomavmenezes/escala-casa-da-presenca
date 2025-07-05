import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import Modal from '../ui/Modal';
import theme from '../theme';

export default function SelectMusicianModal({ visible, onClose, ministros = [], ministrosEscalados = [], onSelect, cantorSearchQuery, setCantorSearchQuery }) {
  return (
    <Modal visible={visible} onClose={onClose} title="Adicionar Músicos">
      <TextInput
        style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, marginBottom: 10 }}
        placeholder="Buscar por nome ou área..."
        value={cantorSearchQuery}
        onChangeText={setCantorSearchQuery}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="off"
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {ministros.length === 0 ? (
          <Text style={{ textAlign: 'center', color: theme.colors.gray }}>Nenhum usuário ativo disponível na sua igreja.</Text>
        ) : (
          ministros.map(m => {
            const isSelected = ministrosEscalados.some(me => me.userId === m.id);
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => onSelect(m)}
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
              >
                {m.foto ? (
                  <Image source={{ uri: m.foto }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>{m.nome?.[0]}</Text>
                  </View>
                )}
                <Text style={{ flex: 1, color: theme.colors.text }}>{m.nome}</Text>
                {isSelected && (
                  <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Selecionado</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </Modal>
  );
} 