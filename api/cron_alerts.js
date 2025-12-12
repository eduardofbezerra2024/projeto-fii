import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ROBUSTA DE VARIÁVEIS DE AMBIENTE ---
// Tenta pegar a URL do Vite ou a padrão do Next/Vercel
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;

// Verificação de Segurança para não quebrar silenciosamente
if (!supabaseUrl) throw new Error('ERRO FATAL: VITE_SUPABASE_URL não encontrada.');
if (!supabaseServiceKey) throw new Error('ERRO FATAL: SUPABASE_SERVICE_ROLE_KEY não encontrada.');
if (!resendKey) throw new Error('ERRO FATAL: RESEND_API_KEY não encontrada.');

// Cria o cliente com permissão de ADMIN (Service Role)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 1. Função para buscar notícias (Yahoo Finance)
async function fetchNewsForTicker(ticker) {
  try {
    const symbol = ticker.toUpperCase().endsWith('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=2`;
    
    const res = await fetch(url);
    if (!res.ok) return [];
    
    const data = await res.json();
    
    // Filtra últimas 24h
    const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
    
    if (!data.news || data.news.length === 0) return [];

    return data.news
      .filter(item => item.providerPublishTime * 1000 > oneDayAgo)
      .map(item => ({
        title: item.title,
        link: item.link,
        publisher: item.publisher,
        time: new Date(item.providerPublishTime * 1000).toLocaleDateString('pt-BR')
      }));
  } catch (err) {
    console.error(`Erro news ${ticker}:`, err.message);
    return [];
  }
}

// 2. Função para buscar Preço Atual
async function getCurrentPrice(ticker) {
  try {
    const symbol = ticker.toUpperCase().endsWith('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.chart.result[0].meta.regularMarketPrice;
  } catch (err) { return null; }
}

export default async function handler(req, res) {
  try {
    console.log("Iniciando verificação diária...");

    // A. Busca Alertas de Preço Ativos
    const { data: alerts, error } = await supabase
      .from('alerts') 
      .select('*, user:user_id(email)')
      .eq('status', 'active');

    if (error) throw error;

    // B. Busca Carteiras para Notícias (se o usuário ativou nas preferências)
    // (Simplificado: vamos processar os alertas configurados primeiro)

    const emailsToSend = {};

    // PROCESSAMENTO
    if (alerts && alerts.length > 0) {
        for (const alert of alerts) {
          const userId = alert.user_id;
          const userEmail = alert.user?.email; // Pega o email da relação

          if (!userEmail) continue;

          const tickerToCheck = alert.fii_ticker || alert.ticker; // Garante pegar o campo certo
          if (!tickerToCheck) continue;

          const currentPrice = await getCurrentPrice(tickerToCheck);
          const news = await fetchNewsForTicker(tickerToCheck);

          // Inicializa objeto do usuário
          if (!emailsToSend[userId]) {
            emailsToSend[userId] = { priceAlerts: [], newsAlerts: [], email: userEmail };
          }

          // Lógica de Preço
          if (currentPrice) {
            if (alert.alert_type === 'low' && currentPrice <= alert.target_price) {
              emailsToSend[userId].priceAlerts.push(`📉 <b>${tickerToCheck}</b> caiu para <b>R$ ${currentPrice}</b> (Alvo: R$ ${alert.target_price})`);
            } else if (alert.alert_type === 'high' && currentPrice >= alert.target_price) {
              emailsToSend[userId].priceAlerts.push(`📈 <b>${tickerToCheck}</b> subiu para <b>R$ ${currentPrice}</b> (Alvo: R$ ${alert.target_price})`);
            }
          }

          // Lógica de Notícias
          if (news.length > 0) {
            news.forEach(n => {
              const msg = `📰 <b>${tickerToCheck}:</b> <a href="${n.link}">${n.title}</a>`;
              // Evita duplicatas
              if (!emailsToSend[userId].newsAlerts.includes(msg)) {
                  emailsToSend[userId].newsAlerts.push(msg);
              }
            });
          }
        }
    }

    // ENVIO (Dispara os e-mails)
    let sentCount = 0;
    for (const userId in emailsToSend) {
      const data = emailsToSend[userId];
      
      // Só envia se tiver conteúdo
      if (data.priceAlerts.length > 0 || data.newsAlerts.length > 0) {
        
        let htmlBody = `<div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #16a34a;">Resumo Diário - FII Analyzer</h2>`;

        if (data.priceAlerts.length > 0) {
          htmlBody += `<h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">🚨 Alertas de Preço</h3>
          <ul>${data.priceAlerts.map(msg => `<li style="margin-bottom: 5px;">${msg}</li>`).join('')}</ul>`;
        }

        if (data.newsAlerts.length > 0) {
          htmlBody += `<h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;">🗞️ Notícias do Dia</h3>
          <ul>${data.newsAlerts.map(msg => `<li style="margin-bottom: 8px;">${msg}</li>`).join('')}</ul>`;
        }
        
        htmlBody += `<p style="font-size: 12px; color: #999; margin-top: 30px;">Enviado automaticamente.</p></div>`;

        // Envia via Resend
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'FII Analyzer <onboarding@resend.dev>',
            to: [data.email],
            subject: `Resumo: ${data.priceAlerts.length} Alertas e ${data.newsAlerts.length} Notícias`,
            html: htmlBody,
          }),
        });

        if (emailRes.ok) sentCount++;
        else console.error("Erro ao enviar email:", await emailRes.text());
      }
    }

    return res.status(200).json({ 
      success: true, 
      checked: alerts ? alerts.length : 0, 
      triggered: sentCount,
      message: 'Verificação concluída!' 
    });

  } catch (error) {
    console.error('Erro Cron:', error);
    return res.status(500).json({ error: error.message });
  }
}