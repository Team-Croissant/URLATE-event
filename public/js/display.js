const songFileList = {
  Tutorial: "tutorial",
};

const skin = {
  cursor: {
    type: "gradient",
    stops: [
      { percentage: 0, color: "ae66ed" },
      { percentage: 100, color: "66b7ed" },
    ],
  },
  note: [
    {
      type: "gradient",
      stops: [
        { percentage: 0, color: "fb4934" },
        { percentage: 100, color: "ebd934" },
      ],
    },
    {
      type: "gradient",
      stops: [
        { percentage: 0, color: "53cddb" },
        { percentage: 100, color: "0669ff" },
      ],
    },
  ],
  bullet: { type: "color", color: "555555" },
  perfect: {
    type: "gradient",
    stops: [
      { percentage: 0, color: "57d147" },
      { percentage: 100, color: "43a7e0" },
    ],
  },
  great: { type: "color", color: "57d147" },
  good: { type: "color", color: "43a7e0" },
  bad: { type: "color", color: "b0675a" },
  miss: { type: "color", color: "e84c38" },
};

const canvasArr = document.getElementsByClassName("spectateCanvas");

let isGamePlaying = false;
let pattern, patternLength, song, offset, bpm, speed;
let destroyedBullets = [new Set(), new Set(), new Set()],
  prevDestroyedBullets = [new Set(), new Set(), new Set()],
  destroyedNotes = [new Set(), new Set(), new Set()],
  destroyParticles = [[], [], []],
  missParticles = [[], [], []],
  circleBulletAngles = [[], [], []];
let mouseX = [0, 0, 0];
let mouseY = [0, 0, 0];
let hide = {};
let denySkin = false;

const mediaPlay = () => {
  if (!isGamePlaying) {
    document.getElementById("urlateVideo").play();
  }
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

  socket.on("tutorial start", (date) => {
    spectateInitialize(date);
  });

  socket.on("update", (id, x, y) => {
    id = id - 1;
    mouseX[id] = x;
    mouseY[id] = y;
  });

  socket.on("tutorial restart", () => {
    reset();
  });
};

const reset = () => {
  song.stop();
  initialize();
};

const initialize = () => {
  isGamePlaying = true;
  document.getElementById("urlateVideo").pause();
  document.getElementById("urlateVideoContainer").classList.remove("show");
  document.getElementById("spectateOverlay").classList.add("show");
  document.getElementById("albumOverlay").classList.add("show");
  fetch(`${cdn}/URLATE-patterns/tutorial/0_ko.json`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      pattern = data;
      offset = pattern.information.offset;
      bpm = pattern.information.bpm;
      speed = pattern.information.speed;
      patternLength = pattern.patterns.length;
      document.getElementById("albumOverlayTrack").textContent = pattern.information.track;
      document.getElementById("albumOverlayProducer").textContent = pattern.information.producer;
      document.getElementById("spectateOverlay").style.backgroundImage = `url("${cdn}/albums/100/${songFileList[pattern.information.track]} (Custom).png")`;
      document.getElementById("rankContainerTrack").style.backgroundImage = `url("${cdn}/albums/100/${songFileList[pattern.information.track]} (Custom).png")`;
      document.getElementById("rankContainerRight").style.backgroundImage = `url("${cdn}/albums/100/${songFileList[pattern.information.track]} (Custom).png")`;
      document.getElementById("albumOverlayAlbum").src = `${cdn}/albums/100/${songFileList[pattern.information.track]} (Custom).png`;
      song = new Howl({
        src: `${cdn}/tracks/192kbps/${songFileList[pattern.information.track]}.mp3`,
        format: ["mp3"],
        autoplay: false,
        loop: false,
      });
    });
  for (let k = 0; k < canvasArr.length; k++) {
    canvasArr[k].width = (window.innerWidth * window.devicePixelRatio) / 2;
    canvasArr[k].height = (window.innerHeight * window.devicePixelRatio) / (100 / 44);
  }
};

window.addEventListener("resize", () => {
  for (let k = 0; k < canvasArr.length; k++) {
    canvasArr[k].width = (window.innerWidth * window.devicePixelRatio) / 2;
    canvasArr[k].height = (window.innerHeight * window.devicePixelRatio) / (100 / 44);
  }
});

const eraseCnt = () => {
  for (let k = 0; k < canvasArr.length; k++) {
    const ctx = canvasArr[k].getContext("2d");
    ctx.clearRect(0, 0, canvasArr[k].width, canvasArr[k].height);
  }
};

