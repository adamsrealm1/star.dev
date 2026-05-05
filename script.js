const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");
const tabPanels = document.querySelector("#tabPanels");
const tabButtons = Array.from(document.querySelectorAll("[data-tab-target]"));
const navTabButtons = Array.from(document.querySelectorAll(".nav__links [data-tab-target]"));
const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));
const ENTER_AUDIO_SRC = "assets/Get%20Your%20Wish%20(Short).MP3";

let activeTab = document.querySelector("[data-tab-panel].is-active")?.dataset.tabPanel || "home";
let transitionTimer = 0;

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
  const audio = new Audio(ENTER_AUDIO_SRC);

  audio.volume = 0.5;
  audio.preload = "auto";

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
      audio.play().catch(() => {
        // Browsers can still block audio in some settings; entering should continue.
      });

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

setupInitialTab();
createEnterScreen();
