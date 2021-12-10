/* global game, url, lottie, bodymovin*/
const animContainer = document.getElementById("animContainer");
const nameContainer = document.getElementById("nameContainer");
const loadingContainer = document.getElementById("loadingContainer");
const nameInput = document.getElementById("nameInput");
const connection = document.getElementById("connection");

const nameRegex = /^[0-9]{4} [가-힣]{2,10}$/;

let lottieAnim;
let socket;
let userId;
let socketId;
let connectInterval;

document.addEventListener("DOMContentLoaded", () => {
  let widthWidth = window.innerWidth;
  let heightWidth = (window.innerHeight / 9) * 16;
  if (widthWidth > heightWidth) {
    animContainer.style.width = `${widthWidth}px`;
    animContainer.style.height = `${(widthWidth / 16) * 9}px`;
  } else {
    animContainer.style.width = `${heightWidth}px`;
    animContainer.style.height = `${(heightWidth / 16) * 9}px`;
  }
  lottieAnim = bodymovin.loadAnimation({
    wrapper: animContainer,
    animType: "canvas",
    loop: true,
    path: "lottie/index.json",
  });
  lottieAnim.addEventListener("DOMLoaded", () => {
    canvasResize();
  });
  lottie.setSpeed(0.5);
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  if (!("u" in params)) {
    connection.textContent = "ID setting is required.";
  } else {
    socketInitialize(params.u);
  }
});

const socketInitialize = (id) => {
  userId = id;
  socket = io(game);

  socket.on("connect", () => {
    socket.on("broadcast", (id) => {
      socketId = id;
      tryConnect();
      connectInterval = setInterval(tryConnect, 3000);
    });

    socket.on("connected", () => {
      clearInterval(connectInterval);
      connection.textContent = `Player ${userId}`;
    });

    socket.on("admin disconnected", () => {
      location.reload();
    });

    socket.on("initialize", () => {
      nameContainer.classList.add("show");
      loadingContainer.classList.remove("show");
    });

    socket.on("tutorial", () => {
      window.location.href = `${url}/tutorial?u=${userId}`;
    });
  });
};

const tryConnect = () => {
  console.log("trying to connect");
  socket.emit("handshake", userId, 0);
};

const nameSubmit = () => {
  if (nameRegex.test(nameInput.value)) {
    loadingContainer.classList.add("show");
    socket.emit("initialized", nameInput.value);
  } else {
    alert(`이름은 반드시 "학번 이름(2302 강혁진)"의 형식으로 입력해주세요.`);
  }
};

const canvasResize = () => {
  let widthWidth = window.innerWidth;
  let heightWidth = (window.innerHeight / 9) * 16;
  if (widthWidth > heightWidth) {
    animContainer.style.width = `${widthWidth}px`;
    animContainer.style.height = `${(widthWidth / 16) * 9}px`;
  } else {
    animContainer.style.width = `${heightWidth}px`;
    animContainer.style.height = `${(heightWidth / 16) * 9}px`;
  }
  let lottieCanvas = animContainer.getElementsByTagName("canvas")[0];
  widthWidth = window.innerWidth * window.devicePixelRatio;
  heightWidth = ((window.innerHeight * window.devicePixelRatio) / 9) * 16;
  if (widthWidth > heightWidth) {
    lottieCanvas.width = widthWidth;
    lottieCanvas.height = (widthWidth / 16) * 9;
  } else {
    lottieCanvas.width = heightWidth;
    lottieCanvas.height = (heightWidth / 16) * 9;
  }
  lottieAnim.destroy();
  lottieAnim = bodymovin.loadAnimation({
    wrapper: animContainer,
    animType: "canvas",
    loop: true,
    path: "lottie/index.json",
  });
};

window.onresize = () => {
  canvasResize();
};