const spectateInitialize = (date) => {
  cntRender();
  document.getElementById("albumOverlay").classList.remove("show");
  const timeout = new Date(date) - new Date();
  setTimeout(songPlayPause, timeout);
};

const songPlayPause = () => {
  if (song.playing()) {
    song.pause();
    menuAllowed = false;
  } else {
    song.play();
    menuAllowed = true;
  }
};

const cntRender = () => {
  eraseCnt();
  for (let k = 0; k < canvasArr.length; k++) {
    const canvas = canvasArr[k];
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.lineJoin = "round";
    const percentage = song.seek() / song.duration();
    const rectX = canvas.width / 2 - canvas.width / 14;
    const rectY = canvas.height - canvas.height / 80 - canvas.height / 200;
    const rectWidth = canvas.width / 7;
    const rectHeight = canvas.height / 200;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#222";
    ctx.fillStyle = "#222";
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
    ctx.fillRect(rectX, rectY, rectWidth * percentage, rectHeight);
    ctx.lineWidth = 5;
    const seek = song.seek() - offset / 1000;
    let start = lowerBound(pattern.triggers, 0);
    let end = upperBound(pattern.triggers, seek * 1000 + 2); //2 for floating point miss
    const renderTriggers = pattern.triggers.slice(start, end);
    for (let i = 0; i < renderTriggers.length; i++) {
      if (renderTriggers[i].value == 0) {
        if (!destroyedBullets[k].has(renderTriggers[i].num)) {
          callBulletDestroy(renderTriggers[i].num, k);
        }
      } else if (renderTriggers[i].value == 1) {
        end = upperBound(pattern.bullets, renderTriggers[i].ms);
        const renderBullets = pattern.bullets.slice(0, end);
        for (let j = 0; renderBullets.length > j; j++) {
          if (!destroyedBullets[k].has(j)) {
            callBulletDestroy(j, k);
          }
        }
      } else if (renderTriggers[i].value == 2) {
        bpm = renderTriggers[i].bpm;
      } else if (renderTriggers[i].value == 3) {
        canvas.style.filter = `opacity(${renderTriggers[i].opacity * 100}%)`;
      } else if (renderTriggers[i].value == 4) {
        speed = renderTriggers[i].speed;
      } else if (renderTriggers[i].value == 5) {
        if (renderTriggers[i].ms - 1 <= seek * 1000 && renderTriggers[i].ms + renderTriggers[i].time > seek * 1000) {
          ctx.beginPath();
          ctx.fillStyle = "#111";
          ctx.font = `${renderTriggers[i].weight} ${renderTriggers[i].size} Metropolis, Pretendard Variable`;
          if (renderTriggers[i].size.indexOf("vh") != -1)
            ctx.font = `${renderTriggers[i].weight} ${(canvas.height / 100) * Number(renderTriggers[i].size.split("vh")[0])}px Metropolis, Pretendard Variable`;
          ctx.textAlign = renderTriggers[i].align;
          ctx.textBaseline = renderTriggers[i].valign;
          ctx.fillText(renderTriggers[i].text, (canvas.width / 200) * (renderTriggers[i].x + 100), (canvas.height / 200) * (renderTriggers[i].y + 100));
        }
      }
    }
    for (let i = 0; i < destroyParticles[k].length; i++) {
      if (destroyParticles[k][i].w > 0) {
        drawParticle(0, destroyParticles[k][i].x, destroyParticles[k][i].y, i, "", k);
        destroyParticles[k][i].w = 10 - (Date.now() - destroyParticles[k][i].ms) / 25;
        destroyParticles[k][i].n++;
      }
    }
    prevDestroyedBullets[k] = new Set(destroyedBullets[k]);
    start = lowerBound(pattern.patterns, seek * 1000 - (bpm * 4) / speed);
    end = upperBound(pattern.patterns, seek * 1000 + (bpm * 14) / speed);
    const renderNotes = pattern.patterns.slice(start, end);
    for (let i = renderNotes.length - 1; i >= 0; i--) {
      const p = (((bpm * 14) / speed - (renderNotes[i].ms - seek * 1000)) / ((bpm * 14) / speed)) * 100;
      drawNote(p, renderNotes[i].x, renderNotes[i].y, renderNotes[i].value, renderNotes[i].direction, k);
    }
    start = lowerBound(pattern.bullets, seek * 1000 - bpm * 100);
    end = upperBound(pattern.bullets, seek * 1000);
    const renderBullets = pattern.bullets.slice(start, end);
    for (let i = 0; i < renderBullets.length; i++) {
      if (!destroyedBullets[k].has(start + i)) {
        const p = ((seek * 1000 - renderBullets[i].ms) / ((bpm * 40) / speed / renderBullets[i].speed)) * 100;
        const left = renderBullets[i].direction == "L";
        let x = (left ? -1 : 1) * (100 - p);
        let y = 0;
        if (renderBullets[i].value == 0) {
          y = renderBullets[i].location + p * getTan(renderBullets[i].angle) * (left ? 1 : -1);
          drawBullet(renderBullets[i].value, x, y, renderBullets[i].angle + (left ? 0 : 180), k);
        } else {
          if (!circleBulletAngles[k][start + i]) circleBulletAngles[k][start + i] = calcAngleDegrees((left ? -100 : 100) - mouseX[k], renderBullets[i].location - mouseY[k]);
          if (left) {
            if (110 > circleBulletAngles[k][start + i] && circleBulletAngles[k][start + i] > 0) circleBulletAngles[k][start + i] = 110;
            else if (0 > circleBulletAngles[k][start + i] && circleBulletAngles[k][start + i] > -110) circleBulletAngles[k][start + i] = -110;
          } else {
            if (70 < circleBulletAngles[k][start + i] && circleBulletAngles[k][start + i] > 0) circleBulletAngles[k][start + i] = 70;
            else if (0 > circleBulletAngles[k][start + i] && circleBulletAngles[k][start + i] < -70) circleBulletAngles[k][start + i] = -70;
          }
          y = renderBullets[i].location + p * getTan(circleBulletAngles[k][start + i]) * (left ? 1 : -1);
          drawBullet(renderBullets[i].value, x, y, "", k);
        }
      }
    }
    drawCursor(k);
  }
  requestAnimationFrame(cntRender);
};

