const listContainer = document.getElementById("listContainer");
const buttons = [document.getElementById("mainButton"), document.getElementById("subButton")];
const users = {};
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
      users[id] = { socketId: socketId };
      refreshList("socketId");
      socket.emit("connected", socketId);
    }
  });

  socket.on("disconnected", (socketId) => {
    delete users[Object.keys(users).find((key) => users[key] === socketId)];
    refreshList("socketId");
  });
};

const refreshList = (key) => {
  listContainer.innerHTML = "";
  for (let i = 0; i < Object.keys(users).length; i++) {
    const target = Object.keys(users)[i];
    listContainer.innerHTML += `<p class="listElement"><strong>Player ${target}</strong> - ${users[target][key]}</p>`;
  }
};

const buttonClicked = () => {
  switch (display) {
    case 0:
      display = 1;
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        users[target].nickname = "waiting..";
        socket.emit("initialize", users[target]["socketId"]);
      }
      refreshList("nickname");
      buttons[0].textContent = "Next";
      buttons[0].disabled = true;
      break;
  }
};
