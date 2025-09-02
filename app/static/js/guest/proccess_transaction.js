import {
  getBaseUrl, fetchData,
  ajaxRequest, getQueryParam
} from '../global/utils.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];

  // Handle confirming of payment.
  const ref = getQueryParam('ref');

  const confirmUrl = API_BASE_URL + "/online/booking/payment-complete";
  ajaxRequest(confirmUrl, 'POST', JSON.stringify({ ref }),
    (response) => {
      const successUrl = "/guest/booking/payment-success";
      window.location.href = successUrl;
    },
    (error) => {
      console.log(error);
    }
  );
});