const callBulletDestroy = (j, k) => {
  const seek = song.seek() - offset / 1000;
  const p = ((seek * 1000 - pattern.bullets[j].ms) / ((bpm * 40) / speed / pattern.bullets[j].speed)) * 100;
  const left = pattern.bullets[j].direction == "L";
  let x = (left ? -1 : 1) * (100 - p);
  let y = 0;
  if (pattern.bullets[j].value == 0) {
    y = pattern.bullets[j].location + p * getTan(pattern.bullets[j].angle) * (left ? 1 : -1);
  } else {
    if (!circleBulletAngles[k][j]) circleBulletAngles[k][j] = calcAngleDegrees((left ? -100 : 100) - mouseX[k], pattern.bullets[j].location - mouseY[k]);
    if (left) {
      if (110 > circleBulletAngles[k][j] && circleBulletAngles[k][j] > 0) circleBulletAngles[k][j] = 110;
      else if (0 > circleBulletAngles[k][j] && circleBulletAngles[k][j] > -110) circleBulletAngles[k][j] = -110;
    } else {
      if (70 < circleBulletAngles[k][j] && circleBulletAngles[k][j] > 0) circleBulletAngles[k][j] = 70;
      else if (0 > circleBulletAngles[k][j] && circleBulletAngles[k][j] < -70) circleBulletAngles[k][j] = -70;
    }
    y = pattern.bullets[j].location + p * getTan(circleBulletAngles[k][j]) * (left ? 1 : -1);
  }
  let randomDirection = [];
  for (let i = 0; i < 3; i++) {
    let rx = Math.floor(Math.random() * 4) - 2;
    let ry = Math.floor(Math.random() * 4) - 2;
    randomDirection[i] = [rx, ry];
  }
  destroyParticles[k].push({
    x: x,
    y: y,
    w: 5,
    n: 1,
    d: randomDirection,
    ms: Date.now(),
  });
  destroyedBullets[k].add(j);
};

