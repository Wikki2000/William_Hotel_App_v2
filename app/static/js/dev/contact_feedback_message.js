import {
  fetchData,
  ajaxRequest,
  getQueryParam,
  getBaseUrl,
  getFormDataAsDict,
  sanitizeInput,
} from "../../global/utils.js";


$(document).ready(function () {
  const API_BASE_URL = getBaseUrl()["apiBaseUrl"];
  const APP_BASE_URL = getBaseUrl()["appBaseUrl"];

  const messageType = getQueryParam("message_type");
  const hotel_id = getQueryParam("hotel_id");

  //Load user contact or feedback messages
  if (hotel_id && messageType) {

    const msgUrl = API_BASE_URL + `/user-messages/${hotel_id}/${messageType}`;
    fetchData(msgUrl)
      .then(({ messages, user }) => {
        messages.forEach((message) => {
          $("#message__container").append(`
          <div class="feedback-item">
            <div class="hotel-info">${user.name}</div>
            <div class="hotel-email"><i>${user.email} (${user.contact})</i></div>
            <div class="hotel-message">${message.message}</div>
            <!--<i data-id="${message.id}" class="fas fa-trash delete-icon"></i>-->
          </div>
        `);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // Delete user contact or feedback messaes
  $("#message__container").on("click", ".delete-icon", function() {
    const heading = (
      "Are you sure, you want to remove this Course?"
    );
    const subHeading2 = (
      "This action will remove this course from " +
      "all enroll student and compile result."
    );
    const deleteBtnId = "delete__course-btn";
    $("#popup-modal").append(
      warningPopup(deleteBtnId, heading, subHeading2)
    );

    $('#dynamic__load-dashboard')
      .off('click', '#delete__course-btn')
      .on('click', '#delete__course-btn', function() {
        const deleteCourseUrl = API_BASE_URL + `/courses/${courseId}/delete`;
        closeConfirmationModal();
        ajaxRequest(deleteCourseUrl, 'DELETE', null,
          (response) => {
            $('#order__confirmation-modal').empty();
            $(`tr[data-id="${courseId}"]`).remove();
            const description = ("Item deleted successfully!");
            $("#popup-modal").append(successfullAction(description));
          },
          (error) => {
            console.log(error);
          }
        );
      });
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

