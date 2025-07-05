import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../ui/Avatar';
import theme from '../theme';

export default function MusicianCard({ nome, foto, iniciais, areas, onEditAreas, onRemove }) {
  return (
    <View style={styles.card}>
      <Avatar uri={foto} initials={iniciais} size={60} />
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={1}>{nome}</Text>
        <View style={styles.areasRow}>
          <Text style={styles.areas} numberOfLines={2}>{areas}</Text>
          <TouchableOpacity onPress={onEditAreas} style={styles.editIcon}>
            <Ionicons name="pencil-outline" size={14} color={theme.colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  info: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  nome: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.primary,
  },
  areasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  areas: {
    color: theme.colors.text,
    fontSize: 13,
    flexShrink: 1,
  },
  editIcon: {
    marginLeft: 6,
    padding: 2,
  },
  removeButton: {
    marginLeft: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
}); 