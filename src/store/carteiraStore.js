import { supabase } from '@/lib/customSupabaseClient';

export const PortfolioService = {
  // 1. Buscar carteira
  async getPortfolio() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao buscar carteira:', error);
      return [];
    }
    return data;
  },

  // 2. Buscar transações
  async getTransactions(ticker) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('portfolio_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
    return data;
  },

  // 3. ADICIONAR (CORRIGIDO PARA SALVAR O DONO)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    // A. Salvar Histórico
    const { error: transError } = await supabase
      .from('portfolio_transactions')
      .insert({
        user_id: user.id,
        ticker: asset.ticker,
        quantity: asset.quantity,
        price: asset.price,
        date: asset.purchaseDate || new Date(),
        type: 'buy'
      });

    if (transError) throw transError;

    // B. Buscar posição atual
    const { data: currentPosition } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .single();

    let newQuantity = Number(asset.quantity);
    let newAvgPrice = Number(asset.price);

    // C. Calcular Preço Médio
    if (currentPosition) {
      const oldQty = Number(currentPosition.quantity);
      const oldPrice = Number(currentPosition.price);
      const addedQty = Number(asset.quantity);
      const addedPrice = Number(asset.price);

      const totalQty = oldQty + addedQty;
      const totalValue = (oldQty * oldPrice) + (addedQty * addedPrice);
      
      newQuantity = totalQty;
      newAvgPrice = totalValue / totalQty;
    }

    // D. Salvar na Carteira (AGORA COM O OWNER)
    const { data, error } = await supabase
      .from('user_portfolio')
      .upsert({
        user_id: user.id,
        id: currentPosition?.id, 
        ticker: asset.ticker,
        quantity: newQuantity,
        price: newAvgPrice,
        sector: asset.sector,
        purchase_date: currentPosition?.purchase_date || asset.purchaseDate,
        last_dividend: asset.lastDividend || currentPosition?.last_dividend || 0,
        fii_type: asset.fiiType || currentPosition?.fii_type || 'Indefinido',
        
        // --- AQUI ESTAVA FALTANDO ---
        owner: asset.owner || currentPosition?.owner || 'Geral' 
        // ---------------------------
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 4. Remover
  async removeAsset(id) {
    const { error, count } = await supabase.from('user_portfolio').delete({ count: 'exact' }).eq('id', id);
    if (error) throw error;
    if (count === 0) throw new Error("Item não encontrado.");
  },

  // 5. Atualizar
  async updateAsset(id, updates) {
    const { data, error } = await supabase.from('user_portfolio').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // 6. Vender
  async sellAsset(ticker, quantityToSell, sellPrice, date) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login necessário');

    const { data: position } = await supabase.from('user_portfolio').select('*').eq('user_id', user.id).eq('ticker', ticker).single();

    if (!position || Number(position.quantity) < Number(quantityToSell)) throw new Error('Saldo insuficiente.');

    const currentQty = Number(position.quantity);
    const avgPrice = Number(position.price);
    const saleValue = Number(sellPrice);
    const qty = Number(quantityToSell);
    const profit = (saleValue - avgPrice) * qty;

    await supabase.from('closed_positions').insert({
        user_id: user.id, ticker: ticker, quantity: qty, avg_price_buy: avgPrice, price_sell: saleValue, profit_loss: profit, date: date || new Date()
    });

    await supabase.from('portfolio_transactions').insert({
        user_id: user.id, ticker: ticker, quantity: qty, price: saleValue, date: date || new Date(), type: 'sell'
    });

    const newQty = currentQty - qty;
    if (newQty > 0) {
        await supabase.from('user_portfolio').update({ quantity: newQty }).eq('id', position.id);
    } else {
        await supabase.from('user_portfolio').delete().eq('id', position.id);
    }
    return { profit };
  },

  // 7. Histórico
  async getEvolutionHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('portfolio_history').select('*').eq('user_id', user.id).order('snapshot_date', { ascending: true });
    if (error) return [];
    return data;
  }
};