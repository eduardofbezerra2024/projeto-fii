import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertTypes } from '@/types';
import { toast } from '@/components/ui/use-toast';

const AlertForm = ({ isOpen, onClose, onSave, editingAlert }) => {
  const [formData, setFormData] = useState({
    ticker: '',
    type: AlertTypes.PRICE_BELOW,
    value: ''
  });
  
  useEffect(() => {
    if (editingAlert) {
      setFormData(editingAlert);
    } else {
      setFormData({
        ticker: '',
        type: AlertTypes.PRICE_BELOW,
        value: ''
      });
    }
  }, [editingAlert, isOpen]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const alertData = {
      ...formData,
      ticker: formData.ticker.toUpperCase(),
      value: formData.type !== AlertTypes.NEW_DIVIDEND ? parseFloat(formData.value) : 0
    };
    
    onSave(alertData);
    onClose();
    
    toast({
      title: 'Sucesso',
      description: editingAlert ? 'Alerta atualizado!' : 'Alerta criado!'
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingAlert ? 'Editar Alerta' : 'Novo Alerta'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ticker">Ticker do FII</Label>
            <input
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleChange}
              placeholder="RZTR11"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="type">Tipo de Alerta</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value={AlertTypes.PRICE_BELOW}>Preço abaixo de</option>
              <option value={AlertTypes.PRICE_ABOVE}>Preço acima de</option>
              <option value={AlertTypes.YIELD_ABOVE}>Yield acima de</option>
              <option value={AlertTypes.NEW_DIVIDEND}>Novo dividendo</option>
            </select>
          </div>
          
          {formData.type !== AlertTypes.NEW_DIVIDEND && (
            <div>
              <Label htmlFor="value">
                {formData.type === AlertTypes.YIELD_ABOVE ? 'Valor (%)' : 'Valor (R$)'}
              </Label>
              <input
                id="value"
                name="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={handleChange}
                placeholder={formData.type === AlertTypes.YIELD_ABOVE ? '8.5' : '120.00'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {editingAlert ? 'Atualizar' : 'Criar Alerta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AlertForm;