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
  }
};