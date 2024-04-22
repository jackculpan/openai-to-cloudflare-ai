// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (path) => {
  const groups = [];
  for (let i = 0; ; ) {
    let replaced = false;
    path = path.replace(/\{[^}]+\}/g, (m) => {
      const mark = `@\\${i}`;
      groups[i] = [mark, m];
      i++;
      replaced = true;
      return mark;
    });
    if (!replaced) {
      break;
    }
  }
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].indexOf(mark) !== -1) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    if (!patternCache[label]) {
      if (match[2]) {
        patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
      } else {
        patternCache[label] = [label, match[1], true];
      }
    }
    return patternCache[label];
  }
  return null;
};
var getPath = (request) => {
  const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
  return match ? match[1] : "";
};
var getQueryStrings = (url) => {
  const queryIndex = url.indexOf("?", 8);
  return queryIndex === -1 ? "" : "?" + url.slice(queryIndex + 1);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result[result.length - 1] === "/" ? result.slice(0, -1) : result;
};
var mergePath = (...paths) => {
  let p = "";
  let endsWithSlash = false;
  for (let path of paths) {
    if (p[p.length - 1] === "/") {
      p = p.slice(0, -1);
      endsWithSlash = true;
    }
    if (path[0] !== "/") {
      path = `/${path}`;
    }
    if (path === "/" && endsWithSlash) {
      p = `${p}/`;
    } else if (path !== "/") {
      p = `${p}${path}`;
    }
    if (path === "/" && p === "") {
      p = "/";
    }
  }
  return p;
};
var checkOptionalParameter = (path) => {
  const match = path.match(/^(.+|)(\/\:[^\/]+)\?$/);
  if (!match)
    return null;
  const base = match[1];
  const optional = base + match[2];
  return [base === "" ? "/" : base.replace(/\/$/, ""), optional];
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return /%/.test(value) ? decodeURIComponent_(value) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ?? (encoded = /[%+]/.test(url));
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      ;
      (results[name] ?? (results[name] = [])).push(value);
    } else {
      results[name] ?? (results[name] = value);
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = (cookie, name) => {
  const pairs = cookie.trim().split(";");
  return pairs.reduce((parsedCookie, pairStr) => {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1)
      return parsedCookie;
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName))
      return parsedCookie;
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"'))
      cookieValue = cookieValue.slice(1, -1);
    if (validCookieValueRegEx.test(cookieValue))
      parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
    return parsedCookie;
  }, {});
};
var _serialize = (name, value, opt = {}) => {
  let cookie = `${name}=${value}`;
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }
  if (opt.domain) {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite}`;
  }
  if (opt.partitioned) {
    cookie += "; Partitioned";
  }
  return cookie;
};
var serialize = (name, value, opt = {}) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
};

// node_modules/hono/dist/utils/stream.js
var StreamingApi = class {
  constructor(writable) {
    this.writable = writable;
    this.writer = writable.getWriter();
    this.encoder = new TextEncoder();
  }
  async write(input) {
    try {
      if (typeof input === "string") {
        input = this.encoder.encode(input);
      }
      await this.writer.write(input);
    } catch (e) {
    }
    return this;
  }
  async writeln(input) {
    await this.write(input + "\n");
    return this;
  }
  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  async close() {
    try {
      await this.writer.close();
    } catch (e) {
    }
  }
  async pipe(body) {
    this.writer.releaseLock();
    await body.pipeTo(this.writable, { preventClose: true });
    this.writer = this.writable.getWriter();
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var Context = class {
  constructor(req, options) {
    this.env = {};
    this._var = {};
    this.finalized = false;
    this.error = void 0;
    this._status = 200;
    this._h = void 0;
    this._pH = void 0;
    this._init = true;
    this._renderer = (content) => this.html(content);
    this.notFoundHandler = () => new Response();
    this.render = (...args) => this._renderer(...args);
    this.setRenderer = (renderer2) => {
      this._renderer = renderer2;
    };
    this.header = (name, value, options2) => {
      if (value === void 0) {
        if (this._h) {
          this._h.delete(name);
        } else if (this._pH) {
          delete this._pH[name.toLocaleLowerCase()];
        }
        if (this.finalized) {
          this.res.headers.delete(name);
        }
        return;
      }
      if (options2?.append) {
        if (!this._h) {
          this._init = false;
          this._h = new Headers(this._pH);
          this._pH = {};
        }
        this._h.append(name, value);
      } else {
        if (this._h) {
          this._h.set(name, value);
        } else {
          this._pH ?? (this._pH = {});
          this._pH[name.toLowerCase()] = value;
        }
      }
      if (this.finalized) {
        if (options2?.append) {
          this.res.headers.append(name, value);
        } else {
          this.res.headers.set(name, value);
        }
      }
    };
    this.status = (status) => {
      this._init = false;
      this._status = status;
    };
    this.set = (key, value) => {
      this._var ?? (this._var = {});
      this._var[key] = value;
    };
    this.get = (key) => {
      return this._var ? this._var[key] : void 0;
    };
    this.newResponse = (data, arg, headers) => {
      if (this._init && !headers && !arg && this._status === 200) {
        return new Response(data, {
          headers: this._pH
        });
      }
      if (arg && typeof arg !== "number") {
        const res = new Response(data, arg);
        const contentType = this._pH?.["content-type"];
        if (contentType) {
          res.headers.set("content-type", contentType);
        }
        return res;
      }
      const status = arg ?? this._status;
      this._pH ?? (this._pH = {});
      this._h ?? (this._h = new Headers());
      for (const [k, v] of Object.entries(this._pH)) {
        this._h.set(k, v);
      }
      if (this._res) {
        this._res.headers.forEach((v, k) => {
          this._h?.set(k, v);
        });
        for (const [k, v] of Object.entries(this._pH)) {
          this._h.set(k, v);
        }
      }
      headers ?? (headers = {});
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          this._h.set(k, v);
        } else {
          this._h.delete(k);
          for (const v2 of v) {
            this._h.append(k, v2);
          }
        }
      }
      return new Response(data, {
        status,
        headers: this._h
      });
    };
    this.body = (data, arg, headers) => {
      return typeof arg === "number" ? this.newResponse(data, arg, headers) : this.newResponse(data, arg);
    };
    this.text = (text, arg, headers) => {
      if (!this._pH) {
        if (this._init && !headers && !arg) {
          return new Response(text);
        }
        this._pH = {};
      }
      if (this._pH["content-type"]) {
        this._pH["content-type"] = TEXT_PLAIN;
      }
      return typeof arg === "number" ? this.newResponse(text, arg, headers) : this.newResponse(text, arg);
    };
    this.json = (object, arg, headers) => {
      const body = JSON.stringify(object);
      this._pH ?? (this._pH = {});
      this._pH["content-type"] = "application/json; charset=UTF-8";
      return typeof arg === "number" ? this.newResponse(body, arg, headers) : this.newResponse(body, arg);
    };
    this.jsonT = (object, arg, headers) => {
      const response = typeof arg === "number" ? this.json(object, arg, headers) : this.json(object, arg);
      return {
        response,
        data: object,
        format: "json",
        status: response.status
      };
    };
    this.html = (html2, arg, headers) => {
      this._pH ?? (this._pH = {});
      this._pH["content-type"] = "text/html; charset=UTF-8";
      if (typeof html2 === "object") {
        if (!(html2 instanceof Promise)) {
          html2 = html2.toString();
        }
        if (html2 instanceof Promise) {
          return html2.then((html22) => {
            return typeof arg === "number" ? this.newResponse(html22, arg, headers) : this.newResponse(html22, arg);
          });
        }
      }
      return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
    };
    this.redirect = (location, status = 302) => {
      this._h ?? (this._h = new Headers());
      this._h.set("Location", location);
      return this.newResponse(null, status);
    };
    this.streamText = (cb, arg, headers) => {
      headers ?? (headers = {});
      this.header("content-type", TEXT_PLAIN);
      this.header("x-content-type-options", "nosniff");
      this.header("transfer-encoding", "chunked");
      return this.stream(cb, arg, headers);
    };
    this.stream = (cb, arg, headers) => {
      const { readable, writable } = new TransformStream();
      const stream = new StreamingApi(writable);
      cb(stream).finally(() => stream.close());
      return typeof arg === "number" ? this.newResponse(readable, arg, headers) : this.newResponse(readable, arg);
    };
    this.cookie = (name, value, opt) => {
      const cookie = serialize(name, value, opt);
      this.header("set-cookie", cookie, { append: true });
    };
    this.notFound = () => {
      return this.notFoundHandler(this);
    };
    this.req = req;
    if (options) {
      this._exCtx = options.executionCtx;
      this.env = options.env;
      if (options.notFoundHandler) {
        this.notFoundHandler = options.notFoundHandler;
      }
    }
  }
  get event() {
    if (this._exCtx && "respondWith" in this._exCtx) {
      return this._exCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this._exCtx) {
      return this._exCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    this._init = false;
    return this._res || (this._res = new Response("404 Not Found", { status: 404 }));
  }
  set res(_res) {
    this._init = false;
    if (this._res && _res) {
      this._res.headers.delete("content-type");
      this._res.headers.forEach((v, k) => {
        _res.headers.set(k, v);
      });
    }
    this._res = _res;
    this.finalized = true;
  }
  get var() {
    return { ...this._var };
  }
  get runtime() {
    const global = globalThis;
    if (global?.Deno !== void 0) {
      return "deno";
    }
    if (global?.Bun !== void 0) {
      return "bun";
    }
    if (typeof global?.WebSocketPair === "function") {
      return "workerd";
    }
    if (typeof global?.EdgeRuntime === "string") {
      return "edge-light";
    }
    if (global?.fastly !== void 0) {
      return "fastly";
    }
    if (global?.__lagon__ !== void 0) {
      return "lagon";
    }
    if (global?.process?.release?.name === "node") {
      return "node";
    }
    return "other";
  }
};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0];
        if (context instanceof Context) {
          context.req.setParams(middleware[i][1]);
        }
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (!handler) {
        if (context instanceof Context && context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      } else {
        try {
          res = await handler(context, () => {
            return dispatch(i + 1);
          });
        } catch (err) {
          if (err instanceof Error && context instanceof Context && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      }
      if (res !== void 0 && "response" in res) {
        res = res["response"];
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  constructor(status = 500, options) {
    super(options?.message);
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      return this.res;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// node_modules/hono/dist/utils/body.js
var isArrayField = (value) => {
  return Array.isArray(value);
};
var parseBody = async (request, options = {
  all: false
}) => {
  let body = {};
  const contentType = request.headers.get("Content-Type");
  if (contentType && (contentType.startsWith("multipart/form-data") || contentType.startsWith("application/x-www-form-urlencoded"))) {
    const formData = await request.formData();
    if (formData) {
      const form = {};
      formData.forEach((value, key) => {
        const shouldParseAllValues = options.all || key.slice(-2) === "[]";
        if (!shouldParseAllValues) {
          form[key] = value;
          return;
        }
        if (form[key] && isArrayField(form[key])) {
          ;
          form[key].push(value);
          return;
        }
        if (form[key]) {
          form[key] = [form[key], value];
          return;
        }
        form[key] = value;
      });
      body = form;
    }
  }
  return body;
};

// node_modules/hono/dist/request.js
var HonoRequest = class {
  constructor(request, path = "/", paramStash = void 0) {
    this._p = {};
    this.bodyCache = {};
    this.cachedBody = (key) => {
      const { bodyCache, raw: raw2 } = this;
      const cachedBody = bodyCache[key];
      if (cachedBody)
        return cachedBody;
      if (bodyCache.arrayBuffer) {
        return (async () => {
          return await new Response(bodyCache.arrayBuffer)[key]();
        })();
      }
      return bodyCache[key] = raw2[key]();
    };
    this.raw = request;
    this.path = path;
    this._s = paramStash;
    this.vData = {};
  }
  setParams(params) {
    this._p = params;
  }
  param(key) {
    if (key) {
      const param = this._s ? this._s[this._p[key]] : this._p[key];
      return param ? /\%/.test(param) ? decodeURIComponent_(param) : param : void 0;
    } else {
      const decoded = {};
      const keys = Object.keys(this._p);
      for (let i = 0, len = keys.length; i < len; i++) {
        const key2 = keys[i];
        const value = this._s ? this._s[this._p[key2]] : this._p[key2];
        if (value && typeof value === "string") {
          decoded[key2] = /\%/.test(value) ? decodeURIComponent_(value) : value;
        }
      }
      return decoded;
    }
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name)
      return this.raw.headers.get(name.toLowerCase()) ?? void 0;
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  cookie(key) {
    const cookie = this.raw.headers.get("Cookie");
    if (!cookie)
      return;
    const obj = parse(cookie);
    if (key) {
      const value = obj[key];
      return value;
    } else {
      return obj;
    }
  }
  async parseBody(options) {
    if (this.bodyCache.parsedBody)
      return this.bodyCache.parsedBody;
    const parsedBody = await parseBody(this, options);
    this.bodyCache.parsedBody = parsedBody;
    return parsedBody;
  }
  json() {
    return this.cachedBody("json");
  }
  text() {
    return this.cachedBody("text");
  }
  arrayBuffer() {
    return this.cachedBody("arrayBuffer");
  }
  blob() {
    return this.cachedBody("blob");
  }
  formData() {
    return this.cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.vData[target] = data;
  }
  valid(target) {
    return this.vData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get headers() {
    return this.raw.headers;
  }
  get body() {
    return this.raw.body;
  }
  get bodyUsed() {
    return this.raw.bodyUsed;
  }
  get integrity() {
    return this.raw.integrity;
  }
  get keepalive() {
    return this.raw.keepalive;
  }
  get referrer() {
    return this.raw.referrer;
  }
  get signal() {
    return this.raw.signal;
  }
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/hono-base.js
function defineDynamicClass() {
  return class {
  };
}
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  const message = "Internal Server Error";
  return c.text(message, 500);
};
var Hono = class extends defineDynamicClass() {
  constructor(options = {}) {
    super();
    this._basePath = "/";
    this.path = "/";
    this.routes = [];
    this.notFoundHandler = notFoundHandler;
    this.errorHandler = errorHandler;
    this.head = () => {
      console.warn("`app.head()` is no longer used. `app.get()` implicitly handles the HEAD method.");
      return this;
    };
    this.handleEvent = (event) => {
      return this.dispatch(event.request, event, void 0, event.request.method);
    };
    this.fetch = (request, Env, executionCtx) => {
      return this.dispatch(request, executionCtx, Env, request.method);
    };
    this.request = (input, requestInit, Env, executionCtx) => {
      if (input instanceof Request) {
        if (requestInit !== void 0) {
          input = new Request(input, requestInit);
        }
        return this.fetch(input, Env, executionCtx);
      }
      input = input.toString();
      const path = /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`;
      const req = new Request(path, requestInit);
      return this.fetch(req, Env, executionCtx);
    };
    this.fire = () => {
      addEventListener("fetch", (event) => {
        event.respondWith(this.dispatch(event.request, event, void 0, event.request.method));
      });
    };
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.map((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.path = args1;
        } else {
          this.addRoute(method, this.path, args1);
        }
        args.map((handler) => {
          if (typeof handler !== "string") {
            this.addRoute(method, this.path, handler);
          }
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      if (!method)
        return this;
      this.path = path;
      for (const m of [method].flat()) {
        handlers.map((handler) => {
          this.addRoute(m.toUpperCase(), this.path, handler);
        });
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.path = arg1;
      } else {
        handlers.unshift(arg1);
      }
      handlers.map((handler) => {
        this.addRoute(METHOD_NAME_ALL, this.path, handler);
      });
      return this;
    };
    const strict = options.strict ?? true;
    delete options.strict;
    Object.assign(this, options);
    this.getPath = strict ? options.getPath ?? getPath : getPathNoStrict;
  }
  clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  route(path, app2) {
    const subApp = this.basePath(path);
    if (!app2) {
      return subApp;
    }
    app2.routes.map((r) => {
      const handler = app2.errorHandler === errorHandler ? r.handler : async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
      subApp.addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError(handler) {
    this.errorHandler = handler;
    return this;
  }
  notFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }
  showRoutes() {
    const length = 8;
    this.routes.map((route) => {
      console.log(
        `\x1B[32m${route.method}\x1B[0m ${" ".repeat(length - route.method.length)} ${route.path}`
      );
    });
  }
  mount(path, applicationHandler, optionHandler) {
    const mergedPath = mergePath(this._basePath, path);
    const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
    const handler = async (c, next) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      const options = optionHandler ? optionHandler(c) : [c.env, executionContext];
      const optionsArray = Array.isArray(options) ? options : [options];
      const queryStrings = getQueryStrings(c.req.url);
      const res = await applicationHandler(
        new Request(
          new URL((c.req.path.slice(pathPrefixLength) || "/") + queryStrings, c.req.url),
          c.req.raw
        ),
        ...optionsArray
      );
      if (res)
        return res;
      await next();
    };
    this.addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  get routerName() {
    this.matchRoute("GET", "/");
    return this.router.name;
  }
  addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    this.router.add(method, path, handler);
    const r = { path, method, handler };
    this.routes.push(r);
  }
  matchRoute(method, path) {
    return this.router.match(method, path);
  }
  handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const [handlers, paramStash] = this.matchRoute(method, path);
    const c = new Context(new HonoRequest(request, path, paramStash), {
      env,
      executionCtx,
      notFoundHandler: this.notFoundHandler
    });
    if (handlers.length === 1) {
      let res;
      c.req.setParams(handlers[0][1]);
      try {
        res = handlers[0][0](c, async () => {
        });
        if (!res) {
          return this.notFoundHandler(c);
        }
      } catch (err) {
        return this.handleError(err, c);
      }
      if (res instanceof Response)
        return res;
      if ("response" in res) {
        res = res.response;
      }
      if (res instanceof Response)
        return res;
      return (async () => {
        let awaited;
        try {
          awaited = await res;
          if (awaited !== void 0 && "response" in awaited) {
            awaited = awaited["response"];
          }
          if (!awaited) {
            return this.notFoundHandler(c);
          }
        } catch (err) {
          return this.handleError(err, c);
        }
        return awaited;
      })();
    }
    const composed = compose(handlers, this.errorHandler, this.notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. You may forget returning Response object or `await next()`"
          );
        }
        return context.res;
      } catch (err) {
        return this.handleError(err, c);
      }
    })();
  }
};

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class {
  constructor() {
    this.children = {};
  }
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.children[regexpStr];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[regexpStr] = new Node();
        if (name !== "") {
          node.varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.varIndex]);
      }
    } else {
      node = this.children[token];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.children[k];
      return (typeof c.varIndex === "number" ? `(${k})@${c.varIndex}` : k) + c.buildRegExpStr();
    });
    if (typeof this.index === "number") {
      strList.unshift(`#${this.index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  constructor() {
    this.context = { varIndex: 0 };
    this.root = new Node();
  }
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.root.insert(tokens, index, paramAssoc, this.context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (typeof handlerIndex !== "undefined") {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (typeof paramIndex !== "undefined") {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var methodNames = [METHOD_NAME_ALL, ...METHODS].map((method) => method.toUpperCase());
var emptyParam = [];
var nullMatcher = [/^$/, [], {}];
var wildcardRegExpCache = {};
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ?? (wildcardRegExpCache[path] = new RegExp(
    path === "*" ? "" : `^${path.replace(/\/\*/, "(?:|/.*)")}$`
  ));
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = {};
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = {};
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, {}]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = {};
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  constructor() {
    this.name = "RegExpRouter";
    this.middleware = { [METHOD_NAME_ALL]: {} };
    this.routes = { [METHOD_NAME_ALL]: {} };
  }
  add(method, path, handler) {
    var _a;
    const { middleware, routes } = this;
    if (!middleware || !routes) {
      throw new Error("Can not add a route since the matcher is already built.");
    }
    if (methodNames.indexOf(method) === -1)
      methodNames.push(method);
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = {};
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          var _a2;
          (_a2 = middleware[m])[path] || (_a2[path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
        });
      } else {
        (_a = middleware[method])[path] || (_a[path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        var _a2;
        if (method === METHOD_NAME_ALL || method === m) {
          (_a2 = routes[m])[path2] || (_a2[path2] = [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ]);
          routes[m][path2].push([
            handler,
            paths.length === 2 && i === 0 ? paramCount - 1 : paramCount
          ]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  buildAllMatchers() {
    const matchers = {};
    methodNames.forEach((method) => {
      matchers[method] = this.buildMatcher(method) || matchers[METHOD_NAME_ALL];
    });
    this.middleware = this.routes = void 0;
    return matchers;
  }
  buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.middleware, this.routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute || (hasOwnRoute = true);
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  constructor(init) {
    this.name = "SmartRouter";
    this.routers = [];
    this.routes = [];
    Object.assign(this, init);
  }
  add(method, path, handler) {
    if (!this.routes) {
      throw new Error("Can not add a route since the matcher is already built.");
    }
    this.routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.routes) {
      throw new Error("Fatal error");
    }
    const { routers, routes } = this;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        routes.forEach((args) => {
          router.add(...args);
        });
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.routers = [router];
      this.routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.routes || this.routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var Node2 = class {
  constructor(method, handler, children) {
    this.order = 0;
    this.params = {};
    this.children = children || {};
    this.methods = [];
    this.name = "";
    if (method && handler) {
      const m = {};
      m[method] = { handler, params: {}, possibleKeys: [], score: 0, name: this.name };
      this.methods = [m];
    }
    this.patterns = [];
  }
  insert(method, path, handler) {
    this.name = `${method} ${path}`;
    this.order = ++this.order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    const parentPatterns = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      if (Object.keys(curNode.children).includes(p)) {
        parentPatterns.push(...curNode.patterns);
        curNode = curNode.children[p];
        const pattern2 = getPattern(p);
        if (pattern2)
          possibleKeys.push(pattern2[1]);
        continue;
      }
      curNode.children[p] = new Node2();
      const pattern = getPattern(p);
      if (pattern) {
        curNode.patterns.push(pattern);
        parentPatterns.push(...curNode.patterns);
        possibleKeys.push(pattern[1]);
      }
      parentPatterns.push(...curNode.patterns);
      curNode = curNode.children[p];
    }
    if (!curNode.methods.length) {
      curNode.methods = [];
    }
    const m = {};
    const handlerSet = {
      handler,
      params: {},
      possibleKeys,
      name: this.name,
      score: this.order
    };
    m[method] = handlerSet;
    curNode.methods.push(m);
    return curNode;
  }
  gHSets(node, method, params) {
    const handlerSets = [];
    for (let i = 0, len = node.methods.length; i < len; i++) {
      const m = node.methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet !== void 0) {
        handlerSet.possibleKeys.map((key) => {
          handlerSet.params[key] = params[key];
        });
        handlerSets.push(handlerSet);
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    const params = {};
    this.params = {};
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.children[part];
        if (nextNode) {
          if (isLast === true) {
            if (nextNode.children["*"]) {
              handlerSets.push(
                ...this.gHSets(nextNode.children["*"], method, { ...params, ...node.params })
              );
            }
            handlerSets.push(...this.gHSets(nextNode, method, { ...params, ...node.params }));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.patterns.length; k < len3; k++) {
          const pattern = node.patterns[k];
          if (pattern === "*") {
            const astNode = node.children["*"];
            if (astNode) {
              handlerSets.push(...this.gHSets(astNode, method, { ...params, ...node.params }));
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "")
            continue;
          const [key, name, matcher] = pattern;
          const child = node.children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp && matcher.test(restPathString)) {
            params[name] = restPathString;
            handlerSets.push(...this.gHSets(child, method, { ...params, ...node.params }));
            continue;
          }
          if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
            if (typeof key === "string") {
              params[name] = part;
              if (isLast === true) {
                handlerSets.push(...this.gHSets(child, method, { ...params, ...node.params }));
                if (child.children["*"]) {
                  handlerSets.push(
                    ...this.gHSets(child.children["*"], method, { ...params, ...node.params })
                  );
                }
              } else {
                child.params = { ...params };
                tempNodes.push(child);
              }
            }
          }
        }
      }
      curNodes = tempNodes;
    }
    const results = handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [results.map(({ handler, params: params2 }) => [handler, params2])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  constructor() {
    this.name = "TrieRouter";
    this.node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (const p of results) {
        this.node.insert(method, p, handler);
      }
      return;
    }
    this.node.insert(method, path, handler);
  }
  match(method, path) {
    return this.node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/utils/html.js
var escapeRe = /[&<>'"]/;
var stringBufferToString = async (buffer) => {
  let str = "";
  const promises = [];
  for (let i = buffer.length - 1; i >= 0; i--) {
    let r = await buffer[i];
    if (typeof r === "object") {
      promises.push(...r.promises || []);
    }
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      promises.push(...r.promises || []);
    }
    str += r;
  }
  return raw(str, promises);
};
var escapeToBuffer = (str, buffer) => {
  const match = str.search(escapeRe);
  if (match === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
};

// node_modules/hono/dist/helper/html/index.js
var raw = (value, promises) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.promises = promises;
  return escapedString;
};
var html = (strings, ...values) => {
  const buffer = [""];
  for (let i = 0, len = strings.length - 1; i < len; i++) {
    buffer[0] += strings[i];
    const children = values[i] instanceof Array ? values[i].flat(Infinity) : [values[i]];
    for (let i2 = 0, len2 = children.length; i2 < len2; i2++) {
      const child = children[i2];
      if (typeof child === "string") {
        escapeToBuffer(child, buffer);
      } else if (typeof child === "boolean" || child === null || child === void 0) {
        continue;
      } else if (typeof child === "object" && child.isEscaped || typeof child === "number") {
        const tmp = child.toString();
        if (tmp instanceof Promise) {
          buffer.unshift("", tmp);
        } else {
          buffer[0] += tmp;
        }
      } else {
        escapeToBuffer(child.toString(), buffer);
      }
    }
  }
  buffer[0] += strings[strings.length - 1];
  return buffer.length === 1 ? raw(buffer[0]) : stringBufferToString(buffer);
};

// node_modules/hono/dist/jsx/index.js
var emptyTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
var booleanAttributes = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var childrenToStringToBuffer = (children, buffer) => {
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (typeof child === "string") {
      escapeToBuffer(child, buffer);
    } else if (typeof child === "boolean" || child === null || child === void 0) {
      continue;
    } else if (child instanceof JSXNode) {
      child.toStringToBuffer(buffer);
    } else if (typeof child === "number" || child.isEscaped) {
      ;
      buffer[0] += child;
    } else if (child instanceof Promise) {
      buffer.unshift("", child);
    } else {
      childrenToStringToBuffer(child, buffer);
    }
  }
};
var JSXNode = class {
  constructor(tag, props, children) {
    this.isEscaped = true;
    this.tag = tag;
    this.props = props;
    this.children = children;
  }
  toString() {
    const buffer = [""];
    this.toStringToBuffer(buffer);
    return buffer.length === 1 ? buffer[0] : stringBufferToString(buffer);
  }
  toStringToBuffer(buffer) {
    const tag = this.tag;
    const props = this.props;
    let { children } = this;
    buffer[0] += `<${tag}`;
    const propsKeys = Object.keys(props || {});
    for (let i = 0, len = propsKeys.length; i < len; i++) {
      const key = propsKeys[i];
      const v = props[key];
      if (key === "style" && typeof v === "object") {
        const styles = Object.keys(v).map((k) => {
          const property = k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
          return `${property}:${v[k]}`;
        }).join(";");
        buffer[0] += ` style="${styles}"`;
      } else if (typeof v === "string") {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v, buffer);
        buffer[0] += '"';
      } else if (v === null || v === void 0) {
      } else if (typeof v === "number" || v.isEscaped) {
        buffer[0] += ` ${key}="${v}"`;
      } else if (typeof v === "boolean" && booleanAttributes.includes(key)) {
        if (v) {
          buffer[0] += ` ${key}=""`;
        }
      } else if (key === "dangerouslySetInnerHTML") {
        if (children.length > 0) {
          throw "Can only set one of `children` or `props.dangerouslySetInnerHTML`.";
        }
        children = [raw(v.__html)];
      } else {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v.toString(), buffer);
        buffer[0] += '"';
      }
    }
    if (emptyTags.includes(tag)) {
      buffer[0] += "/>";
      return;
    }
    buffer[0] += ">";
    childrenToStringToBuffer(children, buffer);
    buffer[0] += `</${tag}>`;
  }
};
var JSXFunctionNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    const { children } = this;
    const res = this.tag.call(null, {
      ...this.props,
      children: children.length <= 1 ? children[0] : children
    });
    if (res instanceof Promise) {
      buffer.unshift("", res);
    } else if (res instanceof JSXNode) {
      res.toStringToBuffer(buffer);
    } else if (typeof res === "number" || res.isEscaped) {
      buffer[0] += res;
    } else {
      escapeToBuffer(res, buffer);
    }
  }
};
var JSXFragmentNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    childrenToStringToBuffer(this.children, buffer);
  }
};
var jsxFn = (tag, props, ...children) => {
  if (typeof tag === "function") {
    return new JSXFunctionNode(tag, props, children);
  } else {
    return new JSXNode(tag, props, children);
  }
};
var Fragment = (props) => {
  return new JSXFragmentNode("", {}, props.children ? [props.children] : []);
};
var createContext = (defaultValue) => {
  const values = [defaultValue];
  return {
    values,
    Provider(props) {
      values.push(props.value);
      const string = props.children ? (Array.isArray(props.children) ? new JSXFragmentNode("", {}, props.children) : props.children).toString() : "";
      values.pop();
      if (string instanceof Promise) {
        return Promise.resolve().then(async () => {
          values.push(props.value);
          const awaited = await string;
          const promiseRes = raw(awaited, awaited.promises);
          values.pop();
          return promiseRes;
        });
      } else {
        return raw(string);
      }
    }
  };
};

// node_modules/hono/dist/jsx/streaming.js
var textEncoder = new TextEncoder();
var renderToReadableStream = (str) => {
  const reader = new ReadableStream({
    async start(controller) {
      const resolved = str instanceof Promise ? await str : await str.toString();
      controller.enqueue(textEncoder.encode(resolved));
      let resolvedCount = 0;
      const promises = [];
      const then = (promise) => {
        promises.push(
          promise.catch((err) => {
            console.trace(err);
            return "";
          }).then((res) => {
            if (res.promises) {
              const resPromises = res.promises || [];
              resPromises.forEach(then);
            }
            resolvedCount++;
            controller.enqueue(textEncoder.encode(res));
          })
        );
      };
      resolved.promises?.map(then);
      while (resolvedCount !== promises.length) {
        await Promise.all(promises);
      }
      controller.close();
    }
  });
  return reader;
};

// node_modules/hono/dist/middleware/jsx-renderer/index.js
var RequestContext = createContext(null);
var createRenderer = (c, component, options) => (children, props) => {
  const docType = typeof options?.docType === "string" ? options.docType : options?.docType === true ? "<!DOCTYPE html>" : "";
  const body = html`${raw(docType)}${jsxFn(
    RequestContext.Provider,
    { value: c },
    component ? component({ children, ...props || {} }) : children
  )}`;
  if (options?.stream) {
    return c.body(renderToReadableStream(body), {
      headers: options.stream === true ? {
        "Transfer-Encoding": "chunked",
        "Content-Type": "text/html; charset=UTF-8"
      } : options.stream
    });
  } else {
    return c.html(body);
  }
};
var jsxRenderer = (component, options) => (c, next) => {
  c.setRenderer(createRenderer(c, component, options));
  return next();
};

// node_modules/hono/dist/jsx/jsx-dev-runtime.js
function jsxDEV(tag, props) {
  if (!props?.children) {
    return jsxFn(tag, props);
  }
  const children = props.children;
  delete props["children"];
  return Array.isArray(children) ? jsxFn(tag, props, ...children) : jsxFn(tag, props, children);
}

// src/renderer.tsx
var renderer = jsxRenderer(({ children }) => /* @__PURE__ */ jsxDEV("html", { children: [
  /* @__PURE__ */ jsxDEV("head", { children: [
    /* @__PURE__ */ jsxDEV("meta", { charset: "UTF-8" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
    /* @__PURE__ */ jsxDEV("link", { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css" }),
    /* @__PURE__ */ jsxDEV("script", { src: "/script.js" }),
    /* @__PURE__ */ jsxDEV("title", { children: "Free AI Art Generator" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "description", content: "Generate free AI art based on your prompts and styles." }),
    /* @__PURE__ */ jsxDEV("meta", { name: "keywords", content: "AI Art, Free Art Generator, AI Generated Art" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "author", content: "AI Art Generator Team" }),
    /* @__PURE__ */ jsxDEV("meta", { property: "og:title", content: "Free AI Art Generator" }),
    /* @__PURE__ */ jsxDEV("meta", { property: "og:description", content: "Generate free AI art based on your prompts and styles." }),
    /* @__PURE__ */ jsxDEV("meta", { property: "og:image", content: "https://aiartgenerator.com/assets/ai_art_generator.png" }),
    /* @__PURE__ */ jsxDEV("meta", { property: "og:url", content: "https://art.aiphotoshoot.com" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "twitter:title", content: "Free AI Art Generator" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "twitter:description", content: "Generate free AI art based on your prompts and styles." }),
    /* @__PURE__ */ jsxDEV("meta", { name: "twitter:image", content: "https://aiartgenerator.com/assets/ai_art_generator.png" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "twitter:creator", content: "@jackculpan" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "twitter:site", content: "@jackculpan" })
  ] }),
  /* @__PURE__ */ jsxDEV("body", { children: [
    /* @__PURE__ */ jsxDEV("header", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxDEV("h1", { children: "Free AI Art Generator" }),
      /* @__PURE__ */ jsxDEV("a", { href: "/", style: { display: "flex", justifyContent: "flex-end" }, children: /* @__PURE__ */ jsxDEV("button", { children: "Generate New Art" }) })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children }),
    /* @__PURE__ */ jsxDEV("header", { style: { marginTop: "20px" }, children: /* @__PURE__ */ jsxDEV("p", { children: [
      "Created by ",
      /* @__PURE__ */ jsxDEV("a", { href: "https://twitter.com/jackculpan", target: "_blank", rel: "noopener noreferrer", children: "Jack Culpan" }),
      " using ",
      /* @__PURE__ */ jsxDEV("a", { href: "https://ai.cloudflare.com/", children: "Cloudflare AI, Workers and KV." })
    ] }) })
  ] })
] }));

// node_modules/@cloudflare/ai/dist/index.js
var TypedArrayProto = Object.getPrototypeOf(Uint8Array);
function isArray(value) {
  return Array.isArray(value) || value instanceof TypedArrayProto;
}
function arrLength(obj) {
  return obj instanceof TypedArrayProto ? obj.length : obj.flat(Infinity).reduce((acc, cur) => acc + (cur instanceof TypedArrayProto ? cur.length : 1), 0);
}
function ensureShape(shape, value) {
  if (shape.length === 0 && !isArray(value)) {
    return;
  }
  const count = shape.reduce((acc, v) => {
    if (!Number.isInteger(v)) {
      throw new Error(`expected shape to be array-like of integers but found non-integer element "${v}"`);
    }
    return acc * v;
  }, 1);
  if (count != arrLength(value)) {
    throw new Error(
      `invalid shape: expected ${count} elements for shape ${shape} but value array has length ${value.length}`
    );
  }
}
function ensureType(type, value) {
  if (isArray(value)) {
    value.forEach((v) => ensureType(type, v));
    return;
  }
  switch (type) {
    case "bool": {
      if (typeof value === "boolean") {
        return;
      }
      break;
    }
    case "float16":
    case "float32": {
      if (typeof value === "number") {
        return;
      }
      break;
    }
    case "int8":
    case "uint8":
    case "int16":
    case "uint16":
    case "int32":
    case "uint32": {
      if (Number.isInteger(value)) {
        return;
      }
      break;
    }
    case "int64":
    case "uint64": {
      if (typeof value === "bigint") {
        return;
      }
      break;
    }
    case "str": {
      if (typeof value === "string") {
        return;
      }
      break;
    }
  }
  throw new Error(`unexpected type "${type}" with value "${value}".`);
}
function serializeType(type, value) {
  if (isArray(value)) {
    return [...value].map((v) => serializeType(type, v));
  }
  switch (type) {
    case "str":
    case "bool":
    case "float16":
    case "float32":
    case "int8":
    case "uint8":
    case "int16":
    case "uint16":
    case "uint32":
    case "int32": {
      return value;
    }
    case "int64":
    case "uint64": {
      return value.toString();
    }
  }
  throw new Error(`unexpected type "${type}" with value "${value}".`);
}
function deserializeType(type, value) {
  if (isArray(value)) {
    return value.map((v) => deserializeType(type, v));
  }
  switch (type) {
    case "str":
    case "bool":
    case "float16":
    case "float32":
    case "int8":
    case "uint8":
    case "int16":
    case "uint16":
    case "uint32":
    case "int32": {
      return value;
    }
    case "int64":
    case "uint64": {
      return BigInt(value);
    }
  }
  throw new Error(`unexpected type "${type}" with value "${value}".`);
}
var Tensor = class _Tensor {
  type;
  value;
  name;
  shape;
  constructor(type, value, opts = {}) {
    this.type = type;
    this.value = value;
    ensureType(type, this.value);
    if (opts.shape === void 0) {
      if (isArray(this.value)) {
        this.shape = [arrLength(value)];
      } else {
        this.shape = [];
      }
    } else {
      this.shape = opts.shape;
    }
    ensureShape(this.shape, this.value);
    this.name = opts.name || null;
  }
  static fromJSON(obj) {
    const { type, shape, value, b64Value, name } = obj;
    const opts = { shape, name };
    if (b64Value !== void 0) {
      const value2 = b64ToArray(b64Value, type)[0];
      return new _Tensor(type, value2, opts);
    } else {
      return new _Tensor(type, deserializeType(type, value), opts);
    }
  }
  toJSON() {
    return {
      type: this.type,
      shape: this.shape,
      name: this.name,
      value: serializeType(this.type, this.value)
    };
  }
};
function b64ToArray(base64, type) {
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const arrBuffer = new DataView(bytes.buffer).buffer;
  switch (type) {
    case "float32":
      return new Float32Array(arrBuffer);
    case "float64":
      return new Float64Array(arrBuffer);
    case "int32":
      return new Int32Array(arrBuffer);
    case "int64":
      return new BigInt64Array(arrBuffer);
    default:
      throw Error(`invalid data type for base64 input: ${type}`);
  }
}
var tgTemplates = {
  bare: {
    system: {
      flag: 2
    },
    user: {
      flag: 3
    },
    assistant: {
      pre: " ",
      post: " "
    }
  },
  inst: {
    system: {
      flag: 2
    },
    user: {
      pre: "[INST] ",
      post: " [/INST]",
      flag: 3
    },
    assistant: {
      pre: " ",
      post: " "
    }
  },
  llama2: {
    system: {
      pre: "[INST] <<SYS>>\n",
      post: "\n<</SYS>>\n\n"
    },
    user: {
      pre: "<s>[INST] ",
      post: " [/INST]",
      flag: 1
    },
    assistant: {
      pre: " ",
      post: "</s>"
    }
  },
  deepseek: {
    system: {
      post: "\n"
    },
    user: {
      pre: "### Instruction:\n",
      post: "\n"
    },
    assistant: {
      pre: "### Response:\n",
      post: "\n"
    },
    global: {
      post: "### Response:\n"
    }
  },
  openchat: {
    system: {
      flag: 2
    },
    user: {
      pre: "GPT4 User: ",
      post: "<|end_of_turn|>",
      flag: 3
    },
    assistant: {
      pre: "GPT4 Assistant: ",
      post: "<|end_of_turn|>"
    },
    global: {
      post: "GPT4 Assistant:"
    }
  },
  chatml: {
    system: {
      pre: "<|im_start|>system\n",
      post: "<|im_end|>\n"
    },
    user: {
      pre: "<|im_start|>user\n",
      post: "<|im_end|>\n"
    },
    assistant: {
      pre: "<|im_start|>assistant\n",
      post: "<|im_end|>\n"
    },
    global: {
      post: "<|im_start|>assistant\n"
    }
  },
  "orca-hashes": {
    system: {
      pre: "### System:\n",
      post: "\n\n"
    },
    user: {
      pre: "### User:\n",
      post: "\n\n"
    },
    assistant: {
      pre: "### Assistant:\n",
      post: "\n\n"
    },
    global: {
      post: "### Assistant:\n\n"
    }
  },
  "codellama-instruct": {
    system: {
      pre: "[INST] ",
      post: "\n"
    },
    user: {
      pre: "[INST] ",
      post: " [/INST]\n",
      flag: 1
    },
    assistant: {
      post: "\n"
    }
  },
  "mistral-instruct": {
    system: {
      pre: "<s>[INST] ",
      post: " "
    },
    user: {
      pre: "[INST] ",
      post: " [/INST]",
      flag: 1
    },
    assistant: {
      pre: " ",
      post: "</s>"
    }
  },
  zephyr: {
    system: {
      pre: "<s><|system|>\n",
      post: "</s>\n"
    },
    user: {
      pre: "<|user|>\n",
      post: "</s>\n"
    },
    assistant: {
      pre: "<|assistant|>\n",
      post: "</s>\n"
    },
    global: {
      post: "<|assistant|>\n"
    }
  }
};
var generateTgTemplate = (messages, template) => {
  let prompt = "";
  const state = { lastSystem: false, systemCount: 0, userCount: 0, assistantCount: 0 };
  for (const message of messages) {
    switch (message.role) {
      case "system":
        state.systemCount++;
        state.lastSystem = message.content;
        prompt += applyRole(template, message.role, message.content, state);
        break;
      case "user":
        state.userCount++;
        prompt += applyRole(template, message.role, message.content, state);
        break;
      case "assistant":
        state.assistantCount++;
        prompt += applyRole(template, message.role, message.content, state);
        break;
    }
  }
  prompt = applyRole(template, "global", prompt, state);
  return prompt;
};
var applyTag = (template, role, type, state) => {
  if (type == "pre" && tgTemplates[template][role].flag == 1 && state.systemCount == 1 && state.userCount == 1) {
    return "";
  }
  return tgTemplates[template][role][type] || "";
};
var applyRole = (template, role, content, state) => {
  if (tgTemplates[template] && tgTemplates[template][role]) {
    if (tgTemplates[template][role].flag == 2)
      return "";
    if (tgTemplates[template][role].flag == 3 && state.lastSystem && state.userCount == 1) {
      content = `${state.lastSystem}${[":", ".", "!", "?"].indexOf(state.lastSystem.slice(-1)) == -1 ? ":" : ""} ${content}`;
    }
    return applyTag(template, role, "pre", state) + (content || "") + applyTag(template, role, "post", state);
  }
  return content || "";
};
var AiTextGeneration = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      type: "object",
      oneOf: [
        {
          properties: {
            prompt: {
              type: "string",
              maxLength: 4096
            },
            raw: {
              type: "boolean",
              default: false
            },
            stream: {
              type: "boolean",
              default: false
            },
            max_tokens: {
              type: "integer",
              default: 256
            }
          },
          required: ["prompt"]
        },
        {
          properties: {
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: {
                    type: "string"
                  },
                  content: {
                    type: "string",
                    maxLength: 4096
                  }
                },
                required: ["role", "content"]
              }
            },
            stream: {
              type: "boolean",
              default: false
            },
            max_tokens: {
              type: "integer",
              default: 256
            }
          },
          required: ["messages"]
        }
      ]
    },
    output: {
      oneOf: [
        {
          type: "object",
          contentType: "application/json",
          properties: {
            response: {
              type: "string"
            }
          }
        },
        {
          type: "string",
          contentType: "text/event-stream",
          format: "binary"
        }
      ]
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2 || {
      experimental: true,
      inputsDefaultsStream: {
        max_tokens: 512
      },
      inputsDefaults: {
        max_tokens: 256
      },
      preProcessingArgs: {
        promptTemplate: "inst",
        defaultContext: ""
      }
    };
  }
  preProcessing() {
    if (this.inputs.stream && this.modelSettings.inputsDefaultsStream) {
      this.inputs = { ...this.modelSettings.inputsDefaultsStream, ...this.inputs };
    } else if (this.modelSettings.inputsDefaults) {
      this.inputs = { ...this.modelSettings.inputsDefaults, ...this.inputs };
    }
    let prompt = "";
    if (this.inputs.messages === void 0) {
      if (this.inputs.raw == true) {
        prompt = this.inputs.prompt;
      } else {
        prompt = generateTgTemplate(
          [
            { role: "system", content: this.modelSettings.preProcessingArgs.defaultContext },
            { role: "user", content: this.inputs.prompt }
          ],
          this.modelSettings.preProcessingArgs.promptTemplate
        );
      }
    } else {
      prompt = generateTgTemplate(this.inputs.messages, this.modelSettings.preProcessingArgs.promptTemplate);
    }
    this.preProcessedInputs = prompt;
  }
  generateTensors() {
    this.tensors = [
      new Tensor("str", [this.preProcessedInputs], {
        shape: [1],
        name: "INPUT_0"
      }),
      new Tensor("uint32", [this.inputs.max_tokens], {
        shape: [1],
        name: "INPUT_1"
      })
    ];
  }
  postProcessing(response) {
    if (this.modelSettings.postProcessingFunc) {
      this.postProcessedOutputs = { response: this.modelSettings.postProcessingFunc(response) };
    } else {
      this.postProcessedOutputs = { response: response.name.value[0] };
    }
  }
  postProcessingStream(response) {
    if (this.modelSettings.postProcessingFuncStream) {
      return { response: this.modelSettings.postProcessingFuncStream(response) };
    } else {
      return { response: response.name.value[0] };
    }
  }
};
var AiTextClassification = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      type: "object",
      properties: {
        text: {
          type: "string"
        }
      },
      required: ["text"]
    },
    output: {
      type: "array",
      contentType: "application/json",
      items: {
        type: "object",
        properties: {
          score: {
            type: "number"
          },
          label: {
            type: "string"
          }
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors() {
    this.tensors = [
      new Tensor("str", [this.preProcessedInputs.text], {
        shape: [1],
        name: "input_text"
      })
    ];
  }
  postProcessing(response) {
    this.postProcessedOutputs = [
      {
        label: "NEGATIVE",
        score: response.logits.value[0][0]
      },
      {
        label: "POSITIVE",
        score: response.logits.value[0][1]
      }
    ];
  }
};
var AiTextEmbeddings = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      type: "object",
      properties: {
        text: {
          oneOf: [
            { type: "string" },
            {
              type: "array",
              items: {
                type: "string"
              },
              maxItems: 100
            }
          ]
        }
      },
      required: ["text"]
    },
    output: {
      type: "object",
      contentType: "application/json",
      properties: {
        shape: {
          type: "array",
          items: {
            type: "number"
          }
        },
        data: {
          type: "array",
          items: {
            type: "array",
            items: {
              type: "number"
            }
          }
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors() {
    this.tensors = [
      new Tensor(
        "str",
        Array.isArray(this.preProcessedInputs.text) ? this.preProcessedInputs.text : [this.preProcessedInputs.text],
        {
          shape: [
            Array.isArray(this.preProcessedInputs.text) ? this.preProcessedInputs.text.length : [this.preProcessedInputs.text].length
          ],
          name: "input_text"
        }
      )
    ];
  }
  postProcessing(response) {
    if (this.modelSettings.postProcessingFunc) {
      this.postProcessedOutputs = this.modelSettings.postProcessingFunc(response);
    } else {
      this.postProcessedOutputs = {
        shape: response.embeddings.shape,
        data: response.embeddings.value
      };
    }
  }
};
var AiTranslation = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      type: "object",
      properties: {
        text: {
          type: "string"
        },
        source_lang: {
          type: "string",
          default: "en"
        },
        target_lang: {
          type: "string"
        }
      },
      required: ["text", "target_lang"]
    },
    output: {
      type: "object",
      contentType: "application/json",
      properties: {
        translated_text: {
          type: "string"
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors() {
    this.tensors = [
      new Tensor("str", [this.preProcessedInputs.text], {
        shape: [1, 1],
        name: "text"
      }),
      new Tensor("str", [this.preProcessedInputs.source_lang || "en"], {
        shape: [1, 1],
        name: "source_lang"
      }),
      new Tensor("str", [this.preProcessedInputs.target_lang], {
        shape: [1, 1],
        name: "target_lang"
      })
    ];
  }
  postProcessing(response) {
    this.postProcessedOutputs = { translated_text: response.name.value[0] };
  }
};
var AiSpeechRecognition = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      oneOf: [
        { type: "string", format: "binary" },
        {
          type: "object",
          properties: {
            audio: {
              type: "array",
              items: {
                type: "number"
              }
            }
          }
        }
      ]
    },
    output: {
      type: "object",
      contentType: "application/json",
      properties: {
        text: {
          type: "string"
        },
        word_count: {
          type: "number"
        },
        words: {
          type: "array",
          items: {
            type: "object",
            properties: {
              word: {
                type: "string"
              },
              start: {
                type: "number"
              },
              end: {
                type: "number"
              }
            }
          }
        }
      },
      required: ["text"]
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors() {
    this.tensors = [
      new Tensor("uint8", this.preProcessedInputs.audio, {
        shape: [1, this.preProcessedInputs.audio.length],
        name: "audio"
      })
    ];
  }
  postProcessing(response) {
    if (this.modelSettings.postProcessingFunc) {
      this.postProcessedOutputs = this.modelSettings.postProcessingFunc(response);
    } else {
      this.postProcessedOutputs = { text: response.name.value[0].trim() };
    }
  }
};
var resnetLabels = [
  "TENCH",
  "GOLDFISH",
  "WHITE SHARK",
  "TIGER SHARK",
  "HAMMERHEAD SHARK",
  "ELECTRIC RAY",
  "STINGRAY",
  "ROOSTER",
  "HEN",
  "OSTRICH",
  "BRAMBLING",
  "GOLDFINCH",
  "HOUSE FINCH",
  "SNOWBIRD",
  "INDIGO FINCH",
  "ROBIN",
  "BULBUL",
  "JAY",
  "MAGPIE",
  "CHICKADEE",
  "WATER OUZEL",
  "KITE",
  "BALD EAGLE",
  "VULTURE",
  "GREAT GREY OWL",
  "FIRE SALAMANDER",
  "NEWT",
  "EFT",
  "SPOTTED SALAMANDER",
  "AXOLOTL",
  "BULL FROG",
  "TREE FROG",
  "TAILED FROG",
  "LOGGERHEAD",
  "LEATHERBACK TURTLE",
  "MUD TURTLE",
  "TERRAPIN",
  "BOX TURTLE",
  "BANDED GECKO",
  "COMMON IGUANA",
  "AMERICAN CHAMELEON",
  "WHIPTAIL",
  "AGAMA",
  "FRILLED LIZARD",
  "ALLIGATOR LIZARD",
  "GILA MONSTER",
  "GREEN LIZARD",
  "AFRICAN CHAMELEON",
  "KOMODO DRAGON",
  "AFRICAN CROCODILE",
  "AMERICAN ALLIGATOR",
  "TRICERATOPS",
  "THUNDER SNAKE",
  "RINGNECK SNAKE",
  "HOGNOSE SNAKE",
  "GREEN SNAKE",
  "KING SNAKE",
  "GARTER SNAKE",
  "WATER SNAKE",
  "VINE SNAKE",
  "NIGHT SNAKE",
  "BOA",
  "ROCK PYTHON",
  "COBRA",
  "GREEN MAMBA",
  "SEA SNAKE",
  "HORNED VIPER",
  "DIAMONDBACK",
  "SIDEWINDER",
  "TRILOBITE",
  "HARVESTMAN",
  "SCORPION",
  "GARDEN SPIDER",
  "BARN SPIDER",
  "GARDEN SPIDER",
  "BLACK WIDOW",
  "TARANTULA",
  "WOLF SPIDER",
  "TICK",
  "CENTIPEDE",
  "GROUSE",
  "PTARMIGAN",
  "RUFFED GROUSE",
  "PRAIRIE CHICKEN",
  "PEACOCK",
  "QUAIL",
  "PARTRIDGE",
  "AFRICAN GREY",
  "MACAW",
  "COCKATOO",
  "LORIKEET",
  "COUCAL",
  "BEE EATER",
  "HORNBILL",
  "HUMMINGBIRD",
  "JACAMAR",
  "TOUCAN",
  "DRAKE",
  "MERGANSER",
  "GOOSE",
  "BLACK SWAN",
  "TUSKER",
  "ECHIDNA",
  "PLATYPUS",
  "WALLABY",
  "KOALA",
  "WOMBAT",
  "JELLYFISH",
  "SEA ANEMONE",
  "BRAIN CORAL",
  "FLATWORM",
  "NEMATODE",
  "CONCH",
  "SNAIL",
  "SLUG",
  "SEA SLUG",
  "CHITON",
  "CHAMBERED NAUTILUS",
  "DUNGENESS CRAB",
  "ROCK CRAB",
  "FIDDLER CRAB",
  "KING CRAB",
  "AMERICAN LOBSTER",
  "SPINY LOBSTER",
  "CRAYFISH",
  "HERMIT CRAB",
  "ISOPOD",
  "WHITE STORK",
  "BLACK STORK",
  "SPOONBILL",
  "FLAMINGO",
  "LITTLE BLUE HERON",
  "AMERICAN EGRET",
  "BITTERN",
  "CRANE",
  "LIMPKIN",
  "EUROPEAN GALLINULE",
  "AMERICAN COOT",
  "BUSTARD",
  "RUDDY TURNSTONE",
  "RED-BACKED SANDPIPER",
  "REDSHANK",
  "DOWITCHER",
  "OYSTERCATCHER",
  "PELICAN",
  "KING PENGUIN",
  "ALBATROSS",
  "GREY WHALE",
  "KILLER WHALE",
  "DUGONG",
  "SEA LION",
  "CHIHUAHUA",
  "JAPANESE SPANIEL",
  "MALTESE DOG",
  "PEKINESE",
  "SHIH-TZU",
  "BLENHEIM SPANIEL",
  "PAPILLON",
  "TOY TERRIER",
  "RHODESIAN RIDGEBACK",
  "AFGHAN HOUND",
  "BASSET",
  "BEAGLE",
  "BLOODHOUND",
  "BLUETICK",
  "COONHOUND",
  "WALKER HOUND",
  "ENGLISH FOXHOUND",
  "REDBONE",
  "BORZOI",
  "IRISH WOLFHOUND",
  "ITALIAN GREYHOUND",
  "WHIPPET",
  "IBIZAN HOUND",
  "NORWEGIAN ELKHOUND",
  "OTTERHOUND",
  "SALUKI",
  "SCOTTISH DEERHOUND",
  "WEIMARANER",
  "STAFFORDSHIRE BULLTERRIER",
  "STAFFORDSHIRE TERRIER",
  "BEDLINGTON TERRIER",
  "BORDER TERRIER",
  "KERRY BLUE TERRIER",
  "IRISH TERRIER",
  "NORFOLK TERRIER",
  "NORWICH TERRIER",
  "YORKSHIRE TERRIER",
  "WIRE-HAIRED FOX TERRIER",
  "LAKELAND TERRIER",
  "SEALYHAM TERRIER",
  "AIREDALE",
  "CAIRN",
  "AUSTRALIAN TERRIER",
  "DANDIE DINMONT",
  "BOSTON BULL",
  "MINIATURE SCHNAUZER",
  "GIANT SCHNAUZER",
  "STANDARD SCHNAUZER",
  "SCOTCH TERRIER",
  "TIBETAN TERRIER",
  "SILKY TERRIER",
  "WHEATEN TERRIER",
  "WHITE TERRIER",
  "LHASA",
  "RETRIEVER",
  "CURLY-COATED RETRIEVER",
  "GOLDEN RETRIEVER",
  "LABRADOR RETRIEVER",
  "CHESAPEAKE BAY RETRIEVER",
  "SHORT-HAIRED POINTER",
  "VISLA",
  "ENGLISH SETTER",
  "IRISH SETTER",
  "GORDON SETTER",
  "BRITTANY SPANIEL",
  "CLUMBER",
  "ENGLISH SPRINGER",
  "WELSH SPRINGER SPANIEL",
  "COCKER SPANIEL",
  "SUSSEX SPANIEL",
  "IRISH WATERSPANIEL",
  "KUVASZ",
  "SCHIPPERKE",
  "GROENENDAEL",
  "MALINOIS",
  "BRIARD",
  "KELPIE",
  "KOMONDOR",
  "OLD ENGLISH SHEEPDOG",
  "SHETLAND SHEEPDOG",
  "COLLIE",
  "BORDER COLLIE",
  "BOUVIER DES FLANDRES",
  "ROTTWEILER",
  "GERMAN SHEPHERD",
  "DOBERMAN",
  "MINIATURE PINSCHER",
  "GREATER SWISS MOUNTAIN DOG",
  "BERNESE MOUNTAIN DOG",
  "APPENZELLER",
  "ENTLEBUCHER",
  "BOXER",
  "BULL MASTIFF",
  "TIBETAN MASTIFF",
  "FRENCH BULLDOG",
  "GREAT DANE",
  "SAINT BERNARD",
  "ESKIMO DOG",
  "MALAMUTE",
  "SIBERIAN HUSKY",
  "DALMATIAN",
  "AFFENPINSCHER",
  "BASENJI",
  "PUG",
  "LEONBERG",
  "NEWFOUNDLAND",
  "GREAT PYRENEES",
  "SAMOYED",
  "POMERANIAN",
  "CHOW",
  "KEESHOND",
  "BRABANCON GRIFFON",
  "PEMBROKE",
  "CARDIGAN",
  "TOY POODLE",
  "MINIATURE POODLE",
  "STANDARD POODLE",
  "MEXICAN HAIRLESS",
  "TIMBER WOLF",
  "WHITE WOLF",
  "RED WOLF",
  "COYOTE",
  "DINGO",
  "DHOLE",
  "AFRICAN HUNTING DOG",
  "HYENA",
  "RED FOX",
  "KIT FOX",
  "ARCTIC FOX",
  "GREY FOX",
  "TABBY",
  "TIGER CAT",
  "PERSIAN CAT",
  "SIAMESE CAT",
  "EGYPTIAN CAT",
  "COUGAR",
  "LYNX",
  "LEOPARD",
  "SNOW LEOPARD",
  "JAGUAR",
  "LION",
  "TIGER",
  "CHEETAH",
  "BROWN BEAR",
  "AMERICAN BLACK BEAR",
  "ICE BEAR",
  "SLOTH BEAR",
  "MONGOOSE",
  "MEERKAT",
  "TIGER BEETLE",
  "LADYBUG",
  "GROUND BEETLE",
  "LONG-HORNED BEETLE",
  "LEAF BEETLE",
  "DUNG BEETLE",
  "RHINOCEROS BEETLE",
  "WEEVIL",
  "FLY",
  "BEE",
  "ANT",
  "GRASSHOPPER",
  "CRICKET",
  "WALKING STICK",
  "COCKROACH",
  "MANTIS",
  "CICADA",
  "LEAFHOPPER",
  "LACEWING",
  "DRAGONFLY",
  "DAMSELFLY",
  "ADMIRAL",
  "RINGLET",
  "MONARCH",
  "CABBAGE BUTTERFLY",
  "SULPHUR BUTTERFLY",
  "LYCAENID",
  "STARFISH",
  "SEA URCHIN",
  "SEA CUCUMBER",
  "WOOD RABBIT",
  "HARE",
  "ANGORA",
  "HAMSTER",
  "PORCUPINE",
  "FOX SQUIRREL",
  "MARMOT",
  "BEAVER",
  "GUINEA PIG",
  "SORREL",
  "ZEBRA",
  "HOG",
  "WILD BOAR",
  "WARTHOG",
  "HIPPOPOTAMUS",
  "OX",
  "WATER BUFFALO",
  "BISON",
  "RAM",
  "BIGHORN",
  "IBEX",
  "HARTEBEEST",
  "IMPALA",
  "GAZELLE",
  "ARABIAN CAMEL",
  "LLAMA",
  "WEASEL",
  "MINK",
  "POLECAT",
  "BLACK-FOOTED FERRET",
  "OTTER",
  "SKUNK",
  "BADGER",
  "ARMADILLO",
  "THREE-TOED SLOTH",
  "ORANGUTAN",
  "GORILLA",
  "CHIMPANZEE",
  "GIBBON",
  "SIAMANG",
  "GUENON",
  "PATAS",
  "BABOON",
  "MACAQUE",
  "LANGUR",
  "COLOBUS",
  "PROBOSCIS MONKEY",
  "MARMOSET",
  "CAPUCHIN",
  "HOWLER MONKEY",
  "TITI",
  "SPIDER MONKEY",
  "SQUIRREL MONKEY",
  "MADAGASCAR CAT",
  "INDRI",
  "INDIAN ELEPHANT",
  "AFRICAN ELEPHANT",
  "LESSER PANDA",
  "GIANT PANDA",
  "BARRACOUTA",
  "EEL",
  "COHO",
  "ROCK BEAUTY",
  "ANEMONE FISH",
  "STURGEON",
  "GAR",
  "LIONFISH",
  "PUFFER",
  "ABACUS",
  "ABAYA",
  "ACADEMIC GOWN",
  "ACCORDION",
  "ACOUSTIC GUITAR",
  "AIRCRAFT CARRIER",
  "AIRLINER",
  "AIRSHIP",
  "ALTAR",
  "AMBULANCE",
  "AMPHIBIAN",
  "ANALOG CLOCK",
  "APIARY",
  "APRON",
  "ASHCAN",
  "ASSAULT RIFLE",
  "BACKPACK",
  "BAKERY",
  "BALANCE BEAM",
  "BALLOON",
  "BALLPOINT",
  "BAND AID",
  "BANJO",
  "BANNISTER",
  "BARBELL",
  "BARBER CHAIR",
  "BARBERSHOP",
  "BARN",
  "BAROMETER",
  "BARREL",
  "BARROW",
  "BASEBALL",
  "BASKETBALL",
  "BASSINET",
  "BASSOON",
  "BATHING CAP",
  "BATH TOWEL",
  "BATHTUB",
  "BEACH WAGON",
  "BEACON",
  "BEAKER",
  "BEARSKIN",
  "BEER BOTTLE",
  "BEER GLASS",
  "BELL COTE",
  "BIB",
  "BICYCLE-BUILT-FOR-TWO",
  "BIKINI",
  "BINDER",
  "BINOCULARS",
  "BIRDHOUSE",
  "BOATHOUSE",
  "BOBSLED",
  "BOLO TIE",
  "BONNET",
  "BOOKCASE",
  "BOOKSHOP",
  "BOTTLECAP",
  "BOW",
  "BOW TIE",
  "BRASS",
  "BRASSIERE",
  "BREAKWATER",
  "BREASTPLATE",
  "BROOM",
  "BUCKET",
  "BUCKLE",
  "BULLETPROOF VEST",
  "BULLET TRAIN",
  "BUTCHER SHOP",
  "CAB",
  "CALDRON",
  "CANDLE",
  "CANNON",
  "CANOE",
  "CAN OPENER",
  "CARDIGAN",
  "CAR MIRROR",
  "CAROUSEL",
  "CARPENTERS KIT",
  "CARTON",
  "CAR WHEEL",
  "CASH MACHINE",
  "CASSETTE",
  "CASSETTE PLAYER",
  "CASTLE",
  "CATAMARAN",
  "CD PLAYER",
  "CELLO",
  "CELLULAR TELEPHONE",
  "CHAIN",
  "CHAINLINK FENCE",
  "CHAIN MAIL",
  "CHAIN SAW",
  "CHEST",
  "CHIFFONIER",
  "CHIME",
  "CHINA CABINET",
  "CHRISTMAS STOCKING",
  "CHURCH",
  "CINEMA",
  "CLEAVER",
  "CLIFF DWELLING",
  "CLOAK",
  "CLOG",
  "COCKTAIL SHAKER",
  "COFFEE MUG",
  "COFFEEPOT",
  "COIL",
  "COMBINATION LOCK",
  "COMPUTER KEYBOARD",
  "CONFECTIONERY",
  "CONTAINER SHIP",
  "CONVERTIBLE",
  "CORKSCREW",
  "CORNET",
  "COWBOY BOOT",
  "COWBOY HAT",
  "CRADLE",
  "CRANE",
  "CRASH HELMET",
  "CRATE",
  "CRIB",
  "CROCK POT",
  "CROQUET BALL",
  "CRUTCH",
  "CUIRASS",
  "DAM",
  "DESK",
  "DESKTOP COMPUTER",
  "DIAL TELEPHONE",
  "DIAPER",
  "DIGITAL CLOCK",
  "DIGITAL WATCH",
  "DINING TABLE",
  "DISHRAG",
  "DISHWASHER",
  "DISK BRAKE",
  "DOCK",
  "DOGSLED",
  "DOME",
  "DOORMAT",
  "DRILLING PLATFORM",
  "DRUM",
  "DRUMSTICK",
  "DUMBBELL",
  "DUTCH OVEN",
  "ELECTRIC FAN",
  "ELECTRIC GUITAR",
  "ELECTRIC LOCOMOTIVE",
  "ENTERTAINMENT CENTER",
  "ENVELOPE",
  "ESPRESSO MAKER",
  "FACE POWDER",
  "FEATHER BOA",
  "FILE",
  "FIREBOAT",
  "FIRE ENGINE",
  "FIRE SCREEN",
  "FLAGPOLE",
  "FLUTE",
  "FOLDING CHAIR",
  "FOOTBALL HELMET",
  "FORKLIFT",
  "FOUNTAIN",
  "FOUNTAIN PEN",
  "FOUR-POSTER",
  "FREIGHT CAR",
  "FRENCH HORN",
  "FRYING PAN",
  "FUR COAT",
  "GARBAGE TRUCK",
  "GASMASK",
  "GAS PUMP",
  "GOBLET",
  "GO-KART",
  "GOLF BALL",
  "GOLFCART",
  "GONDOLA",
  "GONG",
  "GOWN",
  "GRAND PIANO",
  "GREENHOUSE",
  "GRILLE",
  "GROCERY STORE",
  "GUILLOTINE",
  "HAIR SLIDE",
  "HAIR SPRAY",
  "HALF TRACK",
  "HAMMER",
  "HAMPER",
  "HAND BLOWER",
  "HAND-HELD COMPUTER",
  "HANDKERCHIEF",
  "HARD DISC",
  "HARMONICA",
  "HARP",
  "HARVESTER",
  "HATCHET",
  "HOLSTER",
  "HOME THEATER",
  "HONEYCOMB",
  "HOOK",
  "HOOPSKIRT",
  "HORIZONTAL BAR",
  "HORSE CART",
  "HOURGLASS",
  "IPOD",
  "IRON",
  "JACK-O-LANTERN",
  "JEAN",
  "JEEP",
  "JERSEY",
  "JIGSAW PUZZLE",
  "JINRIKISHA",
  "JOYSTICK",
  "KIMONO",
  "KNEE PAD",
  "KNOT",
  "LAB COAT",
  "LADLE",
  "LAMPSHADE",
  "LAPTOP",
  "LAWN MOWER",
  "LENS CAP",
  "LETTER OPENER",
  "LIBRARY",
  "LIFEBOAT",
  "LIGHTER",
  "LIMOUSINE",
  "LINER",
  "LIPSTICK",
  "LOAFER",
  "LOTION",
  "LOUDSPEAKER",
  "LOUPE",
  "LUMBERMILL",
  "MAGNETIC COMPASS",
  "MAILBAG",
  "MAILBOX",
  "MAILLOT",
  "MAILLOT",
  "MANHOLE COVER",
  "MARACA",
  "MARIMBA",
  "MASK",
  "MATCHSTICK",
  "MAYPOLE",
  "MAZE",
  "MEASURING CUP",
  "MEDICINE CHEST",
  "MEGALITH",
  "MICROPHONE",
  "MICROWAVE",
  "MILITARY UNIFORM",
  "MILK CAN",
  "MINIBUS",
  "MINISKIRT",
  "MINIVAN",
  "MISSILE",
  "MITTEN",
  "MIXING BOWL",
  "MOBILE HOME",
  "MODEL T",
  "MODEM",
  "MONASTERY",
  "MONITOR",
  "MOPED",
  "MORTAR",
  "MORTARBOARD",
  "MOSQUE",
  "MOSQUITO NET",
  "MOTOR SCOOTER",
  "MOUNTAIN BIKE",
  "MOUNTAIN TENT",
  "MOUSE",
  "MOUSETRAP",
  "MOVING VAN",
  "MUZZLE",
  "NAIL",
  "NECK BRACE",
  "NECKLACE",
  "NIPPLE",
  "NOTEBOOK",
  "OBELISK",
  "OBOE",
  "OCARINA",
  "ODOMETER",
  "OIL FILTER",
  "ORGAN",
  "OSCILLOSCOPE",
  "OVERSKIRT",
  "OXCART",
  "OXYGEN MASK",
  "PACKET",
  "PADDLE",
  "PADDLEWHEEL",
  "PADLOCK",
  "PAINTBRUSH",
  "PAJAMA",
  "PALACE",
  "PANPIPE",
  "PAPER TOWEL",
  "PARACHUTE",
  "PARALLEL BARS",
  "PARK BENCH",
  "PARKING METER",
  "PASSENGER CAR",
  "PATIO",
  "PAY-PHONE",
  "PEDESTAL",
  "PENCIL BOX",
  "PENCIL SHARPENER",
  "PERFUME",
  "PETRI DISH",
  "PHOTOCOPIER",
  "PICK",
  "PICKELHAUBE",
  "PICKET FENCE",
  "PICKUP",
  "PIER",
  "PIGGY BANK",
  "PILL BOTTLE",
  "PILLOW",
  "PING-PONG BALL",
  "PINWHEEL",
  "PIRATE",
  "PITCHER",
  "PLANE",
  "PLANETARIUM",
  "PLASTIC BAG",
  "PLATE RACK",
  "PLOW",
  "PLUNGER",
  "POLAROID CAMERA",
  "POLE",
  "POLICE VAN",
  "PONCHO",
  "POOL TABLE",
  "POP BOTTLE",
  "POT",
  "POTTERS WHEEL",
  "POWER DRILL",
  "PRAYER RUG",
  "PRINTER",
  "PRISON",
  "PROJECTILE",
  "PROJECTOR",
  "PUCK",
  "PUNCHING BAG",
  "PURSE",
  "QUILL",
  "QUILT",
  "RACER",
  "RACKET",
  "RADIATOR",
  "RADIO",
  "RADIO TELESCOPE",
  "RAIN BARREL",
  "RECREATIONAL VEHICLE",
  "REEL",
  "REFLEX CAMERA",
  "REFRIGERATOR",
  "REMOTE CONTROL",
  "RESTAURANT",
  "REVOLVER",
  "RIFLE",
  "ROCKING CHAIR",
  "ROTISSERIE",
  "RUBBER ERASER",
  "RUGBY BALL",
  "RULE",
  "RUNNING SHOE",
  "SAFE",
  "SAFETY PIN",
  "SALTSHAKER",
  "SANDAL",
  "SARONG",
  "SAX",
  "SCABBARD",
  "SCALE",
  "SCHOOL BUS",
  "SCHOONER",
  "SCOREBOARD",
  "SCREEN",
  "SCREW",
  "SCREWDRIVER",
  "SEAT BELT",
  "SEWING MACHINE",
  "SHIELD",
  "SHOE SHOP",
  "SHOJI",
  "SHOPPING BASKET",
  "SHOPPING CART",
  "SHOVEL",
  "SHOWER CAP",
  "SHOWER CURTAIN",
  "SKI",
  "SKI MASK",
  "SLEEPING BAG",
  "SLIDE RULE",
  "SLIDING DOOR",
  "SLOT",
  "SNORKEL",
  "SNOWMOBILE",
  "SNOWPLOW",
  "SOAP DISPENSER",
  "SOCCER BALL",
  "SOCK",
  "SOLAR DISH",
  "SOMBRERO",
  "SOUP BOWL",
  "SPACE BAR",
  "SPACE HEATER",
  "SPACE SHUTTLE",
  "SPATULA",
  "SPEEDBOAT",
  "SPIDER WEB",
  "SPINDLE",
  "SPORTS CAR",
  "SPOTLIGHT",
  "STAGE",
  "STEAM LOCOMOTIVE",
  "STEEL ARCH BRIDGE",
  "STEEL DRUM",
  "STETHOSCOPE",
  "STOLE",
  "STONE WALL",
  "STOPWATCH",
  "STOVE",
  "STRAINER",
  "STREETCAR",
  "STRETCHER",
  "STUDIO COUCH",
  "STUPA",
  "SUBMARINE",
  "SUIT",
  "SUNDIAL",
  "SUNGLASS",
  "SUNGLASSES",
  "SUNSCREEN",
  "SUSPENSION BRIDGE",
  "SWAB",
  "SWEATSHIRT",
  "SWIMMING TRUNKS",
  "SWING",
  "SWITCH",
  "SYRINGE",
  "TABLE LAMP",
  "TANK",
  "TAPE PLAYER",
  "TEAPOT",
  "TEDDY",
  "TELEVISION",
  "TENNIS BALL",
  "THATCH",
  "THEATER CURTAIN",
  "THIMBLE",
  "THRESHER",
  "THRONE",
  "TILE ROOF",
  "TOASTER",
  "TOBACCO SHOP",
  "TOILET SEAT",
  "TORCH",
  "TOTEM POLE",
  "TOW TRUCK",
  "TOYSHOP",
  "TRACTOR",
  "TRAILER TRUCK",
  "TRAY",
  "TRENCH COAT",
  "TRICYCLE",
  "TRIMARAN",
  "TRIPOD",
  "TRIUMPHAL ARCH",
  "TROLLEYBUS",
  "TROMBONE",
  "TUB",
  "TURNSTILE",
  "TYPEWRITER KEYBOARD",
  "UMBRELLA",
  "UNICYCLE",
  "UPRIGHT",
  "VACUUM",
  "VASE",
  "VAULT",
  "VELVET",
  "VENDING MACHINE",
  "VESTMENT",
  "VIADUCT",
  "VIOLIN",
  "VOLLEYBALL",
  "WAFFLE IRON",
  "WALL CLOCK",
  "WALLET",
  "WARDROBE",
  "WARPLANE",
  "WASHBASIN",
  "WASHER",
  "WATER BOTTLE",
  "WATER JUG",
  "WATER TOWER",
  "WHISKEY JUG",
  "WHISTLE",
  "WIG",
  "WINDOW SCREEN",
  "WINDOW SHADE",
  "WINDSOR TIE",
  "WINE BOTTLE",
  "WING",
  "WOK",
  "WOODEN SPOON",
  "WOOL",
  "WORM FENCE",
  "WRECK",
  "YAWL",
  "YURT",
  "WEB SITE",
  "COMIC BOOK",
  "CROSSWORD PUZZLE",
  "STREET SIGN",
  "TRAFFIC LIGHT",
  "BOOK JACKET",
  "MENU",
  "PLATE",
  "GUACAMOLE",
  "CONSOMME",
  "HOT POT",
  "TRIFLE",
  "ICE CREAM",
  "ICE LOLLY",
  "FRENCH LOAF",
  "BAGEL",
  "PRETZEL",
  "CHEESEBURGER",
  "HOTDOG",
  "MASHED POTATO",
  "HEAD CABBAGE",
  "BROCCOLI",
  "CAULIFLOWER",
  "ZUCCHINI",
  "SPAGHETTI SQUASH",
  "ACORN SQUASH",
  "BUTTERNUT SQUASH",
  "CUCUMBER",
  "ARTICHOKE",
  "BELL PEPPER",
  "CARDOON",
  "MUSHROOM",
  "GRANNY SMITH",
  "STRAWBERRY",
  "ORANGE",
  "LEMON",
  "FIG",
  "PINEAPPLE",
  "BANANA",
  "JACKFRUIT",
  "CUSTARD APPLE",
  "POMEGRANATE",
  "HAY",
  "CARBONARA",
  "CHOCOLATE SAUCE",
  "DOUGH",
  "MEAT LOAF",
  "PIZZA",
  "POTPIE",
  "BURRITO",
  "RED WINE",
  "ESPRESSO",
  "CUP",
  "EGGNOG",
  "ALP",
  "BUBBLE",
  "CLIFF",
  "CORAL REEF",
  "GEYSER",
  "LAKESIDE",
  "PROMONTORY",
  "SANDBAR",
  "SEASHORE",
  "VALLEY",
  "VOLCANO",
  "BALLPLAYER",
  "GROOM",
  "SCUBA DIVER",
  "RAPESEED",
  "DAISY",
  "LADY SLIPPER",
  "CORN",
  "ACORN",
  "HIP",
  "BUCKEYE",
  "CORAL FUNGUS",
  "AGARIC",
  "GYROMITRA",
  "STINKHORN",
  "EARTHSTAR",
  "HEN-OF-THE-WOODS",
  "BOLETE",
  "EAR",
  "TOILET TISSUE"
];
var AiImageClassification = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      oneOf: [
        { type: "string", format: "binary" },
        {
          type: "object",
          properties: {
            image: {
              type: "array",
              items: {
                type: "number"
              }
            }
          }
        }
      ]
    },
    output: {
      type: "array",
      contentType: "application/json",
      items: {
        type: "object",
        properties: {
          score: {
            type: "number"
          },
          label: {
            type: "string"
          }
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors() {
    this.tensors = [
      new Tensor("uint8", this.preProcessedInputs.image, {
        shape: [1, this.preProcessedInputs.image.length],
        name: "input"
      })
    ];
  }
  postProcessing(response) {
    const labels = [];
    const scores = response.output.value[0];
    for (var s in scores)
      labels.push({ label: resnetLabels[s], score: scores[s] });
    labels.sort((a, b) => {
      return b.score - a.score;
    });
    this.postProcessedOutputs = labels.slice(0, 5);
  }
};
var AiObjectDetection = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      oneOf: [
        { type: "string", format: "binary" },
        {
          type: "object",
          properties: {
            image: {
              type: "array",
              items: {
                type: "number"
              }
            }
          }
        }
      ]
    },
    output: {
      type: "array",
      contentType: "application/json",
      items: {
        type: "object",
        properties: {
          score: {
            type: "number"
          },
          label: {
            type: "string"
          },
          box: {
            type: "object",
            properties: {
              xmin: {
                type: "number"
              },
              ymin: {
                type: "number"
              },
              xmax: {
                type: "number"
              },
              ymax: {
                type: "number"
              }
            }
          }
        }
      }
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors() {
    this.tensors = [
      new Tensor("uint8", this.preProcessedInputs.image, {
        shape: [1, this.preProcessedInputs.image.length],
        name: "input"
      })
    ];
  }
  postProcessing(response) {
    const scores = response.scores.value[0].map((score, i) => {
      return {
        score,
        label: response.name.value[response.labels.value[0][i]],
        box: {
          xmin: response.boxes.value[0][i][0],
          ymin: response.boxes.value[0][i][1],
          xmax: response.boxes.value[0][i][2],
          ymax: response.boxes.value[0][i][3]
        }
      };
    });
    this.postProcessedOutputs = scores.sort((a, b) => {
      return b.score - a.score;
    });
  }
};
var AiTextToImage = class {
  modelSettings;
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      type: "object",
      properties: {
        prompt: {
          type: "string"
        },
        num_steps: {
          type: "integer",
          default: 20,
          maximum: 20
        }
      },
      required: ["prompt"]
    },
    output: {
      type: "string",
      contentType: "image/png",
      format: "binary"
    }
  };
  constructor(inputs, modelSettings2) {
    this.inputs = inputs;
    this.modelSettings = modelSettings2;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors() {
    this.tensors = [
      new Tensor("str", [this.preProcessedInputs.prompt], {
        shape: [1],
        name: "input_text"
      }),
      new Tensor("int32", [this.preProcessedInputs.num_steps], {
        shape: [1],
        name: "num_steps"
      })
    ];
  }
  postProcessing(response) {
    this.postProcessedOutputs = new Uint8Array(response.output_image.value);
  }
};
var AiSentenceSimilarity = class {
  inputs;
  preProcessedInputs;
  postProcessedOutputs;
  tensors;
  schema = {
    input: {
      type: "object",
      properties: {
        source: {
          type: "string"
        },
        sentences: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["source", "sentences"]
    },
    output: {
      type: "array",
      contentType: "application/json",
      items: {
        type: "number"
      }
    }
  };
  constructor(inputs) {
    this.inputs = inputs;
  }
  preProcessing() {
    this.preProcessedInputs = this.inputs;
  }
  generateTensors() {
    this.tensors = [
      new Tensor("str", [this.preProcessedInputs.source], {
        shape: [1],
        name: "source_sentence"
      }),
      new Tensor("str", this.preProcessedInputs.sentences, {
        shape: [this.preProcessedInputs.sentences.length],
        name: "sentences"
      })
    ];
  }
  postProcessing(response) {
    this.postProcessedOutputs = response.scores.value;
  }
};
var chatDefaultContext = "A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions.";
var codeDefaultContext = "Write code to solve the following coding problem that obeys the constraints and passes the example test cases. Please wrap your code answer using   ```:";
var modelMappings = {
  "text-classification": {
    models: ["@cf/huggingface/distilbert-sst-2-int8"],
    class: AiTextClassification,
    id: "19606750-23ed-4371-aab2-c20349b53a60"
  },
  "text-to-image": {
    models: ["@cf/stabilityai/stable-diffusion-xl-base-1.0", "@cf/runwayml/stable-diffusion-v1-5"],
    class: AiTextToImage,
    id: "3d6e1f35-341b-4915-a6c8-9a7142a9033a"
  },
  "sentence-similarity": {
    models: ["@hf/sentence-transformers/all-minilm-l6-v2"],
    class: AiSentenceSimilarity,
    id: "69bf4e84-441e-401a-bdfc-256fd54d0fff"
  },
  "text-embeddings": {
    models: [
      "@cf/baai/bge-small-en-v1.5",
      "@cf/baai/bge-base-en-v1.5",
      "@cf/baai/bge-large-en-v1.5",
      "@hf/baai/bge-base-en-v1.5"
    ],
    class: AiTextEmbeddings,
    id: "0137cdcf-162a-4108-94f2-1ca59e8c65ee"
  },
  "speech-recognition": {
    models: ["@cf/openai/whisper"],
    class: AiSpeechRecognition,
    id: "dfce1c48-2a81-462e-a7fd-de97ce985207"
  },
  "image-classification": {
    models: ["@cf/microsoft/resnet-50"],
    class: AiImageClassification,
    id: "00cd182b-bf30-4fc4-8481-84a3ab349657"
  },
  "object-detection": {
    models: ["@cf/facebook/detr-resnet-50"],
    class: AiObjectDetection,
    id: "9c178979-90d9-49d8-9e2c-0f1cf01815d4"
  },
  "text-generation": {
    models: [
      "@cf/meta/llama-2-7b-chat-int8",
      "@cf/mistral/mistral-7b-instruct-v0.1",
      "@cf/meta/llama-2-7b-chat-fp16",
      "@hf/thebloke/llama-2-13b-chat-awq",
      "@hf/thebloke/zephyr-7b-beta-awq",
      "@hf/thebloke/mistral-7b-instruct-v0.1-awq",
      "@hf/thebloke/codellama-7b-instruct-awq",
      "@hf/thebloke/openchat_3.5-awq",
      "@hf/thebloke/openhermes-2.5-mistral-7b-awq",
      "@hf/thebloke/starling-lm-7b-alpha-awq",
      "@hf/thebloke/orca-2-13b-awq",
      "@hf/thebloke/neural-chat-7b-v3-1-awq",
      "@hf/thebloke/llamaguard-7b-awq",
      "@hf/thebloke/deepseek-coder-6.7b-base-awq",
      "@hf/thebloke/deepseek-coder-6.7b-instruct-awq"
    ],
    class: AiTextGeneration,
    id: "c329a1f9-323d-4e91-b2aa-582dd4188d34"
  },
  translation: {
    models: ["@cf/meta/m2m100-1.2b"],
    class: AiTranslation,
    id: "f57d07cb-9087-487a-bbbf-bc3e17fecc4b"
  }
};
var tgiPostProc = (response, ignoreTokens) => {
  let r = response["generated_text"].value[0];
  if (ignoreTokens) {
    for (var i in ignoreTokens)
      r = r.replace(ignoreTokens[i], "");
  }
  return r;
};
var modelSettings = {
  "@hf/sentence-transformers/all-minilm-l6-v2": {
    experimental: true
  },
  "@hf/baai/bge-base-en-v1.5": {
    postProcessingFunc: (r) => {
      return {
        shape: r.data.shape,
        data: r.data.value
      };
    }
  },
  "@hf/thebloke/deepseek-coder-6.7b-instruct-awq": {
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "deepseek",
      defaultContext: codeDefaultContext
    },
    postProcessingFunc: (r) => tgiPostProc(r, ["<|EOT|>"]),
    postProcessingFuncStream: (r) => tgiPostProc(r, ["<|EOT|>"])
  },
  "@hf/thebloke/deepseek-coder-6.7b-base-awq": {
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "bare",
      defaultContext: codeDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@hf/thebloke/llamaguard-7b-awq": {
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "inst",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@hf/thebloke/openchat_3.5-awq": {
    experimental: true,
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "openchat",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@hf/thebloke/openhermes-2.5-mistral-7b-awq": {
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "chatml",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: (r) => tgiPostProc(r, ["<|im_end|>"]),
    postProcessingFuncStream: (r) => tgiPostProc(r, ["<|im_end|>"])
  },
  "@hf/thebloke/starling-lm-7b-alpha-awq": {
    experimental: true,
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "openchat",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: (r) => tgiPostProc(r, ["<|end_of_turn|>"]),
    postProcessingFuncStream: (r) => tgiPostProc(r, ["<|end_of_turn|>"])
  },
  "@hf/thebloke/orca-2-13b-awq": {
    experimental: true,
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "chatml",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@hf/thebloke/neural-chat-7b-v3-1-awq": {
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "orca-hashes",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@hf/thebloke/llama-2-13b-chat-awq": {
    inputsDefaultsStream: {
      max_tokens: 512
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "llama2",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@hf/thebloke/zephyr-7b-beta-awq": {
    inputsDefaultsStream: {
      max_tokens: 596
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "zephyr",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@hf/thebloke/mistral-7b-instruct-v0.1-awq": {
    inputsDefaultsStream: {
      max_tokens: 596
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "mistral-instruct",
      defaultContext: chatDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@hf/thebloke/codellama-7b-instruct-awq": {
    inputsDefaultsStream: {
      max_tokens: 596
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "llama2",
      defaultContext: codeDefaultContext
    },
    postProcessingFunc: tgiPostProc,
    postProcessingFuncStream: tgiPostProc
  },
  "@cf/meta/llama-2-7b-chat-fp16": {
    inputsDefaultsStream: {
      max_tokens: 2500
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "llama2",
      defaultContext: chatDefaultContext
    }
  },
  "@cf/meta/llama-2-7b-chat-int8": {
    inputsDefaultsStream: {
      max_tokens: 1800
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "llama2",
      defaultContext: chatDefaultContext
    }
  },
  "@cf/openai/whisper": {
    postProcessingFunc: (response) => {
      if (response["word_count"]) {
        return {
          text: response["name"].value.join("").trim(),
          word_count: parseInt(response["word_count"].value),
          words: response["name"].value.map((w, i) => {
            return {
              word: w.trim(),
              start: response["timestamps"].value[0][i][0],
              end: response["timestamps"].value[0][i][1]
            };
          })
        };
      } else {
        return {
          text: response["name"].value.join("").trim()
        };
      }
    }
  },
  "@cf/mistral/mistral-7b-instruct-v0.1": {
    inputsDefaultsStream: {
      max_tokens: 1800
    },
    inputsDefaults: {
      max_tokens: 256
    },
    preProcessingArgs: {
      promptTemplate: "mistral-instruct",
      defaultContext: chatDefaultContext
    }
  }
};
var addModel = (task, model, settings) => {
  modelMappings[task].models.push(model);
  modelSettings[model] = settings;
};
var debugLog = (dd, what, args) => {
  if (dd) {
    console.log(`\x1B[1m${what}`);
    if (args[0] !== false) {
      if (typeof args == "object" || Array.isArray(args)) {
        const json = JSON.stringify(args);
        console.log(json.length > 512 ? `${json.substring(0, 512)}...` : json);
      } else {
        console.log(args);
      }
    }
  }
};
var parseInputs = (inputs) => {
  if (Array.isArray(inputs)) {
    return inputs.map((input) => input.toJSON());
  }
  if (inputs !== null && typeof inputs === "object") {
    return Object.keys(inputs).map((key) => {
      let tensor = inputs[key].toJSON();
      tensor.name = key;
      return tensor;
    });
  }
  throw new Error(`invalid inputs, must be Array<Tensor<any>> | TensorsObject`);
};
var tensorByName = (result) => {
  const outputByName = {};
  for (let i = 0, len = result.length; i < len; i++) {
    const tensor = Tensor.fromJSON(result[i]);
    const name = tensor.name || "output" + i;
    outputByName[name] = tensor;
  }
  return outputByName;
};
var getModelSettings = (model, key) => {
  const models = Object.keys(modelSettings);
  for (var m in models) {
    if (models[m] == model) {
      return key ? modelSettings[models[m]][key] : modelSettings[models[m]];
    }
  }
  return false;
};
var EventSourceParserStream = class extends TransformStream {
  constructor() {
    let parser;
    super({
      start(controller) {
        parser = createParser((event) => {
          if (event.type === "event") {
            controller.enqueue(event);
          }
        });
      },
      transform(chunk) {
        parser.feed(chunk);
      }
    });
  }
};
var BOM = [239, 187, 191];
function hasBom(buffer) {
  return BOM.every((charCode, index) => buffer.charCodeAt(index) === charCode);
}
function createParser(onParse) {
  let isFirstChunk;
  let buffer;
  let startingPosition;
  let startingFieldLength;
  let eventId;
  let eventName;
  let data;
  reset();
  return { feed, reset };
  function reset() {
    isFirstChunk = true;
    buffer = "";
    startingPosition = 0;
    startingFieldLength = -1;
    eventId = void 0;
    eventName = void 0;
    data = "";
  }
  function feed(chunk) {
    buffer = buffer ? buffer + chunk : chunk;
    if (isFirstChunk && hasBom(buffer)) {
      buffer = buffer.slice(BOM.length);
    }
    isFirstChunk = false;
    const length = buffer.length;
    let position = 0;
    let discardTrailingNewline = false;
    while (position < length) {
      if (discardTrailingNewline) {
        if (buffer[position] === "\n") {
          ++position;
        }
        discardTrailingNewline = false;
      }
      let lineLength = -1;
      let fieldLength = startingFieldLength;
      let character;
      for (let index = startingPosition; lineLength < 0 && index < length; ++index) {
        character = buffer[index];
        if (character === ":" && fieldLength < 0) {
          fieldLength = index - position;
        } else if (character === "\r") {
          discardTrailingNewline = true;
          lineLength = index - position;
        } else if (character === "\n") {
          lineLength = index - position;
        }
      }
      if (lineLength < 0) {
        startingPosition = length - position;
        startingFieldLength = fieldLength;
        break;
      } else {
        startingPosition = 0;
        startingFieldLength = -1;
      }
      parseEventStreamLine(buffer, position, fieldLength, lineLength);
      position += lineLength + 1;
    }
    if (position === length) {
      buffer = "";
    } else if (position > 0) {
      buffer = buffer.slice(position);
    }
  }
  function parseEventStreamLine(lineBuffer, index, fieldLength, lineLength) {
    if (lineLength === 0) {
      if (data.length > 0) {
        onParse({
          type: "event",
          id: eventId,
          event: eventName || void 0,
          data: data.slice(0, -1)
        });
        data = "";
        eventId = void 0;
      }
      eventName = void 0;
      return;
    }
    const noValue = fieldLength < 0;
    const field = lineBuffer.slice(index, index + (noValue ? lineLength : fieldLength));
    let step = 0;
    if (noValue) {
      step = lineLength;
    } else if (lineBuffer[index + fieldLength + 1] === " ") {
      step = fieldLength + 2;
    } else {
      step = fieldLength + 1;
    }
    const position = index + step;
    const valueLength = lineLength - step;
    const value = lineBuffer.slice(position, position + valueLength).toString();
    if (field === "data") {
      data += value ? `${value}
` : "\n";
    } else if (field === "event") {
      eventName = value;
    } else if (field === "id" && !value.includes("\0")) {
      eventId = value;
    } else if (field === "retry") {
      const retry = parseInt(value, 10);
      if (!Number.isNaN(retry)) {
        onParse({ type: "reconnect-interval", value: retry });
      }
    }
  }
}
var ResultStream = class extends TransformStream {
  constructor() {
    super({
      transform(chunk, controller) {
        if (chunk.data === "[DONE]") {
          return;
        }
        try {
          const data = JSON.parse(chunk.data);
          controller.enqueue(data);
        } catch (err) {
          console.error(`failed to parse incoming data (${err.stack}): ${chunk.data}`);
          return;
        }
      }
    });
  }
};
var getEventStream = (body) => {
  const { readable, writable } = new TransformStream();
  const eventStream = (body ?? new ReadableStream()).pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).pipeThrough(new ResultStream());
  const reader = eventStream.getReader();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const write = async (data) => {
    await writer.write(encoder.encode(data));
  };
  return {
    readable,
    reader,
    writer,
    write
  };
};
var readStream = (body, debug, ctx, tensorData, postProcessing) => {
  const { readable, reader, writer, write } = getEventStream(body);
  const waitUntil = ctx && ctx.waitUntil ? (f) => ctx.waitUntil(f()) : (f) => f();
  waitUntil(async () => {
    try {
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) {
          await write("data: [DONE]\n\n");
          break;
        }
        debugLog(debug, "stream response", value);
        if (tensorData) {
          const output = tensorByName(value.result);
          await write(`data: ${JSON.stringify(postProcessing ? postProcessing(output) : output)}

`);
        } else {
          await write(`data: ${JSON.stringify(value)}

`);
        }
      }
    } catch (e) {
      console.error(e.stack);
      await write("an unknown error occurred while streaming");
    }
    await writer.close();
  });
  return readable;
};
var InferenceUpstreamError = class extends Error {
  httpCode;
  constructor(message, httpCode) {
    super(message);
    this.name = "InferenceUpstreamError";
    this.httpCode = httpCode;
  }
};
var InferenceSession = class {
  binding;
  model;
  options;
  constructor(binding, model, options = {}) {
    this.binding = binding;
    this.model = model;
    this.options = options;
  }
  async run(inputs, options) {
    const jsonInputs = parseInputs(inputs);
    const inferRequest = {
      input: jsonInputs,
      stream: false
    };
    if (options?.stream) {
      inferRequest.stream = options?.stream;
    }
    const body = JSON.stringify(inferRequest);
    const compressedReadableStream = new Response(body).body.pipeThrough(new CompressionStream("gzip"));
    const reqId = crypto.randomUUID();
    const fetchOptions = {
      method: "POST",
      body: compressedReadableStream,
      headers: {
        ...this.options?.extraHeaders || {},
        "content-encoding": "gzip",
        "cf-ai-req-id": reqId,
        "cf-consn-sdk-version": "1.0.50",
        "cf-consn-model-id": `${this.options.prefix ? `${this.options.prefix}:` : ""}${this.model}`
      }
    };
    const res = this.options.apiEndpoint ? await fetch(this.options.apiEndpoint, fetchOptions) : await this.binding.fetch("http://workers-binding.ai/run", fetchOptions);
    if (!res.ok) {
      throw new InferenceUpstreamError(await res.text(), res.status);
    }
    if (!options?.stream) {
      const { result } = await res.json();
      return tensorByName(result);
    } else {
      return readStream(res.body, this.options.debug, this.options.ctx, true, options.postProcessing);
    }
  }
};
var Ai = class {
  binding;
  options;
  task;
  constructor(binding, options = {}) {
    this.binding = binding;
    this.options = options;
  }
  addModel(task, model, settings) {
    addModel(task, model, settings);
  }
  async run(model, inputs) {
    const tasks = Object.keys(modelMappings);
    for (var t in tasks) {
      if (modelMappings[tasks[t]].models.indexOf(model) !== -1) {
        const settings = getModelSettings(model);
        const sessionOptions = this.options.sessionOptions || {};
        this.task = new modelMappings[tasks[t]].class(inputs, settings);
        debugLog(this.options.debug, "input", inputs);
        if (this.options.apiGateway) {
          const fetchOptions = {
            method: "POST",
            body: JSON.stringify(inputs),
            headers: {
              authorization: `Bearer ${this.options.apiToken}`,
              "content-type": "application/json"
            }
          };
          const res = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${this.options.apiAccount}/ai/run/${model}`,
            fetchOptions
          );
          if (!res.ok) {
            throw new Error(await res.text());
          }
          if (res.headers.get("content-type") == "application/json") {
            const { result } = await res.json();
            return result;
          } else if (res.headers.get("content-type") == "text/event-stream") {
            return readStream(res.body, this.options.debug, sessionOptions.ctx, false, false);
          } else {
            const blob = await res.blob();
            return blob;
          }
        } else {
          this.task.preProcessing();
          debugLog(this.options.debug, "pre-processed inputs", this.task.preProcessedInputs);
          this.task.generateTensors();
          debugLog(this.options.debug, "input tensors", this.task.tensors);
          const session = new InferenceSession(this.binding, model, {
            ...{ debug: this.options.debug ? true : false },
            ...sessionOptions
          });
          if (inputs.stream) {
            debugLog(this.options.debug, "streaming", false);
            return await session.run(this.task.tensors, {
              stream: true,
              postProcessing: (r) => {
                return this.task.postProcessingStream(r);
              }
            });
          } else {
            const response = await session.run(this.task.tensors);
            debugLog(this.options.debug, "response", response);
            this.task.postProcessing(response, sessionOptions.ctx);
            debugLog(this.options.debug, "post-processed response", this.task.postProcessedOutputs);
            return this.task.postProcessedOutputs;
          }
        }
      }
    }
    throw new Error(`No such model ${model} or task`);
  }
};

// src/index.tsx
import script from "./5ebcc740cd4560c6ad1a0804ac51da4455e0d3ec-script.js";
var app = new Hono2();
app.get("/script.js", (c) => {
  return c.body(script, 200, {
    "Content-Type": "text/javascript"
  });
});
app.get("/api/images", async (c) => {
  const keys = await getLastTenImageKeys(c.env.AIART);
  const imagePromises = keys.map((key) => c.env.AIART.get(key));
  const images = (await Promise.all(imagePromises)).filter(Boolean);
  return c.json(images);
});
app.get("*", renderer);
app.get("/", async (c) => {
  return c.render(
    /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("h2", { children: "What should the AI generated art be of?" }),
      /* @__PURE__ */ jsxDEV("form", { id: "input-form", autocomplete: "off", method: "post", children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            name: "query",
            style: {
              width: "69%"
            },
            autofocus: true
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "select",
          {
            name: "style",
            style: {
              width: "20%",
              margin: "0 0.5%"
            },
            children: [
              /* @__PURE__ */ jsxDEV("option", { value: "abstract", children: "Abstract" }),
              /* @__PURE__ */ jsxDEV("option", { value: "realistic", children: "Realistic" }),
              /* @__PURE__ */ jsxDEV("option", { value: "surrealistic", children: "Surrealistic" }),
              /* @__PURE__ */ jsxDEV("option", { value: "cubism", children: "Cubism" }),
              /* @__PURE__ */ jsxDEV("option", { value: "popart", children: "Pop Art" }),
              /* @__PURE__ */ jsxDEV("option", { value: "impressionism", children: "Impressionism" }),
              /* @__PURE__ */ jsxDEV("option", { value: "expressionism", children: "Expressionism" }),
              /* @__PURE__ */ jsxDEV("option", { value: "futurism", children: "Futurism" }),
              /* @__PURE__ */ jsxDEV("option", { value: "advertisement", children: "Advertisement" }),
              /* @__PURE__ */ jsxDEV("option", { value: "comic", children: "Comic" }),
              /* @__PURE__ */ jsxDEV("option", { value: "cartoon", children: "Cartoon" })
            ]
          }
        ),
        /* @__PURE__ */ jsxDEV("button", { type: "submit", children: "Create" })
      ] }),
      /* @__PURE__ */ jsxDEV(
        "pre",
        {
          id: "ai-content",
          style: {
            "white-space": "pre-wrap",
            "display": "none"
          }
        }
      ),
      /* @__PURE__ */ jsxDEV("h4", { id: "galleryTitle", children: "What people have already made \u{1F447}" }),
      /* @__PURE__ */ jsxDEV("div", { class: "block", id: "gallery", style: { display: "flex", flexWrap: "wrap", justifyContent: "space-between" } })
    ] })
  );
});
async function getLastTenImageKeys(kvStore) {
  const keys = await kvStore.list({ limit: 100, reverse: false });
  const randomKeys = keys.keys.map((entry) => entry.name).sort(() => Math.random() - 0.5).slice(0, 25);
  return randomKeys;
}
app.post("/ai", async (c) => {
  const json = await c.req.json();
  const prompt = json.prompt;
  const style = json.style;
  const ai = new Ai(c.env.AI);
  const inputs = {
    prompt: "cyberpunk cat"
  };
  const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", inputs);
  return new Response(response, {
    headers: {
      "content-type": "image/png"
    }
  });
  return c.render(
    /* @__PURE__ */ jsxDEV("img", { src: response })
  );
});
var src_default = app;
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
