/*
 * Table template for displaying list of vendors.
 *
 * @param {object} data - The response from server of vendor data.
 * @param {string} - The template for vendor list.
 */
export function taskListTemplate(data) {
  const paymentStatus = data.is_paid ? 'Paid' : 'Pending';
  const paymentStatusColor = data.is_paid ? 'green' : 'red';

  const taskType = data.__class__ === 'Cat' ? 'CAT' : 'VAT';

  const vatMonthYear = data.month[0].toUpperCase() + data.month.slice(1);
  const vatMonth = vatMonthYear.split('_')[0];

  const vatMonthText = data.is_due ? vatMonth : `${vatMonth} ${taskType} accumulating`;
  const row = `<tr data-id="${data.id}">
    <td class="">
      <p class="ui text size-textmd left-margin month">${vatMonthText}</p>
    </td>

    <td class="">
      <p class="ui text size-textmd left-margin amount">₦${data.amount.toLocaleString()}</p>
    </td>

    <td class="">
      <p style="color: ${paymentStatusColor}" class="ui text size-textmd left-margin status">${paymentStatus}</p>
    </td>

    <td class="">
      <p class="ui text size-textmd">
        <i class= fa fa-edit" data-id="${data.id}"></i>
      </p>
    </td>

      <td class="">
        <p><i class="fa fa-ellipsis-v"></i></p>
        <p><i style="display: none;" class="fa fa-times"></i></p>
      </td>

      <td class="manage">
        <nav class="manage__nav">
          <ul class="manage__list">
            <li data-id="${data.id}" class="manage__item vatcat__payment-status">
              <i class="fa fa-thumbs-up"></i>Paid
            </li>

          </ul>
        </nav>
      </td>

   </tr>`;
  return row;
}

export function saleSummaryTemplate(
  index, id,  itemName, qty, amount, is_booking
) {

  const row = `
  <tr data-id="${id}">
    <td class="">
      <p class="ui text size-textmd">${index + 1}</p>
    </td>
    <!--<td class="">
      <p class="ui text size-textmd">customer</p>
    </td>-->
    <td class="">
      <p class="ui text size-textmd">${itemName}</p>
    </td>
    <td class="">
      <p class="ui text size-textmd">${qty}</p>
    </td>
    <td>
      <p class="ui text size-textmd">₦${amount.toLocaleString()}</p>
    </td>

    <td style="visibility: hidden;" class="order__table-menu">
      <p><i class="fa fa-ellipsis-v"></i></p>
      <p><i style="display: none;" class="fa fa-times"></i></p>
    </td>
    <!--<td class="manage">
      <nav class="manage__nav">
        <ul class="manage__list">
          <li data-id="${id}" class="manage__item order__manageItem order__showConfirmModal">
             <i class="fa fa-shopping-cart"></i>Order Details
           </li>
          <li data-id="${id}" class="manage__item order__print order__manageItem">
            <i class="fa fa-print"></i>Print Receipt
          </li>
        </ul>
      </nav>
    </td>-->
</tr>`;
  return row;
}
/*
 * Table template for displaying list of vendors.
 *
 * @param {object} data - The response from server of vendor data.
 * @param {string} - The template for vendor list.
 */
export function vendorListTemplate(data) {
  const USER_ROLE = localStorage.getItem('role');
  const hideFromStaff = USER_ROLE === 'staff' ? 'hide' : '';
  const row = `<tr data-id="${data.id}">
    <td class="">
      <p class="ui text size-textmd left-margin name">${data.name}</p>
    </td>

    <td class="">
      <p class="ui text size-textmd left-margin number">${data.number}</p>
    </td>

    <td class="">
      <p class="ui text size-textmd left-margin portfolio">${data.portfolio}</p>
    </td>

    <td class="">
      <p class="ui text size-textmd">
        <i class="${hideFromStaff} fa fa-edit" data-id="${data.id}"></i>
      </p>
    </td>

    <td class="">
      <p class="ui text size-textmd">
        <i class="fa fa-trash ${hideFromStaff}" data-id="${data.id}"></i>
      </p>
    </td>
   </tr>`;
  return row;
}

