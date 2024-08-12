const express = require ('express');
const path = require('path');
const indexRouter = require('./routes/index');
const app = express();
const http = require('http');
var logger = require('morgan');
const server = http.createServer(app);
const socketIO = require('socket.io');
const expressSession=require('express-session');
var cookieParser = require('cookie-parser');
app.use(expressSession({
    resave:false,
    saveUninitialized: false,
    secret:"hellohellobyebye"
  }));

const io = socketIO(server);    
let waitingusers = [];

io.on('connection', (socket) => {
    socket.on("joinroom", function(data){
        // Remove the socket from waiting users if it exists, to avoid duplicates
        waitingusers = waitingusers.filter(user => user.socket.id !== socket.id);

        if (waitingusers.length > 0) {
            let partnerData = waitingusers.shift();
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
            waitingusers.push({ socket: socket, username: data.room });
        }
    });

    socket.on("disconnect", function(){
        // Remove socket from waiting users
        waitingusers = waitingusers.filter(user => user.socket.id !== socket.id);

        // Leave any joined rooms
        if (socket.roomname) {
            socket.leave(socket.roomname);
        }
    });

    socket.on("message", function(data){
        console.log(data);
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("message", data.message);
        }
    });

    socket.on("signalingMessage", function(data){
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("signalingMessage", data.message);
        }
    });

    socket.on("startVideoCall", function(){
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("incomingCall");
        }
    });

    socket.on("acceptCall", function(){
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("callAccepted");
        }
    });

    socket.on("rejectCall", function(){
        if (socket.roomname) {
            socket.broadcast.to(socket.roomname).emit("callRejected");
        }
    });
});




app.use(logger('dev'));
app.set("trust proxy", 1);

app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/",indexRouter);
server.listen(process.env.PORT||3000, () => {
    console.log('Server is running on port 3000');
}); 