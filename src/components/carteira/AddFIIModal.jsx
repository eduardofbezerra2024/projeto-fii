import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFiiQuote } from '@/services/fiiService';

const AddTransactionModal = ({ isOpen, onClose, onSave }) => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date());
  const [lastDividend, setLastDividend] = useState('');
  const [fiiType, setFiiType] = useState('Indefinido');
  const [owner, setOwner] = useState(''); // <--- ESTADO DO INVESTIDOR
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Função para buscar dados automáticos ao digitar o Ticker
  const handleSearchTicker = async () => {
    if (!ticker) return;
    setLoadingSearch(true);
    try {
      const data = await getFiiQuote(ticker);
      if (data) {
        setPrice(data.price);
        // Tenta adivinhar o tipo baseando no setor (simplificado)
        if (data.sector) {
            if (data.sector.toLowerCase().includes('papel') || data.sector.toLowerCase().includes('receb')) setFiiType('Papel');
            else if (data.sector.toLowerCase().includes('tijolo') || data.sector.toLowerCase().includes('log') || data.sector.toLowerCase().includes('shop')) setFiiType('Tijolo');
            else setFiiType('Indefinido');
        }
      }
    } catch (error) {
      console.error("Erro ao buscar ticker", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepara os dados para salvar
    const assetData = {
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price),
      purchaseDate: date,
      lastDividend: Number(lastDividend),
      fiiType,
      // --- AQUI ESTÁ A CORREÇÃO: ENVIAR O NOME ---
      owner: owner.trim() || 'Geral' 
      // -------------------------------------------
    };

    await onSave(assetData);
    
    // Limpa o formulário
    setTicker('');
    setQuantity('');
    setPrice('');
    setOwner('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Compra</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* CAMPO INVESTIDOR (CORRIGIDO) */}
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
                <Button type="button" size="icon" variant="outline" onClick={handleSearchTicker} disabled={loadingSearch}>
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
                <Label>Data Compra</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR}/>
                    </PopoverContent>
                </Popover>
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
            <Select value={fiiType} onValueChange={setFiiType}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Tijolo">🧱 Tijolo (Imóveis Físicos)</SelectItem>
                    <SelectItem value="Papel">📄 Papel (CRIs/Dívidas)</SelectItem>
                    <SelectItem value="Fiagro">🌾 Fiagro (Agronegócio)</SelectItem>
                    <SelectItem value="Infra">🏗️ Infra (Infraestrutura)</SelectItem>
                    <SelectItem value="Indefinido">❓ Indefinido</SelectItem>
                </SelectContent>
            </Select>
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

export default AddTransactionModal;