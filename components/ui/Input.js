import React from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';
import theme from '../theme';

export default function Input({ label, value, onChangeText, placeholder, style, ...rest }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray}
        autoCapitalize={rest.keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
        autoComplete={rest.keyboardType === 'email-address' ? 'email' : 'off'}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 0,
    borderRadius: 8,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
}); 