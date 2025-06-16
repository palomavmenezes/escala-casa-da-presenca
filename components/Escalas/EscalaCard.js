// components/Escalas/EscalaCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EscalaCard({ escala }) {
  const culto = escala.dataCulto.toDate().toLocaleDateString('pt-BR');
  const ensaio = escala.dataEnsaio?.toDate().toLocaleDateString('pt-BR') || 'Sem data de ensaio';

  return (
    <View style={styles.card}>
      <Text style={styles.data}>{culto}</Text>
      <View style={styles.info}>
        <Text style={styles.nome}>{escala.nome}</Text>
        <Text style={styles.ensaio}>Ensaio: {ensaio}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  data: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 16
  },
  info: {
    justifyContent: 'center'
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  ensaio: {
    fontSize: 14,
    color: '#666'
  }
});
