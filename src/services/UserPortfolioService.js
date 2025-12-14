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

  // 3. ADICIONAR NOVA COMPRA (Lógica Blindada: Verifica -> Cria ou Atualiza)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    const ownerName = asset.owner && asset.owner.trim() !== '' ? asset.owner.trim() : 'Geral';
    console.log(`Tentando salvar ${asset.ticker} para: ${ownerName}`);

    // A. Salvar Histórico
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

    if (transError) {
        console.error("Erro ao salvar histórico:", transError);
        throw transError;
    }

    // B. Verificar se JÁ EXISTE esse ativo para ESSE DONO
    const { data: existingAsset, error: fetchError } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .eq('owner', ownerName)
      .maybeSingle();

    if (fetchError) console.error("Erro ao buscar ativo existente:", fetchError);

    // C. CAMINHO 1: JÁ EXISTE -> ATUALIZAR (Preço Médio)
    if (existingAsset) {
      console.log("Ativo já existe, calculando preço médio...");
      const oldQty = Number(existingAsset.quantity);
      const oldPrice = Number(existingAsset.price);
      const addedQty = Number(asset.quantity);
      const addedPrice = Number(asset.price);

      const totalQty = oldQty + addedQty;
      const totalValue = (oldQty * oldPrice) + (addedQty * addedPrice);
      const newAvgPrice = totalValue / totalQty;

      const { data, error } = await supabase
        .from('user_portfolio')
        .update({
            quantity: totalQty,
            price: newAvgPrice,
            last_dividend: asset.lastDividend || existingAsset.last_dividend,
            fii_type: asset.fiiType || existingAsset.fii_type
        })
        .eq('id', existingAsset.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } 
    
    // D. CAMINHO 2: NÃO EXISTE -> CRIAR NOVO (Insert Puro)
    else {
      console.log("Ativo novo para este dono, criando...");
      const { data, error } = await supabase
        .from('user_portfolio')
        .insert({
          user_id: user.id,
          ticker: asset.ticker,
          quantity: Number(asset.quantity),
          price: Number(asset.price),
          sector: asset.sector || '',
          purchase_date: asset.purchaseDate,
          last_dividend: asset.lastDividend || 0,
          fii_type: asset.fiiType || 'Indefinido',
          owner: ownerName // <--- Salva o nome corretamente
        })
        .select()
        .single();

      if (error) {
          console.error("Erro ao criar ativo:", error);
          throw error;
      }
      return data;
    }
  },

  // 4. Remover ativo
  async removeAsset(id) {
    const { error } = await supabase.from('user_portfolio').delete().eq('id', id);
    if (error) throw error;
  },

  // 5. ATUALIZAR (Edição Manual - Corrigido para não travar no Geral)
  async updateAsset(id, updates) {
    // Prepara o objeto de atualização
    const dataToUpdate = { ...updates };
    
    // Se o campo owner vier vazio ou indefinido, a gente NÃO mexe nele (mantém o que está no banco)
    // Se vier preenchido, a gente atualiza.
    if (updates.owner && updates.owner.trim() !== '') {
        dataToUpdate.owner = updates.owner.trim();
    } else {
        delete dataToUpdate.owner; // Remove a chave para não salvar vazio
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

    const { data: position } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .eq('owner', owner)
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