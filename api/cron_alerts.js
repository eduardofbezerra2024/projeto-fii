// pages/api/cron_alerts.js
import { createClient } from '@supabase/supabase-js';

// Configuração do Cliente Supabase (Modo Admin para ler dados de todos)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // <--- IMPORTANTE: Precisa dessa chave no .env
);

const RESEND_API_KEY = process.env.RESEND_API_KEY; // <--- IMPORTANTE: Chave do Resend no .env

// 1. Busca Notícias (Yahoo Finance)
async function fetchNewsForTicker(ticker) {
  try {
    const symbol = ticker.toUpperCase().endsWith('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
    // Busca 2 notícias recentes
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=2`;
    
    const res = await fetch(url);
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
    console.error(`Erro news ${ticker}:`, err);
    return [];
  }
}

// 2. Busca Preço Atual
async function getCurrentPrice(ticker) {
  try {
    const symbol = ticker.toUpperCase().endsWith('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    const data = await res.json();
    return data.chart.result[0].meta.regularMarketPrice;
  } catch (err) { return null; }
}

export default async function handler(req, res) {
  // Opcional: Segurança para ninguém chamar essa URL a não ser você
  // if (req.query.key !== 'SEU_SEGREDO_SUPER_SECRETO') return res.status(401).json({error: 'Unauthorized'});

  try {
    console.log("Iniciando verificação diária...");

    // A. Busca Alertas de Preço Ativos (com dados do usuário)
    const { data: alerts } = await supabase
      .from('alerts') // ou 'user_alerts', confira o nome da sua tabela de configuração de alertas
      .select('*, user:user_id(email)')
      .eq('status', 'active'); // Supondo que você tenha um campo status

    // B. Busca Carteiras (Para enviar notícias mesmo sem alerta de preço)
    // Para simplificar este exemplo, vamos focar nos alertas configurados primeiro,
    // mas a lógica para carteira seria similar.

    const emailsToSend = {};

    // PROCESSAMENTO
    if (alerts && alerts.length > 0) {
        for (const alert of alerts) {
          const userId = alert.user_id;
          const userEmail = alert.user?.email;

          if (!userEmail) continue;

          const currentPrice = await getCurrentPrice(alert.fii_ticker); // ou alert.ticker
          const news = await fetchNewsForTicker(alert.fii_ticker);

          // Inicializa objeto do usuário
          if (!emailsToSend[userId]) {
            emailsToSend[userId] = { priceAlerts: [], newsAlerts: [], email: userEmail };
          }

          // Lógica de Preço
          if (currentPrice) {
            if (alert.alert_type === 'low' && currentPrice <= alert.target_price) {
              emailsToSend[userId].priceAlerts.push(`📉 <b>${alert.fii_ticker}</b> caiu para <b>R$ ${currentPrice}</b> (Alvo: R$ ${alert.target_price})`);
            } else if (alert.alert_type === 'high' && currentPrice >= alert.target_price) {
              emailsToSend[userId].priceAlerts.push(`📈 <b>${alert.fii_ticker}</b> subiu para <b>R$ ${currentPrice}</b> (Alvo: R$ ${alert.target_price})`);
            }
          }

          // Lógica de Notícias
          if (news.length > 0) {
            news.forEach(n => {
              // Evita duplicatas se o usuário tiver 2 alertas para o mesmo ativo
              const msg = `📰 <b>${alert.fii_ticker}:</b> <a href="${n.link}">${n.title}</a>`;
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
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'FII Analyzer <onboarding@resend.dev>', // Ou seu domínio verificado
            to: [data.email],
            subject: `Resumo: ${data.priceAlerts.length} Alertas e ${data.newsAlerts.length} Notícias`,
            html: htmlBody,
          }),
        });
        sentCount++;
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