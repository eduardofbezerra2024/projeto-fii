import React, { useState } from 'react';
import { Edit, Trash2, CalendarDays, Clock, User } from 'lucide-react'; // Adicionei User
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import HistoryModal from './HistoryModal';

const CarteiraTable = ({ portfolio, onEdit, onRemove }) => {
  // Estados para o Modal de Histórico
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);

  const handleOpenHistory = (ticker) => {
    setSelectedTicker(ticker);
    setHistoryOpen(true);
  };

  // Função para calcular há quanto tempo tem o ativo
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
              <TableHead>FII / Detalhes</TableHead>
              {/* NOVA COLUNA: Investidor (Só aparece no PC) */}
              <TableHead className="hidden md:table-cell">Investidor</TableHead>
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
              // Garantir que os valores sejam números para não quebrar a matemática
              const quantity = Number(fii.quantity) || 0;
              const avgPrice = Number(fii.price) || 0;
              const currentPrice = Number(fii.currentPrice) || avgPrice;
              const lastDividend = Number(fii.dividendYield || fii.last_dividend) || 0; // Tenta pegar do scraper ou do manual
              
              // Cálculos Financeiros
              const profit = (currentPrice - avgPrice) * quantity;
              const profitPercent = avgPrice > 0 ? (profit / (avgPrice * quantity)) * 100 : 0;
              const monthlyIncome = lastDividend * quantity; // Renda mensal estimada
              const yieldOnCost = avgPrice > 0 ? (lastDividend / avgPrice) * 100 : 0;
              
              const timeSince = getTimeSince(fii.purchase_date);

              return (
                <TableRow key={fii.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-gray-900 dark:text-white">{fii.ticker}</span>
                      
                      {/* Setor */}
                      <span className="text-xs text-gray-500 dark:text-gray-400">{fii.sector || 'Fundo Imobiliário'}</span>
                      
                      {/* INVESTIDOR NO MOBILE: Mostra embaixo do ticker para economizar espaço */}
                      <p className="md:hidden text-[10px] text-blue-600 font-medium flex items-center mt-1">
                        <User className="h-3 w-3 mr-1" /> {fii.owner || 'Geral'}
                      </p>

                      {/* ETIQUETA DE TIPO COLORIDA */}
                      {fii.fii_type && fii.fii_type !== 'Indefinido' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit font-medium mt-1
                            ${fii.fii_type === 'Tijolo' ? 'bg-orange-100 text-orange-700' : 
                              fii.fii_type === 'Papel' ? 'bg-blue-100 text-blue-700' : 
                              fii.fii_type === 'Fiagro' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'}`}>
                            {fii.fii_type}
                        </span>
                      )}

                      {/* Tempo de Carteira */}
                      {timeSince && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                              <CalendarDays className="h-3 w-3" />
                              <span>Há {timeSince}</span>
                          </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* INVESTIDOR NO DESKTOP: Coluna separada */}
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {fii.owner || 'Geral'}
                    </span>
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
                      {/* Botão de Histórico */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Ver Histórico de Compras"
                        onClick={() => handleOpenHistory(fii.ticker)}
                      >
                        <Clock className="h-4 w-4 text-blue-500" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => onEdit(fii)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={() => onRemove(fii.id)} className="text-red-500 hover:bg-red-50">
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

      {/* MODAL DE HISTÓRICO */}
      <HistoryModal 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        ticker={selectedTicker} 
      />
    </>
  );
};

export default CarteiraTable;