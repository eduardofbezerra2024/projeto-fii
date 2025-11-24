export const SAMPLE_FIIS = [
  {
    id: '1',
    ticker: 'RZTR11',
    name: 'RBR Alpha Multiestratégia Real Estate',
    sector: 'Real Estate',
    currentPrice: 120.50,
    dividendYield: 8.5,
    pvp: 0.95,
    liquidity: 'High',
    lastDividend: 0.85,
    dividendDate: '2025-11-10'
  },
  {
    id: '2',
    ticker: 'CPTS11',
    name: 'Capitânia Securities II',
    sector: 'Logistics',
    currentPrice: 95.30,
    dividendYield: 7.2,
    pvp: 1.02,
    liquidity: 'High',
    lastDividend: 0.57,
    dividendDate: '2025-11-08'
  },
  {
    id: '3',
    ticker: 'SNCI11',
    name: 'Shopping Neumarkt',
    sector: 'Shopping Centers',
    currentPrice: 78.90,
    dividendYield: 6.8,
    pvp: 0.88,
    liquidity: 'Medium',
    lastDividend: 0.45,
    dividendDate: '2025-11-12'
  }
];

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CARTEIRA: '/carteira',
  SIMULADOR: '/simulador',
  ANALISE: '/analise',
  ALERTAS: '/alertas',
  CONFIGURACOES: '/configuracoes',
  LOGIN: '/login',
  REGISTER: '/register'
};

export const THEME_COLORS = {
  light: {
    primary: '#10b981',
    secondary: '#3b82f6',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827'
  },
  dark: {
    primary: '#34d399',
    secondary: '#60a5fa',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb'
  }
};