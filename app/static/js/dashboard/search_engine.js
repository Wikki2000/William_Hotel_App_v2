import {
  britishDateFormat, fetchData, canadianDateFormat, getBaseUrl
} from '../global/utils.js';

import  {
  guestListTableTemplate,
} from '../global/templates.js';

import  {
  orderHistoryTableTemplate, drinkTableTemplate, foodTableTemplate
} from '../global/templates1.js';


function searchFoodDrinkStock(stockList, searchKey) {

  if (searchKey) {
    const searchItems = stockList.filter(
      item => item.name.toLowerCase().includes(searchKey)
    );

    //  Return the search items if found.
    //  Else return all the stock.
    if (searchItems) {
      return searchItems;
    } else {
      return [];
    }
  } else {
    return stockList;
  }
}

$(document).ready(function() {

  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];

  $('#search__bar').on('click', function(){
    const currentPageId = sessionStorage.getItem('pageId');
    const searchString = $('input[name="Search Input"]').val();

    switch (currentPageId) {
      case 'sidebar__guest': {

        const bookingUrl = API_BASE_URL + `/bookings?search_string=${searchString}`;

        const $tableBody = $(".guest-table-body");
        $tableBody.empty();

        fetchData(bookingUrl)
        .then((response) => {
          response.forEach(({ guest, booking, room }) => {
            const checkInDate = britishDateFormat(booking.checkin);
            const checkoutDate = britishDateFormat(booking.checkout);
            const date = { checkInDate, checkoutDate };
            $tableBody.append(
              guestListTableTemplate(guest, booking, room, date)
            );
          });
        })
        .catch((error) => {
          console.error("Error fetching room data:", error);
        });
        break;
      }
      case 'sidebar__order': {
        const orderUrl = API_BASE_URL + `/order-items?search_string=${searchString}`;
        $('.order__history--table-body').empty();
        $('.order_history-title').text('Guest Unpaid Bill'); 
        $('.order__filter').removeClass('highlight-btn');
        $('#order__filter-pending').addClass('highlight-btn');
        fetchData(orderUrl)
        .then((orders) => {
          orders.forEach(({ order, customer }) => {
            const date = britishDateFormat(order.created_at);
            $('.order__history--table-body').append(
              orderHistoryTableTemplate(order, date, customer)
            );
          });
        })
        .catch((error) => {
          console.log(error);
        });
        break;
      }
        /*
      case 'inventoryFoodList': {
        const cacheItemStr = sessionStorage.getItem('cacheInventoryData');
        const itemList = JSON.parse(cacheItemStr);

        data.forEach((food, index) => {
          const date = britishDateFormat(food.updated_at);
          $('#food__table-body')
            .append(foodTableTemplate(index, food, date));
        });
        break;
      }
      case 'inventoryDrinkList': {
        const cacheItemStr = sessionStorage.getItem('cacheInventoryData');
        const itemList = JSON.parse(cacheItemStr);

        searchFoodDrinkStock(itemList)
        data.forEach((drink, index) => {
          const date = britishDateFormat(drink.updated_at);
          $('#drink__stock-table--body')
            .append(drinkTableTemplate(index, drink, date));
        });
        break;
      }
      */
    }
  });

  // Filter on input of each text
  $('input[name="Search Input"]').on('input', function() {
    const currentPageId = sessionStorage.getItem('pageId');
    const cacheItemStr = sessionStorage.getItem('cacheInventoryData');
    const stockList = JSON.parse(cacheItemStr);

    const searchKey = $('input[name="Search Input"]')
      .val().trim().toLowerCase();

    switch (currentPageId) {
      case 'inventoryFoodList': {
        const searchStockList = searchFoodDrinkStock(stockList, searchKey);

        $('#food__table-body').empty();
        searchStockList.forEach((food, index) => {
          const date = britishDateFormat(food.updated_at);
          $('#food__table-body')
            .append(foodTableTemplate(index, food, date));
        });
        break;
      }
      case 'inventoryDrinkList': {
        const searchStockList = searchFoodDrinkStock(stockList, searchKey);

        $('#drink__stock-table--body').empty();
        searchStockList.forEach((drink, index) => {
          const date = britishDateFormat(drink.updated_at);
          $('#drink__stock-table--body')
            .append(drinkTableTemplate(index, drink, date));
        });
        break;
      }
    }

  });
});
