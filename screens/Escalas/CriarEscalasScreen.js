import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Switch, Button,
  TouchableOpacity, ScrollView, StyleSheet, Alert, Modal,
  FlatList
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../../services/firebase';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function CriarEscalasScreen({ navigation }) {
  const [dataCulto, setDataCulto] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [cantoresSelecionados, setCantoresSelecionados] = useState([]);
  const [usuario, setUsuario] = useState({
    tecladista: '',
    guitarrista: '',
    baixista: '',
    violao: '',
    baterista: '',
  });
  const [ensaio, setEnsaio] = useState(false);
  const [dataEnsaio, setDataEnsaio] = useState('');
  const [horaEnsaio, setHoraEnsaio] = useState('');
  const [musicas, setMusicas] = useState([{ musicaId: '', musicaNome: '', cifra: '', video: '', cantores: [] }]);
  const [musicasDisponiveis, setMusicasDisponiveis] = useState([]);

  // Modal para criar música nova
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novaMusicaNome, setNovaMusicaNome] = useState('');
  const [novaMusicaCifra, setNovaMusicaCifra] = useState('');
  const [novaMusicaVideo, setNovaMusicaVideo] = useState('');
  const [novaMusicaCantores, setNovaMusicaCantores] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioLogado(user || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const carregarMinistros = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ministros'));
        const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuarios(lista);
      } catch (e) {
        console.error('Erro ao carregar ministros:', e);
      }
    };
    carregarMinistros();
  }, []);

  useEffect(() => {
    const carregarMusicas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'musicas'));
        const listaMusicas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMusicasDisponiveis(listaMusicas);
      } catch (e) {
        console.error('Erro ao carregar músicas:', e);
      }
    };
    carregarMusicas();
  }, [modalVisivel]); // recarrega músicas ao fechar o modal

  // Toggle cantor selecionado para escala
  const toggleCantorSelecionado = (id) => {
    setCantoresSelecionados((prev) =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Seleciona música para o índice
  const handleMusicaChange = (index, musicaId) => {
    if (!musicaId) {
      // resetar música no índice
      const novasMusicas = [...musicas];
      novasMusicas[index] = { musicaId: '', musicaNome: '', cifra: '', video: '', cantores: [] };
      setMusicas(novasMusicas);
      return;
    }
    const musicaSelecionada = musicasDisponiveis.find(m => m.id === musicaId);
    if (!musicaSelecionada) return;

    const novasMusicas = [...musicas];
    novasMusicas[index] = {
      musicaId: musicaSelecionada.id,
      musicaNome: musicaSelecionada.nome || '',
      cifra: musicaSelecionada.cifra || '',
      video: musicaSelecionada.video || '',
      cantores: musicaSelecionada.cantores || []
    };
    setMusicas(novasMusicas);
  };

  // Atualizar cantores que cantam essa música na escala
  const handleCantoresMusicaChange = (index, cantorId) => {
    const novasMusicas = [...musicas];
    const cantoresAtual = novasMusicas[index].cantores || [];
    if (cantoresAtual.includes(cantorId)) {
      novasMusicas[index].cantores = cantoresAtual.filter(c => c !== cantorId);
    } else {
      novasMusicas[index].cantores = [...cantoresAtual, cantorId];
    }
    setMusicas(novasMusicas);
  };

  // Atualizar link do vídeo da música na escala (editável)
  const handleVideoChange = (index, novoVideo) => {
    const novasMusicas = [...musicas];
    novasMusicas[index].video = novoVideo;
    setMusicas(novasMusicas);
  };

  const handleAddMusica = () => {
    setMusicas([...musicas, { musicaId: '', musicaNome: '', cifra: '', video: '', cantores: [] }]);
  };

  const handleRemoveMusica = (index) => {
    setMusicas(musicas.filter((_, i) => i !== index));
  };

  // Salvar escala
  const salvarEscala = async () => {
    if (!usuarioLogado) {
      Alert.alert('Erro', 'Você precisa estar logado para salvar uma escala.');
      return;
    }
    if (!dataCulto) {
      Alert.alert('Erro', 'Informe a data do culto.');
      return;
    }

    const usuariosEscalados = [
      ...cantoresSelecionados,
      usuario.tecladista,
      usuario.guitarrista,
      usuario.baixista,
      usuario.violao,
      usuario.baterista
    ].filter(Boolean);

    setSalvando(true);
    try {
      await addDoc(collection(db, 'escalas'), {
        dataCulto: new Date(dataCulto),
        usuariosEscalados,
        ensaio,
        dataEnsaio: ensaio && dataEnsaio ? new Date(dataEnsaio) : null,
        horaEnsaio: ensaio ? horaEnsaio : null,
        musicas,
        criadoPor: usuarioLogado.uid,
        criadoEm: new Date()
      });

      Alert.alert('Sucesso', 'Escala salva com sucesso!');
      navigation.goBack?.();
    } catch (e) {
      console.error('Erro ao salvar escala:', e);
      Alert.alert('Erro', 'Não foi possível salvar a escala.');
    } finally {
      setSalvando(false);
    }
  };

  // Criar música nova no Firestore
  const criarNovaMusica = async () => {
    if (!novaMusicaNome.trim()) {
      Alert.alert('Erro', 'O nome da música é obrigatório');
      return;
    }
    try {
      await addDoc(collection(db, 'musicas'), {
        nome: novaMusicaNome.trim(),
        cifra: novaMusicaCifra.trim() || null,
        video: novaMusicaVideo.trim() || null,
        cantores: novaMusicaCantores,
      });
      Alert.alert('Sucesso', 'Música criada com sucesso!');
      setModalVisivel(false);
      setNovaMusicaNome('');
      setNovaMusicaCifra('');
      setNovaMusicaVideo('');
      setNovaMusicaCantores([]);
    } catch (e) {
      console.error('Erro ao criar música:', e);
      Alert.alert('Erro', 'Não foi possível criar a música.');
    }
  };

  const renderPicker = (label, area, valorSelecionado, onChange) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <Picker
        selectedValue={valorSelecionado}
        onValueChange={onChange}
        style={styles.picker}
      >
        <Picker.Item label="Selecione" value="" />
        {usuarios.filter(u => u.area === area).map(u => (
          <Picker.Item key={u.id} label={u.nome} value={u.id} />
        ))}
      </Picker>
    </>
  );

  if (!usuarioLogado) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Você precisa estar logado para acessar essa tela.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Criar Escala</Text>

        <Text>Data do culto</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          value={dataCulto}
          onChangeText={setDataCulto}
          style={styles.input}
        />

        <Text style={styles.label}>Cantores</Text>
        {usuarios.filter(u => u.area === 'Cantor(a)').map((u) => (
          <TouchableOpacity
            key={u.id}
            onPress={() => toggleCantorSelecionado(u.id)}
            style={[
              styles.cantorItem,
              cantoresSelecionados.includes(u.id) && styles.cantorItemSelecionado
            ]}
          >
            <Text>{u.nome}</Text>
          </TouchableOpacity>
        ))}
        {cantoresSelecionados.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Escalados:</Text>
            {usuarios
              .filter(u => cantoresSelecionados.includes(u.id))
              .map(u => (
                <Text key={u.id} style={{ marginLeft: 10 }}>• {u.nome}</Text>
              ))}
          </View>
        )}

        {renderPicker('Tecladista', 'Tecladista', usuario.tecladista, val => setUsuario(prev => ({ ...prev, tecladista: val })))}
        {renderPicker('Guitarrista', 'Guitarrista', usuario.guitarrista, val => setUsuario(prev => ({ ...prev, guitarrista: val })))}
        {renderPicker('Baixista', 'Baixista', usuario.baixista, val => setUsuario(prev => ({ ...prev, baixista: val })))}
        {renderPicker('Violão', 'Violão', usuario.violao, val => setUsuario(prev => ({ ...prev, violao: val })))}
        {renderPicker('Baterista', 'Baterista', usuario.baterista, val => setUsuario(prev => ({ ...prev, baterista: val })))}

        <View style={styles.switchContainer}>
          <Text>Ensaio?</Text>
          <Switch value={ensaio} onValueChange={setEnsaio} />
        </View>

        {ensaio && (
          <>
            <Text>Data do ensaio</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              value={dataEnsaio}
              onChangeText={setDataEnsaio}
              style={styles.input}
            />
            <Text>Hora do ensaio</Text>
            <TextInput
              placeholder="HH:MM"
              value={horaEnsaio}
              onChangeText={setHoraEnsaio}
              style={styles.input}
            />
          </>
        )}

        <Text style={{ marginTop: 10, marginBottom: 5 }}>Músicas</Text>

        <Button title="Criar Música" onPress={() => setModalVisivel(true)} />

        {musicas.map((item, index) => (
          <View key={index} style={styles.musicaBox}>
            <Text style={{ fontWeight: 'bold' }}>Música {index + 1}</Text>

            <Picker
              selectedValue={item.musicaId}
              onValueChange={(id) => handleMusicaChange(index, id)}
              enabled={true}
              style={{ marginBottom: 5 }}
            >
              <Picker.Item label="Selecione a música" value="" />
              {musicasDisponiveis.map(m => (
                <Picker.Item key={m.id} label={m.nome} value={m.id} />
              ))}
            </Picker>

            {item.musicaNome ? (
              <>
                <Text style={{ fontWeight: '600' }}>Nome:</Text>
                <Text>{item.musicaNome}</Text>
              </>
            ) : null}

            {item.cifra ? (
              <>
                <Text style={{ fontWeight: '600', marginTop: 5 }}>Link da Cifra:</Text>
                <Text selectable style={{ color: 'blue' }}>{item.cifra}</Text>
              </>
            ) : null}

            <Text style={{ fontWeight: '600', marginTop: 5 }}>Vídeo da versão:</Text>
            <TextInput
              placeholder="URL do vídeo"
              value={item.video}
              onChangeText={(text) => handleVideoChange(index, text)}
              style={styles.input}
              editable={true}
            />

            <Text style={{ fontWeight: '600', marginTop: 5 }}>Cantores que cantarão:</Text>
            {cantoresSelecionados.length === 0 ? (
              <Text style={{ fontStyle: 'italic', color: '#999' }}>Selecione cantores na escala para poder associar</Text>
            ) : (
              usuarios
                .filter(u => cantoresSelecionados.includes(u.id))
                .map(cantor => {
                  const selecionado = item.cantores.includes(cantor.id);
                  return (
                    <TouchableOpacity
                      key={cantor.id}
                      onPress={() => handleCantoresMusicaChange(index, cantor.id)}
                      style={[
                        styles.cantorItem,
                        selecionado && styles.cantorItemSelecionado,
                        { marginBottom: 5 }
                      ]}
                    >
                      <Text>{cantor.nome}</Text>
                    </TouchableOpacity>
                  );
                })
            )}

            <TouchableOpacity onPress={() => handleRemoveMusica(index)} style={{ marginTop: 10 }}>
              <Text style={{ color: 'red' }}>Remover Música</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Button title="Adicionar Música" onPress={handleAddMusica} />

        <View style={{ marginTop: 20 }}>
          <Button title={salvando ? "Salvando..." : "Salvar Escala"} onPress={salvarEscala} disabled={salvando} />
        </View>
      </ScrollView>

      {/* Modal para criar música */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.title}>Criar Nova Música</Text>

          <Text>Nome da Música *</Text>
          <TextInput
            value={novaMusicaNome}
            onChangeText={setNovaMusicaNome}
            placeholder="Nome da música"
            style={styles.input}
          />

          <Text>Link da Cifra</Text>
          <TextInput
            value={novaMusicaCifra}
            onChangeText={setNovaMusicaCifra}
            placeholder="Link da cifra (opcional)"
            style={styles.input}
          />

          <Text>Vídeo da versão</Text>
          <TextInput
            value={novaMusicaVideo}
            onChangeText={setNovaMusicaVideo}
            placeholder="Link do vídeo (opcional)"
            style={styles.input}
          />

          <Text style={{ marginTop: 10, fontWeight: '600' }}>Selecione os cantores que cantarão essa música</Text>
          {cantoresSelecionados.length === 0 ? (
            <Text style={{ fontStyle: 'italic', color: '#999' }}>Selecione cantores na escala para associar cantores à música</Text>
          ) : (
            usuarios
              .filter(u => cantoresSelecionados.includes(u.id))
              .map(cantor => {
                const selecionado = novaMusicaCantores.includes(cantor.id);
                return (
                  <TouchableOpacity
                    key={cantor.id}
                    onPress={() => {
                      if (selecionado) {
                        setNovaMusicaCantores(prev => prev.filter(id => id !== cantor.id));
                      } else {
                        setNovaMusicaCantores(prev => [...prev, cantor.id]);
                      }
                    }}
                    style={[
                      styles.cantorItem,
                      selecionado && styles.cantorItemSelecionado,
                      { marginBottom: 5 }
                    ]}
                  >
                    <Text>{cantor.nome}</Text>
                  </TouchableOpacity>
                );
              })
          )}

          <View style={{ marginTop: 20 }}>
            <Button title="Salvar Música" onPress={criarNovaMusica} />
          </View>

          <View style={{ marginTop: 10 }}>
            <Button title="Cancelar" onPress={() => setModalVisivel(false)} color="red" />
          </View>
        </ScrollView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  picker: {
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  musicaBox: {
    borderWidth: 1,
    borderColor: '#eee',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
  },
  cantorItem: {
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
  cantorItemSelecionado: {
    backgroundColor: '#cce5ff',
  },
  modalContainer: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 40,
    flexGrow: 1,
  },
});
