import { supabase } from '@/lib/customSupabaseClient';

// --- SUAS CHAVES DO EMAILJS ---
const SERVICE_ID = 'service_94dm74b';          // ✅ Esse já está certo
const TEMPLATE_ID = 'template_76778mi';        // <--- Cole o ID do Template aqui (sem espaços)
const PUBLIC_KEY = 'user_XyZ123abc...';        // <--- Cole a Public Key aqui

export const EmailService = {
  /**
   * Envia notificação usando EmailJS (Direto do Frontend)
   */
  async sendNotification({ to, subject, text, html }) {
    try {
      let recipient = to;
      
      // Se não tiver destinatário, pega o usuário logado
      if (!recipient) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          recipient = user.email;
        } else {
          console.error("Sem destinatário para o email");
          return { success: false, error: "Usuário não logado" };
        }
      }

      console.log(`Tentando enviar email para: ${recipient}`);

      // Monta os dados para o EmailJS
      const templateParams = {
        to_email: recipient,
        subject: subject,
        message: text || html,
      };

      // Envia usando a API REST do EmailJS
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id: PUBLIC_KEY,
          template_params: templateParams,
        }),
      });

      if (response.ok) {
        console.log('Email enviado com sucesso!');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('Erro EmailJS:', errorText);
        throw new Error('Falha ao enviar email: ' + errorText);
      }

    } catch (error) {
      console.error('Falha grave no envio de email:', error);
      return { success: false, error: error.message || error };
    }
  }
};