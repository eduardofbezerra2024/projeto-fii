// pages/api/history.js
export default async function handler(req, res) {
  const { ticker, range = '6mo' } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker obrigatorio' });
  }

  // Adiciona .SA para ações brasileiras se não tiver
  const symbol = ticker.toUpperCase().endsWith('.SA') 
    ? ticker.toUpperCase() 
    : `${ticker.toUpperCase()}.SA`;

  try {
    // Yahoo Finance API endpoint (JSON direto)
    // Ranges comuns: 1mo, 3mo, 6mo, 1y, 5y
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
        throw new Error('Falha ao buscar dados no Yahoo Finance');
    }

    const data = await response.json();
    const result = data.chart.result[0];

    if (!result || !result.timestamp) {
        return res.status(200).json([]);
    }

    // Formatar os dados para o Recharts
    const quotes = result.indicators.quote[0].close;
    const timestamps = result.timestamp;

    const history = timestamps.map((ts, index) => {
        const date = new Date(ts * 1000);
        return {
            // Formato DD/MM para o eixo X
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            fullDate: date.toLocaleDateString('pt-BR'),
            price: quotes[index] || 0 // Trata nulos
        };
    }).filter(item => item.price > 0); // Remove dias sem negociação/erros

    return res.status(200).json(history);

  } catch (error) {
    console.error('Erro API History:', error);
    return res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
}