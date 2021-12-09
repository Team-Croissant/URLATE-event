const listContainer = document.getElementById("listContainer");
const userArray = {};

document.addEventListener("DOMContentLoaded", () => {
  socketInitialize();
});

const socketInitialize = () => {
  socket = io(game, {
    query: `id=0`,
  });

  socket.on("connect", () => {
    console.log("connected");
  });

  socket.on("connected", (id, socketId) => {
    userArray[id] = socketId;
    refreshList();
  });
};

const refreshList = () => {
  listContainer.innerHTML = "";
  for (let i = 1; i <= Object.keys(userArray).length; i++) {
    listContainer.innerHTML += `<p class="listElement"><strong>Player ${i}</strong> - ${userArray[i]}</p>`;
  }
};
