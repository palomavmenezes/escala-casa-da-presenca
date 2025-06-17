import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import BottomTab from '../components/BottomTab';
import EscalaCard from '../components/Escalas/EscalaCard'; // <-- Importando o card

export default function HomeScreen({ navigation }) {
  const [cultos, setCultos] = useState([]);

  const logout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace('Login');
      })
      .catch(error => alert(error.message));
  };

  const buscarCultos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'escalas'));
      const dadosCultos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        {cultos.map((culto, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate('EscalaDetalhes', { escala: culto })}
          >
            <EscalaCard escala={culto} />
          </TouchableOpacity>
        ))}

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
