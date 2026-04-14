(() => {
  function findSupportedHostLabel(url, supportedHosts = []) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      const hostEntry = (supportedHosts || []).find((entry) =>
        Array.isArray(entry.hosts) && entry.hosts.some((host) => host === hostname)
      );
      return hostEntry ? hostEntry.label : "";
    } catch (error) {
      return "";
    }
  }

  function describeWorkspaceState({ url, enterpriseState, supportedHosts, isUrlAllowed }) {
    if (!url) {
      return {
        readyForInjection: false,
        summary: "No active tab available.",
        detail: "Open ChatGPT, Claude, Gemini, Grok, or DeepSeek to use Insert and Send actions."
      };
    }

    const supportedLabel = findSupportedHostLabel(url, supportedHosts);
    if (!supportedLabel) {
      return {
        readyForInjection: false,
        summary: "Current tab is not a supported AI chat page.",
        detail: "Prompt Builder still works here, but Insert and Send require a supported AI chat tab."
      };
    }

    if (typeof isUrlAllowed === "function" && !isUrlAllowed(url, enterpriseState || {})) {
      return {
        readyForInjection: false,
        summary: `${supportedLabel} is open, but blocked by enterprise policy.`,
        detail: "Ask your admin to allow this host if you want Quick Builder and Send actions on it."
      };
    }

    return {
      readyForInjection: true,
      summary: `Ready on ${supportedLabel}.`,
      detail: "Insert and Send actions can target this tab directly."
    };
  }

  const api = {
    findSupportedHostLabel,
    describeWorkspaceState
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachWorkspaceReadiness = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachWorkspaceReadiness = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
