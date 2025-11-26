/**
 * Serviço para buscar notícias de FIIs usando o Google News via RSS2JSON
 */
export const NewsService = {
  /**
   * Busca as últimas notícias de um FII
   * @param {string} ticker O código do FII (ex: RZTR11)
   */
  async getRecentNews(ticker) {
    try {
      // Monta a busca no Google News
      const query = `${ticker} Fundo Imobiliário`;
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      
      // Usa um conversor de RSS para JSON (api.rss2json.com é gratuito)
      const converterUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

      const response = await fetch(converterUrl);
      const data = await response.json();

      if (data.status === 'ok' && data.items) {
        // Retorna as 5 notícias mais recentes
        return data.items.slice(0, 5).map(item => ({
          title: item.title,
          link: item.link,
          date: item.pubDate,
          source: 'Google News'
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Erro ao buscar notícias para ${ticker}:`, error);
      return [];
    }
  }
};