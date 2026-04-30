export const formatCompactCount = (count: number) => {
  if (count < 1000) {
    return count.toString();
  }

  const thousands = count / 1000;
  const formatted = Number.isInteger(thousands)
    ? thousands.toString()
    : thousands.toFixed(1).replace(/\.0$/, "");

  return `${formatted}тыс`;
};
