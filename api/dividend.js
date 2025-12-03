import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    const url = `https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`;
    
    // Simula um navegador real
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
        throw new Error(`Falha ao acessar Investidor10 (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let lastDividend = 0;

    // --- ESTRATÉGIA BASEADA NO SEU PRINT ---
    // Procura dentro das divs com classe 'desc'
    $('div.desc').each((i, el) => {
        // Pega o texto e limpa (tira espaços e quebras de linha)
        const text = $(el).text().trim().toUpperCase();
        
        // Se achou o rótulo "ÚLTIMO RENDIMENTO"
        if (text.includes('ÚLTIMO RENDIMENTO')) {
            
            // O valor está no PRÓXIMO elemento irmão (o .value logo abaixo)
            // .next() pega o vizinho imediato
            const valueDiv = $(el).next('.value');
            
            if (valueDiv.length > 0) {
                const valueText = valueDiv.find('span').text().trim(); // "R$ 0,10"
                
                // Limpa o valor (tira R$ e troca vírgula por ponto)
                const cleanValue = valueText.replace('R$', '').replace(',', '.').trim();
                const parsed = parseFloat(cleanValue);
                
                if (!isNaN(parsed)) {
                    lastDividend = parsed;
                    return false; // Para o loop pois achamos!
                }
            }
        }
    });

    return res.status(200).json({ 
        dividend: lastDividend, 
        ticker: ticker.toUpperCase(),
        source: 'Investidor10 (Scraper V4)' 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    return res.status(200).json({ dividend: 0, source: 'Error', details: error.message });
  }
}