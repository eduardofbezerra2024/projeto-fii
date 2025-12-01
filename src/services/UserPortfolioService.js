import { supabase } from '@/lib/customSupabaseClient';

export const PortfolioService = {
  // Buscar carteira do usuário
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

 // Adicionar ativo
  async addAsset(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    const { data, error } = await supabase
      .from('user_portfolio')
      .insert({
        user_id: user.id,
        ticker: asset.ticker,
        quantity: asset.quantity,
        price: asset.price,
        sector: asset.sector,
        purchase_date: asset.purchaseDate // <--- NOVIDADE AQUI
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remover ativo
  async removeAsset(id) {
    const { error } = await supabase
      .from('user_portfolio')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Atualizar ativo
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