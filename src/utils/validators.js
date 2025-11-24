export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const validatePositiveNumber = (value) => {
  return !isNaN(value) && parseFloat(value) > 0;
};

export const validateTicker = (ticker) => {
  const tickerRegex = /^[A-Z]{4}\d{2}$/;
  return tickerRegex.test(ticker);
};

export const validateQuantity = (quantity) => {
  return Number.isInteger(Number(quantity)) && Number(quantity) > 0;
};