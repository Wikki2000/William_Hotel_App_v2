import {
  getBaseUrl, closeConfirmationModal,
  showNotification, fetchData, canadianDateFormat,
  togleTableMenuIcon, updateElementCount, getQueryParam
} from '../../global/utils.js';

import {
  expenditureTableTemplate, inventoryFilterTemplate,
  dailyServiceSaleTableTemplate,
} from '../../global/templates1.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  const service = getQueryParam('service');
  const date = canadianDateFormat(new Date());

  $('#sales__record-date').text(date);

  if (service === 'room') {
    $('#sales__record-title').text('Today Room Sales Record');
    const roomSalesUrl = API_BASE_URL + `/bookings/${date}/${date}/get`
    fetchData(roomSalesUrl)
      .then(({ bookings }) => {
        bookings.forEach((sale, index) => {
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
          $('.sales-table-body').append(dailyServiceSaleTableTemplate(
            index, sale.booking.id, sale.booking.is_paid, sale.guest.name,
            `${sale.room.name} (${sale.room.number}) ${description}`,
	    `${sale.booking.duration} ${time}`, sale.booking.amount, true
          ));
        });
      })
      .catch((error) => {
        console.log(error);
      });
    return;
  }

  if (service === 'food') {
    $('#sales__record-title').text('Today Food Sales Record');
  } else if (service === 'drink') {
    $('#sales__record-title').text('Today Drink Sales Record');
  } else if (service === 'laundry') {
    $('#sales__record-title').text('Today Laundry Sales Record');
  } else if (service === 'game') {
    $('#sales__record-title').text('Today Game Sales Record');
  }
  const url = API_BASE_URL + `/sales/${date}/${date}/${service}`;
  fetchData(url)
    .then((data) => {
      data.forEach((sale, index) => {
        $('.sales-table-body').append(dailyServiceSaleTableTemplate(
          index, sale.order_id, sale.is_paid, sale.customer,
          sale.item_name, sale.quantity, sale.amount, false
        ));
      });
    })
    .catch((error) => {
      console.log(error);
    });

});
