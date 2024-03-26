const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const bp = require("body-parser");
const url = require("url");

const port = process.env.PORT || 3000;

app.use(bp.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

var arr = {};

io.on("connection", function (socket) {
  socket.on("join", function (uid, id, name) {
    console.log(id);
    socket.join(uid);
    if (arr.hasOwnProperty(uid)) {
      arr[uid].push(name);
    } else {
      arr[uid] = [name];
    }

    socket.broadcast.to(uid).emit("user-connected", id);
    io.sockets.to(uid).emit("name", arr[uid]);
    console.log(arr[uid]);
    socket.on("disconnect", function () {
      socket.broadcast.to(uid).emit("user-dis", id);
    });
  });

  socket.on("message", function (name, message, uid) {
    console.log(name);
    console.log(message);
    socket.broadcast.to(uid).emit("receive", name, message);
  });

  socket.on("editor_message", function (message, uid) {
    socket.broadcast.to(uid).emit("text_editor", message);
  });
});

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/join", function (req, res) {
  res.redirect(
    url.format({
      pathname: `/${uuidV4()}`,
      query: req.query,
    })
  );
});

app.get("/joinold", function (req, res) {
  res.redirect(
    url.format({
      pathname: req.query.meeting_id,
      query: req.query,
    })
  );
});

app.get("/:id", function (req, res) {
  const uid = req.params.id;
  console.log(uid);
  const nam = req.query.name;
  res.render("file", { id: uid, name: nam });
});

server.listen(port, function () {
  console.log(`App is listening at port ${port}`);
});
