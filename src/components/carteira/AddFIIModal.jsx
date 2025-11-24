import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getFiiQuote, searchFii } from '@/services/fiiService';
import { toast } from '@/components/ui/use-toast';
import { debounce } from 'lodash';

const AddFIIModal = ({ isOpen, onClose, onSave, editingFII }) => {
  const [fiiData, setFiiData] = useState({
    ticker: '',
    name: '',
    quantity: '',
    avgPrice: '',
    currentPrice: '',
    dividendYield: '',
    sector: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tickerError, setTickerError] = useState('');

  useEffect(() => {
    if (editingFII) {
      setFiiData({
        ticker: editingFII.ticker,
        name: editingFII.name,
        quantity: editingFII.quantity,
        avgPrice: editingFII.avgPrice,
        currentPrice: editingFII.currentPrice,
        dividendYield: editingFII.dividendYield || '',
        sector: editingFII.sector
      });
    } else {
      resetForm();
    }
  }, [editingFII, isOpen]);

  const resetForm = () => {
    setFiiData({
      ticker: '',
      name: '',
      quantity: '',
      avgPrice: '',
      currentPrice: '',
      dividendYield: '',
      sector: ''
    });
    setTickerError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchFiiData = async (ticker) => {
    if (ticker.length < 5) return;
    setIsLoading(true);
    setTickerError('');
    try {
      const quote = await getFiiQuote(ticker);
      if (quote) {
        setFiiData(prev => ({
          ...prev,
          name: quote.name,
          currentPrice: quote.price,
          dividendYield: quote.dividendYield === null ? '' : quote.dividendYield,
          sector: quote.sector
        }));
      } else {
        setTickerError('Ticker não encontrado ou inválido.');
        setFiiData(prev => ({ ...prev, name: '', currentPrice: '', dividendYield: '', sector: '' }));
      }
    } catch (error) {
      setTickerError('Erro ao buscar dados do FII.');
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchFiiData, 500), []);

  const handleTickerChange = (e) => {
    const newTicker = e.target.value.toUpperCase();
    setFiiData(prev => ({ ...prev, ticker: newTicker }));
    if (newTicker && !editingFII) {
      debouncedFetch(newTicker);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiiData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fiiData.ticker || !fiiData.quantity || !fiiData.avgPrice) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, preencha Ticker, Quantidade e Preço Médio.',
        variant: 'destructive',
      });
      return;
    }

    const dataToSave = {
      ...fiiData,
      quantity: parseFloat(fiiData.quantity),
      avgPrice: parseFloat(fiiData.avgPrice),
      dividendYield: fiiData.dividendYield === '' ? 0 : parseFloat(fiiData.dividendYield),
    };

    onSave(dataToSave);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">{editingFII ? 'Editar FII' : 'Adicionar FII'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticker" className="text-right text-gray-600 dark:text-gray-300">Ticker</Label>
              <div className="col-span-3">
                <Input id="ticker" name="ticker" value={fiiData.ticker} onChange={handleTickerChange} className="dark:bg-gray-700 dark:text-white" disabled={!!editingFII} />
                {tickerError && <p className="text-red-500 text-sm mt-1">{tickerError}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-gray-600 dark:text-gray-300">Nome</Label>
              <Input id="name" name="name" value={fiiData.name} className="col-span-3 dark:bg-gray-700 dark:text-white" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right text-gray-600 dark:text-gray-300">Quantidade</Label>
              <Input id="quantity" name="quantity" type="number" value={fiiData.quantity} onChange={handleChange} className="col-span-3 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="avgPrice" className="text-right text-gray-600 dark:text-gray-300">Preço Médio</Label>
              <Input id="avgPrice" name="avgPrice" type="number" step="0.01" value={fiiData.avgPrice} onChange={handleChange} className="col-span-3 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentPrice" className="text-right text-gray-600 dark:text-gray-300">Preço Atual</Label>
              <Input id="currentPrice" name="currentPrice" value={fiiData.currentPrice} className="col-span-3 dark:bg-gray-700 dark:text-white" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dividendYield" className="text-right text-gray-600 dark:text-gray-300">Dividend Yield (%)</Label>
              <Input id="dividendYield" name="dividendYield" type="number" step="0.01" value={fiiData.dividendYield} onChange={handleChange} placeholder="Ex: 8.5" className="col-span-3 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sector" className="text-right text-gray-600 dark:text-gray-300">Setor</Label>
              <Input id="sector" name="sector" value={fiiData.sector} className="col-span-3 dark:bg-gray-700 dark:text-white" disabled />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading || !!tickerError}>
              {isLoading ? 'Buscando...' : (editingFII ? 'Salvar Alterações' : 'Adicionar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add lodash debounce to the window object if it's not there
if (typeof window.debounce === 'undefined') {
    window.debounce = (func, wait, immediate) => {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };
}

export default AddFIIModal;