import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  scroll: {
    flex: 1,
  },
  doacaoCard: {
    backgroundColor: '#D1FAE5',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  doacaoTitulo: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#003D29',
  },
  doacaoTexto: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#555',
  },
  botaoDoar: {
    backgroundColor: '#111827',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  noCultosText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#003D29',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default styles;