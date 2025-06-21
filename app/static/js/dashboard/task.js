import {
  ajaxRequest, getBaseUrl, validateForm, confirmationModal, getFormDataAsDict,
  showNotification, fetchData, closeConfirmationModal, togleTableMenuIcon
} from '../global/utils.js';
import  { taskListTemplate } from '../global/templates1.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');

  // Show popup menu to enter year for VAT lists
  $('#dynamic__load-dashboard')
    .off('click', '#main__vat-view--btn, #main__cat-view--btn')
    .on('click', '#main__vat-view--btn, #main__cat-view--btn', function() {
      const clickItemId = $(this).attr('id');

      //$(".main__vatCatAmount").hide();

      if (clickItemId == 'main__vat-view--btn') {
        $('#main__vatCat-btn').text('View Monthly VAT');
        $(".main__vatCatAmount").text("VAT: ₦0");
        $('#task__type').val('vat');
      } else if (clickItemId == 'main__cat-view--btn') {
        $('#main__vatCat-btn').text('View Monthly CAT');
        $(".main__vatCatAmount").text("CAT: ₦0");
        $('#task__type').val('cat');
      }
      $(".main__vatCatAmt-container").hide();
      $('#main__vat-year--inputPopup').css('display', 'flex');
    });

  $('#dynamic__load-dashboard').on("change", "#main__enter-vat--yearForm input", function() {
    $(".main__vatCatAmt-container").hide();
  });

  // Calculate VAT/CAT
  $('#dynamic__load-dashboard')
    .off('submit', '#main__enter-vat--yearForm')
    .on('submit', '#main__enter-vat--yearForm', function(e) {

      e.preventDefault();
      const $formElement = $(this);
      const vatYear = $('#main__vat-year--input').val();
      const taskType = $('#task__type').val(); 

      const data = getFormDataAsDict($formElement);
      const url = API_BASE_URL + `/tasks/${data.start_date}/${data.end_date}/${taskType}/get`;
      fetchData(url)
        .then((response) => {
          $(".main__vatCatAmount").html(`<strong>${taskType.toUpperCase()}:</strong> ₦${response[taskType].toLocaleString()}`);
          $("#sales__amount").text("₦" + response.sale_amount.toLocaleString());
          $(".main__vatCatAmt-container").css("display", "flex");
        })
        .catch((error) => {
          console.log(error);
        });
    });
});
