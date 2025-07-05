import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import theme from '../theme';

export default function DonationCard() {
  const handleDonate = () => {
    Linking.openURL('https://link.da.doacao').catch(err => 
      console.error('Erro ao abrir link de doação:', err)
    );
  };

  return (
    <View style={{ 
      backgroundColor: theme.colors.white, 
      borderRadius: 16, 
      padding: 20, 
      marginTop: 20, 
      shadowColor: '#000', 
      shadowOpacity: 0.06, 
      shadowRadius: 8, 
      elevation: 2 
    }}>
      <Text style={{ 
        color: theme.colors.primary, 
        fontWeight: 'bold', 
        fontSize: 18, 
        textAlign: 'center', 
        marginBottom: 8 
      }}>
        Faça uma doação!
      </Text>
      <Text style={{ 
        color: theme.colors.gray, 
        fontSize: 14, 
        textAlign: 'center', 
        marginBottom: 16 
      }}>
        Quer ajudar a manter o App ativo? Faça uma doação.
      </Text>
      <TouchableOpacity 
        style={{ 
          backgroundColor: theme.colors.secondary, 
          borderRadius: 12, 
          paddingVertical: 14, 
          alignItems: 'center' 
        }} 
        onPress={handleDonate}
        activeOpacity={0.9}
      >
        <Text style={{ 
          color: theme.colors.primary, 
          fontWeight: 'bold', 
          fontSize: 16, 
          letterSpacing: 1 
        }}>
          DOAR
        </Text>
      </TouchableOpacity>
    </View>
  );
} 