import {
  ajaxRequest, britishDateFormat, fetchData, getBaseUrl, canadianDateFormat,
  getFormDataAsDict, showNotification
} from '../../global/utils.js';

$(document).ready(() => {

  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');
  $('#dynamic__load-dashboard').off('submit', '#setting__reset-password')
    .on('submit', '#setting__reset-password', function(e) {
      e.preventDefault();
      const url = API_BASE_URL + "/users/update-password";
      const $form = $(this);
      const data = getFormDataAsDict($form);

      if (data.new_password !== data.confirm_password) {
        showNotification("Password Must Match", true);
        return;
      }
      const isConfirm = confirm("Are you sure you want to change your password? Click OK to continue.");
      if (!isConfirm) return;

      $('#settings-modal-overlay').fadeOut(200);

      ajaxRequest(url, 'POST', JSON.stringify(data),
        (response) => {
          showNotification("Password Update Successfully !");
        },
        (error) => {
          console.log(error);
        }
      );
    });
});
