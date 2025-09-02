import {
  fetchData,
  ajaxRequest,
  getBaseUrl,
  sanitizeInput,
  getFormattedTime,
  britishDateFormat,
  getFormDataAsDict,
  canadianDateFormat,
} from "../global/utils.js";


$(document).ready(function () {
  const API_BASE_URL = getBaseUrl()["apiBaseUrl"];
  const APP_BASE_URL = getBaseUrl()["appBaseUrl"];

    const errorUrl = API_BASE_URL + "/errors/log";
    fetchData(errorUrl)
      .then((response) => {
        response.forEach((data) => {
	  const sts = (
	    data.treated ?
	    { "text": "Treated", "class": "treated"} :
	    { "text": "Unreated", "class": "untreated"}
	  );
          $("#errorlog__table-body").append(`
	    <tr data-status="treated">
              <td><input type="checkbox" class="row-checkbox"></td>
	      <td>${data?.bussiness_name}</td>
	      <td>${britishDateFormat(data.created_at)}</td>
	      <td>${getFormattedTime(data.created_at)}</td>
              <td>${data.method}</td>
              <td>${data.path}</td>
              <td><span class="badge bg-warning text-dark">Untreated</span></td>
	      <td>
	        <div class="dropdown">
	          <button class="btn btn-sm btn-light" data-bs-toggle="dropdown">
                    &#x22EE;
		  </button>
		  <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="showStatusModal()">Update Status</a></li>
                    <li><a class="dropdown-item" href="#" data-error="${data?.trace}" onclick="showErrorModal()">View Error</a></li>
                    <li><a class="dropdown-item delete text-danger" data-id="${data?.id}" href="#">Delete</a></li>
                    <ul style="display: none"class="error__log">${data?.trace}</ul>
		  </ul>
	        </div>
	      </td>
	    </tr>
        `);
        });
      })
      .catch((error) => {
        console.log(error);
      });

  // Display the error traceback trace back.
  $("#errorlog__table-body")
    .off("click", ".dropdown-item")
    .on("click", ".dropdown-item", function() {
      const $clickItem = $(this);
      const error = $clickItem.closest("div").find(".error__log").text();
      $("#error__text").text(error);
    });

  // Delete user contact or feedback messaes
    $("#errorlog__table-body")
      .off('click', '.delete')
      .on('click', '.delete', function() {
        const $element = $(this);
        const errorId = $element.data("id");
        const url = API_BASE_URL + `/errors/${errorId}/delete`;

        const confirmDelete = confirm("You are about to delete an error. Please click ok to procceed");
        if (!confirmDelete) return;
        ajaxRequest(url, 'DELETE', null,
          (response) => {
            $element.closest("tr").remove();
            alert("Error Delete successfully");
          },
          (error) => {
            console.log(error);
          }
        );
      });

  // Handle submission of user feedback and contact form.
  $('#contactForm, #feedbackForm').on('submit', function (e) {
    e.preventDefault();
    const $formElement = $(this);
    const formId = $formElement.attr("id");

    const data = getFormDataAsDict($formElement);

    const url = (
      formId === "contactForm" ?
      API_BASE_URL + "/user-messages/contact" :
      API_BASE_URL + "/user-messages/feedback" 
    );

    ajaxRequest(url, "POST", JSON.stringify(data),
      (response) => {

      },
      (error) => {
        console.log(error);
      }
    );
  });

});
