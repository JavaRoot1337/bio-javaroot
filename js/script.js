// ============================================================
// script.js — page logic
// You don't need to edit this file. All customization lives in config.js
// ============================================================


// ============================================================
// INIT — runs once the HTML is ready
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

  let hasEntered = false;

  // -- Entry screen symbol --
  document.getElementById("entry-symbol").textContent = CONFIG.entrySymbol;

  // -- Badges --
  document.documentElement.style.setProperty("--badge-size",             CONFIG.badgeSize);
  document.documentElement.style.setProperty("--badge-container-bg",     CONFIG.badgeContainerBackground);
  document.documentElement.style.setProperty("--badge-container-border", CONFIG.badgeContainerBorder);


  // -- Avatar --
  document.documentElement.style.setProperty("--avatar-size", CONFIG.avatarSize);

  const decorationEl = document.getElementById("avatar-decoration");
  decorationEl.style.display = "none";

  // -- Background video --

  // -- Card appearance --
  document.documentElement.style.setProperty("--card-max-width",        CONFIG.cardMaxWidth);
  document.documentElement.style.setProperty("--card-border-radius",    CONFIG.cardBorderRadius);
  document.documentElement.style.setProperty("--card-background",       CONFIG.cardBackground);
  document.documentElement.style.setProperty("--card-border",           CONFIG.cardBorder);
  document.documentElement.style.setProperty("--card-tilt-perspective", CONFIG.cardTiltPerspective);
  document.documentElement.style.setProperty("--username-glow",         CONFIG.usernameGlow);

  // -- Discord box --
  document.documentElement.style.setProperty("--discord-box-background", CONFIG.discordBoxBackground);
  document.documentElement.style.setProperty("--discord-box-radius",     CONFIG.discordBoxRadius);
  document.documentElement.style.setProperty("--discord-box-border",     CONFIG.discordBoxBorder);
  document.documentElement.style.setProperty("--discord-avatar-size",    CONFIG.discordAvatarSize);
  document.documentElement.style.setProperty("--discord-avatar-border",  CONFIG.discordAvatarBorder);

  // -- Social icons --
  document.documentElement.style.setProperty("--icon-size",          CONFIG.iconSize);
  document.documentElement.style.setProperty("--icon-border-radius", CONFIG.iconBorderRadius);
  document.documentElement.style.setProperty("--icon-glow-color",    CONFIG.iconGlowColor);

  // -- Discord presence --
  document.getElementById("discord-username").textContent = CONFIG.discordUsername;
  document.getElementById("discord-activity").textContent = CONFIG.discordStatus;

  // -- Custom cursor --
  if (CONFIG.customCursor) {
    const style = document.createElement("style");
    style.textContent = `* { cursor: url("${CONFIG.customCursor}") ${CONFIG.customCursorHotspot}, auto !important; }`;
    document.head.appendChild(style);
  }

  // -- Tab title typewriter --
  initTabTitle(CONFIG.tabTitle);

  // -- Music player --
  initMusicPlayer();

  // -- Cursor sparkle trail (active from page load) --
  initCursorTrail();

  // --------------------------------------------------------
  // Entry screen click — starts everything
  // --------------------------------------------------------
  const profileCard = document.getElementById("profile-card");
  const bgVideo = document.getElementById("bg-video");

  document.getElementById("entry-screen").addEventListener("click", (e) => {
    if (hasEntered) return;
    hasEntered = true;
    e.currentTarget.classList.add("hidden");

    prepareMedia();
    initNameEffect();
    const playRequest = bgVideo.play();
    if (playRequest) playRequest.catch(() => {});

    initParticles();

    setTimeout(() => {
      profileCard.classList.add("revealed");
      initTypewriter(document.getElementById("profile-status"), CONFIG.statusText, 60);
    }, CONFIG.cardRevealDelay);
  });

  // --------------------------------------------------------
  // 3D card tilt on mouse move
  // --------------------------------------------------------
  if (CONFIG.cardTiltIntensity > 0) {
    const tiltTransform = (x, y) =>
      `translate(-50%, -50%) perspective(${CONFIG.cardTiltPerspective}) rotateX(${x}deg) rotateY(${y}deg)`;
    let cardRect = null;
    let tiltFrame = 0;
    let pendingPoint = null;

    const resetTransform = () => {
      pendingPoint = null;
      profileCard.style.transform = tiltTransform(0, 0);
    };

    const applyTilt = (clientX, clientY) => {
      pendingPoint = { clientX, clientY };
      if (tiltFrame) return;

      tiltFrame = requestAnimationFrame(() => {
        tiltFrame = 0;
        if (!pendingPoint) return;
        if (!cardRect) cardRect = profileCard.getBoundingClientRect();

        const offsetX = (pendingPoint.clientX - cardRect.left) / cardRect.width - 0.5;
        const offsetY = (pendingPoint.clientY - cardRect.top) / cardRect.height - 0.5;
        profileCard.style.transform = tiltTransform(
          -offsetY * 2 * CONFIG.cardTiltIntensity,
           offsetX * 2 * CONFIG.cardTiltIntensity
        );
      });
    };

    profileCard.addEventListener("pointerenter", () => {
      cardRect = profileCard.getBoundingClientRect();
    }, { passive: true });
    profileCard.addEventListener("pointermove", (e) => applyTilt(e.clientX, e.clientY), { passive: true });
    profileCard.addEventListener("pointerleave", () => {
      cardRect = null;
      resetTransform();
    }, { passive: true });
    window.addEventListener("resize", () => { cardRect = null; }, { passive: true });
  }

});