/**
 * Display list of maintenance in the databases.
 *
 * @param {object} data - The maintenance/fault retrieve from databases.
 */
export function displayMaintenance(data) {
  const tableBody = $(".room-facility-body");

  const userRole = localStorage.getItem('role');
  const hideFromStaff = userRole === 'staff' ? 'hide': '';

  const photoSrc = (
    data.image ?
    `data:image/;base64, ${data.image}` :
    '/static/images/public/profile_photo_placeholder.png'
  );


  let reportStatusColor = '';
  let reportStatusText = '';
  if (!data.status) {
    reportStatusColor = 'red';
    reportStatusText = 'Pending';
  } else if (data.status) {
    reportStatusColor = 'green';
    reportStatusText = 'Fixed';
  }
  const row = `
    <tr data-id="${data.id}">
      <td>
        <div class="room-info">
          <p>${data.location}</p>
        </div>
     </td>
          <td>${data.fault}</td>
          <td class="maintenance__report-status" style="color: ${reportStatusColor}">${reportStatusText}</td>
          <td><img src="${photoSrc}" alt="Fault Image" style="width: 100px; height: 50px;" /></td>
          <td>
              <button class="options-button">⋮</button>
              <div class="options-menu">
                  <p class="maintenance__details" data-id="${data.id}"><i class="fa fa-eye"></i>&nbsp;&nbsp;Details</p>
                  <p class=" {hideFromStaff} delete__maintenance-option" data-id="${data.id}"><i class="fa fa-trash"></i>&nbsp;&nbsp;Delete</p>
              </div>
          </td>
          </tr>
      `;
  tableBody.append(row);
}

/**
 * Display the cart different from management & staff main dashboard
 *
 * @param {string} title - The title of the cart
 * @param {object} btn - An object of button ID and content.
 * @param {string} icon - Font is awesome of the cart icon.
 *
 * @return {string} - The cart template string.
 */
export function staffManagementCommonCart(title, btn, userRole, icon, cartColor, summaryId) {
  const hideClass = userRole === 'staff' ? '' : 'hidden';
  return `
    <div>
      <div class="main__row-1 ${cartColor}">
        <i class="fas ${icon}"></i>
      </div>
      <p>${title}</p>
    </div>
    <div class="main__row-2">
      <button id="${btn.id}" class="highlight-btn">${btn.content}</button>
      <h1 style="visibility: ${hideClass}"><em id="${summaryId}">0</em></h1>
    </div>
  `
}

export function expenditureTableTemplate(id, title, date, amount) {
  return `<tr data-id="${id}">
    <td>${date}</td>
    <td>${title}</td>
    <td class="expenditure__amount">₦${amount.toLocaleString()}</td>

      <td class="">
         <p><i class="fa fa-ellipsis-v"></i></p>
         <p><i style="display: none;" class="fa fa-times"></i></p>
      </td>

      <td class="manage">
        <nav class="manage__nav">
          <ul class="manage__list">
            <li data-id="${id}" class="manage__item expenditure__details">
              <i class="fa fa-eye"></i>Details
            </li>
            <li data-id="${id}" class="manage__item expenditure__delete">
              <i class="fa fa-trash"></i>Delete
            </li>
          </ul>
        </nav>
      </td>
 </tr>`;
}

/**
 * The html template of date filter.
 *
 * @return {string} - The filter template.
 */
export function inventoryFilterTemplate() {
  return `<form id="inventory__filter-form">
    <div class="inventory__filter-by--date">
      <div class="inventory__filter-date--input">
        <p class="inventory__date-title">Date &nbsp;</p>
        <input id="inventory__filter-start--date" class="inventory__filter-start--date deep__background" type="date" />
        <span>&nbsp; - &nbsp;</span>
        <input id="inventory__filter-end--date" class="inventory__filter-end--date deep__background" type="date" />
       </div>
       <i id="inventory__searchbar" class="fa fa-search"></i>
       <div class="inventory__filter-total--amount">
         <p>Amount</p>
           <p class="deep__background total__amount-entry">&nbsp;₦<span id="expenditure__total__amount-entry">0</span></p>
         </div>
      </div>
   </form>`
}

