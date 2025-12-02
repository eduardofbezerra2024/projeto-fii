// api/dividend.js
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    // 1. Acessa a página do Investidor10
    const url = `https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
        throw new Error('Falha ao acessar site fonte');
    }

    const html = await response.text();
    
    // 2. Lê o HTML
    const $ = cheerio.load(html);

    // 3. Procura o valor do dividendo na tela
    let lastDividend = 0;

    // O Investidor10 usa cards. Vamos procurar o que tem "Último Rendimento"
    $('div._card').each((i, el) => {
        const title = $(el).find('div._card-header span').text().trim();
        if (title.includes('Último Rendimento')) {
            const valueText = $(el).find('div._card-body div._card-value').text().trim();
            // Limpa o texto (tira R$, troca vírgula por ponto)
            const cleanValue = valueText.replace('R$', '').replace(',', '.').trim();
            lastDividend = parseFloat(cleanValue);
        }
    });

    // 4. Devolve o resultado
    return res.status(200).json({ 
        dividend: lastDividend || 0, 
        ticker: ticker.toUpperCase(),
        source: 'Investidor10' 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados', details: error.message });
  }
}