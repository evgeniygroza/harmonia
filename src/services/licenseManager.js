const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const OFFLINE_GRACE_MS = 14 * 24 * 60 * 60 * 1000;
const CACHE_FILE = "license.json";
const DEFAULT_LICENSE_API_URL = "http://127.0.0.1:8787";
const DEFAULT_LOCAL_LICENSE_DB_PATH = path.join(os.homedir(), "harmonia-bot", "harmonia-bot.sqlite");

function normalizeLicenseKey(input) {
  const raw = String(input || "").trim().toUpperCase();
  const compact = raw.replace(/[^A-Z0-9]/g, "");

  if (!compact.startsWith("HARMONIA")) {
    return raw.replace(/\s+/g, "");
  }

  const suffix = compact.slice("HARMONIA".length);
  if (suffix.length !== 16) {
    return raw.replace(/\s+/g, "");
  }

  return `HARMONIA-${suffix.match(/.{1,4}/g).join("-")}`;
}

function maskLicenseKey(input) {
  const key = normalizeLicenseKey(input);
  const parts = key.split("-");

  if (parts.length === 5 && parts[0] === "HARMONIA") {
    return `HARMONIA-****-****-****-${parts[4]}`;
  }

  return key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "";
}

function platformName() {
  return {
    darwin: "macOS",
    win32: "Windows",
    linux: "Linux"
  }[process.platform] || process.platform;
}

function optionalMachineId() {
  try {
    const machineId = require("node-machine-id");
    if (typeof machineId.machineIdSync === "function") {
      return machineId.machineIdSync({ original: true });
    }
  } catch {
    // Optional dependency: fall back to local OS data below.
  }
  return "";
}

function localMachineFingerprint() {
  const machineId = optionalMachineId();

  if (machineId) {
    return `machine-id:${machineId}`;
  }

  let username = "";
  try {
    username = os.userInfo().username || "";
  } catch {
    username = "";
  }

  return [os.hostname(), process.platform, username].join("|");
}

function createDeviceId() {
  return crypto
    .createHash("sha256")
    .update(localMachineFingerprint())
    .digest("hex");
}

