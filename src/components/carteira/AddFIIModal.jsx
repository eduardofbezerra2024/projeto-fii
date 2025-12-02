import React, { useState, useEffect } from 'react';
import { Search, Loader2, Building2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getFiiQuote } from '@/services/fiiService';
import { toast } from '@/components/ui/use-toast';

const AddFIIModal = ({ isOpen, onClose, onSave, editingFII }) => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [lastDividend, setLastDividend] = useState('');
  const [fiiType, setFiiType] = useState('Tijolo'); 
  
  const [isSearching, setIsSearching] = useState(false);
  const [fiiData, setFiiData] = useState(null);

  useEffect(() => {
    if (editingFII) {
      setTicker(editingFII.ticker);
      setQuantity(editingFII.quantity);
      setPrice(editingFII.price);
      setPurchaseDate(editingFII.purchase_date || '');
      setLastDividend(editingFII.last_dividend || '');
      setFiiType(editingFII.fii_type || 'Tijolo');
      setFiiData({
        name: editingFII.name || '',
        sector: editingFII.sector || '',
      });
    } else {
      resetForm();
    }
  }, [editingFII, isOpen]);

  const resetForm = () => {
    setTicker('');
    setQuantity('');
    setPrice('');
    setLastDividend('');
    setFiiType('Tijolo');
    setPurchaseDate(new Date().toISOString().split('T')[0]); // Data de hoje
    setFiiData(null);
  };

  const handleSearchTicker = async () => {
    if (!ticker || ticker.length < 4) return;
    if (isSearching) return;

    setIsSearching(true);
    setFiiData(null);

    try {
      // 1. Busca Preço Oficial
      const quote = await getFiiQuote(ticker.toUpperCase());
      
      // 2. Tenta buscar Dividendos (via nossa API)
      let scrapedDividend = 0;
      try {
        const response = await fetch(`/api/dividend?ticker=${ticker}`);
        if (response.ok) {
            const data = await response.json();
            if (data.dividend) scrapedDividend = data.dividend;
        }
      } catch (err) {
        console.log("Busca de dividendo falhou, ignorando...");
      }

      if (quote) {
        setFiiData({
          name: quote.name,
          sector: quote.sector,
          currentPrice: quote.price
        });
        
        // Só preenche o preço se estiver vazio ou se estivermos criando um novo
        if (!price || !editingFII) {
          setPrice(quote.price);
        }

        // Só preenche o dividendo se achou algo e o campo está vazio
        if (scrapedDividend > 0 && (!lastDividend || !editingFII)) {
            setLastDividend(scrapedDividend);
            toast({ description: `Dados encontrados! Preço: ${quote.price}` });
        } else {
            toast({ description: `Preço atual: R$ ${quote.price}` });
        }

      } else {
        toast({ variant: "destructive", title: "Fundo não encontrado." });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    // --- AQUI ESTÁ A BLINDAGEM ---
    if (!ticker) {
        toast({ title: "Falta o Ticker", description: "Qual é o código do fundo?", variant: "destructive" });
        return;
    }
    if (!quantity || Number(quantity) <= 0) {
        toast({ title: "Quantidade Inválida", description: "Digite quantas cotas você tem.", variant: "destructive" });
        return;
    }
    if (!price || Number(price) <= 0) {
        toast({ title: "Preço Inválido", description: "Digite quanto você pagou.", variant: "destructive" });
        return;
    }

    const fiiToSave = {
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price), // Converte para número antes de enviar
      purchaseDate: purchaseDate || new Date(), // Garante uma data
      lastDividend: Number(lastDividend) || 0,
      fiiType: fiiType,
      sector: fiiData?.sector || 'Fundo Imobiliário',
      name: fiiData?.name || ticker.toUpperCase()
    };

    onSave(fiiToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingFII ? 'Editar Ativo' : 'Adicionar à Carteira'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ticker">Ticker</Label>
            <div className="flex gap-2">
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onBlur={handleSearchTicker}
                placeholder="Ex: MXRF11"
                disabled={!!editingFII}
                className="uppercase"
              />
              {!editingFII && (
                <Button type="button" onClick={handleSearchTicker} disabled={isSearching} size="icon" variant="outline">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {fiiData && <p className="text-xs text-green-600 font-medium">✅ {fiiData.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Quantidade</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
            <div><Label>Preço Pago (R$)</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Data Compra</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div>
                <Label className="text-blue-600 flex items-center justify-between">
                    Último Provento
                    {isSearching && <Loader2 className="h-3 w-3 animate-spin" />}
                </Label>
                <div className="relative">
                    <Input 
                        type="number" 
                        step="0.01" 
                        value={lastDividend} 
                        onChange={(e) => setLastDividend(e.target.value)} 
                        placeholder="0.00" 
                    />
                    <Coins className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type"><Building2 className="h-3 w-3 inline mr-1" /> Tipo do Fundo</Label>
            <select
                id="type"
                value={fiiType}
                onChange={(e) => setFiiType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
                <option value="Tijolo">🧱 Tijolo</option>
                <option value="Papel">📄 Papel</option>
                <option value="Hibrido">⚖️ Híbrido</option>
                <option value="Fiagro">🚜 Fiagro</option>
                <option value="Infra">🏗️ Infra</option>
                <option value="Outros">❓ Outros</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFIIModal;