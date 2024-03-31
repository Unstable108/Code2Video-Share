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

const connectedUsers = {};

io.on("connection", (socket) => {
  socket.on("join", (uid, id, name) => {
    console.log(`${id} joined the room ${uid}`);
    socket.join(uid);
    
    connectedUsers[uid] = connectedUsers[uid] || [];
    connectedUsers[uid].push(name);
    
    socket.broadcast.to(uid).emit("user-connected", id);
    io.sockets.to(uid).emit("name", connectedUsers[uid]);
    
    socket.on("disconnect", () => {
      console.log(`${id} left the room ${uid}`);
      const index = connectedUsers[uid].indexOf(name);
      if (index !== -1) {
        connectedUsers[uid].splice(index, 1);
        socket.broadcast.to(uid).emit("user-dis", id);
      }
    });
  });

  socket.on("message", (name, message, uid) => {
    console.log(`${name}: ${message}`);
    socket.broadcast.to(uid).emit("receive", name, message);
  });

  socket.on("editor_message", (message, uid) => {
    socket.broadcast.to(uid).emit("text_editor", message);
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
  const uid = req.params.id;
  console.log(uid);
  const name = req.query.name;
  res.render("file", { id: uid, name: name });
});

server.listen(port, () => {
  console.log(`App is listening at port ${port}`);
});
