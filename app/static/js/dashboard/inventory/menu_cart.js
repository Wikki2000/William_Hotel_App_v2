import {
  getBaseUrl, confirmationModal, validateForm, closeConfirmationModal,
  showNotification, ajaxRequest, fetchData, britishDateFormat,
  togleTableMenuIcon, updateElementCount, hideAllInventoryDashboard,
  canadianDateFormat,
} from '../../global/utils.js';

import {
  expenditureTableTemplate, inventoryFilterTemplate, gameTableTemplate,
  drinkTableTemplate, salesTableTemplate, foodTableTemplate
} from '../../global/templates1.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');

  // Show tables of different cart on click
  $('#dynamic__load-dashboard')
    .off('click', '.inventory__cart-container .inventory-cart')
    .on('click', '.inventory__cart-container .inventory-cart', function() {
      const $clickItem = $(this);
      const clickItemId = $clickItem.attr('id');

      // Higlight inventory cart click
      $clickItem.siblings().removeClass('highlight__inventory-cart');
      $clickItem.addClass('highlight__inventory-cart');


	    // Hide to add new stock from manager.
	    if (USER_ROLE === 'manager') {     
		    $('.stock__item-heading').hide();         
	    } 

      hideAllInventoryDashboard();
      $('.inventory__filter').empty();

      switch (clickItemId) {
        case 'inventory__expenditure-cart': {
          const today_date = canadianDateFormat(new Date());
          const url = (
            API_BASE_URL + `/expenditures/${today_date}/${today_date}/get`
          );

          $('#expenditure__list-table--body').empty();

          fetchData(url)
          .then(({ daily_expenditures }) => {
            daily_expenditures.forEach(({ id, title, amount, created_at, entry_date }) => {
              const date = britishDateFormat(created_at);
              $('#expenditure__list-table--body')
                .append(expenditureTableTemplate(id, title, date, amount));
            });
          })
          .catch((error) => {
            console.log(error);
          });
          $('.expenditure__section').show();

          // Append the date filter to div
          $('.expenditure.expenditure__section .inventory__filter')
          .append(inventoryFilterTemplate());
          break;
        }
        case 'inventory__profit-cart': {

          // Load the filter template
          $('#sales__profit-list .inventory__filter')
          .append(inventoryFilterTemplate());

          $('#sales__profit-table--body').empty();
          $('#sales__profit-list').show();

          const url = API_BASE_URL + '/sales';
          fetchData(url)
          .then((data) => {
            data.forEach((sale, index) => {
              const totalSales = (
                sale.food_sold + sale.drink_sold + sale.room_sold +
                sale.laundry_sold + sale.game_sold
              );
              const date = britishDateFormat(sale.entry_date);
              $('#sales__profit-table--body')
                .append(
                  salesTableTemplate(index, sale.id, sale.is_approved, totalSales, date, USER_ROLE)
                ); 
            });
          })
          .catch((error) => {
            console.log(error);
          });
          break;
        }
        case 'inventory__food-cart': {
          $('#food__stock-table--container').show();
          $('#food__table-body').empty();

          $('input[name="Search Input"]')
          .attr('placeholder', 'Search for Food Name');

          sessionStorage.setItem('pageId', 'inventoryFoodList');

          const foodUrl = API_BASE_URL + '/foods';
          fetchData(foodUrl)
          .then((data) => {

            // To be use by search bar while searching for drink
            const food = JSON.stringify(data);  
            sessionStorage.setItem('cacheInventoryData', food);
            data.forEach((food, index) => {
              const date = britishDateFormat(food.updated_at);
              $('#food__table-body')
                .append(foodTableTemplate(index, food, date));
            });
          })
          .catch((error) => {
            console.log(error);
          });
          break;
        }
        case 'inventory__drink-cart': {
          $('#drink__stock-list').show();
          const drinkUrl = API_BASE_URL + '/drinks';
          $('#drink__stock-table--body').empty();

          // To be used by search bar to search for item depending on the page
          sessionStorage.setItem('pageId', 'inventoryDrinkList');
          $('input[name="Search Input"]')
          .attr('placeholder', 'Search for Drink Name');

          fetchData(drinkUrl)
          .then((data) => {
            // To be use by search bar while searching for drink
            const drink = JSON.stringify(data);
            sessionStorage.setItem('cacheInventoryData', drink);

            data.forEach((drink, index) => {
              const date = britishDateFormat(drink.updated_at);
              $('#drink__stock-table--body')
                .append(drinkTableTemplate(index, drink, date));
            });
          })
          .catch((error) => {
            console.log(error);
          });
          break;
        }
        case 'inventory__game-cart': {
          $('#games__list-container').show();
          const gameUrl = API_BASE_URL + '/games';
          fetchData(gameUrl)
          .then((data) => {
            data.forEach((game, index) => {
              const date = britishDateFormat(game.updated_at);
              $('#games__table--body')
                .append(gameTableTemplate(index, game, date));
            });
          })
          .catch((error) => {
            console.log(error);
          });
        }
      }
    });
});
