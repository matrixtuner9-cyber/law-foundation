var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/index.js
import crypto4 from "node:crypto";

// src/office.js
import { DurableObject } from "cloudflare:workers";
import crypto3 from "node:crypto";

// src/store.js
import crypto from "node:crypto";
var COLL = ["clients", "opponents", "cases", "hearings", "deadlines", "docs"];
var SCHEMA = `
  CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT, updated_by TEXT, PRIMARY KEY(kind, id));
  CREATE TABLE IF NOT EXISTS kv(key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, client TEXT, at TEXT, data TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS messages_client ON messages(client);
  CREATE TABLE IF NOT EXISTS users(
    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, role TEXT NOT NULL,
    salt TEXT NOT NULL, hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, failed INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER NOT NULL DEFAULT 0, must_change INTEGER NOT NULL DEFAULT 0, cases TEXT NOT NULL DEFAULT '[]',
    created_at TEXT, last_login TEXT);
  CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created INTEGER, expires INTEGER, ip TEXT, ua TEXT);
  CREATE TABLE IF NOT EXISTS audit(
    seq INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, user_id TEXT, username TEXT, action TEXT NOT NULL,
    entity TEXT, entity_id TEXT, detail TEXT, ip TEXT, prev TEXT NOT NULL, hash TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS audit_action ON audit(action);
  CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
  CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
  CREATE TABLE IF NOT EXISTS throttle(k TEXT PRIMARY KEY, n INTEGER NOT NULL, at INTEGER NOT NULL);
`;
function openStore(ctx) {
  const sql = ctx.storage.sql;
  sql.exec(SCHEMA);
  const all = /* @__PURE__ */ __name((q, ...a) => sql.exec(q, ...a).toArray(), "all");
  const get = /* @__PURE__ */ __name((q, ...a) => all(q, ...a)[0], "get");
  const run = /* @__PURE__ */ __name((q, ...a) => {
    sql.exec(q, ...a);
  }, "run");
  let depth = 0;
  const tx = /* @__PURE__ */ __name((fn) => {
    if (depth) {
      depth++;
      try {
        return fn();
      } finally {
        depth--;
      }
    }
    depth = 1;
    try {
      return ctx.storage.transactionSync(fn);
    } finally {
      depth = 0;
    }
  }, "tx");
  const kv = {
    get(k, d = null) {
      const r = get("SELECT value FROM kv WHERE key = ?", k);
      if (!r) return d;
      try {
        return JSON.parse(r.value);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      run("INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", k, JSON.stringify(v));
    }
  };
  const auditKey = /* @__PURE__ */ __name(() => {
    let k = kv.get("audit_key");
    if (!k) {
      k = crypto.randomBytes(32).toString("hex");
      kv.set("audit_key", k);
    }
    return Buffer.from(k, "hex");
  }, "auditKey");
  const chain = /* @__PURE__ */ __name((prev, e) => crypto.createHmac("sha256", auditKey()).update(prev + "|" + [e.at, e.user_id, e.username, e.action, e.entity, e.entity_id, e.detail, e.ip].map((v) => v ?? "").join("|")).digest("hex"), "chain");
  const recPut = /* @__PURE__ */ __name((kind, id, js, at, by) => run("INSERT INTO records(kind, id, data, updated_at, updated_by) VALUES(?, ?, ?, ?, ?) ON CONFLICT(kind, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by", kind, id, js, at, by), "recPut");
  const api = {
    sql,
    all,
    get,
    run,
    tx,
    kv,
    COLL,
    loadState() {
      if (!get("SELECT COUNT(*) n FROM records").n && !kv.get("state_saved")) return null;
      const st = Object.fromEntries(COLL.map((c) => [c, []]));
      for (const r of all("SELECT kind, data FROM records ORDER BY rowid")) if (st[r.kind]) st[r.kind].push(JSON.parse(r.data));
      st.mzLog = kv.get("mzLog", []);
      return st;
    },
    saveState(prev, next, by, at) {
      const changes = [];
      tx(() => {
        for (const kind of COLL) {
          const before = new Map((prev && prev[kind] || []).map((x) => [String(x.id), x]));
          const list = (next[kind] || []).filter((x) => x && typeof x === "object");
          const seen = new Set(list.filter((x) => x.id != null).map((x) => String(x.id)));
          for (const x of list) if (x.id == null) {
            let id = "a" + crypto.createHash("sha1").update(kind + JSON.stringify(x)).digest("hex").slice(0, 10), n = 1;
            while (seen.has(id)) id = id.replace(/-\d+$/, "") + "-" + ++n;
            x.id = id;
            seen.add(id);
          }
          const after = new Map(list.map((x) => [String(x.id), x]));
          for (const [id, rec] of after) {
            const old = before.get(id), js = JSON.stringify(rec);
            if (!old) {
              recPut(kind, id, js, at, by);
              changes.push({ op: "create", kind, id, rec });
            } else if (JSON.stringify(old) !== js) {
              recPut(kind, id, js, at, by);
              changes.push({ op: "update", kind, id, rec, fields: diffFields(old, rec) });
            }
          }
          for (const [id, rec] of before) if (!after.has(id)) {
            run("DELETE FROM records WHERE kind = ? AND id = ?", kind, id);
            changes.push({ op: "delete", kind, id, rec });
          }
        }
        kv.set("mzLog", next.mzLog || []);
        kv.set("state_saved", true);
      });
      return changes;
    },
    putRecord(kind, rec, by, at) {
      recPut(kind, String(rec.id), JSON.stringify(rec), at, by);
      kv.set("state_saved", true);
    },
    resetState() {
      tx(() => {
        run("DELETE FROM records");
        kv.set("state_saved", false);
        kv.set("mzLog", []);
      });
    },
    loadMessages() {
      return all("SELECT data FROM messages ORDER BY at, rowid").map((r) => JSON.parse(r.data));
    },
    putMessage(m) {
      run("INSERT INTO messages(id, client, at, data) VALUES(?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data", m.id, m.client, m.at || "", JSON.stringify(m));
    },
    putMessages(list) {
      tx(() => list.forEach(api.putMessage));
    },
    audit(e) {
      const row = { at: e.at, user_id: e.user_id || null, username: e.username || null, action: e.action, entity: e.entity || null, entity_id: e.entity_id != null ? String(e.entity_id) : null, detail: e.detail == null ? null : JSON.stringify(e.detail), ip: e.ip || null };
      const prev = (get("SELECT hash FROM audit ORDER BY seq DESC LIMIT 1") || {}).hash || "GENESIS";
      run(
        "INSERT INTO audit(at, user_id, username, action, entity, entity_id, detail, ip, prev, hash) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        row.at,
        row.user_id,
        row.username,
        row.action,
        row.entity,
        row.entity_id,
        row.detail,
        row.ip,
        prev,
        chain(prev, row)
      );
    },
    auditList({ limit = 200, before = null, action = "", user = "", text = "" } = {}) {
      const w = [], a = [];
      if (before) {
        w.push("seq < ?");
        a.push(+before);
      }
      if (action) {
        w.push("action LIKE ?");
        a.push(action + "%");
      }
      if (user) {
        w.push("username = ?");
        a.push(user);
      }
      if (text) {
        w.push("(detail LIKE ? OR entity_id LIKE ?)");
        a.push("%" + text + "%", "%" + text + "%");
      }
      const q = `SELECT seq, at, user_id, username, action, entity, entity_id, detail, ip, hash FROM audit ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY seq DESC LIMIT ${Math.min(500, Math.max(1, +limit || 200))}`;
      return all(q, ...a).map((r) => ({ ...r, detail: r.detail ? JSON.parse(r.detail) : null }));
    },
    auditVerify() {
      let prev = "GENESIS", n = 0;
      for (const r of sql.exec("SELECT * FROM audit ORDER BY seq")) {
        if (r.prev !== prev || chain(prev, r) !== r.hash) return { ok: false, n, brokenAt: r.seq, at: r.at };
        prev = r.hash;
        n++;
      }
      return { ok: true, n };
    },
    /* حماية من التخمين: عدّاد لكل مفتاح (عنوان IP + نوع العملية) داخل نافذة زمنية */
    hit(key, max, windowMs) {
      const now = Date.now(), r = get("SELECT n, at FROM throttle WHERE k = ?", key);
      const n = r && now - r.at < windowMs ? r.n + 1 : 1, at = r && now - r.at < windowMs ? r.at : now;
      run("INSERT INTO throttle(k, n, at) VALUES(?, ?, ?) ON CONFLICT(k) DO UPDATE SET n = excluded.n, at = excluded.at", key, n, at);
      if (Math.random() < 0.02) run("DELETE FROM throttle WHERE at < ?", now - 24 * 36e5);
      return n > max;
    },
    blocked(key, max, windowMs) {
      const r = get("SELECT n, at FROM throttle WHERE k = ?", key);
      return !!r && Date.now() - r.at < windowMs && r.n >= max;
    }
  };
  return api;
}
__name(openStore, "openStore");
function diffFields(a, b) {
  const keys = /* @__PURE__ */ new Set([...Object.keys(a || {}), ...Object.keys(b || {})]), out = [];
  const short = /* @__PURE__ */ __name((v) => {
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return s == null ? "" : s.length > 80 ? s.slice(0, 77) + "\u2026" : s;
  }, "short");
  for (const k of keys) if (JSON.stringify((a || {})[k]) !== JSON.stringify((b || {})[k])) out.push({ f: k, from: short((a || {})[k]), to: short((b || {})[k]) });
  return out.slice(0, 20);
}
__name(diffFields, "diffFields");

// src/auth.js
import crypto2 from "node:crypto";
var ROLES = {
  admin: { label: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645", write: true, all: true, manage: true },
  lawyer: { label: "\u0645\u062D\u0627\u0645\u064D", write: true, all: true, manage: false },
  external: { label: "\u0645\u062D\u0627\u0645\u064D \u062E\u0627\u0631\u062C\u064A", write: false, all: false, manage: false },
  viewer: { label: "\u0645\u0637\u0651\u0644\u0639", write: false, all: true, manage: false }
};
var SESSION_MS = 12 * 36e5;
var LOCK_AFTER = 5;
var LOCK_MS = 15 * 6e4;
var COOKIE = "mq_s";
var hashPw = /* @__PURE__ */ __name((pw, salt) => crypto2.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex"), "hashPw");
var tokenHash = /* @__PURE__ */ __name((t) => crypto2.createHash("sha256").update(t).digest("hex"), "tokenHash");
var rid = /* @__PURE__ */ __name(() => crypto2.randomBytes(8).toString("hex"), "rid");
var same = /* @__PURE__ */ __name((a, b) => {
  const x = Buffer.from(a, "hex"), y = Buffer.from(b, "hex");
  return x.length === y.length && crypto2.timingSafeEqual(x, y);
}, "same");
function pwProblem(pw) {
  pw = String(pw || "");
  if (pw.length < 8) return "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0644\u0627 \u062A\u0642\u0644 \u0639\u0646 8 \u0623\u062D\u0631\u0641.";
  if (!/\d/.test(pw) || !/\D/.test(pw)) return "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u062D\u062A\u0648\u064A \u0623\u0631\u0642\u0627\u0645\u0627\u064B \u0648\u062D\u0631\u0648\u0641\u0627\u064B.";
  return null;
}
__name(pwProblem, "pwProblem");
function parseCookies(h) {
  const out = {};
  String(h || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) {
      try {
        out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
      } catch (e) {
      }
    }
  });
  return out;
}
__name(parseCookies, "parseCookies");
function createAuth(store) {
  const { get, all, run } = store;
  const byName = /* @__PURE__ */ __name((n) => get("SELECT * FROM users WHERE username = ?", n), "byName");
  const byId = /* @__PURE__ */ __name((id) => get("SELECT * FROM users WHERE id = ?", id), "byId");
  const pub = /* @__PURE__ */ __name((u) => u && { id: u.id, username: u.username, name: u.name, role: u.role, roleLabel: (ROLES[u.role] || {}).label, active: !!u.active, mustChange: !!u.must_change, cases: JSON.parse(u.cases || "[]"), lastLogin: u.last_login, createdAt: u.created_at, locked: u.locked_until > Date.now() }, "pub");
  const A = {
    ROLES,
    COOKIE,
    pub,
    hasUsers: /* @__PURE__ */ __name(() => get("SELECT COUNT(*) n FROM users").n > 0, "hasUsers"),
    list: /* @__PURE__ */ __name(() => all("SELECT * FROM users ORDER BY created_at").map(pub), "list"),
    get: /* @__PURE__ */ __name((id) => pub(byId(id)), "get"),
    createUser({ username, name, role, password, cases = [], mustChange = false }, at) {
      username = String(username || "").trim();
      if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) throw new Error("\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645: 3\u201332 \u062D\u0631\u0641\u0627\u064B \u0644\u0627\u062A\u064A\u0646\u064A\u0627\u064B \u0623\u0648 \u0623\u0631\u0642\u0627\u0645\u0627\u064B \u0623\u0648 . _ -");
      if (!String(name || "").trim()) throw new Error("\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628.");
      if (!ROLES[role]) throw new Error("\u062F\u0648\u0631 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641.");
      const p = pwProblem(password);
      if (p) throw new Error(p);
      if (byName(username)) throw new Error("\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0646 \u0642\u0628\u0644.");
      const id = "u" + rid(), salt = rid() + rid();
      run(
        "INSERT INTO users(id, username, name, role, salt, hash, active, must_change, cases, created_at) VALUES(?, ?, ?, ?, ?, ?, 1, ?, ?, ?)",
        id,
        username,
        String(name).trim().slice(0, 80),
        role,
        salt,
        hashPw(password, salt),
        mustChange ? 1 : 0,
        JSON.stringify(cases),
        at
      );
      return pub(byId(id));
    },
    updateUser(id, { name, role, active, cases }, actorId) {
      const u = byId(id);
      if (!u) throw new Error("\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.");
      const next = { name: name != null ? String(name).trim().slice(0, 80) : u.name, role: role || u.role, active: active == null ? u.active : active ? 1 : 0, cases: cases ? JSON.stringify(cases) : u.cases };
      if (!ROLES[next.role]) throw new Error("\u062F\u0648\u0631 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641.");
      if (id === actorId && (next.role !== "admin" || !next.active)) throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0625\u0644\u063A\u0627\u0621 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0623\u0648 \u062A\u0639\u0637\u064A\u0644 \u062D\u0633\u0627\u0628\u0643 \u0628\u0646\u0641\u0633\u0643.");
      if (u.role === "admin" && (next.role !== "admin" || !next.active)) {
        const admins = all("SELECT id FROM users WHERE role = ? AND active = 1 AND id <> ?", "admin", id).length;
        if (!admins) throw new Error("\u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u0642\u0649 \u0645\u062F\u064A\u0631 \u0646\u0638\u0627\u0645 \u0648\u0627\u062D\u062F \u0641\u0639\u0651\u0627\u0644 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.");
      }
      run("UPDATE users SET name = ?, role = ?, active = ?, cases = ? WHERE id = ?", next.name, next.role, next.active, next.cases, id);
      if (!next.active || next.role !== u.role) run("DELETE FROM sessions WHERE user_id = ?", id);
      return { before: pub(u), after: pub(byId(id)) };
    },
    setPassword(id, password, mustChange = false) {
      const p = pwProblem(password);
      if (p) throw new Error(p);
      const salt = rid() + rid();
      run("UPDATE users SET salt = ?, hash = ?, must_change = ? WHERE id = ?", salt, hashPw(password, salt), mustChange ? 1 : 0, id);
    },
    checkPassword(id, password) {
      const u = byId(id);
      return !!u && same(hashPw(password, u.salt), u.hash);
    },
    login(username, password, ip, ua, at) {
      const u = byName(String(username || "").trim());
      if (!u) {
        hashPw(password, "x".repeat(32));
        return { error: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629." };
      }
      if (!u.active) return { error: "\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0639\u0637\u0651\u0644. \u0631\u0627\u062C\u0639 \u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645.", user: u };
      if (u.locked_until > Date.now()) return { error: `\u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0642\u0641\u0644 \u0645\u0624\u0642\u062A\u0627\u064B \u0628\u0639\u062F \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u062E\u0627\u0637\u0626\u0629 \u0645\u062A\u0643\u0631\u0631\u0629. \u062D\u0627\u0648\u0644 \u0628\u0639\u062F ${Math.ceil((u.locked_until - Date.now()) / 6e4)} \u062F\u0642\u064A\u0642\u0629.`, user: u, locked: true };
      if (!same(hashPw(password, u.salt), u.hash)) {
        const f = u.failed + 1, lock = f >= LOCK_AFTER ? Date.now() + LOCK_MS : 0;
        run("UPDATE users SET failed = ?, locked_until = ? WHERE id = ?", lock ? 0 : f, lock, u.id);
        return { error: lock ? "\u0623\u064F\u0642\u0641\u0644 \u0627\u0644\u062D\u0633\u0627\u0628 15 \u062F\u0642\u064A\u0642\u0629 \u0628\u0639\u062F 5 \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u062E\u0627\u0637\u0626\u0629." : "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629.", user: u, locked: !!lock };
      }
      run("UPDATE users SET failed = 0, locked_until = 0, last_login = ? WHERE id = ?", at, u.id);
      const token = crypto2.randomBytes(32).toString("base64url");
      run("INSERT INTO sessions(token, user_id, created, expires, ip, ua) VALUES(?, ?, ?, ?, ?, ?)", tokenHash(token), u.id, Date.now(), Date.now() + SESSION_MS, ip || null, String(ua || "").slice(0, 200));
      run("DELETE FROM sessions WHERE expires < ?", Date.now());
      return { user: pub(byId(u.id)), token };
    },
    logout(token) {
      if (token) run("DELETE FROM sessions WHERE token = ?", tokenHash(token));
    },
    logoutUser(id) {
      run("DELETE FROM sessions WHERE user_id = ?", id);
    },
    fromReq(req) {
      const t = parseCookies(req.headers.get("cookie"))[COOKIE];
      if (!t) return null;
      const s = get("SELECT * FROM sessions WHERE token = ?", tokenHash(t));
      if (!s || s.expires < Date.now()) return null;
      const u = byId(s.user_id);
      if (!u || !u.active) return null;
      if (s.expires - Date.now() < SESSION_MS / 2) run("UPDATE sessions SET expires = ? WHERE token = ?", Date.now() + SESSION_MS, s.token);
      return { ...pub(u), token: t };
    },
    cookie(token, secure) {
      return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1e3}${secure ? "; Secure" : ""}`;
    },
    clearCookie(secure) {
      return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
    },
    can: /* @__PURE__ */ __name((u, what) => !!(u && ROLES[u.role] && ROLES[u.role][what]), "can")
  };
  return A;
}
__name(createAuth, "createAuth");

// src/seed.js
var courts = [
  { id: "ct1", name: "\u0645\u062D\u0643\u0645\u0629 \u0635\u0644\u062D \u0646\u0627\u0628\u0644\u0633", type: "\u0635\u0644\u062D", city: "\u0646\u0627\u0628\u0644\u0633" },
  { id: "ct2", name: "\u0645\u062D\u0643\u0645\u0629 \u0628\u062F\u0627\u064A\u0629 \u0646\u0627\u0628\u0644\u0633", type: "\u0628\u062F\u0627\u064A\u0629", city: "\u0646\u0627\u0628\u0644\u0633" },
  { id: "ct5", name: "\u0645\u062D\u0643\u0645\u0629 \u0635\u0644\u062D \u0631\u0627\u0645 \u0627\u0644\u0644\u0647", type: "\u0635\u0644\u062D", city: "\u0631\u0627\u0645 \u0627\u0644\u0644\u0647" },
  { id: "ct6", name: "\u0645\u062D\u0643\u0645\u0629 \u0628\u062F\u0627\u064A\u0629 \u062C\u0646\u064A\u0646", type: "\u0628\u062F\u0627\u064A\u0629", city: "\u062C\u0646\u064A\u0646" },
  { id: "ct3", name: "\u0645\u062D\u0643\u0645\u0629 \u0627\u0633\u062A\u0626\u0646\u0627\u0641 \u0631\u0627\u0645 \u0627\u0644\u0644\u0647", type: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641", city: "\u0631\u0627\u0645 \u0627\u0644\u0644\u0647" },
  { id: "ct4", name: "\u0645\u062D\u0643\u0645\u0629 \u0627\u0644\u0646\u0642\u0636", type: "\u0646\u0642\u0636", city: "\u0631\u0627\u0645 \u0627\u0644\u0644\u0647" },
  { id: "ct7", name: "\u062F\u0627\u0626\u0631\u0629 \u062A\u0646\u0641\u064A\u0630 \u0646\u0627\u0628\u0644\u0633", type: "\u062A\u0646\u0641\u064A\u0630", city: "\u0646\u0627\u0628\u0644\u0633" },
  { id: "ct8", name: "\u0627\u0644\u0645\u062D\u0643\u0645\u0629 \u0627\u0644\u0634\u0631\u0639\u064A\u0629 \u0641\u064A \u0646\u0627\u0628\u0644\u0633", type: "\u0634\u0631\u0639\u064A\u0629", city: "\u0646\u0627\u0628\u0644\u0633" }
];
var STEPS = ["\u0627\u0644\u062A\u0633\u062C\u064A\u0644", "\u062A\u0628\u0627\u062F\u0644 \u0627\u0644\u0644\u0648\u0627\u0626\u062D", "\u0627\u0644\u0628\u064A\u0646\u0627\u062A", "\u0627\u0644\u0645\u0631\u0627\u0641\u0639\u0629", "\u0627\u0644\u062D\u0643\u0645", "\u0627\u0644\u062A\u0646\u0641\u064A\u0630"];

// src/office.js
var rid2 = /* @__PURE__ */ __name(() => crypto3.randomBytes(6).toString("hex"), "rid");
var local = /* @__PURE__ */ __name((d = /* @__PURE__ */ new Date()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Hebron", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
  return p;
}, "local");
var stamp = /* @__PURE__ */ __name((d = /* @__PURE__ */ new Date()) => {
  const p = local(d);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}, "stamp");
var stampS = /* @__PURE__ */ __name((d = /* @__PURE__ */ new Date()) => stamp(d) + ":" + local(d).second, "stampS");
var EMPTY = /* @__PURE__ */ __name(() => ({ clients: [], opponents: [], cases: [], hearings: [], deadlines: [], docs: [], mzLog: [] }), "EMPTY");
var DEFAULT_RULES = [
  { id: "civ-appeal", name: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641 \u062D\u0643\u0645 \u062D\u0642\u0648\u0642\u064A", nature: "civil", to: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641", from: ["\u0635\u0644\u062D", "\u0628\u062F\u0627\u064A\u0629"], urgent: false, days: 30, start: "judgment", ref: "\u0645205/1 \u0648\u0645193 \u0645\u0646 \u0642\u0627\u0646\u0648\u0646 \u0623\u0635\u0648\u0644 \u0627\u0644\u0645\u062D\u0627\u0643\u0645\u0627\u062A \u0627\u0644\u0645\u062F\u0646\u064A\u0629 \u0648\u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629 \u0631\u0642\u0645 2 \u0644\u0633\u0646\u0629 2001", verified: true },
  { id: "civ-appeal-urgent", name: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641 \u0641\u064A \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0633\u062A\u0639\u062C\u0644\u0629", nature: "civil", to: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641", from: ["\u0635\u0644\u062D", "\u0628\u062F\u0627\u064A\u0629"], urgent: true, days: 15, start: "judgment", ref: "\u0645205/2 \u0645\u0646 \u0642\u0627\u0646\u0648\u0646 \u0623\u0635\u0648\u0644 \u0627\u0644\u0645\u062D\u0627\u0643\u0645\u0627\u062A \u0627\u0644\u0645\u062F\u0646\u064A\u0629 \u0648\u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629", verified: true },
  { id: "civ-cassation", name: "\u0646\u0642\u0636 \u062D\u0643\u0645 \u062D\u0642\u0648\u0642\u064A", nature: "civil", to: "\u0646\u0642\u0636", from: ["\u0627\u0633\u062A\u0626\u0646\u0627\u0641"], urgent: false, days: 40, start: "judgment", ref: "\u0645227 \u0648\u0645193/1 \u0645\u0646 \u0642\u0627\u0646\u0648\u0646 \u0623\u0635\u0648\u0644 \u0627\u0644\u0645\u062D\u0627\u0643\u0645\u0627\u062A \u0627\u0644\u0645\u062F\u0646\u064A\u0629 \u0648\u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629", verified: true },
  { id: "crim-appeal", name: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641 \u062D\u0643\u0645 \u062C\u0632\u0627\u0626\u064A", nature: "criminal", to: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641", from: ["\u0635\u0644\u062D", "\u0628\u062F\u0627\u064A\u0629"], urgent: false, days: 15, start: "judgment", ref: "\u0645328 \u0645\u0646 \u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062C\u0632\u0627\u0626\u064A\u0629 \u0631\u0642\u0645 3 \u0644\u0633\u0646\u0629 2001 \u0627\u0644\u0645\u0639\u062F\u0644\u0629 \u0628\u0627\u0644\u0642\u0631\u0627\u0631 \u0628\u0642\u0627\u0646\u0648\u0646 17 \u0644\u0633\u0646\u0629 2014", verified: true },
  { id: "crim-cassation", name: "\u0646\u0642\u0636 \u062D\u0643\u0645 \u062C\u0632\u0627\u0626\u064A", nature: "criminal", to: "\u0646\u0642\u0636", from: ["\u0627\u0633\u062A\u0626\u0646\u0627\u0641"], urgent: false, days: 40, start: "judgment", ref: "\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062C\u0632\u0627\u0626\u064A\u0629 \u0631\u0642\u0645 3 \u0644\u0633\u0646\u0629 2001 (\u064A\u062D\u062A\u0627\u062C \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0645\u0627\u062F\u0629 \u0648\u0627\u0644\u0645\u062F\u0629)", verified: false }
];
var TYPES = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json; charset=utf-8", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", heic: "image/heic", svg: "image/svg+xml", pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", txt: "text/plain; charset=utf-8", rtf: "application/rtf", odt: "application/vnd.oasis.opendocument.text", webm: "audio/webm", ogg: "audio/ogg", m4a: "audio/mp4", mp4: "audio/mp4", aac: "audio/aac", wav: "audio/wav", mp3: "audio/mpeg" };
var FILE_EXT = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heic", "image/gif": "gif", "application/pdf": "pdf", "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx", "application/vnd.ms-excel": "xls", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx", "text/plain": "txt" };
var EXT_OK = /* @__PURE__ */ new Set(["jpg", "jpeg", "png", "webp", "heic", "gif", "pdf", "doc", "docx", "xls", "xlsx", "txt", "rtf", "odt"]);
var AUDIO_EXT = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/m4a": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/wav": "wav", "audio/x-wav": "wav", "audio/mpeg": "mp3" };
var CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-client", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
var SEC = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "X-Frame-Options": "SAMEORIGIN" };
var json = /* @__PURE__ */ __name((code, obj, extra = {}) => new Response(JSON.stringify(obj), { status: code, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS, ...SEC, ...extra } }), "json");
var MEDIA_TTL = 7 * 24 * 3600;
var ADMIN_FILES = /* @__PURE__ */ new Set(["index.html", "app.js", "dash.js", "briefcase.js", "sync.js", "mizan-ui.js", "data.js", "admin.js", "phase2.js", "phase2.css", "bar.js", "bar.css", "responsive.js", "responsive.css", "style.css", "dash.css", "briefcase.css", "mizan.css", "admin.css", "prestige.css"]);
var PUBLIC_FILES = /* @__PURE__ */ new Set(["login.html", "login.js", "login.css", "scales.js", "prestige.css"]);
var norm = /* @__PURE__ */ __name((s) => String(s || "").normalize("NFKC").replace(/[ً-ْـ]/g, "").replace(/[أإآٱ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").replace(/ؤ/g, "\u0648").replace(/ئ/g, "\u064A").toLowerCase().replace(/\s+/g, " ").trim(), "norm");
var digits = /* @__PURE__ */ __name((s) => String(s || "").replace(/\D/g, ""), "digits");
var Office = class extends DurableObject {
  static {
    __name(this, "Office");
  }
  constructor(ctx, env2) {
    super(ctx, env2);
    this.store = openStore(ctx);
    this.auth = createAuth(this.store);
    this.state = this.store.loadState();
    this.msgs = this.store.loadMessages();
    this.streams = /* @__PURE__ */ new Map();
    this.enc = new TextEncoder();
    this.ping = null;
  }
  /* ── أدوات ── */
  slug() {
    return this.store.kv.get("slug");
  }
  audit(e) {
    try {
      this.store.audit({ at: stampS(), ...e });
    } catch (err) {
      console.error("[audit]", err.message);
    }
  }
  settings() {
    const s = this.store.kv.get("settings", {});
    return { edition: "office", officeName: "", lawyerName: "", city: "", phone: "", hours: "", ...s };
  }
  officeInfo() {
    const s = this.settings();
    return { name: s.officeName, lawyer: s.lawyerName, city: s.city, phone: s.phone, hours: s.hours };
  }
  rules() {
    const saved = this.store.kv.get("appeal_rules", {});
    return DEFAULT_RULES.map((r) => ({ ...r, ...saved[r.id] || {} }));
  }
  cur() {
    return this.state || EMPTY();
  }
  mediaKey() {
    let k = this.store.kv.get("media_key");
    if (!k) {
      k = crypto3.randomBytes(32).toString("hex");
      this.store.kv.set("media_key", k);
    }
    return k;
  }
  sign(file, exp) {
    return crypto3.createHmac("sha256", this.mediaKey()).update(file + "|" + exp).digest("base64url").slice(0, 32);
  }
  mediaUrl(file) {
    const exp = Math.floor(Date.now() / 1e3 / 3600) * 3600 + MEDIA_TTL;
    return `/api/media/${file}?e=${exp}&s=${this.sign(file, exp)}`;
  }
  pub(m) {
    const { by, ...rest } = m;
    return { ...rest, file: m.file ? this.mediaUrl(m.file) : null };
  }
  // لا تُكشف أسماء مستخدمي المكتب للموكل
  pubAdmin(m) {
    return { ...m, file: m.file ? this.mediaUrl(m.file) : null };
  }
  labelOf(r) {
    return r && (r.name || r.no || r.title || r.purpose || r.subject || r.id);
  }
  canSeeClient(u, cid) {
    return this.auth.can(u, "all") || this.cur().cases.some((k) => k.client === cid && (u.cases || []).includes(k.id));
  }
  scope(u, S) {
    if (this.auth.can(u, "all")) return S;
    const ids = new Set(u.cases || []), cases = S.cases.filter((k) => ids.has(k.id));
    const cl = new Set(cases.map((k) => k.client)), op = new Set(cases.flatMap((k) => k.opps || []));
    return {
      clients: S.clients.filter((c) => cl.has(c.id)),
      opponents: S.opponents.filter((o) => op.has(o.id)),
      cases,
      hearings: S.hearings.filter((h) => ids.has(h.k)),
      deadlines: S.deadlines.filter((d) => ids.has(d.k)),
      docs: S.docs.filter((d) => ids.has(d.k)),
      mzLog: (S.mzLog || []).filter((l) => ids.has(l.k))
    };
  }
  /* ── البث المباشر لشاشة المكتب (SSE) ── */
  broadcast(type, payload) {
    const s = this.enc.encode(`event: ${type}
data: ${JSON.stringify(payload)}

`);
    for (const [w, u] of this.streams) {
      if (type === "mizan" && u.role !== "admin") continue;
      if (payload && payload.client && !this.canSeeClient(u, payload.client)) continue;
      w.write(s).catch(() => this.streams.delete(w));
    }
  }
  openStream(me) {
    const { readable, writable } = new TransformStream(), w = writable.getWriter();
    w.write(this.enc.encode("retry: 3000\n\n")).catch(() => {
    });
    this.streams.set(w, me);
    if (!this.ping) this.ping = setInterval(() => {
      if (!this.streams.size) {
        clearInterval(this.ping);
        this.ping = null;
        return;
      }
      const p = this.enc.encode(": ping\n\n");
      for (const [x] of this.streams) x.write(p).catch(() => this.streams.delete(x));
    }, 25e3);
    return new Response(readable, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
  }
  addMsg(m) {
    const msg = { id: rid2(), at: stamp(), read: m.from === "lawyer", seen: m.from === "client", ...m };
    this.msgs.push(msg);
    this.store.putMessage(msg);
    this.broadcast("message", this.pubAdmin(msg));
    return msg;
  }
  /* ── بوابة الموكل ── */
  clientByCode(code) {
    const c = String(code || "").trim().toUpperCase();
    return c ? this.cur().clients.find((x) => (x.code || "").toUpperCase() === c) : null;
  }
  portalHome(cl) {
    const S = this.cur();
    const cases = S.cases.filter((k) => k.client === cl.id).map((k) => {
      const court = courts.find((c) => c.id === k.court);
      const hs = S.hearings.filter((h) => h.k === k.id).sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || "")));
      return {
        id: k.id,
        no: k.no,
        subject: k.subject,
        type: k.type,
        role: k.role,
        stage: k.stage,
        step: k.step,
        status: k.status,
        court: court ? court.name : "",
        opponents: (k.opps || []).map((o) => (S.opponents.find((x) => x.id === o) || {}).name).filter(Boolean),
        hearings: hs.map((h) => ({ date: h.date, time: h.time || "", purpose: h.purpose, result: h.result || null, attend: !!h.attend }))
      };
    });
    const docs = S.docs.filter((d) => d.shared && cases.some((k) => k.id === d.k)).sort((a, b) => String(b.date).localeCompare(String(a.date))).map((d) => ({ title: d.title, kind: d.kind, date: d.date, pages: d.pages, caseNo: (S.cases.find((k) => k.id === d.k) || {}).no }));
    return { client: { id: cl.id, name: cl.name, code: cl.code, type: cl.type, fee: cl.fee, paid: cl.paid, ch: cl.ch, phone: cl.phone || "", phone2: cl.phone2 || "", whatsapp: cl.whatsapp || "" }, office: this.officeInfo(), steps: STEPS, cases, docs };
  }
  ensureState() {
    if (!this.state) {
      this.state = EMPTY();
      this.store.saveState(null, this.state, "system", stampS());
    }
  }
  touchClient(cl) {
    if (!this.state) return;
    const c = this.state.clients.find((x) => x.id === cl.id);
    if (c) {
      c.last = stamp().slice(0, 10);
      this.store.putRecord("clients", c, "portal:" + cl.code, stampS());
    }
  }
  /* ── نقطة الدخول: الطلب يصل من الـ Worker ومعه اسم المكتب ── */
  async fetch(req) {
    const u = new URL(req.url), slug = req.headers.get("x-mq-office");
    if (slug && !this.slug()) this.store.kv.set("slug", slug);
    if (slug && slug !== this.slug()) return new Response("office mismatch", { status: 500 });
    let res;
    try {
      if (u.pathname.startsWith("/_ops/")) res = await this.ops(req, u);
      else if (u.pathname.startsWith("/api/")) res = await this.api(req, u);
      else res = await this.static(req, u);
    } catch (e) {
      console.error(e);
      res = json(500, { error: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
    }
    if (req.body && !req.bodyUsed) await req.arrayBuffer().catch(() => {
    });
    return res;
  }
  async static(req, u) {
    let p;
    try {
      p = decodeURIComponent(u.pathname);
    } catch (e) {
      return new Response("bad", { status: 400 });
    }
    const asset = /* @__PURE__ */ __name((path) => this.env.ASSETS.fetch(new Request(new URL(path, u.origin), { headers: { "accept-encoding": req.headers.get("accept-encoding") || "" } })), "asset");
    const noStore = /* @__PURE__ */ __name(async (r) => {
      const h = new Headers(r.headers);
      h.set("Cache-Control", "no-store");
      Object.entries(SEC).forEach(([k, v]) => h.set(k, v));
      return new Response(r.body, { status: r.status, headers: h });
    }, "noStore");
    if (p === "/portal") return Response.redirect(new URL("/portal/", u.origin).href, 302);
    if (p.startsWith("/portal/")) {
      let r = await asset("/app" + p);
      if (r.status === 404 || p.endsWith("/")) r = await asset("/app/portal/index.html");
      return noStore(r);
    }
    const name = p === "/" ? "index.html" : p.slice(1);
    if (PUBLIC_FILES.has(name)) {
      if (name === "login.html" && this.auth.fromReq(req)) return Response.redirect(new URL("/", u.origin).href, 302);
      return noStore(await asset("/app/" + name));
    }
    if (!ADMIN_FILES.has(name)) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    if (!this.auth.fromReq(req)) {
      if (name.endsWith(".html")) return Response.redirect(new URL("/login.html", u.origin).href, 302);
      return new Response(null, { status: 401 });
    }
    return noStore(await asset("/app/" + name));
  }
  async api(req, u) {
    const p = u.pathname, M = req.method, ip = req.headers.get("cf-connecting-ip") || "127.0.0.1";
    const secure = u.protocol === "https:";
    const jbody = /* @__PURE__ */ __name(async () => {
      try {
        const t = await req.text();
        return t.length > 4 * 1024 * 1024 ? {} : JSON.parse(t || "{}");
      } catch (e) {
        return {};
      }
    }, "jbody");
    if (M === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (p === "/api/health") return json(200, { ok: true, at: stamp() });
    if (p === "/api/portal/push-key") return json(200, { enabled: false, key: null });
    if (p.startsWith("/api/media/")) {
      const file = p.slice(11);
      if (!/^[a-f0-9]{12}\.[a-z0-9]{2,5}$/.test(file)) return new Response("Not found", { status: 404, headers: CORS });
      const e = +u.searchParams.get("e"), s = u.searchParams.get("s") || "";
      const okSig = e > Date.now() / 1e3 && s.length === 32 && crypto3.timingSafeEqual(Buffer.from(s), Buffer.from(this.sign(file, e)));
      if (!okSig) {
        const me2 = this.auth.fromReq(req), m = this.msgs.find((x) => x.file === file);
        if (!me2 || !m || !this.canSeeClient(me2, m.client)) return new Response("Forbidden", { status: 403, headers: CORS });
      }
      return this.media(req, file);
    }
    if (p.startsWith("/api/portal/")) {
      const failKey = "pfail:" + ip;
      if (this.store.blocked(failKey, 20, 15 * 6e4)) return json(429, { error: "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062B\u064A\u0631\u0629. \u062D\u0627\u0648\u0644 \u0628\u0639\u062F \u0642\u0644\u064A\u0644." });
      if (p === "/api/portal/login" && M === "POST") {
        if (this.store.hit("plogin:" + ip, 30, 10 * 6e4)) return json(429, { error: "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062B\u064A\u0631\u0629. \u062D\u0627\u0648\u0644 \u0628\u0639\u062F \u0642\u0644\u064A\u0644." });
        const { code } = await jbody();
        const cl2 = this.clientByCode(code);
        if (!cl2 || !cl2.portal) {
          this.store.hit(failKey, 20, 15 * 6e4);
          return json(401, { error: "\u0631\u0645\u0632 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u063A\u064A\u0631 \u0645\u0641\u0639\u0651\u0644\u0629 \u0644\u062D\u0633\u0627\u0628\u0643. \u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0645\u0643\u062A\u0628." });
        }
        this.touchClient(cl2);
        this.audit({ username: "portal:" + cl2.code, action: "portal.login", entity: "clients", entity_id: cl2.id, detail: { label: cl2.name }, ip });
        return json(200, { ok: true, name: cl2.name, code: cl2.code });
      }
      const cl = this.clientByCode(req.headers.get("x-client") || u.searchParams.get("code"));
      if (!cl || !cl.portal) {
        this.store.hit(failKey, 20, 15 * 6e4);
        return json(401, { error: "\u0627\u0646\u062A\u0647\u062A \u0627\u0644\u062C\u0644\u0633\u0629\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u062C\u062F\u064A\u062F." });
      }
      const who2 = { username: "portal:" + cl.code, ip };
      if (p === "/api/portal/home") return json(200, this.portalHome(cl));
      if (p === "/api/portal/profile" && M === "POST") {
        const b = await jbody(), ok = /* @__PURE__ */ __name((v) => /^[+\d][\d\s-]{5,19}$/.test(v), "ok"), clean = /* @__PURE__ */ __name((v) => String(v || "").trim().slice(0, 20), "clean");
        const upd = { phone: clean(b.phone), phone2: clean(b.phone2), whatsapp: clean(b.whatsapp) };
        if (Object.values(upd).some((v) => v && !ok(v))) return json(400, { error: "\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0623\u0631\u0642\u0627\u0645: \u0623\u0631\u0642\u0627\u0645 \u0641\u0642\u0637\u060C \u0648\u064A\u0645\u0643\u0646 \u0623\u0646 \u062A\u0628\u062F\u0623 \u0628\u0640 +" });
        this.ensureState();
        const c = this.state.clients.find((x) => x.id === cl.id), before = { ...c };
        Object.assign(c, upd);
        this.store.putRecord("clients", c, who2.username, stampS());
        this.audit({ ...who2, action: "record.update", entity: "clients", entity_id: c.id, detail: { label: c.name, fields: diffFields(before, c), via: "portal" } });
        this.broadcast("profile", { client: cl.id, ...upd });
        return json(200, upd);
      }
      if (p === "/api/portal/push-subscribe" && M === "POST") return json(200, { ok: true });
      if (p === "/api/portal/messages" && M === "GET") {
        const changed = [];
        if (!u.searchParams.get("peek")) this.msgs.forEach((m) => {
          if (m.client === cl.id && m.from === "lawyer" && !m.seen) {
            m.seen = true;
            changed.push(m);
          }
        });
        if (changed.length) {
          this.store.putMessages(changed);
          this.broadcast("seen", { client: cl.id });
        }
        return json(200, this.msgs.filter((m) => m.client === cl.id).map((m) => this.pub(m)));
      }
      if (p === "/api/portal/messages" && M === "POST") {
        const { text } = await jbody();
        const t = String(text || "").trim().slice(0, 4e3);
        if (!t) return json(400, { error: "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0641\u0627\u0631\u063A\u0629." });
        const m = this.addMsg({ client: cl.id, from: "client", type: "text", text: t, ch: "\u0627\u0644\u0628\u0648\u0627\u0628\u0629" });
        this.audit({ ...who2, action: "message.receive", entity: "messages", entity_id: m.id, detail: { client: cl.id, label: cl.name, type: "text" } });
        return json(201, this.pub(m));
      }
      if (p === "/api/portal/voice" && M === "POST") return this.voice(req, u, cl.id, "client", who2);
      if (p === "/api/portal/file" && M === "POST") return this.attach(req, u, cl.id, "client", who2);
      return json(404, { error: "not found" });
    }
    const setupOk = /* @__PURE__ */ __name((t) => {
      const s = this.store.kv.get("setup");
      return !!(s && t && s.exp > Date.now() && s.hash === crypto3.createHash("sha256").update(String(t)).digest("hex"));
    }, "setupOk");
    if (p === "/api/auth/status") return json(200, { setup: !this.auth.hasUsers(), local: setupOk(u.searchParams.get("setup")), office: this.settings().officeName, lawyer: this.settings().lawyerName });
    if (p === "/api/auth/setup" && M === "POST") {
      if (this.auth.hasUsers()) return json(409, { error: "\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u0633\u0628\u0642\u0627\u064B." });
      const b = await jbody();
      if (!setupOk(b.setupToken)) return json(403, { error: "\u0631\u0627\u0628\u0637 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0645\u0646\u062A\u0647\u064A. \u0627\u0637\u0644\u0628 \u0631\u0627\u0628\u0637\u0627\u064B \u062C\u062F\u064A\u062F\u0627\u064B \u0645\u0646 \u0645\u0632\u0648\u062F \u0627\u0644\u062E\u062F\u0645\u0629." });
      let user;
      try {
        user = this.auth.createUser({ username: b.username, name: b.name, role: "admin", password: b.password }, stampS());
      } catch (e) {
        return json(400, { error: e.message });
      }
      this.store.kv.set("setup", null);
      this.audit({ user_id: user.id, username: user.username, action: "auth.setup", entity: "users", entity_id: user.id, detail: { label: user.name }, ip });
      const r = this.auth.login(b.username, b.password, ip, req.headers.get("user-agent"), stampS());
      this.audit({ user_id: user.id, username: user.username, action: "auth.login", ip });
      return json(200, { user: r.user }, { "Set-Cookie": this.auth.cookie(r.token, secure) });
    }
    if (p === "/api/auth/login" && M === "POST") {
      if (this.store.hit("login:" + ip, 30, 10 * 6e4)) return json(429, { error: "\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062B\u064A\u0631\u0629 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632. \u062D\u0627\u0648\u0644 \u0628\u0639\u062F 10 \u062F\u0642\u0627\u0626\u0642." });
      const b = await jbody(), r = this.auth.login(b.username, b.password, ip, req.headers.get("user-agent"), stampS());
      if (r.error) {
        this.audit({ user_id: r.user && r.user.id, username: String(b.username || "").slice(0, 40), action: r.locked ? "auth.locked" : "auth.login_failed", ip });
        return json(401, { error: r.error });
      }
      this.audit({ user_id: r.user.id, username: r.user.username, action: "auth.login", ip });
      return json(200, { user: r.user }, { "Set-Cookie": this.auth.cookie(r.token, secure) });
    }
    if (p === "/api/auth/logout" && M === "POST") {
      const me2 = this.auth.fromReq(req);
      if (me2) {
        this.auth.logout(me2.token);
        this.audit({ user_id: me2.id, username: me2.username, action: "auth.logout", ip });
      }
      return json(200, { ok: true }, { "Set-Cookie": this.auth.clearCookie(secure) });
    }
    const me = this.auth.fromReq(req);
    if (!me) return json(401, { error: "\u0627\u0646\u062A\u0647\u062A \u0627\u0644\u062C\u0644\u0633\u0629. \u0633\u062C\u0651\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u062C\u062F\u064A\u062F.", login: true });
    const who = { user_id: me.id, username: me.username, ip };
    const deny = /* @__PURE__ */ __name((what) => this.auth.can(me, what) ? null : json(403, { error: "\u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621." }), "deny");
    let d;
    if (p === "/api/auth/me") return json(200, { user: { ...me, token: void 0 }, roles: Object.fromEntries(Object.entries(this.auth.ROLES).map(([k, v]) => [k, v.label])), settings: this.settings() });
    if (p === "/api/me/password" && M === "POST") {
      const b = await jbody();
      if (!this.auth.checkPassword(me.id, b.current)) return json(400, { error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629." });
      try {
        this.auth.setPassword(me.id, b.password, false);
      } catch (e) {
        return json(400, { error: e.message });
      }
      this.audit({ ...who, action: "user.password_change", entity: "users", entity_id: me.id });
      return json(200, { ok: true });
    }
    if (p === "/api/stream") return this.openStream(me);
    if (p === "/api/settings" && M === "GET") return json(200, this.settings());
    if (p === "/api/settings" && M === "POST") {
      if (d = deny("manage")) return d;
      const b = await jbody(), before = this.settings();
      const t = /* @__PURE__ */ __name((v, dd, n) => String(v == null ? dd : v).trim().slice(0, n) || dd, "t");
      const next = { edition: ["office", "insurance"].includes(b.edition) ? b.edition : before.edition, officeName: t(b.officeName, before.officeName, 120), lawyerName: t(b.lawyerName, before.lawyerName, 80), city: t(b.city, before.city, 40), phone: t(b.phone, before.phone, 30), hours: t(b.hours, before.hours, 80) };
      this.store.kv.set("settings", next);
      this.audit({ ...who, action: "settings.update", detail: { fields: diffFields(before, next) } });
      return json(200, this.settings());
    }
    if (p === "/api/bar" && M === "GET") return json(200, await this.barSearch(u.searchParams));
    if (p === "/api/bar/status") return json(200, { running: false, progress: null, meta: await this.barMeta() });
    if (p === "/api/bar/refresh" && M === "POST") return json(403, { error: "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062F\u0644\u064A\u0644 \u064A\u062A\u0645 \u0645\u0631\u0643\u0632\u064A\u0627\u064B \u0645\u0646 \u0645\u0632\u0648\u062F \u0627\u0644\u062E\u062F\u0645\u0629 \u0644\u0643\u0644 \u0627\u0644\u0645\u0643\u0627\u062A\u0628." });
    if (p === "/api/rules" && M === "GET") return json(200, this.rules());
    if (p === "/api/rules" && M === "POST") {
      if (d = deny("manage")) return d;
      const b = await jbody(), before = this.rules(), saved = this.store.kv.get("appeal_rules", {}), changes = [];
      for (const r of Array.isArray(b) ? b : []) {
        const def = DEFAULT_RULES.find((x) => x.id === r.id);
        if (!def) continue;
        const days = Math.round(+r.days);
        if (!(days >= 1 && days <= 365)) return json(400, { error: "\u0627\u0644\u0645\u062F\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0628\u064A\u0646 1 \u0648365 \u064A\u0648\u0645\u0627\u064B." });
        const next = { days, verified: !!r.verified, ref: String(r.ref || def.ref).slice(0, 200) }, old = before.find((x) => x.id === r.id);
        const f = diffFields({ days: old.days, verified: old.verified, ref: old.ref }, next);
        if (f.length) {
          saved[r.id] = next;
          changes.push({ id: r.id, name: def.name, fields: f });
        }
      }
      this.store.kv.set("appeal_rules", saved);
      changes.forEach((c) => this.audit({ ...who, action: "rules.update", entity: "rules", entity_id: c.id, detail: { label: c.name, fields: c.fields } }));
      return json(200, this.rules());
    }
    if (p === "/api/users" && M === "GET") {
      if (d = deny("manage")) return d;
      return json(200, this.auth.list());
    }
    if (p === "/api/users" && M === "POST") {
      if (d = deny("manage")) return d;
      const b = await jbody();
      let user;
      try {
        user = this.auth.createUser({ username: b.username, name: b.name, role: b.role, password: b.password, cases: Array.isArray(b.cases) ? b.cases : [], mustChange: true }, stampS());
      } catch (e) {
        return json(400, { error: e.message });
      }
      this.audit({ ...who, action: "user.create", entity: "users", entity_id: user.id, detail: { label: user.name, username: user.username, role: user.role, cases: user.cases } });
      return json(201, user);
    }
    const um = /^\/api\/users\/([\w]+)(\/password)?$/.exec(p);
    if (um && M === "POST") {
      if (d = deny("manage")) return d;
      const b = await jbody();
      if (um[2]) {
        try {
          this.auth.setPassword(um[1], b.password, true);
          this.auth.logoutUser(um[1]);
        } catch (e) {
          return json(400, { error: e.message });
        }
        this.audit({ ...who, action: "user.password_reset", entity: "users", entity_id: um[1], detail: { label: (this.auth.get(um[1]) || {}).name } });
        return json(200, { ok: true });
      }
      let r;
      try {
        r = this.auth.updateUser(um[1], { name: b.name, role: b.role, active: b.active, cases: Array.isArray(b.cases) ? b.cases : null }, me.id);
      } catch (e) {
        return json(400, { error: e.message });
      }
      const strip = /* @__PURE__ */ __name((x) => ({ name: x.name, role: x.role, active: x.active, cases: x.cases }), "strip");
      this.audit({ ...who, action: "user.update", entity: "users", entity_id: um[1], detail: { label: r.after.name, fields: diffFields(strip(r.before), strip(r.after)) } });
      return json(200, r.after);
    }
    if (p === "/api/audit") {
      if (d = deny("manage")) return d;
      const s = u.searchParams;
      return json(200, this.store.auditList({ limit: s.get("limit"), before: s.get("before"), action: s.get("action") || "", user: s.get("user") || "", text: s.get("q") || "" }));
    }
    if (p === "/api/audit/verify") {
      if (d = deny("manage")) return d;
      return json(200, this.store.auditVerify());
    }
    if (p.startsWith("/api/mizan/")) {
      if (d = deny("manage")) return d;
      if (p === "/api/mizan/status") return json(200, { configured: false, cred: null, running: false, last: null, captures: 0, agent: true });
      return json(403, { error: "\u0627\u0644\u0631\u0628\u0637 \u0645\u0639 \u0645\u064A\u0632\u0627\u0646 \u064A\u0639\u0645\u0644 \u0645\u0646 \xAB\u0648\u0643\u064A\u0644 \u0627\u0644\u0645\u0643\u062A\u0628\xBB \u0639\u0644\u0649 \u062C\u0647\u0627\u0632 \u0627\u0644\u0645\u0643\u062A\u0628\u060C \u0648\u064A\u064F\u0641\u0639\u0651\u0644 \u0641\u064A \u0645\u0631\u062D\u0644\u0629 \u0644\u0627\u062D\u0642\u0629." });
    }
    if (p === "/api/admin/bootstrap") {
      const st = this.auth.can(me, "all") ? this.state : this.scope(me, this.cur());
      return json(200, { state: st, messages: this.msgs.filter((m) => this.canSeeClient(me, m.client)).map((m) => this.pubAdmin(m)), push: {}, pushReady: false, user: { ...me, token: void 0 }, settings: this.settings() });
    }
    if (p === "/api/admin/state" && M === "POST") {
      if (d = deny("write")) return d;
      const b = await jbody();
      if (!Array.isArray(b.clients) || !Array.isArray(b.cases)) return json(400, { error: "bad state" });
      const next = { clients: b.clients, opponents: b.opponents || [], cases: b.cases, hearings: b.hearings || [], deadlines: b.deadlines || [], docs: b.docs || [], mzLog: b.mzLog || [] };
      const first = !this.state, at = stampS();
      const changes = this.store.saveState(this.state, next, me.username, at);
      this.state = next;
      if (first) this.audit({ ...who, action: "state.init", detail: { records: changes.length } });
      else changes.forEach((c) => this.audit({ ...who, action: "record." + c.op, entity: c.kind, entity_id: c.id, detail: { label: this.labelOf(c.rec), ...c.fields ? { fields: c.fields } : {} } }));
      return json(200, { ok: true, changed: changes.length });
    }
    if (p === "/api/admin/messages" && M === "POST") {
      if (d = deny("write")) return d;
      const { client, text, ch, type } = await jbody();
      const t = String(text || "").trim().slice(0, 4e3);
      if (!client || !t) return json(400, { error: "missing" });
      const m = this.addMsg({ client, from: "lawyer", type: type === "notice" ? "notice" : "text", text: t, ch: ch || "\u0627\u0644\u0628\u0648\u0627\u0628\u0629", by: me.username });
      this.audit({ ...who, action: "message.send", entity: "messages", entity_id: m.id, detail: { client, label: (this.cur().clients.find((c) => c.id === client) || {}).name, type: m.type, preview: t.slice(0, 80) } });
      return json(201, this.pubAdmin(m));
    }
    if (p === "/api/admin/voice" && M === "POST") {
      if (d = deny("write")) return d;
      return this.voice(req, u, u.searchParams.get("client"), "lawyer", who);
    }
    if (p === "/api/admin/file" && M === "POST") {
      if (d = deny("write")) return d;
      return this.attach(req, u, u.searchParams.get("client"), "lawyer", who);
    }
    if (p === "/api/admin/read" && M === "POST") {
      const { client } = await jbody();
      if (!this.canSeeClient(me, client)) return json(403, { error: "\u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0643\u0644." });
      const changed = [];
      this.msgs.forEach((m) => {
        if (m.client === client && m.from === "client" && !m.read) {
          m.read = true;
          changed.push(m);
        }
      });
      if (changed.length) {
        this.store.putMessages(changed);
        this.broadcast("read", { client });
      }
      return json(200, { ok: true, n: changed.length });
    }
    if (p === "/api/admin/reset" && M === "POST") {
      if (d = deny("manage")) return d;
      this.state = EMPTY();
      this.store.resetState();
      this.store.saveState(null, this.state, me.username, stampS());
      this.audit({ ...who, action: "state.reset" });
      return json(200, { ok: true });
    }
    return json(404, { error: "not found" });
  }
  /* ── الملفات (R2): كل مكتب في مجلد خاص ── */
  async readBody(req, limit) {
    const n = +req.headers.get("content-length") || 0;
    if (n > limit) throw new Error("too large");
    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length > limit) throw new Error("too large");
    return buf;
  }
  async media(req, file) {
    const key = this.slug() + "/" + file, ext = file.split(".").pop(), type = TYPES[ext] || "application/octet-stream";
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
    if (range) {
      const head = await this.env.MEDIA.head(key);
      if (!head) return new Response("Not found", { status: 404, headers: CORS });
      const size = head.size, start = range[1] ? +range[1] : 0, end = range[2] ? Math.min(+range[2], size - 1) : size - 1;
      const obj2 = await this.env.MEDIA.get(key, { range: { offset: start, length: end - start + 1 } });
      return new Response(obj2.body, { status: 206, headers: { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": String(end - start + 1), "Cache-Control": "private, no-store", ...CORS } });
    }
    const obj = await this.env.MEDIA.get(key);
    if (!obj) return new Response("Not found", { status: 404, headers: CORS });
    return new Response(obj.body, { headers: { "Content-Type": type, "Content-Length": String(obj.size), "Accept-Ranges": "bytes", "Cache-Control": "private, no-store", ...CORS, ...SEC } });
  }
  async voice(req, u, client, from, who) {
    if (!client) return json(400, { error: "missing client" });
    const type = String(req.headers.get("content-type") || "audio/webm").split(";")[0].trim().toLowerCase();
    const ext = AUDIO_EXT[type];
    if (!ext) return json(415, { error: "\u0635\u064A\u063A\u0629 \u0627\u0644\u0635\u0648\u062A \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645\u0629: " + type });
    let buf;
    try {
      buf = await this.readBody(req, 15 * 1024 * 1024);
    } catch (e) {
      return json(413, { error: "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0645\u0633\u0645\u0648\u062D (15 \u0645\u064A\u063A\u0627\u0628\u0627\u064A\u062A)." });
    }
    if (buf.length < 200) return json(400, { error: "\u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0642\u0635\u064A\u0631 \u062C\u062F\u0627\u064B." });
    const id = rid2(), file = `${id}.${ext}`;
    await this.env.MEDIA.put(this.slug() + "/" + file, buf, { httpMetadata: { contentType: type } });
    const dur = Math.max(1, Math.round(+u.searchParams.get("dur") || 0));
    const m = this.addMsg({ id, client, from, type: "voice", file, dur, ch: "\u0627\u0644\u0628\u0648\u0627\u0628\u0629", text: "", ...from === "lawyer" ? { by: who.username } : {} });
    this.audit({ ...who, action: from === "lawyer" ? "message.send" : "message.receive", entity: "messages", entity_id: id, detail: { client, type: "voice", dur, sha256: crypto3.createHash("sha256").update(buf).digest("hex") } });
    return json(201, from === "lawyer" ? this.pubAdmin(m) : this.pub(m));
  }
  async attach(req, u, client, from, who) {
    if (!client) return json(400, { error: "missing client" });
    const name = String(u.searchParams.get("name") || "\u0645\u0631\u0641\u0642").replace(/[\\/:*?"<>|]/g, "_").slice(0, 120);
    const type = String(req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const dot = name.lastIndexOf(".");
    let ext = ((dot > 0 ? name.slice(dot + 1) : "") || FILE_EXT[type] || "").toLowerCase();
    if (ext === "jpeg") ext = "jpg";
    if (!EXT_OK.has(ext)) return json(415, { error: "\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645. \u0627\u0644\u0645\u0633\u0645\u0648\u062D: \u0627\u0644\u0635\u0648\u0631 \u0648PDF \u0648Word \u0648Excel \u0648\u0627\u0644\u0646\u0635\u0648\u0635." });
    let buf;
    try {
      buf = await this.readBody(req, 25 * 1024 * 1024);
    } catch (e) {
      return json(413, { error: "\u0627\u0644\u0645\u0644\u0641 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0645\u0633\u0645\u0648\u062D (25 \u0645\u064A\u063A\u0627\u0628\u0627\u064A\u062A)." });
    }
    if (!buf.length) return json(400, { error: "\u0627\u0644\u0645\u0644\u0641 \u0641\u0627\u0631\u063A." });
    const id = rid2(), file = `${id}.${ext}`;
    await this.env.MEDIA.put(this.slug() + "/" + file, buf, { httpMetadata: { contentType: TYPES[ext] || "application/octet-stream" } });
    const isImg = ["jpg", "png", "webp", "gif", "heic"].includes(ext);
    const caption = String(u.searchParams.get("caption") || "").trim().slice(0, 500);
    const m = this.addMsg({ id, client, from, type: isImg ? "image" : "file", file, name, size: buf.length, ext, text: caption, ch: "\u0627\u0644\u0628\u0648\u0627\u0628\u0629", ...from === "lawyer" ? { by: who.username } : {} });
    this.audit({ ...who, action: from === "lawyer" ? "message.send" : "message.receive", entity: "messages", entity_id: id, detail: { client, type: m.type, name, size: buf.length, sha256: crypto3.createHash("sha256").update(buf).digest("hex") } });
    return json(201, from === "lawyer" ? this.pubAdmin(m) : this.pub(m));
  }
  /* ── دليل المحامين (D1 مشتركة، للقراءة فقط من المكاتب) ── */
  async barMeta() {
    const r = await this.env.DB.prepare("SELECT value FROM meta WHERE key = 'bar_meta'").first();
    return r ? JSON.parse(r.value) : null;
  }
  async barSearch(s) {
    const DB = this.env.DB, w = [], a = [];
    for (const t of norm(s.get("q") || "").split(" ").filter(Boolean).slice(0, 6)) {
      const dg = digits(t);
      w.push("norm LIKE ?");
      a.push("%" + (dg.length >= 4 && dg.length === t.length ? dg.replace(/^0/, "") : t) + "%");
    }
    if (s.get("city")) {
      w.push("city = ?");
      a.push(s.get("city"));
    }
    if (s.get("status")) {
      w.push("status = ?");
      a.push(s.get("status"));
    }
    if (s.get("phone")) w.push("phones <> '[]'");
    const where = w.length ? "WHERE " + w.join(" AND ") : "";
    const limit = Math.min(200, Math.max(1, +s.get("limit") || 100)), offset = Math.max(0, +s.get("offset") || 0);
    if (!this.facets || Date.now() - this.facets.at > 36e5) {
      const [c, st, wp] = await DB.batch([
        DB.prepare("SELECT city c, COUNT(*) n FROM bar_dir WHERE city <> '' GROUP BY city ORDER BY n DESC"),
        DB.prepare("SELECT status s, COUNT(*) n FROM bar_dir GROUP BY status ORDER BY n DESC"),
        DB.prepare("SELECT COUNT(*) n FROM bar_dir WHERE phones <> '[]'")
      ]);
      this.facets = { at: Date.now(), v: { cities: c.results, statuses: st.results, withPhone: (wp.results[0] || {}).n || 0 } };
    }
    const [tot, rows] = await DB.batch([
      DB.prepare(`SELECT COUNT(*) n FROM bar_dir ${where}`).bind(...a),
      DB.prepare(`SELECT mno, name, status, city, office, address, phones, email FROM bar_dir ${where} ORDER BY (phones = '[]'), CAST(substr(mno, 2) AS INTEGER) LIMIT ? OFFSET ?`).bind(...a, limit, offset)
    ]);
    return { total: tot.results[0].n, rows: rows.results.map((r) => ({ ...r, phones: JSON.parse(r.phones || "[]") })), meta: await this.barMeta(), facets: this.facets.v, running: false, progress: null };
  }
  /* ── عمليات مزود الخدمة (تصل فقط عبر الـ Worker بعد التحقق من رمز العمليات) ── */
  async ops(req, u) {
    const p = u.pathname, b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (p === "/_ops/init") {
      if (!this.store.kv.get("created")) {
        this.store.kv.set("created", stampS());
        this.store.kv.set("settings", { edition: b.edition === "insurance" ? "insurance" : "office", officeName: String(b.name || "").slice(0, 120), lawyerName: String(b.lawyer || "").slice(0, 80), city: String(b.city || "").slice(0, 40), phone: "", hours: "" });
        if (!b.import) {
          this.state = EMPTY();
          this.store.saveState(null, this.state, "system", stampS());
          this.audit({ action: "office.create", detail: { slug: this.slug(), name: b.name || "" } });
        }
      }
      return json(200, { ok: true, slug: this.slug(), created: this.store.kv.get("created") });
    }
    if (p === "/_ops/setup-link") {
      if (this.auth.hasUsers()) return json(409, { error: "already has users" });
      const t = crypto3.randomBytes(24).toString("base64url");
      this.store.kv.set("setup", { hash: crypto3.createHash("sha256").update(t).digest("hex"), exp: Date.now() + 72 * 36e5 });
      this.audit({ action: "office.setup_link" });
      return json(200, { token: t, expires: "72h" });
    }
    if (p === "/_ops/info") {
      const g = /* @__PURE__ */ __name((q) => this.store.get(q), "g");
      return json(200, { slug: this.slug(), created: this.store.kv.get("created"), settings: this.settings(), users: g("SELECT COUNT(*) n FROM users").n, records: g("SELECT COUNT(*) n FROM records").n, messages: g("SELECT COUNT(*) n FROM messages").n, audit: g("SELECT COUNT(*) n FROM audit").n, verify: this.store.auditVerify() });
    }
    if (p === "/_ops/import") {
      const S = this.store, g = /* @__PURE__ */ __name((q) => S.get(q), "g");
      if (g("SELECT COUNT(*) n FROM users").n || g("SELECT COUNT(*) n FROM records").n || g("SELECT COUNT(*) n FROM messages").n) return json(409, { error: "office not empty" });
      const auditRows = b.audit || [];
      S.tx(() => {
        if (auditRows.length && g("SELECT COUNT(*) n FROM audit").n) throw new Error("audit not empty: create office with import:true");
        if (b.auditKey) S.kv.set("audit_key", b.auditKey);
        for (const r of b.records || []) S.run("INSERT INTO records(kind, id, data, updated_at, updated_by) VALUES(?, ?, ?, ?, ?)", r.kind, r.id, r.data, r.updated_at, r.updated_by);
        for (const k of b.kv || []) if (!["slug", "created", "audit_key", "media_key", "setup"].includes(k.key)) S.run("INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", k.key, k.value);
        for (const m of b.messages || []) S.run("INSERT INTO messages(id, client, at, data) VALUES(?, ?, ?, ?)", m.id, m.client, m.at, m.data);
        for (const x of b.users || []) S.run("INSERT INTO users(id, username, name, role, salt, hash, active, failed, locked_until, must_change, cases, created_at, last_login) VALUES(?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)", x.id, x.username, x.name, x.role, x.salt, x.hash, x.active, x.must_change, x.cases, x.created_at, x.last_login);
        for (const a of auditRows) S.run("INSERT INTO audit(seq, at, user_id, username, action, entity, entity_id, detail, ip, prev, hash) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", a.seq, a.at, a.user_id, a.username, a.action, a.entity, a.entity_id, a.detail, a.ip, a.prev, a.hash);
      });
      this.state = S.loadState();
      this.msgs = S.loadMessages();
      const v = S.auditVerify();
      this.audit({ action: "office.import", detail: { records: (b.records || []).length, messages: (b.messages || []).length, users: (b.users || []).length, audit: auditRows.length, chainOk: v.ok } });
      return json(200, { ok: true, verify: v, files: this.msgs.filter((m) => m.file).map((m) => m.file) });
    }
    if (p === "/_ops/media" && req.method === "PUT") {
      const file = u.searchParams.get("file") || "";
      if (!/^[a-f0-9]{12}\.[a-z0-9]{2,5}$/.test(file)) return json(400, { error: "bad name" });
      await this.env.MEDIA.put(this.slug() + "/" + file, req.body, { httpMetadata: { contentType: TYPES[file.split(".").pop()] || "application/octet-stream" } });
      return json(200, { ok: true });
    }
    if (p === "/_ops/export") {
      const S = this.store;
      return json(200, { slug: this.slug(), at: stampS(), records: S.all("SELECT * FROM records"), kv: S.all("SELECT * FROM kv").filter((k) => !["setup", "media_key"].includes(k.key)), messages: S.all("SELECT * FROM messages"), users: S.all("SELECT * FROM users"), audit: S.all("SELECT * FROM audit ORDER BY seq") });
    }
    return json(404, { error: "unknown op" });
  }
};

// src/index.js
var RESERVED = /* @__PURE__ */ new Set(["www", "admin", "ops", "api", "app", "portal", "mail", "static", "office", "support", "status"]);
var SLUG_RE = /^[a-z][a-z0-9-]{2,30}$/;
var cache = /* @__PURE__ */ new Map();
var page = /* @__PURE__ */ __name((title2, body, status = 404) => new Response(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title2}</title><body style="font-family:Cairo,Tahoma,sans-serif;background:#F5F0E6;color:#121B2E;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center;padding:24px"><h1 style="font-size:24px">${title2}</h1><p style="color:#5D6375">${body}</p></div>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }), "page");
var json2 = /* @__PURE__ */ __name((code, obj) => new Response(JSON.stringify(obj), { status: code, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }), "json");
function hostInfo(host, env2) {
  host = String(host || "").toLowerCase().split(":")[0];
  for (const base of String(env2.BASE_DOMAINS || "palgaz.net").split(",").map((x) => x.trim()).filter(Boolean)) {
    if (host === base || host === "www." + base) return { base, root: true };
    if (host.endsWith("." + base)) {
      const sub = host.slice(0, -base.length - 1);
      return { base, sub };
    }
  }
  return { base: null };
}
__name(hostInfo, "hostInfo");
async function office(env2, slug) {
  const c = cache.get(slug);
  if (c && Date.now() - c.at < 6e4) return c.v;
  const v = await env2.DB.prepare("SELECT slug, name, status FROM offices WHERE slug = ?").bind(slug).first();
  cache.set(slug, { at: Date.now(), v });
  return v;
}
__name(office, "office");
var stub = /* @__PURE__ */ __name((env2, slug) => env2.OFFICE.get(env2.OFFICE.idFromName(slug)), "stub");
var forward = /* @__PURE__ */ __name((env2, slug, req, path) => {
  const u = new URL(req.url);
  if (path) u.pathname = path;
  const r = new Request(u, req);
  r.headers.set("x-mq-office", slug);
  return stub(env2, slug).fetch(r);
}, "forward");
function opsAuthorized(req, env2) {
  if (!env2.OPS_TOKEN) return false;
  const got = String(req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""), want = env2.OPS_TOKEN;
  const a = crypto4.createHash("sha256").update(got).digest(), b = crypto4.createHash("sha256").update(want).digest();
  return crypto4.timingSafeEqual(a, b);
}
__name(opsAuthorized, "opsAuthorized");
async function ops(req, env2, u) {
  if (!opsAuthorized(req, env2)) return json2(404, { error: "not found" });
  const p = u.pathname, M = req.method;
  if (p === "/_ops/offices" && M === "GET") return json2(200, (await env2.DB.prepare("SELECT * FROM offices ORDER BY created_at").all()).results);
  if (p === "/_ops/offices" && M === "POST") {
    const b = await req.json().catch(() => ({})), slug = String(b.slug || "").toLowerCase();
    if (!SLUG_RE.test(slug) || RESERVED.has(slug)) return json2(400, { error: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0643\u062A\u0628 \u0641\u064A \u0627\u0644\u0631\u0627\u0628\u0637: 3\u201331 \u062D\u0631\u0641\u0627\u064B \u0644\u0627\u062A\u064A\u0646\u064A\u0627\u064B \u0635\u063A\u064A\u0631\u0627\u064B \u0623\u0648 \u0623\u0631\u0642\u0627\u0645\u0627\u064B \u0623\u0648 -\u060C \u0648\u064A\u0628\u062F\u0623 \u0628\u062D\u0631\u0641." });
    if (await env2.DB.prepare("SELECT 1 FROM offices WHERE slug = ?").bind(slug).first()) return json2(409, { error: "exists" });
    await env2.DB.prepare("INSERT INTO offices(slug, name, status, created_at) VALUES(?, ?, 'active', datetime('now'))").bind(slug, String(b.name || slug).slice(0, 120)).run();
    cache.delete(slug);
    const r = await forward(env2, slug, new Request(new URL("/_ops/init", u), { method: "POST", body: JSON.stringify(b) }));
    return json2(201, { slug, init: await r.json() });
  }
  const m = /^\/_ops\/offices\/([a-z0-9-]+)(\/.*)$/.exec(p);
  if (m) {
    const [, slug, rest] = m;
    if (!await env2.DB.prepare("SELECT 1 FROM offices WHERE slug = ?").bind(slug).first()) return json2(404, { error: "no such office" });
    if (rest === "/status" && M === "POST") {
      const { status } = await req.json().catch(() => ({}));
      if (!["active", "suspended"].includes(status)) return json2(400, { error: "status" });
      await env2.DB.prepare("UPDATE offices SET status = ? WHERE slug = ?").bind(status, slug).run();
      cache.delete(slug);
      return json2(200, { ok: true, slug, status });
    }
    const map = { "/info": "/_ops/info", "/setup-link": "/_ops/setup-link", "/import": "/_ops/import", "/media": "/_ops/media", "/export": "/_ops/export" };
    if (!map[rest]) return json2(404, { error: "unknown op" });
    const r = await forward(env2, slug, req, map[rest]);
    if (rest === "/setup-link" && r.ok) {
      const j = await r.json();
      return json2(200, { ...j, url: `https://${slug}.${String(env2.BASE_DOMAINS || "palgaz.net").split(",")[0].trim()}/login.html?setup=${j.token}` });
    }
    return r;
  }
  if (p === "/_ops/bar/import" && M === "POST") {
    const b = await req.json().catch(() => ({}));
    const pick = /* @__PURE__ */ __name((info3, re, not) => {
      const k = Object.keys(info3 || {}).find((k2) => re.test(k2) && !(not && not.test(k2)));
      return k ? info3[k] : "";
    }, "pick");
    const stmts = [];
    if (b.reset) stmts.push(env2.DB.prepare("DELETE FROM bar_dir"));
    for (const l of b.lawyers || []) {
      const city = pick(l.info, /مدين/), off2 = pick(l.info, /اسم|مكتب/, /عنوان/), address = pick(l.info, /عنوان/);
      const phones = (l.phones || []).map((x) => String(x).replace(/[^\d+]/g, "")).filter(Boolean);
      stmts.push(env2.DB.prepare("INSERT OR REPLACE INTO bar_dir(mno, name, status, city, office, address, phones, email, page, norm) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        String(l.mno),
        l.name || "",
        l.status || "",
        city || "",
        off2 || "",
        address || "",
        JSON.stringify(phones),
        l.email || "",
        l.page || null,
        [norm(l.name), norm(l.mno), phones.map((x) => x.replace(/\D/g, "")).join(" "), norm(off2), norm(l.email)].join(" | ")
      ));
    }
    if (b.meta) stmts.push(env2.DB.prepare("INSERT INTO meta(key, value) VALUES('bar_meta', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(JSON.stringify(b.meta)));
    if (stmts.length) await env2.DB.batch(stmts);
    return json2(200, { ok: true, n: (b.lawyers || []).length, total: (await env2.DB.prepare("SELECT COUNT(*) n FROM bar_dir").first()).n });
  }
  return json2(404, { error: "unknown op" });
}
__name(ops, "ops");
var index_default = {
  async fetch(req, env2) {
    const u = new URL(req.url), h = hostInfo(req.headers.get("host") || u.host, env2);
    const secure = /* @__PURE__ */ __name((r) => {
      if (u.protocol !== "https:") return r;
      const x = new Response(r.body, r);
      x.headers.set("Strict-Transport-Security", "max-age=31536000");
      return x;
    }, "secure");
    if (u.pathname.startsWith("/_ops/")) return ops(req, env2, u);
    if (!h.base) return page("\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", "\u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0623\u064A \u0645\u0643\u062A\u0628.");
    if (h.root) {
      const r = await env2.ASSETS.fetch(new Request(new URL("/site/index.html", u)));
      return secure(r.ok ? r : page("\u0645\u064A\u062B\u0627\u0642", "\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0645\u062D\u0627\u0645\u0627\u0629", 200));
    }
    const slug = h.sub;
    if (!SLUG_RE.test(slug) || RESERVED.has(slug)) return page("\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", "\u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0623\u064A \u0645\u0643\u062A\u0628.");
    const o = await office(env2, slug);
    if (!o) return page("\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0643\u062A\u0628 \u0628\u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0648\u0627\u0646. \u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0630\u064A \u0648\u0635\u0644\u0643 \u0645\u0646 \u0645\u0643\u062A\u0628 \u0627\u0644\u0645\u062D\u0627\u0645\u0627\u0629.");
    if (o.status !== "active") return u.pathname.startsWith("/api/") ? json2(403, { error: "\u0627\u0644\u062E\u062F\u0645\u0629 \u0645\u0648\u0642\u0648\u0641\u0629 \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0643\u062A\u0628." }) : page("\u0627\u0644\u062E\u062F\u0645\u0629 \u0645\u0648\u0642\u0648\u0641\u0629 \u0645\u0624\u0642\u062A\u0627\u064B", "\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0645\u0643\u062A\u0628 \u0627\u0644\u0645\u062D\u0627\u0645\u0627\u0629.", 403);
    return secure(await forward(env2, slug, req));
  }
};
export {
  Office,
  index_default as default
};
//# sourceMappingURL=index.js.map
