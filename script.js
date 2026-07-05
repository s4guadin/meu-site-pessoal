document.addEventListener("DOMContentLoaded", () => {
  const DISCORD_USER_ID = "714914940535832676";
  const GITHUB_USERNAME = "s4guadin";

  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const tabWords = ["vibecode", "lua", "DDnet"];
  let tabWordIndex = 0;

  function animateTabTitle() {
    document.title = `saguas . ${tabWords[tabWordIndex]}`;
    tabWordIndex = (tabWordIndex + 1) % tabWords.length;
  }

  animateTabTitle();
  window.setInterval(animateTabTitle, 1200);

  const nav = document.querySelector(".nav-links");
  const navLinks = nav ? Array.from(nav.querySelectorAll("a")) : [];
  let activeNavLink = nav ? nav.querySelector("a.active") || navLinks[0] : null;

  function moveNavBubble(link) {
    if (!nav || !link) {
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    nav.style.setProperty("--bubble-left", `${linkRect.left - navRect.left}px`);
    nav.style.setProperty("--bubble-top", `${linkRect.top - navRect.top}px`);
    nav.style.setProperty("--bubble-width", `${linkRect.width}px`);
    nav.style.setProperty("--bubble-height", `${linkRect.height}px`);
    nav.style.setProperty("--bubble-opacity", "1");
  }

  if (nav && activeNavLink) {
    moveNavBubble(activeNavLink);

    navLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => moveNavBubble(link));
      link.addEventListener("focus", () => moveNavBubble(link));
    });

    nav.addEventListener("mouseleave", () => moveNavBubble(activeNavLink));
    window.addEventListener("resize", () => moveNavBubble(activeNavLink));
  }

  function updateActiveNav(pathname) {
    if (!nav) {
      return;
    }

    const currentFile = pathname.split("/").pop() || "index.html";
    navLinks.forEach((link) => {
      const linkFile = new URL(link.href, window.location.href).pathname.split("/").pop() || "index.html";
      link.classList.toggle("active", linkFile === currentFile);
    });

    activeNavLink = nav.querySelector("a.active") || navLinks[0];
    moveNavBubble(activeNavLink);
  }

  function getNavIndexFromUrl(url) {
    const file = new URL(url, window.location.href).pathname.split("/").pop() || "index.html";
    return navLinks.findIndex((link) => {
      const linkFile = new URL(link.href, window.location.href).pathname.split("/").pop() || "index.html";
      return linkFile === file;
    });
  }

  const avatar = document.querySelector(".avatar");
  const statusPill = document.querySelector(".status-pill");

  async function syncDiscordProfile() {
    if (!avatar || !statusPill || DISCORD_USER_ID === "COLOQUE_SEU_ID_AQUI") {
      return;
    }

    try {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
      const result = await response.json();

      if (!result.success || !result.data || !result.data.discord_user) {
        return;
      }

      const user = result.data.discord_user;
      const avatarExtension = user.avatar && user.avatar.startsWith("a_") ? "gif" : "png";
      const avatarUrl = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${avatarExtension}?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

      avatar.style.setProperty("--discord-avatar", `url("${avatarUrl}")`);
      avatar.classList.add("has-discord-avatar");

      const status = result.data.discord_status || "offline";
      statusPill.dataset.status = status;
      statusPill.lastChild.textContent = ` ${status}`;
    } catch {
      avatar.classList.remove("has-discord-avatar");
    }
  }

  syncDiscordProfile();
  window.setInterval(syncDiscordProfile, 5 * 60 * 1000);

  function createProjectCard(repo) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const meta = document.createElement("div");
    const language = document.createElement("span");
    const stars = document.createElement("span");
    const link = document.createElement("a");

    card.className = "card project-card github-card";
    title.textContent = repo.name;
    description.textContent = repo.description || "Projeto publico no GitHub.";
    meta.className = "project-meta";
    language.textContent = repo.language || "Repo";
    stars.textContent = `${repo.stargazers_count} stars`;
    link.className = "tag project-link";
    link.href = repo.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Abrir projeto";

    meta.append(language, stars);
    card.append(title, description, meta, link);
    return card;
  }

  async function loadGitHubProjects() {
    const githubProjects = document.querySelector(".github-projects");

    if (!githubProjects) {
      return;
    }

    if (GITHUB_USERNAME === "COLOQUE_SEU_USUARIO_AQUI") {
      githubProjects.innerHTML = `
        <article class="card project-card">
          <h3>Coloque seu usuario do GitHub</h3>
          <p>Abra o script.js e troque GITHUB_USERNAME pelo seu usuario.</p>
        </article>
      `;
      return;
    }

    try {
      const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`);
      const repos = await response.json();

      if (!response.ok || !Array.isArray(repos) || repos.length === 0) {
        throw new Error("Nenhum repositorio encontrado.");
      }

      githubProjects.innerHTML = "";
      repos
        .filter((repo) => !repo.fork)
        .slice(0, 6)
        .forEach((repo) => {
          githubProjects.appendChild(createProjectCard(repo));
        });
    } catch {
      githubProjects.innerHTML = `
        <article class="card project-card">
          <h3>Nao consegui carregar</h3>
          <p>Confira se o usuario do GitHub esta correto e tente atualizar a pagina.</p>
        </article>
      `;
    }
  }

  loadGitHubProjects();

  async function loadAnimeCovers() {
    const animeCovers = Array.from(document.querySelectorAll("[data-mal-id]"));

    if (animeCovers.length === 0) {
      return;
    }

    await Promise.all(animeCovers.map(async (cover) => {
      try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${cover.dataset.malId}`);
        const result = await response.json();
        const imageUrl = result.data && result.data.images && result.data.images.jpg
          ? result.data.images.jpg.large_image_url || result.data.images.jpg.image_url
          : "";

        if (!imageUrl) {
          return;
        }

        cover.style.setProperty("--anime-cover", `url("${imageUrl}")`);
        cover.classList.add("has-cover");
      } catch {
        cover.classList.remove("has-cover");
      }
    }));
  }

  loadAnimeCovers();

  function waitForAnimation(element) {
    return new Promise((resolve) => {
      element.addEventListener("animationend", resolve, { once: true });
    });
  }

  async function loadPageWithoutStoppingMusic(url, pushState = true, direction = "right") {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const nextDocument = new DOMParser().parseFromString(html, "text/html");
      const nextMain = nextDocument.querySelector("main");
      const currentMain = document.querySelector("main");

      if (!response.ok || !nextMain || !currentMain) {
        window.location.href = url;
        return;
      }

      currentMain.classList.add(direction === "right" ? "page-exit-left" : "page-exit-right");
      await waitForAnimation(currentMain);

      nextMain.classList.add(direction === "right" ? "page-enter-right" : "page-enter-left");
      currentMain.replaceWith(nextMain);
      updateActiveNav(new URL(url, window.location.href).pathname);
      loadGitHubProjects();
      loadAnimeCovers();

      if (pushState) {
        window.history.pushState({}, "", url);
      }

      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.location.href = url;
    }
  }

  if (nav) {
    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetUrl = new URL(link.href, window.location.href);

        if (targetUrl.origin !== window.location.origin || targetUrl.pathname === window.location.pathname) {
          return;
        }

        const currentIndex = getNavIndexFromUrl(window.location.href);
        const targetIndex = getNavIndexFromUrl(targetUrl.href);
        const direction = targetIndex >= currentIndex ? "right" : "left";

        event.preventDefault();
        loadPageWithoutStoppingMusic(targetUrl.href, true, direction);
      });
    });

    window.addEventListener("popstate", () => {
      loadPageWithoutStoppingMusic(window.location.href, false, "left");
    });
  }

  // Edite aqui: cada musica pode ter seu arquivo de audio e sua capa.
  const playlist = [
    {
      title: "VEIGH ArtistaGenerico",
      src: "musicas/VEIGH ArtistaGenerico.mp3",
      cover: "capas/capaveigh1.jpg",
    },
    {
      title: "Michael Jackson - Heaven Can Wait",
      src: "musicas/MichaelJacksonHeavenCanWait.mp3",
      cover: "capas/mj.jpg",
    },
  ];

  const player = document.querySelector(".music-player");
  const miniCover = document.querySelector(".mini-cover");
  const playButton = document.querySelector(".play-button");
  const progress = document.querySelector(".progress");
  const progressFill = document.querySelector(".progress span");
  const trackTitle = document.querySelector(".track-info span");
  const currentTime = document.querySelector(".current-time");
  const volumeSlider = document.querySelector(".volume-slider");

  if (!player || !miniCover || !playButton || !progress || !progressFill || !trackTitle || !currentTime || playlist.length === 0) {
    return;
  }

  const audio = new Audio();
  let currentTrack = Math.floor(Math.random() * playlist.length);

  let volume = 0.18;
  let fadeTimer;
  audio.volume = volume;

  function setVolume(nextVolume) {
    volume = Math.min(1, Math.max(0, nextVolume));
    audio.volume = volume;

    if (volumeSlider) {
      const percent = Math.round(volume * 100);
      volumeSlider.style.setProperty("--volume", `${percent}%`);
      volumeSlider.setAttribute("aria-valuenow", String(percent));
    }
  }

  function updateVolumeFromPointer(event) {
    if (!volumeSlider) {
      return;
    }

    const rect = volumeSlider.getBoundingClientRect();
    const percent = 1 - ((event.clientY - rect.top) / rect.height);
    setVolume(percent);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
      return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  }

  function loadTrack(index) {
    currentTrack = (index + playlist.length) % playlist.length;
    audio.src = playlist[currentTrack].src;
    trackTitle.textContent = playlist[currentTrack].title;
    miniCover.style.setProperty("--cover", `url("${playlist[currentTrack].cover}")`);
    progressFill.style.width = "0%";
    currentTime.textContent = "0:00";
  }

  function fadeTo(targetVolume, duration = 700) {
    window.clearInterval(fadeTimer);

    return new Promise((resolve) => {
      const startVolume = audio.volume;
      const startTime = performance.now();

      fadeTimer = window.setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progressAmount = Math.min(1, elapsed / duration);
        audio.volume = startVolume + ((targetVolume - startVolume) * progressAmount);

        if (progressAmount >= 1) {
          window.clearInterval(fadeTimer);
          audio.volume = targetVolume;
          resolve();
        }
      }, 30);
    });
  }

  async function playWithFade() {
    audio.volume = 0;
    await playTrack({ restoreVolume: false });
    await fadeTo(volume, 900);
  }

  async function goToNextTrackWithFade() {
    await fadeTo(0, 700);
    loadTrack(currentTrack + 1);
    await playWithFade();
  }

  async function playTrack({ restoreVolume = true, silentFail = false } = {}) {
    window.clearInterval(fadeTimer);

    if (restoreVolume) {
      audio.volume = volume;
    }

    try {
      await audio.play();
      player.classList.add("is-playing");
      playButton.setAttribute("aria-label", "Pause");
      return true;
    } catch {
      if (!silentFail) {
        player.classList.remove("is-playing");
        playButton.setAttribute("aria-label", "Play");
        trackTitle.textContent = "Arquivo nao encontrado";
      }

      return false;
    }
  }

  function pauseTrack() {
    window.clearInterval(fadeTimer);
    audio.pause();
    player.classList.remove("is-playing");
    playButton.setAttribute("aria-label", "Play");
  }

  playButton.addEventListener("click", () => {
    if (audio.paused) {
      playTrack();
      return;
    }

    pauseTrack();
  });

  if (volumeSlider) {
    setVolume(volume);

    volumeSlider.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      volumeSlider.setPointerCapture(event.pointerId);
      updateVolumeFromPointer(event);
    });

    volumeSlider.addEventListener("pointermove", (event) => {
      if (event.buttons !== 1) {
        return;
      }

      updateVolumeFromPointer(event);
    });

    volumeSlider.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
        event.preventDefault();
        setVolume(volume + 0.05);
      }

      if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
        event.preventDefault();
        setVolume(volume - 0.05);
      }
    });
  }

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) {
      return;
    }

    progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    currentTime.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("ended", () => {
    goToNextTrackWithFade();
  });

  audio.addEventListener("error", () => {
    pauseTrack();
    trackTitle.textContent = "Arquivo nao encontrado";
  });

  loadTrack(currentTrack);
  window.setTimeout(() => {
    playTrack({ silentFail: true });
  }, 600);
});
