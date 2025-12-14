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

  const handleSearchTicker = async () => {
    if (!ticker) return;
    setLoadingSearch(true);
    
    try {
      // 1. Busca Preço (Yahoo/Brapi)
      const data = await getFiiQuote(ticker);
      if (data) {
        setPrice(data.price);
      }

      // 2. Busca Dividendos e TIPO DE FUNDO (Sua API Investidor10)
      try {
        const divRes = await fetch(`/api/dividend?ticker=${ticker}`);
        const divData = await divRes.json();
        
        console.log("Dados da API:", divData); // Debug para ver o que chegou

        // A. Preencher Último Provento (Tenta na raiz OU dentro de details)
        const rendimentoBruto = divData.ultimoRendimento || divData.details?.ultimoRendimento;
        
        if (rendimentoBruto) {
            const cleanVal = rendimentoBruto
                .replace('R$', '')
                .replace(/\s/g, '')
                .replace(',', '.')
                .trim();
            
            const numVal = parseFloat(cleanVal);
            if (!isNaN(numVal)) {
                setLastDividend(numVal);
            }
        }
        
        // B. Preencher TIPO DO FUNDO (Lógica Reforçada)
        // Procura na raiz (API nova) OU dentro de details (API antiga/fallback)
        const rawType = (divData.fundType || divData.details?.tipoFundo || '').toUpperCase();
        const rawSeg = (divData.segmento || divData.details?.segmento || '').toUpperCase();
        
        const combined = `${rawType} ${rawSeg}`;
        console.log("Texto analisado:", combined);

        if (combined.includes('PAPEL') || combined.includes('RECEB') || combined.includes('CRI') || combined.includes('CR')) {
            setFiiType('Papel');
        } else if (combined.includes('TIJOLO') || combined.includes('SHOPPING') || combined.includes('LOG') || combined.includes('LAJE') || combined.includes('IMOBIL') || combined.includes('RENDA URBANA') || combined.includes('HOSPITAL') || combined.includes('HÍBRIDO') || combined.includes('MISTO')) {
            setFiiType('Tijolo');
        } else if (combined.includes('FIAGRO') || combined.includes('AGRO') || combined.includes('RURAIS')) {
            setFiiType('Fiagro');
        } else if (combined.includes('INFRA')) {
            setFiiType('Infra');
        } else {
            // Se não achou nada, mantém Indefinido
            setFiiType('Indefinido');
        }

      } catch (errDiv) {
        console.warn("Não foi possível buscar dados do Investidor10", errDiv);
      }

    } catch (error) {
      console.error("Erro ao buscar ticker", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Garante data sem fuso horário (meio-dia)
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
            <Input
              id="owner"
              placeholder="Quem comprou? (Ex: Eduardo)"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="border-blue-100 bg-blue-50/50"
            />
          </div>

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
                    title="Buscar Dados Automáticos"
                >
                    {loadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>
          </div>

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

          <div className="grid gap-2">
            <Label htmlFor="type">Tipo do Fundo</Label>
            <select 
                value={fiiType} 
                onChange={(e) => setFiiType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
            >
               <option value="Indefinido">Selecione (ou Indefinido)</option>
               <option value="Tijolo">🧱 Tijolo</option>
               <option value="Papel">📄 Papel</option>
               <option value="Fiagro">🌾 Fiagro</option>
               <option value="Infra">🏗️ Infra</option>
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