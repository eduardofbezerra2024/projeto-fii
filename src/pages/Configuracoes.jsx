import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { User, Download, MessageSquare, Mail, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/components/ui/use-toast';
import { getAlertPreferences, saveAlertPreferences, getAlertHistory, sendEmailAlert } from '@/services/alertService';
import { sendWhatsAppMessage } from '@/services/twilioService';
import { Switch } from '@/components/ui/switch';

const Configuracoes = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = useState({ name: user?.user_metadata?.name || '', email: user?.email || '' });
  const [alertPrefs, setAlertPrefs] = useState({
    whatsapp_number: '',
    enable_price_alerts: false,
    price_threshold: 5,
    enable_dividend_alerts: false,
    dividend_threshold: 1,
    enable_news_alerts: false,
  });
  const [emailAlertData, setEmailAlertData] = useState({
    message: '',
    fii_ticker: '',
    rentability: '',
    risks: '',
    benefits: '',
    dividend_history: '',
  });

  const [alertHistory, setAlertHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [twilioStatus, setTwilioStatus] = useState(null); // null, 'success', 'error'

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
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
    const history = await getAlertHistory();
    setAlertHistory(history);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleProfileChange = (e) => setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAlertsChange = (e) => setAlertPrefs(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAlertsSwitchChange = (name, checked) => setAlertPrefs(prev => ({ ...prev, [name]: checked }));
  const handleEmailAlertChange = (e) => setEmailAlertData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveAlerts = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await saveAlertPreferences(alertPrefs);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações de alerta.', variant: 'destructive' });
    } else {
      const prefs = await getAlertPreferences();
      if(prefs) setAlertPrefs(prev => ({ ...prev, ...prefs }));
      toast({ title: 'Sucesso', description: 'Configurações de alerta salvas!' });
    }
    setIsSaving(false);
  };

  const handleTestWhatsApp = async () => {
    if (!alertPrefs.whatsapp_number) return toast({ title: 'Atenção', description: 'Por favor, insira seu número do WhatsApp.', variant: 'destructive' });
    if (!user) return toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
    
    setIsTesting(true);
    setTwilioStatus(null);
    const result = await sendWhatsAppMessage(alertPrefs.whatsapp_number, '✅ Teste de conexão do FII Analyzer bem-sucedido!', user.id);
    setTwilioStatus(result.success ? 'success' : 'error');
    toast({
        title: result.success ? 'Sucesso!' : 'Erro',
        description: result.success ? 'Mensagem de teste enviada para o seu WhatsApp.' : `Falha ao enviar mensagem: ${result.error}`,
        variant: result.success ? 'default' : 'destructive'
    });
    if (result.success) fetchPreferences();
    setIsTesting(false);
  };
  
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if(!emailAlertData.message) return toast({ title: 'Atenção', description: 'O campo de mensagem é obrigatório.', variant: 'destructive' });
    if(!user) return toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
    
    setIsSendingEmail(true);

    let dividendHistoryArray = [];
    if(emailAlertData.dividend_history) {
        // Simple parsing: assumes "date,value;date,value"
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
        description: result.success ? 'Email de alerta enviado com sucesso.' : `Falha ao enviar email: ${result.error}`,
        variant: result.success ? 'default' : 'destructive'
    });

    if (result.success) {
      setEmailAlertData({ message: '', fii_ticker: '', rentability: '', risks: '', benefits: '', dividend_history: '' });
      fetchPreferences(); // Refresh history
    }
    setIsSendingEmail(false);
  };

  const handleExportData = () => toast({ title: 'Exportação', description: '🚧 Funcionalidade de exportação será implementada em breve!' });

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
          {/* WhatsApp Alerts Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
              Alertas por WhatsApp
            </h3>
            {isLoading ? <p>Carregando...</p> : (
              <form onSubmit={handleSaveAlerts} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="whatsapp_number">Número do WhatsApp (com código do país)</Label>
                    <Input id="whatsapp_number" name="whatsapp_number" value={alertPrefs.whatsapp_number} onChange={handleAlertsChange} placeholder="+5521999998888" />
                  </div>
                  <div className="flex items-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleTestWhatsApp} disabled={isTesting}>
                          {isTesting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null} Testar Conexão
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
                  <div className="flex items-center justify-between"><Label htmlFor="enable_dividend_alerts">Habilitar alertas de mudança de dividendo</Label><Switch id="enable_dividend_alerts" checked={alertPrefs.enable_dividend_alerts} onCheckedChange={(c) => handleAlertsSwitchChange('enable_dividend_alerts', c)} /></div>
                   {alertPrefs.enable_dividend_alerts && (<div><Label htmlFor="dividend_threshold">Limiar de mudança de dividendo (%)</Label><Input id="dividend_threshold" name="dividend_threshold" type="number" value={alertPrefs.dividend_threshold} onChange={handleAlertsChange} /></div>)}
                </div>
                <div className="flex items-center justify-between"><Label htmlFor="enable_news_alerts">Habilitar alertas de notícias (Em breve)</Label><Switch id="enable_news_alerts" checked={alertPrefs.enable_news_alerts} onCheckedChange={(c) => handleAlertsSwitchChange('enable_news_alerts', c)} disabled /></div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSaving}>{isSaving && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Salvar Configurações de Alerta</Button>
              </form>
            )}
          </div>
          
          {/* Email Alert Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-blue-600" />
                  Enviar Alerta por Email (Admin)
              </h3>
              <form onSubmit={handleSendEmail} className="space-y-4">
                  <div><Label htmlFor="message">Mensagem / Título*</Label><Input id="message" name="message" value={emailAlertData.message} onChange={handleEmailAlertChange} placeholder="Ex: Oportunidade no FII XPTO11" required /></div>
                  <div><Label htmlFor="fii_ticker">Ticker do FII</Label><Input id="fii_ticker" name="fii_ticker" value={emailAlertData.fii_ticker} onChange={handleEmailAlertChange} placeholder="Ex: XPTO11" /></div>
                  <div><Label htmlFor="rentability">Rentabilidade</Label><Input id="rentability" name="rentability" value={emailAlertData.rentability} onChange={handleEmailAlertChange} placeholder="Ex: 15% nos últimos 12 meses" /></div>
                  <div><Label htmlFor="risks">Riscos</Label><Input id="risks" name="risks" value={emailAlertData.risks} onChange={handleEmailAlertChange} placeholder="Ex: Risco de vacância elevado" /></div>
                  <div><Label htmlFor="benefits">Benefícios</Label><Input id="benefits" name="benefits" value={emailAlertData.benefits} onChange={handleEmailAlertChange} placeholder="Ex: Contratos de longo prazo" /></div>
                  <div><Label htmlFor="dividend_history">Histórico de Dividendos</Label><Input id="dividend_history" name="dividend_history" value={emailAlertData.dividend_history} onChange={handleEmailAlertChange} placeholder="formato: data1,valor1;data2,valor2" /></div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSendingEmail}>{isSendingEmail && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Enviar Email</Button>
              </form>
          </div>
        </div>

        {/* Alert History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Histórico de Alertas</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {isLoading ? <p>Carregando histórico...</p> : 
                 alertHistory.length > 0 ? alertHistory.map(alert => (
                    <div key={alert.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{alert.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(alert.sent_at).toLocaleString()} - {alert.fii_ticker} ({alert.alert_type})
                        </p>
                    </div>
                 )) : <p className="text-gray-500 dark:text-gray-400">Nenhum alerta enviado ainda.</p>
                }
            </div>
        </div>
        
        {/* Other settings sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><User className="h-5 w-5 mr-2 text-green-600" />Perfil</h3>
            <form className="space-y-4">
              <div><Label htmlFor="name">Nome</Label><Input id="name" name="name" value={profileData.name} onChange={handleProfileChange} /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={profileData.email} onChange={handleProfileChange} disabled /></div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" onClick={(e) => {e.preventDefault(); toast({title: '🚧 Em breve!'})}}>Salvar Alterações</Button>
            </form>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tema</h3>
            <div className="space-y-2">
              <Button variant={theme === 'light' ? 'default' : 'outline'} className={`w-full ${theme === 'light' ? 'bg-green-600 hover:bg-green-700' : ''}`} onClick={() => setTheme('light')}>Claro</Button>
              <Button variant={theme === 'dark' ? 'default' : 'outline'} className={`w-full ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : ''}`} onClick={() => setTheme('dark')}>Escuro</Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><Download className="h-5 w-5 mr-2 text-green-600" />Exportar Dados</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Exporte todos os seus dados da carteira em formato CSV.</p>
          <Button onClick={handleExportData} className="bg-green-600 hover:bg-green-700"><Download className="h-5 w-5 mr-2" />Exportar CSV</Button>
        </div>
      </div>
    </>
  );
};

export default Configuracoes;