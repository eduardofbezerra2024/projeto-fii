import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PortfolioService } from '@/services/UserPortfolioService';
import { formatCurrency } from '@/utils/formatters';

const HistoryModal = ({ isOpen, onClose, ticker }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && ticker) {
      loadHistory();
    }
  }, [isOpen, ticker]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await PortfolioService.getTransactions(ticker);
      setTransactions(data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Histórico de Transações: <span className="text-green-600">{ticker}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-gray-600">
                      {new Date(tx.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${
                        tx.type === 'sell' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {tx.type === 'sell' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        {tx.type === 'sell' ? 'Venda' : 'Compra'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{tx.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.price)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(tx.price * tx.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma transação registrada para este ativo.</p>
            <p className="text-xs mt-1">(Compras antigas sem histórico não aparecem aqui)</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistoryModal;