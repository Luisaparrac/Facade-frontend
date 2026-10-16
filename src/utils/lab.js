export function getResultStatus(result) {
  if (result.status) return result.status;
  if (result.value < result.referenceMin) return 'LOW';
  if (result.value > result.referenceMax) return 'HIGH';
  return 'NORMAL';
}

export const isOutOfRange = (result) => getResultStatus(result) !== 'NORMAL';

export function countOutOfRange(orders = []) {
  return orders.reduce(
    (total, order) => total + (order.results ?? []).filter(isOutOfRange).length,
    0,
  );
}

/** Most recent order for each exam type, newest first. */
export function latestOrderPerExam(orders = []) {
  const sorted = [...orders].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  const seen = new Set();
  return sorted.filter((order) => {
    if (seen.has(order.examType)) return false;
    seen.add(order.examType);
    return true;
  });
}
