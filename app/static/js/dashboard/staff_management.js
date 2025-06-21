/* NOTE: This pages does not handle loans/leaves action,
 * it only display loans & Leave applied by staff.
 * Refer to loan_request.js & leave_request.js,
 * for other action on loan/leave request by staff.
 */

import {
  fetchData, getFormDataAsDict, showNotification, confirmationModal,
  validateForm, britishDateFormat, getBaseUrl, ajaxRequest, sanitizeInput,
  canadianDateFormat, hideAllStaffManagmentDashboard, displayMenuList,
  togleTableMenuIcon,
} from '../global/utils.js';
import  {
  loanListTableTemplate, staffListTemplate,
  leaveListTableTemplate
} from '../global/templates.js';

function removeBtnHighlight() {
  $('#staff__performance-btn').removeClass('highlight-btn');
  $('#add__staff-btn').removeClass('highlight-btn');
  $('#staff__list-btn').removeClass('highlight-btn');
  $('.staff__management-loan--history').removeClass('highlight-btn');
  $('.staff__management-leave-history').removeClass('highlight-btn');
}

$(document).ready(function() {

  const USER_ROLE = localStorage.getItem('role');
  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];

  // Load and display staff roster.
  const currentPageId = sessionStorage.getItem('pageId');
  const rosterUrl = API_BASE_URL + '/user-roster';

  if (currentPageId === 'roster') {
    fetchData(rosterUrl)
      .then((response) => {
        $('#roster__table-body').empty();
        response.forEach((data) => {

          let mondayOption, tuesdayOption, wendesdayOption, thursdayOption, fridayOption, saturdayOption, sundayOption;
          mondayOption = tuesdayOption = wendesdayOption = thursdayOption = fridayOption = saturdayOption = sundayOption = '';
          if (data.roster) {
            mondayOption = data.roster.monday ? data.roster.monday : '';
            tuesdayOption = data.roster.tuesday ? data.roster.tuesday : '';
            wendesdayOption = data.roster.wednesday ? data.roster.wednesday : '';
            thursdayOption = data.roster.thursday ? data.roster.thursday : '';
            fridayOption = data.roster.friday ? data.roster.friday : '';
            saturdayOption = data.roster.saturday ? data.roster.saturday : '';
            sundayOption = data.roster.sunday ? data.roster.sunday : '';
          }

          // Only include staff on roster.
          if (data.role === 'staff') {
            $('#roster__table-body').append(`
              <tr>
                <td>${data.name} (${data.portfolio})</td>
                <td style="color: ${mondayOption === 'DAY' || mondayOption === 'NIGHT' ? 'green': 'red'}">${mondayOption}</td>
                <td style="color: ${tuesdayOption === 'DAY' || tuesdayOption === 'NIGHT' ? 'green': 'red'}">${tuesdayOption}</td>
                <td style="color: ${wendesdayOption === 'DAY' || wendesdayOption === 'NIGHT' ? 'green': 'red'}"">${wendesdayOption}</td>
                <td style="color: ${thursdayOption === 'DAY' || thursdayOption === 'NIGHT' ? 'green': 'red'}">${thursdayOption}</td>
                <td style="color: ${fridayOption === 'DAY' || fridayOption === 'NIGHT' ? 'green': 'red'}">${fridayOption}</td>
                <td style="color: ${saturdayOption === 'DAY' || saturdayOption === 'NIGHT' ? 'green': 'red'}">${saturdayOption}</td>
                <td style="color: ${sundayOption === 'DAY' || sundayOption === 'NIGHT' ? 'green': 'red'}">${sundayOption}</td>
            </tr>
          `);
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // Show drop dwon menu for user role
  $('#dynamic__load-dashboard').off('click', '.profile__dropdown-btn')
    .on('click', '.profile__dropdown-btn', function() {
      $('#profile__role-dropdown').show();
    });

  // Collect the selected option and store in hidden input field
  $('#dynamic__load-dashboard').off('click', '.profile__dropdown-selector')
    .on('click', '.profile__dropdown-selector', function() {
      const selectedOption = $(this).text();
      $('.profile__dropdown-btn p').text(selectedOption);
      $('#profile__role-dropdown').hide();
      $('input[name="role"]').val(selectedOption);
    });

  // Submission of form for Edit/Add staff
  $('#dynamic__load-dashboard')
    .on('submit', '#staff__management-form', function(e) {
      e.preventDefault();
      const $formElement = $(this);
      const data = sanitizeInput(getFormDataAsDict($formElement));

      const userId = $('input[name="id"]').val();
      delete data.id;  // Remove id from form field use during PUT

      const addMsg = 'Staff Added successfully !'
      const editMsg = 'Staff Profile Updated successfully !'

      const addUrl = API_BASE_URL + '/users';
      const editUrl = API_BASE_URL + `/members/${userId}/update`;

      const method = $formElement.hasClass('add-staff') ? 'POST' : 'PUT';
      const url = $formElement.hasClass('add-staff') ? addUrl : editUrl;
      const msg = $formElement.hasClass('add-staff') ? addMsg : editMsg;

      if (!validateForm($formElement)) {
        showNotification('Please fill all requires field', true);
        return;
      }

      $('.profile__save-changes').prop('disable', true);

      ajaxRequest(url, method, JSON.stringify(data),
        (response) => {
          $('.profile__save-changes').prop('disable', false);

          $formElement.removeClass('add-staff'); // Remove the temp class for POST request

          if (method === 'POST') {
            const date = britishDateFormat(response.start_date);
            $('#staff__list-table--body')
              .prepend(staffListTemplate(response, date));
          } else {

            const performanceColor = response.performance < 50 ? 'red' : 'green';
            $(`#staff__list-table--body tr[data-id="${userId}"] .first_name`).text(response.first_name);
            $(`#staff__list-table--body tr[data-id="${userId}"] .last_name`).text(response.last_name);
            $(`#staff__list-table--body tr[data-id="${userId}"] .salary`).text(`₦${response.salary}`);
            $(`#staff__list-table--body tr[data-id="${userId}"] .number`).text(response.number);
            $(`#staff__list-table--body tr[data-id="${userId}"] .portfolio`).text(response.portfolio);
            $(`#staff__list-table--body tr[data-id="${userId}"] .performance`).text(String(response.performance) + '%');
            $(`#staff__list-table--body tr[data-id="${userId}"] .performance`).css('color', performanceColor );
          }
          showNotification(msg);

          // Show Staff List after update or adding new staff.
          hideAllStaffManagmentDashboard();
          $('#staff__list').show();

          $('#staff__list-btn').addClass('highlight-btn');
          $('#add__staff-btn').removeClass('highlight-btn');

          // Reset form
          $formElement.trigger('reset');
          $('.profile__dropdown-btn p').text('Select');
        },
        (error) => {
          $('.profile__save-changes').prop('disable', false);
          $formElement.removeClass('add-staff'); // Remove the temp class for POST request
          if (error.status === 409) {
            showNotification('User Exist\'s Already', true)
            return;
          }
          showNotification('An error occured. Try again !', true);
          console.log(error);
          $formElement.trigger('reset');
          $('.profile__dropdown-btn p').text('Select'); 
        }
      );
    });

  $('#dynamic__load-dashboard')
    .off('click', '#staff__performance-btn, #add__staff-btn, #staff__list-btn')
    .on('click', '#staff__performance-btn, #add__staff-btn, #staff__list-btn',
      function() {
        const $clickItem = $(this);
        const clickId = $clickItem.attr('id');

        removeBtnHighlight();

        $clickItem.addClass('highlight-btn');

        // Hide other dashboard sections
        hideAllStaffManagmentDashboard();

        switch(clickId) {
          case 'staff__performance-btn': {
            break;
          }
          case 'add__staff-btn': {
            $('#staff__profile').show();
            $('#staff__management-form').addClass('add-staff');

            $('.staff-profile-heading h1').text('Add New Staff');

            // Reset the form to add new staff
            $('#staff__management-form').trigger('reset');
            $('.profile__dropdown-btn p').text('Select');
            $('#profile__photo').attr(
              'src', '/static/images/public/profile_photo_placeholder.png'
            );
            break;
          }
          case 'staff__list-btn': {
            $('#staff__list').show();
            break;
          }
        }
      });

  // Load pages for Loans, Delete, staff profile and Leaves
  $('#dynamic__load-dashboard').off('click', '.staff__management-table--menu')
    .on('click', '.staff__management-table--menu', function() {
      $('.staff__management-request').hide();
      const $clickItem = $(this);
      const userId = $clickItem.data('id');

      removeBtnHighlight();
      hideAllStaffManagmentDashboard();

      if($clickItem.hasClass('staff__management-view--profile')) {
        const staffUrl = API_BASE_URL + `/members/${userId}`;

        $('#staff__profile').show();
        $('.staff-profile-heading h1').text('Staff Profile');

        fetchData(staffUrl)
          .then((data) => {
            const photo = (
              data.profile_photo ?
              `data:image/;base64, ${data.profile_photo}` :
              '/static/images/public/profile_photo_placeholder.png'
            );

            $('#profile__photo').attr('src', photo);
            $('input[name="first_name"]').val(data.first_name);
            $('input[name="middle_name"]').val(data.middle_name);
            $('input[name="last_name"]').val(data.last_name);
            $('input[name="salary"]').val(data.salary);
            $('input[name="religion"]').val(data.religion);
            $('input[name="start_date"]')
              .val(canadianDateFormat(data.start_date));
            $('input[name="state"]').val(data.state);
            $('input[name="address"]').val(data.address);
            $('input[name="nok"]').val(data.nok);
            $('input[name="nok_number"]').val(data.nok_number);
            $('input[name="portfolio"]').val(data.portfolio);
            $('input[name="email"]').val(data.email.trim());
            $('input[name="dob"]').val(canadianDateFormat(data.dob));
            $('input[name="gender"]').val(data.gender);
            $('input[name="number"]').val(data.number);
            $('input[name="performance"]').val(data.performance);
            $('input[name="username"]').val(data.username.trim());
            $('input[name="title"]').val(data.title);
            $('input[name="rank_number"]').val(data.rank_number);

            $('input[name="role"]').val(data.role);
            $('.profile__dropdown-btn p').text(data.role);

            $('input[name="id"]').val(data.id);

            if (USER_ROLE === 'manager') {
              $('input[name="first_name"]').attr('readonly', true);
              $('input[name="middle_name"]').attr('readonly', true);
              $('input[name="last_name"]').attr('readonly', true);
              $('input[name="salary"]').attr('readonly', true);
              $('input[name="religion"]').attr('readonly', true);
              $('input[name="start_date"]').attr('readonly', true);
              $('input[name="state"]').attr('readonly', true);
              $('input[name="address"]').attr('readonly', true);
              $('input[name="nok"]').attr('readonly', true);
              $('input[name="nok_number"]').attr('readonly', true);
              $('input[name="portfolio"]').attr('readonly', true);
              $('input[name="dob"]').attr('readonly', true);
              $('input[name="gender"]').attr('readonly', true);
              $('input[name="number"]').attr('readonly', true);
              $('input[name="email"]').attr('readonly', true);
              $('input[name="username"]').attr('readonly', true);
              $('input[name="title"]').attr('readonly', true);

              $('#profile__role-dropdown').remove();
            }

          })
          .catch((error) => {
            console.log(error);
          });
      } else if ($clickItem.hasClass('staff__management-remove--user')) {
        alert("You can't delete a staff at this moment. Thie section under maintainence!");
        return;
        const headingText = 'Confirm Removal of Staff';
        const descriptionText = 'This action cannot be undone !'
        const confirmBtCls = 'staff__management-delete--confirmBtn';

        confirmationModal(headingText, descriptionText, confirmBtCls);

      } else if($clickItem.hasClass('staff__management-loan--history')) {
        // Staff Loans Management
        $('.staff__management-loan--history').addClass('highlight-btn');

        $('#staff__loan-table--body').empty();
        const getLoanUrl = API_BASE_URL + '/loans';
        fetchData(getLoanUrl)
          .then((data) => {
            data.forEach((loan) => {
              $('#staff__loan-table--body')
                .append(loanListTableTemplate(loan, USER_ROLE));
            });
          })
          .catch((error) => {
            console.log(error);
          });

        $('#staff__loan-list').show();
      } else if ($clickItem.hasClass('staff__management-leave-history')) {
        $('.staff__management-leave-history').addClass('highlight-btn');
        $('#staff__leave-list').show();

        $('#staff__leave-table--body').empty();

        const getLeaveUrl = API_BASE_URL + `/leaves`;
        fetchData(getLeaveUrl)
          .then((data) => {
            data.forEach((data) => {
              const startDate = britishDateFormat(data.start_date);
              const endDate = britishDateFormat(data.end_date);
              const date = { startDate, endDate  }
              $('#staff__leave-table--body')
                .append(leaveListTableTemplate(data, date));
            });
          })
          .catch((error) => {
            console.log(error);
          });
      }

      // Handle removal of staff
      $('#dynamic__load-dashboard')
        .off('click', '.staff__management-delete--confirmBtn')
        .on('click', '.staff__management-delete--confirmBtn', function() {

          const staffDeleteUrl = API_BASE_URL + `/members/${userId}/delete`;
          ajaxRequest(staffDeleteUrl, 'DELETE', null,
            (response) => {
              $('#order__confirmation-modal').empty();
              $(`#staff__list-table--body tr[data-id="${userId}"]`).remove();
              $('#staff__list').show();
              showNotification('Staff Remove successfully !');
            },
            (error) => {
              $('#order__confirmation-modal').empty();
              console.log(error);
            }
          );
        });
    });


  // Display roster for a staff.
  $('#dynamic__load-dashboard').on('click', '.staff__management-roster', function() {
    const $clickItem = $(this);
    const staffId = $clickItem.data("id");

    togleTableMenuIcon();

    // Reset form
    $('#roster__update-form').trigger('reset');
    $('.roster__row span').text('Select');

    const userUrl = API_BASE_URL + `/members/${staffId}`;
    fetchData(userUrl)
      .then((data) => {

        $("#staff__id").val(data.id);

        const displayPortfolio = (
          data.portfolio.length < 18 ? data.portfolio :
          data.portfolio.slice(0, 18) + '...'
        );

        $("#user__full-name").text(data.first_name + " " + data.last_name);
        $("#roster__user-portfolio").text(displayPortfolio);
        $("#roster__user-portfolio").css('title', displayPortfolio);

        if (data.roster) {
          const mondayOption = data.roster.monday ? data.roster.monday : 'Select';
          $('.monday').text(mondayOption);
          $('input[name="monday"]').val(mondayOption);


          const TuesdayOption = data.roster.tuesday ? data.roster.tuesday : 'Select';
          $('.tuesday').text(TuesdayOption);
          $('input[name="tuesday"]').val(TuesdayOption);

          const wendesdayOption = data.roster.wednesday ? data.roster.wednesday : 'Select';
          $('.wednesday').text(wendesdayOption);
          $('input[name="wednesday"]').val(wendesdayOption);


          const thursdayOption = data.roster.thursday ? data.roster.thursday : 'Select';
          $('.thursday').text(thursdayOption);
          $('input[name="thursday"]').val(thursdayOption);

          const fridayOption = data.roster.friday ? data.roster.friday : 'Select';
          $('.friday').text(fridayOption); 
          $('input[name="friday"]').val(fridayOption);

          const saturdayOption = data.roster.saturday ? data.roster.saturday : 'Select';
          $('.saturday').text(saturdayOption);
          $('input[name="saturday"]').val(saturdayOption);

          const sundayOption = data.roster.sunday ? data.roster.sunday : 'Select';
          $('.sunday').text(sundayOption);
          $('input[name="sunday"]').val(sundayOption);
        }
      })
      .catch((error) => {
        console.log(error);
      });
    $("#roster__modal").css("display", "flex");
  });


  // Display staff shift options list.
  $('#dynamic__load-dashboard')
    .off('click', '.roster__row .drop-down')
    .on('click', '.roster__row .drop-down', function() {
      const $clickItem = $(this);
      const shiftOptions = ['DAY', 'NIGHT', 'OFF', 'LEAVE'];
      displayMenuList(shiftOptions, $clickItem, "roster__shift-option");
    });


  // Handle selection of shift options
  $('#dynamic__load-dashboard')
    .off('click', '.roster__shift-option')
    .on('click', '.roster__shift-option', function() {
      const $clickItem = $(this);
      const selectedOption = $clickItem.text();

      $('.dropdown-menu').hide();
      $clickItem.closest(".roster__row").find("span").text(selectedOption);
      $clickItem.closest(".roster__row").find("input").val(selectedOption);

    });

  $('#dynamic__load-dashboard').on('submit', '#roster__update-form', function(e) {
    e.preventDefault();
    const $formElement = $(this);
    const data = getFormDataAsDict($formElement);
    const staffId = $("#staff__id").val();

    const rosterUrl = API_BASE_URL + `/users/${staffId}/upsert-roster`;
    ajaxRequest(rosterUrl, 'PUT', JSON.stringify(sanitizeInput(data)),
      (response) => {
        showNotification('Roster Updated Successfully');
        $("#roster__modal").hide();
      },
      (error) => {
        showNotification('Oops! An Error Ocured, Try Again !', true);
      }
    );
  });

});
