import { ajaxRequest, getBaseUrl } from "../../global/utils.js";

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()["apiBaseUrl"];
  const APP_BASE_URL = getBaseUrl()["appBaseUrl"];

  $("#logout").click(function() {
    const url = API_BASE_URL + '/admin/account/logout';
    ajaxRequest(url, "DELETE", null,
      (response) => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = APP_BASE_URL + '/admin/account/login';
      },
      (error) => {
        console.log(error);
      }
    )
  });
});
