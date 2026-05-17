export const calculateArithmeticMean = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Number((sum / values.length).toFixed(4));
};

export const calculateGeometricMean = (values) => {
  if (!values || values.length === 0) return 0;
  // Перемножуємо всі значення
  const product = values.reduce((a, b) => a * b, 1);
  // Добуваємо корінь степеня кількості елементів
  return Number(Math.pow(product, 1 / values.length).toFixed(4));
};

export const calculateMedian = (values) => {
  if (!values || values.length === 0) return 0;
  // Сортуємо масив за зростанням
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return Number(median.toFixed(4));
};
