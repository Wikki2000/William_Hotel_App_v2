import {
  getBaseUrl, confirmationModal, validateForm, closeConfirmationModal,
  showNotification, ajaxRequest, fetchData, britishDateFormat,
  togleTableMenuIcon, updateElementCount, getFormDataAsDict, sanitizeInput,
} from '../../global/utils.js';

import {
  drinkTableTemplate, foodTableTemplate
} from '../../global/templates1.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');


  // Add or Update Food Stock
  $('#dynamic__load-dashboard')
    .off('click', '#food__table-body .food__update-stock, #stock__new-food')
    .on('click', '#food__table-body .food__update-stock, #stock__new-food',
      function() {

	const $clickItem = $(this);
	const foodId = $clickItem.data('id');

	$('#food__update-form').trigger('reset');

	togleTableMenuIcon();
	$('#food__update-modal').css('display', 'flex');

	if ($clickItem.hasClass('food__update-stock')) {

	  $('#food__update-modal').css('display', 'flex');

	  const url = API_BASE_URL + `/foods/${foodId}/get`;

	  fetchData(url)
	    .then((data) => {
	      $('input[name="name"]').val(data.name);
	      $('input[name="qty_stock"]').val(data.qty_stock);
	      $('input[name="amount"]').val(data.amount);
	    })
	    .catch((error) => {
	      console.log(error);
	    });
	  $('#food__update-form').addClass('stock__food-update');
	} else {
	  $('#food__update-modal').css('display', 'flex');
	  $('#food__update-form').addClass('stock__food-add');
	  $('#food__update-form').trigger('reset');
	}
	$('#dynamic__load-dashboard').off('submit', '#food__update-form')
	  .on('submit', '#food__update-form', function(e) {
	    e.preventDefault();
	    $('#food__update-modal').hide();

	    const $formElement = $(this);
	    const data = sanitizeInput(getFormDataAsDict($formElement));

	    let url;
	    let msg;
	    let method;
	    if ($formElement.hasClass('stock__food-add')) {
	      url = API_BASE_URL + '/foods';
	      msg = 'Stock Added Successfully !';
	      method = 'POST';
	    } else if ($formElement.hasClass('stock__food-update')) {
	      url = API_BASE_URL + `/foods/${foodId}/update`,
		method = 'PUT';
	      msg = 'Stock Updated Successfully !'
	    }

	    ajaxRequest(url, method, JSON.stringify(data),
	      (response) => {
		$formElement.trigger('reset');
		if ($formElement.hasClass('stock__food-add')) {
		  const date = britishDateFormat(response.updated_at);
		  $('#food__table-body')
		    .prepend(foodTableTemplate(-1, response, date));
		} else {
		  const qtyColor = response.qty_stock < 10 ? 'red': '';

		  $(`#food__table-body tr[data-id="${foodId}"] .name`).text(response.name);
		  $(`#food__table-body tr[data-id="${foodId}"] .amount`).text('₦' + response.amount.toLocaleString());
		  $(`#food__table-body tr[data-id="${foodId}"] .qty_stock`).text(response.qty_stock);
		  
		  $(`#food__table-body tr[data-id="${foodId}"] .qty_stock`).css('color', qtyColor);

		}
		$('#food__update-form').removeClass('stock__food-add');
		$('#food__update-form').removeClass('stock__food-update');
		showNotification(msg);
	      },
	      (error) =>{
		$('#food__update-form').removeClass('stock__food-add');
		$('#food__update-form').removeClass('stock__food-update');
		console.log(error);
	      }
	    );
	  });
      });

  // Add or Update Drink Stock
  $('#dynamic__load-dashboard')
    .off('click', '#drink__stock-table--body .inventory__update-stock, #drink__stock-list #stock__new-drink')
    .on('click', '#drink__stock-table--body .inventory__update-stock, #drink__stock-list #stock__new-drink',
      function() {

	const $clickItem = $(this);
	const drinkId = $clickItem.data('id');

	$('#stock__update-form').trigger('reset');

	if ($clickItem.hasClass('inventory__update-stock')) {

	  $('#stock__update-modal').css('display', 'flex');
	  togleTableMenuIcon();

	  const url = API_BASE_URL + `/drinks/${drinkId}/get`;

	  fetchData(url)
	    .then((data) => {
	      $('input[name="name"]').val(data.name);
	      $('input[name="qty_stock"]').val(data.qty_stock);
	      $('input[name="amount"]').val(data.amount);
	    })
	    .catch((error) => {
	      console.log(error);
	    });
	} else {
	  $('#stock__update-modal').css('display', 'flex');
	  $('#stock__update-form').addClass('stock__drink-add');
	}

	$('#dynamic__load-dashboard').off('submit', '#stock__update-form')
	  .on('submit', '#stock__update-form', function(e) {
	    e.preventDefault();
	    $('#stock__update-modal').hide();

	    const $formElement = $(this);
	    const data = sanitizeInput(getFormDataAsDict($formElement));

	    const request = (
	      $formElement.hasClass('stock__drink-add') ? 
	      {
		url: API_BASE_URL + '/drinks', method: 'POST',
		msg: 'Stock Added Successfully !'
	      } :
	      {
		url: API_BASE_URL + `/drinks/${drinkId}/update`,
		method: 'PUT', msg: 'Stock Updated Successfully !'
	      }
	    );

	    ajaxRequest(request.url, request.method, JSON.stringify(data),
	      (response) => {
		$formElement.trigger('reset');
		if ($formElement.hasClass('stock__drink-add')) {
		  const date = britishDateFormat(response.updated_at);
		  $('#drink__stock-table--body')
		    .prepend(drinkTableTemplate(-1, response, date));
		} else {
		  const qtyColor = data.qty_stock < 10 ? 'red': '';

		  $(`#drink__stock-table--body tr[data-id="${drinkId}"] .name`).text(response.name);
		  $(`#drink__stock-table--body tr[data-id="${drinkId}"] .qty_stock`).text(response.qty_stock);
		  $(`#drink__stock-table--body tr[data-id="${drinkId}"] .amount`).text('₦' + response.amount.toLocaleString());

		  $(`#drink__stock-table--body tr[data-id="${drinkId}"] .qty_stock`).css('color', qtyColor);
		}
		$('#stock__update-form').removeClass('stock__drink-add');
		showNotification(request.msg);
	      },
	      (error) =>{
		$('#stock__update-form').removeClass('stock__drink-add');
		console.log(error);
	      }
	    );
	  });
      });

  // Remove Drink from stock
  $('#dynamic__load-dashboard').off('click', '.inventory__delete-stock')
    .on('click', '.inventory__delete-stock', function() {
      const drinkId = $(this).data('id');

      // Load confirmation modal
      const headingText = 'Confirm Removal of Item';
      const descriptionText = 'This action cannot be undone !'
      const confirmBtCls = 'remove__stock-drink';

      confirmationModal(headingText, descriptionText, confirmBtCls);

      $('#dynamic__load-dashboard').off('click', '.remove__stock-drink')
	.on('click', '.remove__stock-drink', function() {
	  const deleteUrl = API_BASE_URL + `/drinks/${drinkId}/delete`;

	  closeConfirmationModal();

	  ajaxRequest(deleteUrl, 'DELETE', null,
	    (response) => {
	      $(`#drink__stock-table--body tr[data-id="${drinkId}"]`).remove();
	      updateElementCount($('#stock__count-drink'));
	      showNotification('Drink deleted successfully');
	    },
	    (error) => {
	      showNotification('An errpr occured. Try again !');
	    }
	  );
	});
    });

  // Remove Food from stock
  $('#dynamic__load-dashboard').off('click', '.food__delete-stock')
    .on('click', '.food__delete-stock', function() {
      const foodId = $(this).data('id');

      // Load confirmation modal
      const headingText = 'Confirm Removal of Item';
      const descriptionText = 'This action cannot be undone !'
      const confirmBtCls = 'remove__stock-food';

      confirmationModal(headingText, descriptionText, confirmBtCls);

      $('#dynamic__load-dashboard').off('click', '.remove__stock-food')
	.on('click', '.remove__stock-food', function() {
	  const deleteUrl = API_BASE_URL + `/foods/${foodId}/delete`;

	  closeConfirmationModal();
	  togleTableMenuIcon();

	  ajaxRequest(deleteUrl, 'DELETE', null,
	    (response) => {
	      $(`#food__table-body tr[data-id="${foodId}"]`).remove();
	      updateElementCount($('#stock__count-food'));
	      showNotification('Food deleted successfully');
	    },
	    (error) => {
	      showNotification('An errpr occured. Try again !');
	    }
	  );
	});
    });
});
