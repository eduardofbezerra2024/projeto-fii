
import { supabase } from '@/lib/customSupabaseClient';
import { getFiiQuote } from '@/services/fiiService';
import { EmailService } from '@/services/EmailService';
import useAlertasStore from '@/store/alertasStore';

export const AlertService = {
  /**
   * Main function to check prices and trigger alerts.
   * Returns statistics about the run for UI feedback.
   */
  async checkDailyPrices() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuário não autenticado', checked: 0, triggered: 0 };

    console.log('Running daily price check...');
    
    const stats = { checked: 0, triggered: 0, errors: 0, messages: [] };

    // 1. Get active alerts from store
    const state = useAlertasStore.getState();
    const activeAlerts = state.alerts.filter(a => a.status === 'active');
    
    // Get unique tickers to minimize API calls
    const tickersToCheck = [...new Set(activeAlerts.map(a => a.ticker))];

    if (tickersToCheck.length === 0) {
      return { ...stats, message: 'Nenhum alerta ativo para verificar.' };
    }

    for (const ticker of tickersToCheck) {
      try {
        stats.checked++;
        
        // 2. Fetch current price
        const quote = await getFiiQuote(ticker);
        if (!quote) {
            stats.errors++;
            stats.messages.push(`Erro ao buscar cotação para ${ticker}`);
            continue;
        }

        const currentPrice = quote.price;

        // 3. Get yesterday's price for comparison
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Fix for PGRST116: Use maybeSingle() instead of single()
        // single() throws error if no rows found, maybeSingle() returns null
        const { data: historicData } = await supabase
          .from('fii_daily_prices')
          .select('price')
          .eq('ticker', ticker)
          .eq('date', yesterdayStr)
          .maybeSingle();

        const previousPrice = historicData?.price || currentPrice; // Fallback if no history

        // 4. Save today's price (requires UPDATE policy for upsert)
        const todayStr = new Date().toISOString().split('T')[0];
        const { error: upsertError } = await supabase
          .from('fii_daily_prices')
          .upsert(
            { ticker, price: currentPrice, date: todayStr },
            { onConflict: 'ticker,date' }
          );

        if (upsertError) {
          console.error(`Error saving price for ${ticker}:`, upsertError);
          // We continue even if save fails, to still process alerts
        }

        // 5. Evaluate Rules
        const triggersForTicker = await this.evaluateRules(user.id, ticker, currentPrice, previousPrice, activeAlerts);
        stats.triggered += triggersForTicker;

      } catch (err) {
        console.error(`Error checking ${ticker}:`, err);
        stats.errors++;
        stats.messages.push(`Erro interno ao verificar ${ticker}`);
      }
    }
    
    return stats;
  },

  async evaluateRules(userId, ticker, currentPrice, previousPrice, allAlerts) {
    const tickerAlerts = allAlerts.filter(a => a.ticker === ticker);
    let triggeredCount = 0;

    for (const alert of tickerAlerts) {
      let triggered = false;
      
      // Check Thresholds
      if (alert.type === 'price_below' && currentPrice <= alert.value) {
        triggered = true;
      } else if (alert.type === 'price_above' && currentPrice >= alert.value) {
        triggered = true;
      }

      // Simple volatility check (implicit)
      const percentChange = previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

      if (triggered) {
        await this.triggerAlert(userId, alert, currentPrice, previousPrice);
        triggeredCount++;
      }
    }
    return triggeredCount;
  },

  async triggerAlert(userId, alertConfig, currentPrice, previousPrice) {
    // 1. Create DB Record
    const { data: alertRecord, error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        fii_ticker: alertConfig.ticker,
        alert_type: alertConfig.type,
        price_before: previousPrice,
        price_after: currentPrice,
        email_sent: false,
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save alert:', error);
      return;
    }

    // 2. Update Store (In-App Notification)
    useAlertasStore.getState().addNotification({
      id: alertRecord.id,
      ticker: alertConfig.ticker,
      message: `O preço de ${alertConfig.ticker} atingiu R$ ${currentPrice.toFixed(2)}`,
      type: alertConfig.type,
      timestamp: new Date()
    });

    // 3. Send Email
    const emailResult = await EmailService.sendNotification({
      subject: `Alerta FII: ${alertConfig.ticker}`,
      text: `O FII ${alertConfig.ticker} atingiu o preço de R$ ${currentPrice.toFixed(2)}.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10b981;">Alerta de Preço: ${alertConfig.ticker}</h2>
          <p>O seu alerta configurado foi disparado.</p>
          <ul style="list-style: none; padding: 0;">
             <li><strong>Ticker:</strong> ${alertConfig.ticker}</li>
             <li><strong>Preço Atual:</strong> R$ ${currentPrice.toFixed(2)}</li>
             <li><strong>Regra:</strong> ${alertConfig.type === 'price_below' ? 'Abaixo de' : 'Acima de'} R$ ${alertConfig.value.toFixed(2)}</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">FII Analyzer - Monitoramento Automático</p>
        </div>
      `
    });

    if (emailResult.success) {
      await supabase
        .from('alerts')
        .update({ email_sent: true })
        .eq('id', alertRecord.id);
    }
  }
};
