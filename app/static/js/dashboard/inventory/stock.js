import {
  getBaseUrl, confirmationModal, validateForm, closeConfirmationModal,
  showNotification, ajaxRequest, fetchData, britishDateFormat,
  togleTableMenuIcon, updateElementCount, getFormDataAsDict, sanitizeInput,
} from '../../global/utils.js';

import {
  drinkTableTemplate, foodTableTemplate,
  gameLaundryTableTemplate,
} from '../../global/templates1.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');
  const TERMINAL = localStorage.getItem('terminal');

  // Add or Update Stock
  $('#dynamic__load-dashboard')
    .off('click', '.add__update-stock')
    .on('click', '.add__update-stock', function() {
      const $clickItem = $(this);
      const clickItemId = $clickItem.data('id');
      const stockType = $("#current__stock-cart").val();

      const pageId = sessionStorage.getItem('pageId');
	    $('#update__stock-modal').css('display', 'flex');

      if (pageId === "inventoryFoodList" || pageId === "inventoryDrinkList") {
        $(".only__food-drink-field").show();
	      $(`#inventory__terminal-${TERMINAL}`).hide()
      } else {
	      $(`#inventory__terminal-${TERMINAL}`).show();
        $(".only__food-drink-field").hide();
      }

      $('#update__stock-modal-form').trigger('reset');

      togleTableMenuIcon();
      //$('#update__stock-modal').css('display', 'flex');

      const getUrl = {
        "food": `/foods/${clickItemId}/get`,
        "drink": `/drinks/${clickItemId}/get`,
        "game": `/games/${clickItemId}/get`,
        "laundry": `/laundries/${clickItemId}/get`,
      }

      if ($clickItem.hasClass('update-stock')) {
        $('#food__update-modal').css('display', 'flex');
        const url = API_BASE_URL + getUrl[stockType];

        fetchData(url)
          .then((data) => {
            $('input[name="name"]').val(data.name);
            $('input[name="qty_stock"]').val(data.qty_stock);
            $('input[name="amount"]').val(data.amount);
            $('input[name="amount_open_bar"]').val(data.amount_open_bar);
            $('input[name="amount_game_house"]').val(data.amount_game_house);
            $('input[name="amount_club_house"]').val(data.amount_club_house);
            $('input[name="amount_private_lounge"]').val(data.amount_private_lounge);
          })
          .catch((error) => {
            console.log(error);
          });
        $("#update__stock-method").val("PUT");
      } else {
        $('#food__update-modal').css('display', 'flex');
        $('#food__update-form').trigger('reset');
        $("#update__stock-method").val("POST");
      }
      $('#dynamic__load-dashboard').off('submit', '#update__stock-modal-form')
        .on('submit', '#update__stock-modal-form', function(e) {
          e.preventDefault();
          $('#update__stock-modal').hide();

          const $formElement = $(this);
          const data = sanitizeInput(getFormDataAsDict($formElement));
          const method = $("#update__stock-method").val();

          if (stockType === "game" || stockType === "laundry") {
            delete data["qty_stock"];
          }

          const messages = {
            "PUT": 'Stock Updated Successfully !',
            "POST": 'Stock Added Successfully !'
          };
          const urlDict = {
            "food": {
              "POST": API_BASE_URL + '/foods',
              "PUT": API_BASE_URL + `/foods/${clickItemId}/update`,
            },
            "drink": {
              "POST": API_BASE_URL + '/drinks',
              "PUT": API_BASE_URL + `/drinks/${clickItemId}/update`,
            },
            "game": {
              "POST": API_BASE_URL + '/games',
              "PUT": API_BASE_URL + `/games/${clickItemId}/update`,
            },
            "laundry": {
              "POST": API_BASE_URL + '/laundries',
              "PUT": API_BASE_URL + `/laundries/${clickItemId}/update`,
            },
          }

          const url = urlDict[stockType][method];
          ajaxRequest(url, method, JSON.stringify(data),
            (response) => {
              $formElement.trigger('reset');
              const date = britishDateFormat(response.updated_at);
              if (method === "POST") {
                if (stockType === "food") {
                  $('#food__table-body')
                    .prepend(foodTableTemplate(-1, response, date));
                } else if (stockType === "drink") {
                  $('#drink__stock-table--body')
                    .prepend(drinkTableTemplate(-1, response, date));
                } else if (stockType === "game") {
                  $("#games__table--body")
                    .prepend(gameLaundryTableTemplate(-1, response, date));
                } else if (stockType === "game" || stockType === "laundry") {
                  $("#games__table--body")
                    .prepend(gameLaundryTableTemplate(-1, response, date));
                }
                const $stockCount = $(`#stock__count-${stockType}`);
                updateElementCount($stockCount, true);
              } else {
                const qtyColor = response.qty_stock < 10 ? 'red': '';

                const date = britishDateFormat(response.updated_at);
                $(`tr[data-id="${clickItemId}"] .date`).text(date);
                $(`tr[data-id="${clickItemId}"] .name`).text(response.name);
                $(`tr[data-id="${clickItemId}"] .amount`).text('₦' + (response.amount ?? 0).toLocaleString());

                $(`tr[data-id="${clickItemId}"] .amount_open_bar`).text('₦' + (response?.amount_open_bar ?? 0).toLocaleString());
                $(`tr[data-id="${clickItemId}"] .amount_club_house`).text('₦' + (response?.amount_club_house ?? 0).toLocaleString());
                $(`tr[data-id="${clickItemId}"] .amount_game_house`).text('₦' + (response?.amount_game_house ?? 0).toLocaleString());
                $(`tr[data-id="${clickItemId}"] .amount_private_lounge`).text('₦' + (response?.amount_private_lounge ?? 0).toLocaleString());

                $(`tr[data-id="${clickItemId}"] .qty_stock`).text(response.qty_stock); 
                $(`tr[data-id="${clickItemId}"] .qty_stock`).css('color', qtyColor);

              }
              showNotification(messages[method]);
            },
            (error) =>{
              console.log(error);
            }
          );
        });
    });

  // Remove stock
  $('#dynamic__load-dashboard').off('click', '.delete-stock')
    .on('click', '.delete-stock', function() {
      const clickItemId = $(this).data('id');
	    alert(clickItemId);

      // Load confirmation modal
      const headingText = 'Confirm Removal of Item';
      const descriptionText = 'This action cannot be undone !'
      const confirmBtCls = 'remove__stock-food';

      confirmationModal(headingText, descriptionText, confirmBtCls);
      const stockType = $("#current__stock-cart").val();
      const deleteUrl = {
        "food": API_BASE_URL + `/foods/${clickItemId}/delete`,
        "drink": API_BASE_URL + `/drinks/${clickItemId}/delete`,
        "game": API_BASE_URL + `/games/${clickItemId}/delete`,
        "laundry": API_BASE_URL + `/laundries/${clickItemId}/delete`,
      }

      $('#dynamic__load-dashboard').off('click', '.remove__stock-food')
        .on('click', '.remove__stock-food', function() {
          closeConfirmationModal();
          togleTableMenuIcon();

          ajaxRequest(deleteUrl[stockType], 'DELETE', null,
            (response) => {
              $(`tr[data-id="${clickItemId}"]`).remove();
              updateElementCount($(`#stock__count-${stockType}`));
              showNotification(`${stockType} deleted successfully`);
            },
            (error) => {
              showNotification('An errpr occured. Try again !');
            }
          );
        });
    });
});
