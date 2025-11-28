import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { searchFii, getFiiQuote } from '@/services/fiiService';
import { toast } from '@/components/ui/use-toast';

const AddFIIModal = ({ isOpen, onClose, onSave, editingFII }) => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fiiData, setFiiData] = useState(null);

  useEffect(() => {
    if (editingFII) {
      setTicker(editingFII.ticker);
      setQuantity(editingFII.quantity);
      setPrice(editingFII.price);
      setFiiData({
        name: editingFII.name || '',
        sector: editingFII.sector || '',
        currentPrice: editingFII.currentPrice || 0
      });
    } else {
      resetForm();
    }
  }, [editingFII, isOpen]);

  const resetForm = () => {
    setTicker('');
    setQuantity('');
    setPrice('');
    setFiiData(null);
    setSearchError('');
  };

  const handleSearchTicker = async () => {
    if (!ticker || ticker.length < 4) return;
    
    setIsSearching(true);
    setSearchError('');
    setFiiData(null);

    try {
      const quote = await getFiiQuote(ticker.toUpperCase());
      
      if (quote) {
        setFiiData({
          name: quote.name,
          sector: quote.sector,
          currentPrice: quote.price
        });
        // Se for inclusão nova, sugere o preço atual como preço médio
        if (!editingFII) {
          setPrice(quote.price);
        }
      } else {
        setSearchError('Fundo não encontrado. Verifique o código.');
      }
    } catch (error) {
      setSearchError('Erro ao buscar informações do fundo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    if (!ticker || !quantity || !price) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Ticker, Quantidade e Preço Médio.",
        variant: "destructive"
      });
      return;
    }

    const fiiToSave = {
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price), // Garante que seja número
      sector: fiiData?.sector || 'Fundo Imobiliário',
      name: fiiData?.name || ticker.toUpperCase(),
      currentPrice: fiiData?.currentPrice || Number(price)
    };

    onSave(fiiToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingFII ? 'Editar FII' : 'Adicionar FII'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ticker">Ticker (Código)</Label>
            <div className="flex gap-2">
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Ex: MXRF11"
                disabled={!!editingFII}
              />
              {!editingFII && (
                <Button type="button" size="icon" onClick={handleSearchTicker} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {searchError && <p className="text-sm text-red-500">{searchError}</p>}
            {fiiData && (
              <div className="text-xs text-muted-foreground">
                <p>{fiiData.name}</p>
                <p>Setor: {fiiData.sector}</p>
                <p>Preço Atual: R$ {fiiData.currentPrice}</p>
              </div>
            )}
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço Médio (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
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

 // Corrigindo modal de adicionar