export const calculateTotalValue = (quantity, price) => {
  return quantity * price;
};

export const calculateProfitLoss = (quantity, avgPrice, currentPrice) => {
  const invested = quantity * avgPrice;
  const current = quantity * currentPrice;
  return current - invested;
};

export const calculateProfitLossPercent = (avgPrice, currentPrice) => {
  return ((currentPrice - avgPrice) / avgPrice) * 100;
};

export const calculateYield = (dividendValue, price) => {
  return (dividendValue / price) * 100;
};

export const calculateFutureValue = (initialInvestment, monthlyContribution, months, annualYield) => {
  const monthlyRate = annualYield / 12 / 100;
  let futureValue = initialInvestment;
  
  for (let i = 0; i < months; i++) {
    futureValue = (futureValue + monthlyContribution) * (1 + monthlyRate);
  }
  
  return futureValue;
};

export const calculateAccumulatedDividends = (initialInvestment, monthlyContribution, months, annualYield) => {
  const monthlyRate = annualYield / 12 / 100;
  let totalDividends = 0;
  let currentValue = initialInvestment;
  
  for (let i = 0; i < months; i++) {
    const monthlyDividend = currentValue * monthlyRate;
    totalDividends += monthlyDividend;
    currentValue += monthlyContribution;
  }
  
  return totalDividends;
};

export const calculateProjectionData = (initialInvestment, monthlyContribution, months, annualYield) => {
  const monthlyRate = annualYield / 12 / 100;
  const data = [];
  let currentValue = initialInvestment;
  let totalInvested = initialInvestment;
  
  for (let i = 0; i <= months; i++) {
    data.push({
      month: i,
      invested: totalInvested,
      value: currentValue,
      profit: currentValue - totalInvested
    });
    
    if (i < months) {
      currentValue = (currentValue + monthlyContribution) * (1 + monthlyRate);
      totalInvested += monthlyContribution;
    }
  }
  
  return data;
};

export const calculatePortfolioMetrics = (portfolio) => {
  const totalInvested = portfolio.reduce((sum, item) => sum + (item.quantity * item.avgPrice), 0);
  const currentValue = portfolio.reduce((sum, item) => sum + (item.quantity * item.currentPrice), 0);
  const profitLoss = currentValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  
  const monthlyDividends = portfolio.reduce((sum, item) => {
    const dividendPerShare = (item.currentPrice * item.dividendYield) / 100 / 12;
    return sum + (dividendPerShare * item.quantity);
  }, 0);
  
  const avgYield = portfolio.length > 0 
    ? portfolio.reduce((sum, item) => sum + item.dividendYield, 0) / portfolio.length 
    : 0;
  
  return {
    totalInvested,
    currentValue,
    profitLoss,
    profitLossPercent,
    monthlyDividends,
    annualDividends: monthlyDividends * 12,
    avgYield
  };
};