const listContainer = document.getElementById("listContainer");
const userArray = {};
let display = 0;

document.addEventListener("DOMContentLoaded", () => {
  socketInitialize();
});

const socketInitialize = () => {
  socket = io(game);

  socket.on("connect", () => {
    socket.emit("admin");
  });

  socket.on("handshake", (id, socketId) => {
    if (display == 0) {
      userArray[id] = socketId;
      refreshList();
      socket.emit("connected", socketId);
    }
  });

  socket.on("disconnected", (socketId) => {
    delete userArray[Object.keys(userArray).find((key) => userArray[key] === socketId)];
    refreshList();
  });
};

const refreshList = () => {
  listContainer.innerHTML = "";
  for (let i = 0; i < Object.keys(userArray).length; i++) {
    const target = Object.keys(userArray)[i];
    listContainer.innerHTML += `<p class="listElement"><strong>Player ${target}</strong> - ${userArray[target]}</p>`;
  }
};

const buttonClicked = () => {
  for (let i = 0; i < Object.keys(userArray).length; i++) {
    const target = Object.keys(userArray)[i];
    socket.emit("initialize", userArray[target]);
  }
};
