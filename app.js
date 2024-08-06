const express = require ('express');
const path = require('path');
const indexRouter = require('./routes/index');
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketIO = require('socket.io');
const io = socketIO(server);    
  let waitingusers = [];    
  let rooms = {};
io.on('connection', (socket) => {
    socket.on("joinroom",function(){
        if(waitingusers.length>0){
            let partner = waitingusers.shift();
            let roomname = `${socket.id}-${partner.id}`;
            
            socket.join(roomname);
            partner.join(roomname);
            io.to(roomname).emit("joined",roomname);
        }else{
            waitingusers.push(socket);
        }
    });
    socket.on("disconnect",function(){
        let index = waitingusers.findIndex(user=>user.id===socket.id);
        waitingusers.splice(index,1);
    });
    socket.on("message",function(data){
        console.log(data);
        socket.broadcast.to(data.room).emit("message",data.message);
    });

});

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/",indexRouter);
server.listen(3000, () => {
    console.log('Server is running on port 3000');
}); 