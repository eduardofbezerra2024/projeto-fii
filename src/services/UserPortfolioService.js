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
      .order('date', { ascending: false }); // Mais recentes primeiro
    
    if (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
    return data;
  },

  // 3. ADICIONAR UMA NOVA COMPRA (Cérebro do Sistema)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    // A. Salvar no Histórico (Log da Transação individual)
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

    // B. Buscar posição atual para calcular Preço Médio
    const { data: currentPosition } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .single();

    let newQuantity = Number(asset.quantity);
    let newAvgPrice = Number(asset.price);

    // C. Cálculo do Preço Médio Ponderado
    if (currentPosition) {
      const oldQty = Number(currentPosition.quantity);
      const oldPrice = Number(currentPosition.price);
      const addedQty = Number(asset.quantity);
      const addedPrice = Number(asset.price);

      const totalQty = oldQty + addedQty;
      // Fórmula: ((QtdAntiga * PreçoAntigo) + (QtdNova * PreçoNovo)) / QtdTotal
      const totalValue = (oldQty * oldPrice) + (addedQty * addedPrice);
      
      newQuantity = totalQty;
      newAvgPrice = totalValue / totalQty;
    }

    // D. Atualizar ou Criar na Carteira Principal (Upsert)
    const { data, error } = await supabase
      .from('user_portfolio')
      .upsert({
        user_id: user.id,
        // Se já existir (pelo ID), atualiza. Se não, cria.
        id: currentPosition?.id, 
        ticker: asset.ticker,
        quantity: newQuantity,
        price: newAvgPrice,
        sector: asset.sector,
        
        // Mantém a data mais antiga ou usa a nova se for o primeiro aporte
        purchase_date: currentPosition?.purchase_date || asset.purchaseDate,
        
        // Atualiza o dividendo se o usuário informou um novo, senão mantém o velho
        last_dividend: asset.lastDividend || currentPosition?.last_dividend || 0,

        // Salva o TIPO (Tijolo/Papel/etc)
        fii_type: asset.fiiType || currentPosition?.fii_type || 'Indefinido'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 4. Remover ativo da carteira
  async removeAsset(id) {
    console.log("Tentando apagar ID:", id);

    // count: 'exact' pede para o banco confirmar quantos apagou
    const { error, count } = await supabase
      .from('user_portfolio')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw error;
    
    // Diagnóstico: Se não apagou nada, avisa o usuário
    if (count === 0) {
        throw new Error("Item não encontrado ou você não tem permissão para apagá-lo.");
    }
  },

  // 5. Atualizar ativo manualmente (Edição direta)
  async updateAsset(id, updates) {
    const { data, error } = await supabase
      .from('user_portfolio')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 6. VENDER ATIVO (NOVA FUNÇÃO)
  async sellAsset(ticker, quantityToSell, sellPrice, date) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login necessário');

    // 1. Buscar a posição atual para ver preço médio e saldo
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
    const avgPrice = Number(position.price); // Esse é o seu preço médio de compra
    const saleValue = Number(sellPrice);
    const qty = Number(quantityToSell);

    // 2. Calcular Lucro/Prejuízo dessa operação
    const profit = (saleValue - avgPrice) * qty;

    // 3. Salvar no Histórico de Lucros Realizados (Relatório)
    await supabase.from('closed_positions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: qty,
        avg_price_buy: avgPrice,
        price_sell: saleValue,
        profit_loss: profit,
        date: date || new Date()
    });

    // 4. Registrar a Transação no Histórico Geral
    await supabase.from('portfolio_transactions').insert({
        user_id: user.id,
        ticker: ticker,
        quantity: qty,
        price: saleValue,
        date: date || new Date(),
        type: 'sell' // Importante: Marca como venda
    });

    // 5. Atualizar a Carteira (Diminuir quantidade)
    const newQty = currentQty - qty;

    if (newQty > 0) {
        // Se sobrou algo, atualiza a quantidade (o preço médio NÃO muda na venda)
        await supabase
            .from('user_portfolio')
            .update({ quantity: newQty })
            .eq('id', position.id);
    } else {
        // Se vendeu tudo, remove da carteira
        await supabase
            .from('user_portfolio')
            .delete()
            .eq('id', position.id);
    }

    return { profit };
  }

// ... (suas outras funções)

  // 7. BUSCAR HISTÓRICO DE EVOLUÇÃO (NOVO)
  async getEvolutionHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('portfolio_history')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true }); // Do mais antigo para o mais novo

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
    return data;
  }
};
