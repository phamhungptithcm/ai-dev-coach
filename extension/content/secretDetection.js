(() => {
  const SECRET_RULES = [
    {
      name: "AWS Access Key",
      regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
      severity: "high"
    },
    {
      name: "JWT Token",
      regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9._-]{8,}\.[A-Za-z0-9._-]{8,}\b/g,
      severity: "high"
    },
    {
      name: "Private Key",
      regex: /-----BEGIN(?: RSA| OPENSSH| DSA| EC)? PRIVATE KEY-----[\s\S]+?-----END(?: RSA| OPENSSH| DSA| EC)? PRIVATE KEY-----/g,
      severity: "high"
    },
    {
      name: "Database URL",
      regex: /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|sqlserver):\/\/[^\s"'<>]+/gi,
      severity: "high"
    },
    {
      name: "API Key",
      regex: /\b(?:sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z\\-_]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|api[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9._-]{16,}['"]?)\b/g,
      severity: "high"
    }
  ];

  function uniqueByPosition(results) {
    const seen = new Set();
    return results.filter((result) => {
      const key = `${result.name}:${result.start}:${result.end}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function maskValue(value, visibleHead = 4, visibleTail = 4) {
    if (!value) {
      return value;
    }

    if (value.length <= visibleHead + visibleTail + 4) {
      return `${value.slice(0, visibleHead)}*****`;
    }

    const tail = visibleTail > 0 ? value.slice(-visibleTail) : "";
    return `${value.slice(0, visibleHead)}*****${tail}`;
  }

  function redactDatabaseUrl(match) {
    try {
      const url = new URL(match);
      if (!url.username && !url.password) {
        return `${url.protocol}//*****@${url.host}${url.pathname}${url.search}${url.hash}`;
      }

      const username = url.username || "user";
      const password = url.password ? "*****" : "";
      const credentials = password ? `${username}:${password}` : `${username}:*****`;
      return `${url.protocol}//${credentials}@${url.host}${url.pathname}${url.search}${url.hash}`;
    } catch (error) {
      return match.replace(/:\/\/([^@\s]+)@/, "://*****@");
    }
  }

  function redactPrivateKey(match) {
    const beginMatch = match.match(/-----BEGIN(?: RSA| OPENSSH| DSA| EC)? PRIVATE KEY-----/);
    const endMatch = match.match(/-----END(?: RSA| OPENSSH| DSA| EC)? PRIVATE KEY-----/);
    const begin = beginMatch ? beginMatch[0] : "-----BEGIN PRIVATE KEY-----";
    const end = endMatch ? endMatch[0] : "-----END PRIVATE KEY-----";
    return `${begin}\n[REDACTED PRIVATE KEY]\n${end}`;
  }

  function redactMatch(rule, match) {
    if (rule.name === "JWT Token") {
      const parts = match.split(".");
      return parts.length === 3
        ? `${maskValue(parts[0], 6, 0)}.[REDACTED].[REDACTED]`
        : maskValue(match, 6, 0);
    }

    if (rule.name === "Private Key") {
      return redactPrivateKey(match);
    }

    if (rule.name === "Database URL") {
      return redactDatabaseUrl(match);
    }

    if (/api key/i.test(rule.name) && /api[_-]?key/i.test(match)) {
      return match.replace(/([:=]\s*['"]?)([A-Za-z0-9._-]{8})[A-Za-z0-9._-]+/i, "$1$2*****");
    }

    return maskValue(match);
  }

  function cloneRegex(regex) {
    const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
    return new RegExp(regex.source, flags);
  }

  function scanPromptForSecrets(prompt) {
    const source = typeof prompt === "string" ? prompt : "";
    if (!source.trim()) {
      return [];
    }

    const results = [];

    SECRET_RULES.forEach((rule) => {
      const regex = cloneRegex(rule.regex);
      let match;

      while ((match = regex.exec(source)) !== null) {
        const value = match[0];
        results.push({
          name: rule.name,
          severity: rule.severity,
          match: value,
          start: match.index,
          end: match.index + value.length,
          redacted: redactMatch(rule, value)
        });

        if (value.length === 0) {
          regex.lastIndex += 1;
        }
      }
    });

    return uniqueByPosition(results).sort((left, right) => left.start - right.start);
  }

  function redactSecrets(prompt, detections = []) {
    const source = typeof prompt === "string" ? prompt : "";
    if (!source || detections.length === 0) {
      return source;
    }

    let redacted = source;
    const ordered = [...detections].sort((left, right) => right.start - left.start);

    ordered.forEach((detection) => {
      redacted =
        redacted.slice(0, detection.start) +
        detection.redacted +
        redacted.slice(detection.end);
    });

    return redacted;
  }

  function inspectPromptForSecrets(prompt) {
    const findings = scanPromptForSecrets(prompt);
    const highestSeverity = findings.some((finding) => finding.severity === "high")
      ? "high"
      : findings.some((finding) => finding.severity === "medium")
        ? "medium"
        : findings.some((finding) => finding.severity === "low")
          ? "low"
          : null;

    return {
      findings,
      highestSeverity,
      redactedPrompt: redactSecrets(prompt, findings)
    };
  }

  window.AIDevCoachSecretGuard = {
    SECRET_RULES,
    scanPromptForSecrets,
    redactSecrets,
    inspectPromptForSecrets
  };
})();
