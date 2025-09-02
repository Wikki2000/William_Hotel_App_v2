import {
  britishDateFormat, fetchData, getFormattedDate,
  canadianDateFormat, getBaseUrl, highLightOrderBtn,
  getHtmlTemplate, restoreOnline,  restoreOffline
} from '../global/utils.js?v1';
import {
  staffManagementCommonCart,
} from '../global/templates1.js?v2';
import { initAllStores } from '../global/init_cache.js';

const cache = await initAllStores();

export async function loadDashbard() {
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  const TERMINAL = localStorage.getItem('terminal');

  const currentTerminal = {
    "t1": "terminal one",
    "t2": "terminal two"
  }

  $(".current-terminal").text(`(${currentTerminal[TERMINAL]})`);

  const staffUrl = APP_BASE_URL + '/pages/main_dashboard';
  const loadedHtml = getHtmlTemplate();
  cache.save_one("html", { id: "dashboard", value: loadedHtml });
  const roomUrl = API_BASE_URL + '/rooms';
  const bookingUrl = API_BASE_URL + '/bookings';
  const performanceStatus = localStorage.getItem('performance');
  const staffPerformanceColor = (
    performanceStatus < 50 ? 'red' : 'green'
  );

  const username = localStorage.getItem('userName');
  const displayUsername = (
    username.length > 7 ? username.slice(0, 7) + '...' : username
  );
  $('#main__username').text(displayUsername);

  $('#staff_performance-indexing')
    .text(String(performanceStatus) + '%');
  $('#staff_performance-indexing')
    .css('color', staffPerformanceColor);

  const rooms = await cache.get_by("data", { id: "rooms" });

  if (IS_ONLINE) {
    restoreOnline();
  } else {
    restoreOffline();
  }

  if (rooms) {
    const roomCounts = rooms.rooms_count;
    $('#main__room-available').text(roomCounts.total_available_room);
  } else {
    fetchData(roomUrl)
      .then((data) => {
        const roomCounts = data.rooms_count;
        $('#main__room-available').text(roomCounts.total_available_room);
        cache.save_one('data', { id: 'rooms', value: data });
      })
      .catch((error) => {
        console.error('Failed to fetch room data:', error);
      });
  }
  $('#main__date').text(getFormattedDate());
  // Handle display of common cart in main dashboard
  const greenClass = 'green';
  const orangeClass = 'orange';
  if (USER_ROLE === 'staff') {
    // First CART Staff
    const btn = {
      content: "View Details",
      id: "main__checkin-view--btn"
    };
    const cartTitle = 'Today CheckIn';
    const icon = 'fa-calendar';
    $('#main__common-cart--staffManagement')
      .append(staffManagementCommonCart(cartTitle, btn, USER_ROLE, icon, greenClass, 'main__today-check--in'));

    // Second CART Staff
    const btn2 = {
      content: 'View Orders',
      id: 'main__today-order'
    }
    const icon2 = 'fa-shopping-cart';
    const cartTitle2 = 'Today Order\'s'
    $('#main__cart-loaded')
      .append(staffManagementCommonCart(cartTitle2, btn2, USER_ROLE,icon2, orangeClass, 'main__todays-order'));
  } else {
    // First CART for management
    const btn = {
      content: "View Details",
      id: "main__vat-view--btn"
    };
    const icon = 'fa-calculator';
    const cartTitle = 'Monthly VAT';
    $('#main__common-cart--staffManagement')
      .append(staffManagementCommonCart(cartTitle, btn, USER_ROLE, icon, greenClass));

    // Second CART for management
    const btn2 = {
      content: 'View Details',
      id: 'main__cat-view--btn'
    };
    const icon2 = 'fa-calculator';
    const cartTitle2 = 'Monthly CAT';

    $('#main__cart-loaded')
      .append(staffManagementCommonCart(cartTitle2, btn2, USER_ROLE, icon2, orangeClass));
  }


  const today = canadianDateFormat(new Date());

  // Get sumnary of today's order
  if (USER_ROLE === "staff") {
    const todayOrderUrl = API_BASE_URL + `/orders/${today}/${today}/get`;
    fetchData(todayOrderUrl)
      .then((data) => {
        $('#main__todays-order').text(data.orders.length);
      })
      .catch((error) => {
        console.error('Failed to fetch room data:', error);
      });

    // Get sumnary of today bookings
    const todayBookingUrl = API_BASE_URL + `/bookings/${today}/${today}/get`;
    fetchData(todayBookingUrl)
      .then((data) => {
        $('#main__today-check--in').text(data?.bookings?.length);
      })
      .catch((error) => {
        console.error('Failed to fetch room data:', error);
      });
  }

  // Auto fill if a guest is selected
  const guestDataStr = sessionStorage.getItem('guestData');
  if (guestDataStr) {
    const guestData = JSON.parse(guestDataStr);
    $('#main__guest-name').val(guestData.name);
    $('#main__guest-phone').val(guestData.phone);
    $('#main__guest-address').val(guestData.address);
    $('#main__guest-email').val(guestData.email);
    $('#main__id--no-val').val(guestData.id_numbe);

    $('#main__guest--gender-val').val(guestData.gender);
    $('#main__guest-gender span').text(guestData.gender);

    $('#main__id--type-val').val(guestData.id_typ);
    $('#main__guest-id--type span').text(guestData.id_typ);
  }
}
