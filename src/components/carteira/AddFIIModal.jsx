import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getFiiQuote } from '@/services/fiiService'; // Apenas a busca de cotação já resolve
import { toast } from '@/components/ui/use-toast';

const AddFIIModal = ({ isOpen, onClose, onSave, editingFII }) => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fiiData, setFiiData] = useState(null);

  // Limpa ou preenche ao abrir
  useEffect(() => {
    if (editingFII) {
      setTicker(editingFII.ticker);
      setQuantity(editingFII.quantity);
      setPrice(editingFII.price);
      // Se tiver dados extras salvos, mostra, senão deixa quieto
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

  // A MÁGICA DA BUSCA 🧙‍♂️
  const handleSearchTicker = async (e) => {
    if(e) e.preventDefault(); // Evita recarregar se vier de um Enter
    
    if (!ticker || ticker.length < 4) {
      setSearchError('Digite um código válido (ex: MXRF11)');
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    setFiiData(null);

    try {
      // Busca dados atualizados
      const quote = await getFiiQuote(ticker.toUpperCase());
      
      if (quote) {
        setFiiData({
          name: quote.name,
          sector: quote.sector,
          currentPrice: quote.price
        });
        
        // AUTO-PREENCHIMENTO: Se não estivermos editando (ou se o preço estiver vazio), preenche sozinho
        if (!editingFII || !price) {
          setPrice(quote.price);
          toast({ description: `Preço atual de R$ ${quote.price} encontrado!` });
        }
      } else {
        setSearchError('Fundo não encontrado na B3.');
      }
    } catch (error) {
      setSearchError('Erro ao buscar. Verifique sua conexão.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    // Validação básica para não quebrar o banco
    if (!ticker || !quantity || !price) {
      toast({
        title: "Faltam dados",
        description: "Por favor, preencha o Ticker, a Quantidade e o Preço.",
        variant: "destructive"
      });
      return;
    }

    const fiiToSave = {
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price), // Garante que vai como número
      sector: fiiData?.sector || 'Fundo Imobiliário', // Usa o setor que achamos na busca
      name: fiiData?.name || ticker.toUpperCase()
    };

    onSave(fiiToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingFII ? 'Editar FII' : 'Adicionar à Carteira'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Campo de Busca Inteligente */}
          <div className="grid gap-2">
            <Label htmlFor="ticker">Qual FII você comprou?</Label>
            <div className="flex gap-2">
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Ex: MXRF11"
                disabled={!!editingFII}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchTicker(e)} // Busca ao dar Enter
              />
              {!editingFII && (
                <Button 
                  type="button" 
                  onClick={handleSearchTicker} 
                  disabled={isSearching}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            {/* Resultado da Busca (Feedback Visual) */}
            {searchError && <p className="text-sm text-red-500 font-medium">{searchError}</p>}
            
            {fiiData && (
              <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm">
                <p className="font-bold text-slate-700">{fiiData.name}</p>
                <div className="flex gap-2 text-slate-500 mt-1">
                    <span>🏢 {fiiData.sector}</span>
                    <span>💰 Cotação: R$ {fiiData.currentPrice}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantas cotas?</Label>
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
              <p className="text-[10px] text-gray-500">O valor que você pagou por cota.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            {editingFII ? 'Salvar Alterações' : 'Adicionar Ativo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFIIModal;