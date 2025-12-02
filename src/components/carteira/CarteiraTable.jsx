import React, { useState } from 'react';
import { Edit, Trash2, CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import HistoryModal from './HistoryModal'; // <--- IMPORT NOVO

const CarteiraTable = ({ portfolio, onEdit, onRemove }) => {
  // ESTADOS PARA O MODAL DE HISTÓRICO
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);

  const handleOpenHistory = (ticker) => {
    setSelectedTicker(ticker);
    setHistoryOpen(true);
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24)); 
    if (diffDays < 30) return `${diffDays} dias`;
    return `${Math.floor(diffDays / 30)} meses`;
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>FII / Data</TableHead>
              <TableHead className="text-center">Qtd</TableHead>
              <TableHead className="text-right">Preço Médio</TableHead>
              <TableHead className="text-right">Preço Atual</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="text-right">Renda Mensal</TableHead>
              <TableHead className="text-right">Yield (Cost)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolio.map((fii) => {
              const quantity = Number(fii.quantity) || 0;
              const avgPrice = Number(fii.price) || 0;
              const currentPrice = Number(fii.currentPrice) || avgPrice;
              const lastDividend = Number(fii.last_dividend) || 0;
              
              const profit = (currentPrice - avgPrice) * quantity;
              const profitPercent = avgPrice > 0 ? (profit / (avgPrice * quantity)) * 100 : 0;
              const monthlyIncome = lastDividend * quantity;
              const yieldOnCost = avgPrice > 0 ? (lastDividend / avgPrice) * 100 : 0;
              const timeSince = getTimeSince(fii.purchase_date);

              return (
                <TableRow key={fii.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">{fii.ticker}</span>
                      {timeSince && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                              <CalendarDays className="h-3 w-3" />
                              <span>Há {timeSince}</span>
                          </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(avgPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(currentPrice)}</TableCell>
                  
                  <TableCell className="text-right">
                    <div className={`flex flex-col items-end ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="font-bold">{formatCurrency(profit)}</span>
                      <span className="text-xs font-semibold">{profitPercent > 0 ? '+' : ''}{profitPercent.toFixed(2)}%</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(monthlyIncome)}
                          </span>
                          {lastDividend > 0 && <span className="text-[10px] text-gray-400">({formatCurrency(lastDividend)}/cota)</span>}
                      </div>
                  </TableCell>

                  <TableCell className="text-right font-medium text-gray-700 dark:text-gray-300">
                    {yieldOnCost.toFixed(2)}% a.m.
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* BOTÃO HISTÓRICO ATUALIZADO */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Ver Histórico"
                        onClick={() => handleOpenHistory(fii.ticker)}
                      >
                        <Clock className="h-4 w-4 text-blue-500" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => onEdit(fii)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onRemove(fii.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* O MODAL FICA AQUI, FORA DA TABELA */}
      <HistoryModal 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        ticker={selectedTicker} 
      />
    </>
  );
};

export default CarteiraTable;