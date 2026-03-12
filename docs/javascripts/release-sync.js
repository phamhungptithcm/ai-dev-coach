(function () {
  var DEFAULT_REPO = "phamhungptithcm/ai-dev-coach";
  var CACHE_KEY = "ai-dev-coach-latest-release";
  var CACHE_TTL_MS = 30 * 60 * 1000;

  function readCache() {
    try {
      var raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) {
        return null;
      }

      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.fetchedAt || !parsed.release) {
        return null;
      }

      if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) {
        return null;
      }

      return parsed.release;
    } catch (error) {
      return null;
    }
  }

  function writeCache(release) {
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          fetchedAt: Date.now(),
          release: release
        })
      );
    } catch (error) {
      // no-op
    }
  }

  function formatReleaseLabel(release) {
    var tag = release.tag_name || release.name;
    if (!tag) {
      return "No release tag found";
    }

    var published = release.published_at ? new Date(release.published_at) : null;
    if (!published || Number.isNaN(published.getTime())) {
      return tag;
    }

    return tag + " (" + published.toLocaleDateString() + ")";
  }

  function applyReleaseToNode(node, release) {
    var label = formatReleaseLabel(release);
    node.textContent = label;
    node.href = release.html_url || node.href;
    node.title = "Latest release: " + (release.tag_name || release.name || "unknown");
  }

  function applyErrorToNode(node) {
    node.textContent = "Unable to load release";
    node.title = "Could not fetch latest release from GitHub API.";
  }

  function getReleaseNodes() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-latest-release]"));
  }

  function fetchLatestRelease(repo) {
    return fetch("https://api.github.com/repos/" + repo + "/releases/latest", {
      headers: {
        Accept: "application/vnd.github+json"
      }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("GitHub API failed with status " + response.status);
      }
      return response.json();
    });
  }

  function syncLatestRelease() {
    var nodes = getReleaseNodes();
    if (nodes.length === 0) {
      return;
    }

    var repo = nodes[0].getAttribute("data-repo") || DEFAULT_REPO;
    var cached = readCache();
    if (cached) {
      nodes.forEach(function (node) {
        applyReleaseToNode(node, cached);
      });
      return;
    }

    fetchLatestRelease(repo)
      .then(function (release) {
        writeCache(release);
        nodes.forEach(function (node) {
          applyReleaseToNode(node, release);
        });
      })
      .catch(function () {
        nodes.forEach(function (node) {
          applyErrorToNode(node);
        });
      });
  }

  if (typeof window.document$ !== "undefined" && window.document$ && window.document$.subscribe) {
    window.document$.subscribe(syncLatestRelease);
  } else {
    window.addEventListener("DOMContentLoaded", syncLatestRelease);
  }
})();
