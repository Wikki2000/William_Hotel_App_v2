import { togglePasswordVisibility, ajaxRequest, getBaseUrl } from '../global/utils.js'; 

$(document).ready(function () {

  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  togglePasswordVisibility('password', 'passwordIconId');
  $('#login-form').submit(function (event) {
    event.preventDefault();
    const alertDivClass = 'auth__alert__msg';
    $(`.${alertDivClass}`).hide();
    $('.loader').show();
    $('#signin-btn').hide();

    const terminal = $("#terminal").val()
    const data = JSON.stringify(
      {
        email_or_username: $('#email_or_username').val().trim(),
        password: $('#password').val().trim(), terminal
      }
    );
    const url = API_BASE_URL + '/account/login';
    ajaxRequest(url, "POST", data,
      ({ hotel, user }) => {
        // Set user ID and name in session for quick recovery.
        localStorage.setItem('userName', user.username);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('role', user.role);
        localStorage.setItem('performance', user.performance);
        localStorage.setItem("terminal", terminal);

        localStorage.setItem("shortRestAmount", hotel.short_time_amount);
        localStorage.setItem("earlyCheckinAmount", hotel.early_checkin_amount);
        localStorage.setItem("lateCheckoutAmount", hotel.late_checkout_amount);
        localStorage.setItem("lateCheckoutDuration", hotel.late_checkout_time);
        localStorage.setItem("shortTimeDuration", hotel.short_time_hours);
        localStorage.setItem("halfDayDuration", hotel.half_day_duration);

        $('input, select').addClass('correct-password');
        setTimeout(() => {
          window.location.href = APP_BASE_URL + '/dashboard';
        }, 2000);
      },
      (error) => {
        if (error.status === 401) {
        $('#error-box').show();
        $('input').addClass('error-password');
        } else {
          alert("Request timed out. Please check your internet connection");
        }
        // Hide loader and display button to user on error
        $('.loader').hide();
        $('#signin-btn').show();
      }
    );
  })
});
