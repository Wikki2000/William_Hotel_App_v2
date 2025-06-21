import {
  fetchData, ajaxRequest, getBaseUrl } from '../global/utils.js';
import  { userGroup, messageTemplate } from '../global/templates.js';


$(document).ready(function() {

  const API_BASE_URL = getBaseUrl()['apiBaseUrl'];
  const APP_BASE_URL = getBaseUrl()['appBaseUrl'];

  // Connect socket and check if connected success
  window.socket = io();
  socket.on('connect', function() {
    //console.log('SocketIO connected');
  });

   $('.chat-window').hide();  // Hide chat window till click on group or member

  // Display all groups and members in chatList
  const userGroupUrl = API_BASE_URL + '/users/groups';
  fetchData(userGroupUrl)
    .then(({ users, groups }) => {
      groups.forEach(({ name, id }) => {
        // Assumptions: Only one group can exist's at a time
        const photo = '/static/images/public/hotel_logo.png';
        const chatType = 'group';
        $('#friends__groups-list').append(
          userGroup(name, id, photo, chatType)
        );
     });
      users.forEach(({
	username, profile_photo, id,
	is_active, count_unread_messages
      })  => {
        const chatType = 'private';
        const photo = (
          profile_photo ? `data:image/;base64, ${profile_photo}` :
          '/static/images/public/profile_photo_placeholder.png'
        );
        $('#friends__groups-list')
	  .append(userGroup(
	    username, id, photo, chatType, is_active, count_unread_messages
	  )
        );
      })
    })
    .catch((error) => {
    });
});
