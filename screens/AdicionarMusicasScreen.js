import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, Button,
    StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function MusicaScreen({ navigation }) {
    const [nome, setNome] = useState('');
    const [cifra, setCifra] = useState('');
    const [video, setVideo] = useState('');
    const [tom, setTom] = useState('');
    const [cantores, setCantores] = useState([]);
    const [ministros, setMinistros] = useState([]);

    useEffect(() => {
        const carregarMinistros = async () => {
            try {
                const snap = await getDocs(collection(db, 'ministros'));
                const lista = snap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(doc => doc.area === 'Cantor(a)');
                setMinistros(lista);
            } catch (error) {
                console.error('Erro ao buscar ministros:', error);
            }
        };
        carregarMinistros();
    }, []);

    const toggleCantor = (id) => {
        setCantores((prev) =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const salvarMusica = async () => {
        if (!nome.trim() || !cifra.trim()) {
            Alert.alert('Erro', 'Preencha ao menos o nome da música e a cifra.');
            return;
        }

        try {
            await addDoc(collection(db, 'musicas'), {
                nome: nome.trim(),
                cifra: cifra.trim(),
                video: video.trim() || '',
                tom: tom.trim(),
                cantores
            });

            Alert.alert('Sucesso', 'Música cadastrada com sucesso!');
            setNome('');
            setCifra('');
            setVideo('');
            setTom('');
            setCantores([]);
            navigation.goBack?.();
        } catch (e) {
            console.error('Erro ao salvar música:', e);
            Alert.alert('Erro', 'Não foi possível salvar a música.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Cadastro de Música</Text>

            <Text style={styles.label}>Nome da Música</Text>
            <TextInput
                value={nome}
                onChangeText={setNome}
                style={styles.input}
                placeholder="Ex: Rompendo em Fé"
            />

            <Text style={styles.label}>Link da Cifra</Text>
            <TextInput
                value={cifra}
                onChangeText={setCifra}
                style={styles.input}
                placeholder="Ex: https://www.cifraclub.com.br/rompendo-em-fe/"
            />

            <Text style={styles.label}>Link do Vídeo (versão)</Text>
            <TextInput
                value={video}
                onChangeText={setVideo}
                style={styles.input}
                placeholder="Ex: https://youtu.be/..."
            />

            <Text style={styles.label}>Tom da Música</Text>
            <TextInput
                value={tom}
                onChangeText={setTom}
                style={styles.input}
                placeholder="Ex: C#, F, Gm..."
            />

            <Text style={styles.label}>Quem canta essa música?</Text>
            {ministros.map(ministro => (
                <TouchableOpacity
                    key={ministro.id}
                    onPress={() => toggleCantor(ministro.id)}
                    style={[
                        styles.cantorItem,
                        cantores.includes(ministro.id) && styles.cantorItemSelecionado
                    ]}
                >
                    <Text>{ministro.nome}</Text>
                </TouchableOpacity>
            ))}

            <View style={{ marginTop: 20 }}>
                <Button title="Salvar Música" onPress={salvarMusica} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
    },
    label: {
        fontWeight: '600',
        marginBottom: 5,
    },
    cantorItem: {
        padding: 10,
        marginVertical: 4,
        backgroundColor: '#eee',
        borderRadius: 5,
    },
    cantorItemSelecionado: {
        backgroundColor: '#cce5ff',
    },
});
