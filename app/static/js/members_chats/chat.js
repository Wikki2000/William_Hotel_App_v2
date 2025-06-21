// NOTE: The `socket` variable is declared globally in the `setup_chat.js` file

import { fetchData, ajaxRequest, getBaseUrl,updateElementCount } from '../global/utils.js';
import  { userGroup, messageTemplate } from '../global/templates.js';

function displayChat(username, profile_photo, userId, msg) {
  const photoSrc = (
    profile_photo ? `data:image/;base64, ${profile_photo}` :
    '/static/images/public/profile_photo_placeholder.png'
  );
  const currentUserId = localStorage.getItem('userId');
  const receiverName = userId === currentUserId ? '' : username;
  $('#chat-messages').append(
    messageTemplate(msg, photoSrc, receiverName)
  );
}

function scrollToBottom($container) {
  $container.scrollTop($container[0].scrollHeight);
}

$(document).ready(function() {

  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  // Handle sending of group and private messages
  $('#friends__groups-list').on('click', '.chat__list', function() {

    const $clickItem = $(this);
    const chatType = $clickItem.data('type');
    const chatId = $clickItem.data('id');

    $('#chat-type').val(chatType);
    $('#chat-id').val(chatId);

    $clickItem.prop('disable', true); // Prevent multiple click.

    // Shrink sidebar and show chat window
    $('.sidebar').css('width', '25%');
    $('.chat-window').show();

    // Highlight the click item
    $('.chat__list').removeClass('highlight-sidebar');
    $clickItem.addClass('highlight-sidebar');

    const msg = $('#chat__msg-content').val();
    $('#chat__msg-content').val('');

    $('#chat-messages').empty(); // remove previous to load a new one

    // Load previous chat.
    if (chatType === 'group') {  // Load Group Chat
      // Assumption: Only WCHS Group exists
      const photo = '/static/images/public/hotel_logo.png';
      $('#chat__title').text('WCHS Group');
      $('#chat__titlePhoto').attr('src', photo);

      // Join group chat room
      socket.emit('join_group_chat', { chat_id: chatId })

      const groupMsgUrl = API_BASE_URL + `/messages/${chatId}/group`;
      fetchData(groupMsgUrl)
        .then((data) => {

          $clickItem.prop('disable', false);

          data.forEach(({ user, message }) => {
            const msg = message.text ? message.text : message.media;
            displayChat(user.username, user.profile_photo, user.id, msg);
          });
          scrollToBottom($('#chat-messages'));
        })
        .catch((error) => {
          $clickItem.prop('disable', false);
        });
    } else if (chatType === 'private') {  // Load Private Chat
      const chatTitle = $clickItem.find('.name').text();
      const photoSrc = $clickItem.find('.profile img').attr('src');

      $('#chat__title').text(chatTitle);
      $('#chat__titlePhoto').attr('src', photoSrc);

      socket.emit('join_private_chat', { chat_id: chatId })

      const privateMsgUrl = API_BASE_URL + `/messages/${chatId}/private`;
      fetchData(privateMsgUrl)
        .then((data) => {

          $clickItem.prop('disable', false);

          data.forEach(({ user, message }) => {
            const msg = message.text ? message.text : message.media;
            displayChat(user.username, user.profile_photo, user.id, msg);
          });
          scrollToBottom($('#chat-messages'));
        })
        .catch((error) => {
          $clickItem.prop('disable', false);
        });
    }

    $('#send__msg-btn').off('click').on('click', function() {
      const msg = $('#chat__msg-content').val();
      $('#chat__msg-content').val('');

      // Ensure that an empty message is not sent
      if (msg.length === 0) {
        return;
      }
      // Handle group chat
      if ($('#chat-type').val() === 'group') {
        socket.emit('group_message', {
          chat_id: $('#chat-id').val(),
          message: msg
        });
      } else if ($('#chat-type').val() === 'private') {
        const id = $('#chat-id').val();
        socket.emit('private_message', {
          chat_id: id,
          message: msg
        });
      }
    });
  });

  // Event handler for receiving group messages
  socket.on('received_group_message', function({
    message, username, user_id, user_photo
  }) {
    displayChat(username, user_photo, user_id, message);
    scrollToBottom($('#chat-messages'));
  });

  // Event handler for receiving private messages
  socket.on('received_private_message', function({
    message, sender_name, receiver_name, user_id, user_photo
  }) {
    displayChat(sender_name, user_photo, user_id, message);
    scrollToBottom($('#chat-messages'));
  });

  // Triger send message button when `enter` key is press.
  $('#chat__msg-content').keypress(function(e) {
    if (e.which === 13) {
      $('#send__msg-btn').click();
    }
  });

  const chatContainer = $("#chat-messages");
  const scrollButton = $("#scroll-to-bottom");

  // Show the button when the user scrolls up
  chatContainer.on("scroll", function () {
    const scrollTop = $(this).scrollTop();
    const scrollHeight = $(this)[0].scrollHeight;
    const containerHeight = $(this).outerHeight();

    // Show the button if not at the bottom
    if (scrollTop + containerHeight < scrollHeight - 10) {
      scrollButton.fadeIn();
    } else {
      scrollButton.fadeOut();
    }
  });

  // Scroll to the bottom when the button is clicked
  scrollButton.on("click", function () {
    chatContainer.animate({ scrollTop: chatContainer[0].scrollHeight }, 500);
  });
});
