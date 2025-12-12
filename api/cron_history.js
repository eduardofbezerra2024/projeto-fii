import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // --- 1. CONFIGURAÇÃO ROBUSTA DAS CHAVES ---
    // Tenta pegar VITE_ (seu caso) ou NEXT_PUBLIC_ (padrão)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Verificação de segurança: Se faltar chave, avisa no log em vez de quebrar silenciosamente
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Configuração inválida. URL: ${!!supabaseUrl}, KEY: ${!!supabaseServiceKey}. Verifique as Variáveis de Ambiente na Vercel.`);
    }

    // Cria o cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- 2. LÓGICA DO SNAPSHOT (A FOTO DA CARTEIRA) ---
    
    // Pegar todas as carteiras de todos os usuários
    const { data: portfolios, error } = await supabase
      .from('user_portfolio')
      .select('user_id, price, quantity, currentPrice');

    if (error) throw error;

    if (!portfolios || portfolios.length === 0) {
      return res.status(200).json({ message: 'Nenhuma carteira encontrada para salvar.' });
    }

    // Calcular o total por usuário
    const totalsByUser = {};

    portfolios.forEach(item => {
      // Prioriza preço atual, se não tiver usa preço médio
      const price = Number(item.currentPrice) || Number(item.price) || 0;
      const qtd = Number(item.quantity) || 0;
      const total = price * qtd;

      if (!totalsByUser[item.user_id]) {
        totalsByUser[item.user_id] = 0;
      }
      totalsByUser[item.user_id] += total;
    });

    // Preparar dados para salvar
    const records = Object.entries(totalsByUser).map(([userId, total]) => ({
      user_id: userId,
      total_value: total,
      // snapshot_date é preenchido automaticamente pelo banco com a data de hoje
    }));

    // Salvar no banco
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
    console.error('Erro Fatal no Cron History:', err.message);
    // Retorna o erro exato para você ver na tela em vez de apenas "500"
    return res.status(500).json({ 
      error: 'Erro interno ao processar histórico', 
      details: err.message 
    });
  }
}