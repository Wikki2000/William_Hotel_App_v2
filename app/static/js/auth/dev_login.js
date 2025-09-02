import {
  ajaxRequest, getBaseUrl, alertBox
} from '../global/utils.js'; 

$(document).ready(function () {

  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  $('#adminLoginForm').submit(function (event) {
    event.preventDefault();
    const alertDivClass = 'auth-alert';
    $('.loader').show();
    $("button[type='submit']").hide();

    const data = JSON.stringify(
      {
        email_or_username: $('#email_or_username').val().trim(),
        password: $('#password').val().trim(),
      }
    );
    const url = API_BASE_URL + '/admin/account/login';
    ajaxRequest(url, "POST", data,
      (response) => {
        // Set user ID and name in session for quick recovery.
        window.location.href = APP_BASE_URL + "/dev/dashboard";
      },
      (error) => {
        $('.loader').hide();
        $("button[type='submit']").show();
        alert("Wrong Login Credentials")
      }
    );
  })
});
