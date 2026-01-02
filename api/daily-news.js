import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// 1. Configurações (Usando suas chaves do .env)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    console.log("📰 Robô Jornalista Iniciado...");

    // 2. Busca Tickers Únicos da Carteira
    const { data: assets, error } = await supabase
      .from('user_portfolio')
      .select('ticker')
      .not('ticker', 'is', null);

    if (error) throw error;

    // Remove duplicados (Ex: 3 compras de MXRF11 viram 1 só)
    const uniqueTickers = [...new Set(assets.map(a => a.ticker))];
    
    if (uniqueTickers.length === 0) {
      return res.status(200).json({ message: "Carteira vazia, sem notícias para buscar." });
    }

    // 3. Busca as Notícias (NewsAPI)
    // Limita a busca para não estourar a conta grátis (Pega os 5 primeiros tickers ou faz uma query geral)
    const query = uniqueTickers.slice(0, 10).join(' OR '); 
    console.log(`🔍 Buscando sobre: ${query}`);

    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=pt&sortBy=publishedAt&pageSize=7&apiKey=${process.env.NEWS_API_KEY}`;
    
    const newsRes = await fetch(newsUrl);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    if (articles.length === 0) {
        return res.status(200).json({ message: "Nenhuma notícia relevante encontrada hoje." });
    }

    // 4. Monta o E-mail Bonito
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">☕ Resumo Matinal: Sua Carteira</h1>
        <p>Bom dia! Aqui estão as principais notícias sobre seus ativos (<strong>${uniqueTickers.length} monitorados</strong>).</p>
        
        ${articles.map(art => `
          <div style="margin-bottom: 25px; background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h3 style="margin: 0 0 5px 0;"><a href="${art.url}" style="color: #111; text-decoration: none;">${art.title}</a></h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
               📅 ${new Date(art.publishedAt).toLocaleDateString('pt-BR')} | 📰 ${art.source.name}
            </p>
            <p style="margin: 0; line-height: 1.5; font-size: 14px; color: #444;">${art.description || 'Clique no título para ler a matéria completa.'}</p>
          </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
          <p>Gerado automaticamente pelo seu <strong>FII Analyzer 🤖</strong></p>
        </div>
      </div>
    `;

    // 5. Envia o E-mail
    const emailResponse = await resend.emails.send({
      from: 'FII Analyzer <onboarding@resend.dev>',
      to: process.env.MY_EMAIL.split(','), // Vai para o seu e-mail configurado no .env
      subject: `📈 Notícias: ${uniqueTickers.slice(0, 3).join(', ')} e mais...`,
      html: emailHtml,
    });

    console.log("✅ E-mail enviado com sucesso!", emailResponse);
    return res.status(200).json({ success: true, emailId: emailResponse.data?.id });

  } catch (error) {
    console.error("❌ Erro no Robô:", error);
    return res.status(500).json({ error: error.message });
  }
}