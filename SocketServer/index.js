//TODO: Add support for nicknames.
//TODO: Show whos connected to the drawing board

//FUTURE_DO: Restful api to store user logins and secure login routes, mongodb intergration to save canvas's to user accounts and load them later
//FUTURE_DO: Lobby system, encapsulate socket.io / p5 canvas application inside a react app front end for more social media like features

var express = require("express")
var app = express()
var HTTP_PORT = process.env.PORT || 8000

app.use(express.static("public"));

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
 
var server = app.listen(HTTP_PORT, () => {
    console.log("Ready to handle requests on port " + HTTP_PORT);
});

var socket = require("socket.io")
var io = socket(server)

//TODO: Figure out how either save the canvas or how to start new connections with the current canvas rather than a blank one
// i.e for the latter: if client a draws before client b connects, then client b will not see what client a drew previously
io.sockets.on("connection", (socket) => {
    console.log(socket.id + " Connected.")

    socket.on('setRoom', (data) => {
        socket.join(data)
        console.log(socket.id, " Joined Room Name: ", data)
    })

    socket.on('leaveRoom', (data) => {
        socket.leave(data)
        console.log(socket.id, " Joined Room Name: ", data)
    })

    socket.on('refresh', (data) => {
        io.sockets.to(data.room).emit('refresh', data)
        console.log(socket.id, " Sent: ", data)
    })  

    socket.on('mouse', (data) => {
        socket.broadcast.to(data.room).emit('mouse', data)
        //io.sockets.emit('mouse', data) //alternative to the above that will send data to all connected clients 
        //including the client that sent the data, the above line sends data to all clients except the one that sent it

        //console.log(socket.id, " Sent: ", data)
    }) //Server recieves mouse cords from client
    
    socket.on('touch', (data) => {
        socket.broadcast.to(data.room).emit('touch', data)
        //io.sockets.emit('mouse', data) //alternative to the above that will send data to all connected clients 
        //including the client that sent the data, the above line sends data to all clients except the one that sent it

        //console.log(socket.id, " Sent: ", data)
    }) //Server recieves mouse cords from client
})
