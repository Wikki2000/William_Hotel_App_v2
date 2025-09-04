import {
  getBaseUrl, closeConfirmationModal,
  showNotification, fetchData, britishDateFormat,
  togleTableMenuIcon, updateElementCount, getQueryParam
} from '../../global/utils.js';

import {
  expenditureTableTemplate, inventoryFilterTemplate,
  saleSummaryTemplate, saleSummaryTemplateFoodDrink,
} from '../../global/templates1.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  const service = getQueryParam('service');
  const date = getQueryParam('date');
  const totalAmount = getQueryParam('total');

  $('#sales__record-date').text(date);

  if (service === 'room') {
    $("#food__drink-salesContainer").remove();
    $('#sales__record-title').text(`Room Sales Record (Total: ${totalAmount})`);
    const roomSalesUrl = API_BASE_URL + `/bookings/${date}/${date}/get`
    fetchData(roomSalesUrl)
      .then(({ bookings }) => {
        bookings?.forEach((sale, index) => {
          let description = '', time;
          if (sale.booking.is_short_rest) {
            description ='Short Time';
            time = 'Hours';
          } else if (sale.booking.is_late_checkout) {
            description ='Late Checkout';
            time = 'Hours';
          } else if (sale.booking.is_half_booking) {
            description ='Half Day';
            time = 'Hours';
          } else {
            description ='Full Time';
            time = 'Night(s)';
          }

          const roomName = sale.room ? sale.room.name : "Deleted Room";
          const roomNumber = sale.room ? sale.room.number : "xxx";
          $('#sales-table-body').append(saleSummaryTemplate(
            index, sale.id,
            `${roomName} (${roomNumber}) ${description}`,
            `${sale.booking.duration} ${time}`, sale.booking.amount, true, sale.room.amount
          ));
        });
      })
      .catch((error) => {
        console.log(error);
      });
    return;
  }

  if (service === 'food') {
    $('#sales__record-title').text(`Food Sales Record (Total: ${totalAmount})`);
    $("#game__laundry-salesContainer").remove();
  } else if (service === 'drink') {
    $('#sales__record-title').text(`Drink Sales Record (Total: ${totalAmount})`);
    $("#game__laundry-salesContainer").remove();
  } else if (service === 'laundry') {
    $('#sales__record-title').text(`Laundry Sales Record (Total: ${totalAmount})`);
    $("#food__drink-salesContainer").remove();
  } else if (service === 'game') {
    $('#sales__record-title').text(`Game Sales Record  (Total: ${totalAmount})`);
    $("#food__drink-salesContainer").remove();
  }

  const url = API_BASE_URL + `/sales/${date}/${date}/${service}/group-summary`;
  fetchData(url)
    .then((data) => {
      data.forEach((sale, index) => {
        if (service === 'game' || service === 'laundry') {
          $('#sales-table-body').append(saleSummaryTemplate(
            index, sale.id, sale.name, sale.sold_stock + ' pcs', sale.amount, false, sale.unit_price
          ));
        } else {
          $('.drink__food-salesTable-body').append(saleSummaryTemplateFoodDrink(index, sale));
        }
      });
    })
    .catch((error) => {
      console.log(error);
    });

});
