import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';

export default function Button({ 
  children, 
  title,
  onPress, 
  variant = 'primary', 
  style, 
  iconRight,
  iconLeft,
  iconSize = 16,
  ...rest 
}) {
  // Usa title se fornecido, senão usa children, senão usa fallback
  const buttonText = title || children || 'Botão';
  
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'secondary' ? styles.secondary : styles.primary, style]}
      onPress={onPress}
      activeOpacity={0.8}
      {...rest}
    >
      <View style={styles.content}>
        {iconLeft && (
          <Ionicons 
            name={iconLeft} 
            size={iconSize} 
            color={variant === 'secondary' ? theme.colors.primary : theme.colors.white} 
            style={styles.iconLeft}
          />
        )}
        <Text style={[styles.text, variant === 'secondary' ? styles.textSecondary : styles.textPrimary]}>
          {buttonText}
        </Text>
        {iconRight && (
          <Ionicons 
            name={iconRight} 
            size={iconSize} 
            color={variant === 'secondary' ? theme.colors.primary : theme.colors.white} 
            style={styles.iconRight}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  textPrimary: {
    color: theme.colors.white,
  },
  textSecondary: {
    color: theme.colors.primary,
  },
}); 