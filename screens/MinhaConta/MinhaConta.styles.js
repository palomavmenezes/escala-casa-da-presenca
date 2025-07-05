// screens/MinhaConta/MinhaConta.styles.js
import { StyleSheet } from 'react-native';
import theme from '../../components/theme';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Permite que o ScrollView cresça e ocupe o espaço
    backgroundColor: theme.colors.background, // Cor de fundo suave
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
    color: theme.colors.text, // Tonalidade escura para o texto
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
  button: { // Estilo geral para botões (como o "Voltar" de erro)
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    width: '80%',
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: theme.colors.white,
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
    borderColor: theme.colors.primary, // Borda verde para a foto de perfil
    backgroundColor: theme.colors.background, // Cor de fundo para fallback
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.secondary, // Cor de fundo para as iniciais
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  initialsText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.text, // Cor das iniciais
  },
  photoActionButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 15, // Espaçamento entre os botões de foto
  },
  changePhotoButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary, // Azul para alterar
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    gap: 5,
  },
  changePhotoText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  removePhotoButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.error, // Vermelho para remover
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    gap: 5,
  },
  removePhotoText: {
    color: theme.colors.white,
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
    color: theme.colors.text,
    marginBottom: 5,
    fontWeight: '600',
  },
  inputDisplay: {
    backgroundColor: theme.colors.background, // Fundo cinza claro para não editável
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: theme.colors.text, // Texto mais escuro para leitura
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputEditable: {
    backgroundColor: theme.colors.white, // Fundo branco para editável
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.primary, // Borda verde quando editável
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
    backgroundColor: theme.colors.background, // Fundo cinza para não selecionado
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  instrumentBadgeSelected: {
    backgroundColor: theme.colors.primary, // Fundo verde quando selecionado
    borderColor: theme.colors.text,
  },
  instrumentBadgeText: {
    color: theme.colors.text, // Texto cinza para não selecionado
    fontSize: 14,
    fontWeight: 'bold',
  },
  instrumentBadgeTextSelected: {
    color: theme.colors.white, // Texto branco quando selecionado
  },

  // Estilos dos Botões de Ação (Editar/Salvar/Cancelar)
  editButton: {
    backgroundColor: theme.colors.primary, // Azul para editar
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
    backgroundColor: theme.colors.primary, // Verde para salvar
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%', // Ocupa quase metade, com espaço no meio
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: theme.colors.error, // Vermelho para cancelar
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    elevation: 3,
  },
});

export default styles;