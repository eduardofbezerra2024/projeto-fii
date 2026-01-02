import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  const cleanTicker = ticker.toLowerCase().trim();

  // 1. Tenta adivinhar o tipo pelo final do código para ser mais rápido
  let typesToTry = ['fiis', 'acoes', 'bdrs']; // Ordem padrão

  if (cleanTicker.endsWith('34')) {
    typesToTry = ['bdrs', 'acoes', 'fiis'];
  } else if (/[3456]$/.test(cleanTicker)) { // Termina em 3, 4, 5 ou 6
    typesToTry = ['acoes', 'bdrs', 'fiis'];
  } else if (cleanTicker.endsWith('11')) {
    typesToTry = ['fiis', 'acoes', 'bdrs']; // 11 geralmente é FII ou Unit
  }

  try {
    let html = null;
    let foundType = '';

    // Tenta as URLs na ordem de prioridade até achar uma que funcione
    for (const type of typesToTry) {
        const url = `https://investidor10.com.br/${type}/${cleanTicker}/`;
        try {
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });

            if (response.ok) {
                // Verificação extra: Às vezes o site redireciona para a home se não achar
                const finalUrl = response.url;
                if (!finalUrl.includes('investidor10.com.br')) continue; 
                
                html = await response.text();
                foundType = type; // Guardamos onde achamos (fiis, acoes ou bdrs)
                break; // Achou! Para de procurar.
            }
        } catch (err) {
            console.log(`Tentativa falhou para ${type}:`, err.message);
        }
    }

    if (!html) {
        // Se não achou em lugar nenhum
        return res.status(200).json({ dividend: 0, fundType: "Indefinido", source: 'Not Found' });
    }

    const $ = cheerio.load(html);
    const fullData = {};

    $('div.cell').each((i, el) => {
        const descDiv = $(el).find('div.desc');
        const titleText = descDiv.find('span.name').text().trim().toUpperCase();
        const valueSpan = descDiv.find('div.value > span');
        let valueText = valueSpan.text().trim();

        if (titleText && valueText) {
            if (titleText.includes('RAZÃO SOCIAL')) fullData.razaoSocial = valueText;
            if (titleText.includes('CNPJ')) fullData.cnpj = valueText;
            if (titleText.includes('SEGMENTO')) fullData.segmento = valueText;
            if (titleText.includes('TIPO DE FUNDO') || titleText.includes('TIPO')) fullData.tipoFundo = valueText;
            if (titleText.includes('P/VP')) fullData.pvp = valueText;
            if (titleText.includes('ÚLTIMO RENDIMENTO') || titleText.includes('DIVIDEND YIELD')) fullData.ultimoRendimento = valueText;
        }
    });

    let dividendNumber = 0;
    if (fullData.ultimoRendimento) {
        const clean = fullData.ultimoRendimento.replace('R$', '').replace('%', '').replace(/\s/g, '').replace(',', '.');
        dividendNumber = parseFloat(clean) || 0;
    }

    // Normaliza o Tipo para o seu sistema
    let systemType = 'Indefinido';
    
    if (foundType === 'bdrs') systemType = 'BDR';
    else if (foundType === 'acoes') systemType = 'Ação';
    else if (fullData.tipoFundo) systemType = fullData.tipoFundo; // Mantém Tijolo/Papel para FIIs

    return res.status(200).json({ 
        ticker: ticker.toUpperCase(),
        dividend: dividendNumber,
        ultimoRendimento: fullData.ultimoRendimento,
        fundType: systemType, // Agora retorna "Ação", "BDR" ou "Tijolo/Papel"
        segmento: fullData.segmento || 'Indefinido',
        details: fullData, 
        source: `Investidor10 (${foundType})` 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    return res.status(200).json({ dividend: 0, fundType: "Indefinido", source: 'Error' });
  }
}