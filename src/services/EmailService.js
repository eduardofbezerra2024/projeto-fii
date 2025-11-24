
import { supabase } from '@/lib/customSupabaseClient';

export const EmailService = {
  /**
   * Sends an email notification via the secure Supabase Edge Function using Gmail SMTP.
   * 
   * @param {object} params
   * @param {string} [params.to] - Recipient email. If omitted, sends to current authenticated user.
   * @param {string} params.subject - Email subject
   * @param {string} params.text - Plain text content
   * @param {string} [params.html] - HTML content (optional)
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  async sendNotification({ to, subject, text, html }) {
    try {
      // Security Note: SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD) are NOT stored here.
      // They are stored securely in Supabase Secrets and accessed only by the Edge Function.
      
      let recipient = to;
      
      // If no recipient is specified, default to the currently logged-in user
      if (!recipient) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          recipient = user.email;
        } else {
          throw new Error("No recipient specified and user is not authenticated.");
        }
      }

      // Invoke the secure edge function to handle the actual SMTP transmission
      const { data, error } = await supabase.functions.invoke('send-email-alert', {
        body: JSON.stringify({
          to: recipient,
          subject,
          text,
          html
        })
      });

      if (error) {
        console.error('Supabase Function Error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email via SMTP service');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message || error };
    }
  }
};
