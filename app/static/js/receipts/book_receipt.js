import { britishDateFormat, fetchData, getBaseUrl, getQueryParam, showNotification } from '../global/utils.js';

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
  const bookingId = getQueryParam('booking_id');
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const bookingUrl = API_BASE_URL + `/bookings/${bookingId}/booking-details`;

  fetchData(bookingUrl)
    .then(({ booking, checkin_by, checkout_by, customer, room }) => {

      const vat = (7.5 / 100) * booking.amount;
      const subTotal = booking.amount - vat;
      const user = checkout_by ? checkout_by : checkin_by;

      // Render receipt info
      const receiptInfo = `
        <div class="receipt-items">
            <div><p><strong>Customer's Name</strong></p><p>${customer.name}</p></div>
            <div><p><strong>Date</strong></p><p>${formatedDate()}</p></div>
            <div><p><strong>Time</strong></p><p>${formatedTime()}</p></div>
            <div><p><strong>Receipt No.</strong></p><p>${booking.book_receipt}</p></div>
            <div><p><strong>Terminal</strong></p><p>Terminal One</p></div>
            <div><p><strong>Staff</strong></p><p>${user.first_name} ${user.last_name}</p></div>
	    <div><p><strong>CheckIn</strong></p><p>${britishDateFormat(booking.checkin)}</p></div>
	    <div><p><strong>CheckOut</strong></p><p>${britishDateFormat(booking.checkout)}</p></div>
        </div>`;
      $("#receipt-info").html(receiptInfo);

      // Render customer order table
      let time;
      if (booking.is_short_rest || booking.is_half_booking) {
        time = 'Hours';
      } else if (booking.is_late_checkout) {
        time =  'Hours';
      } else {
        time = 'Night(s)';
      }
      let orderRows = `
        <tr>
            <td>${room.name} (${room.number})</td>
            <td>${booking.duration} ${time}</td>
            <td>${booking.amount.toLocaleString()}</td>
        </tr>
    `;

      const customerOrderTable = `
        <table>
            <thead>
                <tr>
                    <th>Room <br /></th>
                    <th>Duration</th>
                    <th>Amount(₦)</th>
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
            <div><p><strong>VAT</strong></p><p>${vat.toLocaleString()}</p></div>
            <div><p><strong>Total</strong></p><p>${booking.amount.toLocaleString()}</p></div>
        </div>`;
      $("#totals").html(totals);

      $(".total-payment").html(`<b>${booking.amount.toLocaleString()}</b>`);
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

