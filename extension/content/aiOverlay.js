(() => {
  const CONTAINER_ID = "ai-dev-coach-toast-container";
  const MAX_VISIBLE_TOASTS = 4;
  const DEFAULT_TOAST_DURATION_MS = 9000;
  const MIN_TOAST_DURATION_MS = 9000;
  const MAX_TOAST_DURATION_MS = 20000;

  function getContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (container) {
      return container;
    }

    container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.className = "ai-coach-toast-container";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");
    document.body.appendChild(container);
    return container;
  }

  function show(message, type = "info", duration = DEFAULT_TOAST_DURATION_MS) {
    if (!message || typeof message !== "string") {
      return;
    }

    const container = getContainer();
    const item = document.createElement("section");
    item.className = `ai-coach-toast ai-coach-toast--${type}`;

    const title = document.createElement("h3");
    title.className = "ai-coach-toast__title";
    title.textContent = "AI Dev Coach";

    const body = document.createElement("p");
    body.className = "ai-coach-toast__message";
    body.textContent = message;

    item.appendChild(title);
    item.appendChild(body);
    container.appendChild(item);

    while (container.childElementCount > MAX_VISIBLE_TOASTS) {
      container.firstElementChild?.remove();
    }

    const normalizedDuration = Number.isFinite(duration)
      ? Math.min(MAX_TOAST_DURATION_MS, Math.max(MIN_TOAST_DURATION_MS, duration))
      : DEFAULT_TOAST_DURATION_MS;

    window.setTimeout(() => {
      item.classList.add("ai-coach-toast--exit");
      window.setTimeout(() => item.remove(), 220);
    }, normalizedDuration);
  }

  window.AIDevCoachOverlay = {
    show
  };
})();
