import React, { useState, useEffect } from 'react';
import { Search, Loader2, Calendar } from 'lucide-react';
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
  const [purchaseDate, setPurchaseDate] = useState(''); // Estado da Data
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fiiData, setFiiData] = useState(null);

  useEffect(() => {
    if (editingFII) {
      setTicker(editingFII.ticker);
      setQuantity(editingFII.quantity);
      setPrice(editingFII.price);
      setPurchaseDate(editingFII.purchase_date || ''); // Carrega a data se existir
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
    // Data padrão: Hoje (formato YYYY-MM-DD para o input)
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setFiiData(null);
    setSearchError('');
  };

  const handleSearchTicker = async () => {
    if (!ticker || ticker.length < 4) return;
    if (isSearching) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const quote = await getFiiQuote(ticker.toUpperCase());
      
      if (quote) {
        setFiiData({
          name: quote.name,
          sector: quote.sector,
          currentPrice: quote.price
        });
        
        if (!price || !editingFII) {
          setPrice(quote.price);
          toast({ title: "Preço encontrado!", description: `Cotação atual: R$ ${quote.price}` });
        }
      } else {
        setSearchError('Fundo não encontrado.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    if (!ticker || !quantity || !price) {
      toast({ title: "Dados incompletos", description: "Preencha Ticker, Quantidade e Preço.", variant: "destructive" });
      return;
    }

    const fiiToSave = {
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price),
      purchaseDate: purchaseDate, // Envia a data
      sector: fiiData?.sector || 'Fundo Imobiliário',
      name: fiiData?.name || ticker.toUpperCase()
    };

    onSave(fiiToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingFII ? 'Editar Ativo' : 'Adicionar à Carteira'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ticker">Ticker</Label>
            <div className="flex gap-2">
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onBlur={handleSearchTicker}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchTicker()}
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
            {searchError && <p className="text-xs text-red-500">{searchError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="price">Preço Pago (R$)</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* CAMPO DE DATA NOVO */}
          <div className="grid gap-2">
            <Label htmlFor="date">Data da Compra</Label>
            <div className="relative">
                <Input 
                    id="date" 
                    type="date" 
                    value={purchaseDate} 
                    onChange={(e) => setPurchaseDate(e.target.value)} 
                />
            </div>
            <p className="text-[10px] text-gray-500">Usaremos isso para calcular o tempo de rendimento.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            {editingFII ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFIIModal;