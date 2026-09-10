export const CURRENCY_SYMBOL = '₹';

export const formatINR = (amount, decimals = 2) => {
  const num = Number(amount || 0);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};


export const formatNumberIN = (amount, decimals = 2) => {
  const num = Number(amount || 0);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
