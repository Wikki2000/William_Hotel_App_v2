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

function bookingReceiptInfo(customer, user, booking) {
  // Render receipt info

  const staffFirstName = user ? user.first_name : "Former Staff";
  const staffLastName = user ? user.last_name : "";
  const receiptInfo = `
        <div class="receipt-items">
            <div><p><strong>Customer's Name</strong></p><p>${customer.name}</p></div>
            <div><p><strong>Date</strong></p><p>${formatedDate()}</p></div>
            <div><p><strong>Time</strong></p><p>${formatedTime()}</p></div>
            <div><p><strong>Receipt No.</strong></p><p>${booking.book_receipt}</p></div>
            <div><p><strong>Staff</strong></p><p>${staffFirstName} ${staffLastName}</p></div>
            <div><p><strong>CheckIn</strong></p><p>${britishDateFormat(booking.checkin)}</p></div>
            <div><p><strong>CheckOut</strong></p><p>${britishDateFormat(booking.checkout)}</p></div>
        </div>`;
  $("#receipt-info").html(receiptInfo);
}

function totalAmountTemplate(subTotal, vat, totalAmount) {
      const totals = `
        <div class="order-total">
           <div><p><strong>Subtotal</strong></p><p>${subTotal.toLocaleString()}</p></div>
            <div><p><strong>VAT</strong></p><p>${vat.toLocaleString()}</p></div>
            <div><p><strong>Total</strong></p><p>${totalAmount.toLocaleString()}</p></div>
        </div>`;
      $("#totals").html(totals);
  $(".total-payment").html(`<b>${totalAmount.toLocaleString()}</b>`);
}
function orderTable(
  roomName, roomNumber, duration, amount,
  is_short_rest, is_half_booking, is_late_checkout
) {
  // Render customer order table
  let time;
  if (is_short_rest || is_half_booking) {
    time = 'Hours';
  } else if (is_late_checkout) {
    time =  'Hours';
  } else {
    time = 'Night(s)';
  }
  let orderRows = `
        <tr>
            <td>${roomName} (${roomNumber})</td>
            <td>${duration} ${time}</td>
            <td>${amount.toLocaleString()}</td>
        </tr>
    `;
  return orderRows;
}

$(document).ready(function() {
  const bookingId = getQueryParam('booking_id');
  const booking_count = getQueryParam('booking_count');
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const bookingUrl = API_BASE_URL + `/bookings/${bookingId}/booking-details`;

  if (booking_count === "multiple") {
    const url = API_BASE_URL + `/bookings/${bookingId}/multiple-bookings-details`

    fetchData(url)
      .then((data) => {
        const bookings = data.booking;

        const totalAmount = bookings.reduce((sum, item) => sum + item.amount, 0);
        const vat = (7.5 / 100) * totalAmount;
        const subTotal = totalAmount - vat;

        bookingReceiptInfo(data.customer, data.user, bookings[0])

        bookings.forEach((booking) => {
        const orderRows = orderTable(
          booking.room_name, booking.room_number, booking.duration, booking.amount,
          booking.is_short_rest, booking.is_half_booking, booking.is_late_checkout
        );
        $("#receipt__booking-tableBody").append(orderRows);
        });

        totalAmountTemplate(subTotal, vat, totalAmount);
      })
      .catch((error) => {
        console.log(error);
      });
    return;
  }

  fetchData(bookingUrl)
    .then(({ booking, checkin_by, checkout_by, customer, room }) => {
      const vat = (7.5 / 100) * booking.amount;
      const subTotal = booking.amount - vat;
      const user = checkout_by ? checkout_by : checkin_by;

      // Render receipt info
      bookingReceiptInfo(customer, user, booking);

      const roomName = room ? room.name : "Deleted Room";
      const roomNumber = room ? room.number : "xxx";

      const orderRows = orderTable(
        roomName, roomNumber, booking.duration, booking.amount,
        booking.is_short_rest, booking.is_half_booking, booking.is_late_checkout
      );
      $("#receipt__booking-tableBody").append(orderRows);

      totalAmountTemplate(subTotal, vat, booking.amount);
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

