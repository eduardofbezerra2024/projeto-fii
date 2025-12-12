// src/pages/api/dividend_history.js
export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) return res.status(400).json({ error: 'Ticker obrigatório' });

  // Adiciona .SA se não tiver
  const symbol = ticker.toUpperCase().endsWith('.SA') 
    ? ticker.toUpperCase() 
    : `${ticker.toUpperCase()}.SA`;

  try {
    // Busca histórico de 2 anos, apenas dividendos ('events=div')
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2y&interval=1mo&events=div`;

    const response = await fetch(url);
    const data = await response.json();
    const result = data.chart.result?.[0];

    if (!result || !result.events || !result.events.dividends) {
      return res.status(200).json([]);
    }

    const dividendsMap = result.events.dividends;
    
    // Formata para array limpo
    const history = Object.values(dividendsMap).map(item => {
        const date = new Date(item.date * 1000);
        return {
            date: date.toISOString().split('T')[0], // 2024-01-15
            monthYear: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }), // jan. de 2024
            amount: item.amount
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json(history);

  } catch (error) {
    console.error('Erro API Dividend History:', error);
    return res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
}