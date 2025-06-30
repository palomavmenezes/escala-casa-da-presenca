// screens/MinhaConta/MinhaConta.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../../services/firebase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, updateDoc, collection, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import styles from './MinhaConta.styles'; // Importa os estilos

export default function MinhaConta() {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState(''); // Email geralmente não é editável diretamente
  const [area, setArea] = useState('');
  const [foto, setFoto] = useState(null); // URL da foto
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [churchId, setChurchId] = useState(null);
  const [instrumentOptions, setInstrumentOptions] = useState([]); // Opções dinâmicas de instrumentos/roles
  const [selectedInstruments, setSelectedInstruments] = useState([]); // Instrumentos selecionados pelo usuário

  const instrumentOptionsList = ['Vocal', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Backing Vocal', 'Apoio Técnico'];

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      setLoading(false);
      return;
    }

    let foundIgrejaId = null;
    let userData = null;

    try {
      // 1. Encontrar a igreja do usuário
      const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
      for (const docIgreja of igrejasSnapshot.docs) {
        const userDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          foundIgrejaId = docIgreja.id;
          break;
        }
      }

      if (userData && foundIgrejaId) {
        setChurchId(foundIgrejaId);
        setUserProfile({ id: currentUser.uid, ...userData });
        setNome(userData.nome || '');
        setSobrenome(userData.sobrenome || '');
        setEmail(currentUser.email || ''); // O email vem do auth, não do perfil do Firestore
        setArea(userData.area || ''); // Área principal
        setFoto(userData.foto || null);
        setSelectedInstruments(userData.instruments || []); // Carrega instrumentos já selecionados
      } else {
        Alert.alert('Erro', 'Perfil de usuário não encontrado no Firestore.');
        navigation.goBack(); // Volta se não encontrar o perfil
      }
    } catch (e) {
      console.error("Erro ao buscar perfil do usuário:", e);
      Alert.alert('Erro', 'Não foi possível carregar seu perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      // Opcional: Solicitar permissões de mídia ao focar na tela
      (async () => {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Desculpe, precisamos de permissão para acessar suas fotos para que isso funcione!');
          }
        }
      })();
    }, [fetchUserProfile])
  );

  const handleChoosePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setFoto(uri); // Atualiza a pré-visualização instantaneamente
      await uploadProfilePhoto(uri);
    }
  };

  const uploadProfilePhoto = async (uri) => {
    if (!churchId || !auth.currentUser?.uid) {
      Alert.alert('Erro', 'Dados de usuário ou igreja ausentes para upload.');
      return;
    }

    setLoading(true);
    const storage = getStorage();
    const fileName = `profile_pictures/${auth.currentUser.uid}`; // Nome do arquivo no Storage
    const storageRef = ref(storage, fileName);

    try {
      // Deletar foto antiga se existir
      if (userProfile?.foto) {
        const oldPhotoRef = ref(storage, userProfile.foto);
        try {
          await deleteObject(oldPhotoRef);
          console.log("Foto antiga deletada com sucesso.");
        } catch (e) {
          console.warn("Não foi possível deletar foto antiga (pode não existir ou permissão).", e);
        }
      }

      // Upload da nova foto
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const newPhotoURL = await getDownloadURL(storageRef);

      // Atualizar URL da foto no Firestore
      const userDocRef = doc(db, 'igrejas', churchId, 'usuarios', auth.currentUser.uid);
      await updateDoc(userDocRef, { foto: newPhotoURL });

      setUserProfile(prev => ({ ...prev, foto: newPhotoURL })); // Atualiza o estado
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (e) {
      console.error("Erro ao fazer upload ou atualizar foto:", e);
      Alert.alert('Erro', `Não foi possível atualizar a foto. ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!userProfile?.foto) {
      Alert.alert('Info', 'Você não tem uma foto de perfil para remover.');
      return;
    }
    if (!churchId || !auth.currentUser?.uid) {
      Alert.alert('Erro', 'Dados de usuário ou igreja ausentes para remover foto.');
      return;
    }

    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja remover sua foto de perfil?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          onPress: async () => {
            setLoading(true);
            const storage = getStorage();
            const photoRef = ref(storage, userProfile.foto); // Use a URL completa da foto como referência

            try {
              await deleteObject(photoRef);
              const userDocRef = doc(db, 'igrejas', churchId, 'usuarios', auth.currentUser.uid);
              await updateDoc(userDocRef, { foto: null }); // Remove o campo foto no Firestore

              setFoto(null); // Limpa a pré-visualização
              setUserProfile(prev => ({ ...prev, foto: null }));
              Alert.alert('Sucesso', 'Foto de perfil removida!');
            } catch (e) {
              console.error("Erro ao remover foto:", e);
              Alert.alert('Erro', `Não foi possível remover a foto. ${e.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser || !churchId) {
      Alert.alert('Erro', 'Usuário não autenticado ou ID da igreja ausente.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'igrejas', churchId, 'usuarios', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        nome: nome,
        sobrenome: sobrenome,
        area: area,
        instruments: selectedInstruments, // Salva os instrumentos selecionados
      });
      setUserProfile(prev => ({ ...prev, nome, sobrenome, area, instruments: selectedInstruments }));
      setIsEditing(false); // Sai do modo de edição
      Alert.alert('Sucesso', 'Seu perfil foi atualizado!');
    } catch (e) {
      console.error("Erro ao salvar perfil:", e);
      Alert.alert('Erro', `Não foi possível salvar seu perfil. ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleInstrument = (instrument) => {
    setSelectedInstruments(prev => {
      if (prev.includes(instrument)) {
        return prev.filter(item => item !== instrument);
      } else {
        return [...prev, instrument];
      }
    });
  };

  const getInitials = (firstName = '', lastName = '') => {
    return `${firstName.charAt(0)?.toUpperCase() || ''}${lastName.charAt(0)?.toUpperCase() || ''}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando seu perfil...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Não foi possível carregar o perfil do usuário.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.header}>Minha Conta</Text>

      <View style={styles.profileImageContainer}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.profileImage} />
        ) : (
          <View style={styles.initialsPlaceholder}>
            <Text style={styles.initialsText}>{getInitials(nome, sobrenome)}</Text>
          </View>
        )}
        {isEditing && (
          <View style={styles.photoActionButtons}>
            <TouchableOpacity style={styles.changePhotoButton} onPress={handleChoosePhoto}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.changePhotoText}>Alterar Foto</Text>
            </TouchableOpacity>
            {foto && (
              <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.removePhotoText}>Remover Foto</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nome:</Text>
        <TextInput
          style={isEditing ? styles.inputEditable : styles.inputDisplay}
          value={nome}
          onChangeText={setNome}
          editable={isEditing}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sobrenome:</Text>
        <TextInput
          style={isEditing ? styles.inputEditable : styles.inputDisplay}
          value={sobrenome}
          onChangeText={setSobrenome}
          editable={isEditing}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.inputDisplay}
          value={email}
          editable={false} // Email não editável diretamente
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Área Principal (Ex: Vocal, Bateria):</Text>
        <TextInput
          style={isEditing ? styles.inputEditable : styles.inputDisplay}
          value={area}
          onChangeText={setArea}
          editable={isEditing}
          placeholder="Sua principal área no ministério"
        />
      </View>

      {isEditing && (
        <View style={styles.instrumentSelectionContainer}>
          <Text style={styles.label}>Meus Instrumentos/Papéis:</Text>
          <View style={styles.instrumentGrid}>
            {instrumentOptionsList.map((instrument) => (
              <TouchableOpacity
                key={instrument}
                style={[
                  styles.instrumentBadge,
                  selectedInstruments.includes(instrument) && styles.instrumentBadgeSelected,
                ]}
                onPress={() => toggleInstrument(instrument)}
              >
                <Text style={[
                  styles.instrumentBadgeText,
                  selectedInstruments.includes(instrument) && styles.instrumentBadgeTextSelected,
                ]}>
                  {instrument}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}


      {!isEditing ? (
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
          <Text style={styles.buttonText}>Editar Perfil</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
            <Text style={styles.buttonText}>Salvar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => {
            setIsEditing(false);
            fetchUserProfile(); // Recarrega os dados originais para descartar edições
          }}>
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}