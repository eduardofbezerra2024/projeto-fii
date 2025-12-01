import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { 
  User, 
  Download, 
  MessageSquare, 
  Mail, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Newspaper, 
  Users, 
  Trash2, 
  Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/components/ui/use-toast';
import { getAlertPreferences, saveAlertPreferences, getAlertHistory, sendEmailAlert } from '@/services/FiiAlertService';
import { sendWhatsAppMessage } from '@/services/twilioService';
import { SharingService } from '@/services/SharingService';
import { Switch } from '@/components/ui/switch';

const Configuracoes = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Estados de Perfil e Alertas
  const [profileData, setProfileData] = useState({ name: user?.user_metadata?.name || '', email: user?.email || '' });
  const [alertPrefs, setAlertPrefs] = useState({
    whatsapp_number: '',
    enable_price_alerts: false,
    price_threshold: 5,
    enable_dividend_alerts: false,
    dividend_threshold: 1,
    enable_news_alerts: false,
  });

  // Estado do E-mail de Teste
  const [emailAlertData, setEmailAlertData] = useState({
    message: '',
    fii_ticker: '',
    rentability: '',
    risks: '',
    benefits: '',
    dividend_history: '',
  });

  // Estados de Carregamento e Histórico
  const [alertHistory, setAlertHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [twilioStatus, setTwilioStatus] = useState(null);

  // Novos Estados para Compartilhamento
  const [viewers, setViewers] = useState([]);
  const [newViewerEmail, setNewViewerEmail] = useState('');

  // Carregar Dados Iniciais
  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    // 1. Carregar Preferências
    const prefs = await getAlertPreferences();
    if (prefs) {
      setAlertPrefs({
        id: prefs.id,
        whatsapp_number: prefs.whatsapp_number || '',
        enable_price_alerts: prefs.enable_price_alerts || false,
        price_threshold: prefs.price_threshold || 5,
        enable_dividend_alerts: prefs.enable_dividend_alerts || false,
        dividend_threshold: prefs.dividend_threshold || 1,
        enable_news_alerts: prefs.enable_news_alerts || false,
      });
    }

    // 2. Carregar Histórico
    const history = await getAlertHistory();
    setAlertHistory(history);

    // 3. Carregar Compartilhamentos
    try {
      const viewerList = await SharingService.getMyViewers();
      setViewers(viewerList);
    } catch (error) {
      console.error("Erro ao carregar compartilhamentos:", error);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Handlers de Formulário
  const handleProfileChange = (e) => setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAlertsChange = (e) => setAlertPrefs(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAlertsSwitchChange = (name, checked) => setAlertPrefs(prev => ({ ...prev, [name]: checked }));
  const handleEmailAlertChange = (e) => setEmailAlertData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Salvar Preferências
  const handleSaveAlerts = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await saveAlertPreferences(alertPrefs);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    } else {
      const prefs = await getAlertPreferences();
      if(prefs) setAlertPrefs(prev => ({ ...prev, ...prefs }));
      toast({ title: 'Sucesso', description: 'Configurações salvas!' });
    }
    setIsSaving(false);
  };

  // Testar WhatsApp
  const handleTestWhatsApp = async () => {
    if (!alertPrefs.whatsapp_number) return toast({ title: 'Atenção', description: 'Insira seu número do WhatsApp.', variant: 'destructive' });
    if (!user) return toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });

    setIsTesting(true);
    setTwilioStatus(null);
    const result = await sendWhatsAppMessage(alertPrefs.whatsapp_number, ' ✅ Teste FII Analyzer bem-sucedido!', user.id);
    setTwilioStatus(result.success ? 'success' : 'error');
    toast({
      title: result.success ? 'Sucesso!' : 'Erro',
      description: result.success ? 'Mensagem enviada.' : `Falha: ${result.error}`,
      variant: result.success ? 'default' : 'destructive'
    });
    if (result.success) fetchPreferences();
    setIsTesting(false);
  };

  // Enviar E-mail Manual
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if(!emailAlertData.message) return toast({ title: 'Atenção', description: 'Mensagem obrigatória.', variant: 'destructive' });
    if(!user) return toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });

    setIsSendingEmail(true);
    let dividendHistoryArray = [];
    if(emailAlertData.dividend_history) {
      dividendHistoryArray = emailAlertData.dividend_history.split(';').map(item => {
        const [date, value] = item.split(',');
        return { date: date?.trim(), value: value?.trim() };
      }).filter(item => item.date && item.value);
    }
    
    const payload = {
      message: emailAlertData.message,
      user_id: user.id,
      fii_ticker: emailAlertData.fii_ticker || undefined,
      fii_info: {
        ticker: emailAlertData.fii_ticker || undefined,
        rentability: emailAlertData.rentability || undefined,
        risks: emailAlertData.risks || undefined,
        benefits: emailAlertData.benefits || undefined,
        dividend_history: dividendHistoryArray.length > 0 ? dividendHistoryArray : undefined
      }
    };

    const result = await sendEmailAlert(payload);

    toast({
      title: result.success ? 'Sucesso!' : 'Erro',
      description: result.success ? 'E-mail enviado.' : `Falha: ${result.error}`,
      variant: result.success ? 'default' : 'destructive'
    });
    
    if (result.success) {
      setEmailAlertData({ message: '', fii_ticker: '', rentability: '', risks: '', benefits: '', dividend_history: '' });
      fetchPreferences();
    }
    setIsSendingEmail(false);
  };

  // Funções de Compartilhamento
  const handleAddViewer = async () => {
    if(!newViewerEmail) return;
    try {
      await SharingService.addViewer(newViewerEmail);
      toast({ title: "Sucesso", description: "Acesso concedido!" });
      setNewViewerEmail('');
      // Recarrega a lista
      const list = await SharingService.getMyViewers();
      setViewers(list);
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveViewer = async (id) => {
    try {
      await SharingService.removeViewer(id);
      toast({ title: "Removido", description: "Acesso revogado." });
      // Recarrega a lista
      const list = await SharingService.getMyViewers();
      setViewers(list);
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleExportData = () => toast({ title: 'Exportação', description: ' 🚧 Em breve!' });

  return (
    <>
      <Helmet>
        <title>Configurações - FII Analyzer</title>
        <meta name="description" content="Configure suas preferências e alertas" />
      </Helmet>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie suas preferências e alertas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUNA DA ESQUERDA: ALERTAS E COMPARTILHAMENTO */}
          <div className="space-y-8">
            
            {/* WhatsApp Alerts Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                Alertas Automáticos
              </h3>
              {isLoading ? <p>Carregando...</p> : (
                <form onSubmit={handleSaveAlerts} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="whatsapp_number">WhatsApp (com DDD)</Label>
                      <Input id="whatsapp_number" name="whatsapp_number" value={alertPrefs.whatsapp_number} onChange={handleAlertsChange} placeholder="+5521999998888" />
                    </div>
                    <div className="flex items-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleTestWhatsApp} disabled={isTesting}>
                        {isTesting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null} Testar
                      </Button>
                      {twilioStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {twilioStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between"><Label htmlFor="enable_price_alerts">Habilitar alertas de queda de preço</Label><Switch id="enable_price_alerts" checked={alertPrefs.enable_price_alerts} onCheckedChange={(c) => handleAlertsSwitchChange('enable_price_alerts', c)} /></div>
                    {alertPrefs.enable_price_alerts && (<div><Label htmlFor="price_threshold">Limiar de queda de preço (%)</Label><Input id="price_threshold" name="price_threshold" type="number" value={alertPrefs.price_threshold} onChange={handleAlertsChange} /></div>)}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><Label htmlFor="enable_dividend_alerts">Habilitar alertas de dividendo</Label><Switch id="enable_dividend_alerts" checked={alertPrefs.enable_dividend_alerts} onCheckedChange={(c) => handleAlertsSwitchChange('enable_dividend_alerts', c)} /></div>
                    {alertPrefs.enable_dividend_alerts && (<div><Label htmlFor="dividend_threshold">Limiar de mudança (%)</Label><Input id="dividend_threshold" name="dividend_threshold" type="number" value={alertPrefs.dividend_threshold} onChange={handleAlertsChange} /></div>)}
                  </div>

                  {/* NOTÍCIAS */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <Newspaper className="h-4 w-4 mr-2 text-blue-500" />
                      <Label htmlFor="enable_news_alerts" className="cursor-pointer">Alertas de notícias relevantes</Label>
                    </div>
                    <Switch id="enable_news_alerts" checked={alertPrefs.enable_news_alerts} onCheckedChange={(c) => handleAlertsSwitchChange('enable_news_alerts', c)} />
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSaving}>
                    {isSaving && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Salvar Preferências
                  </Button>
                </form>
              )}
            </div>

            {/* COMPARTILHAMENTO DE CARTEIRA (NOVO) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Compartilhar Acesso
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Adicione e-mails de pessoas que podem <strong>visualizar</strong> sua carteira.
              </p>
              
              <div className="flex gap-2 mb-6">
                <Input 
                  placeholder="email@amigo.com" 
                  value={newViewerEmail}
                  onChange={(e) => setNewViewerEmail(e.target.value)}
                />
                <Button onClick={handleAddViewer} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {viewers.length === 0 && <p className="text-gray-400 text-sm">Ninguém tem acesso ainda.</p>}
                {viewers.map((v) => (
                  <div key={v.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium">{v.viewer_email}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveViewer(v.id)} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUNA DA DIREITA: EMAIL ADMIN E HISTÓRICO */}
          <div className="space-y-8">
            
            {/* Email Alert Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                Teste de E-mail (Admin)
              </h3>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div><Label>Mensagem / Título*</Label><Input id="message" name="message" value={emailAlertData.message} onChange={handleEmailAlertChange} placeholder="Ex: Oportunidade no FII XPTO11" required /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Ticker</Label><Input id="fii_ticker" name="fii_ticker" value={emailAlertData.fii_ticker} onChange={handleEmailAlertChange} /></div>
                    <div><Label>Rentabilidade</Label><Input id="rentability" name="rentability" value={emailAlertData.rentability} onChange={handleEmailAlertChange} /></div>
                </div>
                <div><Label>Link/Detalhes</Label><Input id="risks" name="risks" value={emailAlertData.risks} onChange={handleEmailAlertChange} placeholder="Link da notícia ou detalhes" /></div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSendingEmail}>
                    {isSendingEmail && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Enviar Email
                </Button>
              </form>
            </div>

            {/* Alert History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Histórico de Envios</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {isLoading ? <p>Carregando...</p> :
                  alertHistory.length > 0 ? alertHistory.map(alert => (
                    <div key={alert.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-700">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{alert.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString()}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${alert.email_sent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {alert.email_sent ? 'Enviado' : 'Falha'}
                        </span>
                      </div>
                    </div>
                  )) : <p className="text-gray-500 dark:text-gray-400">Nenhum alerta recente.</p>
                }
              </div>
            </div>

            {/* Perfil e Tema */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><User className="h-5 w-5 mr-2 text-green-600" />Perfil</h3>
                <div className="space-y-4">
                    <div><Label>Nome</Label><Input value={profileData.name} onChange={handleProfileChange} name="name" /></div>
                    <div><Label>Email</Label><Input value={profileData.email} disabled /></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-2">Tema</h3>
                    <div className="space-y-2">
                        <Button variant={theme === 'light' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setTheme('light')}>☀️ Claro</Button>
                        <Button variant={theme === 'dark' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setTheme('dark')}>🌙 Escuro</Button>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-2">Dados</h3>
                    <Button onClick={handleExportData} className="w-full bg-slate-700 hover:bg-slate-800 text-white">
                        <Download className="h-4 w-4 mr-2" /> CSV
                    </Button>
                </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Configuracoes;