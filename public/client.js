var cm = CodeMirror.fromTextArea(document.getElementById("textarea"), {
  styleActiveLine: true,
  lineNumbers: true,
  theme: "darcula",
  mode: "text/x-csrc",
  matchBrackets: true,
});
var value = "";
for (var i = 0; i < 14; i++) {
  value += "\n";
}
cm.setValue(value);
const socket = io();
const dis = document.getElementById("video-grid");
const peer = new Peer(undefined, {
  secure: true,
  path: "/peerjs", // Update the path to match your PeerJS server configuration
  host: "/", // Update the host to match your PeerJS server configuration
  port: "443", // Update the port to match your PeerJS server configuration
});
const myv = document.createElement("video");
let myVideoStream;
myv.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then(function (stream) {
    myVideoStream = stream;
    addvideo(myv, stream);

    peer.on("call", function (call) {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", function (userstream) {
        addvideo(video, userstream);
      });
      call.on("close", function () {
        video.remove();
      });
    });
    socket.on("user-connected", function (id) {
      console.log("user connected ");
      setTimeout(naya, 2000, id, stream);
    });
  });

peer.on("open", function (id) {
  socket.emit("join", uid, id, name);
});
socket.on("user-dis", function (id) {
  if (peers[id]) peers[id].close();
});
function naya(id, stream) {
  const call = peer.call(id, stream);
  const video = document.createElement("video");
  call.on("stream", function (newstream) {
    addvideo(video, newstream);
  });
  call.on("close", function () {
    video.remove();
  });
  peers[id] = call;
}
function addvideo(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", function () {
    video.play();
  });
  dis.append(video);
}
const messages = document.querySelector(".messages");
socket.on("receive", function (name, message) {
  console.log(name, message);
  messages.innerHTML += `<div class="message">
    <b><i class="far fa-user-circle"></i> <span> ${name}</span> </b> 
    <span>${message}</span>
</div>`;
});
let send = document.getElementById("send");
send.addEventListener("click", function () {
  let chat_message = document.getElementById("chat_message");
  messages.innerHTML += `<div class="message">
    <b><i class="far fa-user-circle"></i> <span> me </span> </b> 
    <span>${chat_message.value}</span>
</div>`;
  console.log("hello world");
  socket.emit("message", name, chat_message.value, uid);
  chat_message.value = "";
});
const names = document.getElementById("editors");
socket.on("name", function (friendname) {
  names.innerHTML = "";
  friendname.forEach((data) => {
    names.innerHTML += `<li class="list-group-item">${data}</li>`;
  });
});
const editor = document.getElementById("editor");
function changeInTextEditor() {
  const val = cm.getValue();
  socket.emit("editor_message", val, uid);
}
editor.addEventListener("keypress", function () {
  setTimeout(changeInTextEditor, 1000);
});
socket.on("text_editor", function (message) {
  cm.setValue(message);
});
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    let html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    let html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    let html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    let html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});
inviteButton.addEventListener("click", (e) => {
  prompt("Copy this link and send it to people you want to meet with", uid);
});