/**
 * Template for displaying games.
 *
 * @param {integer} index - The index of each element.
 * @param {object} data - The server response of games data.
 * @param {object} date - The date in british format.
 *
 * @return {string} - The row of table.
 */
export function gameTableTemplate(index, data, date) {
  const qtyColor = data.qty_stock < 10 ? 'red': '';
  const row = `<tr data-id="${data.id}">
      <td class="">
        <p class="ui text size-textmd">${index + 1}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd">${date}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd name">${data.name}</p>
      </td>
      <!--<td class="">
        <p class="ui text size-textmd qty_stock" style="color: ${qtyColor}">${data.qty_stock}</p>
      </td>-->
      <td class="">
        <p class="ui text size-textmd amount">₦${data.amount.toLocaleString()}</p>
      </td>
      <td class="">
        <p><i class="fa fa-ellipsis-v"></i></p>
        <p><i style="display: none;" class="fa fa-times"></i></p>
      </td>

      <td class="manage">
        <nav class="manage__nav">
          <ul class="manage__list">
            <li data-id="${data.id}" class="manage__item inventory__update-stock">
              <i class="fa fa-wine-bottle"></i>Update Stock
            </li>
            <li data-id="${data.id}" class="manage__item inventory__delete-stock">
              <i class="fa fa-trash"></i>Remove Item
            </li>
          </ul>
        </nav>
      </td>
    </tr>`;
  return row;
}

/**
 * Template for displaying drink.
 *
 * @param {integer} index - The index of each element.
 * @param {object} data - The server response of drink data.
 * @param {object} date - The date in british format.
 *
 * @return {string} - The row of table.
 */
export function drinkTableTemplate(index, data, date) {
  const qtyColor = data.qty_stock < 10 ? 'red': '';
  const USER_ROLE = localStorage.getItem('role');                                                                                                                       
  const hideClass = USER_ROLE !== 'admin' ? 'hide' : ''; 

  const row = `<tr data-id="${data.id}">
      <td class="">
        <p class="ui text size-textmd">${index + 1}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd">${date}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd name">${data.name}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd qty_stock" style="color: ${qtyColor}">${data.qty_stock}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd amount">₦${data.amount.toLocaleString()}</p>
      </td>
      <td class="${hideClass}">
        <p><i class="fa fa-ellipsis-v"></i></p>
        <p><i style="display: none;" class="fa fa-times"></i></p>
      </td>

      <td class="manage">
        <nav class="manage__nav">
          <ul class="manage__list">
            <li data-id="${data.id}" class="manage__item inventory__update-stock">
              <i class="fa fa-wine-bottle"></i>Update Stock
            </li>
            <li data-id="${data.id}" class="manage__item inventory__delete-stock">
              <i class="fa fa-trash"></i>Remove Item
            </li>
          </ul>
        </nav>
      </td>
    </tr>`;
  return row;
}

export function salesTableTemplate(index, id, saleStatus, amount, date, userRole) {
  const isAproved = saleStatus ? 'Approved' : 'Pending';
  const statusColor = saleStatus ? 'green': 'red';
  const isHide = userRole != 'admin' ? 'hide' : '';

  return `<tr data-id="${id}">
    <td class="">
      <p class="ui text size-textmd">${index + 1}</p>
    </td>
    <td class="">
      <p class="ui text size-textmd sale__year">${date}</p>
    </td>
    <td class="">
      <p class="ui text size-textmd sale__status" style="color: ${statusColor};">${isAproved}</p>
    </td>
    <td class="">
      <p class="ui text size-textmd sale__amount">₦${amount.toLocaleString()}</p>
    </td>

    <td class="">
      <p><i class="fa fa-ellipsis-v"></i></p>
      <p><i style="display: none;" class="fa fa-times"></i></p>
    </td>

    <td class="manage">
      <nav class="manage__nav">
        <ul class="manage__list">
          <li data-id="${id}" class="manage__item sales__menu sales__details">
            <i class="fa fa-eye"></i>Details
          </li>

          <li data-id="${id}" class="${isHide} manage__item sales__menu approved__record">
            <i class="fa fa-thumbs-up"></i>Approve Record
          </li>
          <li data-id="${id}" class="manage__item sales__menu make-comment">
            <i class="fa fa-pen"></i>Make Comment
          </li>
          <li data-id="${id}" class="manage__item sales__menu sales__view-comment">
            <i class="fa fa-comments"></i>View Comment
          </li>
        </ul>
      </nav>
    </td>
  </tr>`
}

