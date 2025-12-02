import { supabase } from '@/lib/customSupabaseClient';

export const PortfolioService = {
  // Buscar carteira
  async getPortfolio() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id);

    if (error) { console.error(error); return []; }
    return data;
  },

  // Adicionar transação (mantendo a lógica que criamos antes)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login necessário');

    // 1. Log da Transação
    const { error: transError } = await supabase
      .from('portfolio_transactions')
      .insert({
        user_id: user.id,
        ticker: asset.ticker,
        quantity: asset.quantity,
        price: asset.price,
        date: asset.purchaseDate || new Date()
      });
    if (transError) throw transError;

    // 2. Lógica de carteira (Upsert)
    const { data: currentPosition } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .single();

    let newQuantity = Number(asset.quantity);
    let newAvgPrice = Number(asset.price);

    if (currentPosition) {
        const oldQty = Number(currentPosition.quantity);
        const oldPrice = Number(currentPosition.price);
        const totalQty = oldQty + newQuantity;
        const totalValue = (oldQty * oldPrice) + (newQuantity * newAvgPrice);
        newQuantity = totalQty;
        newAvgPrice = totalValue / totalQty;
    }

    const { data, error } = await supabase
      .from('user_portfolio')
      .upsert({
        user_id: user.id,
        id: currentPosition?.id, 
        ticker: asset.ticker,
        quantity: newQuantity,
        price: newAvgPrice,
        sector: asset.sector,
        purchase_date: currentPosition?.purchase_date || asset.purchaseDate 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- AQUI ESTÁ A MUDANÇA PARA DESCOBRIR O ERRO ---
  async removeAsset(id) {
    console.log("Tentando apagar ID:", id); // Vai aparecer no console (F12)

    // count: 'exact' pede para o banco contar quantos apagou
    const { error, count } = await supabase
      .from('user_portfolio')
      .delete({ count: 'exact' }) 
      .eq('id', id);

    if (error) throw error;
    
    // Se a contagem for zero, lança um erro para você ver na tela!
    if (count === 0) {
        throw new Error("Item não encontrado ou você não tem permissão para apagá-lo.");
    }
  },

  // Atualizar
  async updateAsset(id, updates) {
    const { data, error } = await supabase
      .from('user_portfolio')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};