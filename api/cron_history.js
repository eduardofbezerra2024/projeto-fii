// src/pages/api/cron_history.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // 1. Pegar todas as carteiras de todos os usuários
    const { data: portfolios, error } = await supabase
      .from('user_portfolio')
      .select('user_id, price, quantity, currentPrice');

    if (error) throw error;

    // 2. Calcular o total por usuário
    const totalsByUser = {};

    portfolios.forEach(item => {
      const price = item.currentPrice || item.price || 0;
      const total = price * (item.quantity || 0);

      if (!totalsByUser[item.user_id]) {
        totalsByUser[item.user_id] = 0;
      }
      totalsByUser[item.user_id] += total;
    });

    // 3. Salvar no banco (Tirar a foto)
    const records = Object.entries(totalsByUser).map(([userId, total]) => ({
      user_id: userId,
      total_value: total,
      snapshot_date: new Date().toISOString() // Salva a data de hoje
    }));

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
    console.error('Erro no snapshot:', err);
    return res.status(500).json({ error: err.message });
  }
}