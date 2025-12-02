// api/dividend.js
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    // TENTATIVA 2: USANDO O STATUS INVEST
    const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error('Falha ao acessar site fonte');

    const html = await response.text();
    const $ = cheerio.load(html);

    // O Status Invest coloca o último rendimento numa div específica
    // Geralmente procura por "Último rendimento" e pega o valor associado
    let lastDividend = 0;

    // Estratégia de busca no HTML do Status Invest
    // Procura o bloco que tem o título "Último rendimento"
    $('.info').each((i, el) => {
        const title = $(el).find('h3.title').text().trim().toLowerCase();
        if (title.includes('último rendimento')) {
            const valueText = $(el).find('strong.value').text().trim();
            // Limpa R$ e vírgulas
            const cleanValue = valueText.replace('R$', '').replace(',', '.').trim();
            lastDividend = parseFloat(cleanValue);
        }
    });

    return res.status(200).json({ 
        dividend: lastDividend || 0, 
        ticker: ticker.toUpperCase(),
        source: 'Status Invest' 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    // Retorna 0 em vez de erro para não quebrar o front
    return res.status(200).json({ dividend: 0, source: 'Error' });
  }
}