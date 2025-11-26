import { supabase } from '@/lib/customSupabaseClient';
import { getFiiQuote } from '@/services/fiiService';
import { EmailService } from '@/services/EmailService';
import { NewsService } from '@/services/NewsService'; // <--- NOVO IMPORT
import useAlertasStore from '@/store/alertasStore';

// --- FUNÇÕES AUXILIARES DE BANCO DE DADOS ---
export const getAlertPreferences = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
  return data;
};

export const saveAlertPreferences = async (preferences) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Usuário não logado' };

  const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, ...preferences, updated_at: new Date() });
  return { error };
};

export const getAlertHistory = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
  return data || [];
};

export const sendEmailAlert = async (alertData) => {
    return await EmailService.sendNotification(alertData);
};
// ---------------------------------------------


export const AlertService = {
  async checkDailyPrices() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuário não autenticado' };

    console.log('Verificando preços e notícias...');
    
    // 1. Busca preferências do usuário para saber se quer notícias
    const prefs = await getAlertPreferences();
    const enableNews = prefs?.enable_news_alerts || false;

    const state = useAlertasStore.getState();
    const activeAlerts = state.alerts.filter(a => a.status === 'active');
    const tickersToCheck = [...new Set(activeAlerts.map(a => a.ticker))];

    for (const ticker of tickersToCheck) {
      try {
        // A. VERIFICAÇÃO DE PREÇO (Lógica Existente)
        const quote = await getFiiQuote(ticker);
        if (quote) {
            const currentPrice = quote.price;
            await this.evaluatePriceRules(user.id, ticker, currentPrice, activeAlerts);
        }

        // B. VERIFICAÇÃO DE NOTÍCIAS (NOVA LÓGICA)
        if (enableNews) {
            const news = await NewsService.getRecentNews(ticker);
            // Pega apenas notícias de HOJE
            const today = new Date().toISOString().split('T')[0];
            
            const freshNews = news.filter(n => {
                const newsDate = new Date(n.date).toISOString().split('T')[0];
                return newsDate === today;
            });

            if (freshNews.length > 0) {
                // Se tiver notícia nova hoje, dispara alerta
                await this.triggerNewsAlert(user.id, ticker, freshNews[0]);
            }
        }

      } catch (err) {
        console.error(`Erro ao verificar ${ticker}:`, err);
      }
    }
  },

  async evaluatePriceRules(userId, ticker, currentPrice, allAlerts) {
    const tickerAlerts = allAlerts.filter(a => a.ticker === ticker);
    for (const alert of tickerAlerts) {
      let triggered = false;
      if (alert.type === 'price_below' && currentPrice <= alert.value) triggered = true;
      else if (alert.type === 'price_above' && currentPrice >= alert.value) triggered = true;

      if (triggered) {
        await this.triggerAlert(userId, alert, currentPrice);
      }
    }
  },

  async triggerAlert(userId, alertConfig, currentPrice) {
    // Salva no banco e notifica (lógica simplificada da versão anterior)
    await supabase.from('alerts').insert({
        user_id: userId,
        fii_ticker: alertConfig.ticker,
        alert_type: alertConfig.type,
        price_after: currentPrice,
        message: `Preço atingido: R$ ${currentPrice}`
    });
    
    // Notifica na store local
    useAlertasStore.getState().addNotification({
        id: Date.now(),
        ticker: alertConfig.ticker,
        message: `Alerta de Preço: ${alertConfig.ticker} atingiu R$ ${currentPrice}`,
        type: 'price',
        timestamp: new Date()
    });
  },

  // NOVA FUNÇÃO: DISPARAR ALERTA DE NOTÍCIA
  async triggerNewsAlert(userId, ticker, newsItem) {
    console.log(`Nova notícia encontrada para ${ticker}: ${newsItem.title}`);
    
    // Salva no histórico
    await supabase.from('alerts').insert({
        user_id: userId,
        fii_ticker: ticker,
        alert_type: 'news',
        message: `Notícia: ${newsItem.title}`
    });

    // Notifica na tela
    useAlertasStore.getState().addNotification({
        id: Date.now(),
        ticker: ticker,
        message: `Nova notícia sobre ${ticker}`,
        link: newsItem.link, // Link para ler a notícia
        type: 'news',
        timestamp: new Date()
    });
  }
};