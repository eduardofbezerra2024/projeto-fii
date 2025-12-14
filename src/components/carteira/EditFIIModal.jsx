import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

const EditFIIModal = ({ isOpen, onClose, onSave, asset }) => {
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [owner, setOwner] = useState(''); // Campo Novo
  const [ticker, setTicker] = useState('');

  // Carrega os dados do ativo quando abre a janela
  useEffect(() => {
    if (asset) {
      setTicker(asset.ticker);
      setQuantity(asset.quantity);
      setPrice(asset.price);
      setOwner(asset.owner || 'Geral'); // Carrega o dono atual ou Geral
    }
  }, [asset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Manda os dados atualizados de volta para a Carteira
    await onSave(asset.id, {
      quantity: Number(quantity),
      price: Number(price),
      owner: owner.trim() || 'Geral' // Salva o novo nome
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Ativo ({ticker})</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* CAMPO INVESTIDOR NOVO */}
          <div className="grid gap-2">
            <Label htmlFor="edit-owner" className="flex items-center gap-2 text-blue-600">
                <User className="h-4 w-4" /> Nome do Investidor
            </Label>
            <Input
              id="edit-owner"
              placeholder="Quem é o dono? (Ex: Eduardo)"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="border-blue-100 bg-blue-50/50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-quantity">Quantidade</Label>
            <Input
              id="edit-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-price">Preço Médio (R$)</Label>
            <Input
              id="edit-price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFIIModal;