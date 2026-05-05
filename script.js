const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");
const tabPanels = document.querySelector("#tabPanels");
const navTabButtons = Array.from(document.querySelectorAll(".nav__links [data-tab-target]"));
const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));

const ENTER_AUDIO_SRC = "assets/Get%20Your%20Wish%20(Short).MP3";
const AUDIO_SETTINGS_KEY = "star-dev-audio-settings";

const defaultAudioSettings = {
  musicEnabled: true,
  musicVolume: 0.2
};

const bgMusic = new Audio(ENTER_AUDIO_SRC);
let hasEntered = false;
let activeTab = document.querySelector("[data-tab-panel].is-active")?.dataset.tabPanel || "home";
let transitionTimer = 0;
let audioSettings = loadAudioSettings();

bgMusic.loop = true;
bgMusic.preload = "auto";
saveAudioSettings();

function clampVolume(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

function loadAudioSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || "{}");
    return {
      musicEnabled: typeof saved.musicEnabled === "boolean" ? saved.musicEnabled : defaultAudioSettings.musicEnabled,
      musicVolume: clampVolume(saved.musicVolume, defaultAudioSettings.musicVolume)
    };
  } catch {
    return { ...defaultAudioSettings };
  }
}

function saveAudioSettings() {
  localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
}

function formatVolume(value) {
  return `${Math.round(clampVolume(value, 0) * 100)}%`;
}

function getSettingsControls() {
  return {
    musicEnabled: document.querySelector("#musicEnabled"),
    musicVolume: document.querySelector("#musicVolume"),
    musicVolumeValue: document.querySelector("#musicVolumeValue")
  };
}

function syncSettingsControls() {
  const controls = getSettingsControls();

  if (controls.musicEnabled) controls.musicEnabled.checked = audioSettings.musicEnabled;
  if (controls.musicVolume) controls.musicVolume.value = audioSettings.musicVolume;
  if (controls.musicVolumeValue) controls.musicVolumeValue.textContent = formatVolume(audioSettings.musicVolume);
}

function applyMusicSettings() {
  bgMusic.volume = audioSettings.musicVolume;

  if (!hasEntered) return;

  if (audioSettings.musicEnabled) {
    bgMusic.play().catch(() => {
      // Browser settings can block audio even after interaction; controls should still update.
    });
  } else {
    bgMusic.pause();
  }
}

function bindSettingsControls() {
  const controls = getSettingsControls();

  controls.musicEnabled?.addEventListener("change", () => {
    audioSettings.musicEnabled = controls.musicEnabled.checked;
    saveAudioSettings();
    applyMusicSettings();
  });

  controls.musicVolume?.addEventListener("input", () => {
    audioSettings.musicVolume = clampVolume(controls.musicVolume.value, defaultAudioSettings.musicVolume);
    saveAudioSettings();
    syncSettingsControls();
    applyMusicSettings();
  });
}

function setMenu(open) {
  if (!menuToggle || !navLinks) return;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  navLinks.classList.toggle("is-open", open);
}

function setActiveNav(tabName) {
  navTabButtons.forEach((button) => {
    const isCurrent = button.dataset.tabTarget === tabName;
    button.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function updatePanelHeight(panel) {
  if (!tabPanels || !panel) return;
  tabPanels.style.minHeight = `${panel.offsetHeight}px`;
}

function showTab(tabName, options = {}) {
  const nextPanel = panels.find((panel) => panel.dataset.tabPanel === tabName);
  const currentPanel = panels.find((panel) => panel.dataset.tabPanel === activeTab);

  if (!nextPanel || tabName === activeTab) {
    setMenu(false);
    return;
  }

  window.clearTimeout(transitionTimer);
  setActiveNav(tabName);
  activeTab = tabName;

  if (options.updateHash !== false) {
    history.replaceState(null, "", `#${tabName}`);
  }

  if (currentPanel) {
    currentPanel.hidden = false;
    currentPanel.classList.remove("is-active");
    currentPanel.classList.add("is-exiting");
  }

  nextPanel.hidden = false;
  nextPanel.classList.remove("is-exiting");
  nextPanel.classList.add("is-active");
  updatePanelHeight(nextPanel);
  setMenu(false);

  transitionTimer = window.setTimeout(() => {
    panels.forEach((panel) => {
      const isNext = panel === nextPanel;
      panel.hidden = !isNext;
      panel.classList.toggle("is-active", isNext);
      panel.classList.remove("is-exiting");
    });

    tabPanels.style.minHeight = "";
    if (options.focusPanel) {
      nextPanel.focus({ preventScroll: true });
    }
  }, 380);
}

function setupInitialTab() {
  if (!panels.length) return;

  const tabFromHash = window.location.hash.replace("#", "");
  const hasHashPanel = panels.some((panel) => panel.dataset.tabPanel === tabFromHash);
  const firstTab = hasHashPanel ? tabFromHash : activeTab;

  panels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === firstTab;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
    panel.classList.remove("is-exiting");
  });

  activeTab = firstTab;
  setActiveNav(firstTab);
}

function createEnterScreen() {
  const enterScreen = document.createElement("div");
  const enterButton = document.createElement("button");

  enterScreen.className = "enter-screen";
  enterButton.className = "enter-screen__button";
  enterButton.type = "button";
  enterButton.innerHTML = "Welcome,<br>Click to enter.";

  enterScreen.appendChild(enterButton);
  document.body.appendChild(enterScreen);
  document.body.classList.add("enter-active");

  enterButton.addEventListener(
    "click",
    () => {
      hasEntered = true;
      applyMusicSettings();

      enterScreen.classList.add("is-hidden");
      document.body.classList.remove("enter-active");

      window.setTimeout(() => {
        enterScreen.remove();
      }, 420);
    },
    { once: true }
  );
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMenu(!isOpen);
});

navLinks?.addEventListener("click", (event) => {
  if (event.target.closest("a, button")) {
    setMenu(false);
  }
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-tab-target]");
  if (!target) return;

  event.preventDefault();
  showTab(target.dataset.tabTarget, { focusPanel: true });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
  }
});

window.addEventListener("resize", () => {
  const activePanel = panels.find((panel) => panel.dataset.tabPanel === activeTab);
  updatePanelHeight(activePanel);
  window.setTimeout(() => {
    if (tabPanels) tabPanels.style.minHeight = "";
  }, 120);
});

syncSettingsControls();
bindSettingsControls();
applyMusicSettings();
setupInitialTab();
createEnterScreen();
