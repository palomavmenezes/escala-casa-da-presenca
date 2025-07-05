import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Modal from '../ui/Modal';
import theme from '../theme';

export default function SelectAreaModal({ visible, onClose, areaOptions = [], selectedAreas = [], onToggleArea, onSave }) {
  return (
    <Modal visible={visible} onClose={onClose} title="Definir Papéis para o Músico">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {(areaOptions || []).map(area => {
          const isSelected = (selectedAreas || []).includes(area);
          return (
            <TouchableOpacity
              key={area}
              onPress={() => onToggleArea(area)}
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
              <Text style={{ color: theme.colors.text, flex: 1 }}>{area}</Text>
              {isSelected && <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Selecionado</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={{ backgroundColor: theme.colors.primary, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 }} onPress={onSave}>
        <Text style={{ color: theme.colors.white, fontWeight: 'bold' }}>Salvar</Text>
      </TouchableOpacity>
    </Modal>
  );
} 