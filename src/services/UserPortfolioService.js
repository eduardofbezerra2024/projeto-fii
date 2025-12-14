import { supabase } from '@/lib/customSupabaseClient';

export const PortfolioService = {
  // 1. Buscar carteira consolidada do usuário
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

  // 2. Buscar histórico de transações
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

  // 3. ADICIONAR NOVA COMPRA (CORRIGIDO: Lógica robusta com Upsert)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    // Define o nome do investidor (Se vier vazio, vira 'Geral')
    const ownerName = asset.owner && asset.owner.trim() !== '' ? asset.owner.trim() : 'Geral';
    
    // A. Salvar no Histórico (Log da Transação)
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

    // B. Buscar Posição Atual (Busca pelo TICKER, independente do dono atual)
    // Isso evita o erro de duplicidade que travou seu sistema
    const { data: currentPosition } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .maybeSingle();

    let newQuantity = Number(asset.quantity);
    let newAvgPrice = Number(asset.price);
    let targetId = null; // Se continuar null, cria novo. Se tiver ID, atualiza.

    // C. Calcular Preço Médio (Se já existir)
    if (currentPosition) {
      targetId = currentPosition.id; // Pega o ID existente para não duplicar
      
      const oldQty = Number(currentPosition.quantity);
      const oldPrice = Number(currentPosition.price);
      const addedQty = Number(asset.quantity);
      const addedPrice = Number(asset.price);

      const totalQty = oldQty + addedQty;
      const totalValue = (oldQty * oldPrice) + (addedQty * addedPrice);
      
      newQuantity = totalQty;
      newAvgPrice = totalValue / totalQty;
    }

    // D. Salvar na Carteira (Upsert Inteligente)
    // Se targetId existe, ele ATUALIZA. Se não, ele CRIA.
    const { data, error } = await supabase
      .from('user_portfolio')
      .upsert({
        id: targetId, // O segredo está aqui: passar o ID evita o erro de duplicidade
        user_id: user.id,
        ticker: asset.ticker,
        quantity: newQuantity,
        price: newAvgPrice,
        sector: asset.sector,
        purchase_date: currentPosition?.purchase_date || asset.purchaseDate,
        last_dividend: asset.lastDividend || currentPosition?.last_dividend || 0,
        fii_type: asset.fiiType || currentPosition?.fii_type || 'Indefinido',
        owner: ownerName // Atualiza o dono para o nome de quem comprou agora
      })
      .select()
      .single();

    if (error) {
        console.error("Erro ao salvar na carteira:", error);
        throw error;
    }
    return data;
  },

  // 4. Remover ativo
  async removeAsset(id) {
    const { error } = await supabase.from('user_portfolio').delete().eq('id', id);
    if (error) throw error;
  },

  // 5. ATUALIZAR (Edição Manual)
  async updateAsset(id, updates) {
    // Prepara dados para atualizar
    const dataToUpdate = { ...updates };
    
    // Garante que o campo owner seja tratado corretamente
    if (updates.owner && updates.owner.trim() !== '') {
        dataToUpdate.owner = updates.owner.trim();
    } else {
        delete dataToUpdate.owner; 
    }

    const { data, error } = await supabase
      .from('user_portfolio')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 6. Vender Ativo
  async sellAsset(ticker, quantityToSell, sellPrice, date, owner = 'Geral') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login necessário');

    // Busca pelo ticker e ID do usuário
    const { data: position } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .single();

    if (!position || Number(position.quantity) < Number(quantityToSell)) {
        throw new Error(`Saldo insuficiente.`);
    }

    const currentQty = Number(position.quantity);
    const avgPrice = Number(position.price);
    const profit = (Number(sellPrice) - avgPrice) * Number(quantityToSell);

    // Salvar histórico de vendas
    await supabase.from('closed_positions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: quantityToSell,
        avg_price_buy: avgPrice,
        price_sell: sellPrice,
        profit_loss: profit,
        date: date || new Date(),
        owner: owner
    });

    // Salvar transação
    await supabase.from('portfolio_transactions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: quantityToSell,
        price: sellPrice,
        date: date || new Date(),
        type: 'sell',
        owner: owner
    });

    // Atualizar saldo
    const newQty = currentQty - Number(quantityToSell);
    if (newQty > 0) {
        await supabase.from('user_portfolio').update({ quantity: newQty }).eq('id', position.id);
    } else {
        await supabase.from('user_portfolio').delete().eq('id', position.id);
    }

    return { profit };
  },

  // 7. Histórico Evolução
  async getEvolutionHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from('portfolio_history').select('*').eq('user_id', user.id).order('snapshot_date');
    return data || [];
  }
};