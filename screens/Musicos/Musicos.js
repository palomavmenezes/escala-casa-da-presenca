import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Switch } from 'react-native';
import { auth, db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import theme from '../../components/theme';

export default function Musicos() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLider, setIsLider] = useState(false);
  const [igrejaId, setIgrejaId] = useState(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Usuário não autenticado');
        // Buscar igreja do usuário logado
        const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
        let foundIgrejaId = null;
        let lider = false;
        for (const docIgreja of igrejasSnapshot.docs) {
          const userDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
          const userDocSnap = await getDocs(collection(db, 'igrejas', docIgreja.id, 'usuarios'));
          const userDoc = userDocSnap.docs.find(u => u.id === currentUser.uid);
          if (userDoc) {
            foundIgrejaId = docIgreja.id;
            lider = userDoc.data().isLider === true;
            break;
          }
        }
        setIsLider(lider);
        setIgrejaId(foundIgrejaId);
        if (!foundIgrejaId) throw new Error('Igreja não encontrada para o usuário');
        // Buscar todos os usuários da igreja
        const usuariosSnapshot = await getDocs(collection(db, 'igrejas', foundIgrejaId, 'usuarios'));
        setUsuarios(usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        Alert.alert('Erro', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  const handleAprovar = async (usuarioId, aprovado) => {
    try {
      await updateDoc(doc(db, 'igrejas', igrejaId, 'usuarios', usuarioId), { aprovado: aprovado });
      setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, aprovado } : u));
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar aprovação.');
    }
  };

  const handleToggleMinister = async (usuarioId, isMinisterForCults) => {
    try {
      await updateDoc(doc(db, 'igrejas', igrejaId, 'usuarios', usuarioId), { isMinisterForCults });
      setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, isMinisterForCults } : u));
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar permissão de ministro.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Carregando usuários...</Text>
      </View>
    );
  }

  if (!isLider) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 16 }}>Apenas líderes podem acessar esta tela.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: theme.colors.primary }}>Gerencie o acesso dos Músicos</Text>
      <FlatList
        data={usuarios}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.nome} {item.sobrenome}</Text>
            <Text style={{ color: '#666', fontSize: 14 }}>{item.email}</Text>
            <Text style={{ color: item.aprovado ? theme.colors.primary : 'red', fontWeight: 'bold', marginBottom: 6 }}>
              {item.aprovado ? 'Aprovado' : 'Não aprovado'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, marginRight: 8 }}>Pode criar escalas:</Text>
              <Switch
                value={item.isMinisterForCults === true}
                onValueChange={v => handleToggleMinister(item.id, v)}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {item.aprovado ? (
                <TouchableOpacity onPress={() => handleAprovar(item.id, false)} style={{ backgroundColor: '#dc3545', padding: 8, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Remover acesso</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handleAprovar(item.id, true)} style={{ backgroundColor: theme.colors.primary, padding: 8, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Aprovar acesso</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>Nenhum usuário encontrado.</Text>}
      />
    </View>
  );
} 