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

      let totalChecked = 0;
      let totalTriggered = 0;

      // 1. Busca preferências
      const prefs = await getAlertPreferences();
      const enableNews = prefs?.enable_news_alerts || false;
      
      const state = useAlertasStore.getState();
      const activeAlerts = state.alerts.filter(a => a.status === 'active');

      // Se não tiver alertas e nem notícias ativadas, retorna
      if (activeAlerts.length === 0 && !enableNews) {
        return { success: true, checked: 0, triggered: 0, message: 'Nenhum monitoramento ativo' };
      }

      // Lista de FIIs para verificar (dos alertas de preço + carteira se necessário, aqui focamos nos alertas configurados)
      const tickersToCheck = [...new Set(activeAlerts.map(a => a.ticker))];

      for (const ticker of tickersToCheck) {
        totalChecked++;
        try {
          // A. VERIFICAÇÃO DE PREÇO
          const quote = await getFiiQuote(ticker);
          if (quote) {
            const currentPrice = quote.price;
            const triggeredCount = await this.evaluatePriceRules(user.id, ticker, currentPrice, activeAlerts);
            totalTriggered += triggeredCount;
          }

          // B. VERIFICAÇÃO DE NOTÍCIAS
          if (enableNews) {
            const news = await NewsService.getRecentNews(ticker);
            const today = new Date().toISOString().split('T')[0];
            
            // Pega notícias de HOJE
            const freshNews = news.filter(n => {
              const newsDate = new Date(n.date).toISOString().split('T')[0];
              return newsDate === today;
            });

            if (freshNews.length > 0) {
              // Dispara alerta para a primeira notícia do dia
              await this.triggerNewsAlert(user.id, ticker, freshNews[0]);
              totalTriggered++;
            }
          }
        } catch (err) {
          console.error(`Erro ao verificar ${ticker}:`, err);
        }
      }

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
        count++;
      }
    }
    return count;
  },

  async triggerAlert(userId, alertConfig, currentPrice) {
    const msg = `O FII ${alertConfig.ticker} atingiu o preço alvo de R$ ${currentPrice}`;
    
    // 1. Tenta Enviar Email
    const emailResult = await EmailService.sendNotification({
        subject: `Alerta de Preço: ${alertConfig.ticker}`,
        text: msg,
        html: `<div style="font-family: sans-serif;">
                <h2 style="color: #16a34a;">Alerta de Preço Atingido!</h2>
                <p>O fundo <strong>${alertConfig.ticker}</strong> chegou no valor que você esperava.</p>
                <p style="font-size: 18px;">Preço Atual: <strong>R$ ${currentPrice}</strong></p>
               </div>`
    });

    // 2. Salva no Banco (com status do envio)
    await supabase.from('alerts').insert({
      user_id: userId,
      fii_ticker: alertConfig.ticker,
      alert_type: alertConfig.type,
      price_after: currentPrice,
      message: msg,
      email_sent: emailResult.success // Salva se o email foi enviado ou não
    });

    // 3. Notifica na Tela
    useAlertasStore.getState().addNotification({
      id: Date.now(),
      ticker: alertConfig.ticker,
      message: msg,
      type: 'price',
      timestamp: new Date()
    });
  },

  async triggerNewsAlert(userId, ticker, newsItem) {
    const msg = `Nova notícia: ${newsItem.title}`;
    console.log(`Disparando alerta de notícia para ${ticker}`);

    // 1. Tenta Enviar Email
    const emailResult = await EmailService.sendNotification({
        subject: `Notícia Relevante: ${ticker}`,
        text: `${msg}\nLeia mais: ${newsItem.link}`,
        html: `<div style="font-family: sans-serif;">
                <h2 style="color: #2563eb;">Nova Notícia sobre ${ticker}</h2>
                <p>Encontramos uma notícia recente:</p>
                <p><strong>${newsItem.title}</strong></p>
                <a href="${newsItem.link}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ler Notícia Completa</a>
               </div>`
    });

    // 2. Salva no Banco (com status do envio)
    await supabase.from('alerts').insert({
      user_id: userId,
      fii_ticker: ticker,
      alert_type: 'news',
      message: msg,
      email_sent: emailResult.success // Salva VERDADEIRO apenas se o EmailJS funcionar
    });

    // 3. Notifica na Tela
    useAlertasStore.getState().addNotification({
      id: Date.now(),
      ticker: ticker,
      message: `Notícia: ${newsItem.title}`,
      link: newsItem.link,
      type: 'news',
      timestamp: new Date()
    });
  }
};