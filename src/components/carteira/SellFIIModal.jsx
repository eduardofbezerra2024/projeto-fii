import React, { useState } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/formatters';

const SellFIIModal = ({ isOpen, onClose, onConfirm, asset }) => {
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!asset) return null;

  const currentQty = Number(asset.quantity);
  const avgPrice = Number(asset.price);
  const sellPrice = Number(price);
  const sellQty = Number(quantity);

  // Previsão de Lucro em Tempo Real
  const estimatedProfit = (sellPrice - avgPrice) * sellQty;
  const isProfitable = estimatedProfit >= 0;

  const handleSave = () => {
    if (!sellQty || sellQty <= 0 || sellQty > currentQty) {
        alert("Quantidade inválida!");
        return;
    }
    if (!sellPrice || sellPrice <= 0) {
        alert("Preço inválido!");
        return;
    }
    
    onConfirm({
        ticker: asset.ticker,
        quantity: sellQty,
        price: sellPrice,
        date: date
    });
    onClose();
    setQuantity('');
    setPrice('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Vender {asset.ticker}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p>Disponível: <strong>{currentQty} cotas</strong></p>
            <p>Preço Médio de Compra: <strong>{formatCurrency(avgPrice)}</strong></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Qtd Venda</Label>
                <Input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    max={currentQty}
                />
            </div>
            <div>
                <Label>Preço Venda (R$)</Label>
                <Input 
                    type="number" 
                    step="0.01" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                />
            </div>
          </div>
          
          <div>
             <Label>Data da Venda</Label>
             <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* SIMULADOR DE RESULTADO */}
          {sellQty > 0 && sellPrice > 0 && (
              <div className={`p-3 rounded-lg border ${isProfitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-xs font-semibold uppercase text-gray-500">Resultado Estimado</p>
                  <p className={`text-xl font-bold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(estimatedProfit)}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {isProfitable ? 'Lucro (Darf a pagar se > R$0)' : 'Prejuízo (Abate no IR)'}
                  </p>
              </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white">
            Confirmar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SellFIIModal;