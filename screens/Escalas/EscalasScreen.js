import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import EscalaCard from '../../components/Escalas/EscalaCard';
import BottomTab from '../../components/BottomTab';

export default function EscalasScreen() {
  const navigation = useNavigation();
  const [escalas, setEscalas] = useState([]);

  useEffect(() => {
    const fetchEscalas = async () => {
      const hoje = Timestamp.fromDate(new Date());

      const q = query(
        collection(db, 'escalas'),
        where('dataCulto', '>=', hoje)
      );

      const querySnapshot = await getDocs(q);
      const escalasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por dataCulto
      escalasData.sort((a, b) => a.dataCulto.toDate() - b.dataCulto.toDate());

      setEscalas(escalasData);
    };

    fetchEscalas();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escalas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CriarEscalas')}
        >
          <Text style={styles.addButtonText}>+ Nova escala</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subTitle}>Próximas escalas</Text>

      <FlatList
        data={escalas}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <EscalaCard escala={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma escala futura cadastrada.</Text>
        }
      />
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003D29',
  },
  addButton: {
    backgroundColor: '#003D29',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  subTitle: {
    fontSize: 16,
    color: '#003D29',
    marginBottom: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
    marginTop: 20,
  },
});
