import React from 'react';
import { Edit, Trash2, CalendarDays, Clock } from 'lucide-react'; // Usando Clock no lugar de History por segurança
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';

const CarteiraTable = ({ portfolio, onEdit, onRemove }) => {
  
  // Função para calcular tempo decorrido
  const getTimeSince = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 30) return `${diffDays} dias`;
    const months = Math.floor(diffDays / 30);
    return `${months} meses`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>FII / Data</TableHead>
            <TableHead className="text-center">Qtd</TableHead>
            <TableHead className="text-right">Preço Médio</TableHead>
            <TableHead className="text-right">Preço Atual</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Lucro/Prejuízo</TableHead>
            <TableHead className="text-right">Yield (12m)</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolio.map((fii) => {
            const quantity = Number(fii.quantity) || 0;
            const avgPrice = Number(fii.price) || 0;
            const currentPrice = Number(fii.currentPrice) || avgPrice;
            
            const totalValue = currentPrice * quantity;
            const profit = (currentPrice - avgPrice) * quantity;
            const profitPercent = avgPrice > 0 ? (profit / (avgPrice * quantity)) * 100 : 0;
            const yieldVal = Number(fii.dividendYield) || 0;
            
            // Cálculo do Tempo
            const timeSince = getTimeSince(fii.purchase_date);

            return (
              <TableRow key={fii.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white">{fii.ticker}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{fii.sector || 'Fundo Imobiliário'}</span>
                    
                    {/* MOSTRA O TEMPO DE CARTEIRA */}
                    {timeSince && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded">
                            <CalendarDays className="h-3 w-3" />
                            <span>Há {timeSince}</span>
                        </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(avgPrice)}</TableCell>
                <TableCell className="text-right">{formatCurrency(currentPrice)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totalValue)}</TableCell>
                
                <TableCell className="text-right">
                  <div className={`flex flex-col items-end ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="font-bold">{formatCurrency(profit)}</span>
                    <span className="text-xs font-semibold">
                        {profitPercent > 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                  {yieldVal.toFixed(2)}%
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* BOTÃO DE HISTÓRICO (Agora no lugar certo!) */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Ver Histórico"
                      onClick={() => alert(`Histórico de ${fii.ticker} em breve!`)}
                    >
                      <Clock className="h-4 w-4 text-blue-500" />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => onEdit(fii)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(fii.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CarteiraTable;