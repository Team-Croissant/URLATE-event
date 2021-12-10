const mediaPlay = () => {
  document.getElementById("urlateVideo").play();
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("spectateOverlay").style.backgroundImage = `url("${cdn}/albums/100/tutorial (Custom).png")`;
  document.getElementById("rankContainerTrack").style.backgroundImage = `url("${cdn}/albums/100/tutorial (Custom).png")`;
  document.getElementById("rankContainerRight").style.backgroundImage = `url("${cdn}/albums/100/tutorial (Custom).png")`;
  socketInitialize();
});

const socketInitialize = () => {
  socket = io(game);

  socket.on("connect", () => {
    socket.emit("display");
  });

  socket.on("admin disconnected", () => {
    location.reload();
  });

  socket.on("tutorial", () => {
    initialize();
  });

  socket.on("tutorial start", () => {
    spectate();
  });
};

const initialize = () => {
  document.getElementById("urlateVideoContainer").classList.remove("show");
  document.getElementById("spectateOverlay").classList.add("show");
  document.getElementById("albumOverlay").classList.add("show");
};

const spectate = () => {
  document.getElementById("albumOverlay").classList.remove("show");
};
