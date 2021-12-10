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

  socket.on("initialized", (name, socketId) => {
    if (display == 1) {
      console.log(name, socketId);
      users[Object.keys(users).find((key) => users[key].socketId === socketId)].nickname = name;
      refreshList("nickname");
      let isFinished = true;
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        if (users[target].nickname == "waiting..") isFinished = false;
      }
      if (isFinished) {
        buttons[0].disabled = false;
      }
    }
  });

  socket.on("disconnected", (socketId) => {
    if (display == 0) {
      delete users[Object.keys(users).find((key) => users[key].socketId === socketId)];
      refreshList("socketId");
    }
  });
};

const refreshList = (key, isOnline) => {
  listContainer.innerHTML = "";
  for (let i = 0; i < Object.keys(users).length; i++) {
    const target = Object.keys(users)[i];
    listContainer.innerHTML += `<p class="listElement">${
      isOnline ? `<span class="listOnline ${users[target]["socketId"] == "" ? "offline" : "online"}">● </span>` : ""
    }<strong>Player ${target}</strong> - ${users[target][key]}</p>`;
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
      buttons[1].classList.remove("hidden");
      break;
    case 1:
      display = 2;
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        socket.emit("tutorial", users[target]["socketId"]);
        users[target].socketId = "";
        users[target].game = {
          score: 0,
          combo: 0,
        };
      }
      refreshList("nickname", true);
      buttons[0].textContent = "Start";
      buttons[0].disabled = true;
      buttons[1].textContent = "Skip";
  }
};

const subButtonClicked = () => {
  switch (display) {
    case 1:
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
