import {
  britishDateFormat, compareDate, getFormattedDate, fetchData, ajaxRequest,
  canadianDateFormat, getBaseUrl, highLightOrderBtn, cartItemsTotalAmount,
  getHtmlTemplate
} from '../global/utils.js';
import  {
  displayFoodDrink, displayRoomData, guestListTableTemplate, gameTemplate,
  roomTableTemplate, orderItemsTempleate, staffListTemplate,
  laundryTableTemplate
} from '../global/templates.js';
import {
  expenditureTableTemplate, displayMaintenance, staffManagementCommonCart,
  inventoryFilterTemplate
} from '../global/templates1.js';
import { initAllStores } from '../global/init_cache.js';
import { loadDashbard } from './load_dashboard.js';


const cache = await initAllStores();
cache.clear_all();

$(document).ready(function() {

  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  const TERMINAL = localStorage.getItem('terminal');

  // Display basic info in sidebar
  const userUrl = API_BASE_URL + `/members/${userId}`;
  fetchData(userUrl)
    .then(({ first_name, last_name, email, username, profile_photo, performance }) => {
      const image = profile_photo === "null" || profile_photo === null ? null : profile_photo;
      const photoSrc = (
        image ? `data:image/;base64, ${profile_photo}` :
        '/static/images/public/profile_photo_placeholder.png'
      );

      const displayEmail = (
        email.length > 23 ? email.slice(0, 23) + '...' : email
      );

      const displayUsername = (
        username.length > 7 ? username.slice(0, 7) + '...' : username
      );


      $('#sidebar__email').attr('title', email);

      $('#sidebar__name').text(`${first_name} ${last_name}`);
      $('#sidebar__email').text(displayEmail);
      $('.sidebar__profile-image').attr('src', photoSrc);
      $('#main__username').text(displayUsername);
      $('#main__username').attr('title', username);

      const staffPerformanceColor = (
        performance < 50 ? 'red' : 'green'
      );
      $('#staff_performance-indexing')
        .text(String(performance) + '%');
      $('#staff_performance-indexing')
        .css('color', staffPerformanceColor);
    })
    .catch((error) => {
      console.log(error);
    });

  // Show service menu
  $('#sidebar__service').click(function() {
    $('#service__menu').toggleClass('hide');
    $('#service__dropdown').toggleClass('rotate__360deg-clockwise');

    // Highlight service sidebar only when the menu is selected and visibility hidden
    if (
      ($('#sidebar__game').hasClass('highlight-sidebar') ||
        $('#sidebar__restaurant').hasClass('highlight-sidebar') ||
        $('#sidebar__laundry').hasClass('highlight-sidebar') ||
        $('#sidebar__bar').hasClass('highlight-sidebar') 
      ) && $('#service__menu').hasClass('hide')
    ) {
      $('#sidebar__service').addClass('highlight-sidebar');
    } else {
      $('#sidebar__service').removeClass('highlight-sidebar');
    }
  });

  // Handle side nav bar menu click
  $('#sidebar__staff--profile-btn').click(function() {

    const $clickItem =$(this);
    $('.sidebar__nav-icon').removeClass('highlight-sidebar');
    $('.sidebar__profile-row').addClass('highlight-sidebar');
    $clickItem.css('color', 'white');
    $('.notifications-dropdown').removeClass('hidden');
  });

  $('.sidebar__nav-icon').off('click').on('click', async function() {
    const $clickItem = $(this);
    const clickId = $clickItem.attr('id');

    sessionStorage.setItem('pageId', clickId);

    const roomTemplate = await cache.get_by("html", { id: "rooms" });
    const roomData = await cache.get_by("data", { id: "rooms" });

    //$('#dynamic__load-dashboard').html(roomTemplate)

    // The default search bar placeholder
    $('input[name="Search Input"]').attr('placeholder', 'Search');
    $('input[name="Search Input"]').val('');

    $clickItem.siblings().removeClass('highlight-sidebar');
    $clickItem.addClass('highlight-sidebar');

    // Handle behavior when ellipsis icon is click.
    $('.sidebar__profile-row').removeClass('highlight-sidebar');
    $('#sidebar__staff--profile-btn').css('color', 'black');
    $('.notifications-dropdown').addClass('hidden');

    $('#dynamic__load-dashboard').empty(); // Empty to load a new section.

    if (!$clickItem.closest('service__menu').hasClass('service__menu')) {
      $('.sidebar__nav-icon').removeClass('highlight-sidebar');
      $(this).addClass('highlight-sidebar');
    }

    if (clickId !== 'sidebar__main') {
      $(".header").show();
    } else {
      $(".header").hide();
    }

    // Remove all cache data when loading different page..
    sessionStorage.removeItem('guestData');  // Set in guest_list.js to auto-fill booking form
    sessionStorage.getItem('cacheInventoryData');  // Set in 
    localStorage.removeItem('restaurant');
    localStorage.removeItem('cacheService');

    switch(clickId) {
      case 'sidebar__main': {
        const dashboardUrl = APP_BASE_URL + '/pages/main_dashboard';
        const roomTemplate = await cache.get_by("html", { id: "dashboard" });

        if (roomTemplate) {
          $('#dynamic__load-dashboard').html(roomTemplate);
          loadDashbard();
        } else {
          $('#dynamic__load-dashboard').load(dashboardUrl, function() {
            loadDashbard();
          });
        }
        break;
      }
      case 'sidebar__Room': {
        function loadRooms(roomList) {
          if (USER_ROLE === 'staff') {
            displayRoomData(roomList, true);
          } else {
            displayRoomData(roomList);
            $('#add-room').show();
          }
        }

        const url = APP_BASE_URL + '/pages/room_service';
        const roomTemplate = await cache.get_by("html", { id: "rooms" });
        const roomData = await cache.get_by("data", { id: "rooms" });

        if (roomTemplate && roomData) {
          $('#dynamic__load-dashboard').html(roomTemplate);
          loadRooms(roomData.rooms);
        } else {
          $('#dynamic__load-dashboard').load(url, function() {
            $('#rooms').addClass('highlight-btn');
            const roomUrl =  API_BASE_URL + '/rooms'

            const loadedHtml = getHtmlTemplate();
            cache.save_one('html', { id: 'rooms', value: loadedHtml });
            fetchData(roomUrl)
              .then((response) => {
                loadRooms(response.rooms);
                cache.save_one('data', { id: 'rooms', value: response });
              })
              .catch((error) => {
                console.error('Failed to fetch room data:', error);
              });
          });
        }
        break;
      }
      case 'sidebar__guest': {
        const url = APP_BASE_URL + '/pages/guest_list';
        $('#dynamic__load-dashboard').load(url, function() {
          const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
          const bookingUrl = API_BASE_URL + '/bookings';
          const $tableBody = $(".guest-table-body");

          $('input[name="Search Input"]')
            .attr('placeholder', 'Search for Guest Name');

          $('#rooms').addClass('highlight-btn');
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
        });
        break;
      }
      case 'sidebar__restaurant' :
      case 'sidebar__bar': {

        function searchFoodDrink(is_food) {
          $('input[name="Search Input"]').on('input', function() {
            const restaurants = JSON.parse(localStorage.getItem('restaurant'));
            const searchKey = $('input[name="Search Input"]')
              .val().trim().toLowerCase();
            $('#restaurant__food--drinks').empty();

            if ($("#open-bar").hasClass("highlight-btn")) {
              terminal = "open_bar";
            } else if ($("#club__house").hasClass("highlight-btn")) {
              terminal = "club_house";
            } else if ($("#game__house").hasClass("highlight-btn")) {
              terminal = "game_house";
            } else if ($("#private__lounge").hasClass("highlight-btn")) {
              terminal = "private_lounge";
            }

            if (searchKey) {
              const searchItems = restaurants.filter(
                item => item.name.toLowerCase().includes(searchKey)
              );
              if (is_food) {
                displayFoodDrink(terminal, searchItems, null);
              } else {
                displayFoodDrink(terminal, null, searchItems);
              }
            } else {
              if (is_food) {
                displayFoodDrink(terminal, restaurants, null);
              } else {
                displayFoodDrink(terminal, null, restaurants);
              }
            }
            highLightOrderBtn(CART); // Highlight btn on chart.
          });
        }
        const url = APP_BASE_URL + '/pages/restaurant';
        const template = await cache.get_by("html", { id: "restaurant" });
        const foods = await cache.get_by("data", { id: "foods" })
        const drinks = await cache.get_by("data", { id: "drinks" });

        if (TERMINAL === TERMINAL_ONE) $(".food-categories").remove();

        let terminal = TERMINAL === TERMINAL_ONE ? "t1" : "open_bar";
        if (foods && template && clickId === 'sidebar__restaurant') {
          $('#dynamic__load-dashboard').html(template);
	  if (TERMINAL === TERMINAL_ONE) $(".food-categories").remove();
          displayFoodDrink(terminal, foods, null);
          $('input[name="Search Input"]')
            .attr('placeholder', 'Search for Foods');
          highLightOrderBtn(CART); // Highlight btn of items in cart
          localStorage.setItem('restaurant', JSON.stringify(foods));
        } else if (drinks && template && clickId === 'sidebar__bar') {
          $('#dynamic__load-dashboard').html(template);
	  if (TERMINAL === TERMINAL_ONE) $(".food-categories").remove();
          $('input[name="Search Input"]')
            .attr('placeholder', 'Search for Drinks');
          displayFoodDrink(terminal, null, drinks);
          localStorage.setItem('restaurant', JSON.stringify(drinks));
          highLightOrderBtn(CART); // Highlight btn of items in cart
        } else {

          $('#dynamic__load-dashboard').load(url, function() {
            const loadedHtml = getHtmlTemplate();
            cache.save_one("html", { id: "restaurant", value: loadedHtml });
            if (TERMINAL === TERMINAL_ONE) {
              $(".food-categories").remove();
            }

            if (clickId === 'sidebar__restaurant') {
              searchFoodDrink(true);
              $('#restaurant__bar-title').text('Foods Menu List');
              const foodUrl = API_BASE_URL + '/foods';
              $('input[name="Search Input"]')
                .attr('placeholder', 'Search for Foods');

              fetchData(foodUrl)
                .then((foods) => {
                  cache.save_one('data', { id: 'foods', value: foods });
                  displayFoodDrink(terminal, foods, null);
                  highLightOrderBtn(CART); // Highlight btn of items in cart

                  localStorage.setItem('restaurant', JSON.stringify(foods));
                })
                .catch((error) => {
                  console.log(error);
                });

            } else if (clickId === 'sidebar__bar') {
              $('input[name="Search Input"]')
                .attr('placeholder', 'Search for Drinks');
              searchFoodDrink(false);
              $('#restaurant__bar-title').text('Drinks Menu List');
              const drinkUrl = API_BASE_URL + '/drinks';
              fetchData(drinkUrl)
                .then((drinks) => {
                  cache.save_one('data', { id: 'drinks', value: drinks });
                  displayFoodDrink(terminal, null, drinks);
                  highLightOrderBtn(CART); // Highlight btn of items in cart

                  localStorage.setItem(
                    'restaurant', JSON.stringify(drinks)
                  );
                })
                .catch((error) => {
                  console.log(error);
                });
            }
          });
        }
        break;
      }
      case 'sidebar__order': {

        function loadOrderPage() {
          $('.order__empty-cart').hide();
          $('.oder__first-col').hide();

          if (CART.size !== 0) {
            $('.oder__first-col').show();
            CART.forEach((value, key) => {
              $('#oder__first-col').append(orderItemsTempleate(key, value));
            });

            // Auto-fill with total cost
            const totalAmount = cartItemsTotalAmount(CART);
            $('#order__total--amout-cart')
              .val('₦' + totalAmount.toLocaleString());
          } else {
            $('.order__empty-cart').show();
            $('.oder__second-col').hide();
          }
        }
        const url = APP_BASE_URL + '/pages/order';

        $('input[name="Search Input"]')
        .attr('placeholder', 'Search for Guest Pending Orders');
        const template = await cache.get_by("html", { id: "orders" });

        if (!template) {
          $('#dynamic__load-dashboard').load(url, function() {
            const loadedHtml = getHtmlTemplate();
            cache.save_one("html", { id: "orders", value: loadedHtml });
            loadOrderPage();

          });
        } else {
          $('#dynamic__load-dashboard').html(template);
          loadOrderPage();
        }
        break;
      }
      case 'sidebar__logout': {
        const url = API_BASE_URL + '/account/logout';
        ajaxRequest(url, "DELETE", null,
          (response) => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = APP_BASE_URL + '/account/login';
          },
          (error) => {
            console.log(error);
          }
        );
        break;
      }
      case 'sidebar__staff-management': {
        const url = APP_BASE_URL + '/pages/staff_management';
        $('#dynamic__load-dashboard').load(url, function() {

          const userUrl = API_BASE_URL + '/users?is_delete=false';
          fetchData(userUrl)
            .then((response) => {
              response.forEach((data) => {
                if (USER_ROLE === 'manager') {
                  if (data.role !== 'manager') {
                    $('#staff__list-table--body').append(staffListTemplate(data));
                  }
                } else {
                  $('#staff__list-table--body').append(staffListTemplate(data)); 
                }
              });

              if (USER_ROLE === 'manager') {
                $('#add__staff-btn').remove();
              }
            })
            .catch((error) => {
              console.log(error);
            });
        });

        break;
      }
      case 'sidebar__inventory': {
        const url = APP_BASE_URL + '/pages/inventory';
        $('#dynamic__load-dashboard').load(url, function() {

          const today_date = canadianDateFormat(new Date());
          const expendituresUrl = (
            API_BASE_URL + `/expenditures/${today_date}/${today_date}/get`
          );

          $('#expenditure__list-table--body').empty();
          //$(`#inventory__terminal-${TERMINAL}`).remove();
          $(`.${TERMINAL}`).remove();

          fetchData(expendituresUrl)
            .then(({ daily_expenditures }) => {
              daily_expenditures.forEach(({ id, title, amount, created_at }) => {
                const date = britishDateFormat(created_at);
                $('#expenditure__list-table--body')
                  .append(expenditureTableTemplate(id, title, date, amount));
              });
            })
            .catch((error) => {
              console.log(error);
            });
          $('.expenditure__section').show();
          $('.expenditure.expenditure__section .inventory__filter')
            .append(inventoryFilterTemplate());

          const inventoryUrl = API_BASE_URL + '/inventories';
          fetchData(inventoryUrl)
            .then((data) => {
              $('#daily__expenditures').text(data.today_expenditures.toLocaleString());
              $('#daily__sales').text(data.today_sales.toLocaleString());
              $('#stock__count-drink').text(data.total_drinks);
              $('#stock__count-food').text(data.total_foods);
              $("#stock__count-game").text(data.total_games);
              $("#stock__count-laundry").text(data.total_laundries);
            })
            .catch((error) => {
              console.log(error);
            });
        });
        break;
      }

      case 'sidebar__game' : {
        const url = APP_BASE_URL + '/pages/game';
        const template = await cache.get_by("html", { id: "games" });
        const games = await cache.get_by("data", { id: "games" })

        if (template && games) {
          $('#dynamic__load-dashboard').html(template)
          games.forEach((game) => {
            $('#games__list').append(gameTemplate(game));
            highLightOrderBtn(CART); // Highlight btn of items in cart.
          });
          return;
        }
        $('#dynamic__load-dashboard').load(url, function() {
          const loadedHtml = getHtmlTemplate();
          cache.save_one("html", { id: "games", value: loadedHtml });

          const gameUrl = API_BASE_URL + '/games';
          fetchData(gameUrl)
            .then((data) => {
              cache.save_one("data", { id: "games", value: data });
              data.forEach((game) => {
                $('#games__list').append(gameTemplate(game));
                highLightOrderBtn(CART); // Highlight btn of items in cart.
              });

            })
            .catch((error) => {
              console.log(error);
            });
        });
        break;
      }
      case 'sidebar__laundry' : {
        const url = APP_BASE_URL + '/pages/laundry';
        const template = await cache.get_by("html", { id: "laundries" });
        const laundries = await cache.get_by("data", { id: "laundries" })

        if (template && laundries) {
          $('#dynamic__load-dashboard').html(template);
          localStorage.setItem('cacheService', JSON.stringify(laundries));
          laundries.forEach((laundry) => {
            $('#laundry__list').append(laundryTableTemplate(laundry));
            highLightOrderBtn(CART); // Highlight btn of items in cart.
          });
          return;
        }
        $('#dynamic__load-dashboard').load(url, function() {
          highLightOrderBtn(CART); // Highlight btn on chart.
          $('input[name="Search Input"]')
            .attr('placeholder', 'Search for Clothe');
          const loadedHtml = getHtmlTemplate();
          cache.save_one("html", { id: "laundries", value: loadedHtml });

          function search($tableBodySelector, data, searchKey) {
            $tableBodySelector.empty();
            if (searchKey) {
              const searchItems = data.filter(
                item => item.name.toLowerCase().includes(searchKey)
              );
              if (searchItems.length > 0) {
                searchItems.forEach((searchItems) => {
                  $tableBodySelector.append(laundryTableTemplate(searchItems));
                });
              }
            } else {
              data.forEach((data) => {
                $tableBodySelector.append(laundryTableTemplate(data));
              });
            }
            highLightOrderBtn(CART); // Highlight btn on chart.
          }
          $('input[name="Search Input"]').on('input', function() {
            const searchKey = $('input[name="Search Input"]')
              .val().trim().toLowerCase();
            const $tableBodySelector = $('#laundry__list');
            const clotheList = JSON.parse(localStorage.getItem('cacheService'));
            search($tableBodySelector, clotheList, searchKey);
          });

          const laundryUrl = API_BASE_URL + '/laundries';
          fetchData(laundryUrl)
            .then((data) => {
              cache.save_one("data", { id: "laundries", value: data });
              data.forEach((laundry) => {
                $('#laundry__list').append(laundryTableTemplate(laundry));
                localStorage.setItem('cacheService', JSON.stringify(data));
                highLightOrderBtn(CART); // Highlight btn of items in cart.
              });

            })
            .catch((error) => {
              console.log(error);
            });
        });
        break;
      }
      case 'sidebar__help': {
        const url = APP_BASE_URL + '/pages/help_support';
        const template = await cache.get_by("html", { id: "helps" });

        if (template) {
          $('#dynamic__load-dashboard').html(template);
        } else {
          $('#dynamic__load-dashboard').load(url, function() {
            const loadedHtml = getHtmlTemplate();
            cache.save_one("html", { id: "helps", value: loadedHtml });
          });
        }
        break;
      }
      case 'sidebar__setting': {
        const url = APP_BASE_URL + '/pages/setting';
        const template = await cache.get_by("html", { id: "settings" });
        if (template) {
          $('#dynamic__load-dashboard').html(template);
        } else {
          $('#dynamic__load-dashboard').load(url, function() {
            const loadedHtml = getHtmlTemplate();
            cache.save_one("html", { id: "settings", value: loadedHtml });
          });
        }
        break;
      }
    }
  });
});