function sqlString(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

async function sqliteJson(dbPath, sql) {
  const { stdout } = await execFileAsync("sqlite3", [dbPath, "-json", sql], {
    timeout: 5000,
    maxBuffer: 1024 * 1024
  });
  return stdout.trim() ? JSON.parse(stdout) : [];
}

async function sqliteExec(dbPath, sql) {
  await execFileAsync("sqlite3", [dbPath, sql], {
    timeout: 5000,
    maxBuffer: 1024 * 1024
  });
}

function isGraceActive(cache, now = Date.now()) {
  const lastValidated = Date.parse(cache?.lastValidatedAt || cache?.activatedAt || "");
  return Number.isFinite(lastValidated) && now - lastValidated <= OFFLINE_GRACE_MS;
}

function numberValue(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function publicState(cache, overrides = {}) {
  const active = Boolean(cache && isGraceActive(cache));

  return {
    active,
    status: active ? "active" : "inactive",
    licenseType: cache?.licenseType || "",
    activationsAllowed: numberValue(cache?.activationsAllowed),
    activationsUsed: numberValue(cache?.activationsUsed),
    activatedAt: cache?.activatedAt || "",
    lastValidatedAt: cache?.lastValidatedAt || "",
    maskedLicenseKey: cache?.licenseKey ? maskLicenseKey(cache.licenseKey) : "",
    offline: false,
    ...overrides
  };
}

function errorState(code, message, cache = null, overrides = {}) {
  return {
    success: false,
    code,
    message,
    ...publicState(cache, {
      active: false,
      status: "inactive",
      ...overrides
    })
  };
}

function successState(payload, cache, overrides = {}) {
  return {
    ...payload,
    ...publicState(cache, {
      active: true,
      status: "active",
      ...overrides
    })
  };
}

function createLicenseManager({
  userDataPath,
  appVersion,
  apiUrl = process.env.HARMONIA_LICENSE_API_URL || DEFAULT_LICENSE_API_URL,
  localDbPath = process.env.HARMONIA_LICENSE_DB_PATH || DEFAULT_LOCAL_LICENSE_DB_PATH
}) {
  let cachePromise = null;
  let deviceId = "";
  const normalizedApiUrl = String(apiUrl || DEFAULT_LICENSE_API_URL).replace(/\/+$/, "");
  const cachePath = path.join(userDataPath, CACHE_FILE);

  async function readCache() {
    if (!cachePromise) {
      cachePromise = fs.readFile(cachePath, "utf8")
        .then((raw) => JSON.parse(raw))
        .catch(() => null);
    }
    return cachePromise;
  }

  async function writeCache(cache) {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), "utf8");
    cachePromise = Promise.resolve(cache);
  }

  async function clearCache() {
    await fs.rm(cachePath, { force: true });
    cachePromise = Promise.resolve(null);
  }

  function getDeviceId() {
    if (!deviceId) {
      deviceId = createDeviceId();
    }
    return deviceId;
  }

  async function postJson(endpoint, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(`${normalizedApiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const text = await response.text();
      const json = text ? JSON.parse(text) : {};

      if (!json || typeof json !== "object") {
        return {
          success: false,
          code: "SERVER_ERROR",
          message: "Server unavailable"
        };
      }

      return json;
    } catch {
      return {
        success: false,
        code: "SERVER_ERROR",
        message: "Server unavailable"
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function ensureLocalActivationSchema() {
    if (!fsSync.existsSync(localDbPath)) {
      return false;
    }

    await sqliteExec(localDbPath, `
      CREATE TABLE IF NOT EXISTS activations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_key TEXT NOT NULL,
        device_id TEXT NOT NULL,
        device_name TEXT,
        platform TEXT,
        app_version TEXT,
        activated_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (license_key, device_id)
      );
      CREATE INDEX IF NOT EXISTS idx_activations_license_key ON activations(license_key);
    `);
    return true;
  }

  async function localActivationRequest(endpoint, payload) {
    try {
      if (!await ensureLocalActivationSchema()) {
        return { success: false, code: "SERVER_ERROR", message: "Server unavailable" };
      }

      const licenseKey = normalizeLicenseKey(payload.licenseKey);
      const device = String(payload.deviceId || "").toLowerCase();
      if (!licenseKey || !/^[a-f0-9]{32,128}$/.test(device)) {
        return { success: false, code: "INVALID_LICENSE", message: "Invalid license key" };
      }

      const rows = await sqliteJson(localDbPath, `
        SELECT license_key, license_type, activations_allowed, status, revoked_at
        FROM licenses
        WHERE license_key = ${sqlString(licenseKey)}
        LIMIT 1;
      `);
      const license = rows[0];

      if (!license) {
        return { success: false, code: "INVALID_LICENSE", message: "Invalid license key" };
      }
      if (license.status === "revoked" || license.revoked_at) {
        return { success: false, code: "REVOKED_LICENSE", message: "License revoked" };
      }
      if (license.status !== "active") {
        return { success: false, code: "INVALID_LICENSE", message: "Invalid license key" };
      }

      const existing = await sqliteJson(localDbPath, `
        SELECT id FROM activations WHERE license_key = ${sqlString(licenseKey)} AND device_id = ${sqlString(device)} LIMIT 1;
      `);

      if (endpoint === "/validate" && existing.length === 0) {
        return { success: false, code: "INVALID_LICENSE", message: "This device is not activated" };
      }

      if (existing.length > 0) {
        await sqliteExec(localDbPath, `
          UPDATE activations SET last_seen_at = datetime('now') WHERE license_key = ${sqlString(licenseKey)} AND device_id = ${sqlString(device)};
        `);
        const used = await localActivationCount(licenseKey);
        return endpoint === "/validate"
          ? { success: true, licenseType: license.license_type || "lifetime", status: "active", activationsAllowed: numberValue(license.activations_allowed), activationsUsed: used }
          : localSuccess(license, used, "Harmonia activated");
      }

      const used = await localActivationCount(licenseKey);
      const allowed = numberValue(license.activations_allowed);
      if (used >= allowed) {
        return { success: false, code: "ACTIVATION_LIMIT_REACHED", message: "Activation limit reached" };
      }

      await sqliteExec(localDbPath, `
        INSERT INTO activations (license_key, device_id, device_name, platform, app_version, activated_at, last_seen_at)
        VALUES (${sqlString(licenseKey)}, ${sqlString(device)}, ${sqlString(payload.deviceName)}, ${sqlString(payload.platform)}, ${sqlString(payload.appVersion)}, datetime('now'), datetime('now'));
        UPDATE licenses SET activations_used = (SELECT COUNT(*) FROM activations WHERE license_key = ${sqlString(licenseKey)}) WHERE license_key = ${sqlString(licenseKey)};
      `);

      return localSuccess(license, used + 1, "Harmonia activated");
    } catch {
      return { success: false, code: "SERVER_ERROR", message: "Server unavailable" };
    }
  }

  async function localActivationCount(licenseKey) {
    const rows = await sqliteJson(localDbPath, `
      SELECT COUNT(*) AS count FROM activations WHERE license_key = ${sqlString(licenseKey)};
    `);
    return numberValue(rows[0]?.count);
  }

  function localSuccess(license, used, message) {
    return {
      success: true,
      licenseType: license.license_type || "lifetime",
      activationsAllowed: numberValue(license.activations_allowed),
      activationsUsed: used,
      token: crypto.randomBytes(32).toString("base64url"),
      message
    };
  }

  async function activateLicense(inputLicenseKey) {
    const licenseKey = normalizeLicenseKey(inputLicenseKey);
    const cache = await readCache();

    if (!licenseKey) {
      return errorState("INVALID_LICENSE", "Invalid license key", cache);
    }

    const requestPayload = {
      licenseKey,
      deviceId: getDeviceId(),
      deviceName: `${platformName()} device`,
      platform: process.platform,
      appVersion
    };
    let response = await postJson("/activate", requestPayload);
    if (response.code === "SERVER_ERROR") {
      response = await localActivationRequest("/activate", requestPayload);
    }

    if (!response.success) {
      return errorState(response.code || "SERVER_ERROR", response.message || "Server unavailable", cache);
    }

    const now = new Date().toISOString();
    const nextCache = {
      licenseKey,
      token: String(response.token || ""),
      activatedAt: cache?.licenseKey === licenseKey && cache?.activatedAt ? cache.activatedAt : now,
      lastValidatedAt: now,
      licenseType: String(response.licenseType || "lifetime"),
      activationsAllowed: numberValue(response.activationsAllowed),
      activationsUsed: numberValue(response.activationsUsed)
    };

    await writeCache(nextCache);
    return successState(response, nextCache);
  }

  async function validateLicense() {
    const cache = await readCache();

    if (!cache?.licenseKey) {
      return errorState("INVALID_LICENSE", "No license activated", null);
    }

    const requestPayload = {
      licenseKey: cache.licenseKey,
      deviceId: getDeviceId()
    };
    let response = await postJson("/validate", requestPayload);
    if (response.code === "SERVER_ERROR") {
      response = await localActivationRequest("/validate", requestPayload);
    }

    if (response.success) {
      const nextCache = {
        ...cache,
        lastValidatedAt: new Date().toISOString(),
        licenseType: String(response.licenseType || cache.licenseType || "lifetime"),
        activationsAllowed: numberValue(response.activationsAllowed ?? cache.activationsAllowed),
        activationsUsed: numberValue(response.activationsUsed ?? cache.activationsUsed)
      };
      await writeCache(nextCache);
      return successState(response, nextCache);
    }

    if (response.code === "SERVER_ERROR" && isGraceActive(cache)) {
      return successState({
        success: true,
        licenseType: cache.licenseType || "lifetime",
        status: "active",
        message: "Offline grace period active"
      }, cache, { offline: true });
    }

    if (response.code === "INVALID_LICENSE" || response.code === "REVOKED_LICENSE") {
      await clearCache();
      return errorState(response.code, response.message || "License is not active", null);
    }

    return errorState(response.code || "SERVER_ERROR", response.message || "Server unavailable", cache);
  }

  async function getLicenseState() {
    const cache = await readCache();
    return publicState(cache);
  }

  return {
    activateLicense,
    validateLicense,
    getLicenseState
  };
}

module.exports = {
  createLicenseManager
};
