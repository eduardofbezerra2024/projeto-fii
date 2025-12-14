import { supabase } from '@/lib/customSupabaseClient';

export const PortfolioService = {
  // 1. Buscar carteira (IGUAL AO SEU ORIGINAL)
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

  // 2. Buscar transações (IGUAL AO SEU ORIGINAL)
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

  // 3. ADICIONAR COMPRA (SEU CÓDIGO + CAMPO OWNER)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    // Define o Dono (Se vazio, vira Geral)
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
        owner: ownerName // <--- ÚNICA MUDANÇA AQUI
      });

    if (transError) throw transError;

    // B. Buscar posição atual (Pelo Ticker)
    const { data: currentPosition } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .maybeSingle(); // Usei maybeSingle para evitar erros se não achar

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

    // D. Atualizar ou Criar (Upsert)
    // Mantive sua lógica original, só adicionei o campo owner no final
    const { data, error } = await supabase
      .from('user_portfolio')
      .upsert({
        user_id: user.id,
        id: currentPosition?.id, // Importante: Se já existe, atualiza esse ID
        ticker: asset.ticker,
        quantity: newQuantity,
        price: newAvgPrice,
        sector: asset.sector,
        purchase_date: currentPosition?.purchase_date || asset.purchaseDate,
        last_dividend: asset.lastDividend || currentPosition?.last_dividend || 0,
        fii_type: asset.fiiType || currentPosition?.fii_type || 'Indefinido',
        owner: ownerName // <--- ÚNICA MUDANÇA AQUI (Salva o dono na carteira)
      })
      .select()
      .single();

    if (error) {
        console.error("Erro no Supabase:", error); // Log para te ajudar se der erro
        throw error;
    }
    return data;
  },

  // 4. Remover ativo (IGUAL AO SEU ORIGINAL)
  async removeAsset(id) {
    const { error } = await supabase
      .from('user_portfolio')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 5. Atualizar ativo (SEU CÓDIGO + CORREÇÃO PEQUENA)
  async updateAsset(id, updates) {
    const { data, error } = await supabase
      .from('user_portfolio')
      .update({
          ...updates,
          owner: updates.owner || 'Geral' // Garante que não salva vazio
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 6. VENDER ATIVO (SEU CÓDIGO ORIGINAL)
  async sellAsset(ticker, quantityToSell, sellPrice, date) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login necessário');

    // 1. Buscar a posição atual
    const { data: position } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .single();

    if (!position || Number(position.quantity) < Number(quantityToSell)) {
        throw new Error('Saldo insuficiente para venda.');
    }

    const currentQty = Number(position.quantity);
    const avgPrice = Number(position.price);
    const saleValue = Number(sellPrice);
    const qty = Number(quantityToSell);

    // 2. Calcular Lucro/Prejuízo
    const profit = (saleValue - avgPrice) * qty;

    // 3. Histórico de Lucros
    // Adicionei owner: position.owner para manter o histórico correto
    await supabase.from('closed_positions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: qty,
        avg_price_buy: avgPrice,
        price_sell: saleValue,
        profit_loss: profit,
        date: date || new Date(),
        owner: position.owner 
    });

    // 4. Histórico de Transações
    await supabase.from('portfolio_transactions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: qty,
        price: saleValue,
        date: date || new Date(),
        type: 'sell',
        owner: position.owner
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

  // 7. Histórico Evolução (IGUAL AO SEU ORIGINAL)
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