const drawParticle = (n, x, y, j, d, k) => {
  const canvas = canvasArr[k];
  const ctx = canvas.getContext("2d");
  let cx = (canvas.width / 200) * (x + 100);
  let cy = (canvas.height / 200) * (y + 100);
  if (n == 0) {
    //Destroy
    const raf = (n, w) => {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        if (skin.bullet.type == "gradient") {
          let grd = ctx.createLinearGradient(cx - w, cy - w, cx + w, cy + w);
          for (let i = 0; i < skin.bullet.stops.length; i++) {
            grd.addColorStop(skin.bullet.stops[i].percentage / 100, `#${skin.bullet.stops[i].color}`);
          }
          ctx.fillStyle = grd;
          ctx.strokeStyle = grd;
        } else if (skin.bullet.type == "color") {
          ctx.fillStyle = `#${skin.bullet.color}`;
          ctx.strokeStyle = `#${skin.bullet.color}`;
        }
        ctx.arc(cx + n * destroyParticles[k][j].d[i][0], cy + n * destroyParticles[k][j].d[i][1], w, 0, 2 * Math.PI);
        ctx.fill();
      }
    };
    raf(destroyParticles[k][j].n, destroyParticles[k][j].w);
  } else if (n == 1) {
    //Click Note
    const raf = (w, s, n) => {
      ctx.beginPath();
      ctx.strokeWidth = 3;
      let width = canvas.width / 50;
      let p = 100 - (s + 500 - Date.now()) / 5;
      let opacity = parseInt(125 - p * 1.25);
      if (opacity <= 0) opacity = "00";
      if (skin.note[n].circle) {
        if (skin.note[n].circle.type == "gradient") {
          let grd = ctx.createLinearGradient(cx - w, cy - w, cx + w, cy + w);
          for (let i = 0; i < skin.note[n].circle.stops.length; i++) {
            grd.addColorStop(skin.note[n].circle.stops[i].percentage / 100, `#${skin.note[n].circle.stops[i].color}${opacity.toString(16).padStart(2, "0")}`);
          }
          ctx.fillStyle = grd;
          ctx.strokeStyle = grd;
        } else if (skin.note[n].circle.type == "color") {
          ctx.fillStyle = `#${skin.note[n].circle.color}${opacity.toString(16).padStart(2, "0")}`;
          ctx.strokeStyle = `#${skin.note[n].circle.color}${opacity.toString(16).padStart(2, "0")}`;
        }
      } else {
        if (skin.note[n].type == "gradient") {
          let grd = ctx.createLinearGradient(cx - w, cy - w, cx + w, cy + w);
          for (let i = 0; i < skin.note[n].stops.length; i++) {
            grd.addColorStop(skin.note[n].stops[i].percentage / 100, `#${skin.note[n].stops[i].color}${opacity.toString(16).padStart(2, "0")}`);
          }
          ctx.fillStyle = grd;
          ctx.strokeStyle = grd;
        } else if (skin.note[n].type == "color") {
          ctx.fillStyle = `#${skin.note[n].color}${opacity.toString(16).padStart(2, "0")}`;
          ctx.strokeStyle = `#${skin.note[n].color}${opacity.toString(16).padStart(2, "0")}`;
        }
      }
      ctx.arc(cx, cy, w, 0, 2 * Math.PI);
      ctx.stroke();
      w = canvas.width / 70 + canvas.width / 400 + width * (p / 100);
      if (p < 100) {
        requestAnimationFrame(() => {
          raf(w, s, n);
        });
      }
    };
    raf(canvas.width / 70 + canvas.width / 400, Date.now(), d);
  } else if (n == 2) {
    //Click Default
    const raf = (w, s) => {
      ctx.beginPath();
      ctx.strokeWidth = 3;
      let width = canvas.width / 60;
      let p = 100 - (s + 300 - Date.now()) / 3;
      let grd = ctx.createLinearGradient(cx - w, cy - w, cx + w, cy + w);
      grd.addColorStop(0, `rgba(174, 102, 237, ${0.5 - p / 200})`);
      grd.addColorStop(1, `rgba(102, 183, 237, ${0.5 - p / 200})`);
      ctx.strokeStyle = grd;
      ctx.arc(cx, cy, w, 0, 2 * Math.PI);
      ctx.stroke();
      w = canvas.width / 70 + canvas.width / 400 + width * (p / 100);
      if (p < 100) {
        requestAnimationFrame(() => {
          raf(w, s);
        });
      }
    };
    raf(canvas.width / 70 + canvas.width / 400, Date.now());
  } else if (n == 3) {
    //Judge
    const raf = (y, s) => {
      ctx.beginPath();
      let p = 100 - (s + 300 - Date.now()) / 3;
      let newY = cy - Math.round(p / 10);
      ctx.fillStyle = getJudgeStyle(j.toLowerCase(), p, cx, newY, k);
      ctx.strokeStyle = `rgba(255, 255, 255, ${1 - p / 100})`;
      ctx.font = `600 ${canvas.height / 25}px Metropolis, Pretendard Variable`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 2;
      ctx.strokeText(j, cx, newY);
      ctx.fillText(j, cx, newY);
      if (p < 100) {
        requestAnimationFrame(() => {
          raf(cy, s);
        });
      }
    };
    raf(cy, Date.now());
  } else if (n == 4) {
    //judge:miss
    ctx.beginPath();
    let p = 100 - (missParticles[j].s + 300 - Date.now()) / 3;
    let newY = cy - Math.round(p / 10);
    ctx.fillStyle = getJudgeStyle("miss", p, 0, 0, k);
    ctx.strokeStyle = `rgba(255, 255, 255, ${1 - p / 100})`;
    ctx.font = `600 ${canvas.height / 25}px Metropolis, Pretendard Variable`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2;
    ctx.strokeText("Miss", cx, newY);
    ctx.fillText("Miss", cx, newY);
  }
};

