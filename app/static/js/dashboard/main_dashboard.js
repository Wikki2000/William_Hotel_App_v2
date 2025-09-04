import {
  bookingDuration, ajaxRequest, fetchData, compareDate,
  getFormattedDate, validateForm, updateElementCount, britishDateFormat,
  showNotification, getBaseUrl, displayMenuList, canadianDateFormat,
} from '../global/utils.js';
import { saleBreakdownModal } from '../global/templates1.js';
import { loadDashbard } from './load_dashboard.js';


function resetRoomDetails() {
  $('#main__room-rate, #main__room-type')
    .val('Auto-filled based on room no');
  $('#main__room--no-val').val('');
  $('#main__dropdown--room-no span').text('Select ');
  $('#main__night-count').val('');
}

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');
  const TERMINAL = localStorage.getItem('terminal');

  const sideBarClick = sessionStorage.getItem('pageId');
  if (sideBarClick) {                
    $(document).ready(function() {  
      $(`#${sideBarClick}`).click();
    });
  }

  $('#dynamic__load-dashboard').on("change", "#toggle-switch", function() {
    const $element = $(this);

    if (this.checked) {
      $(".status").css("color", "green");
      $("#toggle-state").text("Online");
    } else {
      $(".status").css("color", "#6c757d");
      $("#toggle-state").text("Offline");
    }
  });

  // Load Main Dashboard
  const dashboardUrl = APP_BASE_URL + '/pages/main_dashboard';
  $('#dynamic__load-dashboard').load(dashboardUrl, function() {
    loadDashbard();
  });

  // Reset room details once the date input field is click.
  $('#dynamic__load-dashboard').on('click', '#main__check-in, #main__checkout-date', function() {
    resetRoomDetails();
  });

  // This values are assign when handling switch case Room Number menu display.
  let CHECK_IN, CHECK_OUT, AMOUNT, DURATION;
  let IS_EARLY_CHECKIN, SHORT_REST_OPTION, IS_RESERVE;

  // Handle the form submission for the booking form
  $('#dynamic__load-dashboard').on('submit', '#main__book-form', function (e) {
    e.preventDefault(); // Prevent default form submission

    // Validate form data and show error messages
    if (!validateForm($('#main__book-form'))) {
      showNotification('Please fill out all required fields.', true);
      return;
    }

    // Booking data
    const expiration = $('#main__checkout-date').val();
    const guest_number = $('#main__guest-no').val();
    const is_paid = $('#main__is--paid-val').val().toLowerCase();
    const is_reserve = (
      CHECK_IN > canadianDateFormat(new Date()) ? true : false
    );

    // Set duration to 2hrs if date field not enter.
    // And set check in and and check out to current date.
    // This applies to short time.
    DURATION = CHECK_OUT && CHECK_IN ? DURATION : 2;

    CHECK_IN = CHECK_IN ? CHECK_IN : canadianDateFormat(new Date());
    CHECK_OUT = CHECK_OUT ? CHECK_OUT : canadianDateFormat(new Date());
    const is_short_rest = SHORT_REST_OPTION;

    // Room data
    const roomNumber = $('#main__room--no-val').val().split(",");

    // Customer data
    const name = $('#main__guest-name').val();
    const address = $('#main__guest-address').val();
    const phone = $('#main__guest-phone').val();
    const gender = $('#main__guest--gender-val').val();
    const id_type = $('#main__id--type-val').val().toLowerCase();
    const id_number = $('#main__id--no-val').val();
    const email = $('#main__guest-email').val();
    const payment_type = $('#main__id--paymmentType-val').val();

    const BookingData = {
      book: {
        duration: DURATION, guest_number, /*amount: AMOUNT,*/ is_reserve,
        is_paid, checkin: CHECK_IN, checkout: CHECK_OUT, is_short_rest,
        is_early_checkin: IS_EARLY_CHECKIN, payment_type
      },
      customer: { gender, name, address, phone, id_type, id_number, email },
      room_number: AMOUNT
    };

    $('#main__popup-modal').css('display', 'flex');

    $('#dynamic__load-dashboard').off('click', '#main__confirm-btn')
      .on('click', '#main__confirm-btn', function() {
        const bookUrl =  API_BASE_URL + "/book";

        const $button = $(this);
        $button.prop('disable', true);  // Disable btn to avoid multiple requests.
        $('#main__popup-modal').hide();
        showNotification("Request Proccessing");
        ajaxRequest(bookUrl, 'POST', JSON.stringify(BookingData),
          (response) => {
            $button.prop('disable', false);

            const reserveOrBookText = response.is_reserve ? 'reserved' : 'booked';
            const msg = (
              `Success! Room [${roomNumber}] has been ${reserveOrBookText} for ${name}`
            );
            showNotification(msg);

            // Update the count in ui if not reservations.
            if (!response.is_reserve) {
              updateElementCount($('#main__room-available'));
              updateElementCount($('#main__today-check--in'), true);
            }

            // Remove guest data if selected from guest list.
            sessionStorage.removeItem('guestData');

            // Print receipt immediately room is book.
            if (roomNumber <= 1) {
              // Handle case where only one room is selected.
              const bookingId = response.booking_id;
              const receiptUrl = (
                APP_BASE_URL + `/bookings/print-receipt?booking_id=${bookingId}&booking_count=single`
              );
              window.open(receiptUrl, '_blank');
            } else {
              // Handle case where multiple room is selected.
              //const roomIdsList = $("#room__ids-list").val().split(",");
              const receiptUrl = (
                APP_BASE_URL + `/bookings/print-receipt?booking_id=${JSON.stringify(response.booking_id_list)}&booking_count=multiple`
              );
              window.open(receiptUrl, '_blank');
            }
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

    // Cancel Popup Modal
    $('#dynamic__load-dashboard').off('click', '#main__cancel-btn')
      .on('click', '#main__cancel-btn', function() {
        $('#main__popup-modal').hide();
      });
  });

  // Load and display popup menu list of room number
  $('#dynamic__load-dashboard').on(
    'click', '.main__dropdown-btn',
    function () {
      const $clickItem = $(this);
      const clickId = $clickItem.attr('id');

      switch(clickId) {
        case 'main__dropdown--room-no': {
          //const roomUrl = API_BASE_URL + '/rooms/available/filter';
          const roomUrl = API_BASE_URL + $("#room__url").val();

          const bookingType = $('#main__id--bookingtype-val').val().toLowerCase();

          if (!$('#main__id--bookingtype-val').val()) {
            showNotification('Please enter an option for booking type to proceed', true);
            return;
          } else if (bookingType === 'full time' && !$('#main__id--checkin-val').val()) {
            showNotification('Please enter option for Early Checkin', true);
            return;
          } else if (bookingType === 'full time' && !$('#main__check-in').val()) {
            showNotification('Please enter Checkin date', true);
            return;
          } else if (bookingType === 'full time' && !$('#main__checkout-date').val()) {
            showNotification('Please enter Checkout date', true);
            return;
          } else if ($('#main__check-in').val() < canadianDateFormat(new Date()) && bookingType === 'full time') {
            showNotification('Check-in date must be earlier than today\'s date', true);
            return;
          }

          fetchData(roomUrl)
          .then((rooms) => {
            rooms.unshift("Select Multiple");
            displayMenuList(rooms, $clickItem, 'order__menu');
            $(".dropdown-menu").focus();
          })
          .catch((error) => {
            console.log(error);
          });

          // Auto-fill the input field when room number selected in dropdown menu
          $('#dynamic__load-dashboard').on(
            'click', '.order__menu',
            function() {
              const $clickItem = $(this);
              // Check if the clicked dropdown is within Room No. dropdown
              if ($(this).closest('.dropdown')
                .find('#main__dropdown--room-no').length) {
                // Trim in case of extra spaces
                const roomNumberSelected = $clickItem.text().trim(); 

                // Assign room number to input field to be summited with form.
                $('#main__room--no-val').val(roomNumberSelected);

                if (isNaN(roomNumberSelected)) {
                  $clickItem.closest('.dropdown')
                    .find('.main__dropdown-btn span').text('Select');
                  $('#main__room-rate, #main__room-type')
                    .val('Auto-filled based on room no');

                  if (roomNumberSelected === "Select Multiple") {
                    $("#book__multiple-room").css("display", "flex");
                    const roomUrl = API_BASE_URL + $("#room__url").val();

                    fetchData(roomUrl)
                      .then((rooms) => {
                        $("#dropdown-content").empty();

                        rooms.forEach((room) => {
                          $("#dropdown-content").append(`
                                  <label style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 14px; cursor: pointer;">
                                    <input type="checkbox" value="${room}" style="width: 16px; height: 16px;"> ${room}
                                  </label><br>
                                `);
                        });
                        $("#dropdown-content").append(`<button id="submit__selected-room" style="padding: 10px; width: 100%; border: 1px solid #ccc; border-radius: 5px; background: #f5f5f5; cursor: pointer; text-align: center;">Continue</button>`);
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                  }
                } else {
                  const roomUrl = (
                    API_BASE_URL + `/rooms/${roomNumberSelected}`
                  );

                  // Auto-fill the input field
                  fetchData(roomUrl)
                    .then((room) => {


                      CHECK_IN = $('#main__check-in').val();
                      CHECK_OUT = $('#main__checkout-date').val();

                      /*
                      if (new Date(CHECK_IN) >= new Date(CHECK_OUT)) {
                        resetRoomDetails();
                        showNotification(
                          'Check Out date must not be earlier than Check In date', true
                        );
                        return;
                      }*/
                      DURATION = bookingDuration(CHECK_OUT, CHECK_IN);

                      DURATION = DURATION === 0 ? 1 : DURATION;

                      // Get total amount of room book base on some criterias..
                      const room_rate = $('#main__room-amount').val();
                      let tempAmt;
                      tempAmt = DURATION * room.amount;
                      if ($('#main__id--checkin-val').val() === 'Yes') {
                        tempAmt += EARLY_CHECKIN_AMOUNT;
                        IS_EARLY_CHECKIN = true;
                        $('#main__night-count').val(`${DURATION} Night(s)`);

                      }
                      else if (
                        $('#main__id--bookingtype-val').val().toLowerCase() === 'short time'
                      ) {
                        tempAmt = SHORT_REST_AMOUNT;
                        $('#main__night-count').val(`${SHORT_TIME_DURATION} Hours`);
                      } else {
                        $('#main__night-count').val(`${DURATION} Night(s)`); 
                      }

                      AMOUNT = [{ room_number: roomNumberSelected, room_amount: tempAmt }]
                      $('#main__room-rate')
                        .val('₦' + tempAmt.toLocaleString());
                      $('#main__room-type').val(room.name);

                    })
                    .catch((error) => {
                      console.log(error);
                    });

                  // Populated with selected options from dropdown menu.
                  $clickItem.closest('.dropdown')
                    .find('.main__dropdown-btn span')
                    .text(roomNumberSelected);

                  $('#main__room--no-val').val(roomNumberSelected);
                }
              }
              $('.dropdown-menu').hide(); // Hide once option is selected

            });
          break;
        }
        case 'main__booking-type': {
          const isBookingOptions = ['Short Time', 'Full Time'];
          displayMenuList(isBookingOptions, $clickItem);
          $('#dynamic__load-dashboard').on(
            'click', '.dropdown-item', function() {
              if ($(this).closest('.dropdown')
                .find('#main__booking-type').length) {

                const selectedOption = $(this).text();

                // Reset once click on booking type.
                resetRoomDetails();

                $('#main__id--bookingtype-val').val(selectedOption);
                $('#main__check-in, #main__checkout-date').val('');
                $('#main__early-checkin span').text('Select ');
                $('#main__id--checkin-val').val('');


                if (selectedOption.toLowerCase() === 'full time') {
                  $('#main__checkin-container, #main__checkout-container, #main__earlyin-container').removeClass('hide');

                  SHORT_REST_OPTION = false;

                  $('#main__check-in, #main__checkout-date, #main__id--checkin-val').attr('required');
                  $('#main__check-in').val(canadianDateFormat(new Date));
                } else {
                  $('#main__checkin-container, #main__checkout-container, #main__earlyin-container').addClass('hide');

                  SHORT_REST_OPTION = true;

                  $('#main__check-in, #main__checkout-date, #main__id--checkin-val').removeAttr('required');
                }

                $clickItem.closest('.dropdown')
                  .find('.main__dropdown-btn span')
                  .text($(this).text());

                $('.dropdown-menu').hide(); // Hide once option is selected
              }
            });

          break;
        }
        case 'main__early-checkin': {
          const isEarlyCheckinOptions = ['Yes', 'No'];
          displayMenuList(isEarlyCheckinOptions, $clickItem);  
          $('#dynamic__load-dashboard').on(
            'click', '.dropdown-item', function() {

              if ($(this).closest('.dropdown')
                .find('#main__early-checkin').length) {

                resetRoomDetails();

                $('#main__id--checkin-val').val($(this).text());

                $clickItem.closest('.dropdown')
                  .find('.main__dropdown-btn span')
                  .text($(this).text());

                $('.dropdown-menu').hide(); // Hide once option is selected
              }
            });
          break;
        }
        case 'main__guest-payment--status' : {
          const isPaidOptions = ['Yes', 'No'];
          displayMenuList(isPaidOptions, $clickItem);

          $('#dynamic__load-dashboard').on(
            'click', '.dropdown-item', function() {

              // Check if the clicked dropdown is within
              // the payment status dropdown
              if ($(this).closest('.dropdown')
                .find('#main__guest-payment--status').length) {
                $('#main__is--paid-val').val($(this).text());

                // Populated with selected options from dropdown menu.
                $clickItem.closest('.dropdown')
                  .find('.main__dropdown-btn span')
                  .text($(this).text());

                $('.dropdown-menu').hide(); // Hide once option is selected
              }
            });
          break;
        }
        case 'main__guest-gender' : {
          const genderOptions = ['Male', 'Female'];
          displayMenuList(genderOptions, $clickItem);
          $('#dynamic__load-dashboard').on(
            'click', '.dropdown-item', function() {
              if ($(this).closest('.dropdown')
                .find('#main__guest-gender').length) {
                $('#main__guest--gender-val').val($(this).text());

                // Populated with selected options from dropdown menu.
                $clickItem.closest('.dropdown')
                  .find('.main__dropdown-btn span')
                  .text($(this).text());
                $('.dropdown-menu').hide();
              }
            });
          break;
        }
        case 'main__guest-id--type': {
          const idTypeOptions = ['NIN', 'Voter_Card',
            'Passport', 'Driver_License'];
          displayMenuList(idTypeOptions, $clickItem);

          $('#dynamic__load-dashboard').on(
            'click', '.dropdown-item', function() {
              if ($(this).closest('.dropdown')
                .find('#main__guest-id--type').length) {
                $('#main__id--type-val').val($(this).text());

                // Populated with selected options from dropdown menu.
                $clickItem.closest('.dropdown')
                  .find('.main__dropdown-btn span')
                  .text($(this).text());

                $('.dropdown-menu').hide();
              }
            });
          break;
        }
        case 'main__payMethod': {
          const paymentOptions = ['Transfer', 'POS', 'Cash'];      
          displayMenuList(paymentOptions, $clickItem);
          $('#dynamic__load-dashboard').on(       
            'click', '.dropdown-item', function() {       
              if ($(this).closest('.dropdown')     
                .find('#main__payMethod').length) {     
                $('#main__id--paymmentType-val').val($(this).text());
                // Populated with selected options from dropdown menu.        
                $clickItem.closest('.dropdown')       
                  .find('.main__dropdown-btn span')    
                  .text($(this).text());

                $('.dropdown-menu').hide();        
              }         
            });
          break;
        }
      }
    });

  // Collect all selected room number.
  $('#dynamic__load-dashboard').on("click", "#submit__selected-room", function() {
    const $checkedItem = $("#dropdown-content input[type='checkbox']:checked");
    const roomNumberList = $checkedItem.map(function() {
      return $(this).val();
    }).get()
    const totalCheckItem = $checkedItem.length;
    const roomNumberString = roomNumberList.join(",");

    if (totalCheckItem <= 1) {
      alert("You must select atleast two rooms number");
      return;
    }

    const roomUrl = (
      API_BASE_URL +  `/rooms/${JSON.stringify(roomNumberList)}/get-multiple`
    );
    fetchData(roomUrl)
      .then((rooms) => {
        const UniquerRoomTypeList = [...new Set(rooms.map(room => room.name))];
        $('#main__room-type').val(UniquerRoomTypeList.join(", "));

        const roomRateList = rooms.map(room => {
          return {
            roomNumber: room.number,
            roomAmount: room.amount
          };
        });

        CHECK_IN = $('#main__check-in').val();
        CHECK_OUT = $('#main__checkout-date').val();
        DURATION = bookingDuration(CHECK_OUT, CHECK_IN);

        if (new Date(CHECK_IN) >= new Date(CHECK_OUT)) {
          resetRoomDetails();
          showNotification(
            'Check Out date must not be earlier than Check In date', true
          );
          return;
        }

        const totalAmountList = [];
        roomRateList.forEach((room) => {

          let tempAmount = room.roomAmount;
          if ($('#main__id--checkin-val').val() === 'Yes') {
            tempAmount += EARLY_CHECKIN_AMOUNT;
            IS_EARLY_CHECKIN = true;
            $('#main__night-count').val(`${DURATION} Night(s)`);

          }
          else if (
            $('#main__id--bookingtype-val').val().toLowerCase() === 'short time'
          ) {
            tempAmount = SHORT_REST_AMOUNT;
            $('#main__night-count').val('2 Hours');
          } else {
            $('#main__night-count').val(`${DURATION} Night(s)`);
          }

          totalAmountList.push({room_number: room.roomNumber, room_amount: tempAmount});
        });

        const accumulatedAmt = totalAmountList.reduce((acc, val) => acc + val.room_amount, 0);
        AMOUNT = totalAmountList;

        //console.log(totalAmountList);
        $('#main__room-rate')
          .val('₦' + accumulatedAmt.toLocaleString());

        $('#main__room--no-val').val(roomNumberString);
        $("#main__dropdown--room-no span").text(
          roomNumberString.length <= 23 ? roomNumberString : roomNumberString.slice(0, 23) + "..."
        );

        $("#book__multiple-room").hide();
      })
      .catch((error) => {
        console.log(error);
      });
    //$('#main__room-type').val("You'");
  });

  $('#dynamic__load-dashboard').on("click", "#main__today-sales--view", function() {
    const today = britishDateFormat(new Date());

    $("#main__sales-breakdown .sales__popup-modal-content").empty();
    $("#main__sales-breakdown .sales__popup-modal-content").append(saleBreakdownModal());
    $("#main__sales-breakdown").css("display", "flex");
    $("#sales__date").text(today);
  });

  $('#dynamic__load-dashboard').on('click', '.main__item-sold', function() {
    const $clickItem = $(this);
    const clickItemId = $clickItem.attr('id');

    switch (clickItemId) {
      case 'maintotal__food-sale--btn': {
        const saleUrl = APP_BASE_URL + "/pages/today_sales?service=food";
        window.open(saleUrl, '_blank');
        break;
      }
      case 'maintotal__drink-sale--btn': {
        const saleUrl = APP_BASE_URL + "/pages/today_sales?service=drink";
        window.open(saleUrl, '_blank');
        break;
      }
      case 'maintotal__game-sale--btn': {
        const saleUrl = APP_BASE_URL + "/pages/today_sales?service=game";
        window.open(saleUrl, '_blank');
        break;
      }
      case 'maintotal__laundry-sale--btn': {
        const saleUrl = APP_BASE_URL + `/pages/today_sales?service=laundry`;
        window.open(saleUrl, '_blank');
        break;
      }
      case 'maintotal__room-sale--btn': {
        const saleUrl = APP_BASE_URL + `/pages/today_sales?service=room`;
        window.open(saleUrl, '_blank');
        break;
      }
    }
  });

  $('#dynamic__load-dashboard').on('click', '.track-btn', function() {
    const url = APP_BASE_URL + "/pages/roster";
    sessionStorage.setItem('pageId', 'roster')
    window.open(url, '_blank');
  });

  $('#dynamic__load-dashboard')
    .on("click", "#main__room-available--view", function() {
      $("#sidebar__Room").click();
    });

  $('#dynamic__load-dashboard')
    .on("click", "#main__orders-view", function() {
      $("#sidebar__ordes").click();
    });

  // Handle switching of terminal.
  $('#dynamic__load-dashboard').on("click", ".switch__terminal-control", function() {

    const swapTerminal = { t1: "t2", t2: "t1" };
    const terminal = swapTerminal[TERMINAL];
    if (!terminal) return;

    const url = API_BASE_URL + "/hotels/switch";

    ajaxRequest(url, 'PUT', JSON.stringify({ terminal }),
      (response) => {
        localStorage.setItem('terminal', terminal);
        window.location.reload();
      },
      (error) => {
        console.log(error);
      }
    );
  });
});
