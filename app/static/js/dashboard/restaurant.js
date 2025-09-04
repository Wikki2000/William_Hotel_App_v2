import  { fetchData, getBaseUrl, highLightOrderBtn } from '../global/utils.js';
import  { displayFoodDrink } from '../global/templates.js';

$(document).ready(function() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];

  $('#dynamic__load-dashboard').on('click', '.order-btn', function() {
    const $clickBtn = $(this);

    const itemId = $clickBtn.data('id');
    const itemType = $clickBtn.data('type');  // E.g., food or drink
    const itemAmount = $clickBtn.data('amount');
    const itemPrice = itemAmount
    const itemName = $clickBtn.data('name');
    const itemQty = 1; // Initiate count to one once an item is selected

    if (CART.has(itemId)) {
      // If item exists, remove it
      CART.delete(itemId);
      $clickBtn.removeClass('highlight-btn');
    } else {
      // If item does not exist, add it
      CART.set(itemId, { itemType, itemName, itemAmount, itemPrice, itemQty });
      $clickBtn.addClass('highlight-btn');
    }

    // Show the count of item order added to cart.
    if (CART.size !== 0) {
      $('#sidebar__order-count').text(CART.size);
      $('#sidebar__order-count').show();
    } else {
      $('#sidebar__order-count').hide();
    }
  });

  // Switch price of food & drink in different terminal
  $('#dynamic__load-dashboard').on('click', '.restaurant__bar', function() {
    const $clickBtn = $(this);
    $('.restaurant__bar').removeClass('highlight-btn');
    $clickBtn.addClass('highlight-btn');

    const clickId = $clickBtn.attr('id');
    const pageId = sessionStorage.getItem('pageId');
    $('#restaurant__food--drinks').empty();

    // Handle filtering of items in restaurant e.g., foods, drinks etc.
    switch(clickId) {
      case 'open-bar': {
        const restaurantBar = JSON.parse(localStorage.getItem('restaurant'));
        if (pageId === "sidebar__restaurant") {
          displayFoodDrink("open_bar", restaurantBar, null);
        } else {
          displayFoodDrink("open_bar", null, restaurantBar);
        }
        break;
      }
      case 'game__house': {
        const restaurantBar = JSON.parse(localStorage.getItem('restaurant'));
        if (pageId === "sidebar__restaurant") {
          displayFoodDrink("game_house", restaurantBar, null);
        } else {
          displayFoodDrink("game_house", null, restaurantBar);
        }
        break;
      }
      case 'club__house': {
        const restaurantBar = JSON.parse(localStorage.getItem('restaurant'));
        if (pageId === "sidebar__restaurant") {
          displayFoodDrink("club_house", restaurantBar, null);
        } else {
          displayFoodDrink("club_house", null, restaurantBar);
        }

        break;
      }
      case 'private__lounge': {
        const restaurantBar = JSON.parse(localStorage.getItem('restaurant'));
        if (pageId === "sidebar__restaurant") {
          displayFoodDrink("private_lounge", restaurantBar, null);
        } else {
          displayFoodDrink("private_lounge", null, restaurantBar);
        }
	break;
      }
      case 'vip__lounge': {
        const restaurantBar = JSON.parse(localStorage.getItem('restaurant'));
        if (pageId === "sidebar__restaurant") {
          displayFoodDrink("vip_lounge", restaurantBar, null);
        } else {
          displayFoodDrink("vip_lounge", null, restaurantBar);
        }
        break;
      }
    }
  });
});
