$(document).ready(function() {
  // Hide dropdown menus when clicking outside
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.dropdown').length) {
      $('.dropdown-menu').hide();
    }
  });

  // cancel confirmation modal
  $('#dynamic__load-dashboard').on('click', '#order__cancel-btn, .closePopupModal', function(){
    $('#order__popup-modal').hide();
    $('.popup-modal').hide();

    // Reset form for VAT/CAT Modal when cancel.
    $('#main__enter-vat--yearForm').trigger("reset");
  });

  // Display Table menu
  $('#dynamic__load-dashboard').on('click', '.fa-ellipsis-v', function() {
    const $clickItem = $(this);

    $clickItem.closest('td').siblings('.manage').show(); // Show table menu

    // Toggle visibility of icon to show and cancel table menu
    $clickItem.hide();
    $clickItem.closest('td').find('.fa.fa-times').show();
  });

  // Cancel table menu
  $('#dynamic__load-dashboard').on('click', '.fa.fa-times', function () {
    const $clickItem = $(this);
    $clickItem.hide();
    $clickItem.closest('td').find('.fa.fa-ellipsis-v').show();
    $clickItem.closest('td').siblings('.manage').hide();
  });

  // Use the class (ensure__sentence-case) for the input to change to sentence case.
  $('#dynamic__load-dashboard').off('change', '.ensure__sentence-case')
    .on('change', '.ensure__sentence-case', function() {           
      const text = $('.ensure__sentence-case').val();
      const sentenceCase = text[0].toUpperCase() + text.slice(1);
      $('.ensure__sentence-case').val(sentenceCase);
    }); 

	/*
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
      const entityId = $clickItem.data('id');

      let url;
      if (pageId === 'sidebar__order') {
        url = API_BASE_URL + `/orders/${entityId}/payment-method`;
      } else if (pageId === 'sidebar__guest') {
      }

      const data = { payment_method: paymentType };

      ajaxRequest(orderUrl, 'PUT', JSON.stringify(data),
        (response) => {
          console.log(response);
          $(`tr[data-id="${entityId}"] .payment__type`).text(paymentType);
          showNotification("Payment Status Updated Successfully!");
        },
        (error) => {
          console.log(error);
        }
      );

    });
    */
});