function prepareMedia() {
  const avatar = document.getElementById("avatar");
  avatar.src = CONFIG.avatar;
  avatar.decoding = "async";

  const decoration = document.getElementById("avatar-decoration");
  if (CONFIG.avatarDecoration) {
    decoration.src = CONFIG.avatarDecoration;
    decoration.decoding = "async";
    decoration.style.display = "block";
  }

  const discordAvatar = document.getElementById("discord-avatar");
  discordAvatar.src = CONFIG.discordAvatar;
  discordAvatar.decoding = "async";

  const statusIconMap = {
    online:  "assets/icons/status/online.png",
    idle:    "assets/icons/status/inactive.png",
    dnd:     "assets/icons/status/busy.png",
    offline: "assets/icons/status/offline.png",
  };
  const statusIcon = document.getElementById("discord-status-icon");
  statusIcon.src = statusIconMap[CONFIG.discordPresenceStatus] || statusIconMap.offline;
  statusIcon.decoding = "async";

  const badgesContainer = document.getElementById("badges");
  (CONFIG.badges || []).forEach((badge) => {
    const item = document.createElement("div");
    item.className = "badge-item";

    const tooltip = document.createElement("span");
    tooltip.className = "badge-tooltip";
    tooltip.textContent = badge.label || "";

    const img = document.createElement("img");
    img.src = badge.icon;
    img.alt = badge.label || "";
    img.decoding = "async";

    item.append(tooltip, img);
    badgesContainer.appendChild(item);
  });

  const socialContainer = document.getElementById("social-links");
  CONFIG.socialLinks.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = link.name;

    const icon = document.createElement("img");
    icon.className = "social-icon";
    icon.src = link.icon;
    icon.alt = link.name;
    icon.decoding = "async";

    a.appendChild(icon);
    socialContainer.appendChild(a);
  });

  const bgVideo = document.getElementById("bg-video");
  const source = document.getElementById("bg-video-source");
  source.src = CONFIG.backgroundVideo;
  bgVideo.preload = "auto";
  bgVideo.load();
}


