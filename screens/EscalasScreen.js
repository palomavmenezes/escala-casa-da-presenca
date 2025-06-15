import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Switch, Button,
    TouchableOpacity, ScrollView, StyleSheet, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../services/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const musicasDisponiveis = [
    { id: 1, nome: 'Rompendo em Fé', cifra: 'https://www.cifraclub.com.br/rompendo-em-fe/' },
    { id: 2, nome: 'Agnus Dei', cifra: 'https://www.cifraclub.com.br/agnus-dei/' },
    { id: 3, nome: 'Te Louvarei', cifra: 'https://www.cifraclub.com.br/te-louvarei/' },
];

export default function EscalasScreen({ navigation }) {
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
    const [musicas, setMusicas] = useState([{ musica: '', cifra: '' }]);

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
                console.log('Ministros carregados:', lista);
            } catch (e) {
                console.error('Erro ao carregar ministros:', e);
            }
        };
        carregarMinistros();
    }, []);

    const toggleCantorSelecionado = (id) => {
        setCantoresSelecionados((prev) =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleMusicaChange = (index, musicaId) => {
        const musicaSelecionada = musicasDisponiveis.find(m => m.id === Number(musicaId));
        const novasMusicas = [...musicas];
        novasMusicas[index] = {
            musica: musicaSelecionada?.nome || '',
            cifra: musicaSelecionada?.cifra || '',
        };
        setMusicas(novasMusicas);
    };

    const handleAddMusica = () => {
        setMusicas([...musicas, { musica: '', cifra: '' }]);
    };

    const handleRemoveMusica = (index) => {
        setMusicas(musicas.filter((_, i) => i !== index));
    };

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
                dataCulto,
                usuariosEscalados,
                ensaio,
                dataEnsaio: ensaio ? dataEnsaio : null,
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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Criar Escala</Text>

            <Text>Data do culto</Text>
            <TextInput
                placeholder="YYYY-MM-DD"
                value={dataCulto}
                onChangeText={setDataCulto}
                style={styles.input}
            />

            {/* CANTORES */}
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

            {/* INSTRUMENTISTAS */}
            {renderPicker('Tecladista', 'Tecladista', usuario.tecladista, val => setUsuario(prev => ({ ...prev, tecladista: val })))}
            {renderPicker('Guitarrista', 'Guitarrista', usuario.guitarrista, val => setUsuario(prev => ({ ...prev, guitarrista: val })))}
            {renderPicker('Baixista', 'Baixista', usuario.baixista, val => setUsuario(prev => ({ ...prev, baixista: val })))}
            {renderPicker('Violão', 'Violão', usuario.violao, val => setUsuario(prev => ({ ...prev, violao: val })))}
            {renderPicker('Baterista', 'Baterista', usuario.baterista, val => setUsuario(prev => ({ ...prev, baterista: val })))}

            {/* ENSAIO */}
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

            {/* MÚSICAS */}
            <Text style={{ marginTop: 10, marginBottom: 5 }}>Músicas</Text>
            {musicas.map((item, index) => (
                <View key={index} style={styles.musicaBox}>
                    <Picker
                        selectedValue={item.musica}
                        onValueChange={(id) => handleMusicaChange(index, id)}
                    >
                        <Picker.Item label="Selecione a música" value="" />
                        {musicasDisponiveis.map(m => (
                            <Picker.Item key={m.id} label={m.nome} value={m.id.toString()} />
                        ))}
                    </Picker>
                    {item.cifra ? <Text style={{ color: 'blue' }}>Cifra: {item.cifra}</Text> : null}
                    <TouchableOpacity onPress={() => handleRemoveMusica(index)}>
                        <Text style={{ color: 'red' }}>Remover</Text>
                    </TouchableOpacity>
                </View>
            ))}
            <Button title="Adicionar Música" onPress={handleAddMusica} />

            <View style={{ marginTop: 20 }}>
                <Button title={salvando ? "Salvando..." : "Salvar Escala"} onPress={salvarEscala} disabled={salvando} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
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
        marginBottom: 10,
        borderRadius: 6,
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
    },
    label: {
        fontWeight: '600',
        marginBottom: 5,
    },
    cantorItem: {
        padding: 10,
        marginBottom: 5,
        backgroundColor: '#eee',
        borderRadius: 5,
    },
    cantorItemSelecionado: {
        backgroundColor: '#cce5ff',
    },
});
