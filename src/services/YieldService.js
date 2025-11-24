import { getFiiQuote } from '@/services/fiiService';

export const YieldService = {
  /**
   * Recupera a data da última atualização do localStorage
   */
  getLastUpdate: () => {
    return localStorage.getItem('fii_last_update');
  },

  /**
   * Salva a data atual como última atualização
   */
  setLastUpdate: () => {
    localStorage.setItem('fii_last_update', new Date().toISOString());
  },

  /**
   * Percorre a carteira, busca dados atualizados e retorna o que mudou.
   * @param {Array} portfolio Array com os FIIs da carteira
   */
  updatePortfolioYields: async (portfolio) => {
    const updates = [];
    
    console.log("Iniciando atualização de Yields...");

    // Vamos processar um por um para não sobrecarregar a API
    for (const fii of portfolio) {
      try {
        // Busca a cotação usando o nosso fiiService blindado
        const quote = await getFiiQuote(fii.ticker);
        
        if (quote) {
          console.log(`Dados recebidos para ${fii.ticker}:`, quote);

          // Aqui está o segredo: garantimos que o dividendYield seja passado adiante
          updates.push({
            id: fii.id,
            currentPrice: quote.price,
            priceChange: quote.price - fii.price, // Diferença do preço médio
            dividendYield: quote.dividendYield || 0, // <--- O PULO DO GATO ESTÁ AQUI
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Falha ao atualizar ${fii.ticker}:`, error);
      }
    }

    return updates;
  }
};