export function foodTableTemplate(index, data, date) {
  const qtyColor = data.qty_stock < 10 ? 'red': '';
  const USER_ROLE = localStorage.getItem('role');

  const hideClass = USER_ROLE !== 'admin' ? 'hide' : '';

  const row = `<tr data-id="${data.id}">
      <td class="">
        <p class="ui text size-textmd">${index + 1}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd">${date}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd name">${data.name}</p>
      </td>
      <td class="">
        <p class="ui text size-textmd qty_stock" style="color: ${qtyColor}">${data.qty_stock}</p>
      </td>
     <td class="">
        <p class="ui text size-textmd amount">₦${data.amount.toLocaleString()}</p>
      </td>
      <td class="${hideClass}">
        <p><i class="fa fa-ellipsis-v"></i></p>
        <p><i style="display: none;" class="fa fa-times"></i></p>
      </td>

      <td class="manage">
        <nav class="manage__nav">
          <ul class="manage__list">
            <li data-id="${data.id}" class="manage__item food__update-stock">
              <i class="fa fa-utensils"></i>Update Stock
            </li>
            <li data-id="${data.id}" class="manage__item food__delete-stock">
              <i class="fa fa-trash"></i>Remove Item
            </li>
          </ul>
        </nav>
      </td>
    </tr>`;
  return row;
}

export function orderHistoryTableTemplate(order, date, customer = null) {
  const userRole = localStorage.getItem('role');
  const paymentStatus = order.is_paid ? 'Paid' : 'Pending';
  const textColor = order.is_paid ? 'green' : 'red';
  const hideClass = customer ? '' : 'hide';
  const customerName = customer ? customer.name : 'Guest Ordered';
  const showToAdminOnly = userRole === 'admin' ? '' : 'hide';

  const sliceName = (
    customerName.length >= 14 ? `${customerName.slice(0, 15)}...` : customerName
  );

  const row = `
<tr data-id="${order.id}">
    <td class="">
      <p title="${customerName}" class="ui text size-textmd">${sliceName}</p>
    </td>
    <td>
      <p class="ui text size-textmd">${date}</p>
    </td>
    <td>
      <p style="color: ${textColor}" class="ui text size-textmd order__bill-status">${paymentStatus}</p>
    </td>
    <td>
      <p class="ui text size-textmd">₦${order.amount.toLocaleString()}</p>
    </td>
    <td>
      <p class="${hideClass} ui text size-textmd payment__type">${order.payment_type}</p>
    </td>

    <td class="order__table-menu">
      <p><i class="fa fa-ellipsis-v"></i></p>
      <p><i style="display: none;" class="fa fa-times"></i></p>
    </td>
    <td class="manage">
      <nav class="manage__nav">
        <ul class="manage__list">
          <li data-id="${order.id}" data-name="${customerName}" class="manage__item  order__bill order__manageItem">
            <i class="fa fa-money-bill-wave"></i>Clear Bill
          </li>
          <li data-id="${order.id}" data-payment-type="${order.payment_type}" class="manage__item order__update-payment--method order__manageItem">
            <i class="fa fa-sync-alt"></i>Payment Method
          </li>
          <li data-id="${order.id}" data-name="${customerName}" class="manage__item  order__delete order__manageItem ${showToAdminOnly}">
            <i class="fa fa-trash"></i>Delete Order
          </li>
          <li data-id="${order.id}" class="manage__item order__manageItem order__showConfirmModal">
             <i class="fa fa-shopping-cart"></i>Order Details
           </li>
          <li data-id="${order.id}" class="manage__item order__print order__manageItem">
            <i class="fa fa-print"></i>Print Receipt
          </li>
        </ul>
      </nav>
    </td>
</tr>`;
  return row;
}

