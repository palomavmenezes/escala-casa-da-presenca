import React from 'react';
import { Text, StyleSheet } from 'react-native';
import theme from '../theme';

export default function SectionTitle({ children, style }) {
  return (
    <Text style={[styles.title, style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginVertical: theme.spacing.md,
  },
}); 