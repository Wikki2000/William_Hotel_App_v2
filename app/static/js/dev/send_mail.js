import {
  fetchData,
  ajaxRequest,
  getBaseUrl,
  showNotification,
  britishDateFormat,
  closeConfirmationModal,
} from "../../global/utils.js";
import {
} from "../../global/templates.js";


$(document).ready(function () {
  const API_BASE_URL = getBaseUrl()["apiBaseUrl"];
  const APP_BASE_URL = getBaseUrl()["appBaseUrl"];


  $("body").off("click", ".send__email")
    .on("click", ".send__email", function() {
      const id = $(this).data("id");
      $("#sendEmailOption").css("display", "flex");

      $("body").off("click", "#filer__apply-btn")
        .on("click", "#filer__apply-btn", function() {
          const mailType = $("select[name='email']").val()
          $("#sendEmailOption").hide();

          const data = [id]

          const subdomains = {
            trial: '/account/trial-reminder',
          }

          const url = API_BASE_URL + subdomains[mailType];
          const confirmAction = confirm("You are about to send an email.");
          if (confirmAction) {
            ajaxRequest(url, 'POST', JSON.stringify(data),
              (response) => {
                alert("Email Sent Successfuly!");
             },
              (error) => {
                console.log(error);
              }
            );
          }
        });
    });
});
