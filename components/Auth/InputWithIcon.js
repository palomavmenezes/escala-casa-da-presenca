// components/Auth/InputWithIcon.js
import React from 'react';
import styles from './InputWithIcon.styles';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

const InputWithIcon = ({ iconName, placeholder, value, onChangeText, secureTextEntry, showToggle, onToggleSecureEntry, ...rest }) => (
  <View style={styles.inputContainer}>
    <Feather name={iconName} size={20} color="#888" style={styles.icon} />
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      style={styles.input}
      {...rest}
    />
    {showToggle && (
      <TouchableOpacity onPress={onToggleSecureEntry} style={styles.eyeIcon}>
        <Feather name={secureTextEntry ? 'eye-off' : 'eye'} size={20} color="#888" />
      </TouchableOpacity>
    )}
  </View>
);
export default InputWithIcon;