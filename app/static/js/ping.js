import { ajaxRequest, getBaseUrl, restoreOnline,  restoreOffline } from './global/utils.js';

const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
const url = API_BASE_URL + '/ping';

$(document).ready(function() {
  function checkNetworkStatus(timeout) {
    ajaxRequest(
      url,
      'GET',
      {},
      function (response) {
        //console.log("Ping success");
        restoreOnline();
        IS_ONLINE = true;
      },
      function (error) {
        //console.log(error);
        restoreOffline();
        IS_ONLINE = false;
      },
      timeout
    );
  }

  // Call it once immediately
  const timeout = 4000;
  checkNetworkStatus(timeout);

  // Then every 10 seconds
  const executionTimeInterval = 10000;
  setInterval(() => checkNetworkStatus(timeout), executionTimeInterval);
});

