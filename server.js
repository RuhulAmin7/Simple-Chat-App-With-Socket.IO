const express = require('express');
const app = express();
const http = require('http');
const expressServer = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(expressServer);

// middleware
app.use(express.static('public'));

io.on('connection', function (socket) {
  // get all connected users
  const getOnlineUsers = async () => {
    const activeUserSockets = io.sockets.sockets;
    const sids = await io.sockets.adapter.sids;
    const sidsArray = [...sids.keys()];
    const activeUsersArray = []
    sidsArray.forEach(userId => {
      const userSocket = activeUserSockets.get(userId)
     if(userSocket.name) {
      activeUsersArray.push({
        id: userSocket.id,
        name: userSocket.name
      });
     }
    })
    return activeUsersArray;
  };

  // set user name
  socket.on('setName', async function (name, cb) {
    socket.name = name;
    cb();
    const activeUsers = await getOnlineUsers()
    io.emit('get_active_users', activeUsers)
  });


// receive a private message
socket.on('sendMessage', (data, cb)=>{
  const message = data.message;
  const id = data.id;
// send message to user
  io.to(id).emit('rcv_message', data, socket.id)
  cb()

})










  // user  disconnection
  socket.on('disconnect', async(data) => {
    const activeUsers = await getOnlineUsers()
    io.emit('get_active_users', activeUsers)
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

expressServer.listen(3000, () =>
  console.log('Server is running at http://localhost:3000')
);
