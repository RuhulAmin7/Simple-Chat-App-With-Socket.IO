var socket = io();
// socket

// elements selections
const displayChatUl = document.getElementById('display-chat-ul');
const chatInputForm = document.getElementById('chat-input-form');
const button = document.getElementById('button');
const nameForm = document.getElementById('name-form');
const nameArea = document.getElementById('name-area');
const roomArea = document.getElementById('room-area');
const activeUserUl = document.getElementById('active-users-list');
const chatBox = document.getElementById('chat_box');
const chatBoxTitle = document.getElementById('chat_box_title');
const createBtn = document.getElementById('create-btn');
const roomNameInputEl = document.getElementById('room-name-input');
const createRoomBtn = document.getElementById('create-room-btn');
const publicRoomsDiv = document.getElementById('accordionFlushExample');

// global variables
let activeUsers;
let publicRooms;

// create room functionality
createRoomBtn.addEventListener('click', (e) => {
  const roomName = roomNameInputEl.value;
  if (roomName) {
    socket.emit('createRoom', roomName, () => {
      console.log('Room created');
    });
  }
});

// name form  handler
nameForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const name = nameForm[0].value;
  if (!name) return;
  socket.emit('setName', name, () => {
    nameArea.hidden = true;
    roomArea.hidden = false;
  });
});

// chat room handler
chatInputForm.addEventListener('submit', function (e) {
  e.preventDefault();
});

// get active users
socket.on('get_active_users', function (users) {
  activeUsers = users;
  activeUserUl.textContent = '';
  activeUsers.forEach((user) => {
    const li = document.createElement('li');
    li.addEventListener('click', () => {
      openChatBox(user);
      displayChatUl.innerHTML = '';
    });
    li.textContent = user.id === socket.id ? 'You' : user.name;
    li.dataset.id = user.id;
    activeUserUl.appendChild(li);
  });
});

// send a private message to the server
chatInputForm.addEventListener('submit', () => {
  const message = chatInputForm[0].value;
  const id = chatInputForm[1].value;
  const isRoom = chatInputForm[1].dataset.room;
  if (message) {
    socket.emit('sendMessage', { message, id, isRoom }, () => {
      const li = document.createElement('li');
      li.textContent = 'You: ' + message;
      li.style.textAlign = 'right';
      li.style.color = 'green';
      li.style.listStyle = 'none';
      displayChatUl.appendChild(li);
      chatInputForm[0].value = '';
    });
  }
});

// receive messages from the server
socket.on('rcv_message', (data, sender_Id) => {
  const isRoom = data.isRoom;
  const user = activeUsers.find((usr) => usr.id === data.id);
  // openChatBox(user);
  const sender = activeUsers.find((usr) => usr.id === sender_Id);
  if (isRoom) {
    chatBox.hidden = false;
    chatBoxTitle.textContent = data?.id;
    chatInputForm[1].value = data?.id;
    chatInputForm[1].dataset.room = true;
  } else {
    displayChatUl.innerHTML = '';
    openChatBox(sender);
    chatInputForm[1].dataset.room = false;

  }
  const li = document.createElement('li');
  li.style.listStyle = 'none';
  li.textContent = sender.name + ': ' + data.message;
  displayChatUl.appendChild(li);
});

// get public rooms
socket.on('getPublicRooms', (rooms) => {
  publicRooms = rooms;
  publicRoomsDiv.innerHTML = '';
  rooms.forEach((room) => {
    const accordionItem = document.createElement('div');
    accordionItem.classList.add('accordion-item');
    accordionItem.innerHTML = `
    <h2 class="accordion-header" id="${room.id}id">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${room.id}collapse" aria-expanded="false" aria-controls="${room.id}collapse">
                                ${room.roomName} (${room.size})
                                <span class="ms-2"
                                onclick="joinRoom('${room.roomName}')">
                                <i class="fa-solid fa-user-plus"></i>
                                </span>
                                <span class="ms-2"
                                onclick="leaveRoom('${room.roomName}')">
                                <i class="fa-solid fa-person-walking-arrow-right"></i>
                                </span>

                                </button>
                              </h2>
                              <div id="${room.id}collapse" class="accordion-collapse collapse" aria-labelledby="${room.id}id" data-bs-parent="#accordionFlushExample">
                                <div class="accordion-body">
                                <ul id="participants" class="list-group">
                                </ul>
                                <div>
                                </div>
                                </div>
                              </div>
                              `;
    const participantUl = document.querySelector('#participants');
    room?.participants?.forEach((participant) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      li.textContent = participant.name;
      participantUl?.appendChild(li);
    });
    console.log(participantUl);
    publicRoomsDiv.appendChild(accordionItem);
  });
});

// open chat box function
function openChatBox(user) {
  chatBox.hidden = false;
  chatBoxTitle.textContent = user?.id === socket?.id ? 'You' : user?.name;
  chatInputForm[1].value = user?.id;
}

// join room function
function joinRoom(roomName) {
  displayChatUl.innerHTML = '';
  socket.emit('joinRoom', roomName, () => {
    chatBox.hidden = false;
    chatBoxTitle.innerText = roomName;
    chatInputForm[1].value = roomName;
    chatInputForm[1].dataset.room = true;
  });
}
// leave room function
function leaveRoom(roomName) {
  socket.emit('leaveRoom', roomName, () => {
    chatBox.hidden = true;
  });
}
