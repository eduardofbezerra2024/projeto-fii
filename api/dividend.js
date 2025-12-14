import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  try {
    const url = `https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`;
    
    // Adicionei cache: 'no-store' para evitar dados velhos na Vercel
    const response = await fetch(url, {
      cache: 'no-store', 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://google.com',
      }
    });

    if (!response.ok) {
        console.error(`Falha ao acessar Investidor10: ${response.status}`);
        // Retorna zerado mas com estrutura válida para não quebrar o front
        return res.status(200).json({ 
            dividend: 0, 
            ultimoRendimento: "0.00", 
            fundType: "Indefinido",
            segmento: "Indefinido"
        });
    }

    const html = await response.text();
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
            if (titleText.includes('PÚBLICO-ALVO')) fullData.publicoAlvo = valueText;
            if (titleText.includes('MANDATO')) fullData.mandato = valueText;
            if (titleText.includes('SEGMENTO')) fullData.segmento = valueText;
            if (titleText.includes('TIPO DE FUNDO')) fullData.tipoFundo = valueText;
            if (titleText.includes('PRAZO DE DURAÇÃO')) fullData.prazo = valueText;
            if (titleText.includes('TIPO DE GESTÃO')) fullData.gestao = valueText;
            if (titleText.includes('TAXA DE ADMINISTRAÇÃO')) fullData.taxaAdm = valueText;
            if (titleText.includes('VACÂNCIA')) fullData.vacancia = valueText;
            if (titleText.includes('NÚMERO DE COTISTAS')) fullData.cotistas = valueText;
            if (titleText.includes('COTAS EMITIDAS')) fullData.cotasEmitidas = valueText;
            if (titleText.includes('VAL. PATRIMONIAL P/ COTA')) fullData.vpa = valueText;
            if (titleText.includes('VALOR PATRIMONIAL')) fullData.valorPatrimonial = valueText;
            if (titleText.includes('ÚLTIMO RENDIMENTO')) fullData.ultimoRendimento = valueText;
        }
    });

    let dividendNumber = 0;
    if (fullData.ultimoRendimento) {
        const clean = fullData.ultimoRendimento.replace('R$', '').replace(/\s/g, '').replace(',', '.');
        dividendNumber = parseFloat(clean) || 0;
    }

    return res.status(200).json({ 
        ticker: ticker.toUpperCase(),
        dividend: dividendNumber,
        ultimoRendimento: fullData.ultimoRendimento,
        
        // --- AQUI ESTÁ A CORREÇÃO PRINCIPAL ---
        fundType: fullData.tipoFundo || 'Indefinido', // Trazido para a raiz
        segmento: fullData.segmento || 'Indefinido',  // Trazido para a raiz
        // --------------------------------------

        details: fullData, 
        source: 'Investidor10 (Scraper V7)' 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    return res.status(200).json({ dividend: 0, fundType: "Indefinido", source: 'Error', details: error.message });
  }
}