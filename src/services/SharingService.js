import { supabase } from '@/lib/customSupabaseClient';

export const SharingService = {
  // Buscar quem tem acesso à minha conta
  async getMyViewers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('portfolio_access')
      .select('*')
      .eq('owner_id', user.id);

    if (error) throw error;
    return data;
  },

  // Adicionar uma pessoa (pelo e-mail)
  async addViewer(email) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Logue para convidar');

    // Verifica se não está convidando a si mesmo
    if (email === user.email) throw new Error('Você já é o dono!');

    const { data, error } = await supabase
      .from('portfolio_access')
      .insert({
        owner_id: user.id,
        viewer_email: email
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remover acesso de alguém
  async removeViewer(id) {
    const { error } = await supabase
      .from('portfolio_access')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};