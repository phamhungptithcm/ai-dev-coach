#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const roleCoaching = require("../extension/shared/roleCoaching.js");
const engine = require("../extension/shared/promptQualityEngine.js");

assert.equal(typeof roleCoaching.getRoleProfile, "function");
assert.equal(typeof roleCoaching.buildRoleCoachingAdvice, "function");
assert.equal(typeof roleCoaching.getRecommendedTemplateForProfile, "function");

const frontendProfile = {
  roleKey: "software_engineer",
  role: "Frontend Engineer",
  skill: "Senior",
  habitGoals: "Ship safer UI changes"
};
const frontendSnapshot = roleCoaching.buildRoleCoachingSnapshot(frontendProfile);
assert.equal(frontendSnapshot.roleProfile.key, "software_engineer");
assert.equal(frontendSnapshot.roleProfile.specialization, "frontend");
assert.ok(
  frontendSnapshot.focusLine.includes("Frontend specialization is active."),
  "frontend profile should surface specialization-specific coaching"
);

const devopsTemplate = roleCoaching.getRecommendedTemplateForProfile(
  {
    roleKey: "software_engineer",
    role: "DevOps Engineer",
    skill: "Senior"
  },
  {
    templates: {
      debugging: {},
      system_design: {},
      learning: {}
    },
    defaultTemplate: "debugging"
  }
);
assert.equal(devopsTemplate, "system_design", "DevOps specialization should recommend the system design template");

const managerPrompt = engine.calculatePromptScore({
  prompt: [
    "Task: Help me decide whether to slip the launch milestone.",
    "Context: We are behind but I need guidance.",
    "What I tried: I reviewed the backlog and spoke with the team lead.",
    "Blocker: I do not know which tradeoff to make first."
  ].join("\n"),
  templateKey: "system_design",
  profile: {
    roleKey: "manager",
    role: "Engineering Manager",
    skill: "Senior"
  }
});
assert.ok(
  managerPrompt.suggestions.some((message) => /business impact|timeline|staffing|decision/i.test(message)),
  "manager prompts should receive manager-specific coaching suggestions"
);

const teacherPrompt = engine.calculatePromptScore({
  prompt: "Give me a full lesson plan right now with no explanation.",
  templateKey: "learning",
  profile: {
    roleKey: "teacher",
    role: "Teacher",
    skill: "Junior"
  }
});
assert.ok(
  teacherPrompt.warnings.some((message) => /Teacher mode/i.test(message)),
  "teacher prompts should receive role-specific shortcut warnings"
);

const studentSnapshot = roleCoaching.buildRoleCoachingSnapshot({
  roleKey: "software_engineer",
  role: "Backend Engineer",
  skill: "Student"
});
assert.ok(
  studentSnapshot.focusLine.includes("Student mode"),
  "student level should change the coaching focus line"
);
assert.ok(
  /exercise/i.test(studentSnapshot.habitTip),
  "student level should encourage exercise-oriented learning"
);

console.log("Role coaching checks passed.");
