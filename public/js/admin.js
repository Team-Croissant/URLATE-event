const listContainer = document.getElementById("listContainer");
const buttons = [document.getElementById("mainButton"), document.getElementById("subButton")];
const users = {};
let display = 0;
let timerInterval;
let finishDate;

document.addEventListener("DOMContentLoaded", () => {
  socketInitialize();
});

const socketInitialize = () => {
  socket = io(game);

  socket.on("connect", () => {
    socket.emit("admin");
  });

  socket.on("handshake", (id, socketId, screen) => {
    if (display == screen) {
      socket.emit("connected", socketId);
      switch (display) {
        case 0:
          users[id] = { socketId: socketId };
          refreshList("socketId");
          break;
        case 2:
        case 5:
          users[id].socketId = socketId;
          refreshList("nickname", true);
          break;
      }
    }
  });

  socket.on("initialized", (name, socketId) => {
    if (display == 1) {
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

  socket.on("tutorial loaded", (socketId) => {
    users[Object.keys(users).find((key) => users[key].socketId === socketId)].loaded = true;
    refreshList("nickname", true);
    let isFinished = true;
    for (let i = 0; i < Object.keys(users).length; i++) {
      const target = Object.keys(users)[i];
      if (!users[target].loaded) isFinished = false;
      if (!users[target].ready) isFinished = false;
    }
    if (isFinished) buttons[0].disabled = false;
  });

  socket.on("ready", (socketId) => {
    users[Object.keys(users).find((key) => users[key].socketId === socketId)].ready = true;
    refreshList("nickname", true);
    let isFinished = true;
    for (let i = 0; i < Object.keys(users).length; i++) {
      const target = Object.keys(users)[i];
      if (!users[target].loaded) isFinished = false;
      if (!users[target].ready) isFinished = false;
    }
    if (isFinished) buttons[0].disabled = false;
  });

  socket.on("score", (id, score) => {
    users[id].score = score;
    refreshList("nickname", true, true);
  });

  socket.on("game ended", (id, score, rank, judge) => {
    users[id].rank = rank;
    let isFinished = true;
    for (let i = 0; i < Object.keys(users).length; i++) {
      const target = Object.keys(users)[i];
      if (!users[target].rank) isFinished = false;
    }
    if (isFinished) {
      display = 4;
      let usersArr = [];
      for (let i = 0; i < Object.keys(users).length; i++) {
        usersArr.push(users[Object.keys(users)[i]]);
        usersArr[i].id = Object.keys(users)[i];
      }
      usersArr.sort((a, b) => b.score - a.score);
      for (let i = 0; i < usersArr.length; i++) {
        const id = usersArr[i].id;
        users[id].rank = `#${i + 1}`;
      }
      refreshList("nickname", true, false, "rank");
      buttons[0].textContent = "Next";
      buttons[1].classList.remove("hidden");
      buttons[1].textContent = "Retry";
      let date = new Date();
      date.setSeconds(date.getSeconds() + 5);
      socket.emit("result sync", date);
    }
  });

  socket.on("select loaded", (id) => {
    users[id].loaded = true;
    refreshList("nickname", true, false, "track");
    let isFinished = true;
    for (let i = 0; i < Object.keys(users).length; i++) {
      const target = Object.keys(users)[i];
      if (!users[target].loaded) isFinished = false;
    }
    if (isFinished) {
      let date = new Date();
      date.setSeconds(date.getSeconds() + 3);
      let finDate = new Date();
      finDate.setSeconds(finDate.getSeconds() + 63);
      socket.emit("select sync", date, finDate);
      finishDate = finDate;
      timerInterval = setInterval(timer, 500);
    }
  });

  socket.on("select started", (id) => {
    users[id].ready = true;
    refreshList("nickname", true, false, "track");
  });

  socket.on("selecting", (id, track, producer, file) => {
    users[id].track = track;
    users[id].producer = producer;
    users[id].file = file;
    refreshList("nickname", true, false, "track");
  });

  socket.on("selected", (id) => {
    users[id].selected = true;
    let isFinished = true;
    for (let i = 0; i < Object.keys(users).length; i++) {
      const target = Object.keys(users)[i];
      if (!users[target].selected) isFinished = false;
    }
    if (isFinished) {
      let min = 0;
      let max = Object.keys(users).length - 1;
      let result = Math.floor(Math.random() * (max - min)) + min;
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        users[target].selected = true;
        users[target].track = users[result + 1].track;
        users[target].producer = users[result + 1].producer;
        users[target].file = users[result + 1].file;
      }
      clearInterval(timerInterval);
      socket.emit("selected sync", users[result + 1].track, users[result + 1].producer, users[result + 1].file);
      refreshList("nickname", true, false, "track");
    }
  });

  socket.on("disconnected", (socketId) => {
    const index = Object.keys(users).find((key) => users[key].socketId === socketId);
    if (index) {
      if (display == 0 || display == 1) {
        delete users[index];
      } else {
        users[index].socketId = "";
        users[index].loaded = false;
        users[index].ready = false;
      }
      switch (display) {
        case 0:
          refreshList("socketId");
          break;
        case 1:
          refreshList("nickname");
          break;
        case 2:
          refreshList("nickname", true);
          break;
        case 3:
          refreshList("nickname", true, true);
          break;
      }
    }
  });
};

const timer = () => {
  if (finishDate <= new Date()) {
    clearInterval(timerInterval);
  } else {
    buttons[0].textContent = `${parseInt((finishDate - new Date()) / 1000) + 1}..`;
  }
};

const refreshList = (key, isOnline, isGame, subKey) => {
  listContainer.innerHTML = "";
  for (let i = 0; i < Object.keys(users).length; i++) {
    const target = Object.keys(users)[i];
    listContainer.innerHTML += `<p class="listElement">${
      isOnline ? `<span class="listOnline ${users[target]["socketId"] == "" ? "offline" : users[target]["loaded"] ? "online" : "loading"}">● </span>` : ""
    }<strong>Player ${target}</strong> - ${users[target][key]}${
      isGame ? ` - ${numberWithCommas(`${users[target]["score"]}`.padStart(9, "0"))}` : isOnline ? (users[target]["ready"] ? "(ready)" : "(pending)") : ""
    }${subKey ? ` - ${users[target][subKey]}` : ""}</p>`;
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
        users[target].loaded = false;
        users[target].ready = false;
        users[target].score = 0;
      }
      socket.emit("tutorial", "Display", users);
      refreshList("nickname", true);
      buttons[0].textContent = "Start";
      buttons[0].disabled = true;
      buttons[1].textContent = "Skip";
      break;
    case 2:
      display = 3;
      let date = new Date();
      date.setSeconds(date.getSeconds() + 5);
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        socket.emit("tutorial start", users[target]["socketId"], date);
      }
      socket.emit("tutorial start", "Display", date);
      refreshList("nickname", true, true);
      buttons[0].textContent = "Restart";
      buttons[1].classList.add("hidden");
      break;
    case 3:
      display = 2;
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        socket.emit("tutorial restart", users[target]["socketId"]);
        users[target].socketId = "";
        users[target].loaded = false;
        users[target].ready = false;
        users[target].score = 0;
        users[target].combo = 0;
      }
      socket.emit("tutorial restart", "Display");
      buttons[0].textContent = "Start";
      buttons[0].disabled = true;
      buttons[1].textContent = "Skip";
      refreshList("nickname", true);
      break;
    case 4:
      display = 5;
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        socket.emit("select music", users[target]["socketId"]);
        users[target].socketId = "";
        users[target].loaded = false;
        users[target].selected = false;
        users[target].track = "waiting..";
      }
      socket.emit("select music", "Display");
      buttons[0].textContent = "wait..";
      buttons[0].disabled = true;
      buttons[1].classList.add("hidden");
      refreshList("nickname", true, false, "track");
      break;
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
    case 2:
      display = 5;
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        socket.emit("select music", users[target]["socketId"]);
        users[target].socketId = "";
        users[target].loaded = false;
        users[target].track = "waiting..";
      }
      socket.emit("select music", "Display");
      buttons[0].textContent = "wait..";
      buttons[0].disabled = true;
      buttons[1].classList.add("hidden");
      refreshList("nickname", true);
      break;
    case 4:
      display = 2;
      for (let i = 0; i < Object.keys(users).length; i++) {
        const target = Object.keys(users)[i];
        socket.emit("tutorial restart", users[target]["socketId"]);
        users[target].socketId = "";
        users[target].loaded = false;
        users[target].ready = false;
        users[target].score = 0;
        users[target].combo = 0;
      }
      socket.emit("tutorial restart", "Display");
      buttons[0].textContent = "Start";
      buttons[0].disabled = true;
      buttons[1].textContent = "Skip";
      refreshList("nickname", true);
      break;
  }
};
