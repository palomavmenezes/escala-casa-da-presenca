import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import BottomTab from '../components/BottomTab';

export default function HomeScreen({ navigation }) {
  const [cultos, setCultos] = useState([]);

  const logout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace('Login');
      })
      .catch(error => alert(error.message));
  };

  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    const dia = data.toLocaleDateString('pt-BR', { day: '2-digit' });
    const mes = data.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
    return { dia, mes };
  };

  const buscarCultos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'escalas'));
      const dadosCultos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar pela data do culto (convertendo string para Date)
      const futuros = dadosCultos
        .filter(c => new Date(c.dataCulto) >= new Date())
        .sort((a, b) => new Date(a.dataCulto) - new Date(b.dataCulto));
      setCultos(futuros);
    } catch (error) {
      console.log('Erro ao buscar cultos:', error);
    }
  };

  useEffect(() => {
    buscarCultos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Próximos Cultos</Text>
      <ScrollView style={styles.scroll}>
        {cultos.map((culto, index) => {
          const { dia, mes } = formatarData(culto.dataCulto);
          return (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate('EscalaDetalhes', { escala: culto })}
            >
              <View style={styles.card}>
                <View style={styles.dataContainer}>
                  <Text style={styles.data}>{dia}</Text>
                  <Text style={styles.mes}>{mes}</Text>
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.label}>Ministro responsável:</Text>
                  <Text style={styles.ministro}>{culto.ministroResponsavel || 'Não informado'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Card de doação */}
        <View style={styles.doacaoCard}>
          <Text style={styles.doacaoTitulo}>Faça uma doação!</Text>
          <Text style={styles.doacaoTexto}>Quer ajudar a manter o App ativo? Faça uma doação.</Text>
          <TouchableOpacity style={styles.botaoDoar} onPress={() => Linking.openURL('https://link.da.doacao')}>
            <Text style={styles.botaoTexto}>DOAR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20
  },
  scroll: {
    flex: 1
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  data: {
    fontSize: 22,
    fontWeight: 'bold'
  },
  mes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444'
  },
  ministro: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  doacaoCard: {
    backgroundColor: '#D1FAE5',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center'
  },
  doacaoTitulo: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5
  },
  doacaoTexto: {
    textAlign: 'center',
    marginBottom: 10
  },
  botaoDoar: {
    backgroundColor: '#111827',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
