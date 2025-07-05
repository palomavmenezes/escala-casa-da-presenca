import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';

import { useCadastroMembro } from '../../hooks/useCadastroMembro';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SectionTitle from '../../components/ui/SectionTitle';
import theme from '../../components/theme';
import styles from './CadastroMembro.styles';

export default function CadastroMembro({ navigation }) {
  const {
    nome,
    setNome,
    sobrenome,
    setSobrenome,
    email,
    setEmail,
    telefone,
    setTelefone,
    senha,
    setSenha,
    showPassword,
    setShowPassword,
    erro,
    sucesso,
    isAreaPickerVisible,
    setIsAreaPickerVisible,
    isChurchPickerVisible,
    setIsChurchPickerVisible,
    isRegistering,
    isLoadingChurches,
    churches,
    selectedChurch,
    isMinisterForCults,
    setIsMinisterForCults,
    selectChurch,
    cadastrar,
  } = useCadastroMembro(navigation);

  const sobrenomeInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const telefoneInputRef = useRef(null);
  const senhaInputRef = useRef(null);
  const churchPickerRef = useRef(null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Nome */}
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#B0B0B0" style={styles.icon} />
          <Input
            style={styles.input}
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            returnKeyType="next"
            onSubmitEditing={() => sobrenomeInputRef.current?.focus()}
            autoCapitalize="words"
          />
        </View>
        {/* Sobrenome */}
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#B0B0B0" style={styles.icon} />
          <Input
            ref={sobrenomeInputRef}
            style={styles.input}
            placeholder="Sobrenome"
            value={sobrenome}
            onChangeText={setSobrenome}
            returnKeyType="next"
            onSubmitEditing={() => churchPickerRef?.current?.focus?.()}
            autoCapitalize="words"
          />
        </View>
        {/* Seletor de grupo */}
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setIsChurchPickerVisible(true)}
        >
          <Feather name="chevron-down" size={20} color="#B0B0B0" style={styles.icon} />
          <Text style={[styles.input, { color: selectedChurch ? '#232D3F' : '#B0B0B0' }]}> 
            {selectedChurch ? selectedChurch.nomeIgreja : 'Selecione o grupo para entrar'}
          </Text>
        </TouchableOpacity>
        {/* Email */}
        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#B0B0B0" style={styles.icon} />
          <Input
            ref={emailInputRef}
            style={styles.input}
            placeholder="email@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => telefoneInputRef.current?.focus()}
            autoCapitalize="none"
          />
        </View>
        {/* Telefone */}
        <View style={styles.inputContainer}>
          <Feather name="phone" size={20} color="#B0B0B0" style={styles.icon} />
          <Input
            ref={telefoneInputRef}
            style={styles.input}
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => senhaInputRef.current?.focus()}
          />
        </View>
        {/* Senha */}
        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#B0B0B0" style={styles.icon} />
          <Input
            ref={senhaInputRef}
            style={[styles.input, { paddingRight: 36 }]}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={cadastrar}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={[styles.eyeIcon, { position: 'absolute', right: 16 }]}> 
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#B0B0B0" />
          </TouchableOpacity>
        </View>
        {/* Botão cadastrar */}
        <TouchableOpacity
          style={styles.button}
          onPress={cadastrar}
          disabled={isRegistering || isLoadingChurches}
          activeOpacity={0.85}
        >
          {isRegistering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>CADASTRAR</Text>
              <Feather name="arrow-right" size={22} color="#fff" style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>
        {/* Mensagens de erro/sucesso */}
        {erro ? <Text style={styles.errorMessage}>{erro}</Text> : null}
        {sucesso ? <Text style={styles.successMessage}>{sucesso}</Text> : null}
        {/* Rodapé informativo */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Após realizar o cadastro, entre em contato com o líder do grupo e solicite a aprovação. O acesso será liberado após a aprovação.
          </Text>
        </View>
        {/* Modal de seleção de igreja */}
        <Modal
          visible={isChurchPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsChurchPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecione o grupo</Text>
              {isLoadingChurches ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <FlatList
                  data={churches}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => { selectChurch(item); setIsChurchPickerVisible(false); }}
                    >
                      <Text style={styles.modalOptionText}>{item.nomeIgreja}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              )}
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsChurchPickerVisible(false)}>
                <Text style={styles.modalCloseButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}