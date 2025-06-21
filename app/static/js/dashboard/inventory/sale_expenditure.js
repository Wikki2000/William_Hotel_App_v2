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

  // Get sales at any interval of time.
  $('#dynamic__load-dashboard')
    .off('click', '#sales__profit-list #inventory__searchbar')
    .on('click', '#sales__profit-list #inventory__searchbar', function() {
      const startDate = $('#sales__profit-list #inventory__filter-start--date').val();
      const endDate = $('#sales__profit-list #inventory__filter-end--date').val();
      const startDateFormat = britishDateFormat(startDate);
      const endDateFormat = britishDateFormat(endDate);

      if (!startDate || !endDate) {
        showNotification('Start date and end date required', true);
        return;
      }
      $('#sales__profit-table--body').empty();
      /*
      $('#Daily__sales-title').text(
        `${startDateFormat} to ${endDateFormat} Sales`
      );*/
      const url = API_BASE_URL + `/sales/${startDate}/${endDate}/get`
      fetchData(url)
        .then(({ daily_sales, accumulated_sum }) => {
          daily_sales.forEach((sale, index) => {
            const totalSales = (
              sale.food_sold + sale.drink_sold + sale.room_sold +
              sale.laundry_sold + sale.game_sold
            );
            const date = britishDateFormat(sale.created_at);
            $('#sales__profit-table--body')
              .append(salesTableTemplate(index, sale.id, sale.is_approved, totalSales, date, USER_ROLE));
          });
          $('#expenditure__total__amount-entry')
            .text(accumulated_sum.toLocaleString())
        })
        .catch((error) => {
          console.log(error);
        });
    });


  // Get expenditure at any interval of time.
  $('#dynamic__load-dashboard')
    .off('click', '.expenditure #inventory__searchbar')
    .on('click', '.expenditure #inventory__searchbar', function() {
      const startDate = $('#inventory__filter-start--date').val();
      const endDate = $('#inventory__filter-end--date').val();

      if (!startDate || !endDate) {
        showNotification('Start date and end date required', true);
        return;
      }
      const url = API_BASE_URL + `/expenditures/${startDate}/${endDate}/get`
      fetchData(url)
        .then(({ daily_expenditures, daily_expenditure_sum }) => {
          $('#expenditure__list-table--body').empty();
          daily_expenditures.forEach(({ id, title, amount, created_at }) => {
            const date = britishDateFormat(created_at);
            $('#expenditure__list-table--body')
              .append(expenditureTableTemplate(id, title, date, amount));
          });
          $('#expenditure__total__amount-entry')
            .text(daily_expenditure_sum.toLocaleString())
        })
        .catch((error) => {
        });
    });

  // Show expenditures details
  $('#dynamic__load-dashboard')
    .off('click', '#expenditure__list-table--body .expenditure__details')
    .on('click', '#expenditure__list-table--body .expenditure__details',
      function() {
        const url = API_BASE_URL + `/expenditures/${$(this).data('id')}/get`;

        togleTableMenuIcon();

        fetchData(url)
          .then(({ id, title, amount, created_at, description }) => {
            const date = britishDateFormat(created_at);

            $('#expenditure__date').text(date);
            $('#expenditure__title').text(title);
            $('#expenditure__amount').text('₦' + amount.toLocaleString());
            $('#expenditure__description').text(description); 
          })
          .catch((error) => {
            console.log(error);
          });
        $('#expenditure__details').css('display', 'flex');
      });

  // Delete expenditure
  $('#dynamic__load-dashboard')
    .off('click', '#expenditure__list-table--body .expenditure__delete')
    .on('click', '#expenditure__list-table--body .expenditure__delete',
      function() {
        const $clickItem = $(this);
        const clickItemId = $clickItem.data('id');
        const url = API_BASE_URL + `/expenditures/${clickItemId}/delete`;

        togleTableMenuIcon();

        const headingText = 'Confirm';   
        const descriptionText = 'This action cannot be undone !'     
        const confirmBtCls = 'expenditure__delete-confirmBtn';

        confirmationModal(headingText, descriptionText, confirmBtCls);

        $('#dynamic__load-dashboard')
          .off('click', '.expenditure__delete-confirmBtn')
          .on('click', '.expenditure__delete-confirmBtn', function() {
            $('#order__confirmation-modal').empty();

            ajaxRequest(url, 'DELETE', null,
              (response) => {
                const dailyTotalExpenseStr = $('#daily__expenditures').text();
                const expensesAmountStr = $clickItem.closest('td')
                  .siblings('.expenditure__amount').text();

                const dailyTotalExpense = getActualAmount(dailyTotalExpenseStr);
                const expensesAmount = getActualAmount(expensesAmountStr);

                $('#daily__expenditures').text(dailyTotalExpense - expensesAmount);
                $(`#expenditure__list-table--body tr[data-id="${clickItemId}"]`).remove();
                showNotification('Expenditure Remove successfully !');
              },

              (error) => {
                console.log(error);
              }
            );
          });
      });

  // Add new expenditures
  $('#dynamic__load-dashboard')
    .off('submit', '#inventory__expenditure-form')
    .on('submit', '#inventory__expenditure-form', function(e) {
      e.preventDefault();

      const $formElement = $(this);
      const amount = $('#inventory__expenditure-amount').val();
      const title = $('#inventory__expenditure-title').val();
      const description = $('#inventory__expenditure-description').val();

      const data = { amount, title, description };

      const headingText = 'Confirm Adding Expenditure';
      const descriptionText = 'This action cannot be undone !'
      const confirmBtCls = 'inventory__expenditure-confirmBtn';

      confirmationModal(headingText, descriptionText, confirmBtCls);

      // Send POST request to create daily expenditures.
      $('#dynamic__load-dashboard')
        .off('click', '.inventory__expenditure-confirmBtn')
        .on('click', '.inventory__expenditure-confirmBtn', function() {
          const url = API_BASE_URL + '/expenditures';

          closeConfirmationModal();
          $formElement.trigger('reset');  // Reset form

          ajaxRequest(url, 'POST', JSON.stringify(data),
            ({ id, title, amount, created_at }) => {
              const date = britishDateFormat(created_at);
              togleTableMenuIcon();
              showNotification('Today expenses added successfully !');
              $('#expenditure__list-table--body')
                .prepend(expenditureTableTemplate(id, title, date, amount));

              // Update the amount in the daily expenditures cart.
              const $targetElement = $('#daily__expenditures');
              const elementValue = parseFloat(
                $('#daily__expenditures').text()
                .replaceAll(',', '').replaceAll('₦', '')
              );
              const updatedValue = (
                updateElementCount($targetElement, true, amount, elementValue)
              );
              $targetElement.text(updatedValue.toLocaleString());
            },
            (error) => {
              togleTableMenuIcon();
              showNotification('An error occured, please try again', true);
            }
          );
        });
    });

  // Handle service table menu
  $('#dynamic__load-dashboard').off('click', '.sales__menu')
    .on('click', '.sales__menu', function() {
      const $clickItem = $(this);
      const saleId = $clickItem.data('id');

      togleTableMenuIcon();

      if ($clickItem.hasClass('sales__details')) {
        const url = API_BASE_URL + `/sales/${saleId}/get`;
        fetchData(url)
          .then((sale) => {
            const totalSales = (
              sale.food_sold + sale.drink_sold + sale.room_sold +
              sale.laundry_sold + sale.game_sold
            );

            $('#sales__date').text(britishDateFormat(sale.entry_date));
            $('#total__food-sale').html('&#8358;' + sale.food_sold.toLocaleString());
            $('#total__drink-sale').html('&#8358;' + sale.drink_sold.toLocaleString());
            $('#total__game-sale').html('&#8358;' + sale.game_sold.toLocaleString());
            $('#total__room-sale').html('&#8358;' + sale.room_sold.toLocaleString());
            $('#total__laundry-sale').html('&#8358;' + sale.laundry_sold.toLocaleString());
            $('#total__pos-sale').html('&#8358;' + sale.pos.toLocaleString());
            $('#total__transfer-sale').html('&#8358;' + sale.transfer.toLocaleString());
            $('#total__cash-sale').html('&#8358;' + sale.cash.toLocaleString());
            $('#total__pending-sale').html('&#8358;' + sale.pending.toLocaleString());
            $('#total__sale').html('&#8358;' + totalSales.toLocaleString());
            $('#sales__summary-date').val(canadianDateFormat(sale.entry_date));
          })
          .catch((error) => {
            console.log(error);
          });
        $('#sales__breakdown').css('display', 'flex');
      } else if ($clickItem.hasClass('make-comment')) {
        // This operation is handle ini sale_comments.js
        $("#write__sales-comment").css('display', 'flex');
	$("#sale__method").val("POST");
	$("#sale__id").val(saleId);
      } else if ($clickItem.hasClass('sales__view-comment')) {
        const year = $(`tr[data-id="${saleId}"] .sale__year`).text();
        const amount = $(`tr[data-id="${saleId}"] .sale__amount`).text();

        const msg = `${year} Sales Comment (${amount})`;
        $("#comment__list-heading").text(msg)

        const commentUrl = API_BASE_URL + `/comments/${saleId}/get`;

        fetchData(commentUrl)
          .then((data) => {
	    if (data.length === 0) {
	      alert('Comment Box Empty!');
	      return;
	    }
            $('#sale__comment-container').empty();
	    $('#view__sales-comment').css('display', 'flex');
            data.forEach((comment) => {
              const commentBy = (
                comment.user_id === USER_ID ? { by: 'Me', role: '' } : 
                { by: comment.comment_by, role: `(${comment.role})` }
              );
              
              const commentDate = britishDateFormat(comment.created_at);
              $('#sale__comment-container').append(`
                <div data-user-id="${comment.user_id}" class="comment__begins">
                  <strong class="sale__comment-subContainer">
                    <p class="comment__by">
                      <i>
                        By ${commentBy.by} ${commentBy.role} on ${commentDate}
                      </i>
                    </p>
                    <p class="sales__comment-actionIcon">
                      <i data-id="${comment.id}" class="fa fa-trash cursor delete__sale-comment"></i>&nbsp;&nbsp;
                      <i data-id="${comment.id}" class="fa fa-edit cursor edit__sale-comment"></i> 
                    </p> 
                  </strong>

                  <p class="comment__content">${comment.comment}</p>
                </div>
              `);
            });

          })
          .catch((error) => {
            console.log(error);
          });
      } else if ($clickItem.hasClass('approved__record')) {
        // Load confirmation modal to approved sales.
        const confirmBtCls = 'sale__confirm-btn';
        const headingText = 'Confirm Sale Approval';
        const descriptionText = 'This action cannot be undone !'
        confirmationModal(headingText, descriptionText, confirmBtCls)
      }

      // Approved sales record.
      $('#dynamic__load-dashboard').off('click', '.sale__confirm-btn')
        .on('click', '.sale__confirm-btn', function() {
          const saleStatusUrl = (
            API_BASE_URL + `/sales/${saleId}/approve-sale`
          );

          ajaxRequest(saleStatusUrl, 'PUT', null,
            (response) => {
              $('#order__confirmation-modal').empty();
              showNotification(`Sales Record Approved Successfully !`);
              $(`tr[data-id="${saleId}"]`)
                .find('.sale__status').text('Approved');

              $(`tr[data-id="${saleId}"]`)
                .find('.sale__status').css('color', 'green');
            },
            (error) => {
              showNotification('An error occurred. Please try again.', true);
              $('#order__confirmation-modal').empty();
            }
          );
        });
    });

  // Load sales breakdown for a particular services
  $('#dynamic__load-dashboard').on('click', '.item__sold', function() {
    const $clickItem = $(this);
    const clickItemId = $clickItem.attr('id');
    const salesDate = $('#sales__summary-date').val();

    const today_date = canadianDateFormat(new Date());

    switch (clickItemId) {
      case 'total__food-sale--btn': {
	const totalAmount = $('#total__food-sale').text();
        const saleUrl = (
          APP_BASE_URL + `/pages/sales_details?service=food&date=${salesDate}&total=${totalAmount}`
        );
        window.open(saleUrl, '_blank');
        break;
      }
      case 'total__drink-sale--btn': {
	const totalAmount = $('#total__drink-sale').text();
        const saleUrl = (
          APP_BASE_URL + `/pages/sales_details?service=drink&date=${salesDate}&total=${totalAmount}`
        );
        window.open(saleUrl, '_blank');
        break;
      }
      case 'total__game-sale--btn': {
	const totalAmount = $('#total__game-sale').text();
        const saleUrl = (
          APP_BASE_URL + `/pages/sales_details?service=game&date=${salesDate}&total=${totalAmount}`
        );
        window.open(saleUrl, '_blank');
        break;
      }
      case 'total__laundry-sale--btn': {
	const totalAmount = $('#total__laundry-sale').text();
        const saleUrl = (
          APP_BASE_URL + `/pages/sales_details?service=laundry&date=${salesDate}&total=${totalAmount}`
        );
        window.open(saleUrl, '_blank');
        break;
      }
      case 'total__room-sale--btn': {
        const totalAmount = $('#total__room-sale').text();
        const saleUrl = (
          APP_BASE_URL + `/pages/sales_details?service=room&date=${salesDate}&total=${totalAmount}`
        );
        window.open(saleUrl, '_blank');
        break;
      }
    }
  });

  // Hide expenditure entry for wider view of expense table.
  $('#dynamic__load-dashboard')
    .off('click', '#hide__expenditure-entry')
    .on('click', '#hide__expenditure-entry', function() {
      $('#expenditure__entry').toggle();
      $('#expenditures__headings').toggleClass('expenditure__entry-shrink');
    });
});
