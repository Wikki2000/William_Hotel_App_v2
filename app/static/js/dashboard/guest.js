import {
  ajaxRequest, britishDateFormat, fetchData, getBaseUrl, canadianDateFormat,
  confirmationModal, showNotification, validateForm, displayMenuList,
  bookingDuration, getFormattedTime, closeConfirmationModal,
} from '../global/utils.js';
import { loadUpdatePaymentTemplate, guestListTableTemplate }  from '../global/templates.js';

$(document).ready(() => {

  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');
  let SHORT_REST_OPTION, IS_LATE_CHECKOUT, IS_HALF_DAY;

  const $modal = $("#guestModal");

  $('#dynamic__load-dashboard').on('click', '.guest__listMenu', function() {
    const $clickItem = $(this);
    const clickItemId = $clickItem.data('id');

    // Toggle visibility of icon to show and cancel table menu
    $clickItem.closest('td').siblings().find('.fa.fa-times').hide();
    $clickItem.closest('td').siblings().find('.fa.fa-ellipsis-v').show();

    $clickItem.closest('.manage').hide(); // Hide table menu once selected

    // Show popup for Booking Details
    if ($clickItem.hasClass('guest__list-bookDetail')) {
      $('#guest__popupModal').css('display', 'flex');

      $('#guest__info').empty();
      const bookingUrl = (
        API_BASE_URL +  `/bookings/${clickItemId}/booking-details`
      );
      fetchData(bookingUrl)
        .then(
          ( { booking, customer, room, checkin_by, checkout_by }
          ) => {
            let time, hide, bookingType;


            const hideCheckOutBy = (
              booking.is_use || booking.is_reserve ? 'none' : ''
            );
	    const checkInReserveByText = (
              booking.is_reserve ? "Reserve By" : "Checkin By"
            );

            if (booking.is_short_rest) {
              bookingType = 'Short Tiime';
              time = 'Hours';
              hide = 'none';
            } else if (booking.is_late_checkout) {
              bookingType = 'Late Checkout';
              time = 'Hours';
              hide = 'none';
            } else if (booking.is_half_booking) {
              bookingType = 'Half Day';
              time = 'Hours';
              hide = 'none';
            } else{
              bookingType = 'Full Tiime';
              time = 'Night(s)';
              hide = '';
            }
            const paymentStatus = (
              booking.is_paid === 'yes' ? { status: 'Paid', color: 'green' } :
              {status: 'Pending', color: 'red' }
            );
            const checkout_staff = (
              checkout_by ? {
                first_name: checkout_by.first_name, 
                last_name: checkout_by.last_name,
                portfolio: checkout_by.portfolio
              } :
              {
                first_name: checkin_by.first_name,
                last_name: checkin_by.last_name,
                portfolio: checkin_by.portfolio
              }
            );

            $('#guest__info').append(
              `<h3></h3>
             <p><b>Guest Name</b> ${customer.name}</p>
             <p><b>Guest ID Type</b> ${customer.id_type}</p>
             <p><b>Guest ID Number</b> ${customer.id_number}</p>
             <p><b>Guest Number</b> ${customer.phone}</p>
             <p><b>Guest Address</b> ${customer.address}</p>
             <p><b>Guest Gender</b> ${customer.gender}</p>
             <p><b>Guest Email</b> ${customer.email}</p>
             <p><b>Booking Time</b> ${getFormattedTime(booking.created_at)}</p>
             <p><b>Checkin Date</b> ${britishDateFormat(booking.checkin)}</p>
             <p><b>Booking Type</b> ${bookingType}</p>
             <p><b>Expiration Duration</b> ${booking.duration} ${time}</p>
             <p><b>Check out Date</b> ${britishDateFormat(booking.checkout)}</p>
             <p><b>Date Book</b> ${britishDateFormat(booking.created_at)}</p>
             <p><b>Payment Status</b> <span style="color: ${paymentStatus.color};">${paymentStatus.status}</span></p>
             <p style="display: ${hide};"><b>Room(${room.number}) Rate</b> ₦${room.amount.toLocaleString()}</p>
             <p><b>Booking Amount</b> ₦${booking.amount.toLocaleString()}</p>
              <p><b>${checkInReserveByText}</b> ${checkin_by.first_name} ${checkin_by.last_name} (${checkin_by.portfolio})</p>
              <p style="display: ${hideCheckOutBy}"><b>Checkout  By</b> ${checkout_staff.first_name} ${checkout_staff.last_name} (${checkout_staff.portfolio})</p>`
            );
            $('#room__totalAmount')
              .text('₦' + booking.amount.toLocaleString());
            $('#booking__print-receipt').attr('data-id', `${booking.id}`);
          })
        .catch((error) => {
          console.log(error);
        });

      // Select/Update booking sataus
    } else if ($clickItem.hasClass('guest__list-bookReserve')) {
      const bookOrReserve = $clickItem.find('.bookingReserveOption').val();

      if (bookOrReserve === 'reserve') {
        const confirmBtCls = 'booking__update-status---btn';
        const headingText = 'Updating of Booking Status';
        const descriptionText = 'You are about to check a reserved guest in. This action cannot be undone !'
        confirmationModal(headingText, descriptionText, confirmBtCls);

        $('#dynamic__load-dashboard').
          off('click', '.booking__update-status---btn')
          .on('click', '.booking__update-status---btn', function() {
            const bookingUpdateUrl = API_BASE_URL + `/bookings/${clickItemId}/update-reservation-status`;

            const roomNumber = $(`tr[data-id="${clickItemId}"] .room-number-1`)
              .text().replaceAll('#', '');
            closeConfirmationModal();

            ajaxRequest(bookingUpdateUrl, 'PUT', null,
              (response) => {
                $(`tr[data-id="${clickItemId}"] .guest__list-bookReserve span`).text('Select Room');
                $(`tr[data-id="${clickItemId}"] .guest__list-bookReserve i`).removeClass('fa fa-sign-in-alt');
                $(`tr[data-id="${clickItemId}"] .guest__list-bookReserve i`).addClass('fa fa-user');
                $(`tr[data-id="${clickItemId}"] .guest__list-bookReserve .bookingReserveOption`).val('book')

                $(`tr[data-id="${clickItemId}"] .booking-status`).text('Booked');
                $(`tr[data-id="${clickItemId}"] .booking-status`).css('color', 'green');

                showNotification(`Guest Successfully Check-in to Room ${roomNumber}`);
              },
              (error) => {
                if (error.status === 422) {
                  showNotification('Error! ' +  error.responseJSON.error, true);
                  return;
                }
                showNotification('An error: Try Again !', true);
                console.log(error);
              }
            );
          });
      } else if (bookOrReserve === 'book') {
        const bookingUrl = API_BASE_URL + `/bookings/${clickItemId}/booking-details`
        fetchData(bookingUrl)
          .then(({ customer }) => {
            // Set the guest data in session, which is use to
            // Auto-fill booking form during booking.
            sessionStorage.setItem('guestData', JSON.stringify(customer));
            location.reload();
          })
          .catch((error) => {
            console.log(error);
          });
      }
      // Cancel Reservation 
    } else if (
      $clickItem.hasClass('guest__listDelete') || 
      $clickItem.hasClass('guest__listRemove')
    ) {
      const headingText = 'Confirm Removal of Reservation';
      const descriptionText = 'This action cannot be undone !'
      const confirmBtCls = 'reservation__delete-confirmBtn';

      confirmationModal(headingText, descriptionText, confirmBtCls);

      $('#dynamic__load-dashboard').off('click', '.reservation__delete-confirmBtn')
        .on('click', '.reservation__delete-confirmBtn', function() {
          const cancelReservationUrl = API_BASE_URL + `/bookings/${clickItemId}/delete`;
          const text = $clickItem.hasClass('guest__listRemove') ? 'Booking' : 'Reservation';

          $('#order__confirmation-modal').empty();

          ajaxRequest(cancelReservationUrl, 'DELETE', null,
            (response) => {
              $(`tr[data-id="${clickItemId}"]`).remove();
              showNotification(`${text} Deleted successfully !`);
            },
            (error) => {
              console.log(error);
            }
          );
        });

      // Edit Guest details
    } else if ($clickItem.hasClass('guest__listPaymethod')) {
      const paymentMethod = $clickItem.data('payment-type');
      loadUpdatePaymentTemplate(paymentMethod, clickItemId);  // Template for updating payment status.
    } else if ($clickItem.hasClass('guest__listEdit')) {
      const guestEditUrl = APP_BASE_URL + '/pages/guest_input';
      $('#dynamic__load-dashboard').load(guestEditUrl, function() {
        const bookingUrl = (
          API_BASE_URL +  `/bookings/${clickItemId}/booking-details`
        );
        fetchData(bookingUrl)
          .then(({ booking, customer, room }) => {

            let bookingType;
            if (booking.is_short_rest) {
              bookingType = 'Short Time';
              $('#guest__checkout-container, #guest__checkin-container').addClass('hide');
              $('#guest__night-count').val(`${SHORT_TIME_DURATION} Hours`);

              SHORT_REST_OPTION = true;
              IS_LATE_CHECKOUT = IS_HALF_DAY = false;
            } else if (booking.is_late_checkout) {
              bookingType = 'Late Checkout';
              $('#guest__checkout-container, #guest__checkin-container').addClass('hide');
              $('#guest__night-count').val(`${LATE_CHECK_OUT_DURATION} Hours`);

              IS_LATE_CHECKOUT = true;
              SHORT_REST_OPTION = IS_HALF_DAY = false;
            } else if (booking.is_half_booking) {
              bookingType = 'Half Day';
              $('#guest__checkout-container, #guest__checkin-container').addClass('hide');
              $('#guest__night-count').val(`${HALF_DAY_DURATION} Hours`);

              IS_HALF_DAY = true;
              SHORT_REST_OPTION = IS_LATE_CHECKOUT = false;
            } else {
              $('#guest__checkout-container, #guest__checkin-container').removeClass('hide');
              bookingType = 'Full Time';
              const duration = bookingDuration(booking.checkout, booking.checkin);
              $('#guest__night-count').val(`${duration} Night(s)`);
            }

            const is_early_checkin = booking.is_early_checkin ? 'yes' : 'no';

            $('#guest__booking-type span').text(bookingType);
            $('#guest__checkinDate').val(canadianDateFormat(booking.checkin));
            $('#guest__checkout').val(canadianDateFormat(booking.checkout));
            $('#guest__roomNumber').val(room.number);
            $('#guest__roomType').val(room.name);
            $('#guest__roomAmount').val('₦' + booking.amount.toLocaleString());
            $('#guest__name').val(customer.name);
            $('#guest__phoneNumber').val(customer.phone);
            $('#guest-idType span').text(customer.id_type);
            $('#guest__idNumber').val(customer.id_number);
            $('#guest-gender span').text(customer.gender);
            $('#guest__numberOccupant').val(booking.guest_number);
            $('#guest__address').val(customer.address);

            $('#guest__room-number-menu').text(room.number);
            $('#guest__room-number').val(room.number);

            $('#guest__genderValue').val(customer.gender);
            $('#guest__idTypeValue').val(customer.id_type);

            $('#guest__booking-id').val(booking.id);
            $('#room__rate').val(room.amount);
            $('#is__early-checkin').val(is_early_checkin);

            SHORT_REST_OPTION = booking.is_short_rest;
            IS_LATE_CHECKOUT = booking.is_late_checkout;
            IS_HALF_DAY = booking.is_half_booking;
          })
          .catch((error) => {
            console.log(error);
          });

        // Restrict a staff from changing room number
        if (USER_ROLE === 'staff') {
          $('.guest-input-column .dropdown-menu').remove();
          $('#guest__checkinDate').prop('readonly', true);
          $('#guest__checkout').prop('readonly', true);
        }
      });

      let initialCheckin, initialCheckout;
      // Adjust duration and amount when checkin/checkout date is enter.
      $('#dynamic__load-dashboard')
        .off('focus', '#guest__checkinDate, #guest__checkout')
        .on('focus', '#guest__checkinDate, #guest__checkout', function() {
          initialCheckin = $('#guest__checkinDate').val();
          initialCheckout = $('#guest__checkout').val();
        });
      $('#dynamic__load-dashboard')
        .off('input', '#guest__checkinDate, #guest__checkout')
        .on('input', '#guest__checkinDate, #guest__checkout', function() {
          const $clickItem = $(this);
          const checkin = $('#guest__checkinDate').val();
          const checkout = $('#guest__checkout').val();

          if (new Date(checkout) - new Date(checkin) < 1) {
            showNotification(  
              'Check Out date must not be earlier than Check In date', true      
            );

            $('#guest__checkinDate').val(initialCheckin);
            $('#guest__checkout').val(initialCheckout);
            return; 
          } 
          /*
          else if (canadianDateFormat(checkin) <= canadianDateFormat(new Date())) {
            'Check Out date must not be earlier than Today's date', true
          }*/
          const roomRate = parseFloat($('#room__rate').val());
          const is_early_checkin = $('#is__early-checkin').val();
          const duration = bookingDuration(checkout, checkin);
          const bookingAmount = (
            is_early_checkin === 'no' ? roomRate * duration :
            roomRate * duration + EARLY_CHECKIN_AMOUNT
          );
          $('#guest__roomAmount').val('₦' + bookingAmount.toLocaleString());

          $('#guest__night-count').val(`${duration} Night(s)`);
        });

      // Show dropdown menu
      $('#dynamic__load-dashboard')
        .on('click', '#guest__booking-type, #guest-gender, #guest-idType', function() {
          const $clickMenu = $(this);
          const clickMenuId = $clickMenu.attr('id');

          // Ensure that only one dropdown menu show at a time
          $('#guest__idType-dropdown, #guest__gender-dropdown').hide();
          switch (clickMenuId) {
            case 'guest-idType':
              $('#guest__idType-dropdown').show();
              break;
            case 'guest-gender':
              $('#guest__gender-dropdown').show();
              break;

            case 'guest__booking-type':
              $('#guest__booking-type-menu').show();
              break;
          }
        });

      // Booking Option handler.
      $('#dynamic__load-dashboard')
        .on('click', '.guest__booking-option', function() {
          const $clickMenu = $(this);                      
          const clickMenuId = $clickMenu.attr('id');
          const selectedOption = $clickMenu.text();

          function resetToShortTimeDate(duration, amount) {
            const todayDate = canadianDateFormat(new Date());
            const checkin = $('#guest__checkinDate').val(todayDate);
            const checkout = $('#guest__checkout').val(todayDate);

            $('#guest__checkout-container, #guest__checkin-container').addClass('hide');
            $('#guest__night-count').val(`${duration} Hours`);
            $('#guest__roomAmount').val('₦' + amount.toLocaleString());
          }

          if (selectedOption.toLowerCase() === 'full time') {      
            $('#guest__checkout-container, #guest__checkin-container').removeClass('hide');    
            $('#guest__night-count').val('0 Night(s)');
            $('#guest__roomAmount').val('₦0');

            SHORT_REST_OPTION = IS_LATE_CHECKOUT = IS_HALF_DAY = false;

          } else if (selectedOption.toLowerCase() === 'half day') {
            IS_HALF_DAY = true;
            SHORT_REST_OPTION = IS_LATE_CHECKOUT = false;
            const roomRate = parseFloat($('#room__rate').val());
            const halfDayAmount = 0.5 * roomRate;
            resetToShortTimeDate(HALF_DAY_DURATION, halfDayAmount);
          } else if (selectedOption.toLowerCase() === 'late checkout') {        
            IS_LATE_CHECKOUT = true;
            SHORT_REST_OPTION = IS_HALF_DAY = false;
            resetToShortTimeDate(LATE_CHECK_OUT_DURATION, LATE_CHECK_OUT_AMOUNT);
          } else if (selectedOption.toLowerCase() === 'short time') {
            SHORT_REST_OPTION = true;
            resetToShortTimeDate(SHORT_TIME_DURATION, SHORT_REST_AMOUNT);
          }
          $('#guest__booking-type span').text(selectedOption);
        });

      // Get option selected from drop-down menu
      $('#dynamic__load-dashboard').on('click', '.dropdown-item', function() {
        const $clickItem = $(this);
        const selectedMenu = $clickItem.text();
        $('.dropdown-menu').hide(); // Hide dropdown menu once option selected

        if ($clickItem.hasClass('guest__idtype-dropdown')) {
          $('#guest__idTypeValue').val(selectedMenu);
          $('#guest-idType span').text(selectedMenu); // Display option
        } else if ($clickItem.hasClass('guest__age-dropdown')) {
          $('#guest__genderValue').val(selectedMenu);
          $('#guest-gender span').text(selectedMenu); // Display option
        }
        else if($clickItem.hasClass('guest__dropdown--room-no')) {
          const $clickItem = $(this);
          const roomNumber = $clickItem.text();
          //const newRoomNumber = $(this).text();
          //const oldRoomNumber = $('#guest__room-number').val();
          //const bookingId = $('#guest__booking-id').val();
          //const oldRoomRate = $('#room__rate').val();

          $('#guest__room-number-menu').text(roomNumber);
          const roomUpdateUrl = API_BASE_URL + `/rooms/${roomNumber}`;
          fetchData(roomUpdateUrl)
            .then((data) => {
              $('#room__rate').val(data.amount);  // Update with the new room amount.
              const bookingType = $('#guest__booking-type span')
                .text().toLowerCase();
              const roomCount = parseInt($('#guest__night-count').val().split(' '));
              if (bookingType === 'full time' && roomCount > 0) {
                const earlyCheckinAmt = $('#is__early-checkin').val() === 'yes' ? EARLY_CHECKIN_AMOUNT : 0;
                const bookingAmount = roomCount * data.amount + earlyCheckinAmt;
                $('#guest__roomAmount').val(`₦${bookingAmount.toLocaleString()}`);
              } else if (bookingType === 'half day') {
                const halfBookingAmt = 0.5 * data.amount;
                $('#guest__roomAmount')
                  .val(`₦${halfBookingAmt.toLocaleString()}`);
              }
              $('#guest__roomType').val(data.name);
            })
            .catch((error) => {
              console.log(error);
            });
        }
      });
    }
  });

  // Display room number menu
  $('#dynamic__load-dashboard')
    .off('click', '#guest__dropdown--room-no')
    .on('click', '#guest__dropdown--room-no', function() {
      const occupiedRoomUrl = API_BASE_URL + '/room-numbers';
      fetchData(occupiedRoomUrl)
        .then((rooms) => {
          if (!rooms) {
            const msg = 'No room lodge at the moment !';
            showNotification(msg);
          }
          if (USER_ROLE === 'staff') {
            showNotification('Access Restricted: Contact management to change guest room', true);
            return;
          }
          const occupiedNumberList = rooms;
          displayMenuList(
            occupiedNumberList, $($(this)), 'dropdown-item guest__dropdown--room-no'
          );
        })
        .catch((error)  => {
          console.log(error);
        });
    });

  // Handle update of guest data
  $('#dynamic__load-dashboard').off('click', '#guest__input_btn')
    .on('click', '#guest__input_btn', function() {

      const $button = $(this);
      $button.prop('disable', true);
      // Customer data
      const name = $('#guest__name').val();
      const address = $('#guest__address').val();
      const gender = $('#guest__genderValue').val().toLowerCase();
      const phone  = $('#guest__phoneNumber').val();
      const id_type = $('#guest__idTypeValue').val().toLowerCase();
      const id_number = $('#guest__idNumber').val();

      // Booking Data
      const checkin = $('#guest__checkinDate').val();
      const checkout =$('#guest__checkout').val();

      if (checkout === checkin && !SHORT_REST_OPTION &&
        !IS_LATE_CHECKOUT && !IS_HALF_DAY) {
        showNotification(
          'Check Out date must not be earlier than Check In date', true
        );
        return;
      }

      // Get total amount of room book base on night durations.
      const amount = parseFloat(
        $('#guest__roomAmount').val().replaceAll(',', '').replaceAll('₦', '')
      );
      const duration = parseInt($('#guest__night-count').val().split(' '));

      // Room data
      const newRoomNumber = $('#guest__room-number-menu').text();
      const oldRoomNumber = $('#guest__room-number').val();

      const data = {
        customer: { name, address, gender, phone, id_type, id_number },
        booking: {
          checkin, duration, checkout,
          is_late_checkout: IS_LATE_CHECKOUT,
          amount, is_short_rest: SHORT_REST_OPTION,
          is_half_booking: IS_HALF_DAY
        },
        room: { old_room: oldRoomNumber, new_room: newRoomNumber }
      }

      const bookingId = $('#guest__booking-id').val();
      const editUrl = API_BASE_URL + `/bookings/${bookingId}/edit`;
      ajaxRequest(editUrl, 'PUT', JSON.stringify(data),
        (response) => {
          $button.prop('disable', false);
          showNotification('Updated Successfully !');
        },
        (error) => {
          if (error.status === 422) {
            showNotification('Error: ' + error.responseJSON.error, true);
          } else {
            showNotification('An Error Occured. Try Again !', true);
          }
          $button.prop('disable', false);
        }
      );
    });

  // Get guest at any interval of time.
  $('#dynamic__load-dashboard')
    .off('click', '.guest-table-column #inventory__searchbar')
    .on('click', '.guest-table-column #inventory__searchbar', function() {
      const startDate = $('#inventory__filter-start--date').val();
      const endDate = $('#inventory__filter-end--date').val();

      if (!startDate || !endDate) {
        showNotification('Start date and end date required', true);
        return;
      }
      $('.guest__list-filter-container .filter').removeClass('highlight-btn');
      const url = API_BASE_URL + `/bookings/${startDate}/${endDate}/get`
      fetchData(url)
        .then(({ bookings, accumulated_sum }) => {

          $('.guest-table-body').empty();
          $('#expenditure__total__amount-entry').text(0);

          bookings.forEach(({ guest, booking, room }) => {
            const checkInDate = britishDateFormat(booking.checkin);
            const checkoutDate = britishDateFormat(booking.checkout);
            const date = { checkInDate, checkoutDate };
            $('.guest-table-body').append(
              guestListTableTemplate(guest, booking, room, date)
            );
          });

          $('#expenditure__total__amount-entry')
            .text(accumulated_sum.toLocaleString())
        })
        .catch((error) => {
        });
    });

  // Filter bookings
  $('#dynamic__load-dashboard')
    .off('click', '.guest__list-filter-container .filter')
    .on('click', '.guest__list-filter-container .filter', function() {
      const $clickItem = $(this);
      const clickItemId = $clickItem.attr('id');
      $clickItem.addClass('highlight-btn');
      $clickItem.siblings().removeClass('highlight-btn');

      $('.guest-table-body').empty(); 

      switch (clickItemId) {
        case 'all__bookings': {
          const url = API_BASE_URL + '/bookings';
          fetchData(url)
          .then((bookings) => {
            $('#guest__list-title').text('Today\'s Guests List');
            bookings.forEach(({ guest, booking, room }) => {
              const checkInDate = britishDateFormat(booking.checkin);
              const checkoutDate = britishDateFormat(booking.checkout);
              const date = { checkInDate, checkoutDate };
              $('.guest-table-body').append(
                guestListTableTemplate(guest, booking, room, date)
              );
            });
          })
          .catch((error) => {
            console.log(error);
          });
          break;
        }
        case 'active__bookings': {
          const url = API_BASE_URL + '/bookings?search_string=active_bookings';
          $('#guest__list-title').text('Active Guests List');
          fetchData(url)
          .then((bookings) => {
            bookings.forEach(({ guest, booking, room }) => {
              const checkInDate = britishDateFormat(booking.checkin);
              const checkoutDate = britishDateFormat(booking.checkout);
              const date = { checkInDate, checkoutDate };
              $('.guest-table-body').append(
                guestListTableTemplate(guest, booking, room, date)
              );
            });
          })
          .catch((error) => {
            console.log(error);
          });
          break;
        }
        case 'reserve__bookings': {
          $('#guest__list-title').text('Reserve Guests List');
          const url = API_BASE_URL + '/bookings?search_string=reserve_bookings';
          fetchData(url)
          .then((bookings) => {
            bookings.forEach(({ guest, booking, room }) => {
              const checkInDate = britishDateFormat(booking.checkin);
              const checkoutDate = britishDateFormat(booking.checkout);
              const date = { checkInDate, checkoutDate };
              $('.guest-table-body').append(
                guestListTableTemplate(guest, booking, room, date)
              );
            });

          })
          .catch((error) => {
            console.log(error);
          });
          break;
        }
      }
    });

  // Handle printing of booking reciept
  $('#dynamic__load-dashboard')
    .on('click', '.guest__listPrint, #booking__print-receipt',
      function() {
        const bookingId = $(this).data('id');
        const receiptUrl = (
          APP_BASE_URL + `/bookings/print-receipt?booking_id=${bookingId}`
        );
        window.open(receiptUrl, '_blank');
      });
});