export function bookingServiceListTableTemplate(booking, date) {
  const paymentStatus = booking.is_paid === 'yes' ? 'Paid' : 'Pending';
  const textColor = booking.is_paid === 'yes' ? 'green' : 'red';
  let bookingType;

  if (booking.is_short_rest) {
    bookingType = 'Short Time';
  } else if (booking.is_late_checkout) {
    bookingType = 'Late Checkout';

  }  else if (booking.is_half_booking) {
    bookingType = 'Half Day';
  } else {
    bookingType = 'Full Time';
  }
  const row = `
   <tr data-id="${booking.id}">
    <td class="">
      <p class="ui text size-textmd">${bookingType} Booking</p>
    </td>
    <td>
      <p class="ui text size-textmd">${date}</p>
    </td>
    <td>
      <p style="color: ${textColor}" class="ui text size-textmd booking__bill-status">${paymentStatus}</p>
    </td>
    <td>
      <p class="ui text size-textmd">₦${booking.amount.toLocaleString()}</p>
    </td>

    <td>
      <p class="ui text size-textmd"></p>
    </td>

    <td class="booking__table-menu">
      <p><i class="fa fa-ellipsis-v"></i></p>
      <p><i style="display: none;" class="fa fa-times"></i></p>
    </td>
    <td class="manage">
      <nav class="manage__nav">
        <ul class="manage__list">
          <li data-id="${booking.id}" data-name="${booking.duration} Night(s) Booking" class="manage__item service__clear-room-bill">
            <i class="fa fa-money-bill-wave"></i>Clear Bill
          </li>
            <li data-id="${booking.id}" class="manage__item guest__list-bookDetail guest__listMenu">
              <i class="fa fa-eye"></i>Booking Details
           </li>
           <li data-id="${booking.id}" class="manage__item guest__listPrint  guest__listMenu">
            <i class="fa fa-print"></i>Print Receipt
          </li>
        </ul>
      </nav>
    </td>
  </tr>`;
  return row;
}

export function orderDetails(
  customer, order, order_items, cleared_by, ordered_by, date, time
) {
  const guestType = customer.is_guest ? 'Lodged' : 'Walk In';
  const paymentStatus = (
    order.is_paid ? { status: 'Paid', color: 'green' } :
    {status: 'Pending', color: 'red' }
  );

  // Check if bill has been cleared
  const cleared = (
    cleared_by !== null ? { firstName: cleared_by.first_name, lastName: cleared_by.last_name, role: cleared_by.portfolio  } :
    { firstName: ordered_by.first_name, lastName: ordered_by.last_name, role: ordered_by.portfolio }
  );
  const hideBillClearBy = !order.is_paid ? 'hide' : '';
  $('#order__info').append(
    `<h3>Order Info.</h3>
      <p><b>Guest Name</b> - ${customer.name}</p>
      <p><b>Guest Type</b> - ${guestType}</p>
      <p><b>Purchase Date</b> - ${date}</p>
      <p><b>Purchase Time</b> - ${time}</p> 
      <p><b>Payment Method</b> - ${order.payment_type}</p>
      <p><b>Payment Status</b> - <span style="color: ${paymentStatus.color};">${paymentStatus.status}</span></p><br />
      <p><em><b>Ordered By</b> - ${ordered_by.first_name} ${ordered_by.last_name} (${ordered_by.portfolio})</em></p>
      <p class="${hideBillClearBy}"><em><b>Bill Handle By</b> - ${cleared.firstName} ${cleared.lastName} (${cleared.role})</em></p>
             `
  );
  order_items.forEach(({ name, qty, amount }) => {
    $('#order__itemList').append(`<li class="order__item">
               ${name}&nbsp;&nbsp;&nbsp;
               <em>${qty}&nbsp;&nbsp;&nbsp;</em>
               <em>₦${amount.toLocaleString()}</em>
             </li>`);
  });
  $('#order__totalAmount').text('₦' + order.amount.toLocaleString());
  $('#order__print-receipt').attr('data-id', `${order.id}`);
}


