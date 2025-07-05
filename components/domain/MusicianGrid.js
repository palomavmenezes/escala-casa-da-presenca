import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../ui/Avatar';
import theme from '../theme';

export default function MusicianGrid({ musicians, onRemove, onAdd, onEditArea }) {
  const onSelectMusician = (musico) => {
    handleAddMusico(musico);
    setSelectedAreas(musico.areas || []);
    setModals({ ...modals, selectMusician: false, selectArea: true, areaMusico: musico });
  };

  return (
    <View style={styles.grid}>
      {musicians.map((m, idx) => (
        <View key={m.userId || idx} style={styles.item}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={m.foto} initials={m.iniciais} size={64} />
            {onRemove && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(m)}>
                <Ionicons name="close" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            {onEditArea && (
              <TouchableOpacity style={styles.editBtnNoBorder} onPress={() => onEditArea(m)}>
                <Ionicons name="create-outline" size={18} color={theme.colors.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.nome} numberOfLines={1}>{m.nome}</Text>
          {m.areas && (
            <Text style={styles.area}>
              {Array.isArray(m.areas) ? m.areas.join(', ') : m.areas}
            </Text>
          )}
        </View>
      ))}
      {onAdd && (
        <TouchableOpacity style={styles.item} onPress={onAdd}>
          <View style={[styles.avatarWrapper, styles.addAvatar]}>
            <Ionicons name="add" size={32} color={theme.colors.secondary} />
          </View>
          <Text style={styles.nome}>Adicionar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginVertical: theme.spacing.sm,
  },
  item: {
    alignItems: 'center',
    width: 80,
    marginHorizontal: 4,
    marginBottom: theme.spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAvatar: {
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    borderRadius: 32,
    backgroundColor: '#F3F7F5',
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  editBtnNoBorder: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: 'transparent',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  nome: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  area: {
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'center',
  },
}); 