const drawNote = (p, x, y, n, d, k) => {
  const canvas = canvasArr[k];
  const ctx = canvas.getContext("2d");
  p = Math.max(p, 0);
  x = (canvas.width / 200) * (x + 100);
  y = (canvas.height / 200) * (y + 100);
  n = n == undefined ? 0 : n;
  let w = canvas.width / 40;
  let opacity = "FF";
  if (p > 100) {
    opacity = `${parseInt((130 - p) * 3.333)}`.padStart(2, "0");
  }
  if (opacity <= 0) opacity = "00";
  if (!denySkin) {
    if (skin.note[n].type == "gradient") {
      let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
      for (let i = 0; i < skin.note[n].stops.length; i++) {
        grd.addColorStop(skin.note[n].stops[i].percentage / 100, `#${skin.note[n].stops[i].color}${opacity.toString(16)}`);
      }
      ctx.fillStyle = grd;
      ctx.strokeStyle = grd;
    } else if (skin.note[n].type == "color") {
      ctx.fillStyle = `#${skin.note[n].color}${opacity.toString(16)}`;
      ctx.strokeStyle = `#${skin.note[n].color}${opacity.toString(16)}`;
    }
    if (skin.note[n].circle) {
      if (skin.note[n].circle.type == "gradient") {
        let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
        for (let i = 0; i < skin.note[n].circle.stops.length; i++) {
          grd.addColorStop(skin.note[n].circle.stops[i].percentage / 100, `#${skin.note[n].circle.stops[i].color}${opacity.toString(16)}`);
        }
        ctx.strokeStyle = grd;
      } else if (skin.note[n].circle.type == "color") {
        ctx.strokeStyle = `#${skin.note[n].circle.color}${opacity.toString(16)}`;
      }
    }
  } else {
    let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
    grd.addColorStop(0, `${["#fb4934", "#53cddb"][n]}${opacity}`);
    grd.addColorStop(1, `${["#ebd934", "#0669ff"][n]}${opacity}`);
    ctx.fillStyle = grd;
    ctx.strokeStyle = grd;
  }
  ctx.lineWidth = Math.round(canvas.width / 300);
  if (n == 0) {
    ctx.beginPath();
    ctx.arc(x, y, w, 0, (p / 50) * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, (w / 100) * p, 0, 2 * Math.PI);
    ctx.fill();
    if (skin.note[n].outline) {
      if (skin.note[n].outline.type == "gradient") {
        let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
        for (let i = 0; i < skin.note[n].outline.stops.length; i++) {
          grd.addColorStop(skin.note[n].outline.stops[i].percentage / 100, `#${skin.note[n].outline.stops[i].color}${opacity.toString(16)}`);
        }
        ctx.strokeStyle = grd;
      } else if (skin.note[n].outline.type == "color") {
        ctx.strokeStyle = `#${skin.note[n].outline.color}${opacity.toString(16)}`;
      }
      ctx.lineWidth = Math.round((canvas.width / 1000) * skin.note[n].outline.width);
      ctx.stroke();
    }
  } else if (n == 1) {
    w = w * 0.9;
    let parr = [p <= 20 ? p * 5 : 100, p >= 20 ? (p <= 80 ? (p - 20) * 1.66 : 100) : 0, p >= 80 ? (p <= 100 ? (p - 80) * 5 : 100) : 0];
    ctx.beginPath();
    let originalValue = [0, -1.5 * d * w];
    let moveValue = [originalValue[0] - w * Math.cos(Math.PI / 5) * d, originalValue[1] + w * Math.sin(Math.PI / 5) * d];
    ctx.moveTo(x + originalValue[0], y + originalValue[1]);
    ctx.lineTo(x + originalValue[0] - (moveValue[0] / 100) * parr[0], y + originalValue[1] - (moveValue[1] / 100) * parr[0]);
    ctx.moveTo(x + originalValue[0] - moveValue[0], y + originalValue[1] - moveValue[1]);
    if (d == 1) ctx.arc(x, y, w, -Math.PI / 5, (((Math.PI / 5) * 7) / 100) * parr[1] - Math.PI / 5);
    else ctx.arc(x, y, w, (-Math.PI / 5) * 6, (((Math.PI / 5) * 7) / 100) * parr[1] - (Math.PI / 5) * 6);
    originalValue = [-w * Math.cos(Math.PI / 5) * d, -w * Math.sin(Math.PI / 5) * d];
    moveValue = [originalValue[0], originalValue[1] - -1.5 * d * w];
    ctx.moveTo(x + originalValue[0], y + originalValue[1]);
    ctx.lineTo(x + originalValue[0] - (moveValue[0] / 100) * parr[2], y + originalValue[1] - (moveValue[1] / 100) * parr[2]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 1.5 * d * (w / 100) * p);
    if (d == 1) ctx.arc(x, y, (w / 100) * p, -Math.PI / 5, (Math.PI / 5) * 6);
    else ctx.arc(x, y, (w / 100) * p, (-Math.PI / 5) * 6, Math.PI / 5);
    ctx.lineTo(x, y - 1.5 * d * (w / 100) * p);
    ctx.fill();
    if (skin.note[n].outline) {
      if (skin.note[n].outline.type == "gradient") {
        let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
        for (let i = 0; i < skin.note[n].outline.stops.length; i++) {
          grd.addColorStop(skin.note[n].outline.stops[i].percentage / 100, `#${skin.note[n].outline.stops[i].color}${opacity.toString(16)}`);
        }
        ctx.strokeStyle = grd;
      } else if (skin.note[n].outline.type == "color") {
        ctx.strokeStyle = `#${skin.note[n].outline.color}${opacity.toString(16)}`;
      }
      ctx.lineWidth = Math.round((canvas.width / 1000) * skin.note[n].outline.width);
      ctx.stroke();
    }
  }
};

