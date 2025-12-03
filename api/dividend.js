import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    const url = `https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`;
    
    // Headers reforçados para evitar bloqueio (403 Forbidden)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://google.com',
      }
    });

    if (!response.ok) {
        throw new Error(`Falha ao acessar Investidor10 (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let lastDividend = 0;

    // --- ESTRATÉGIA BASEADA NOS PRINTS ---
    // Itera sobre todos os cartões de informação (div.cell)
    $('div.cell').each((i, el) => {
        // Dentro da célula, busca a div de descrição
        const descDiv = $(el).find('div.desc');
        
        // Pega o texto do título (o span dentro da desc)
        const titleText = descDiv.find('span.name').text().trim().toUpperCase();
        
        // Verifica se é o card correto
        if (titleText.includes('ÚLTIMO RENDIMENTO')) {
            
            // Pega o valor que está dentro de div.value > span
            const valueSpan = descDiv.find('div.value > span');
            const valueText = valueSpan.text().trim(); // Ex: "R$ 0,10"
            
            if (valueText) {
                // Limpeza: Remove R$, espaços e troca vírgula por ponto
                const cleanValue = valueText
                    .replace('R$', '')
                    .replace(/\s/g, '') // remove espaços
                    .replace(',', '.')
                    .trim();
                
                const parsed = parseFloat(cleanValue);
                
                if (!isNaN(parsed)) {
                    lastDividend = parsed;
                    return false; // Break do loop do jQuery/Cheerio
                }
            }
        }
    });

    // Se não achou (manteve 0), loga erro mas retorna 0 para não quebrar o front
    if (lastDividend === 0) {
        console.warn(`Aviso: Dividendos não encontrados para ${ticker}. Layout pode ter mudado.`);
    }

    return res.status(200).json({ 
        dividend: lastDividend, 
        ticker: ticker.toUpperCase(),
        source: 'Investidor10 (Scraper V5)' 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    // Retorna 200 com valor 0 para o frontend tratar e permitir inserção manual
    return res.status(200).json({ dividend: 0, source: 'Error', details: error.message });
  }
}