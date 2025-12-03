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

    // Objeto para guardar TUDO que encontrarmos
    const fullData = {};

    // Itera sobre todos os cartões de informação da página
    $('div.cell').each((i, el) => {
        const descDiv = $(el).find('div.desc');
        const titleText = descDiv.find('span.name').text().trim().toUpperCase();
        const valueSpan = descDiv.find('div.value > span');
        let valueText = valueSpan.text().trim();

        if (titleText && valueText) {
            // Mapeia os títulos do site para chaves do nosso JSON
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

    // Tratamento especial para números (para manter compatibilidade com o modal de adicionar)
    let dividendNumber = 0;
    if (fullData.ultimoRendimento) {
        const clean = fullData.ultimoRendimento.replace('R$', '').replace(/\s/g, '').replace(',', '.');
        dividendNumber = parseFloat(clean) || 0;
    }

    return res.status(200).json({ 
        ticker: ticker.toUpperCase(),
        dividend: dividendNumber, // Mantemos esse para não quebrar o Modal de adicionar
        fundType: fullData.tipoFundo, // Mantemos esse para não quebrar o Modal de adicionar
        details: fullData, // AQUI ESTÁ O OURO: Todos os dados novos detalhados
        source: 'Investidor10 (Scraper V7)' 
    });

  } catch (error) {
    console.error('Erro no Scraper:', error);
    return res.status(200).json({ dividend: 0, source: 'Error', details: error.message });
  }
}