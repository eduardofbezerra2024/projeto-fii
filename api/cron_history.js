import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Configuração inválida: Faltam variáveis de ambiente.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função Auxiliar: Busca Preço Atual no Yahoo (Igual ao robô de alertas)
async function getCurrentPrice(ticker) {
  try {
    const symbol = ticker.toUpperCase().endsWith('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    const data = await res.json();
    return data.chart.result[0].meta.regularMarketPrice;
  } catch (err) { 
    return null; 
  }
}

export default async function handler(req, res) {
  try {
    // 1. Pegar carteiras (REMOVIDO 'currentPrice' QUE DAVA ERRO)
    // Agora pegamos o 'ticker' para poder consultar o preço na hora
    const { data: portfolios, error } = await supabase
      .from('user_portfolio')
      .select('user_id, ticker, price, quantity');

    if (error) throw error;

    if (!portfolios || portfolios.length === 0) {
      return res.status(200).json({ message: 'Nenhuma carteira encontrada.' });
    }

    // 2. Calcular o total por usuário
    const totalsByUser = {};

    // Como buscar preços demora, vamos fazer um loop inteligente
    for (const item of portfolios) {
      const qtd = Number(item.quantity) || 0;
      
      // Tenta pegar preço atual (Yahoo). Se falhar, usa o Preço Médio pago.
      let priceToUse = Number(item.price); 
      
      const livePrice = await getCurrentPrice(item.ticker);
      if (livePrice) {
        priceToUse = livePrice;
      }

      const total = priceToUse * qtd;

      if (!totalsByUser[item.user_id]) {
        totalsByUser[item.user_id] = 0;
      }
      totalsByUser[item.user_id] += total;
    }

    // 3. Preparar dados para salvar
    const records = Object.entries(totalsByUser).map(([userId, total]) => ({
      user_id: userId,
      total_value: total,
      // snapshot_date é automático no banco
    }));

    // 4. Salvar no banco
    if (records.length > 0) {
      const { error: insertError } = await supabase
        .from('portfolio_history')
        .insert(records);
      
      if (insertError) throw insertError;
    }

    return res.status(200).json({ 
      success: true, 
      message: `${records.length} históricos salvos com sucesso!` 
    });

  } catch (err) {
    console.error('Erro Cron History:', err.message);
    return res.status(500).json({ 
      error: 'Erro interno ao processar histórico', 
      details: err.message 
    });
  }
}