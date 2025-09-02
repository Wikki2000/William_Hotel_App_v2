import {
  ajaxRequest, britishDateFormat, fetchData, getBaseUrl, canadianDateFormat,
  getFormDataAsDict, showNotification
} from '../../global/utils.js';
import { initAllStores } from '../../global/init_cache.js';

const cache = await initAllStores();

$(document).ready(() => {

  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const USER_ROLE = localStorage.getItem('role');
  $('#dynamic__load-dashboard')
    .on('submit', '#setting__business-form', async function(e) {
      e.preventDefault();
      const $form = $(this);
      const data = getFormDataAsDict($form);
      const id = $("#update__hotel-btn").data("id");
      const hotel = await cache.get_by("data", { id: "hotel" });
      const url = API_BASE_URL + `/hotels/${id}/update`;

      Object.entries(data).forEach(([key, val]) => {
        hotel[key] = val;
      });

      const isConfirm = confirm("Confirm hotel info update. Click OK to proceed.");
      if (!isConfirm) return;

      $('#settings-modal-overlay').fadeOut(200);

      const fileInput = document.getElementById('bizLogo');
      const file = fileInput.files[0];
      const reader = new FileReader();

      if (file) {
        reader.onload = function(e) {
          const base64Image = e.target.result;
          data["logo"] = base64Image;
          hotel["logo"] = base64Image.split(",")[1];
        };
        reader.readAsDataURL(file);
      }

      ajaxRequest(url, 'PUT', JSON.stringify(data),
        (response) => {
          cache.save_one('data', { id: 'hotel', value: hotel });
          showNotification("Hotel information updated successfully.");
        },
        (error) => {
          console.log(error);
        }
      );
    });

  // Update Price Setting.
  $('#dynamic__load-dashboard')
    .on('submit', '#price__setting', async function(e) {

      e.preventDefault();
      const $form = $(this);
      const data = getFormDataAsDict($form);

      const isConfirm = confirm("Confirm hotel price update. Click OK to proceed.");
      if (!isConfirm) return;

      const url = API_BASE_URL + "/hotel_settings";
      $('#settings-modal-overlay').fadeOut(200);

      ajaxRequest(url, 'PUT', JSON.stringify(data),
        (hotel) => {

          localStorage.setItem("shortRestAmount", hotel.short_time_amount);
          localStorage.setItem("earlyCheckinAmount", hotel.early_checkin_amount);
          localStorage.setItem("lateCheckoutAmount", hotel.late_checkout_amount);
          localStorage.setItem("lateCheckoutDuration", hotel.late_checkout_time);
          localStorage.setItem("shortTimeDuration", hotel.short_time_hours);
          localStorage.setItem("halfDayDuration", hotel.half_day_duration);
          showNotification("Hotel Price updated successfully.");
        },
        (error) => {
          console.log(error);
        }
      );
    })

  $('#dynamic__load-dashboard')
    .on('submit', '#setting__tax-price', async function(e) {

      e.preventDefault();
      const $form = $(this);
      const data = getFormDataAsDict($form);

      const isConfirm = confirm("Confirm TAX rate update. Click OK to proceed.");
      if (!isConfirm) return;

      const url = API_BASE_URL + "/hotel_settings";
      $('#settings-modal-overlay').fadeOut(200);

      ajaxRequest(url, 'PUT', JSON.stringify(data),
        (response) => {
          showNotification("TAX rate updated successfully.");
        },
        (error) => {
          console.log(error);
        }
      );
    })
});
