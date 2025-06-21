import { fetchData, getBaseUrl, getQueryParam, showNotification } from '../global/utils.js';

function formatedDate() {
  const today = new Date();
  const formattedDate = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
  return formattedDate;
}

function formatedTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12; // Convert to 12-hour format and handle midnight (0 -> 12)
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes; // Add leading zero if needed

    const formattedTime = hours + ':' + formattedMinutes + ' ' + ampm;
  return formattedTime;
}

$(document).ready(function() {
  const orderId = getQueryParam('order_id');
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const orderUrl = API_BASE_URL + `/orders/${orderId}/order-items`;

  fetchData(orderUrl)
    .then(({ order, customer, ordered_by, cleared_by, order_items }) => {

      const vat = (7.5 / 100) * order.amount;
      const subTotal = order.amount - vat;
      const user = cleared_by ? cleared_by : ordered_by;

      // Render receipt info
      const receiptInfo = `
        <div class="receipt-items">
            <div><p><strong>Customer's Name</strong></p><p>${customer.name}</p></div>
            <div><p><strong>Date</strong></p><p>${formatedDate()}</p></div>
            <div><p><strong>Time</strong></p><p>${formatedTime()}</p></div>
            <div><p><strong>Receipt No.</strong></p><p>${order.order_receipt}</p></div>
            <div><p><strong>Terminal</strong></p><p>Ifelodun-ilupeju</p></div>
            <div><p><strong>Seller Name</strong></p><p>${user.first_name} ${user.last_name}</p></div>
        </div>`;
      $("#receipt-info").html(receiptInfo);

      // Render customer order table
      let orderRows = order_items.map(order => `
        <tr>
            <td>${order.name}</td>
            <td>${order.qty}</td>
            <td>${order.price.toLocaleString()}</td>
            <td>${order.amount.toLocaleString()}</td>
        </tr>
    `).join("");

      const customerOrderTable = `
        <table>
            <thead>
                <tr>
                    <th>Item <br /><br /></th>
                    <th>Qty</th>
                    <th>Price(₦)</th>
                    <th>Total(₦)</th>
                </tr>
            </thead>
            <tbody>
                ${orderRows}
            </tbody>
        </table>`;
      $("#customer-order-table").html(customerOrderTable);

      // Render totals
      const totals = `
        <div class="order-total">
            <div><p><strong>Subtotal</strong></p><p>${subTotal.toLocaleString()}</p></div>
            <div><p><strong>VAT</strong></p><p>${vat}</p></div>
            <div><p><strong>Total</strong></p><p>${order.amount.toLocaleString()}</p></div>
        </div>`;
      $("#totals").html(totals);

      $(".total-payment").html(`<b>${order.amount.toLocaleString()}</b>`);
    })
    .catch((error) => {
      showNotification('An error occurred. Please try again.', true);
      console.log(error);
    });

  // Render QR Code
  //const qrCode = `<img src="${receiptData.qrCode}" alt="QR Code" width="400px" height="150px">`;
  //$("#qr-code").html(qrCode);
  $('.order__print-receipt').click(function() {
    window.print();
  });
});

