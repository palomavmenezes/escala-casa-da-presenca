import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import theme from '../theme';

const parseDate = (data) => {
  if (!data) return null;
  // If data is a Firestore Timestamp, convert it to a Date object
  if (typeof data.toDate === 'function') return data.toDate();
  // If data is a string (e.g., "YYYY-MM-DD"), convert it to a Date object
  if (typeof data === 'string') return new Date(data + 'T00:00:00'); // Add time to avoid timezone issues
  if (data instanceof Date) return data;
  return null;
};

export default function EscalaCard({ escala }) {
  const [responsavel, setResponsavel] = useState('Carregando...');
  const dataCulto = parseDate(escala.dataCulto);

  useEffect(() => {
    const buscarResponsavel = async () => {
      setResponsavel('Carregando...'); // Reset on re-fetch
      try {
        // Ensure both 'criadoPor' (the user ID) and 'igrejaId' are available in the escala object
        if (escala.criadoPor && escala.igrejaId) {
          // Construct the document reference to the user within the specific church's subcollection
          const userDocRef = doc(db, 'igrejas', escala.igrejaId, 'usuarios', escala.criadoPor);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const dados = userDocSnap.data();
            setResponsavel(`${dados.nome} ${dados.sobrenome || ''}`);
          } else {
            setResponsavel('Usuário não encontrado');
          }
        } else {
          setResponsavel('Dados do responsável ausentes');
        }
      } catch (e) {
        setResponsavel('Erro ao buscar responsável');
        console.error('Erro ao buscar responsável do EscalaCard:', e);
      }
    };

    buscarResponsavel();
    // Re-run effect if criadoPor or igrejaId changes
  }, [escala.criadoPor, escala.igrejaId]); // Added escala.igrejaId as a dependency

  const dia = dataCulto ? dataCulto.getDate().toString().padStart(2, '0') : '--';
  const mes = dataCulto ? dataCulto.toLocaleString('pt-BR', { month: 'short' }).toUpperCase() : '---';

  return (
    <View style={styles.card}>
      <View style={styles.dataBox}>
        <Text style={styles.dia}>{dia}</Text>
        <Text style={styles.mes}>{mes}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Criador do Repertório</Text>
        <Text style={styles.responsavel}>{responsavel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
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
    color: theme.colors.primary,
  },
  mes: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  responsavel: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '400',
  },
});