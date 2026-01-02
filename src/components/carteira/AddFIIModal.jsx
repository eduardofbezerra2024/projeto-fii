import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Loader2, ExternalLink, Coins } from 'lucide-react';
import { getFiiQuote } from '@/services/fiiService';

const AddFIIModal = ({ isOpen, onClose, onSave }) => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastDividend, setLastDividend] = useState('');
  const [fiiType, setFiiType] = useState('Indefinido');
  const [owner, setOwner] = useState(''); 
  const [loadingSearch, setLoadingSearch] = useState(false);

  const handleSearchTicker = async () => {
    if (!ticker) return;
    setLoadingSearch(true);
    
    try {
      // 1. Busca Preço (Brapi - Funciona para Ações e FIIs)
      const data = await getFiiQuote(ticker);
      if (data) {
        setPrice(data.price);
      }

      // 2. Busca Detalhes Inteligentes (Ação vs FII)
      try {
        const divRes = await fetch(`/api/dividend?ticker=${ticker}`);
        const divData = await divRes.json();
        
        // A. Preencher Último Provento
        const rendimentoBruto = divData.dividend || divData.ultimoRendimento || divData.details?.ultimoRendimento;
        if (rendimentoBruto) {
             const val = typeof rendimentoBruto === 'number' ? rendimentoBruto : parseFloat(rendimentoBruto.replace('R$', '').replace(',', '.').trim());
             if (!isNaN(val)) setLastDividend(val);
        }
        
        // B. Preencher TIPO (Agora aceita Ação e BDR)
        const apiType = (divData.fundType || '').toUpperCase();
        const sector = (data?.sector || '').toUpperCase();

        if (apiType === 'AÇÃO' || apiType === 'ACAO') {
            setFiiType('Ação');
        } else if (apiType === 'BDR') {
            setFiiType('BDR');
        } else if (apiType.includes('PAPEL') || apiType.includes('RECEB') || apiType.includes('CRI')) {
            setFiiType('Papel');
        } else if (apiType.includes('TIJOLO') || apiType.includes('SHOPPING') || apiType.includes('LOG') || apiType.includes('LAJE') || apiType.includes('HÍBRIDO') || apiType.includes('MISTO')) {
            setFiiType('Tijolo');
        } else if (apiType.includes('FIAGRO') || apiType.includes('AGRO')) {
            setFiiType('Fiagro');
        } else if (apiType.includes('INFRA')) {
            setFiiType('Infra');
        } else {
            // Se a API não definiu, tenta adivinhar pelo Ticker
            if (ticker.endsWith('34')) setFiiType('BDR');
            else if (/[3456]$/.test(ticker)) setFiiType('Ação');
            else if (ticker.endsWith('11')) setFiiType('Indefinido'); // Pode ser Unit ou FII
        }

      } catch (errDiv) {
        console.warn("Erro ao buscar dados complementares", errDiv);
      }

    } catch (error) {
      console.error("Erro ao buscar ticker", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const purchaseDateObj = new Date(date + 'T12:00:00');

    const assetData = {
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price),
      purchaseDate: purchaseDateObj,
      lastDividend: Number(lastDividend),
      fiiType,
      owner: owner.trim() || 'Geral' 
    };

    await onSave(assetData);
    
    // Reset
    setTicker('');
    setQuantity('');
    setPrice('');
    setOwner('');
    setLastDividend('');
    setFiiType('Indefinido');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Compra</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="owner" className="flex items-center gap-2 text-blue-600">
                <User className="h-4 w-4" /> Nome do Investidor
            </Label>
            <Input id="owner" placeholder="Quem comprou? (Ex: Eduardo)" value={owner} onChange={(e) => setOwner(e.target.value)} className="border-blue-100 bg-blue-50/50" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ticker">Ticker (Código)</Label>
            <div className="flex gap-2">
                <Input id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} onBlur={handleSearchTicker} placeholder="EX: PETR4, NVDC34, MXRF11" required />
                <Button type="button" size="icon" variant="outline" onClick={handleSearchTicker} disabled={loadingSearch}>
                    {loadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço Pago (R$)</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="date">Data Compra</Label>
                <Input type="date" id="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center mb-1">
                  <Label>Último Provento</Label>
              </div>
              <div className="relative">
                  <Input id="dividend" type="number" step="0.0001" value={lastDividend} onChange={(e) => setLastDividend(e.target.value)} placeholder="0.00" />
                  <Coins className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 opacity-50" />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Tipo do Ativo</Label>
            <select value={fiiType} onChange={(e) => setFiiType(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">
               <option value="Indefinido">Selecione</option>
               <option value="Ação">🏢 Ação (BR)</option>
               <option value="BDR">🌎 BDR (Internacional)</option>
               <option value="Tijolo">🧱 FII Tijolo</option>
               <option value="Papel">📄 FII Papel</option>
               <option value="Fiagro">🌾 Fiagro</option>
               <option value="Infra">🏗️ FII Infra</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFIIModal;