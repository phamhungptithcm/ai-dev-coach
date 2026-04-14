const vscode = require("vscode");
const runtime = require("./coachRuntime");
const diagnosticsRuntime = require("./diagnosticsRuntime");

const DIAGNOSTIC_SOURCE = "AI Dev Coach";
const DIAGNOSTIC_SELECTOR = Array.from(diagnosticsRuntime.SUPPORTED_LANGUAGE_IDS).map((language) => ({
  language
}));

function getConfiguration() {
  const config = vscode.workspace.getConfiguration("aiDevCoach");
  return {
    defaultRole: config.get("defaultRole", "software_engineer"),
    defaultLevel: config.get("defaultLevel", "Junior"),
    defaultTemplate: config.get("defaultTemplate", "debugging"),
    enableDiagnostics: config.get("enableDiagnostics", true),
    maxPromptLength: config.get("maxPromptLength", 6000)
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function pickTemplate(defaultTemplate) {
  const items = Object.entries(runtime.TEMPLATE_DEFINITIONS).map(([key, template]) => ({
    label: template.label,
    description: key === defaultTemplate ? "Default" : "",
    key
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Choose the coaching template for this prompt"
  });

  return selected ? selected.key : null;
}

function resolveRequestedTemplate(input) {
  if (typeof input === "string" && runtime.TEMPLATE_DEFINITIONS[input]) {
    return input;
  }

  if (input && typeof input === "object" && runtime.TEMPLATE_DEFINITIONS[input.templateKey]) {
    return input.templateKey;
  }

  return null;
}

function getPromptFromEditor(editor) {
  if (!editor) {
    return "";
  }

  const selectedText = editor.document.getText(editor.selection).trim();
  if (selectedText) {
    return selectedText;
  }

  const fullText = editor.document.getText().trim();
  return fullText.length <= 5000 ? fullText : "";
}

function buildAnalysisHtml(result) {
  const scoreItems = [
    ["Clarity", result.analysis.dimensions ? result.analysis.dimensions.clarity : result.analysis.clarity],
    ["Context", result.analysis.dimensions ? result.analysis.dimensions.context : result.analysis.context],
    ["Specificity", result.analysis.dimensions ? result.analysis.dimensions.specificity : result.analysis.specificity],
    ["Risk Guardrails", result.analysis.dimensions ? result.analysis.dimensions.risk : result.analysis.risk]
  ];
  const lintItems = (result.lintReport.results || [])
    .map((entry) => {
      const status = entry.passed ? "PASS" : entry.severity.toUpperCase();
      return `<li><strong>${escapeHtml(status)}</strong> ${escapeHtml(entry.title)}: ${escapeHtml(entry.message)}</li>`;
    })
    .join("");
  const suggestionItems = (result.analysis.suggestions || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const warningItems = (result.analysis.warnings || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const dimensionItems = scoreItems
    .map(([label, value]) => `<li><strong>${escapeHtml(label)}</strong>: ${escapeHtml(value)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 16px; color: var(--vscode-editor-foreground); }
    h1, h2 { margin: 0 0 10px; }
    section { margin: 0 0 18px; padding: 14px; border: 1px solid var(--vscode-panel-border); border-radius: 10px; }
    .meta { color: var(--vscode-descriptionForeground); margin: 0 0 8px; }
    ul { margin: 8px 0 0 18px; padding: 0; }
    .score { font-size: 28px; font-weight: 700; }
  </style>
</head>
<body>
  <section>
    <h1>AI Dev Coach</h1>
    <p class="meta">${escapeHtml(result.profile.role)} • ${escapeHtml(result.profile.skill)} • ${escapeHtml(result.template.label)}</p>
    <div class="score">${escapeHtml(result.analysis.score)}/100 • Grade ${escapeHtml(result.analysis.grade)}</div>
    <p>${escapeHtml(result.analysis.summary)}</p>
    <p class="meta">Recommended template for this role: ${escapeHtml(runtime.TEMPLATE_DEFINITIONS[result.recommendedTemplate]?.label || result.template.label)}</p>
  </section>
  <section>
    <h2>Score Breakdown</h2>
    <ul>${dimensionItems}</ul>
  </section>
  <section>
    <h2>Suggestions</h2>
    ${suggestionItems ? `<ul>${suggestionItems}</ul>` : "<p>No improvement suggestions for this prompt.</p>"}
  </section>
  <section>
    <h2>Warnings</h2>
    ${warningItems ? `<ul>${warningItems}</ul>` : "<p>No warning signals detected.</p>"}
  </section>
  <section>
    <h2>Lint Results</h2>
    <ul>${lintItems}</ul>
  </section>
</body>
</html>`;
}

async function analyzeSelection(commandOptions) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Open a file and select a prompt first.");
    return;
  }

  const prompt = getPromptFromEditor(editor);
  if (!prompt) {
    vscode.window.showWarningMessage("Select a prompt or keep the document under 5,000 characters.");
    return;
  }

  const config = getConfiguration();
  const requestedTemplate = resolveRequestedTemplate(commandOptions);
  const templateKey = requestedTemplate || (await pickTemplate(config.defaultTemplate));
  if (!templateKey) {
    return;
  }

  const result = runtime.analyzePrompt({
    prompt,
    roleKey: config.defaultRole,
    level: config.defaultLevel,
    templateKey
  });

  const panel = vscode.window.createWebviewPanel(
    "aiDevCoachAnalysis",
    "AI Dev Coach Analysis",
    vscode.ViewColumn.Beside,
    { enableFindWidget: true }
  );
  panel.webview.html = buildAnalysisHtml(result);
}

async function insertPromptSkeleton() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Open a file before inserting a prompt skeleton.");
    return;
  }

  const config = getConfiguration();
  const templateKey = await pickTemplate(config.defaultTemplate);
  if (!templateKey) {
    return;
  }

  const skeleton = runtime.buildPromptSkeleton({
    roleKey: config.defaultRole,
    level: config.defaultLevel,
    templateKey
  });

  await editor.edit((editBuilder) => {
    editBuilder.insert(editor.selection.active, skeleton);
  });

  vscode.window.showInformationMessage("Inserted AI Dev Coach prompt skeleton.");
}

function severityToDiagnosticSeverity(severity) {
  if (severity === "error") {
    return vscode.DiagnosticSeverity.Error;
  }
  if (severity === "warning") {
    return vscode.DiagnosticSeverity.Warning;
  }
  return vscode.DiagnosticSeverity.Information;
}

function fullDocumentRange(document) {
  return new vscode.Range(new vscode.Position(0, 0), document.positionAt(document.getText().length));
}

function normalizeRange(document, start, end) {
  const source = document.getText();
  const safeStart = Math.max(0, Math.min(start || 0, source.length));
  const minimumEnd = Math.min(source.length, safeStart + 1);
  const safeEnd = Math.max(minimumEnd, Math.min(end || minimumEnd, source.length));
  return new vscode.Range(document.positionAt(safeStart), document.positionAt(safeEnd));
}

function createDiagnostic(document, descriptor) {
  const diagnostic = new vscode.Diagnostic(
    normalizeRange(document, descriptor.start, descriptor.end),
    descriptor.message,
    severityToDiagnosticSeverity(descriptor.severity)
  );
  diagnostic.code = descriptor.code;
  diagnostic.source = DIAGNOSTIC_SOURCE;
  diagnostic.data = descriptor.data || null;
  return diagnostic;
}

function createDiagnosticState() {
  return {
    collection: vscode.languages.createDiagnosticCollection("ai-dev-coach"),
    analyses: new Map(),
    timers: new Map()
  };
}

function scheduleDiagnosticsRefresh(document, state) {
  if (!document) {
    return;
  }

  const key = document.uri.toString();
  const existingTimer = state.timers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    state.timers.delete(key);
    refreshDiagnostics(document, state);
  }, 250);

  state.timers.set(key, timer);
}

function refreshDiagnostics(document, state) {
  if (!document) {
    return;
  }

  const key = document.uri.toString();
  const config = getConfiguration();
  if (!config.enableDiagnostics) {
    state.collection.delete(document.uri);
    state.analyses.delete(key);
    return;
  }

  const report = diagnosticsRuntime.analyzePromptDocument({
    text: document.getText(),
    languageId: document.languageId,
    roleKey: config.defaultRole,
    level: config.defaultLevel,
    templateKey: config.defaultTemplate,
    maxPromptLength: config.maxPromptLength
  });

  if (!report.shouldAnalyze) {
    state.collection.delete(document.uri);
    state.analyses.delete(key);
    return;
  }

  state.analyses.set(key, report);
  state.collection.set(
    document.uri,
    report.diagnostics.map((descriptor) => createDiagnostic(document, descriptor))
  );
}

function disposeDiagnosticState(state) {
  state.timers.forEach((timer) => clearTimeout(timer));
  state.timers.clear();
  state.analyses.clear();
  state.collection.clear();
  state.collection.dispose();
}

function makeReplaceDocumentAction(title, document, updatedText, diagnostic) {
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(document.uri, fullDocumentRange(document), updatedText);
  action.diagnostics = diagnostic ? [diagnostic] : undefined;
  return action;
}

