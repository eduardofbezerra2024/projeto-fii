import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    const url = `https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`;
    
    // Cabeçalhos reforçados para parecer um Chrome legítimo
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
        // Se falhar no Investidor10, tenta Status Invest como plano B
        console.log(`Investidor10 falhou (${response.status}), tentando Status Invest...`);
        return tryStatusInvest(ticker, res);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let lastDividend = 0;

    // --- ESTRATÉGIA "CAÇA-PALAVRAS" (INVESTIDOR10) ---
    
    // O Investidor10 organiza os dados em cards. 
    // Vamos procurar em TODOS os elementos visuais que tenham texto.
    
    // 1. Procura nos Cards do Topo (onde geralmente fica)
    $('div._card').each((i, el) => {
        // Pega todo o texto do cabeçalho desse card
        const headerText = $(el).find('._card-header').text().trim().toLowerCase();
        
        if (headerText.includes('último rendimento')) {
            // Se achou o título, pega o valor do corpo do card
            const valueText = $(el).find('._card-body').text().trim();
            // Limpa o valor (Tira R$, espaços e troca vírgula por ponto)
            const cleanValue = valueText.replace(/[^0-9,]/g, '').replace(',', '.');
            
            const parsed = parseFloat(cleanValue);
            if (!isNaN(parsed)) {
                lastDividend = parsed;
                return false; // Para de procurar
            }
        }
    });

    // 2. Se não achou nos cards, procura na Tabela de Dividendos
    if (lastDividend === 0) {
        // Tenta achar a primeira linha da tabela de proventos
        const tableValue = $('#table-dividends-history tbody tr').first().find('td').eq(1).text().trim();
        if (tableValue) {
             const cleanValue = tableValue.replace(/[^0-9,]/g, '').replace(',', '.');
             lastDividend = parseFloat(cleanValue) || 0;
        }
    }

    if (lastDividend > 0) {
        return res.status(200).json({ 
            dividend: lastDividend, 
            ticker: ticker.toUpperCase(),
            source: 'Investidor10' 
        });
    } else {
        // Se ainda assim for zero, tenta o Status Invest
        console.log("Investidor10 retornou zero, tentando Status Invest...");
        return tryStatusInvest(ticker, res);
    }

  } catch (error) {
    console.error('Erro no Scraper Investidor10:', error);
    return tryStatusInvest(ticker, res);
  }
}

// --- FUNÇÃO AUXILIAR: PLANO B (STATUS INVEST) ---
async function tryStatusInvest(ticker, res) {
    try {
        const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase()}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) throw new Error("Status Invest Blocked");

        const html = await response.text();
        const $ = cheerio.load(html);
        let dividend = 0;

        // Busca genérica por blocos de informação
        $('.info').each((i, el) => {
            const title = $(el).find('h3.title').text().trim().toLowerCase();
            if (title.includes('último') && title.includes('rendimento')) {
                const val = $(el).find('strong.value').text().trim();
                dividend = parseFloat(val.replace('R$', '').replace(',', '.').trim());
            }
        });

        return res.status(200).json({ 
            dividend: dividend || 0, 
            ticker: ticker.toUpperCase(),
            source: dividend > 0 ? 'Status Invest' : 'Not Found' 
        });

    } catch (e) {
        return res.status(200).json({ dividend: 0, source: 'Error', details: e.message });
    }
}