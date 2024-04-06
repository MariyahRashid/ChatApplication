const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const
    { userJoin,
        getCurrentUser,
        userLeave,
        getRoomUsers
    } = require('./utils/users');

/* INITIALIZE VARIABLE CALLED APP AND SET IT TO EXPRESS */

const app = express();

// create  server variable
const server = http.createServer(app);

const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatApp Bot';

//run when a client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Welcome current user.
        socket.emit('message', formatMessage(botName, 'Welcome to ChatApp'));//emit to the single client connecting

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',
            formatMessage(botName, `${user.username} has joined the chat`));//emit to everyone except the user that is connected


        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //runs when a client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)

        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`)
            );  //emit to everyone user has left the chat.

            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

    });
});


const PORT = 3000 || process.env.PORT;


server.listen(PORT, () => console.log(`Server Running on port ${PORT}!`));
