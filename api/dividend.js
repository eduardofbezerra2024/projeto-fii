import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    const url = `https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://google.com',
      }
    });

    if (!response.ok) {
        throw new Error(`Falha ao acessar Investidor10 (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let lastDividend = 0;
    let fundType = null; // Nova variável para guardar o tipo

    // Itera sobre todos os cartões de informação
    $('div.cell').each((i, el) => {
        const descDiv = $(el).find('div.desc');
        const titleText = descDiv.find('span.name').text().trim().toUpperCase();
        
        // 1. Busca o Valor do Dividendo
        if (titleText.includes('ÚLTIMO RENDIMENTO')) {
            const valueSpan = descDiv.find('div.value > span');
            const valueText = valueSpan.text().trim();
            
            if (valueText) {
                const cleanValue = valueText.replace('R$', '').replace(/\s/g, '').replace(',', '.').trim();
                const parsed = parseFloat(cleanValue);
                if (!isNaN(parsed)) lastDividend = parsed;
            }
        }

        // 2. Busca o Tipo do Fundo (NOVO)
        if (titleText.includes('TIPO DE FUNDO')) {
            const typeSpan = descDiv.find('div.value > span');
            const typeText = typeSpan.text().trim().toUpperCase(); // Ex: "FUNDO DE PAPEL"
            
            if (typeText) {
                fundType = typeText;
            }
        }
    });

    return res.status(200).json({ 
        dividend: lastDividend, 
        fundType: fundType, // Retorna o tipo encontrado (ex: "FUNDO DE PAPEL")
        ticker: ticker.toUpperCase(),
        source: 'Investidor10 (Scraper V6)' 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    return res.status(200).json({ dividend: 0, fundType: null, source: 'Error', details: error.message });
  }
}