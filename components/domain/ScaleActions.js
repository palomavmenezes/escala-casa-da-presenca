import React from 'react';
import { View } from 'react-native';
import Button from '../ui/Button';

export default function ScaleActions({ onEdit, onShare, onDelete }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, gap: 10 }}>
      <Button title="Editar" onPress={onEdit} variant="secondary" style={{ flex: 1 }} />
      <Button title="Compartilhar" onPress={onShare} variant="primary" style={{ flex: 1 }} />
      <Button title="Excluir" onPress={onDelete} variant="danger" style={{ flex: 1 }} />
    </View>
  );
} 