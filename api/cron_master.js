import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !resendKey) {
  throw new Error('Configuração inválida: Faltam variáveis de ambiente.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// --- FUNÇÕES AUXILIARES ---

// 1. Busca Preço Atual (Yahoo Finance)
async function getCurrentPrice(ticker) {
  try {
    const symbol = ticker.toUpperCase().endsWith('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.chart.result[0].meta.regularMarketPrice;
  } catch (err) { return null; }
}

// 2. Busca Notícias (Yahoo Finance)
async function fetchNewsForTicker(ticker) {
  try {
    const symbol = ticker.toUpperCase().endsWith('.SA') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.SA`;
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=2`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    
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
  } catch (err) { return []; }
}

// --- ROBÔ PRINCIPAL ---
export default async function handler(req, res) {
  const log = { alerts: 0, history: 0, errors: [] };

  try {
    console.log("Iniciando Super Robô...");

    // ==========================================
    // TAREFA 1: ALERTAS E NOTÍCIAS
    // ==========================================
    try {
        const { data: alerts } = await supabase
            .from('alerts')
            .select('*, user:user_id(email)')
            .eq('status', 'active');

        const emailsToSend = {};

        if (alerts && alerts.length > 0) {
            for (const alert of alerts) {
                const userId = alert.user_id;
                const userEmail = alert.user?.email;
                if (!userEmail) continue;

                const ticker = alert.fii_ticker || alert.ticker;
                if (!ticker) continue;

                const currentPrice = await getCurrentPrice(ticker);
                const news = await fetchNewsForTicker(ticker);

                if (!emailsToSend[userId]) emailsToSend[userId] = { price: [], news: [], email: userEmail };

                // Regra de Preço
                if (currentPrice) {
                    if (alert.alert_type === 'low' && currentPrice <= alert.target_price) {
                        emailsToSend[userId].price.push(`📉 <b>${ticker}</b> caiu para <b>R$ ${currentPrice}</b> (Alvo: R$ ${alert.target_price})`);
                    } else if (alert.alert_type === 'high' && currentPrice >= alert.target_price) {
                        emailsToSend[userId].price.push(`📈 <b>${ticker}</b> subiu para <b>R$ ${currentPrice}</b> (Alvo: R$ ${alert.target_price})`);
                    }
                }
                // Regra de Notícias
                if (news.length > 0) {
                    news.forEach(n => {
                        const msg = `📰 <b>${ticker}:</b> <a href="${n.link}">${n.title}</a>`;
                        if (!emailsToSend[userId].news.includes(msg)) emailsToSend[userId].news.push(msg);
                    });
                }
            }
        }

        // Dispara E-mails
        for (const userId in emailsToSend) {
            const data = emailsToSend[userId];
            if (data.price.length > 0 || data.news.length > 0) {
                let htmlBody = `<div style="font-family: sans-serif; color: #333;"><h2 style="color: #16a34a;">Resumo Diário</h2>`;
                if (data.price.length > 0) htmlBody += `<h3>🚨 Alertas</h3><ul>${data.price.map(m => `<li>${m}</li>`).join('')}</ul>`;
                if (data.news.length > 0) htmlBody += `<h3>🗞️ Notícias</h3><ul>${data.news.map(m => `<li>${m}</li>`).join('')}</ul>`;
                htmlBody += `<p style="font-size: 12px; color: #999;">FII Analyzer Automático</p></div>`;

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
                    body: JSON.stringify({ from: 'FII Analyzer <onboarding@resend.dev>', to: [data.email], subject: 'Resumo Diário da Carteira', html: htmlBody }),
                });
                log.alerts++;
            }
        }
    } catch (e) { log.errors.push(`Erro Alertas: ${e.message}`); }

    // ==========================================
    // TAREFA 2: HISTÓRICO DE PATRIMÔNIO
    // ==========================================
    try {
        const { data: portfolios } = await supabase.from('user_portfolio').select('user_id, ticker, price, quantity');
        
        if (portfolios && portfolios.length > 0) {
            const totalsByUser = {};
            for (const item of portfolios) {
                const qtd = Number(item.quantity) || 0;
                let priceToUse = Number(item.price);
                
                // Tenta preço real, senão usa médio
                const livePrice = await getCurrentPrice(item.ticker);
                if (livePrice) priceToUse = livePrice;

                const total = priceToUse * qtd;
                if (!totalsByUser[item.user_id]) totalsByUser[item.user_id] = 0;
                totalsByUser[item.user_id] += total;
            }

            const records = Object.entries(totalsByUser).map(([userId, total]) => ({
                user_id: userId,
                total_value: total
            }));

            if (records.length > 0) {
                await supabase.from('portfolio_history').insert(records);
                log.history = records.length;
            }
        }
    } catch (e) { log.errors.push(`Erro Histórico: ${e.message}`); }

    return res.status(200).json({ success: true, log });

  } catch (err) {
    return res.status(500).json({ error: 'Erro Fatal', details: err.message });
  }
}