const drawBullet = (n, x, y, a, k) => {
  const canvas = canvasArr[k];
  const ctx = canvas.getContext("2d");
  x = (canvas.width / 200) * (x + 100);
  y = (canvas.height / 200) * (y + 100);
  let w = canvas.width / 80;
  if (!denySkin) {
    if (skin.bullet.type == "gradient") {
      let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
      for (let i = 0; i < skin.bullet.stops.length; i++) {
        grd.addColorStop(skin.bullet.stops[i].percentage / 100, `#${skin.bullet.stops[i].color}`);
      }
      ctx.fillStyle = grd;
      ctx.strokeStyle = grd;
    } else if (skin.bullet.type == "color") {
      ctx.fillStyle = `#${skin.bullet.color}`;
      ctx.strokeStyle = `#${skin.bullet.color}`;
    }
    if (skin.bullet.outline) {
      ctx.lineWidth = Math.round((canvas.width / 1000) * skin.bullet.outline.width);
      if (skin.bullet.outline.type == "gradient") {
        let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
        for (let i = 0; i < skin.bullet.outline.stops.length; i++) {
          grd.addColorStop(skin.bullet.outline.stops[i].percentage / 100, `#${skin.bullet.outline.stops[i].color}`);
        }
        ctx.strokeStyle = grd;
      } else if (skin.bullet.outline.type == "color") {
        ctx.strokeStyle = `#${skin.bullet.outline.color}`;
      }
    }
  } else {
    ctx.fillStyle = "#555";
    ctx.strokeStyle = "#555";
  }
  ctx.beginPath();
  switch (n) {
    case 0:
      a = Math.PI * (a / 180 + 0.5);
      ctx.arc(x, y, w, a, a + Math.PI);
      a = a - 0.5 * Math.PI;
      ctx.moveTo(x - w * Math.sin(a), y + w * Math.cos(a));
      ctx.lineTo(x + w * 2 * Math.cos(a), y + w * 2 * Math.sin(a));
      ctx.lineTo(x + w * Math.sin(a), y - w * Math.cos(a));
      ctx.fill();
      if (skin.bullet.outline) ctx.stroke();
      break;
    case 1:
      ctx.arc(x, y, w, 0, Math.PI * 2);
      ctx.fill();
      if (skin.bullet.outline) ctx.stroke();
      break;
    default:
      ctx.font = `500 ${canvas.height / 30}px Metropolis, Pretendard Variable`;
      ctx.fillStyle = "#F55";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`drawBullet:bullet number isn't specified.`, canvas.width / 100, canvas.height / 100);
      console.error(`drawBullet:bullet number isn't specified.`);
  }
};

