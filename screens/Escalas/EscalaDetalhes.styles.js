import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
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
  button: {
    backgroundColor: '#6ACF9E',
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
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backIcon: {
    color: '#1F2937',
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
    width: '28%',
    alignItems: 'center',
    marginBottom: 20,
  },
  fotoMinistro: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#10B981',
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
    backgroundColor: '#A7F3D0',
    padding: 12,
    borderRadius: 10,
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
    backgroundColor: '#6EE7B7',
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
    backgroundColor: '#1F2937',
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
  editButton: {
    backgroundColor: '#2e78b7',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 20,
    gap: 10, // Espaço entre os botões
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flex: 1, // Faz com que os botões ocupem o mesmo espaço
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#2e78b7', // Blue color for edit
  },
  deleteButton: {
    backgroundColor: '#dc3545', // Red color for delete
  },
});
export default styles;