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
  // CORRIGIDO AQUI: era 'aasync', agora é 'async'
  async checkDailyPrices() {
    try {
      // Chama o nosso Super Robô no servidor
      const response = await fetch('/api/cron_master');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na verificação');
      }

      return { 
        success: true, 
        checked: 0, // O robô processa tudo, não retorna contagem exata aqui pra simplificar
        triggered: result.log ? (result.log.alerts || 0) : 0,
        message: 'Verificação completa realizada pelo servidor!'
      };

    } catch (globalError) {
      console.error('Erro ao chamar API de alertas:', globalError);
      return { error: 'Falha ao conectar com o servidor de alertas.' };
    }
  },

  // Mantemos essas funções caso você queira usar lógica local no futuro,
  // mas o checkDailyPrices acima agora delega tudo para o servidor (cron_master).
  
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
    
    // 1. Envia Email (Local - fallback)
    const emailResult = await EmailService.sendNotification({
        subject: `Alerta de Preço: ${alertConfig.ticker}`,
        text: msg,
        html: `<div><h2>Alerta Atingido!</h2><p>${msg}</p></div>`
    });

    // 2. Salva no Banco
    await supabase.from('alerts').insert({
      user_id: userId,
      fii_ticker: alertConfig.ticker,
      alert_type: alertConfig.type,
      price_after: currentPrice,
      message: msg,
      email_sent: emailResult.success
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
    
    const emailResult = await EmailService.sendNotification({
        subject: `Notícia: ${ticker}`,
        text: `${msg}\n${newsItem.link}`
    });

    await supabase.from('alerts').insert({
      user_id: userId,
      fii_ticker: ticker,
      alert_type: 'news',
      message: msg,
      email_sent: emailResult.success
    });

    useAlertasStore.getState().addNotification({
      id: Date.now(),
      ticker: ticker,
      message: msg,
      link: newsItem.link,
      type: 'news',
      timestamp: new Date()
    });
  }
};