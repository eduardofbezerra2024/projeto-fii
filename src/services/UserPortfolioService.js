import { supabase } from '@/lib/customSupabaseClient';

export const PortfolioService = {
  // Buscar carteira
  async getPortfolio() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Busca a carteira consolidada
    const { data, error } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id);

    if (error) { console.error(error); return []; }
    return data;
  },

  // Buscar histórico de um ativo específico
  async getTransactions(ticker) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('portfolio_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .order('date', { ascending: false }); // Mais recentes primeiro
    return data || [];
  },

  // ADICIONAR UMA NOVA COMPRA (Lógica do Preço Médio)
  async addTransaction(asset) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login necessário');

    // 1. Salvar no Histórico (Log da Transação)
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

    // 2. Buscar se já tenho esse ativo na carteira para calcular média
    const { data: currentPosition } = await supabase
      .from('user_portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('ticker', asset.ticker)
      .single();

    let newQuantity = Number(asset.quantity);
    let newAvgPrice = Number(asset.price);

    if (currentPosition) {
      // CÁLCULO DO PREÇO MÉDIO PONDERADO
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

    // 3. Atualizar ou Criar na Carteira Principal (Upsert)
    const { data, error } = await supabase
      .from('user_portfolio')
      .upsert({
        user_id: user.id,
        // Se já existir (pelo ID ou ticker/user), atualiza. Se não, cria.
        // Nota: Idealmente user_portfolio deveria ter uma constraint unique(user_id, ticker)
        // Vamos usar o ID se tivermos, ou tentar pelo ticker.
        id: currentPosition?.id, 
        ticker: asset.ticker,
        quantity: newQuantity,
        price: newAvgPrice,
        sector: asset.sector,
        // Mantém a data da primeira compra ou atualiza? Geralmente mantém a original ou usa a última.
        // Vamos manter a lógica simples por enquanto.
        purchase_date: currentPosition?.purchase_date || asset.purchaseDate 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};