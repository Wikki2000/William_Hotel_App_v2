import { ajaxRequest, getBaseUrl, goBack, getQueryParam } from '../global/utils.js';

$(document).ready(function() {
  const APP_BASE_URL =  getBaseUrl()['appBaseUrl'];
  const API_BASE_URL =  getBaseUrl()['apiBaseUrl'];

  // Listen for input event on each code-input field
  $('input[type="text"]').on('input', function() {
    // Check any value is entered and not the end of input field.
    if ($(this).val !== '' && $(this).next().length) {
      $(this).next().focus();
    }
  });

  // Listen for backspace to navigate to the previous input
  $('input[type="text"]').on('keydown', function(e) {
    let $current = $(this);
    if (e.key === 'Backspace' && $current.val() === '' && $current.prev().length) {
      $current.prev().focus();
    }
  });

  goBack('back-arrow'); // Go back to prev page

  $('#otp-form').submit(function (event) {
    event.preventDefault();

    $('.loader').show();
    $('#otp-btn').hide();

    const token = (
      $('#first-digit').val() + $('#second-digit').val() +
      $('#third-digit').val() + $('#fourth-digit').val() +
      $('#fifth-digit').val() + $('#sixth-digit').val()
    )
    const data = JSON.stringify({ token });

    const url = API_BASE_URL + '/account/validate-token';
    ajaxRequest(url, "POST", data,
      (response) => {
	sessionStorage.removeItem('email');
        window.location.href = APP_BASE_URL + '/account/reset-password';
      },
      (error) => {

        // Hide loader and display button to user on error
        $('.loader').hide();
        $('#otp-btn').show();
        $('#complete-modal').show();
      }
    );
  });

  // Handle resending of token
  $('#resend__token-btn, #resend-otp').click(function() {
    const email = sessionStorage.getItem('email');
    const data = JSON.stringify({ email: email });
    const url = API_BASE_URL + '/account/reset-token';

    ajaxRequest(url, "POST", data,
      (response) => {
        $('#complete-modal').hide();
      },
      (error) => {
        $('.loader').hide();
        $('#otp-btn').show();
      }
    );
  });

  // Cancel the pop-up modal
  $('#cancel-btn').click(function() {
    $('#complete-modal').hide();
  });

});
