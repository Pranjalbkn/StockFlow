type LineItem = {
  quantity: number;
  unitAmount: number;
};

export function calculateTotal(items: LineItem[]) {
  const totalInPaise = items.reduce(
    (total, item) => total + Math.round(item.unitAmount * 100) * item.quantity,
    0,
  );

  return totalInPaise / 100;
}
