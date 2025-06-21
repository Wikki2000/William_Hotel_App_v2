import {
  getBaseUrl, confirmationModal, validateForm, closeConfirmationModal,
  showNotification, ajaxRequest, fetchData, britishDateFormat,
  togleTableMenuIcon, hideAllInventoryDashboard, getFormDataAsDict,
  getActualAmount, sanitizeInput, updateElementCount, canadianDateFormat
} from '../../global/utils.js';

import {
  expenditureTableTemplate, inventoryFilterTemplate, salesTableTemplate,
} from '../../global/templates1.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  const USER_ROLE = localStorage.getItem('role');
  const USER_ID = localStorage.getItem('userId');

  // Form to craete comments.
  $('#dynamic__load-dashboard')
    .off('submit', '#sale__comment-form')
    .on('submit', '#sale__comment-form', function(e) {
      e.preventDefault();
      const $fromElement = $(this);
      const comment = $("#sales__comment-input").val();
      const sale_id = $("#sale__id").val();
      const method = $("#sale__method").val();

      let data = { sale_id, comment };
      let url, msg;
      if (method === "POST") {
        url = API_BASE_URL + '/comments';
        msg = `Your comment has been recorded successfully !`;
      } else if (method === "PUT") {
        const commentId = sale_id;
        url = API_BASE_URL + `/comments/${commentId}/update`;
        data = { comment }
        msg = 'Comment updated successfully !';
      }

      $("#write__sales-comment").hide();

      ajaxRequest(url, method, JSON.stringify(data),
        (response) => {
          $fromElement.trigger("reset");
          showNotification(msg);
        },
        (error) => {
          console.log(error);
        }
      );
    });

  // Show delete and edit icon on hover and when no hovering
  $('#dynamic__load-dashboard').on('mouseenter', '.comment__begins', function () {
    const $clickItem = $(this);

    const userId = $clickItem.data('user-id');
    if (userId === USER_ID) {
      $clickItem.find('.sales__comment-actionIcon').css('visibility', 'visible');
    }
  });
  $('#dynamic__load-dashboard').on('mouseleave', '.comment__begins', function () {
    $(this).find('.sales__comment-actionIcon').css('visibility', 'hidden');
  });

  // Handle deleting of comments
  $('#dynamic__load-dashboard')
    .off('click', '.delete__sale-comment')
    .on('click', '.delete__sale-comment', function() {
      const $clickItem = $(this);

      const commentId = $clickItem.data('id');

        const headingText = 'Confirm';
        const descriptionText = 'This action cannot be undone !'
        const confirmBtCls = 'comment__delete-confirmBtn';

        confirmationModal(headingText, descriptionText, confirmBtCls);

        $('#dynamic__load-dashboard')
          .off('click', `.${confirmBtCls}`)
          .on('click', `.${confirmBtCls}`, function() {
		  closeConfirmationModal();

            const url = API_BASE_URL + `/comments/${commentId}/delete`;
            ajaxRequest(url, 'DELETE', null,
              (response) => {
                $clickItem.parents('.comment__begins').remove();
                showNotification(`Comment Remove successfully !`);
              },
              (error) => {
                console.log(error);
              }
            );
          });
      });

  // Auto fill the text field to edit.
    $('#dynamic__load-dashboard')
      .off('click', '.edit__sale-comment')
      .on('click', '.edit__sale-comment', function() {     
        const $clickItem = $(this);
        const commentId  = $clickItem.data('id');
        const commentUrl = API_BASE_URL + `/comments/${commentId}`;

        $("#view__sales-comment").hide()

        fetchData(commentUrl)
          .then((data) => {
            $("#sales__comment-input").val(data.comment);
            $("#sale__method").val("PUT");
            $("#sale__id").val(data.id);
          })
          .catch((error) => {
            console.log(error);
          });
        $("#write__sales-comment").css("display", "flex");
      });
});


