import {
  ajaxRequest, getBaseUrl, validateForm, getFormDataAsDict,
  confirmationModal, displayMenuList, showNotification, fetchData,
  previewImageAndReurnBase64, britishDateFormat, togleTableMenuIcon,
  bookingDuration, canadianDateFormat, closeConfirmationModal
} from '../global/utils.js';
import { displayRoomData, roomTableTemplate } from '../global/templates.js';
import {
  bookingServiceListTableTemplate, orderHistoryTableTemplate
} from '../global/templates1.js';

$(document).ready(function () {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  const USER_ROLE = localStorage.getItem('role');

  const roomUrl =  API_BASE_URL + '/rooms'

  // Switch dashboard sections of rooms and services
  $('#dynamic__load-dashboard')
    .on('click', '#rooms, #add-room, #services, .editRoomIcon', function() {
      const $clickItem = $(this);
      const clickId = $(this).attr('id');

      // Remove highlight class from sibling and add it to the clicked element
      $('#rooms').removeClass('highlight-btn');
      $('#services').removeClass('highlight-btn');
      $('#add-room').removeClass('highlight-btn');

      $('#services-section').hide();
      $('#rooms-section').hide();
      $('#add__new-room--section').hide();

      // Toggle visibility of sections
      if (clickId === 'rooms') {
        $('#rooms-section').show();
        $('#rooms').addClass('highlight-btn');


        // Always highlight the "all" filter.
        const $roomsFilterId = $(
          '#all__rooms, #rooms__occupied, #rooms__available, #rooms__reserved'
        );
        $roomsFilterId.removeClass('highlight-btn');
        $('#all__rooms').addClass('highlight-btn');

      }
      else if (clickId === 'services') {
        $('#services-section').show();
        $('#services').addClass('highlight-btn');
        $('#room__check-out').addClass('highlight-btn');
      } else if (
        clickId === 'add-room' || $clickItem.hasClass('editRoomIcon')
      ) {
        // Populate the imput field for editing
        if ($clickItem.hasClass('editRoomIcon')) {
          const roomId = $clickItem.data('id');
          const roomUrl = API_BASE_URL + `/rooms/${roomId}/room-data`;
          fetchData(roomUrl)
            .then(({ id, name, number, amount, image, image_path }) => {
              const imageSrc = (
                image ? 'data:image/;base64, ' + image : image_path
              );
              $('#add__new-room').attr('src', imageSrc);
              $('input[name="name"]').val(name);
              $('input[name="number"]').val(number);
              $('input[name="amount"]').val(amount);

              // Store room id in hidden input form field
              $('#room__id').val(id);

              // Add flag to indicate it's to edit room.
              // This because both edit and add room share same pages.
              $('#new__room-form').addClass('room__edit-form');
              $('#new__room-form').removeClass('room__add-form');

              $('input[name="number"]').attr('readonly', true);
              $('#room__action-edit--add').text('Edit Room');
            })
            .catch((error) => {
              console.log(error);
            });
        } else {
          $('input[name="number"]').attr('readonly', false);
          $('#new__room-form').addClass('room__add-form');
          $('#new__room-form').removeClass('room__edit-form');

          // Reset form for adding new room
          $('#new__room-form').trigger('reset');
          $('#add__new-room').attr(
            'src', '/static/images/public/profile_photo_placeholder.png'
          );

          $('#room__action-edit--add').text('Add Room');
        }
        $('#add__new-room--section').show();
        $('#add-room').addClass('highlight-btn');
      }
    });

  /*=============================================================
                        Room Section
   ============================================================*/

  // Filter rooms according to status
  $('#dynamic__load-dashboard').on(
    'click',
    '#all__rooms, #rooms__available, #rooms, #rooms__occupied, #rooms__reserved, #main__room-available--view', 
    function() {
      const $tableBody = $(".room-table-body");
      const $clickItem = $(this);
      const clickId = $(this).attr('id');

      $tableBody.empty(); // Clear table before loading new data

      // Remove highlight class from sibling and add it to the clicked element
      $clickItem.siblings().removeClass('highlight-btn');
      $clickItem.addClass('highlight-btn');

      const isStaff = USER_ROLE === 'staff' ? true: false;
      switch (clickId) {
        case 'all__rooms': 
        case 'rooms': {
          fetchData(roomUrl)
          .then(({ rooms, rooms_count }) => {
            displayRoomData(rooms, isStaff);
          })
          .catch((error) => {
            console.error('Failed to fetch room data:', error);
          });

          break;
        }
        case 'rooms__available': {
          const availableRoomsUrl = API_BASE_URL + '/rooms/available/filter'; 
          fetchData(availableRoomsUrl)
          .then((rooms) => {
            rooms.forEach((room) => {
              const statusClass = 'room-status-4';
              const roomStatusText = 'Available';
              $tableBody
                .append(roomTableTemplate(room, statusClass, isStaff, roomStatusText));
            });
          })
          .catch((error) => {
            console.error('Failed to fetch room data:', error);
          });

          break;
        }
        case 'rooms__occupied': {
          const occupiedRoomsUrl = API_BASE_URL + '/rooms/occupied/filter';
          fetchData(occupiedRoomsUrl)
          .then((rooms) => {
            rooms.forEach((rooms) => {
              const statusClass = 'room-status';
              const roomStatusText = 'Occupied';
              $tableBody
                .append(roomTableTemplate(rooms, statusClass, isStaff, roomStatusText));
            });
          })
          .catch((error) => {
            console.error('Failed to fetch room data:', error);
          });
          break;
        }
        case 'rooms__reserved': {
          const reservedRoomsUrl = API_BASE_URL + '/rooms/reserved/filter'; 
          fetchData(reservedRoomsUrl)
          .then((rooms) => {
            rooms.forEach((room) => {
              const statusClass = 'room-status-3';
              const roomStatusText = 'Reserved';
              $tableBody
                .append(roomTableTemplate(room, statusClass, isStaff, roomStatusText));
            });
          })
          .catch((error) => {
            console.error('Failed to fetch room data:', error);
          });
          break;
        }
      }
    });

  $('#dynamic__load-dashboard').on(
    'click', '.room__edit-icon', function() {
      $('#room__image-fileInput').click();

      const imgElemet = $('#add__new-room');
      const inputElement = $('room__image-fileInput');
      previewImageAndReurnBase64(inputElement, imgElemet)
        .then((data) => {
          $('input[name="image"]').val(data);
        })
        .catch((error) => {
        });
    });

  // Handle submission of form for adding/editing room.
  $('#dynamic__load-dashboard').on(
    'submit', '#new__room-form', function(e) {
      e.preventDefault();
      const $formElement = $(this);
      const data = JSON.stringify(getFormDataAsDict($formElement));

      const roomId = $('#room__id').val();
      const roomNumber = $('input[name="number"]').val();

      const addRoomUrl =  API_BASE_URL + '/rooms';
      const editRoomUrl = API_BASE_URL + `/rooms/${roomId}/edit`
      const editRoomMsg = `Room ${roomNumber} Updated Successfully !`;
      const addRoomMsg = `Room ${roomNumber} Added Successfully !`;

      $('#room__add-new').prop('disable', true);

      const request = (
        $formElement.hasClass('room__edit-form') ?
        { method: 'PUT', url: editRoomUrl, msg: editRoomMsg } :
        { method: 'POST', url: addRoomUrl, msg: addRoomMsg }
      );
      ajaxRequest(request.url, request.method, data,
        (response) => {
          $('#room__add-new').prop('disable', true);
          showNotification(request.msg);
        },
        (error) => {
          $('#room__add-new').prop('disable', true);
          if (error.status === 409) {
            showNotification(error.responseJSON.error, true);
            return;
          }
          showNotification('Error occur adding room. Try again !', true);
        }
      );
    });


  // Delete a room.
  $('#dynamic__load-dashboard').on('click', '.deleteRoomIcon', function() {
    const $clickItem = $(this);
    const roomId = $clickItem.data('id');
    const deleteRoomUrl =  API_BASE_URL + `/rooms/${roomId}/delete`;

    // Prevent room deletion tiil updating database not to cascade delete.
    alert(
      "You can't delete a Room at this moment. Thie section under maintainence!"
    );
    return;
    // Load confirmation modal
    const headingText = 'Confirm Delete';
    const descriptionText = 'This action cannot be undone !'
    const confirmBtCls = 'deleteRoom';

    confirmationModal(headingText, descriptionText, confirmBtCls);

    $('#dynamic__load-dashboard').off('click', '.deleteRoom')
      .on('click', '.deleteRoom', function() {

        $clickItem.prop('disable', true);
        ajaxRequest(deleteRoomUrl, 'DELETE', null,
          (response) => {
            $clickItem.prop('disable', false);
            $('#order__confirmation-modal').empty();
            showNotification(`Room ${response.number} Delete Successfully !`);
            $(`#room-table-body tr[data-id="${roomId}"]`).remove();
          },
          (error) => {
            $clickItem.prop('disable', false);
            showNotification('An error occured. Try again !');
          }
        );
      });
  });

  /*=============================================================
                       Service Section
  ==============================================================*/
  $('#dynamic__load-dashboard').on(
    'click', '#room__number-dropdown-btn', function() {
      const occupiedRoomUrl = API_BASE_URL + '/occupied-room-number';
      fetchData(occupiedRoomUrl)
        .then((rooms) => {
          if (!rooms) {
            const msg = 'No room lodge at the moment !';
            showNotification(msg);
          }
          const occupiedNumberList = rooms;
          displayMenuList(
            occupiedNumberList, $($(this)), 'room__menu'
          );
        })
        .catch((error)  => {
          console.log(error);
        });
    });

  // Filter service list base on payment status.
  $('#dynamic__load-dashboard')
    .off('click', '.service__filter-btn')
    .on('click', '.service__filter-btn', function() {
      const $clickItem = $(this);
      const clickItemId = $clickItem.attr('id');
      const bookingId = $('#booking__id').val();
      const customerId = $('#guest__lodged-id').val();

      $clickItem.siblings().removeClass('highlight-btn');
      $clickItem.addClass('highlight-btn');

      $('.order__history--table-body').empty();

      let url;
      if (clickItemId === 'servicelist__all--btn') {
        url = (
          API_BASE_URL + `/guests/${customerId}/${bookingId}/all/service-list`
        );
      } else if (clickItemId === 'servicelist__pending--btn') {
        url = (
          API_BASE_URL + `/guests/${customerId}/${bookingId}/pending/service-list`
        );
      } else if (clickItemId === 'servicelist__paid--btn') {
        url = (
          API_BASE_URL + `/guests/${customerId}/${bookingId}/paid/service-list`
        );
      }

      fetchData(url)
        .then(({ bookings, orders, bookings_amount, orders_amount }) => {
          if(bookings) {
            bookings.forEach((booking) => {
              const date = britishDateFormat(booking.created_at);
              $('.order__history--table-body').append(
                bookingServiceListTableTemplate(booking, date)
              );
            });
          }

          if(orders) {
            orders.forEach((order) => {
              const date = britishDateFormat(order.created_at);
              $('.order__history--table-body').append(
                orderHistoryTableTemplate(order, date)
              );
            });
          }

          const totalAmount = bookings_amount + orders_amount;

          if (!isNaN(totalAmount)) {
            $('#total__service-charge--amount')
              .text(`₦${totalAmount.toLocaleString()}`);
          } else {
            $('#service__dollar-sign').text('');
            $('#total__service-charge--amount').text('');
          }
        })
        .catch((error) => {
          console.log(error);
        });
    })

  // Load the service list of a room.
  $('#dynamic__load-dashboard').off('click', '.room__menu')
    .on('click', '.room__menu', function() {
      const $clickItem = $(this);
      const roomNumber =  $clickItem.text();

      $('#room__number-dropdown').hide();

      // Highligt the all button when select room number.
      $('.service__filter-btn').removeClass('highlight-btn');
      $('#servicelist__all--btn.service__filter-btn').addClass('highlight-btn');

      const selectedRoomUrl =  (
        API_BASE_URL + `/rooms/${roomNumber}/booking-data`
      );
      fetchData(selectedRoomUrl)
        .then(( { room, user, customer, booking }) => {
          $clickItem.closest('.room__dropdown').find('span').text(roomNumber);
          $('#room__type').val(room.name);
          $('#room__occupant-name').val(customer.name);
          $('#room__amount-rate').val('₦' + room.amount.toLocaleString());

          // Store in hidden input field to be use further..
          $('#booking__id').val(booking.id);
          $('#guest__lodged-room--id').val(room.id);
          $('#guest__lodged-id').val(customer.id);
          $('#room__price-val').val(room.amount);
          $('#guest__occupant-no').val(booking.guest_number);

          // Auto fill the form input to extend stay checkin date.
          $('input[name="checkin"]')
            .val(canadianDateFormat(new Date()));

          const orderUrl = (
            API_BASE_URL + `/guests/${customer.id}/${booking.id}/all/service-list`
          );
          fetchData(orderUrl)
            .then(({ bookings, orders, bookings_amount, orders_amount }) => {
              $('.order__history--table-body').empty();

              if(bookings) {
                bookings.forEach((booking) => {
                  const date = britishDateFormat(booking.created_at);
                  $('.order__history--table-body').append(
                    bookingServiceListTableTemplate(booking, date)
                  );
                });
              }

              if(orders) {
                orders.forEach((order) => {
                  const date = britishDateFormat(order.created_at);
                  $('.order__history--table-body').append(
                    orderHistoryTableTemplate(order, date)
                  );
                });
              }

              const totalAmount = bookings_amount + orders_amount;

              $('#total__service-charge--amount').text(totalAmount.toLocaleString());
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
        });

      // Load confirmation modal for checkout
      $('#dynamic__load-dashboard').off('click', '#room__checkout-btn')
        .on('click', '#room__checkout-btn', function() {
          const roomNumber = $('#room__number-dropdown-btn span').text();
          if (isNaN(roomNumber)) {
            showNotification('Error ! No room number selected.', true);
            return
          }

          // Load confirmation modal
          const headingText = 'Confirm Checkout';
          const descriptionText = 'This action cannot be undone !'
          const confirmBtCls = 'room__checkout-btn';

          confirmationModal(headingText, descriptionText, confirmBtCls);
        });
      // Checkout guest in a room
      $('#dynamic__load-dashboard').off('click', '.room__checkout-btn')
        .on('click', '.room__checkout-btn', function() {
          const roomNumber = $('#room__number-dropdown-btn span').text();
          const bookingId = $('#booking__id').val();

          // Retrieved from hidden input field.
          const guestId = $('#guest__lodged-id').val();
          const roomId = $('#guest__lodged-room--id').val();
          const checkoutUrl = (
            API_BASE_URL + `/rooms/${roomId}/customer/${guestId}/checkout`
          );

          const $button = $(this);
          $button.prop('disable', true);

          ajaxRequest(checkoutUrl, 'PUT', null,
            (response) => {
              $('#order__confirmation-modal').empty();
              $button.prop('disable', false);
              showNotification(`Guest successfully checkout from room ${roomNumber}`);
            },
            (error) => {
              if (error.status === 409) {
                showNotification(error.responseJSON.error, true);
                $('#order__confirmation-modal').empty();
                return;
              }
              $button.prop('disable', false);
              $('#order__confirmation-modal').empty();
              showNotification('An error checking out guest. Try Again !', true);
            }
          );
        });
    });

  // Handler for clicking Extend Guest Stay & Late Checkout..
  $('#dynamic__load-dashboard')
    .off('click', '#guest__extend-stay, #late__checkout, #half__day-booking')
    .on('click', '#guest__extend-stay, #late__checkout, #half__day-booking',
      function() {

        const $clickItem = $(this);
        const clickId = $clickItem.attr('id');

        const roomNumber = $('#room__number-dropdown-btn').text();
        if (isNaN(roomNumber)) {
          showNotification('No room number selected.', true);
          return;
        }

        // Reset the hidden field for instant payment type,
        // Once click on extend stay or late checkout.
        $('#guest__ispaid-menu--selected').val('');
        $('#late__checkout-ispaid span').text('Selected');
        $('#guest__paymentMethod-menu--selected').val(''); 
	$('#late__checkout-payMethod span').text('Selected');
        /*
      $clickItem.addClass('highlight-btn');
      $clickItem.siblings().removeClass('highlight-btn');
      */

        if (clickId  === 'guest__extend-stay') {
          $('#guest__extend-stay--modal').css('display', 'flex');
        } else if (clickId  === 'late__checkout') {
          const roomNumber = $('#room__number-dropdown-btn span').text();
          $('#booking__extension-room').text(roomNumber);
          $('#booking__extension-duration').text(`${LATE_CHECK_OUT_DURATION} Hours`);
          $('#booking__extension-amoumt').text(LATE_CHECK_OUT_AMOUNT.toLocaleString());
          $('#booking__extension-title').text('Late Checkout Extension Booking');
          $('#late__checkout-popup--modal').css('display', 'flex');

          $('#store__typeof-extension').val('lateCheckoutBooking');
        } else if (clickId  === 'half__day-booking') {
          const roomAmount = parseFloat(
            $('#room__amount-rate').val().replaceAll('₦', '').replaceAll(',', '')
          );
          const halfDayBookingAmount = roomAmount  / 2;
          $('#booking__extension-room').text(roomNumber);
          $('#booking__extension-duration').text('half a day'); 
          $('#booking__extension-amoumt').text(halfDayBookingAmount.toLocaleString());
          $('#booking__extension-title').text('Half Day Extension Booking');
          $('#late__checkout-popup--modal').css('display', 'flex');

          $('#store__typeof-extension').val('halfDayBooking');
        }
      });

  // Toggle menu for payment status menu and pay method menu.
  $('#dynamic__load-dashboard')
    .off('click', '#guest__ispaid, #late__checkout-ispaid, #late__checkout-payMethod, #guest__extendday-payMethod')
    .on('click', '#guest__ispaid, #late__checkout-ispaid, #late__checkout-payMethod, #guest__extendday-payMethod', function() {

      const $clickItem = $(this);
      const clickItemId = $clickItem.attr('id');

      if (clickItemId === 'guest__ispaid') {
        $('#guest__ispaid-dropdown').toggle();
      } else if (clickItemId === 'late__checkout-ispaid') {
        $('#late__checkout-ispaid--dropdown').toggle();
      } else if (clickItemId === 'late__checkout-payMethod') { 
        $('#late__checkout-payMethod--dropdown').toggle();
      } else if (clickItemId === 'guest__extendday-payMethod') {
        $('#guest__extendday-payMethod--dropdown').toggle();
      }
    });

  // Retrieve value of payment status menu selected.
  $('#dynamic__load-dashboard')
    .off('click', '.guest__dropdown-selector, .latecheckout__dropdown-selector')
    .on('click', '.guest__dropdown-selector, .latecheckout__dropdown-selector',
      function() {
        const $clickItem = $(this);
        const selectedOption = $clickItem.text();

        if ($clickItem.hasClass('guest__dropdown-selector')) {
          $('#guest__ispaid span').text(selectedOption);
          $('#guest__ispaid-dropdown').hide();
        } else if (
          $clickItem.hasClass('latecheckout__dropdown-selector')
        ) {
          $('#late__checkout-ispaid span').text(selectedOption);
          $('#late__checkout-ispaid--dropdown').hide();
        }
        $('#guest__ispaid-menu--selected').val(selectedOption.toLowerCase());
      });


  // Retrieve value of payment method menu selected.
  $('#dynamic__load-dashboard')
    .off('click', '.guest__payMethod-selector, .latecheckout__payMethod-dropdown-selector')
    .on('click', '.guest__payMethod-selector, .latecheckout__payMethod-dropdown-selector',
      function() {                                    
        const $clickItem = $(this);  
        const selectedOption = $clickItem.text();

        if ($clickItem.hasClass('guest__payMethod-selector')) {
          $('#guest__extendday-payMethod span').text(selectedOption);
	  $('#guest__extendday-payMethod--dropdown').hide();
        } else if (
	  $clickItem.hasClass('latecheckout__payMethod-dropdown-selector')
	) {      
          $('#late__checkout-payMethod span').text(selectedOption);
	  $('#late__checkout-payMethod--dropdown').hide(); 
        }       
        $('#guest__paymentMethod-menu--selected').val(selectedOption);
      });



  $('#dynamic__load-dashboard')
    .on('input', '#guest__extend-stay--modal input[name="checkout"]',
      function() {
        const checkin = $('input[name="checkin"]').val();
        const checkout = $('input[name="checkout"]').val();

        function reset_value() {
          $('#guest__extend-stay--modal input[name="checkout"]').val('');
          $('#guest__extend-stay--modal #count__nights').val('');
        }

        if (!checkin) {
          showNotification('Please enter checkin date', true);
          reset_value();
          return;
        } else if (new Date(checkout) <= new Date(checkin) && checkin) {
          reset_value();
          showNotification(
            'Check Out date must not be earlier than Check In date', true
          )
          return;
        } else {
          const duration = bookingDuration(checkout, checkin);
          $('#guest__extend-stay--modal #count__nights')
            .val(`${duration} Night(s)`);
        }
      });

  // Form to handle submission to extend guest stay in a room.
  $('#dynamic__load-dashboard').off('submit', '#guest__extend-stay--form')
    .on('submit', '#guest__extend-stay--form', function(e) {

      e.preventDefault();

      const $formElement = $(this);

      const headingText = 'Confirm New Booking';
      const descriptionText = 'This action cannot be undone !'
      const confirmBtCls = 'guest__extend-stay--confirm';

      // Validate that required fields are entered correctly.
      const checkin = $('input[name="checkin"]').val();
      const checkout = $('input[name="checkout"]').val();

      if (new Date(checkout) <= new Date(checkin)) {
        showNotification(
          'Check Out date must not be earlier than Check In date', true
        );
        return;
      } else if (!$('#guest__ispaid-menu--selected').val()) {
        const msg = (
          'Please select an option for Instant Payment'
        );
        showNotification(msg, true);
        return;
      } else if (!$('#guest__paymentMethod-menu--selected').val()) {
        const msg = (
          'Please select an option for Payment Type' 
        );
        showNotification(msg, true); 
        return;
      }
      confirmationModal(headingText, descriptionText, confirmBtCls);
    });

  // Confirm handler to extend guest stay by certain duration.
  $('#dynamic__load-dashboard')
    .off('click', '.guest__extend-stay--confirm, .confirm__late-checkout--btn')
    .on('click', '.guest__extend-stay--confirm, .confirm__late-checkout--btn',
      function() {
        const $clickItem = $(this);
        const customerId = $('#guest__lodged-id').val();
        const roomId = $('#guest__lodged-room--id').val();

        let checkin = $('input[name="checkin"]').val();
        let checkout = $('input[name="checkout"]').val();
        const guest_number = $('#guest__occupant-no').val();
        const is_paid = $('#guest__ispaid-menu--selected').val();
        const payment_type = $('#guest__paymentMethod-menu--selected').val();
        const $button = $(this);

        const url = (
          API_BASE_URL + `/guests/${customerId}/rooms/${roomId}/extend-stay`
        );

        closeConfirmationModal();

        if (!is_paid) {
          const msg = (
            'Please select an option for Instant Payment'
          );
          showNotification(msg, true);
          return;
        }

        let duration, amount, is_late_checkout, is_half_booking;
        if ($clickItem.hasClass('guest__extend-stay--confirm')) {

          duration = bookingDuration(checkout, checkin); 
          is_late_checkout = false;

          // Get total amount of room book base on night durations.
          const roomRate = $('#room__price-val').val();
          amount = duration * roomRate;

          $('#guest__extend-stay--modal').hide();
          $('#guest__ispaid span').text('Select');
        } else if ($clickItem.hasClass('confirm__late-checkout--btn')) {

          const extensionBookingType = $('#store__typeof-extension').val();
          $('#late__checkout-popup--modal').hide();

          if (extensionBookingType === 'lateCheckoutBooking') {
            is_late_checkout = true;
            amount = LATE_CHECK_OUT_AMOUNT;
            duration = LATE_CHECK_OUT_DURATION;
            checkout = checkin = canadianDateFormat(new Date());
          } else if (extensionBookingType === 'halfDayBooking') {
            const roomRate = $('#room__price-val').val();
            amount = roomRate / 2;
            checkout = checkin = canadianDateFormat(new Date());
            is_half_booking = true;
            duration = 6;
          }
        }

        const BookingData = {
          duration, guest_number, amount, is_half_booking,
          is_paid, checkin, checkout, is_late_checkout, payment_type
        };

        ajaxRequest(url, 'POST', JSON.stringify(BookingData),
          (response) => {
            $button.prop('disable', false);

            $('#guest__extend-stay--form').trigger('reset');
            $('#guest__extend-stay--form input[name="checkin"]')
              .val(canadianDateFormat(new Date()));
            const timeFrame = response.is_late_checkout || response.is_half_booking ? 'Hours' : 'Night(s)';

            const msg = (
              `Duration of guest extended by ${duration} ${timeFrame}`
            );
            showNotification(msg);

            // Update the total service charge when new booking is made.
            const previousServiceCharge = parseFloat(
              $('#total__service-charge--amount').text().replaceAll(',','')
            );
            const updatedAmt = previousServiceCharge + amount;
            $('#total__service-charge--amount').text(updatedAmt.toLocaleString());

            const date = britishDateFormat(response.created_at);
            $('.order__history--table-body').prepend(
              bookingServiceListTableTemplate(response, date)
            );

            // Print receipt immediately room is book.
            const bookingId = response.id;
            const receiptUrl = (
              APP_BASE_URL + `/bookings/print-receipt?booking_id=${bookingId}`
            );
            window.open(receiptUrl, '_blank');
          },
          (error) => {
            $button.prop('disable', false);
            if (error.status === 409) {
              showNotification('Error! ' +  error.responseJSON.error, true);
            } else if (error.status === 422) {
              showNotification('Error! ' +  error.responseJSON.error, true);
            } else {
              showNotification('An Error occured. Try Again !', true);
            }
          }
        );
      });

  // Togle visibility of service list.
  $('#dynamic__load-dashboard')
    .on('click', '#show__service--list--btn', function() {

      const roomNumber = $('#room__number-dropdown-btn span').text();

      if (isNaN(roomNumber)) {
        showNotification('No room number selected.', true);
        return;
      }

      $('#service___list-orders').toggle();
      $('#show__service--list--btn')
        .toggleClass('rotate__270degree-clockwise');
    });

  // Clear guest room book bill
  $('#dynamic__load-dashboard')
    .off('click', '.service__clear-room-bill')
    .on('click', '.service__clear-room-bill', function() {
      const bookId = $(this).data('id');
      const headingText = 'Confirm Clearing Bill';
      const descriptionText = 'This action cannot be undone !'
      const confirmBtCls = 'service__clear-room-billConfirm';
      confirmationModal(headingText, descriptionText, confirmBtCls);

      togleTableMenuIcon();

      $('#dynamic__load-dashboard')
        .off('click', '.service__clear-room-billConfirm')
        .on('click', '.service__clear-room-billConfirm', function() {

          $('#order__confirmation-modal').empty();

          const url = API_BASE_URL + `/bookings/${bookId}/clear_bill`;
          ajaxRequest(url, 'PUT', null,
            (response) => {
              const msg = 'Guest Room Booking Bill Cleared Successfully!'
              showNotification(msg);
              $(`.order__history--table-body tr[data-id="${bookId}"] .booking__bill-status`).css('color', 'green');
              $(`.order__history--table-body tr[data-id="${bookId}"] .booking__bill-status`).text('Paid');
            },
            (error) => {
              if (error.status === 409) {
                showNotification(error.responseJSON.error, true);
                return;
              }
              showNotification('An occured while clearing booking bill. Please try Again !', true);
              console.log(error);
            }
          );
        });
    });
});
