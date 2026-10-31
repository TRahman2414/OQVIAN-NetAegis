/*
 * NetAegis backend — demo operator state store.
 *
 * Holds acknowledgement, note and simulated-workflow state for incidents
 * in memory. Operator actions persist only for the process lifetime by
 * default (a restart is effectively a demo reset). If, and only if,
 * NETAEGIS_PERSIST_STATE is set to a file path, state is also mirrored
 * there via atomic tmp-file + rename. The file is for operator
 * convenience in demos; it contains no credentials and no synthetic
 * secrets, and backend/.gitignore excludes default state filenames.
 */

"use strict";

const fs = require("fs");
const path = require("path");

function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function createAppState(stateFilePath) {
  const state = new Map(); // incidentId -> operator fields, optional workflowEvent, and activity[]

  if (stateFilePath) {
    try {
      const raw = fs.readFileSync(stateFilePath, "utf8");
      for (const [id, value] of Object.entries(JSON.parse(raw))) {
        if (value && typeof value === "object") state.set(id, value);
      }
      console.log(`[netagis] operator state restored from ${stateFilePath}`);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.warn(`[netagis] could not restore state from ${stateFilePath}: ${err.message}`);
      }
    }
  }

  function save() {
    if (!stateFilePath) return;
    try {
      const tmp = `${stateFilePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(state), null, 2));
      fs.renameSync(tmp, stateFilePath);
    } catch (err) {
      console.warn(`[netagis] persisting state failed: ${err.message}`);
    }
  }

  function get(id) {
    return state.get(id) || null;
  }

  function set(id, value) {
    state.set(id, value);
    save();
  }

  function addActivity(id, text) {
    const current = state.get(id) || {};
    current.activity = current.activity || [];
    current.activity.unshift({ at: nowStamp(), text });
    state.set(id, current);
    save();
  }

  function snapshot() {
    return Object.fromEntries(state);
  }

  return { get, set, addActivity, snapshot };
}

module.exports = { createAppState };