function makeCommandAction(title, command, diagnostic, argumentsList) {
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  action.command = { command, title, arguments: argumentsList || [] };
  action.diagnostics = diagnostic ? [diagnostic] : undefined;
  return action;
}

function provideQuickFixes(document, context, state) {
  const report = state.analyses.get(document.uri.toString());
  if (!report) {
    return [];
  }

  const config = getConfiguration();
  const documentText = document.getText();
  const actions = [];
  const seenTitles = new Set();

  function pushAction(action) {
    if (!action || seenTitles.has(action.title)) {
      return;
    }
    seenTitles.add(action.title);
    actions.push(action);
  }

  function pushReplaceAction(title, fixId, diagnostic) {
    const updatedText = diagnosticsRuntime.applyPromptFix({
      text: documentText,
      fixId,
      roleKey: config.defaultRole,
      level: config.defaultLevel,
      templateKey: report.templateKey,
      analysisResult: report.analysisResult
    });

    if (updatedText && updatedText !== documentText) {
      pushAction(makeReplaceDocumentAction(title, document, updatedText, diagnostic));
    }
  }

  context.diagnostics
    .filter((diagnostic) => diagnostic.source === DIAGNOSTIC_SOURCE)
    .forEach((diagnostic) => {
      const code = String(diagnostic.code || "");

      if (code === diagnosticsRuntime.DIAGNOSTIC_CODES.POSSIBLE_SENSITIVE_DATA) {
        pushReplaceAction("AI Dev Coach: Redact detected sensitive data", "redact-sensitive-data", diagnostic);
      }

      if (code === diagnosticsRuntime.DIAGNOSTIC_CODES.PROMPT_TOO_SHORT) {
        pushReplaceAction("AI Dev Coach: Expand into structured prompt", "expand-structured-prompt", diagnostic);
        if (!report.sections.what_i_tried) {
          pushReplaceAction("AI Dev Coach: Add What I Tried section", "add-what-i-tried-section", diagnostic);
        }
      }

      if (code === diagnosticsRuntime.DIAGNOSTIC_CODES.MISSING_TECHNICAL_CONTEXT) {
        pushReplaceAction("AI Dev Coach: Add technical context", "add-context-section", diagnostic);
      }

      if (code === diagnosticsRuntime.DIAGNOSTIC_CODES.MISSING_ERROR_MESSAGE) {
        pushReplaceAction("AI Dev Coach: Add exact failure signal", "add-failure-signal", diagnostic);
      }

      if (code === diagnosticsRuntime.DIAGNOSTIC_CODES.LOW_SCORE) {
        if (!report.sections.context) {
          pushReplaceAction("AI Dev Coach: Add technical context", "add-context-section", diagnostic);
        }
        if (!report.sections.what_i_tried) {
          pushReplaceAction("AI Dev Coach: Add What I Tried section", "add-what-i-tried-section", diagnostic);
        }
      }

      pushAction(
        makeCommandAction(
          "AI Dev Coach: Analyze Prompt",
          "aiDevCoach.analyzeSelection",
          diagnostic,
          [{ templateKey: report.templateKey }]
        )
      );
    });

  return actions;
}

function activate(context) {
  const diagnosticState = createDiagnosticState();

  context.subscriptions.push(
    diagnosticState.collection,
    vscode.commands.registerCommand("aiDevCoach.analyzeSelection", analyzeSelection),
    vscode.commands.registerCommand("aiDevCoach.insertPromptSkeleton", insertPromptSkeleton),
    vscode.languages.registerCodeActionsProvider(
      DIAGNOSTIC_SELECTOR,
      {
        provideCodeActions(document, range, codeActionContext) {
          return provideQuickFixes(document, codeActionContext, diagnosticState);
        }
      },
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
      }
    ),
    vscode.workspace.onDidOpenTextDocument((document) => refreshDiagnostics(document, diagnosticState)),
    vscode.workspace.onDidChangeTextDocument((event) => scheduleDiagnosticsRefresh(event.document, diagnosticState)),
    vscode.workspace.onDidCloseTextDocument((document) => {
      const key = document.uri.toString();
      const timer = diagnosticState.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        diagnosticState.timers.delete(key);
      }
      diagnosticState.collection.delete(document.uri);
      diagnosticState.analyses.delete(key);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        refreshDiagnostics(editor.document, diagnosticState);
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("aiDevCoach")) {
        return;
      }

      vscode.workspace.textDocuments.forEach((document) => refreshDiagnostics(document, diagnosticState));
    }),
    {
      dispose() {
        disposeDiagnosticState(diagnosticState);
      }
    }
  );

  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(vscode.window.activeTextEditor.document, diagnosticState);
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
