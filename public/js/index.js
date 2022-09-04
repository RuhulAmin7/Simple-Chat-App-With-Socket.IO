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

// global variables
let activeUsers;

// open chat box function
function openChatBox(user) {
  chatBox.hidden = false;
  chatBoxTitle.textContent = user.id === socket.id ? 'You' : user.name;
  chatInputForm[1].value = user.id;
}

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
  if (message) {
    socket.emit('sendMessage', { message, id }, () => {
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
  const user = activeUsers.find((usr) => usr.id === data.id);
  openChatBox(user);
  const sender = activeUsers.find((usr) => usr.id === sender_Id);
  openChatBox(sender);
  const li = document.createElement('li');
  li.style.listStyle = 'none';
  li.textContent = sender.name + ': ' + data.message;
  displayChatUl.appendChild(li);
}); 

// get public rooms
socket.on('getPublicRooms',(publicRooms)=>{
  console.log(publicRooms)
})
