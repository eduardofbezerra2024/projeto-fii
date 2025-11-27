import { supabase } from '@/lib/customSupabaseClient';
import { getFiiQuote } from '@/services/fiiService';
import { EmailService } from '@/services/EmailService';
import { NewsService } from '@/services/NewsService';
import useAlertasStore from '@/store/alertasStore';

// --- FUNÇÕES AUXILIARES DE BANCO DE DADOS ---
export const getAlertPreferences = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('alert_preferences').select('*').eq('user_id', user.id).single();
  return data;
};

export const saveAlertPreferences = async (preferences) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Usuário não logado' };

  const { error } = await supabase.from('alert_preferences').upsert({ user_id: user.id, ...preferences, updated_at: new Date() });
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
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Usuário não autenticado' };

        console.log('Verificando preços e notícias...');
        
        // Contadores para o relatório final
        let totalChecked = 0;
        let totalTriggered = 0;

        const prefs = await getAlertPreferences();
        const enableNews = prefs?.enable_news_alerts || false;

        const state = useAlertasStore.getState();
        const activeAlerts = state.alerts.filter(a => a.status === 'active');
        
        if (activeAlerts.length === 0) {
            return { success: true, checked: 0, triggered: 0, message: 'Nenhum alerta ativo' };
        }

        const tickersToCheck = [...new Set(activeAlerts.map(a => a.ticker))];

        for (const ticker of tickersToCheck) {
            totalChecked++; // Conta mais um FII verificado
            try {
                // A. VERIFICAÇÃO DE PREÇO
                const quote = await getFiiQuote(ticker);
                if (quote) {
                    const currentPrice = quote.price;
                    // Soma os alertas disparados aqui
                    const triggeredCount = await this.evaluatePriceRules(user.id, ticker, currentPrice, activeAlerts);
                    totalTriggered += triggeredCount;
                }

                // B. VERIFICAÇÃO DE NOTÍCIAS
                if (enableNews) {
                    const news = await NewsService.getRecentNews(ticker);
                    const today = new Date().toISOString().split('T')[0];
                    
                    const freshNews = news.filter(n => {
                        const newsDate = new Date(n.date).toISOString().split('T')[0];
                        return newsDate === today;
                    });

                    if (freshNews.length > 0) {
                        await this.triggerNewsAlert(user.id, ticker, freshNews[0]);
                        totalTriggered++; // Conta alerta de notícia
                    }
                }

            } catch (err) {
                console.error(`Erro ao verificar ${ticker}:`, err);
            }
        }
        
        // AGORA SIM: Retornamos os números para o botão mostrar na tela!
        return { success: true, checked: totalChecked, triggered: totalTriggered };

    } catch (globalError) {
        console.error('Erro geral no checkDailyPrices:', globalError);
        return { error: 'Falha interna na verificação' };
    }
  },

  async evaluatePriceRules(userId, ticker, currentPrice, allAlerts) {
    const tickerAlerts = allAlerts.filter(a => a.ticker === ticker);
    let count = 0;

    for (const alert of tickerAlerts) {
      let triggered = false;
      if (alert.type === 'price_below' && currentPrice <= alert.value) triggered = true;
      else if (alert.type === 'price_above' && currentPrice >= alert.value) triggered = true;

      if (triggered) {
        await this.triggerAlert(userId, alert, currentPrice);
        count++; // Conta quantos regras bateram
      }
    }
    return count; // Retorna a quantidade de alertas
  },

  async triggerAlert(userId, alertConfig, currentPrice) {
    await supabase.from('alerts').insert({
        user_id: userId,
        fii_ticker: alertConfig.ticker,
        alert_type: alertConfig.type,
        price_after: currentPrice,
        message: `Preço atingido: R$ ${currentPrice}`
    });
    
    useAlertasStore.getState().addNotification({
        id: Date.now(),
        ticker: alertConfig.ticker,
        message: `Alerta de Preço: ${alertConfig.ticker} atingiu R$ ${currentPrice}`,
        type: 'price',
        timestamp: new Date()
    });
  },

  async triggerNewsAlert(userId, ticker, newsItem) {
    console.log(`Nova notícia encontrada para ${ticker}: ${newsItem.title}`);
    
    await supabase.from('alerts').insert({
        user_id: userId,
        fii_ticker: ticker,
        alert_type: 'news',
        message: `Notícia: ${newsItem.title}`
    });

    useAlertasStore.getState().addNotification({
        id: Date.now(),
        ticker: ticker,
        message: `Nova notícia sobre ${ticker}`,
        link: newsItem.link,
        type: 'news',
        timestamp: new Date()
    });
  }
};