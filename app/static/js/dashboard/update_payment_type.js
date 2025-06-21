import {
  getBaseUrl, confirmationModal, fetchData,
  closePaymentModal, showNotification, ajaxRequest,
} from '../global/utils.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  $('#dynamic__load-dashboard')
    .off('click', '#payment__type')
    .on('click', '#payment__type', function() {

      $('#update__paymentType-dropdown').show();

      $('#dynamic__load-dashboard')
        .off('click', '.update__dropdown-selector')
        .on('click', '.update__dropdown-selector', function() {
          const $clickItem = $(this);
          const selectedMenu = $clickItem.text();

          $('#payment__type span').text(selectedMenu);
          $('#update__paymentType-dropdown').hide();
        });
    });

  $('#dynamic__load-dashboard')
    .off('click', '#confirm__payment-type')
    .on('click', '#confirm__payment-type', function() {
      const $clickItem = $(this);
      const paymentType = $('#payment__type span').text();
      const pageId = sessionStorage.getItem('pageId');
      const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
      const entityId = $('#entity__id').val();

      closePaymentModal();

      let url;
      if (pageId === 'sidebar__order') {
        url = API_BASE_URL + `/orders/${entityId}/payment-method`;
      } else if (pageId === 'sidebar__guest') {
      }

      const data = { payment_method: paymentType };

      ajaxRequest(url, 'PUT', JSON.stringify(data),
        (response) => {
          $(`tr[data-id="${entityId}"] .payment__type`).text(paymentType);
          showNotification("Payment Status Updated Successfully!");
        },
        (error) => {
          console.log(error);
        }
      );

    });
});
