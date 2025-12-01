import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
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

  // Função de Busca Automática
  const handleSearchTicker = async () => {
    // Só busca se tiver algo digitado e se não estivermos apenas editando a quantidade de um existente
    if (!ticker || ticker.length < 4) return;
    
    // Se já estiver buscando, não faz nada
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
        
        // A MÁGICA: Se o campo de preço estiver vazio, preenche sozinho!
        if (!price || !editingFII) {
          setPrice(quote.price);
          toast({ 
            title: "Preço encontrado!", 
            description: `Cotação atual de R$ ${quote.price} preenchida.` 
          });
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
      toast({
        title: "Dados incompletos",
        description: "Precisamos do Ticker, Quantidade e Preço.",
        variant: "destructive"
      });
      return;
    }

    const fiiToSave = {
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price),
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
          {/* Campo Ticker com Busca Automática ao sair do campo (onBlur) */}
          <div className="grid gap-2">
            <Label htmlFor="ticker">Qual FII você comprou?</Label>
            <div className="flex gap-2">
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onBlur={handleSearchTicker} // <--- AQUI ESTÁ O SEGREDO: Buscou ao sair!
                onKeyDown={(e) => e.key === 'Enter' && handleSearchTicker()}
                placeholder="Ex: MXRF11"
                disabled={!!editingFII}
                className="uppercase"
              />
              {!editingFII && (
                <Button 
                  type="button" 
                  onClick={handleSearchTicker} 
                  disabled={isSearching}
                  size="icon"
                  variant="outline"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            {/* Mostra o nome do fundo se achar */}
            {fiiData && (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                 ✅ {fiiData.name} ({fiiData.sector})
              </p>
            )}
            {searchError && <p className="text-xs text-red-500">{searchError}</p>}
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
                autoFocus // Foca aqui assim que clicar em Adicionar (opcional, mas ajuda)
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="price">Preço Pago (R$)</Label>
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={isSearching ? "Buscando..." : "0.00"}
                  className={isSearching ? "opacity-50" : ""}
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-500">Preenchido automaticamente com a cotação atual.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            {editingFII ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFIIModal;