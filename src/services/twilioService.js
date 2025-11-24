import { supabase } from '@/lib/customSupabaseClient';

/**
 * Sends a WhatsApp message via the Supabase Edge Function.
 * @param {string} to The recipient's WhatsApp number (e.g., +5521976328289).
 * @param {string} message The message content.
 * @param {string} user_id The ID of the user to log the alert against.
 * @param {string} [fii_ticker] The FII ticker for logging purposes.
 * @param {string} [alert_type] The type of alert for logging.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendWhatsAppMessage = async (to, message, user_id, fii_ticker = 'Test', alert_type = 'Connection Test') => {
  if (!user_id) {
    const errorMsg = 'User ID is required to send a message and log the alert.';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
  
  try {
    // Sanitize phone number before sending to the function
    const sanitizedTo = to.replace(/[^+\d]/g, '');
    
    const { data, error } = await supabase.functions.invoke('send-whatsapp-alert', {
      body: JSON.stringify({ to: sanitizedTo, message, user_id, fii_ticker, alert_type }),
    });

    if (error) {
      // This catches network errors or if the function itself throws an unhandled exception
      console.error('Error invoking send-whatsapp-alert function:', error.message);
      throw new Error(`Edge function call failed: ${error.message}`);
    }

    // The function now returns a JSON object with a `success` property
    if (!data.success) {
      // This catches errors returned by the function logic (e.g., Twilio API errors)
      console.error('Error from send-whatsapp-alert function:', data.error);
      throw new Error(data.error || 'An unknown error occurred in the Edge Function.');
    }

    console.log('WhatsApp message sent successfully via Edge Function.');
    return { success: true };
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err);
    return { success: false, error: err.message };
  }
};