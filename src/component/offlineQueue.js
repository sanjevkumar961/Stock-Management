const KEY = 'offline_transactions_queue';

export function enqueueTransaction(txn) {
  const queue = JSON.parse(localStorage.getItem(KEY) || '[]');
  queue.push({
    ...txn,
    queuedAt: Date.now()
  });
  localStorage.setItem(KEY, JSON.stringify(queue));
}

export function getQueuedTransactions() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

export function clearQueue() {
  localStorage.removeItem(KEY);
}