export function saleBreakdownModal() {
  const template = `<div class="sale__button-date--container">
    <p id="sales__date" class="sale__date-summary"></p>
    <button class="close-btn closePopupModal">×</button>
    </div>
    <div id="summary__item-sold">
    <h5 class="sale__summary-title">
    Daily Sales Breakdown By Item Sold
    </h5>
    <div>
    <!-- This section is dynamically loaded -->
    <div class="sale__summary-flex">
    <p>Total Room Sold</p>
    <button id="maintotal__room-sale--btn" class="highlight-btn table__header-cell ui heading size-headings main__item-sold">View Details</p>
    </div>
    <div class="sale__summary-flex">
    <p>Total Drink Sold</p>
    <button id="maintotal__drink-sale--btn" class="highlight-btn table__header-cell ui heading size-headings main__item-sold">View Details</p>
    </div>
    <div class="sale__summary-flex">
    <p>Total Food Sold</p>
    <button id="maintotal__food-sale--btn" class="highlight-btn table__header-cell ui heading size-headings main__item-sold">View Details</p>
    </div>
    <div class="sale__summary-flex">
    <p>Toatal Game Sold</p>
    <button id="maintotal__game-sale--btn" class="item__sold highlight-btn table__header-cell ui heading size-headings main__item-sold">View Details</p>
    </div>
    <div class="sale__summary-flex">
    <p>Toatal Laundry Sold</p>
    <button id="maintotal__laundry-sale--btn" class="item__sold highlight-btn table__header-cell ui heading size-headings main__item-sold">View Details</p>
    </div>
    </div>
    </div>`;
  return template;
}

export function dailyServiceSaleTableTemplate(
  index, id, is_paid, customer, itemName, qty, amount, is_booking
) {
  let paymentStatus = '';
  let paymentStatusColor = '';

  if (!is_booking) {
    paymentStatus = is_paid ? 'Paid' : 'Pending';
    paymentStatusColor = is_paid ? 'green' : 'red';
  } else {
    paymentStatus = is_paid === 'yes' ? 'Paid' : 'Pending';
    paymentStatusColor = is_paid === 'yes' ? 'green' : 'red';
  }
  const row = `<tr data-id="${id}">
    <td class="">
    <p class="ui text size-textmd">${index + 1}</p>
    </td>
    <td class="">
    <p class="ui text size-textmd">${customer}</p>
    </td>
    <td class="">
    <p class="ui text size-textmd">${itemName}</p>
    </td>
    <td class="">
    <p class="ui text size-textmd">${qty}</p>
    </td>
    <td>
    <p style="color: ${paymentStatusColor}; margin-left: 25px;" class="ui text size-textmd order__bill-status">${paymentStatus}</p>
    </td>
    <td>
    <p class="ui text size-textmd" style="text-align: left; margin-left: 10px;">₦${amount.toLocaleString()}</p>
    </td>

    <td style="visibility: hidden;" class="order__table-menu">
    <p><i class="fa fa-ellipsis-v"></i></p>
    <p><i style="display: none;" class="fa fa-times"></i></p>
    </td>
    <!--<td class="manage">
    <nav class="manage__nav">
    <ul class="manage__list">
    <li data-id="${id}" class="manage__item order__manageItem order__showConfirmModal">
    <i class="fa fa-shopping-cart"></i>Order Details
    </li>
    <li data-id="${id}" class="manage__item order__print order__manageItem">
    <i class="fa fa-print"></i>Print Receipt
    </li>
    </ul>
    </nav>
    </td>-->
    </tr>;`
  return row;
}
