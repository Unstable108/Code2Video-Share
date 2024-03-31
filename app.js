const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { v4: uuidV4 } = require("uuid");
const bodyParser = require("body-parser");
const url = require("url");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Object to store active rooms and their participants
const activeRooms = {};

io.on("connection", (socket) => {
  socket.on("join", (roomId, userId, userName) => {
    // Join the specified room
    socket.join(roomId);

    // If the room doesn't exist, create it
    if (!activeRooms[roomId]) {
      activeRooms[roomId] = [];
    }

    // Add the user to the room
    activeRooms[roomId].push({ id: userId, name: userName });

    // Notify other users in the room about the new user
    socket.broadcast.to(roomId).emit("user-connected", userId);

    // Update user list for all users in the room
    io.sockets.to(roomId).emit("name", activeRooms[roomId].map(user => user.name));

    // Handle user disconnection
    socket.on("disconnect", () => {
      const index = activeRooms[roomId].findIndex(user => user.id === userId);
      if (index !== -1) {
        activeRooms[roomId].splice(index, 1);
        socket.broadcast.to(roomId).emit("user-dis", userId);
        io.sockets.to(roomId).emit("name", activeRooms[roomId].map(user => user.name));
      }
    });
  });

  // Handle chat messages
  socket.on("message", (name, message, roomId) => {
    socket.broadcast.to(roomId).emit("receive", name, message);
  });

  // Handle text editor messages
  socket.on("editor_message", (message, roomId) => {
    socket.broadcast.to(roomId).emit("text_editor", message);
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/join", (req, res) => {
  res.redirect(
    url.format({
      pathname: `/${uuidV4()}`,
      query: req.query,
    })
  );
});

app.get("/joinold", (req, res) => {
  res.redirect(
    url.format({
      pathname: req.query.meeting_id,
      query: req.query,
    })
  );
});

app.get("/:id", (req, res) => {
  const roomId = req.params.id;
  const userName = req.query.name;
  res.render("file", { id: roomId, name: userName });
});

server.listen(port, () => {
  console.log(`App is listening at port ${port}`);
});
