import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    // TENTATIVA 2: USANDO O STATUS INVEST
    const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase()}`;
    
    // Precisamos fingir ser um navegador real (User-Agent) para não tomar bloqueio
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    if (!response.ok) {
        throw new Error(`Falha ao acessar site fonte (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let lastDividend = 0;

    // Estratégia de busca no HTML do Status Invest
    // Eles colocam os dados dentro de divs com a classe 'info'
    // Vamos procurar a div que tem o título "Último rendimento"
    $('.info').each((i, el) => {
        const title = $(el).find('h3.title').text().trim().toLowerCase();
        
        if (title.includes('último rendimento')) {
            const valueText = $(el).find('strong.value').text().trim();
            // Limpa R$ e troca vírgula por ponto
            const cleanValue = valueText.replace('R$', '').replace(',', '.').trim();
            lastDividend = parseFloat(cleanValue);
        }
    });

    // Retorna o resultado
    return res.status(200).json({ 
        dividend: lastDividend || 0, 
        ticker: ticker.toUpperCase(),
        source: 'Status Invest' 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    return res.status(200).json({ dividend: 0, source: 'Error', details: error.message });
  }
}