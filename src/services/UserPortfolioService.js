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
    
    if (error) return [];
    return data;
  },

  // 3. ADICIONAR COMPRA (CORRIGIDO: FILTRA POR DONO)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    // Define o Dono
    const ownerName = asset.owner && asset.owner.trim() !== '' ? asset.owner.trim() : 'Geral';

    // A. Salvar no Histórico
    const { error: transError } = await supabase
      .from('portfolio_transactions')
      .insert({
        user_id: user.id,
        ticker: asset.ticker,
        quantity: asset.quantity,
        price: asset.price,
        date: asset.purchaseDate || new Date(),
        type: 'buy',
        owner: ownerName
      });

    if (transError) throw transError;

    // B. Buscar posição atual (CONSIDERANDO O DONO AGORA!)
    const { data: currentPosition } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .eq('owner', ownerName) // <--- O PULO DO GATO: Diferencia Eduardo de Barbosa
      .maybeSingle();

    let newQuantity = Number(asset.quantity);
    let newAvgPrice = Number(asset.price);

    // C. Cálculo do Preço Médio
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

    // D. Atualizar ou Criar
    const { data, error } = await supabase
      .from('user_portfolio')
      .upsert({
        user_id: user.id,
        id: currentPosition?.id, // Se achou (Ticker+Dono), atualiza. Se não, cria novo.
        ticker: asset.ticker,
        quantity: newQuantity,
        price: newAvgPrice,
        sector: asset.sector,
        purchase_date: currentPosition?.purchase_date || asset.purchaseDate,
        last_dividend: asset.lastDividend || currentPosition?.last_dividend || 0,
        fii_type: asset.fiiType || currentPosition?.fii_type || 'Indefinido',
        owner: ownerName 
      })
      .select()
      .single();

    if (error) {
        console.error("Erro no Supabase:", error);
        throw error;
    }
    return data;
  },

  // 4. Remover ativo
  async removeAsset(id) {
    const { error } = await supabase
      .from('user_portfolio')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 5. Atualizar ativo
  async updateAsset(id, updates) {
    const { data, error } = await supabase
      .from('user_portfolio')
      .update({
          ...updates,
          owner: updates.owner || 'Geral'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 6. VENDER ATIVO (CORRIGIDO: FILTRA POR DONO)
  async sellAsset(ticker, quantityToSell, sellPrice, date, owner) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login necessário');

    // Define o Dono
    const ownerName = owner && owner.trim() !== '' ? owner.trim() : 'Geral';

    // 1. Buscar a posição atual (Ticker + Dono)
    const { data: position } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .eq('owner', ownerName) // <--- Busca o ativo do dono certo para vender
      .single();

    if (!position || Number(position.quantity) < Number(quantityToSell)) {
        throw new Error(`Saldo insuficiente para venda de ${ownerName}.`);
    }

    const currentQty = Number(position.quantity);
    const avgPrice = Number(position.price);
    const saleValue = Number(sellPrice);
    const qty = Number(quantityToSell);

    // 2. Calcular Lucro
    const profit = (saleValue - avgPrice) * qty;

    // 3. Histórico de Lucros
    await supabase.from('closed_positions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: qty,
        avg_price_buy: avgPrice,
        price_sell: saleValue,
        profit_loss: profit,
        date: date || new Date(),
        owner: ownerName
    });

    // 4. Histórico de Transações
    await supabase.from('portfolio_transactions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: qty,
        price: saleValue,
        date: date || new Date(),
        type: 'sell',
        owner: ownerName
    });

    // 5. Atualizar Carteira
    const newQty = currentQty - qty;

    if (newQty > 0) {
        await supabase
            .from('user_portfolio')
            .update({ quantity: newQty })
            .eq('id', position.id);
    } else {
        await supabase
            .from('user_portfolio')
            .delete()
            .eq('id', position.id);
    }

    return { profit };
  },

  // 7. Histórico Evolução
  async getEvolutionHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('portfolio_history')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true });

    if (error) return [];
    return data;
  }
};