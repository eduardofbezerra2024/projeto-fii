import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Loader2 } from 'lucide-react';
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

  // --- FUNÇÃO TURBINADA DE BUSCA ---
  const handleSearchTicker = async () => {
    if (!ticker) return;
    setLoadingSearch(true);
    
    try {
      // 1. Busca Preço e Setor (Dados Básicos)
      const data = await getFiiQuote(ticker);
      
      if (data) {
        setPrice(data.price); // Preenche o preço

        // Tenta descobrir o Tipo pelo Setor
        if (data.sector) {
            const sec = data.sector.toLowerCase();
            if (sec.includes('papel') || sec.includes('receb') || sec.includes('cr') || sec.includes('fundo de fundos')) setFiiType('Papel');
            else if (sec.includes('tijolo') || sec.includes('log') || sec.includes('shop') || sec.includes('laje') || sec.includes('hibrido')) setFiiType('Tijolo');
            else if (sec.includes('agro') || sec.includes('fiagro')) setFiiType('Fiagro');
            else if (sec.includes('infra')) setFiiType('Infra');
            else setFiiType('Indefinido');
        }
      }

      // 2. Busca Dividendos (Dados Avançados)
      // Chama a sua API interna que faz o scraping
      try {
        const divRes = await fetch(`/api/dividend?ticker=${ticker}`);
        const divData = await divRes.json();

        // Se encontrou o último rendimento (ex: "R$ 0,10")
        if (divData && divData.ultimoRendimento) {
            // Limpa o texto para virar número (tira R$, espaços e troca vírgula por ponto)
            const cleanVal = divData.ultimoRendimento
                .replace('R$', '')
                .replace(/\s/g, '')
                .replace(',', '.')
                .trim();
            
            const numVal = parseFloat(cleanVal);
            if (!isNaN(numVal)) {
                setLastDividend(numVal);
            }
        }
        
        // Se a API de dividendo tiver um segmento melhor, usa ele para o Tipo
        if (divData && divData.segmento) {
            const seg = divData.segmento.toLowerCase();
            if (seg.includes('papel') || seg.includes('receb')) setFiiType('Papel');
            else if (seg.includes('tijolo') || seg.includes('log') || seg.includes('shop') || seg.includes('hibrido')) setFiiType('Tijolo');
            else if (seg.includes('agro')) setFiiType('Fiagro');
        }

      } catch (errDiv) {
        console.warn("Não foi possível buscar dividendos automaticamente", errDiv);
      }

    } catch (error) {
      console.error("Erro ao buscar ticker", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Data segura (meio-dia)
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
    
    // Limpa o formulário
    setTicker('');
    setQuantity('');
    setPrice('');
    setOwner('');
    setLastDividend('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Compra</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* INVESTIDOR */}
          <div className="grid gap-2">
            <Label htmlFor="owner" className="flex items-center gap-2 text-blue-600">
                <User className="h-4 w-4" /> Nome do Investidor
            </Label>
            <Input
              id="owner"
              placeholder="Quem comprou? (Ex: Eduardo)"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="border-blue-100 bg-blue-50/50"
            />
          </div>

          {/* TICKER + BOTÃO DE BUSCA */}
          <div className="grid gap-2">
            <Label htmlFor="ticker">Ticker (Código)</Label>
            <div className="flex gap-2">
                <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="EX: MXRF11"
                required
                />
                <Button 
                    type="button" 
                    size="icon" 
                    variant="outline" 
                    onClick={handleSearchTicker} 
                    disabled={loadingSearch}
                    title="Buscar Preço e Proventos"
                >
                    {loadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>
          </div>

          {/* QTD e PREÇO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço Pago (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* DATA e DIVIDENDO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="date">Data Compra</Label>
                <Input 
                    type="date" 
                    id="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dividend">Último Provento</Label>
              <Input
                id="dividend"
                type="number"
                step="0.0001"
                value={lastDividend}
                onChange={(e) => setLastDividend(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* TIPO */}
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo do Fundo</Label>
            <select 
                value={fiiType} 
                onChange={(e) => setFiiType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
            >
               <option value="Indefinido">Selecione</option>
               <option value="Tijolo">🧱 Tijolo</option>
               <option value="Papel">📄 Papel</option>
               <option value="Fiagro">🌾 Fiagro</option>
               <option value="Infra">🏗️ Infra</option>
               <option value="Indefinido">❓ Indefinido</option>
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