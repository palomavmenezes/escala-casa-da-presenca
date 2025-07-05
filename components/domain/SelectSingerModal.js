import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import Modal from '../ui/Modal';
import theme from '../theme';

export default function SelectSingerModal({ visible, onClose, cantores = [], cantoresSelecionados = [], onToggle, getIniciais }) {
  return (
    <Modal visible={visible} onClose={onClose} title="Adicionar Cantores para a Música">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {cantores.length === 0 ? (
          <Text style={{ textAlign: 'center', color: theme.colors.gray }}>Nenhum cantor disponível.</Text>
        ) : (
          cantores.map(m => {
            const isSelected = cantoresSelecionados.includes(m.id);
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => onToggle(m.id)}
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
                    <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>{getIniciais(m.nome, m.sobrenome)}</Text>
                  </View>
                )}
                <Text style={{ flex: 1, color: theme.colors.text }}>{m.nome}</Text>
                {isSelected && <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Selecionado</Text>}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </Modal>
  );
} 