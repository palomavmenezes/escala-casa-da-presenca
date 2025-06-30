// screens/MinhaConta/MinhaConta.styles.js
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Permite que o ScrollView cresça e ocupe o espaço
    backgroundColor: '#F5F6FA', // Cor de fundo suave
    padding: 20,
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    paddingBottom: 40, // Espaço na parte inferior para o scroll
  },
  backButton: {
    alignSelf: 'flex-start', // Alinha o botão de volta à esquerda
    marginBottom: 20,
    padding: 5,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937', // Tonalidade escura para o texto
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#003D29',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F6FA',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
  button: { // Estilo geral para botões (como o "Voltar" de erro)
    backgroundColor: '#6ACF9E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    width: '80%',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Estilos da Imagem de Perfil
  profileImageContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60, // Para a imagem ser circular
    borderWidth: 3,
    borderColor: '#6ACF9E', // Borda verde para a foto de perfil
    backgroundColor: '#E5E7EB', // Cor de fundo para fallback
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5', // Cor de fundo para as iniciais
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6ACF9E',
  },
  initialsText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#003D29', // Cor das iniciais
  },
  photoActionButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 15, // Espaçamento entre os botões de foto
  },
  changePhotoButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF', // Azul para alterar
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    gap: 5,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removePhotoButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30', // Vermelho para remover
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    gap: 5,
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Estilos para Campos de Input
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 5,
    fontWeight: '600',
  },
  inputDisplay: {
    backgroundColor: '#E5E7EB', // Fundo cinza claro para não editável
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#4B5563', // Texto mais escuro para leitura
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  inputEditable: {
    backgroundColor: '#fff', // Fundo branco para editável
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#6ACF9E', // Borda verde quando editável
  },

  // Estilos para Seleção de Instrumentos/Papéis
  instrumentSelectionContainer: {
    width: '100%',
    marginTop: 15,
    marginBottom: 30,
  },
  instrumentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10, // Espaço entre os badges
  },
  instrumentBadge: {
    backgroundColor: '#E5E7EB', // Fundo cinza para não selecionado
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  instrumentBadgeSelected: {
    backgroundColor: '#6ACF9E', // Fundo verde quando selecionado
    borderColor: '#003D29',
  },
  instrumentBadgeText: {
    color: '#4B5563', // Texto cinza para não selecionado
    fontSize: 14,
    fontWeight: 'bold',
  },
  instrumentBadgeTextSelected: {
    color: '#fff', // Texto branco quando selecionado
  },

  // Estilos dos Botões de Ação (Editar/Salvar/Cancelar)
  editButton: {
    backgroundColor: '#007AFF', // Azul para editar
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#6ACF9E', // Verde para salvar
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%', // Ocupa quase metade, com espaço no meio
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#EF4444', // Vermelho para cancelar
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    elevation: 3,
  },
});

export default styles;