const drawCursor = (k) => {
  const canvas = canvasArr[k];
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  let w = canvas.width / 70;
  let x = (canvas.width / 200) * (mouseX[k] + 100);
  let y = (canvas.height / 200) * (mouseY[k] + 100);
  if (!denySkin) {
    if (skin.cursor.type == "gradient") {
      let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
      for (let i = 0; i < skin.cursor.stops.length; i++) {
        grd.addColorStop(skin.cursor.stops[i].percentage / 100, `#${skin.cursor.stops[i].color}`);
      }
      ctx.fillStyle = grd;
    } else if (skin.cursor.type == "color") {
      ctx.fillStyle = `#${skin.cursor.color}`;
    }
    if (skin.cursor.outline) {
      ctx.lineWidth = Math.round((canvas.width / 1000) * skin.cursor.outline.width);
      if (skin.cursor.outline.type == "gradient") {
        let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
        for (let i = 0; i < skin.cursor.outline.stops.length; i++) {
          grd.addColorStop(skin.cursor.outline.stops[i].percentage / 100, `#${skin.cursor.outline.stops[i].color}`);
        }
        ctx.strokeStyle = grd;
      } else if (skin.cursor.outline.type == "color") {
        ctx.strokeStyle = `#${skin.cursor.outline.color}`;
      }
    }
  } else {
    let grd = ctx.createLinearGradient(x - w, y - w, x + w, y + w);
    grd.addColorStop(0, `rgb(174, 102, 237)`);
    grd.addColorStop(1, `rgb(102, 183, 237)`);
    ctx.fillStyle = grd;
  }
  ctx.arc(x, y, w, 0, 2 * Math.PI);
  ctx.fill();
  if (skin.cursor.outline) ctx.stroke();
};

const getJudgeStyle = (j, p, x, y, k) => {
  const canvas = canvasArr[k];
  const ctx = canvas.getContext("2d");
  p = parseInt(p);
  if (p <= 0) p = 0;
  p = `${p}`.padStart(2, "0");
  if (!judgeSkin || !advanced) {
    if (j == "miss") {
      return `rgba(237, 78, 50, ${1 - p / 100})`;
    } else if (j == "perfect") {
      let grd = ctx.createLinearGradient(x - 50, y - 20, x + 50, y + 20);
      grd.addColorStop(0, `rgba(87, 209, 71, ${1 - p / 100})`);
      grd.addColorStop(1, `rgba(67, 167, 224, ${1 - p / 100})`);
      return grd;
    } else if (j == "great") {
      return `rgba(87, 209, 71, ${1 - p / 100})`;
    } else if (j == "good") {
      return `rgba(67, 167, 224, ${1 - p / 100})`;
    } else if (j == "bad") {
      return `rgba(176, 103, 90, ${1 - p / 100})`;
    } else {
      return `rgba(50, 50, 50, ${1 - p / 100})`;
    }
  } else {
    p = parseInt(255 - p * 2.55);
    if (p <= 0) p = 0;
    p = p.toString(16).padStart(2, "0");
    if (skin[j].type == "gradient") {
      let grd = ctx.createLinearGradient(x - 50, y - 20, x + 50, y + 20);
      for (let i = 0; i < skin[j].stops.length; i++) {
        grd.addColorStop(skin[j].stops[i].percentage / 100, `#${skin[j].stops[i].color}${p.toString(16)}`);
      }
      return grd;
    } else if (skin[j].type == "color") {
      return `#${skin[j].color}${p.toString(16)}`;
    }
  }
};
