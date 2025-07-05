import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import theme from '../theme';

function getIniciais(nome, sobrenome) {
  if (typeof nome !== 'string') nome = '';
  if (typeof sobrenome !== 'string') sobrenome = '';
  const n = nome.trim();
  const s = sobrenome.trim();
  if (n && s) return n[0].toUpperCase() + s[0].toUpperCase();
  if (n) return n[0].toUpperCase();
  if (s) return s[0].toUpperCase();
  return '?';
}

export default function Avatar({ nome, sobrenome, foto, uri, initials, size = 48, style }) {
  // Prioridade: foto > uri > iniciais calculadas > initials prop
  if (foto && typeof foto === 'string' && foto.trim() !== '') {
    return <Image source={{ uri: foto }} style={[styles.avatar, { width: size, height: size, borderRadius: size/2 }, style]} />;
  }
  if (uri && typeof uri === 'string' && uri.trim() !== '') {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size/2 }, style]} />;
  }
  const iniciais = getIniciais(nome, sobrenome) || initials || '?';
  const fontSize = Math.max(size * 0.4, 16);
  return (
    <View style={[styles.avatar, styles.noPhoto, { width: size, height: size, borderRadius: size/2 }, style]}>
      <Text style={[styles.initials, { fontSize }]}>{iniciais}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhoto: {
    backgroundColor: theme.colors.secondary,
  },
  initials: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
}); 