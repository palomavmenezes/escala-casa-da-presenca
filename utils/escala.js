// Funções utilitárias para Escalas

// Retorna as iniciais a partir de nome e sobrenome
export function getIniciais(nome, sobrenome) {
  if (!nome) return '';
  if (!sobrenome) return nome[0].toUpperCase();
  return nome[0].toUpperCase() + sobrenome[0].toUpperCase();
}

// Formata áreas para exibição
export function formatarAreas(areas) {
  if (!areas || areas.length === 0) return '';
  if (areas.length === 1) return areas[0];
  return areas.slice(0, -1).join(', ') + ' e ' + areas[areas.length - 1];
}

// Formata data para string amigável
export function formatarData(data) {
  if (!data) return '';
  return data.toLocaleDateString('pt-BR', { weekday: 'long', month: 'numeric', day: 'numeric' });
}

// Extrai URL de embed do YouTube
export function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
  const match = url.match(regExp);
  return match ? `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0` : null;
}

export const getTempoRelativo = (timestamp) => {
  if (!timestamp) return '';
  
  const agora = new Date();
  const dataComentario = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = agora - dataComentario;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHoras < 24) return `${diffHoras} horas`;
  if (diffDias < 7) return `${diffDias} dias`;
  
  // Para datas mais antigas, mostrar dia e mês
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const dia = dataComentario.getDate();
  const mes = meses[dataComentario.getMonth()];
  return `${dia} de ${mes}`;
}; 