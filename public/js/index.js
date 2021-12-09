/* global game, url, lottie, bodymovin*/
const animContainer = document.getElementById("animContainer");
let lottieAnim;

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
});

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
