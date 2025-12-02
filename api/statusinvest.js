// api/statusinvest.js
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase()}`;
    
    // StatusInvest exige um User-Agent real para não bloquear
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    if (!response.ok) throw new Error('Falha ao acessar Status Invest');

    const html = await response.text();
    const $ = cheerio.load(html);

    // Função auxiliar para limpar o texto (R$, %, vírgulas)
    const cleanNumber = (text) => {
      if (!text) return 0;
      return parseFloat(text.replace('R$', '').replace('%', '').replace('.', '').replace(',', '.').trim());
    };

    // --- EXTRAÇÃO DE DADOS ---
    
    // 1. Preço Atual (Geralmente no topo, classe .value)
    // O StatusInvest coloca o valor dentro de um <strong class="value">
    const priceText = $('.info:contains("Valor atual") .value').text();
    
    // 2. Dividend Yield
    const dyText = $('.info:contains("Dividend Yield") .value').text();
    
    // 3. P/VP
    const pvpText = $('.info:contains("P/VP") .value').text();
    
    // 4. Último Rendimento (Procura na tabela de último rendimento)
    // Geralmente está num bloco com título "Último rendimento"
    const lastDivText = $('.info:contains("Último rendimento") .value').first().text();

    // Monta o objeto final
    const data = {
      ticker: ticker.toUpperCase(),
      price: cleanNumber(priceText),
      dy: cleanNumber(dyText),
      pvp: cleanNumber(pvpText),
      lastDividend: cleanNumber(lastDivText),
      source: 'StatusInvest'
    };

    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro no Scraper StatusInvest:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados', details: error.message });
  }
}