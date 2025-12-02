import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    // URL do Status Invest
    const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase()}`;
    
    // User-Agent de navegador real para evitar bloqueio
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

    // ESTRATÉGIA NOVAN:
    // O Status Invest coloca os dados principais (Preço, DY, Ultimo Rendimento) numa lista de divs com classe 'info'
    // O 'Último Rendimento' costuma ser o 4º ou 5º item, mas vamos procurar pelo título
    
    $('.info').each((i, el) => {
        // Pega o título do bloco (ex: "Último rendimento")
        const title = $(el).find('h3.title').text().trim().toLowerCase();
        
        // Verifica se tem "último" E "rendimento" no título
        if (title.includes('último') && title.includes('rendimento')) {
            // Pega o valor que está na classe .value
            const valueText = $(el).find('strong.value').text().trim();
            // Limpa (Tira R$, troca vírgula por ponto)
            const cleanValue = valueText.replace('R$', '').replace(',', '.').trim();
            const parsed = parseFloat(cleanValue);
            
            if (!isNaN(parsed)) {
                lastDividend = parsed;
            }
        }
    });

    // Se falhar, tenta pegar o primeiro valor monetário que aparecer na seção de dividendos
    if (lastDividend === 0) {
       // Tenta pegar da tabela de proventos se existir
       const tableVal = $('#dy-table tbody tr').first().find('td').eq(2).text().trim();
       if (tableVal) {
          lastDividend = parseFloat(tableVal.replace(',', '.'));
       }
    }

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