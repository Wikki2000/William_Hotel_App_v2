import {
  updateElementCount, cartItemsTotalAmount, getBaseUrl, confirmationModal,
  validateForm, showNotification, ajaxRequest, fetchData, britishDateFormat,
  getFormattedTime, canadianDateFormat
} from '../global/utils.js';
import { orderDetails, orderHistoryTableTemplate } from '../global/templates1.js';
import { loadUpdatePaymentTemplate } from '../global/templates.js';

$(document).ready(function() {

  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const USER_ID = localStorage.getItem('userId');
  const USER_ROLE = localStorage.getItem('role');

  /*=========== Handle Order history table menu operation. ===========*/
  $('#dynamic__load-dashboard').on('click', '.order__manageItem', function() {
    const $selectedMenu = $(this);
    const clickItemId = $selectedMenu.data('id');
    const name = $selectedMenu.data('name');

    // Toggle visibility of icon to show and cancel table menu
    $selectedMenu.closest('td').siblings().find('.fa.fa-times').hide();
    $selectedMenu.closest('td').siblings().find('.fa.fa-ellipsis-v').show();

    $selectedMenu.closest('.manage').hide(); // Hide table menu once selected.

    if ($selectedMenu.hasClass('order__bill')) {
      // Load confirmation modal
      const confirmBtCls = 'order__confirm-btn';
      const headingText = 'Confirm Bil Payment';
      const descriptionText = 'This action cannot be undone !'

      const data = [{ data: 'id', value: clickItemId }, {data: 'name', value: name }];
      confirmationModal(headingText, descriptionText, confirmBtCls, data);
    } else if ($selectedMenu.hasClass('order__delete')) {
      const headingText = 'Confirm Removal of Order';
      const descriptionText = 'This action cannot be undone !'
      const confirmBtCls = 'order__delete-confirmBtn';

      confirmationModal(headingText, descriptionText, confirmBtCls);


      $('#dynamic__load-dashboard').off('click', '.order__delete-confirmBtn')
        .on('click', '.order__delete-confirmBtn', function() {
          const deleteOrderUrl = API_BASE_URL + `/orders/${clickItemId}/delete`;

          $('#order__confirmation-modal').empty();

          ajaxRequest(deleteOrderUrl, 'DELETE', null,
            (response) => {
              $(`tr[data-id="${clickItemId}"]`).remove();
              showNotification(`Order Deleted successfully !`);
            },
            (error) => {
              console.log(error);
            }
          );
        });
    } else if ($selectedMenu.hasClass('order__update-payment--method')) {
      const paymentMethod = $selectedMenu.data('payment-type');
      loadUpdatePaymentTemplate(paymentMethod, clickItemId);
    } else if ($selectedMenu.hasClass('order__print')) {
      const orderId = $selectedMenu.data('id');
      const receiptUrl = (
        APP_BASE_URL + `/orders/print-receipt?order_id=${orderId}` 
      );
      window.open(receiptUrl, '_blank');
    } else if ($selectedMenu.hasClass('order__showConfirmModal')) {

      const orderUrl = API_BASE_URL +  `/orders/${clickItemId}/order-items`;
      $('#common__popupModal').css('display', 'flex');

      $('#order__info').empty();
      $('#order__itemList').empty();

      fetchData(orderUrl)
        .then(
          ({ order, customer, ordered_by, cleared_by, order_items }
          ) => {

            const date = britishDateFormat(order.created_at);
            const time = getFormattedTime(order.created_at);
            orderDetails(
              customer, order, order_items, cleared_by, ordered_by, date, time
            );
          })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  // Handle printing of receipt from Order Details section
  $('#dynamic__load-dashboard')
    .on('click', '#order__print-receipt', function() {
      const orderId = $(this).data('id');
      const receiptUrl = (
        APP_BASE_URL + `/orders/print-receipt?order_id=${orderId}`
      );
      window.open(receiptUrl, '_blank');
    });

  // Handle 'CLEAR BILL' option menu
  $('#dynamic__load-dashboard')
    .on('click', '.order__confirm-btn', function() {
      const $clickBtn = $(this);
      const orderId = $('#extraData').data('id');
      const name = $('#extraData').data('name');
      $clickBtn.prop('disabled', true);  // Avoid multiple request

      const paymentStatusUrl = (
        API_BASE_URL + `/orders/${orderId}/update-payment`
      );

      ajaxRequest(paymentStatusUrl, 'PUT', null,
        (response) => {

          $clickBtn.prop('disabled', false);
          $('#order__confirmation-modal').empty();
          showNotification(`Customer [${name}] Bill Cleared Successfully !`);

          // Update payment status
          $(`tr[data-id="${orderId}"]`)
            .find('.order__bill-status').text('Paid');
          $(`tr[data-id="${orderId}"]`).closest('tr')
            .find('.order__bill-status')
            .css('color', 'green');

        },
        (error) => {
          $clickBtn.prop('disabled', false);
          if (error.status ===  409) {
            showNotification(error.responseJSON.error, true);
          } else {
            showNotification('An error occurred. Please try again.', true);
          }
          $('#order__confirmation-modal').empty();
        }
      );
    });

  // Handle submission of order form
  $('#dynamic__load-dashboard').on('submit', '#order__form', function(e) {
    e.preventDefault();

    const $formSelector = $(this);

    // Validate form data and show error messages
    if (!validateForm($formSelector)) {
      showNotification('Please fill out all required fields.', true);
      return; // Exit if validation fails
    }

    // Load confirmation modal
    const headingText = 'Confirm Order';
    const descriptionText = 'This action cannot be undone !'
    const confirmBtCls = 'order__confirm';

    confirmationModal(headingText, descriptionText, confirmBtCls);
  });

  $('#dynamic__load-dashboard').off('click', '.order__confirm')
    .on('click', '.order__confirm', function(){

      const $button = $(this);
      $button.prop('disabled', true);  // Avoid multiple request

      // Guest data
      const is_guest = (
        $('#order__guest--type-val').val() === 'Walk In' ? false : true
      );
      const name = $('#order__guest--name-val').val();

      // Order data
      const is_paid = (
        $('#order__ispaid-val').val() === 'Yes' ? true : false
      );
      const payment_type = $('#order__payment--type-val').val();
      const amount = parseFloat(
        $('#order__total--amout-cart').val()
        .replaceAll(',', '').replaceAll('₦', '')
      );

      const customer_id = $('#order__customer-id--val').val().trim();

      // Ensure that room number is enter for lodged in guess.
      if (!customer_id && $('#order__guest-type span').text() === 'Lodged') {
        $('#order__confirmation-modal').empty();
        showNotification('Room number missing for Lodged guest', true);
        return;
      }

      // Merges the ID with other data in cart
      const cartItemsList = [];
      CART.forEach((value, key) => {
        value['itemId'] = key;
        cartItemsList.push(value);
      });

      const data = {
        customerData: { name, is_guest},
        orderData: { payment_type, is_paid, amount },
        itemOrderData: cartItemsList, customer_id,
      };

      $('#order__confirmation-modal').empty();

      const orderUrl = API_BASE_URL + '/order-items';
      ajaxRequest(orderUrl, 'POST', JSON.stringify(data),
        (response) => {

          showNotification(`Order for ${name} successfully made !`);
          $button.prop('disabled', false);

          const orderId = response.order_id;
          const receiptUrl = (
            APP_BASE_URL + `/orders/print-receipt?order_id=${orderId}`
          );
          window.open(receiptUrl, '_blank');
        },
        (error) => {

          if (error.status === 422) {
            showNotification('Error: ' + error.responseJSON.error, true);
          } else {
            showNotification('An error occured, please try again !', true);
          }
          $button.prop('disabled', false);
		/*
		setTimeout(function() {
			window.location.reload();
		}, 1000);*/
          console.log(error);
        }
      );
    });

  // Switch the dashboard section of ORDERS.
  $('#dynamic__load-dashboard').on('click', '.order__selector', function() {
    const $clickItem = $(this);
    const clickId = $clickItem.attr('id');

    $('.order__selector').removeClass('highlight-btn');
    $clickItem.addClass('highlight-btn');

    // Hide other section once the switch button is click
    $('#order__items-section').hide();
    $('#order__history-section').hide();
    $('.order__emty--cart-section').hide();

    if (clickId === 'order__items') {
      $('#order__items-section').show();
      if (CART.size <= 0) {
        $('.order__emty--cart-section').show();
      }
    } else if (clickId === 'order__history') {
      $('#order__history-section').show();
      $('.order__filter').removeClass('highlight-btn');
      $('#order__filter-all').addClass('highlight-btn');
      $('.order_history-title ').text('Today Order List');

      $('.order__history--table-body').empty();

      // Prevent staff from getting sales at an interval of time.
      /*
      if (USER_ROLE === 'staff') {
        $('#inventory__filter-form').hide();
      }*/

      //const orderUrl = API_BASE_URL + '/order-items';
      const startDate = canadianDateFormat(new Date());
      const endDate = canadianDateFormat(new Date());
      const orderUrl = API_BASE_URL + `/orders/${startDate}/${endDate}/get`
      fetchData(orderUrl)
        .then(({ orders }) => {
          orders.forEach(({ order, customer }) => {
            const date = britishDateFormat(order.created_at);
            $('.order__history--table-body').append(
              orderHistoryTableTemplate(order, date, customer)
            );
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  // Handle filter button for Order History Section
  $('#dynamic__load-dashboard').on('click', '.order__filter', function() {
    const $clickItem = $(this);
    const clickId = $clickItem.attr('id');
    $('.order__history--table-body').empty(); 

    switch (clickId) {
      case 'order__filter-all': {
        $('.order_history-title ').text('Today Order List');
        //const orderUrl = API_BASE_URL + '/order-items';
        const startDate = canadianDateFormat(new Date());    
        const endDate = canadianDateFormat(new Date()); 
        const orderUrl = API_BASE_URL + `/orders/${startDate}/${endDate}/get`;
        fetchData(orderUrl)                                                
        .then(({ orders }) => {     
          orders.forEach(({ order, customer }) => { 
            const date = britishDateFormat(order.created_at);
            $('.order__history--table-body').append(
              orderHistoryTableTemplate(order, date, customer)
            );
          });
        })
        .catch((error) => {
        });
        break;
      }
      case 'order__filter-pending': {
        const orderPendingPaymentUrl = API_BASE_URL + '/orders/pending';
        fetchData(orderPendingPaymentUrl)
        .then((data) => {
          $('.order_history-title ').text('All Pending Orders');
          data.forEach(({ order, customer, user }) => {
            const date = britishDateFormat(order.created_at);
            $('.order__history--table-body').append(
              orderHistoryTableTemplate(order, date, customer)
            );
          });
        })
        .catch((error) => {
        });
        break;
      }
      case 'order__filter-paid': {
        const orderPaidPaymentUrl = API_BASE_URL + '/orders/paid';
        $('.order_history-title ').text('Today Paid Orders');
        fetchData(orderPaidPaymentUrl)
        .then((data) => {
          data.forEach(({ order, customer, user }) => {
            const date = britishDateFormat(order.created_at);
            $('.order__history--table-body').append(
              orderHistoryTableTemplate(order, date, customer)
            );
          });
        })
        .catch((error) => {
        });
        break;
      }
    }

    $('.order__filter').removeClass('highlight-btn');
    $clickItem.addClass('highlight-btn'); 
  });

  // Display dropdown menu
  $('#dynamic__load-dashboard').on(
    'click', '.order__dropdown-btn',
    function() {

      const $clickItem = $(this);
      const clickId = $clickItem.attr('id');

      switch(clickId) {
        case 'order__payment-type': {
          $('#order__payment--type-dropwdown').toggle();
          break;
        }
        case 'order__ispaid': {
          $('#order__ispaid-dropdown').toggle();
          break;
        }
        case 'order__guest-type': {
          $('#order__guest--type-dropdown').toggle();

          // Hide room number when click on btn to select menu.
          $('#room__number-dropdown').hide();

          // Clear the hidden input field for room number
          // once the guest type menu is click.
          $('#order__room--number-selected').val('');
          $('#order__customer-id--val').val('');
          $('#order__guest--name-val').val('');
          $('#order__guest--name-val').prop('readonly', false);
          break;
        }
      }
    });

  // Update amount and count of quantity of items ordered
  $('#dynamic__load-dashboard').on('click', '.order__count-btn', function() {
    const $clickItem = $(this);
    const $countValueSelector = $clickItem.siblings('.order__counter-value');
    const itemId = $clickItem.data('id');
    const unitPrice = parseFloat($clickItem.data('price'));
    /*const unitPrice = parseFloat(
      $clickItem.closest('.order__items--list-content')
        .find('.order-item-price').text()
    );*/

    const itemData = CART.get(itemId);  // Retrieve item from cart

    const isIncrease = $clickItem
      .hasClass('order__btn-increase') ? true : false;
    const currentCount = updateElementCount($countValueSelector, isIncrease);

    // Ensure that qty count always ends with one
    if (currentCount === 0) {
      $countValueSelector.text(1);
    }

    if (currentCount >= 1) {

      // Calculate the total price and quantity of items in the CART
      if (isIncrease) {
        const totalAmount = itemData['itemAmount'] + unitPrice;
        itemData['itemAmount'] = totalAmount;

        itemData['itemQty'] = itemData['itemQty'] + 1;
      } else {
        const totalAmount = itemData['itemAmount'] - unitPrice;

        itemData['itemQty'] = itemData['itemQty'] - 1;
        itemData['itemAmount'] = totalAmount;
      }
    }

    CART.set(itemId, itemData); // update with object of total amount & qty.

    // Update the amount in proportion to item qty counts.
    const totalAmount = cartItemsTotalAmount(CART);
    $('#order__total--amout-cart').val('₦' + totalAmount.toLocaleString());

    $clickItem.closest('.order__items--list-content')
      .find('.order__item-amount')
      .text('₦' + itemData['itemAmount'].toLocaleString());
  });

  // Retrieve selected option from dropdown menu and store in form hidden input
  // field so to be sent to servere during form submission.
  $('#dynamic__load-dashboard')
    .on('click', '.order__dropdown-selector', function() {
      const $currentClickItem = $(this);
      const selectedOption = $currentClickItem.text();

      const parentId = $currentClickItem.closest('.dropdown')
        .find('.order__dropdown-btn').attr('id');

      // Update with selected option & Hide dropdown menu.
      $currentClickItem.closest('.dropdown')
        .find('.order__dropdown-btn span')
        .text(selectedOption);
      $('.dropdown-menu').hide();

      switch(parentId) {
        case 'order__payment-type':
          $('#order__payment--type-val').val(selectedOption);
          break;

        case 'order__ispaid':
          $('#order__ispaid-val').val(selectedOption);
          break;

        case 'order__guest-type':
          $('#order__guest--type-val').val(selectedOption);

          // Show room number when guest type is Lodged
          if (selectedOption === 'Lodged') {
            const roomUrl = API_BASE_URL + '/occupied-room-number';
            fetchData(roomUrl)
              .then((rooms) => {
                $('#room__number-dropdown .room__dropdown--menu-list').empty();
                if (rooms.length < 1) {
                  showNotification('No room is occupied by guest');
                  $('#order__guest-type span').text('Select');
                  return;
                }
                rooms.forEach((roomNunber) => {
                  $('#room__number-dropdown .room__dropdown--menu-list')
                    .append(
                      `<li class="dropdown-item room__number-option">
                        ${roomNunber}
                      </li>`
                    );
                });
                $('#room__number-dropdown').show();
              })
              .catch((error) => {
                console.log(error);
              });
          }
          break;
      }
    });

  // Retrieved menu when room number is clicked for guest lodging.
  $('#dynamic__load-dashboard').on('click', '.room__number-option', function() {
    const roomNumber = $(this).text().trim();
    $('#room__number-dropdown').hide();
    $('#order__room--number-selected').val(roomNumber);
    if (roomNumber) {
      const customerUrl = API_BASE_URL + `/rooms/${roomNumber}/guest-occupied`;
      fetchData(customerUrl)
        .then((data) => {
          $('#order__guest--name-val').val(data.name);
          $('#order__guest--name-val').prop('readonly', true);
          $('#order__customer-id--val').val(data.id);
        })
        .catch((error) => {
          console.log(error);
        });
      showNotification(`Room ${roomNumber} Selected`);
    } else {
      showNotification(
        'No room number selected for a lodged in guest', true
      );
    }
  });

  // Remove an item ordered from cart.
  $('#dynamic__load-dashboard')
    .on('click', '.order__delete-item', function() {
      const $clickItem = $(this);
      const itemId = $clickItem.data('id');

      const deletedItemAmount = parseFloat(
        $clickItem.closest('.order__items--list-content')
        .find('.order__item-amount').text()
        .replaceAll(',', '').replaceAll('₦', '')
      );
      const previousTotalAmount = parseFloat(
        $('#order__total--amout-cart').val()
        .replaceAll(',', '').replaceAll('₦', '')
      );
      const currentTotalAmount = previousTotalAmount - deletedItemAmount;

      $clickItem.closest('.order__items--list-content').remove();
      CART.delete(itemId);

      // Update count & and total amount on delete
      const count = updateElementCount($('#sidebar__order-count'), false);
      $('#order__total--amout-cart').val(
        '₦' + currentTotalAmount.toLocaleString()
      );

      // Handle display for empty cart
      if (CART.size === 0) {
        $('.oder__first-col').hide();
        $('.oder__second-col').hide();
        $('.order__empty-cart').show();
      }

      // Don't Display count of zero.
      if (count === 0) {
        $('#sidebar__order-count').hide();
      }
    });

  // Get order at any interval of time.
  $('#dynamic__load-dashboard')
    .off('click', '.order__history-table #inventory__searchbar')
    .on('click', '.order__history-table #inventory__searchbar', function() {
      const startDate = $('.order__history-table #inventory__filter-start--date').val();
      const endDate = $('.order__history-table #inventory__filter-end--date').val();

      const startDateFormated = britishDateFormat(startDate);
      const endDateFormated = britishDateFormat(endDate);
      if (!startDate || !endDate) {
        showNotification('Start date and end date required', true);
        return;
      }

      $('.order__filter').removeClass('highlight-btn'); 
      const url = API_BASE_URL + `/orders/${startDate}/${endDate}/get`
      fetchData(url)
        .then(({ accumulated_sum, orders }) => {
          $('.order__history--table-body').empty();

          if (!orders) {
            $('#expenditure__total__amount-entry').text(0);
            return;
          }
          $('.order_history-title ').text(
            `${startDateFormated} to ${endDateFormated} History`
          );

          orders.forEach(({ order, customer, user }) => {
            const date = britishDateFormat(order.created_at);
            $('.order__history--table-body').append(
              orderHistoryTableTemplate(order, date, customer)
            );

            $('#expenditure__total__amount-entry')
              .text(accumulated_sum.toLocaleString())
          })
            .catch((error) => {
              console.log(error);
            });
        });
    });
});
