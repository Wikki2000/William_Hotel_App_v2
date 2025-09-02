function createOfflineOrder(order, items) {
  const timestamp = Date.now();
  const externalId = `offline_${timestamp}`;

  const orderData = {
    id: externalId,
    external_id: externalId,
    payment_type: order.payment_type,
    amount: order.amount,
    is_paid: false,
    customer_id: order.customer_id,
    hotel_id: order.hotel_id,
    ordered_by_id: order.ordered_by_id,
    cleared_by_id: null,
    synced: false,
    order_items: items.map((item, index) => ({
      ...item,
      external_id: `oi_${timestamp}_${index}`,
      order_id: externalId,
      hotel_id: order.hotel_id
    }))
  };

  return cache.save_one('orders', orderData);
}

import { ajaxRequest } from './ajax.js';

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function syncOfflineOrders(batchSize = 10) {
  const unsynced = await cache.get_all_by('orders', { synced: false });

  if (unsynced.length === 0) return;

  const chunks = chunkArray(unsynced, batchSize);

  for (const batch of chunks) {
    await new Promise((resolve) => {
      ajaxRequest('/api/sync-orders-batch', 'POST', batch,
        async (res) => {
          const syncedIds = res.results
            .filter(r => r.status === 'synced')
            .map(r => r.external_id);

          for (const id of syncedIds) {
            await cache.delete('orders', id);
          }

          resolve();
        },
        (err) => {
          console.error('Sync error:', err);
          resolve(); // Don't block other batches
        }
      );
    });
  }
}

