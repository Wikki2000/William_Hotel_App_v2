$(document).ready(function () {
  // Open Modal
  $("#dynamic__load-dashboard").on('click', '#openBookingModal', function () {
    $('#bookingTypeModal').css('display', 'block');
  });

  // Close Modal
  $("#dynamic__load-dashboard").on('click', '#cancelBookingModal', function () {
    $('#bookingTypeModal').css('display', 'none');
  });

  // Update description on change
  $("#dynamic__load-dashboard").on('click', '.continue__btn', function () {
    const type = $("#bookingTypeSelect").val();
    const $desc = $('#bookingDescription');

    if (type === 'Reserve') {
      $("#room__url").val("/rooms/all-number");
      $("#booking__preference-title").text("Reservation");
    } else if (type === 'Book') {
      $("#room__url").val("/room-numbers");
      $("#booking__preference-title").text("Booking");
    } else {
      $desc.html('');
    }
    $('#bookingTypeModal').css('display', 'none');
  });


  // Update description on change
  $("#dynamic__load-dashboard").on('change', '#bookingTypeSelect', function () {
    const type = $("#bookingTypeSelect").val();
    const $desc = $('#bookingDescription');

    if (type === 'Reserve') {
      $desc.html("Shows <strong>all rooms</strong>, including those already booked. Good for planning ahead.");
    } else if (type === 'Book') {
      $desc.html("Shows <strong>only available rooms</strong>. Use this for immediate check-in.");
    } else {
      $desc.html('');
    }
  });
});