function initMusicPlayer() {
  const audio = document.getElementById("music-audio");
  const title = document.getElementById("music-title");
  const artist = document.getElementById("music-artist");
  const toggle = document.getElementById("music-toggle");
  const previous = document.getElementById("music-previous");
  const next = document.getElementById("music-next");
  const progress = document.getElementById("music-progress");
  const currentTime = document.getElementById("music-current-time");
  const duration = document.getElementById("music-duration");
  const tracks = Array.isArray(CONFIG.musicTracks)
    ? CONFIG.musicTracks.filter((track) => track && track.file)
    : [];
  let current = 0;

  audio.volume = Math.min(Math.max(Number(CONFIG.musicVolume) || 0, 0), 1);

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const setPlayState = (playing) => {
    toggle.textContent = playing ? "Ⅱ" : "▶";
    toggle.setAttribute("aria-label", playing ? "Поставить музыку на паузу" : "Включить музыку");
    toggle.classList.toggle("is-playing", playing);
  };

  const setTrack = (index, play) => {
    if (!tracks.length) return;

    current = (index + tracks.length) % tracks.length;
    const track = tracks[current];
    title.textContent = track.title || "Без названия";
    artist.textContent = track.artist || "Неизвестный исполнитель";
    audio.src = track.file;
    audio.load();
    progress.value = "0";
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";
    setPlayState(false);

    if (play) audio.play().catch(() => {});
  };

  if (!tracks.length) {
    toggle.disabled = true;
    previous.disabled = true;
    next.disabled = true;
    progress.disabled = true;
    return;
  }

  setTrack(0, false);

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  previous.addEventListener("click", () => setTrack(current - 1, !audio.paused));
  next.addEventListener("click", () => setTrack(current + 1, !audio.paused));

  progress.addEventListener("input", () => {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = audio.duration * (Number(progress.value) / 100);
  });

  audio.addEventListener("loadedmetadata", () => {
    duration.textContent = formatTime(audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audio.duration)) return;
    progress.value = String((audio.currentTime / audio.duration) * 100);
    currentTime.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener("play", () => setPlayState(true));
  audio.addEventListener("pause", () => setPlayState(false));
  audio.addEventListener("ended", () => setTrack(current + 1, true));
}


// ============================================================
// NAME INTERFERENCE EFFECT
// Applies an SVG displacement filter to the name span.
// The filter seed changes every 40ms, making the letters
// "vibrate" like a bad TV signal — all done by the GPU.
// ============================================================
function initNameEffect() {
  const nameEl  = document.getElementById("name-text");
  const tooltip = document.getElementById("name-tooltip");

  nameEl.textContent  = CONFIG.profileName;
  tooltip.textContent = CONFIG.nameTooltip || "";

  if (CONFIG.nameEffect !== "noise" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nameEl.style.filter = "none";
    return;
  }

  const turb = document.getElementById("name-turb");
  const disp = document.getElementById("name-disp");

  setInterval(() => {
    turb.setAttribute("seed", Math.floor(Math.random() * 9999));
    // 80% of the time: heavy distortion / 20%: almost clean
    const scale = Math.random() < 0.8
      ? 4 + Math.random() * 8
      : 0.5 + Math.random() * 2;
    disp.setAttribute("scale", scale.toFixed(1));
  }, 40);
}


// ============================================================
// TAB TITLE TYPEWRITER
// Types the title in the browser tab, pauses, deletes, repeats.
// ============================================================
function initTabTitle(text) {
  let index     = 0;
  let isTyping  = true;

  function tick() {
    if (isTyping) {
      document.title = text.substring(0, index + 1);
      index++;
      if (index === text.length) {
        isTyping = false;
        setTimeout(tick, 1500);
        return;
      }
    } else {
      document.title = text.substring(0, index - 1);
      index--;
      if (index === 0) isTyping = true;
    }
    setTimeout(tick, 100);
  }

  tick();
}


// ============================================================
// STATUS TYPEWRITER
// Types the status text, pauses, deletes, and repeats.
// The blinking cursor "|" is added via CSS (::after on #profile-status).
// ============================================================
function initTypewriter(el, text, speed = 80) {
  let i          = 0;
  let isDeleting = false;

  function tick() {
    if (!isDeleting) {
      el.textContent = text.substring(0, i);
      i++;
      if (i > text.length) {
        setTimeout(() => { isDeleting = true; tick(); }, 1800);
        return;
      }
    } else {
      el.textContent = text.substring(0, i);
      i--;
      if (i < 0) {
        i = 0;
        isDeleting = false;
        setTimeout(tick, 500);
        return;
      }
    }
    setTimeout(tick, isDeleting ? speed * 0.5 : speed);
  }

  tick();
}


// ============================================================
// BACKGROUND PARTICLES
// Dots that fall from top to bottom with a gentle horizontal
// sway. They also shift opposite to the mouse movement,
// creating a parallax depth effect.
// Starts only after the entry screen is clicked.
// ============================================================
function initParticles() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.getElementById("bg-canvas");
  const ctx    = canvas.getContext("2d");

  const { particleColor, particleCount, particleFallDuration,
          particleSwayDuration, particleSwayAmount, particleParallaxStrength } = CONFIG;

  let particles = [];
  let mouseX    = window.innerWidth / 2;
  let frameId   = 0;

  document.addEventListener("pointermove", (e) => { mouseX = e.clientX; }, { passive: true });

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        baseX:      Math.random() * canvas.width,
        y:          Math.random() * canvas.height * 1.5 - canvas.height * 0.5,
        r:          1 + Math.random() * 1.8,
        swayPhase:  Math.random() * Math.PI * 2,
        swaySpeed:  (Math.random() * 0.6 + 0.7) / particleSwayDuration,
        fallSpeed:  (canvas.height * 1.1) / (particleFallDuration * 60) * (0.7 + Math.random() * 0.6),
        opacity:    0.4 + Math.random() * 0.6,
      });
    }
  }

  function draw(now) {
    frameId = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = particleColor;

    const parallaxOffset = -(mouseX - canvas.width / 2) * particleParallaxStrength;

    for (const p of particles) {
      p.y += p.fallSpeed;
      if (p.y > canvas.height + 10) {
        p.y     = -10;
        p.baseX = Math.random() * canvas.width;
      }

      const sway = Math.sin(now * 0.001 * p.swaySpeed + p.swayPhase) * particleSwayAmount;
      let x = p.baseX + sway + parallaxOffset;
      x = ((x % canvas.width) + canvas.width) % canvas.width;

      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    frameId = requestAnimationFrame(draw);
  }

  function scheduleDraw() {
    if (!frameId) frameId = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  window.addEventListener("resize", () => {
    resize();
    createParticles();
    scheduleDraw();
  }, { passive: true });
  scheduleDraw();
}


// ============================================================
// CURSOR SPARKLE TRAIL
// 4-pointed star sparkles that appear at the cursor position
// and fade out while drifting. Spawning is done inside the
// requestAnimationFrame loop (not in mousemove) to avoid lag.
// ============================================================
function initCursorTrail() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;

  const canvas = document.getElementById("cursor-canvas");
  const ctx    = canvas.getContext("2d");

  const { shootingStarColors, shootingStarSize,
          shootingStarMaxParticles, shootingStarFadeFrames,
          shootingStarGlow } = CONFIG;

  let particles = [];
  let mouseX = -999, mouseY = -999;
  let lastX  = -999, lastY  = -999;
  let frameId = 0;

  document.addEventListener("pointermove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    scheduleDraw();
  }, { passive: true });

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function drawStar(x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo( size * 0.2, -size * 0.2,  size, 0);
    ctx.quadraticCurveTo( size * 0.2,  size * 0.2,  0,    size);
    ctx.quadraticCurveTo(-size * 0.2,  size * 0.2, -size, 0);
    ctx.quadraticCurveTo(-size * 0.2, -size * 0.2,  0,   -size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw(now) {
    frameId = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn new particles only when the mouse has moved
    if (mouseX !== lastX || mouseY !== lastY) {
      for (let i = 0; i < shootingStarMaxParticles; i++) {
        particles.push({
          x:             mouseX,
          y:             mouseY,
          vx:            (Math.random() - 0.5) * 1.2,
          vy:            (Math.random() - 0.5) * 1.2,
          life:          1,
          size:          shootingStarSize * (0.5 + Math.random() * 0.7),
          rotation:      Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.12,
          twinklePhase:  Math.random() * Math.PI * 2,
          color:         shootingStarColors[Math.floor(Math.random() * shootingStarColors.length)],
        });
      }
      lastX = mouseX;
      lastY = mouseY;
    }

    particles.forEach((p) => {
      p.x        += p.vx;
      p.y        += p.vy;
      p.vx       *= 0.97;
      p.vy       *= 0.97;
      p.rotation += p.rotationSpeed;
      p.life     -= 1 / shootingStarFadeFrames;

      const life    = Math.max(p.life, 0);
      const twinkle = 0.75 + 0.25 * Math.sin(now * 0.015 + p.twinklePhase);

      ctx.globalAlpha = life;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = shootingStarGlow;
      drawStar(p.x, p.y, p.size * life * twinkle, p.rotation);
    });

    particles     = particles.filter((p) => p.life > 0);
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;

    if (particles.length) scheduleDraw();
  }

  function scheduleDraw() {
    if (!frameId) frameId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (particles.length) scheduleDraw();
  }, { passive: true });
}
