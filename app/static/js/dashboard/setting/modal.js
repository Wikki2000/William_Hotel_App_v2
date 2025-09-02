import {
  ajaxRequest, britishDateFormat, fetchData, getBaseUrl, canadianDateFormat,
  getFormDataAsDict, showNotification
} from '../../global/utils.js';
import { initAllStores } from '../../global/init_cache.js';

const cache = await initAllStores();

$(document).ready(function() {

  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];

  $('#dynamic__load-dashboard').on('click', '.settings-list a', async function (e) {
    e.preventDefault();
    const title = $(this).data('title');
    $('#modal-title').text(title);

    if (title === "Change Password") {
      $('#modal-content').html(`
        <form id="setting__reset-password">
        <!--
          <label>Old Password:</label><br>
          <input type="password" required name="old_password"/><br><br>
         -->

          <label>New Password:</label><br>
          <input type="password" required name="new_password"/><br><br>

          <label>Confirm Password:</label><br>
          <input type="password" required name="confirm_password"/><br><br>
          <button style="background: orange; color: white; padding: 8px 12px; border: none; border-radius: 5px;">Save Password</button>
        </form>
      `);

    } else if (title === "Business Info") {
      const url = API_BASE_URL + '/hotels';
      const hotel = await cache.get_by("data", { id: "hotel" });

      function prefill(hotel) {

        $('#modal-content').html(`
        <form id="setting__business-form">
          <label>Business Name:</label><br>
          <input type="text" required name="name" placeholder="e.g., Demo Hotel & Suites" /><br><br>

          <label>Address:</label><br>
          <input type="text" required name="location" placeholder="e.g., No.3 Ajekule Street, Akwa Ibom State, Nigeria." /><br><br>

          <label>Website:</label><br>
          <input type="text" name="website" placeholder="e.g., www.demo.com"/><br><br>

          <label>Phone:</label><br>
          <input type="text" name="contact" placeholder="e.g, 08111234567"max-length="11" /><br><br>

          <label>Alternative Phone:</label><br>
          <input type="text" name="alt_contact" placeholder="e.g., 08111234567" max-length="11"/><br><br>

          <label>Email:</label><br>
          <input type="text" name="email" placeholder="e.g, demo@gmail.com"/><br><br>

          <label>Upload Logo:</label><br>
          <input type="file" id="bizLogo" /><br><br>
          <img id="logoPreview" style="max-width: 150px; display:none;" /><br><br>
          <button id="update__hotel-btn" data-id="${hotel.id}"style="background: orange; color: white; padding: 8px 12px; border: none; border-radius: 5px;">Save Info</button>
        </form>
        `);

        $("input[name='name']").val(hotel?.name);
        $("input[name='location']").val(hotel?.location);
        $("input[name='website']").val(hotel?.website);
        $("input[name='contact']").val(hotel?.contact);  // fixed name
        $("input[name='alt_contact']").val(hotel?.alt_contact);  // fixed name
        $("input[name='email']").val(hotel?.email);

        if (hotel?.logo) {
          $("#logoPreview").attr("src", `data:image/;base64, ${hotel?.logo}`).show();;
        }
      }

      if (hotel) {
        prefill(hotel);
      } else {
        fetchData(url)
          .then((response) => {
            prefill(response)
            cache.save_one('data', { id: 'hotel', value: response });
          })
          .catch((error) => {
            console.log(error);
          });
      }

      $('#bizLogo').on('change', function (e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
          $('#logoPreview').attr('src', e.target.result).show();
        }
        reader.readAsDataURL(file);
      });

    } else if (title === "Price Settings") {
      $('#modal-content').html(`
        <form id="price__setting">
          <label>Short Time Amount:</label><br>
          <input name="short_time_amount" min="1" type="number" required /><br><br>

          <label>Early Check-in Amount:</label><br>
          <input type="number" min="1" name="early_checkin_amount" required /><br><br>

          <label>Late Check-out Amount:</label><br>
          <input type="number" min="1" name="late_checkout_amount" required /><br><br>

          <label>Short Time Duration (Hours):</label><br>
          <input type="number" min="1" name="short_time_hours" required /><br><br>

          <label>Late Checkout Duration (Hours):</label><br>
          <input type="number" min="1" name="late_checkout_time" required /><br><br>

          <label>Half Day Duration (Hours):</label><br>
          <input type="number" min="1" name="half_day_duration" required /><br><br>

          <button style="background: orange; color: white; padding: 8px 12px; border: none; border-radius: 5px;">Save Prices</button>
         </form>
      `);

      const SHORT_REST_AMOUNT = parseInt(localStorage.getItem('shortRestAmount'));
      const EARLY_CHECKIN_AMOUNT = parseInt(
        localStorage.getItem('earlyCheckinAmount')
      );
      const SHORT_TIME_DURATION = localStorage.getItem('shortTimeDuration');
      const LATE_CHECKOUT_AMOUNT = parseInt(
        localStorage.getItem("lateCheckoutAmount")
      );
      const LATE_CHECKOUT_TIME = localStorage.getItem("lateCheckoutDuration");
      const HALF_DAY_TIME = localStorage.getItem("halfDayDuration");

      $('input[name="short_time_hours"]').val(SHORT_TIME_DURATION);
      $('input[name="early_checkin_amount"]').val(EARLY_CHECKIN_AMOUNT);
      $('input[name="short_time_amount"]').val(SHORT_REST_AMOUNT);

      $('input[name="late_checkout_time"]').val(LATE_CHECKOUT_TIME);
      $('input[name="half_day_duration"]').val(HALF_DAY_TIME);
      $('input[name="late_checkout_amount"]').val(LATE_CHECKOUT_AMOUNT);

    } else if (title === "Tax Settings") {
      $('#modal-content').html(`
        <form id="setting__tax-price">
          <label>VAT Rate (%):</label><br>
          <input type="number" step="any" required name="vat_rate"/><br><br>
          <label>CAT Rate (%):</label><br>
          <input type="number" step="any" required name="cat_rate" /><br><br>
          <button style="background: orange; color: white; padding: 8px 12px; border: none; border-radius: 5px;">Save Tax</button>
        </form>
      `);
      const url = API_BASE_URL + "/hotel_settings";
      fetchData(url)
        .then((response) => {
          $("input[name='vat_rate']").val(response.vat_rate);
          $("input[name='cat_rate']").val(response.cat_rate);
        })
        .catch((error) => {
          console.log(error);
        });
    } else if (title === "Generate Guest QR Code") {
      const guestUrl = "https://williamscourthotel.com/guest";
      $('#modal-content').html(`
        <p>Scan this QR code to visit the guest portal:</p>
        <canvas id="guestQrCanvas" width="200" height="200"></canvas>
        <p style="margin-top: 10px; font-size: 12px; color: gray;">URL: ${guestUrl}</p>
        <button id="downloadQrBtn" style="margin-top:10px; background: orange; color: white; padding: 8px 12px; border: none; border-radius: 6px;">
          Download QR Code
        </button>
                                                                                                          `);
      QRCode.toCanvas(document.getElementById('guestQrCanvas'), guestUrl, function (error) {
        if (error) console.error(error);
      });

      $(document).off('click', '#downloadQrBtn').on('click', '#downloadQrBtn', function () {
        const canvas = document.getElementById('guestQrCanvas');
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = 'guest-portal-qr.png';
        link.click();
      });

    } else if (title === "Invite New Staff") {
      $('#modal-content').html(`
        <form id="invite__new-staff">
          <label>Staff Email:</label><br>
          <input type="email" required name="email"/><br><br>
          <button style="background: orange; color: white; padding: 8px 12px; border: none; border-radius: 5px;">Send Invite Link</button>
        </form>
      `);
    } else {
      return;
      $('#modal-content').text(title + " COMING SOON");
    }

    $('#settings-modal-overlay').fadeIn(200);
  });

  $('#dynamic__load-dashboard')
    .on('click', '#modal-close, #settings-modal-overlay', function (e) {
      if (e.target === this || e.target.id === 'modal-close') {
        $('#settings-modal-overlay').fadeOut(200);
      }
    });
});
