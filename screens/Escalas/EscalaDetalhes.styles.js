import { StyleSheet } from 'react-native';
import theme from '../../components/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    padding: 20,
    paddingBottom: 60,
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
    color: theme.colors.primary,
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
  button: { // This style is for the general button (e.g., 'Voltar' in error screen)
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: '80%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: { // This is a general text style for buttons
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backIcon: {
    color: theme.colors.primary,
    marginBottom: 10,
  },
  responsavelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    padding: 10,
    marginBottom: 20,
  },
  responsavelFoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  responsavelTitulo: {
    fontSize: 12,
    color: '#6B7280',
  },
  responsavelNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dataCulto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  ministrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  ministroItem: {
    width: '28%', // Adjust width to fit 3 items per row with gap
    alignItems: 'center',
    marginBottom: 20,
  },
  fotoMinistro: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: theme.colors.secondary,
    marginBottom: 6,
  },
  iniciaisBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iniciais: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  nomeMinistro: {
    fontWeight: '600',
    fontSize: 13,
    color: '#111827',
    textAlign: 'center',
  },
  cargoMinistro: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  ensaioBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  ensaioTexto: {
    fontWeight: 'bold',
    color: '#065F46',
    fontSize: 16,
  },
  cardMusica: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  headerMusica: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nomeMusica: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
    flexShrink: 1,
  },
  tomBox: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  tomTexto: {
    fontWeight: 'bold',
    color: '#065F46',
    fontSize: 13,
  },
  videoContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  webview: {
    flex: 1,
  },
  botaoCifra: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  textoCifra: {
    color: '#fff',
    fontWeight: '600',
  },
  vozesContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  vozesTitulo: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  vozesFotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vozItem: {
    alignItems: 'center',
  },
  vozFoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  iniciaisBoxVoz: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  nomeVoz: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    color: '#374151',
  },
  // --- NOVOS ESTILOS PARA OS BOTÕES DE AÇÃO ---
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#1d5304', // Cor azul para editar
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '45%',
  },
  cancelButton: {
    backgroundColor: '#59d412', // Cor vermelha para cancelar
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5, // Gap entre ícone e texto
    width: '45%',
  },
});

export default styles;