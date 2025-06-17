import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const parseDate = (data) => {
  if (!data) return null;
  if (typeof data.toDate === 'function') return data.toDate();
  if (typeof data === 'string') return new Date(data);
  if (data instanceof Date) return data;
  return null;
};

export default function EscalaCard({ escala }) {
  const [responsavel, setResponsavel] = useState('Carregando...');
  const dataCulto = parseDate(escala.dataCulto);

  useEffect(() => {
    const buscarResponsavel = async () => {
      try {
        if (escala.criadoPor) {
          const docRef = doc(db, 'ministros', escala.criadoPor); // <- busca na coleção ministros
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const dados = docSnap.data();
            setResponsavel(`${dados.nome} ${dados.sobrenome}`);
          } else {
            setResponsavel('Ministro não encontrado');
          }
        }
      } catch (e) {
        setResponsavel('Erro ao buscar responsável');
        console.error('Erro ao buscar ministro:', e);
      }
    };

    buscarResponsavel();
  }, [escala.criadoPor]);

  const dia = dataCulto ? dataCulto.getDate().toString().padStart(2, '0') : '--';
  const mes = dataCulto ? dataCulto.toLocaleString('pt-BR', { month: 'short' }).toUpperCase() : '---';

  return (
    <View style={styles.card}>
      <View style={styles.dataBox}>
        <Text style={styles.dia}>{dia}</Text>
        <Text style={styles.mes}>{mes}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Ministro responsável:</Text>
        <Text style={styles.responsavel}>{responsavel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  dataBox: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  dia: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  mes: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1C',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1C',
    marginBottom: 2,
  },
  responsavel: {
    fontSize: 15,
    color: '#1C1C1C',
    fontWeight: '400',
  },
});
