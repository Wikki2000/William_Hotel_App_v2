import {
  bookingDuration, ajaxRequest, fetchData,
  getFormDataAsDict, getBaseUrl, britishDateFormat,
} from '../global/utils.js';

$(document).ready(function () {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const bookDataRaw = sessionStorage.getItem("bookData");
  const roomType = sessionStorage.getItem("roomType");

  if (!bookDataRaw) {
    window.location.href = `/guest/rooms/${roomType}/check-availability`;
    return;
  }

  const bookData = JSON.parse(bookDataRaw);

  const checkin = bookData.checkin;
  const checkout = bookData.checkout;

  const amount =  parseFloat(bookData.amount);
  const roomRate = parseFloat(bookData.roomRate);
  let duration = bookingDuration(checkout, checkin)
  duration = duration === 0 ? 1 : duration;
  bookData["duration"] = duration;

  // Prefill your form (assuming these are inputs)
  $("#roomType").val(`${bookData.roomType} - ₦${roomRate.toLocaleString()}`);
  $("#roomCount").val(bookData.requestedRooms);
  $("#checkinDate").val(checkin);
  $("#checkoutDate").val(checkout);
  $("#amount").val(`₦${amount.toLocaleString()}`);

  // Show summary modal on click
  $("#bookingForm").off("submit")
    .on("submit", function (e) {
      e.preventDefault();

      const $form = $(this);
      const data = getFormDataAsDict($form);

      // Fill modal spans
      $("#room").text(`${bookData.roomType} - ₦${roomRate.toLocaleString()}`);
      $("#numRooms").text(bookData.requestedRooms);
      $("#totalAmount").text(amount.toLocaleString());
      $("#guestName").text(data.name);
      $("#guestPhone").text(data.phone);
      $("#guestEmail").text(data.email);
      $("#checkin").text(britishDateFormat(checkin));
      $("#checkout").text(britishDateFormat(checkout));

      const modal = new bootstrap.Modal(document.getElementById("summaryModal"));
      modal.show();

      $("#confirm__booking-btn").off("click").on("click", function() {

	const $button = $(this);
        const url = API_BASE_URL + "/online/booking/initiate-payment";
        const timeout = 15000;
	
	$button.prop("disabled", true);

	bookData["guest_number"] = data["guest_number"]
	delete data["guest_number"]

        ajaxRequest(url, "POST", JSON.stringify({ booking_data: bookData, guest_data: data }),
          function (response) {
            $button.prop("disabled", false);
	    sessionStorage.removeItem("bookData");
            window.location.href = response.checkout_url;
          },
          function (error) {
	    $button.prop("disabled", false);
            console.log(error);
            alert("Something went wrong. Please try again later");
          },
          timeout
        );
      });
    });
});
