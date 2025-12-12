import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <--- 1. ÚNICA IMPORTAÇÃO NOVA
import { Edit, Trash2, CalendarDays, Clock, User, DollarSign, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/utils/formatters';
import HistoryModal from './HistoryModal';
import SellFIIModal from './SellFIIModal';

const CarteiraTable = ({ portfolio, onEdit, onRemove, onSell }) => {
  // Estados para Modais
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);
  
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [assetToSell, setAssetToSell] = useState(null);

  // Handlers para abrir modais
  const handleOpenHistory = (ticker) => {
    setSelectedTicker(ticker);
    setHistoryOpen(true);
  };

  const handleOpenSell = (fii) => {
    setAssetToSell(fii);
    setSellModalOpen(true);
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24)); 
    if (diffDays < 30) return `${diffDays} dias`;
    return `${Math.floor(diffDays / 30)} meses`;
  };

  // --- COMPONENTE INTERNO: CARD MOBILE ---
  const MobileCard = ({ fii }) => {
    const quantity = Number(fii.quantity) || 0;
    const avgPrice = Number(fii.price) || 0;
    const currentPrice = Number(fii.currentPrice) || avgPrice;
    const lastDividend = Number(fii.last_dividend) || 0;
    
    const profit = (currentPrice - avgPrice) * quantity;
    const profitPercent = avgPrice > 0 ? (profit / (avgPrice * quantity)) * 100 : 0;
    const monthlyIncome = lastDividend * quantity;
    const timeSince = getTimeSince(fii.purchase_date);

    return (
      <Card className="mb-4 border-l-4 border-l-blue-500 shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                {/* --- 2. ALTERAÇÃO NO MOBILE: Título virou Link --- */}
                <Link to={`/ativo/${fii.ticker}`} className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 hover:underline">
                    {fii.ticker}
                </Link>
                {/* ------------------------------------------------ */}
                {fii.fii_type && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                    ${fii.fii_type === 'Tijolo' ? 'bg-orange-100 text-orange-700' : 
                      fii.fii_type === 'Papel' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'}`}>
                    {fii.fii_type}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{fii.sector}</span>
              
              <p className="text-[10px] text-blue-600 font-medium flex items-center mt-1">
                <User className="h-3 w-3 mr-1" /> {fii.owner || 'Geral'}
              </p>
            </div>
            
            {/* Menu de Ações Mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenSell(fii)} className="text-emerald-600 font-semibold focus:text-emerald-700 focus:bg-emerald-50">
                  <DollarSign className="mr-2 h-4 w-4" /> Vender Ativo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenHistory(fii.ticker)}>
                  <Clock className="mr-2 h-4 w-4" /> Histórico
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(fii)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRemove(fii.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Preço Médio</p>
              <p className="font-medium">{formatCurrency(avgPrice)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Preço Atual</p>
              <p className="font-medium">{formatCurrency(currentPrice)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Quantidade</p>
              <p className="font-medium">{quantity} cotas</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Renda Mensal</p>
              <p className="font-medium text-green-600">{formatCurrency(monthlyIncome)}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <div>
               <p className="text-gray-500 text-xs">Resultado</p>
               <div className={`flex items-center font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {formatCurrency(profit)}
                  <span className="text-xs ml-1 font-normal">({profitPercent.toFixed(2)}%)</span>
               </div>
            </div>
            {timeSince && (
              <div className="flex items-center text-xs text-gray-400">
                <CalendarDays className="h-3 w-3 mr-1" /> {timeSince}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* --- VERSÃO MOBILE (CARDS) --- */}
      <div className="block md:hidden">
        {portfolio.map((fii) => (
          <MobileCard key={fii.id} fii={fii} />
        ))}
      </div>

      {/* --- VERSÃO DESKTOP (TABELA) --- */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>FII / Detalhes</TableHead>
              <TableHead className="hidden md:table-cell">Investidor</TableHead>
              <TableHead className="text-center">Qtd</TableHead>
              <TableHead className="text-right">Preço Médio</TableHead>
              <TableHead className="text-right">Preço Atual</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              {/* Mantendo sua coluna destacada */}
              <TableHead className="text-right text-emerald-600 font-bold bg-emerald-50/30">Proventos (Mês)</TableHead>
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
                    <div className="flex flex-col gap-1">
                      {/* --- 3. ALTERAÇÃO NO DESKTOP: Nome virou Link --- */}
                      <Link to={`/ativo/${fii.ticker}`} className="font-bold text-gray-900 dark:text-white hover:text-blue-600 hover:underline">
                        {fii.ticker}
                      </Link>
                      {/* ----------------------------------------------- */}
                      <span className="text-xs text-gray-500 dark:text-gray-400">{fii.sector || 'Fundo Imobiliário'}</span>
                      {fii.fii_type && fii.fii_type !== 'Indefinido' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit font-medium
                            ${fii.fii_type === 'Tijolo' ? 'bg-orange-100 text-orange-700' : 
                              fii.fii_type === 'Papel' ? 'bg-blue-100 text-blue-700' : 
                              'bg-gray-100 text-gray-700'}`}>
                            {fii.fii_type}
                        </span>
                      )}
                      {timeSince && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                              <CalendarDays className="h-3 w-3" />
                              <span>Há {timeSince}</span>
                          </div>
                      )}
                    </div>
                  </TableCell>
                  
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
                  
                  {/* Coluna Proventos com Destaque (Mantida) */}
                  <TableCell className="text-right bg-emerald-50/50 dark:bg-emerald-900/10 border-l border-r border-transparent">
                      <div className="flex flex-col items-end">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base">{formatCurrency(monthlyIncome)}</span>
                          {lastDividend > 0 && <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">({formatCurrency(lastDividend)}/cota)</span>}
                      </div>
                  </TableCell>
                  
                  <TableCell className="text-right font-medium text-gray-700 dark:text-gray-300">
                    {yieldOnCost.toFixed(2)}% a.m.
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenSell(fii)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 px-2"
                        title="Vender Ativo"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Vender</span>
                      </Button>

                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenHistory(fii.ticker)} title="Histórico">
                            <Clock className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(fii)} title="Editar">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onRemove(fii.id)} className="text-red-500 hover:bg-red-50" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} ticker={selectedTicker} />
      
      <SellFIIModal 
        isOpen={sellModalOpen} 
        onClose={() => setSellModalOpen(false)} 
        onConfirm={onSell}
        asset={assetToSell}
      />
    </>
  );
};

export default CarteiraTable;