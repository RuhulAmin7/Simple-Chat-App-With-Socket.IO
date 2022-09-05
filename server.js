const { log } = require('console');
const express = require('express');
const app = express();
const http = require('http');
const expressServer = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(expressServer);

// middleware
app.use(express.static('public'));

// user connection
io.on('connection', function (socket) {
  // get all connected users
  const getOnlineUsers = async () => {
    const activeUserSockets = io.sockets.sockets;
    const sids = await io.sockets.adapter.sids;
    const sidsArray = [...sids.keys()];
    const activeUsersArray = [];
    sidsArray.forEach((userId) => {
      const userSocket = activeUserSockets.get(userId);
      if (userSocket.name) {
        activeUsersArray.push({
          id: userSocket.id,
          name: userSocket.name,
        });
      }
    });
    return activeUsersArray;
  };

  // user  disconnection
  socket.on('disconnect', async (data) => {
    const activeUsers = await getOnlineUsers();
    io.emit('get_active_users', activeUsers);
    const publicRooms = await getPublicRooms();
    io.emit('getPublicRooms', publicRooms);
  });

  // get public rooms
  async function getPublicRooms() {
    const rooms = await io.sockets.adapter.rooms;
    const sids = await io.sockets.adapter.sids;
    const allSockets = await io.sockets.sockets;
    const roomKeys = [...rooms.keys()];
    const sidsKeys = [...sids.keys()];

    let publicRooms = [];
    let roomId = 0;
    for (let roomName of roomKeys) {
      if (!sidsKeys.includes(roomName)) {
        const participantSet = rooms.get(roomName);
        const size = participantSet.size;

        const participants = [];
        for (let id of [...participantSet]) {
          const userSocket = allSockets.get(id);
          participants.push({
            id: userSocket.id,
            name: userSocket.name,
          });

          publicRooms.push({
            id: 'a' + roomId + Date.now(),
            roomName,
            size,
            participants,
          });
          ++roomId;
        }
      }
    }
    console.log(publicRooms);
    return publicRooms;
  }

  // set user name
  socket.on('setName', async function (name, cb) {
    socket.name = name;
    cb();
    const activeUsers = await getOnlineUsers();
    io.emit('get_active_users', activeUsers);
    const publicRooms = await getPublicRooms();
    io.emit('getPublicRooms', publicRooms);
  });

  // receive a private message
  socket.on('sendMessage', (data, cb) => {
    const id = data.id;
    const message = data.message;
    const isRoom = data.isRoom === 'false' ? false : data.isRoom;
    data.isRoom = isRoom;
    if (isRoom) {
      socket.to(id).emit('rcv_message', data, socket.id);
    } else {
      // send message to user
      io.to(id).emit('rcv_message', data, socket.id);
      cb();
    }
  });

  // create a public room
  socket.on('createRoom', async (roomName, callback) => {
    socket.join(roomName);
    const publicRooms = await getPublicRooms();
    io.emit('getPublicRooms', publicRooms);
    callback();
  });

  // join a room
  socket.on('joinRoom', async (roomName, cb) => {
    socket.join(roomName);
    const publicRooms = await getPublicRooms();
    io.emit('getPublicRooms', publicRooms);
    cb();
  });

  // leave from room
  socket.on('leaveRoom', async (roomName, cb) => {
    socket.leave(roomName);
    const publicRooms = await getPublicRooms();
    io.emit('getPublicRooms', publicRooms);
    cb();
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

expressServer.listen(3000, () =>
  console.log('Server is running at http://localhost:3000')
);
