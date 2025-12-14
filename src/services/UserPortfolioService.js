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

  // 2. Buscar histórico de transações de um ativo específico
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

  // 3. ADICIONAR UMA NOVA COMPRA (Com suporte a Investidor)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    const ownerName = asset.owner ? asset.owner.trim() : 'Geral';

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
        owner: ownerName // Salva quem comprou no histórico
      });

    if (transError) throw transError;

    // B. Buscar posição atual DESTE INVESTIDOR ESPECÍFICO
    const { data: currentPosition } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .eq('owner', ownerName) // <--- O PULO DO GATO: Busca só as ações desse dono
      .maybeSingle(); // Usa maybeSingle para não dar erro se não achar

    let newQuantity = Number(asset.quantity);
    let newAvgPrice = Number(asset.price);

    // C. Cálculo do Preço Médio Ponderado
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

    // D. Atualizar ou Criar na Carteira Principal
    const { data, error } = await supabase
      .from('user_portfolio')
      .upsert({
        user_id: user.id,
        id: currentPosition?.id, // Se achou, atualiza esse ID. Se não, cria novo.
        ticker: asset.ticker,
        quantity: newQuantity,
        price: newAvgPrice,
        sector: asset.sector,
        purchase_date: currentPosition?.purchase_date || asset.purchaseDate,
        last_dividend: asset.lastDividend || currentPosition?.last_dividend || 0,
        fii_type: asset.fiiType || currentPosition?.fii_type || 'Indefinido',
        owner: ownerName // <--- Salva o nome do investidor na carteira
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 4. Remover ativo da carteira
  async removeAsset(id) {
    const { error, count } = await supabase
      .from('user_portfolio')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw error;
    if (count === 0) {
        throw new Error("Item não encontrado ou permissão negada.");
    }
  },

  // 5. Atualizar ativo manualmente (Edição direta - Suporta mudança de nome)
  async updateAsset(id, updates) {
    const { data, error } = await supabase
      .from('user_portfolio')
      .update({
        ...updates,
        owner: updates.owner || 'Geral' // Garante que o nome seja salvo
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 6. VENDER ATIVO (Agora respeitando o dono)
  async sellAsset(ticker, quantityToSell, sellPrice, date, owner = 'Geral') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login necessário');

    // 1. Buscar a posição atual DO DONO ESPECÍFICO
    const { data: position } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .eq('owner', owner) // <--- Só vende o que é desse dono
      .single();

    if (!position || Number(position.quantity) < Number(quantityToSell)) {
        throw new Error(`Saldo insuficiente de ${ticker} para ${owner}.`);
    }

    const currentQty = Number(position.quantity);
    const avgPrice = Number(position.price);
    const saleValue = Number(sellPrice);
    const qty = Number(quantityToSell);

    // 2. Calcular Lucro/Prejuízo
    const profit = (saleValue - avgPrice) * qty;

    // 3. Salvar no Histórico de Lucros Realizados
    await supabase.from('closed_positions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: qty,
        avg_price_buy: avgPrice,
        price_sell: saleValue,
        profit_loss: profit,
        date: date || new Date(),
        owner: owner // Salva de quem foi o lucro
    });

    // 4. Registrar a Transação no Histórico Geral
    await supabase.from('portfolio_transactions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: qty,
        price: saleValue,
        date: date || new Date(),
        type: 'sell',
        owner: owner
    });

    // 5. Atualizar a Carteira
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

  // 7. Buscar Histórico de Evolução
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