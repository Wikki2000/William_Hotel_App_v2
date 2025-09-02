window.SHORT_REST_AMOUNT = parseInt(localStorage.getItem("shortRestAmount"));
window.EARLY_CHECKIN_AMOUNT =  parseInt(localStorage.getItem("earlyCheckinAmount"));
window.LATE_CHECK_OUT_AMOUNT = parseInt(localStorage.getItem("lateCheckoutAmount"));
window.LATE_CHECK_OUT_DURATION = localStorage.getItem("lateCheckoutDuration");
window.SHORT_TIME_DURATION = localStorage.getItem("shortTimeDuration");
window.HALF_DAY_DURATION = localStorage.getItem("halfDayDuration");

window.CART = new Map();  // Declare Globally

window.TERMINAL_TWO = "t2";
window.TERMINAL_ONE = "t1";
window.DEFAULT_IMAGE = "/static/images/public/hotel_logo.png";
window.INDEX_DB_STORES = ['html', 'image', 'drinks', 'data'];
window.DEFAULT_IMAGE = "/static/images/public/hotel_logo.png";
window.IS_ONLINE = true;
