import {
  fetchData,
  ajaxRequest,
  getBaseUrl,
  showNotification,
  britishDateFormat,
  closeConfirmationModal,
} from "../../global/utils.js";
import {
} from "../../global/templates.js";


$(document).ready(function () {
  const API_BASE_URL = getBaseUrl()["apiBaseUrl"];
  const APP_BASE_URL = getBaseUrl()["appBaseUrl"];

  const hotelUrl = API_BASE_URL + "/all-hotels";
  fetchData(hotelUrl)
    .then((hotels) => {
      $("#hotels__table-body").empty();
      hotels.forEach((hotel) => {

        const totalUnreadMsg = (
          hotel.total_unread_feedback + hotel.total_unread_contact
        );

        const hotelName = (
          hotel.name.length > 24 ? hotel.name.slice(0, 24) + "..." : hotel.name
        );
        const statusClass = hotel.is_active ? "active" : "inactive";
        const statusTxt = hotel.is_active ? "Active" : "Inactive";

        const today = new Date();
        const endDate = new Date(hotel.end_date);

        // Zero out time part for both dates
        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const diffInMs = endDate - today;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const userType = hotel.is_free_trial ? "Trial User" : "Subscribe User";

        $("#hotels__table-body").append(`
          <tr>
            <td title="${hotel.name}">
              <input type="checkbox" class="select__checkbox" data-id="${hotel.id}">
              <span class="name">${hotelName}</span>
              (${hotel.__class__})
              <span style="color: orange;">(${totalUnreadMsg})</span>
            </td>
            <td>${britishDateFormat(hotel.start_date)}</td>
            <td>${britishDateFormat(hotel.end_date)}</td>
            <td>${diffInDays}</td>
            <td>${userType}</td>
            <td><span class="status-badge ${statusClass}">${statusTxt}</span></td>
            <td>
               <span class="action-icon" onclick="toggleDropdown(this)">&#9776;</span>
               <div class="dropdown"> 
                 <a href="#" class="send__email" data-id="${hotel.id}"> Send Mail </a>
                 <a href="/admin/user-contact?hotel_id=${hotel.id}&message_type=contact">
                   View Contact
                 <span style="color: orange;">
                   (${hotel.total_unread_contact})
                 </span>
                 </a>
                 <a href="/admin/user-contact?hotel_id=${hotel.id}&message_type=feedback">
                   View Feedback
                   <span style="color: orange;">
                     (${hotel.total_unread_feedback})
                   </span>
                 </a>
                 <a href="#" class="copy__id" data-id="${hotel.id}"> Copy Business ID </a>
                 <a href="#" data-id="${hotel.id}" class="activate__hotel"> Activate Business </a>
                 <a href="#" data-id="${hotel.id}" class="delete__hotel"> Delete Business </a>
                 <a href="#" data-id="${hotel.id}" class="de-activate__hotel"> De-activat Business  </a>
             </div> 
             </td> 
          </tr>
        `);
      });
    })
    .catch((error) => {
      console.log(error);
    });

  $("#add_new-hotel").click(function() {
    const url = APP_BASE_URL + '/admin/register-update-hotel';
    window.location.href = url;
  });   

  $("body").on("click", ".delete__hotel", function() {
    const $clickItem = $(this);
    const clickItemId = $clickItem.attr("class");
    const hotelId = $clickItem.data("id");
    const $parentTr = $clickItem.closest("tr")

    const businessName = $parentTr.find(".name").text()

    const confirmAction = confirm(
      `You about to delete ${businessName}, ` +
      'this action will delete all associated data ' +
      'link to this hotel. Are you sure you want to proceed'
    );

    if (!confirmAction) return;

    const url = API_BASE_URL + `/hotels/${hotelId}/delete`;
    

    ajaxRequest(url, 'DELETE', null,
      (response) => {
        $parentTr.remove();
        alert("Hotel Deleted Successfully!");
      },
      (error) => {
        console.log(error);
      }
    );

  });


  // Activate, De-activate and copy hotel id
  $("body").on("click", ".activate__hotel, .de-activate__hotel, .copy__id", function() {
    const $clickItem = $(this);
    const clickItemId = $clickItem.attr("class");
    const hotelId = $clickItem.data("id");

    if (clickItemId === "copy__id") {
      navigator.clipboard.writeText(hotelId)
        .then(() => {
          alert("Link Copied To Clipboard!");
        })
        .catch((error) => {
          console.log(error);
        });
      return;
    }

    const actions = {
      "activate__hotel": {
        "subdomain": "activate",
        "text": "Active",
        "class": "active"
      },

      "de-activate__hotel": {
        "subdomain": "de-activate",
        "text": "Inactive",
        "class": "inactive"
      }
    }

    const confirmAction = confirm(`You are about to ${actions[clickItemId]["subdomain"]} this hotel`);

    const url = (
      API_BASE_URL + `/hotels/${JSON.stringify([hotelId])}/${actions[clickItemId]["subdomain"]}`
    );

    ajaxRequest(url, 'PUT', null,
      (response) => {
        $clickItem.closest("tr").find(".status-badge").text(actions[clickItemId]["text"])
        $clickItem.closest("tr").find(".status-badge").removeClass("active, inactive");
        $clickItem.closest("tr").find(".status-badge").addClass(actions[clickItemId]["class"]);
      },
      (error) => {
        console.log(error);
      }
    );
  });


});
