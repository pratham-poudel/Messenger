const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');
const app = express();
const http = require('http');
const logger = require('morgan');
const server = http.createServer(app);
const socketIO = require('socket.io');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');

app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "hellohellobyebye"
}));

const io = socketIO(server);    
let waitingUsers = [];
let globalCounter = 0;
const connectedUsers = new Set(); // Track connected users by socket IDs

io.on('connection', (socket) => {
    // Add to connected users
    connectedUsers.add(socket.id);
    globalCounter = connectedUsers.size; // Update global counter based on connected users
    io.emit("updateUserCount", globalCounter); // Emit the user count to all clients

    socket.on("joinroom", function(data) {
        // Remove the socket from waiting users if it exists
        waitingUsers = waitingUsers.filter(user => user.socket.id !== socket.id);

        if (waitingUsers.length > 0) {
            let partnerData = waitingUsers.shift();
            let partnerSocket = partnerData.socket;
            let partnerUsername = partnerData.username;

            let roomname = `${socket.id}-${partnerSocket.id}`;

            socket.join(roomname);
            partnerSocket.join(roomname);

            // Emit each other's usernames
            socket.emit("joined", partnerUsername);
            partnerSocket.emit("joined", data.room);

            // Store room name in socket data for future reference
            socket.roomname = roomname;
            partnerSocket.roomname = roomname;
        } else {
            waitingUsers.push({ socket: socket, username: data.room });
        }
    });

    socket.on("disconnect", function() {
        // Remove from connected users
        connectedUsers.delete(socket.id);
        globalCounter = connectedUsers.size; // Update global counter based on connected users
        io.emit("updateUserCount", globalCounter); // Emit the updated user count to all clients

        if (socket.roomname) {
            socket.to(socket.roomname).emit('userDisconnected', { userId: socket.id });
            socket.leave(socket.roomname);
        }

        waitingUsers = waitingUsers.filter(user => user.socket.id !== socket.id);
    });

    // Handle other socket events
    socket.on("message", function(data) {
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("message", data.message);
        }
    });

    socket.on("signalingMessage", function(data) {
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("signalingMessage", data.message);
        }
    });

    socket.on("startVideoCall", function() {
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("incomingCall");
        }
    });

    socket.on("acceptCall", function() {
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("callAccepted");
        }
    });

    socket.on("rejectCall", function() {
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("callRejected");
        }
    });
});

app.use(logger('dev'));
app.set("trust proxy", 1);
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/", indexRouter);

server.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});
