import React, { useState, useEffect } from 'react';
import { Search, Loader2, Building2, Coins, ExternalLink, User, Calendar } from 'lucide-react';
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
  const [owner, setOwner] = useState(''); // <--- Campo do Dono
  
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
      setOwner(editingFII.owner || ''); // Carrega nome existente
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
    setOwner('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setFiiData(null);
  };

  const mapFundType = (rawType) => {
    if (!rawType) return null;
    const type = rawType.toUpperCase();
    if (type.includes('PAPEL')) return 'Papel';
    if (type.includes('TIJOLO')) return 'Tijolo';
    if (type.includes('FIAGRO')) return 'Fiagro';
    if (type.includes('INFRA')) return 'Infra';
    if (type.includes('HÍBRIDO') || type.includes('MISTO')) return 'Hibrido';
    return 'Outros';
  };

  const handleSearchTicker = async () => {
    if (!ticker || ticker.length < 4) return;
    if (isSearching) return;

    setIsSearching(true);
    setFiiData(null);
    setLastDividend('');

    try {
      const quote = await getFiiQuote(ticker.toUpperCase());
      
      if (quote) {
        setFiiData({ name: quote.name, sector: quote.sector, currentPrice: quote.price });
        if (!price || !editingFII) {
          setPrice(quote.price);
          toast({ description: `Preço atual: R$ ${quote.price}` });
        }

        try {
            const divResponse = await fetch(`/api/dividend?ticker=${ticker.toUpperCase()}`);
            const divData = await divResponse.json();
            if (divData.dividend) setLastDividend(divData.dividend);
            if (divData.fundType) {
                const mappedType = mapFundType(divData.fundType);
                if (mappedType) setFiiType(mappedType);
            }
            if (divData.dividend || divData.fundType) {
                 toast({ description: `Dados carregados! Rendimento: R$ ${divData.dividend} | Tipo: ${divData.fundType}`, duration: 3000 });
            }
        } catch (divError) { console.error("Erro ao buscar dados extras:", divError); }

      } else {
        toast({ variant: "destructive", title: "Fundo não encontrado." });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao buscar dados." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    if (!ticker || !quantity || !price) {
      toast({ title: "Dados incompletos", variant: "destructive" });
      return;
    }

    const fiiToSave = {
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price),
      purchaseDate: purchaseDate,
      lastDividend: Number(lastDividend) || 0,
      fiiType: fiiType,
      owner: owner || 'Geral', // Salva 'Geral' se estiver vazio
      sector: fiiData?.sector || 'Fundo Imobiliário',
      name: fiiData?.name || ticker.toUpperCase()
    };

    onSave(fiiToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] rounded-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editingFII ? 'Editar Ativo' : 'Nova Compra'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          
          {/* --- MUDANÇA: CAMPO DONO AGORA É O PRIMEIRO --- */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
            <Label htmlFor="owner" className="text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-1">
                <User className="h-4 w-4" /> Nome do Investidor
            </Label>
            <Input 
                id="owner" 
                value={owner} 
                onChange={(e) => setOwner(e.target.value)} 
                placeholder="Quem comprou? (Ex: Eduardo)" 
                className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700"
            />
          </div>
          {/* ----------------------------------------------- */}

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
                className="uppercase text-lg font-bold"
              />
              {!editingFII && (
                <Button type="button" onClick={handleSearchTicker} disabled={isSearching} size="icon" variant="outline">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {fiiData && <p className="text-xs text-green-600 font-medium">✅ {fiiData.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Quantidade</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="text-lg" /></div>
            <div><Label>Preço Pago (R$)</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="text-lg" /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <Label>Data Compra</Label>
                <div className="relative">
                    <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-1">
                    <Label className="text-blue-600">Último Provento</Label>
                    {ticker.length >= 4 && (
                        <a 
                            href={`https://investidor10.com.br/fiis/${ticker.toLowerCase()}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-gray-400 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
                        >
                            Ver fonte <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                </div>
                <div className="relative">
                    <Input 
                        type="number" 
                        step="0.01" 
                        value={lastDividend} 
                        onChange={(e) => setLastDividend(e.target.value)} 
                        placeholder="0.00" 
                        className={isSearching ? "opacity-50" : ""}
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

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto h-12 text-lg">Salvar</Button>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto mt-2 sm:mt-0">Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFIIModal;