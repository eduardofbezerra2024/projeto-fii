import React, { useState, useEffect } from 'react';
import { Search, Loader2, Building2 } from 'lucide-react'; // Ícone novo
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
  // NOVO ESTADO PARA O TIPO
  const [fiiType, setFiiType] = useState('Tijolo'); 
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fiiData, setFiiData] = useState(null);

  useEffect(() => {
    if (editingFII) {
      setTicker(editingFII.ticker);
      setQuantity(editingFII.quantity);
      setPrice(editingFII.price);
      setPurchaseDate(editingFII.purchase_date || '');
      setLastDividend(editingFII.last_dividend || '');
      setFiiType(editingFII.fii_type || 'Tijolo'); // Carrega o tipo salvo
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
    setFiiType('Tijolo'); // Padrão
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
          toast({ title: "Preço atual preenchido!" });
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
      purchaseDate: purchaseDate,
      lastDividend: Number(lastDividend) || 0,
      fiiType: fiiType, // Envia o tipo escolhido
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
          {/* Ticker e Busca */}
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
                <Label className="text-blue-600">Último Provento</Label>
                <Input type="number" step="0.01" value={lastDividend} onChange={(e) => setLastDividend(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* NOVO CAMPO: TIPO DO ATIVO */}
          <div className="grid gap-2">
            <Label htmlFor="type" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Tipo do Fundo
            </Label>
            <select
                id="type"
                value={fiiType}
                onChange={(e) => setFiiType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="Tijolo">🧱 Tijolo (Imóveis Físicos)</option>
                <option value="Papel">📄 Papel (CRIs/Dívidas)</option>
                <option value="Hibrido">⚖️ Híbrido (Misto)</option>
                <option value="Fiagro">🚜 Fiagro (Agronegócio)</option>
                <option value="Infra">🏗️ Infra (Infraestrutura)</option>
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