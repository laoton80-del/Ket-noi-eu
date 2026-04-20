"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name4 in all)
    __defProp(target, name4, { get: all[name4], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../node_modules/@firebase/util/dist/postinstall.mjs
var getDefaultsFromPostinstall;
var init_postinstall = __esm({
  "../node_modules/@firebase/util/dist/postinstall.mjs"() {
    getDefaultsFromPostinstall = () => void 0;
  }
});

// ../node_modules/@firebase/util/dist/node-esm/index.node.esm.js
function getGlobal() {
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("Unable to locate global object.");
}
function isCloudWorkstation(url) {
  try {
    const host = url.startsWith("http://") || url.startsWith("https://") ? new URL(url).hostname : url;
    return host.endsWith(".cloudworkstations.dev");
  } catch (_a) {
    return false;
  }
}
async function pingServer(endpoint) {
  const result = await fetch(endpoint, {
    credentials: "include"
  });
  return result.ok;
}
function getEmulatorSummary() {
  const summary = {
    prod: [],
    emulator: []
  };
  for (const key of Object.keys(emulatorStatus)) {
    if (emulatorStatus[key]) {
      summary.emulator.push(key);
    } else {
      summary.prod.push(key);
    }
  }
  return summary;
}
function getOrCreateEl(id) {
  let parentDiv = document.getElementById(id);
  let created = false;
  if (!parentDiv) {
    parentDiv = document.createElement("div");
    parentDiv.setAttribute("id", id);
    created = true;
  }
  return { created, element: parentDiv };
}
function updateEmulatorBanner(name4, isRunningEmulator) {
  if (typeof window === "undefined" || typeof document === "undefined" || !isCloudWorkstation(window.location.host) || emulatorStatus[name4] === isRunningEmulator || emulatorStatus[name4] || // If already set to use emulator, can't go back to prod.
  previouslyDismissed) {
    return;
  }
  emulatorStatus[name4] = isRunningEmulator;
  function prefixedId(id) {
    return `__firebase__banner__${id}`;
  }
  const bannerId = "__firebase__banner";
  const summary = getEmulatorSummary();
  const showError = summary.prod.length > 0;
  function tearDown() {
    const element = document.getElementById(bannerId);
    if (element) {
      element.remove();
    }
  }
  function setupBannerStyles(bannerEl) {
    bannerEl.style.display = "flex";
    bannerEl.style.background = "#7faaf0";
    bannerEl.style.position = "fixed";
    bannerEl.style.bottom = "5px";
    bannerEl.style.left = "5px";
    bannerEl.style.padding = ".5em";
    bannerEl.style.borderRadius = "5px";
    bannerEl.style.alignItems = "center";
  }
  function setupIconStyles(prependIcon, iconId) {
    prependIcon.setAttribute("width", "24");
    prependIcon.setAttribute("id", iconId);
    prependIcon.setAttribute("height", "24");
    prependIcon.setAttribute("viewBox", "0 0 24 24");
    prependIcon.setAttribute("fill", "none");
    prependIcon.style.marginLeft = "-6px";
  }
  function setupCloseBtn() {
    const closeBtn = document.createElement("span");
    closeBtn.style.cursor = "pointer";
    closeBtn.style.marginLeft = "16px";
    closeBtn.style.fontSize = "24px";
    closeBtn.innerHTML = " &times;";
    closeBtn.onclick = () => {
      previouslyDismissed = true;
      tearDown();
    };
    return closeBtn;
  }
  function setupLinkStyles(learnMoreLink, learnMoreId) {
    learnMoreLink.setAttribute("id", learnMoreId);
    learnMoreLink.innerText = "Learn more";
    learnMoreLink.href = "https://firebase.google.com/docs/studio/preview-apps#preview-backend";
    learnMoreLink.setAttribute("target", "__blank");
    learnMoreLink.style.paddingLeft = "5px";
    learnMoreLink.style.textDecoration = "underline";
  }
  function setupDom() {
    const banner = getOrCreateEl(bannerId);
    const firebaseTextId = prefixedId("text");
    const firebaseText = document.getElementById(firebaseTextId) || document.createElement("span");
    const learnMoreId = prefixedId("learnmore");
    const learnMoreLink = document.getElementById(learnMoreId) || document.createElement("a");
    const prependIconId = prefixedId("preprendIcon");
    const prependIcon = document.getElementById(prependIconId) || document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (banner.created) {
      const bannerEl = banner.element;
      setupBannerStyles(bannerEl);
      setupLinkStyles(learnMoreLink, learnMoreId);
      const closeBtn = setupCloseBtn();
      setupIconStyles(prependIcon, prependIconId);
      bannerEl.append(prependIcon, firebaseText, learnMoreLink, closeBtn);
      document.body.appendChild(bannerEl);
    }
    if (showError) {
      firebaseText.innerText = `Preview backend disconnected.`;
      prependIcon.innerHTML = `<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`;
    } else {
      prependIcon.innerHTML = `<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`;
      firebaseText.innerText = "Preview backend running in this workspace.";
    }
    firebaseText.setAttribute("id", firebaseTextId);
  }
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", setupDom);
  } else {
    setupDom();
  }
}
function getUA() {
  if (typeof navigator !== "undefined" && typeof navigator["userAgent"] === "string") {
    return navigator["userAgent"];
  } else {
    return "";
  }
}
function isMobileCordova() {
  return typeof window !== "undefined" && // @ts-ignore Setting up an broadly applicable index signature for Window
  // just to deal with this case would probably be a bad idea.
  !!(window["cordova"] || window["phonegap"] || window["PhoneGap"]) && /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(getUA());
}
function isCloudflareWorker() {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}
function isBrowserExtension() {
  const runtime = typeof chrome === "object" ? chrome.runtime : typeof browser === "object" ? browser.runtime : void 0;
  return typeof runtime === "object" && runtime.id !== void 0;
}
function isReactNative() {
  return typeof navigator === "object" && navigator["product"] === "ReactNative";
}
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB === "object";
  } catch (e) {
    return false;
  }
}
function validateIndexedDBOpenable() {
  return new Promise((resolve, reject) => {
    try {
      let preExist = true;
      const DB_CHECK_NAME = "validate-browser-context-for-indexeddb-analytics-module";
      const request = self.indexedDB.open(DB_CHECK_NAME);
      request.onsuccess = () => {
        request.result.close();
        if (!preExist) {
          self.indexedDB.deleteDatabase(DB_CHECK_NAME);
        }
        resolve(true);
      };
      request.onupgradeneeded = () => {
        preExist = false;
      };
      request.onerror = () => {
        var _a;
        reject(((_a = request.error) === null || _a === void 0 ? void 0 : _a.message) || "");
      };
    } catch (error) {
      reject(error);
    }
  });
}
function replaceTemplate(template, data) {
  return template.replace(PATTERN, (_, key) => {
    const value = data[key];
    return value != null ? String(value) : `<${key}?>`;
  });
}
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const k of aKeys) {
    if (!bKeys.includes(k)) {
      return false;
    }
    const aProp = a[k];
    const bProp = b[k];
    if (isObject(aProp) && isObject(bProp)) {
      if (!deepEqual(aProp, bProp)) {
        return false;
      }
    } else if (aProp !== bProp) {
      return false;
    }
  }
  for (const k of bKeys) {
    if (!aKeys.includes(k)) {
      return false;
    }
  }
  return true;
}
function isObject(thing) {
  return thing !== null && typeof thing === "object";
}
function querystring(querystringParams) {
  const params = [];
  for (const [key, value] of Object.entries(querystringParams)) {
    if (Array.isArray(value)) {
      value.forEach((arrayVal) => {
        params.push(encodeURIComponent(key) + "=" + encodeURIComponent(arrayVal));
      });
    } else {
      params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
  }
  return params.length ? "&" + params.join("&") : "";
}
function querystringDecode(querystring2) {
  const obj = {};
  const tokens = querystring2.replace(/^\?/, "").split("&");
  tokens.forEach((token) => {
    if (token) {
      const [key, value] = token.split("=");
      obj[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  return obj;
}
function extractQuerystring(url) {
  const queryStart = url.indexOf("?");
  if (!queryStart) {
    return "";
  }
  const fragmentStart = url.indexOf("#", queryStart);
  return url.substring(queryStart, fragmentStart > 0 ? fragmentStart : void 0);
}
function createSubscribe(executor, onNoObservers) {
  const proxy = new ObserverProxy(executor, onNoObservers);
  return proxy.subscribe.bind(proxy);
}
function implementsAnyMethods(obj, methods) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  for (const method of methods) {
    if (method in obj && typeof obj[method] === "function") {
      return true;
    }
  }
  return false;
}
function noop() {
}
function getModularInstance(service) {
  if (service && service._delegate) {
    return service._delegate;
  } else {
    return service;
  }
}
var CONSTANTS, stringToByteArray$1, byteArrayToString, base64, DecodeBase64StringError, base64Encode, base64urlEncodeWithoutPadding, base64Decode, getDefaultsFromGlobal, getDefaultsFromEnvVariable, getDefaultsFromCookie, getDefaults, getDefaultEmulatorHost, getDefaultAppConfig, Deferred, emulatorStatus, previouslyDismissed, ERROR_NAME, FirebaseError, ErrorFactory, PATTERN, ObserverProxy, MAX_VALUE_MILLIS;
var init_index_node_esm = __esm({
  "../node_modules/@firebase/util/dist/node-esm/index.node.esm.js"() {
    init_postinstall();
    CONSTANTS = {
      /**
       * @define {boolean} Whether this is the client Node.js SDK.
       */
      NODE_CLIENT: false,
      /**
       * @define {boolean} Whether this is the Admin Node.js SDK.
       */
      NODE_ADMIN: false,
      /**
       * Firebase SDK Version
       */
      SDK_VERSION: "${JSCORE_VERSION}"
    };
    stringToByteArray$1 = function(str) {
      const out = [];
      let p = 0;
      for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 128) {
          out[p++] = c;
        } else if (c < 2048) {
          out[p++] = c >> 6 | 192;
          out[p++] = c & 63 | 128;
        } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
          c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
          out[p++] = c >> 18 | 240;
          out[p++] = c >> 12 & 63 | 128;
          out[p++] = c >> 6 & 63 | 128;
          out[p++] = c & 63 | 128;
        } else {
          out[p++] = c >> 12 | 224;
          out[p++] = c >> 6 & 63 | 128;
          out[p++] = c & 63 | 128;
        }
      }
      return out;
    };
    byteArrayToString = function(bytes) {
      const out = [];
      let pos = 0, c = 0;
      while (pos < bytes.length) {
        const c1 = bytes[pos++];
        if (c1 < 128) {
          out[c++] = String.fromCharCode(c1);
        } else if (c1 > 191 && c1 < 224) {
          const c2 = bytes[pos++];
          out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
        } else if (c1 > 239 && c1 < 365) {
          const c2 = bytes[pos++];
          const c3 = bytes[pos++];
          const c4 = bytes[pos++];
          const u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
          out[c++] = String.fromCharCode(55296 + (u >> 10));
          out[c++] = String.fromCharCode(56320 + (u & 1023));
        } else {
          const c2 = bytes[pos++];
          const c3 = bytes[pos++];
          out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
        }
      }
      return out.join("");
    };
    base64 = {
      /**
       * Maps bytes to characters.
       */
      byteToCharMap_: null,
      /**
       * Maps characters to bytes.
       */
      charToByteMap_: null,
      /**
       * Maps bytes to websafe characters.
       * @private
       */
      byteToCharMapWebSafe_: null,
      /**
       * Maps websafe characters to bytes.
       * @private
       */
      charToByteMapWebSafe_: null,
      /**
       * Our default alphabet, shared between
       * ENCODED_VALS and ENCODED_VALS_WEBSAFE
       */
      ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      /**
       * Our default alphabet. Value 64 (=) is special; it means "nothing."
       */
      get ENCODED_VALS() {
        return this.ENCODED_VALS_BASE + "+/=";
      },
      /**
       * Our websafe alphabet.
       */
      get ENCODED_VALS_WEBSAFE() {
        return this.ENCODED_VALS_BASE + "-_.";
      },
      /**
       * Whether this browser supports the atob and btoa functions. This extension
       * started at Mozilla but is now implemented by many browsers. We use the
       * ASSUME_* variables to avoid pulling in the full useragent detection library
       * but still allowing the standard per-browser compilations.
       *
       */
      HAS_NATIVE_SUPPORT: typeof atob === "function",
      /**
       * Base64-encode an array of bytes.
       *
       * @param input An array of bytes (numbers with
       *     value in [0, 255]) to encode.
       * @param webSafe Boolean indicating we should use the
       *     alternative alphabet.
       * @return The base64 encoded string.
       */
      encodeByteArray(input, webSafe) {
        if (!Array.isArray(input)) {
          throw Error("encodeByteArray takes an array as a parameter");
        }
        this.init_();
        const byteToCharMap = webSafe ? this.byteToCharMapWebSafe_ : this.byteToCharMap_;
        const output = [];
        for (let i = 0; i < input.length; i += 3) {
          const byte1 = input[i];
          const haveByte2 = i + 1 < input.length;
          const byte2 = haveByte2 ? input[i + 1] : 0;
          const haveByte3 = i + 2 < input.length;
          const byte3 = haveByte3 ? input[i + 2] : 0;
          const outByte1 = byte1 >> 2;
          const outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
          let outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
          let outByte4 = byte3 & 63;
          if (!haveByte3) {
            outByte4 = 64;
            if (!haveByte2) {
              outByte3 = 64;
            }
          }
          output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
        }
        return output.join("");
      },
      /**
       * Base64-encode a string.
       *
       * @param input A string to encode.
       * @param webSafe If true, we should use the
       *     alternative alphabet.
       * @return The base64 encoded string.
       */
      encodeString(input, webSafe) {
        if (this.HAS_NATIVE_SUPPORT && !webSafe) {
          return btoa(input);
        }
        return this.encodeByteArray(stringToByteArray$1(input), webSafe);
      },
      /**
       * Base64-decode a string.
       *
       * @param input to decode.
       * @param webSafe True if we should use the
       *     alternative alphabet.
       * @return string representing the decoded value.
       */
      decodeString(input, webSafe) {
        if (this.HAS_NATIVE_SUPPORT && !webSafe) {
          return atob(input);
        }
        return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
      },
      /**
       * Base64-decode a string.
       *
       * In base-64 decoding, groups of four characters are converted into three
       * bytes.  If the encoder did not apply padding, the input length may not
       * be a multiple of 4.
       *
       * In this case, the last group will have fewer than 4 characters, and
       * padding will be inferred.  If the group has one or two characters, it decodes
       * to one byte.  If the group has three characters, it decodes to two bytes.
       *
       * @param input Input to decode.
       * @param webSafe True if we should use the web-safe alphabet.
       * @return bytes representing the decoded value.
       */
      decodeStringToByteArray(input, webSafe) {
        this.init_();
        const charToByteMap = webSafe ? this.charToByteMapWebSafe_ : this.charToByteMap_;
        const output = [];
        for (let i = 0; i < input.length; ) {
          const byte1 = charToByteMap[input.charAt(i++)];
          const haveByte2 = i < input.length;
          const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
          ++i;
          const haveByte3 = i < input.length;
          const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
          ++i;
          const haveByte4 = i < input.length;
          const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
          ++i;
          if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
            throw new DecodeBase64StringError();
          }
          const outByte1 = byte1 << 2 | byte2 >> 4;
          output.push(outByte1);
          if (byte3 !== 64) {
            const outByte2 = byte2 << 4 & 240 | byte3 >> 2;
            output.push(outByte2);
            if (byte4 !== 64) {
              const outByte3 = byte3 << 6 & 192 | byte4;
              output.push(outByte3);
            }
          }
        }
        return output;
      },
      /**
       * Lazy static initialization function. Called before
       * accessing any of the static map variables.
       * @private
       */
      init_() {
        if (!this.byteToCharMap_) {
          this.byteToCharMap_ = {};
          this.charToByteMap_ = {};
          this.byteToCharMapWebSafe_ = {};
          this.charToByteMapWebSafe_ = {};
          for (let i = 0; i < this.ENCODED_VALS.length; i++) {
            this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
            this.charToByteMap_[this.byteToCharMap_[i]] = i;
            this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
            this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
            if (i >= this.ENCODED_VALS_BASE.length) {
              this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
              this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
            }
          }
        }
      }
    };
    DecodeBase64StringError = class extends Error {
      constructor() {
        super(...arguments);
        this.name = "DecodeBase64StringError";
      }
    };
    base64Encode = function(str) {
      const utf8Bytes = stringToByteArray$1(str);
      return base64.encodeByteArray(utf8Bytes, true);
    };
    base64urlEncodeWithoutPadding = function(str) {
      return base64Encode(str).replace(/\./g, "");
    };
    base64Decode = function(str) {
      try {
        return base64.decodeString(str, true);
      } catch (e) {
        console.error("base64Decode failed: ", e);
      }
      return null;
    };
    getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
    getDefaultsFromEnvVariable = () => {
      if (typeof process === "undefined" || typeof process.env === "undefined") {
        return;
      }
      const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
      if (defaultsJsonString) {
        return JSON.parse(defaultsJsonString);
      }
    };
    getDefaultsFromCookie = () => {
      if (typeof document === "undefined") {
        return;
      }
      let match;
      try {
        match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
      } catch (e) {
        return;
      }
      const decoded = match && base64Decode(match[1]);
      return decoded && JSON.parse(decoded);
    };
    getDefaults = () => {
      try {
        return getDefaultsFromPostinstall() || getDefaultsFromGlobal() || getDefaultsFromEnvVariable() || getDefaultsFromCookie();
      } catch (e) {
        console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
        return;
      }
    };
    getDefaultEmulatorHost = (productName) => {
      var _a, _b;
      return (_b = (_a = getDefaults()) === null || _a === void 0 ? void 0 : _a.emulatorHosts) === null || _b === void 0 ? void 0 : _b[productName];
    };
    getDefaultAppConfig = () => {
      var _a;
      return (_a = getDefaults()) === null || _a === void 0 ? void 0 : _a.config;
    };
    Deferred = class {
      constructor() {
        this.reject = () => {
        };
        this.resolve = () => {
        };
        this.promise = new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
      }
      /**
       * Our API internals are not promisified and cannot because our callback APIs have subtle expectations around
       * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
       * and returns a node-style callback which will resolve or reject the Deferred's promise.
       */
      wrapCallback(callback) {
        return (error, value) => {
          if (error) {
            this.reject(error);
          } else {
            this.resolve(value);
          }
          if (typeof callback === "function") {
            this.promise.catch(() => {
            });
            if (callback.length === 1) {
              callback(error);
            } else {
              callback(error, value);
            }
          }
        };
      }
    };
    emulatorStatus = {};
    previouslyDismissed = false;
    ERROR_NAME = "FirebaseError";
    FirebaseError = class _FirebaseError extends Error {
      constructor(code, message, customData) {
        super(message);
        this.code = code;
        this.customData = customData;
        this.name = ERROR_NAME;
        Object.setPrototypeOf(this, _FirebaseError.prototype);
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, ErrorFactory.prototype.create);
        }
      }
    };
    ErrorFactory = class {
      constructor(service, serviceName, errors) {
        this.service = service;
        this.serviceName = serviceName;
        this.errors = errors;
      }
      create(code, ...data) {
        const customData = data[0] || {};
        const fullCode = `${this.service}/${code}`;
        const template = this.errors[code];
        const message = template ? replaceTemplate(template, customData) : "Error";
        const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
        const error = new FirebaseError(fullCode, fullMessage, customData);
        return error;
      }
    };
    PATTERN = /\{\$([^}]+)}/g;
    ObserverProxy = class {
      /**
       * @param executor Function which can make calls to a single Observer
       *     as a proxy.
       * @param onNoObservers Callback when count of Observers goes to zero.
       */
      constructor(executor, onNoObservers) {
        this.observers = [];
        this.unsubscribes = [];
        this.observerCount = 0;
        this.task = Promise.resolve();
        this.finalized = false;
        this.onNoObservers = onNoObservers;
        this.task.then(() => {
          executor(this);
        }).catch((e) => {
          this.error(e);
        });
      }
      next(value) {
        this.forEachObserver((observer) => {
          observer.next(value);
        });
      }
      error(error) {
        this.forEachObserver((observer) => {
          observer.error(error);
        });
        this.close(error);
      }
      complete() {
        this.forEachObserver((observer) => {
          observer.complete();
        });
        this.close();
      }
      /**
       * Subscribe function that can be used to add an Observer to the fan-out list.
       *
       * - We require that no event is sent to a subscriber synchronously to their
       *   call to subscribe().
       */
      subscribe(nextOrObserver, error, complete) {
        let observer;
        if (nextOrObserver === void 0 && error === void 0 && complete === void 0) {
          throw new Error("Missing Observer.");
        }
        if (implementsAnyMethods(nextOrObserver, [
          "next",
          "error",
          "complete"
        ])) {
          observer = nextOrObserver;
        } else {
          observer = {
            next: nextOrObserver,
            error,
            complete
          };
        }
        if (observer.next === void 0) {
          observer.next = noop;
        }
        if (observer.error === void 0) {
          observer.error = noop;
        }
        if (observer.complete === void 0) {
          observer.complete = noop;
        }
        const unsub = this.unsubscribeOne.bind(this, this.observers.length);
        if (this.finalized) {
          this.task.then(() => {
            try {
              if (this.finalError) {
                observer.error(this.finalError);
              } else {
                observer.complete();
              }
            } catch (e) {
            }
            return;
          });
        }
        this.observers.push(observer);
        return unsub;
      }
      // Unsubscribe is synchronous - we guarantee that no events are sent to
      // any unsubscribed Observer.
      unsubscribeOne(i) {
        if (this.observers === void 0 || this.observers[i] === void 0) {
          return;
        }
        delete this.observers[i];
        this.observerCount -= 1;
        if (this.observerCount === 0 && this.onNoObservers !== void 0) {
          this.onNoObservers(this);
        }
      }
      forEachObserver(fn) {
        if (this.finalized) {
          return;
        }
        for (let i = 0; i < this.observers.length; i++) {
          this.sendOne(i, fn);
        }
      }
      // Call the Observer via one of it's callback function. We are careful to
      // confirm that the observe has not been unsubscribed since this asynchronous
      // function had been queued.
      sendOne(i, fn) {
        this.task.then(() => {
          if (this.observers !== void 0 && this.observers[i] !== void 0) {
            try {
              fn(this.observers[i]);
            } catch (e) {
              if (typeof console !== "undefined" && console.error) {
                console.error(e);
              }
            }
          }
        });
      }
      close(err) {
        if (this.finalized) {
          return;
        }
        this.finalized = true;
        if (err !== void 0) {
          this.finalError = err;
        }
        this.task.then(() => {
          this.observers = void 0;
          this.onNoObservers = void 0;
        });
      }
    };
    MAX_VALUE_MILLIS = 4 * 60 * 60 * 1e3;
    CONSTANTS.NODE_CLIENT = true;
  }
});

// ../node_modules/@firebase/component/dist/esm/index.esm2017.js
function normalizeIdentifierForFactory(identifier) {
  return identifier === DEFAULT_ENTRY_NAME ? void 0 : identifier;
}
function isComponentEager(component) {
  return component.instantiationMode === "EAGER";
}
var Component, DEFAULT_ENTRY_NAME, Provider, ComponentContainer;
var init_index_esm2017 = __esm({
  "../node_modules/@firebase/component/dist/esm/index.esm2017.js"() {
    init_index_node_esm();
    Component = class {
      /**
       *
       * @param name The public service name, e.g. app, auth, firestore, database
       * @param instanceFactory Service factory responsible for creating the public interface
       * @param type whether the service provided by the component is public or private
       */
      constructor(name4, instanceFactory, type) {
        this.name = name4;
        this.instanceFactory = instanceFactory;
        this.type = type;
        this.multipleInstances = false;
        this.serviceProps = {};
        this.instantiationMode = "LAZY";
        this.onInstanceCreated = null;
      }
      setInstantiationMode(mode) {
        this.instantiationMode = mode;
        return this;
      }
      setMultipleInstances(multipleInstances) {
        this.multipleInstances = multipleInstances;
        return this;
      }
      setServiceProps(props) {
        this.serviceProps = props;
        return this;
      }
      setInstanceCreatedCallback(callback) {
        this.onInstanceCreated = callback;
        return this;
      }
    };
    DEFAULT_ENTRY_NAME = "[DEFAULT]";
    Provider = class {
      constructor(name4, container) {
        this.name = name4;
        this.container = container;
        this.component = null;
        this.instances = /* @__PURE__ */ new Map();
        this.instancesDeferred = /* @__PURE__ */ new Map();
        this.instancesOptions = /* @__PURE__ */ new Map();
        this.onInitCallbacks = /* @__PURE__ */ new Map();
      }
      /**
       * @param identifier A provider can provide multiple instances of a service
       * if this.component.multipleInstances is true.
       */
      get(identifier) {
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        if (!this.instancesDeferred.has(normalizedIdentifier)) {
          const deferred = new Deferred();
          this.instancesDeferred.set(normalizedIdentifier, deferred);
          if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
            try {
              const instance = this.getOrInitializeService({
                instanceIdentifier: normalizedIdentifier
              });
              if (instance) {
                deferred.resolve(instance);
              }
            } catch (e) {
            }
          }
        }
        return this.instancesDeferred.get(normalizedIdentifier).promise;
      }
      getImmediate(options) {
        var _a;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === void 0 ? void 0 : options.identifier);
        const optional = (_a = options === null || options === void 0 ? void 0 : options.optional) !== null && _a !== void 0 ? _a : false;
        if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
          try {
            return this.getOrInitializeService({
              instanceIdentifier: normalizedIdentifier
            });
          } catch (e) {
            if (optional) {
              return null;
            } else {
              throw e;
            }
          }
        } else {
          if (optional) {
            return null;
          } else {
            throw Error(`Service ${this.name} is not available`);
          }
        }
      }
      getComponent() {
        return this.component;
      }
      setComponent(component) {
        if (component.name !== this.name) {
          throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
        }
        if (this.component) {
          throw Error(`Component for ${this.name} has already been provided`);
        }
        this.component = component;
        if (!this.shouldAutoInitialize()) {
          return;
        }
        if (isComponentEager(component)) {
          try {
            this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME });
          } catch (e) {
          }
        }
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
          const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
          try {
            const instance = this.getOrInitializeService({
              instanceIdentifier: normalizedIdentifier
            });
            instanceDeferred.resolve(instance);
          } catch (e) {
          }
        }
      }
      clearInstance(identifier = DEFAULT_ENTRY_NAME) {
        this.instancesDeferred.delete(identifier);
        this.instancesOptions.delete(identifier);
        this.instances.delete(identifier);
      }
      // app.delete() will call this method on every provider to delete the services
      // TODO: should we mark the provider as deleted?
      async delete() {
        const services = Array.from(this.instances.values());
        await Promise.all([
          ...services.filter((service) => "INTERNAL" in service).map((service) => service.INTERNAL.delete()),
          ...services.filter((service) => "_delete" in service).map((service) => service._delete())
        ]);
      }
      isComponentSet() {
        return this.component != null;
      }
      isInitialized(identifier = DEFAULT_ENTRY_NAME) {
        return this.instances.has(identifier);
      }
      getOptions(identifier = DEFAULT_ENTRY_NAME) {
        return this.instancesOptions.get(identifier) || {};
      }
      initialize(opts = {}) {
        const { options = {} } = opts;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
        if (this.isInitialized(normalizedIdentifier)) {
          throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
        }
        if (!this.isComponentSet()) {
          throw Error(`Component ${this.name} has not been registered yet`);
        }
        const instance = this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier,
          options
        });
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
          const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
          if (normalizedIdentifier === normalizedDeferredIdentifier) {
            instanceDeferred.resolve(instance);
          }
        }
        return instance;
      }
      /**
       *
       * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
       * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
       *
       * @param identifier An optional instance identifier
       * @returns a function to unregister the callback
       */
      onInit(callback, identifier) {
        var _a;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== void 0 ? _a : /* @__PURE__ */ new Set();
        existingCallbacks.add(callback);
        this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
        const existingInstance = this.instances.get(normalizedIdentifier);
        if (existingInstance) {
          callback(existingInstance, normalizedIdentifier);
        }
        return () => {
          existingCallbacks.delete(callback);
        };
      }
      /**
       * Invoke onInit callbacks synchronously
       * @param instance the service instance`
       */
      invokeOnInitCallbacks(instance, identifier) {
        const callbacks = this.onInitCallbacks.get(identifier);
        if (!callbacks) {
          return;
        }
        for (const callback of callbacks) {
          try {
            callback(instance, identifier);
          } catch (_a) {
          }
        }
      }
      getOrInitializeService({ instanceIdentifier, options = {} }) {
        let instance = this.instances.get(instanceIdentifier);
        if (!instance && this.component) {
          instance = this.component.instanceFactory(this.container, {
            instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
            options
          });
          this.instances.set(instanceIdentifier, instance);
          this.instancesOptions.set(instanceIdentifier, options);
          this.invokeOnInitCallbacks(instance, instanceIdentifier);
          if (this.component.onInstanceCreated) {
            try {
              this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
            } catch (_a) {
            }
          }
        }
        return instance || null;
      }
      normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME) {
        if (this.component) {
          return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME;
        } else {
          return identifier;
        }
      }
      shouldAutoInitialize() {
        return !!this.component && this.component.instantiationMode !== "EXPLICIT";
      }
    };
    ComponentContainer = class {
      constructor(name4) {
        this.name = name4;
        this.providers = /* @__PURE__ */ new Map();
      }
      /**
       *
       * @param component Component being added
       * @param overwrite When a component with the same name has already been registered,
       * if overwrite is true: overwrite the existing component with the new component and create a new
       * provider with the new component. It can be useful in tests where you want to use different mocks
       * for different tests.
       * if overwrite is false: throw an exception
       */
      addComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
          throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
        }
        provider.setComponent(component);
      }
      addOrOverwriteComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
          this.providers.delete(component.name);
        }
        this.addComponent(component);
      }
      /**
       * getProvider provides a type safe interface where it can only be called with a field name
       * present in NameServiceMapping interface.
       *
       * Firebase SDKs providing services should extend NameServiceMapping interface to register
       * themselves.
       */
      getProvider(name4) {
        if (this.providers.has(name4)) {
          return this.providers.get(name4);
        }
        const provider = new Provider(name4, this);
        this.providers.set(name4, provider);
        return provider;
      }
      getProviders() {
        return Array.from(this.providers.values());
      }
    };
  }
});

// ../node_modules/@firebase/logger/dist/esm/index.esm2017.js
var instances, LogLevel, levelStringToEnum, defaultLogLevel, ConsoleMethod, defaultLogHandler, Logger;
var init_index_esm20172 = __esm({
  "../node_modules/@firebase/logger/dist/esm/index.esm2017.js"() {
    instances = [];
    (function(LogLevel2) {
      LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
      LogLevel2[LogLevel2["VERBOSE"] = 1] = "VERBOSE";
      LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
      LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
      LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
      LogLevel2[LogLevel2["SILENT"] = 5] = "SILENT";
    })(LogLevel || (LogLevel = {}));
    levelStringToEnum = {
      "debug": LogLevel.DEBUG,
      "verbose": LogLevel.VERBOSE,
      "info": LogLevel.INFO,
      "warn": LogLevel.WARN,
      "error": LogLevel.ERROR,
      "silent": LogLevel.SILENT
    };
    defaultLogLevel = LogLevel.INFO;
    ConsoleMethod = {
      [LogLevel.DEBUG]: "log",
      [LogLevel.VERBOSE]: "log",
      [LogLevel.INFO]: "info",
      [LogLevel.WARN]: "warn",
      [LogLevel.ERROR]: "error"
    };
    defaultLogHandler = (instance, logType, ...args) => {
      if (logType < instance.logLevel) {
        return;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const method = ConsoleMethod[logType];
      if (method) {
        console[method](`[${now}]  ${instance.name}:`, ...args);
      } else {
        throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
      }
    };
    Logger = class {
      /**
       * Gives you an instance of a Logger to capture messages according to
       * Firebase's logging scheme.
       *
       * @param name The name that the logs will be associated with
       */
      constructor(name4) {
        this.name = name4;
        this._logLevel = defaultLogLevel;
        this._logHandler = defaultLogHandler;
        this._userLogHandler = null;
        instances.push(this);
      }
      get logLevel() {
        return this._logLevel;
      }
      set logLevel(val) {
        if (!(val in LogLevel)) {
          throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
        }
        this._logLevel = val;
      }
      // Workaround for setter/getter having to be the same type.
      setLogLevel(val) {
        this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
      }
      get logHandler() {
        return this._logHandler;
      }
      set logHandler(val) {
        if (typeof val !== "function") {
          throw new TypeError("Value assigned to `logHandler` must be a function");
        }
        this._logHandler = val;
      }
      get userLogHandler() {
        return this._userLogHandler;
      }
      set userLogHandler(val) {
        this._userLogHandler = val;
      }
      /**
       * The functions below are all based on the `console` interface
       */
      debug(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
        this._logHandler(this, LogLevel.DEBUG, ...args);
      }
      log(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.VERBOSE, ...args);
        this._logHandler(this, LogLevel.VERBOSE, ...args);
      }
      info(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
        this._logHandler(this, LogLevel.INFO, ...args);
      }
      warn(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
        this._logHandler(this, LogLevel.WARN, ...args);
      }
      error(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
        this._logHandler(this, LogLevel.ERROR, ...args);
      }
    };
  }
});

// ../node_modules/idb/build/wrap-idb-value.js
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise.then((value) => {
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    }
  }).catch(() => {
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
    return function(storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var instanceOfAny, idbProxyableTypes, cursorAdvanceMethods, cursorRequestMap, transactionDoneMap, transactionStoreNamesMap, transformCache, reverseTransformCache, idbProxyTraps, unwrap;
var init_wrap_idb_value = __esm({
  "../node_modules/idb/build/wrap-idb-value.js"() {
    instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
    cursorRequestMap = /* @__PURE__ */ new WeakMap();
    transactionDoneMap = /* @__PURE__ */ new WeakMap();
    transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
    transformCache = /* @__PURE__ */ new WeakMap();
    reverseTransformCache = /* @__PURE__ */ new WeakMap();
    idbProxyTraps = {
      get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
          if (prop === "done")
            return transactionDoneMap.get(target);
          if (prop === "objectStoreNames") {
            return target.objectStoreNames || transactionStoreNamesMap.get(target);
          }
          if (prop === "store") {
            return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
          }
        }
        return wrap(target[prop]);
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
      has(target, prop) {
        if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
          return true;
        }
        return prop in target;
      }
    };
    unwrap = (value) => reverseTransformCache.get(value);
  }
});

// ../node_modules/idb/build/index.js
function openDB(name4, version4, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name4, version4);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db2) => {
    if (terminated)
      db2.addEventListener("close", () => terminated());
    if (blocking) {
      db2.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
var readMethods, writeMethods, cachedMethods;
var init_build = __esm({
  "../node_modules/idb/build/index.js"() {
    init_wrap_idb_value();
    init_wrap_idb_value();
    readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
    writeMethods = ["put", "add", "delete", "clear"];
    cachedMethods = /* @__PURE__ */ new Map();
    replaceTraps((oldTraps) => ({
      ...oldTraps,
      get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
      has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
    }));
  }
});

// ../node_modules/@firebase/app/dist/esm/index.esm2017.js
function isVersionServiceProvider(provider) {
  const component = provider.getComponent();
  return (component === null || component === void 0 ? void 0 : component.type) === "VERSION";
}
function _addComponent(app, component) {
  try {
    app.container.addComponent(component);
  } catch (e) {
    logger6.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
  }
}
function _registerComponent(component) {
  const componentName = component.name;
  if (_components.has(componentName)) {
    logger6.debug(`There were multiple attempts to register component ${componentName}.`);
    return false;
  }
  _components.set(componentName, component);
  for (const app of _apps.values()) {
    _addComponent(app, component);
  }
  for (const serverApp of _serverApps.values()) {
    _addComponent(serverApp, component);
  }
  return true;
}
function _getProvider(app, name4) {
  const heartbeatController = app.container.getProvider("heartbeat").getImmediate({ optional: true });
  if (heartbeatController) {
    void heartbeatController.triggerHeartbeat();
  }
  return app.container.getProvider(name4);
}
function _isFirebaseServerApp(obj) {
  if (obj === null || obj === void 0) {
    return false;
  }
  return obj.settings !== void 0;
}
function initializeApp2(_options, rawConfig = {}) {
  let options = _options;
  if (typeof rawConfig !== "object") {
    const name5 = rawConfig;
    rawConfig = { name: name5 };
  }
  const config = Object.assign({ name: DEFAULT_ENTRY_NAME2, automaticDataCollectionEnabled: true }, rawConfig);
  const name4 = config.name;
  if (typeof name4 !== "string" || !name4) {
    throw ERROR_FACTORY.create("bad-app-name", {
      appName: String(name4)
    });
  }
  options || (options = getDefaultAppConfig());
  if (!options) {
    throw ERROR_FACTORY.create(
      "no-options"
      /* AppError.NO_OPTIONS */
    );
  }
  const existingApp = _apps.get(name4);
  if (existingApp) {
    if (deepEqual(options, existingApp.options) && deepEqual(config, existingApp.config)) {
      return existingApp;
    } else {
      throw ERROR_FACTORY.create("duplicate-app", { appName: name4 });
    }
  }
  const container = new ComponentContainer(name4);
  for (const component of _components.values()) {
    container.addComponent(component);
  }
  const newApp = new FirebaseAppImpl(options, config, container);
  _apps.set(name4, newApp);
  return newApp;
}
function getApp(name4 = DEFAULT_ENTRY_NAME2) {
  const app = _apps.get(name4);
  if (!app && name4 === DEFAULT_ENTRY_NAME2 && getDefaultAppConfig()) {
    return initializeApp2();
  }
  if (!app) {
    throw ERROR_FACTORY.create("no-app", { appName: name4 });
  }
  return app;
}
function registerVersion(libraryKeyOrName, version4, variant) {
  var _a;
  let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== void 0 ? _a : libraryKeyOrName;
  if (variant) {
    library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version4.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
    const warning = [
      `Unable to register library "${library}" with version "${version4}":`
    ];
    if (libraryMismatch) {
      warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
    }
    if (libraryMismatch && versionMismatch) {
      warning.push("and");
    }
    if (versionMismatch) {
      warning.push(`version name "${version4}" contains illegal characters (whitespace or "/")`);
    }
    logger6.warn(warning.join(" "));
    return;
  }
  _registerComponent(new Component(
    `${library}-version`,
    () => ({ library, version: version4 }),
    "VERSION"
    /* ComponentType.VERSION */
  ));
}
function getDbPromise() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade: (db2, oldVersion) => {
        switch (oldVersion) {
          case 0:
            try {
              db2.createObjectStore(STORE_NAME);
            } catch (e) {
              console.warn(e);
            }
        }
      }
    }).catch((e) => {
      throw ERROR_FACTORY.create("idb-open", {
        originalErrorMessage: e.message
      });
    });
  }
  return dbPromise;
}
async function readHeartbeatsFromIndexedDB(app) {
  try {
    const db2 = await getDbPromise();
    const tx = db2.transaction(STORE_NAME);
    const result = await tx.objectStore(STORE_NAME).get(computeKey(app));
    await tx.done;
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger6.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-get", {
        originalErrorMessage: e === null || e === void 0 ? void 0 : e.message
      });
      logger6.warn(idbGetError.message);
    }
  }
}
async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
  try {
    const db2 = await getDbPromise();
    const tx = db2.transaction(STORE_NAME, "readwrite");
    const objectStore = tx.objectStore(STORE_NAME);
    await objectStore.put(heartbeatObject, computeKey(app));
    await tx.done;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger6.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-set", {
        originalErrorMessage: e === null || e === void 0 ? void 0 : e.message
      });
      logger6.warn(idbGetError.message);
    }
  }
}
function computeKey(app) {
  return `${app.name}!${app.options.appId}`;
}
function getUTCDateString() {
  const today = /* @__PURE__ */ new Date();
  return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
  const heartbeatsToSend = [];
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
    const heartbeatEntry = heartbeatsToSend.find((hb) => hb.agent === singleDateHeartbeat.agent);
    if (!heartbeatEntry) {
      heartbeatsToSend.push({
        agent: singleDateHeartbeat.agent,
        dates: [singleDateHeartbeat.date]
      });
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatsToSend.pop();
        break;
      }
    } else {
      heartbeatEntry.dates.push(singleDateHeartbeat.date);
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatEntry.dates.pop();
        break;
      }
    }
    unsentEntries = unsentEntries.slice(1);
  }
  return {
    heartbeatsToSend,
    unsentEntries
  };
}
function countBytes(heartbeatsCache) {
  return base64urlEncodeWithoutPadding(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: heartbeatsCache })
  ).length;
}
function getEarliestHeartbeatIdx(heartbeats) {
  if (heartbeats.length === 0) {
    return -1;
  }
  let earliestHeartbeatIdx = 0;
  let earliestHeartbeatDate = heartbeats[0].date;
  for (let i = 1; i < heartbeats.length; i++) {
    if (heartbeats[i].date < earliestHeartbeatDate) {
      earliestHeartbeatDate = heartbeats[i].date;
      earliestHeartbeatIdx = i;
    }
  }
  return earliestHeartbeatIdx;
}
function registerCoreComponents(variant) {
  _registerComponent(new Component(
    "platform-logger",
    (container) => new PlatformLoggerServiceImpl(container),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ));
  _registerComponent(new Component(
    "heartbeat",
    (container) => new HeartbeatServiceImpl(container),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ));
  registerVersion(name$q, version$1, variant);
  registerVersion(name$q, version$1, "esm2017");
  registerVersion("fire-js", "");
}
var PlatformLoggerServiceImpl, name$q, version$1, logger6, name$p, name$o, name$n, name$m, name$l, name$k, name$j, name$i, name$h, name$g, name$f, name$e, name$d, name$c, name$b, name$a, name$9, name$8, name$7, name$6, name$5, name$4, name$3, name$2, name$1, name, version, DEFAULT_ENTRY_NAME2, PLATFORM_LOG_STRING, _apps, _serverApps, _components, ERRORS, ERROR_FACTORY, FirebaseAppImpl, SDK_VERSION, DB_NAME, DB_VERSION, STORE_NAME, dbPromise, MAX_HEADER_BYTES, MAX_NUM_STORED_HEARTBEATS, HeartbeatServiceImpl, HeartbeatStorageImpl;
var init_index_esm20173 = __esm({
  "../node_modules/@firebase/app/dist/esm/index.esm2017.js"() {
    init_index_esm2017();
    init_index_esm20172();
    init_index_node_esm();
    init_index_node_esm();
    init_build();
    PlatformLoggerServiceImpl = class {
      constructor(container) {
        this.container = container;
      }
      // In initial implementation, this will be called by installations on
      // auth token refresh, and installations will send this string.
      getPlatformInfoString() {
        const providers = this.container.getProviders();
        return providers.map((provider) => {
          if (isVersionServiceProvider(provider)) {
            const service = provider.getImmediate();
            return `${service.library}/${service.version}`;
          } else {
            return null;
          }
        }).filter((logString) => logString).join(" ");
      }
    };
    name$q = "@firebase/app";
    version$1 = "0.13.2";
    logger6 = new Logger("@firebase/app");
    name$p = "@firebase/app-compat";
    name$o = "@firebase/analytics-compat";
    name$n = "@firebase/analytics";
    name$m = "@firebase/app-check-compat";
    name$l = "@firebase/app-check";
    name$k = "@firebase/auth";
    name$j = "@firebase/auth-compat";
    name$i = "@firebase/database";
    name$h = "@firebase/data-connect";
    name$g = "@firebase/database-compat";
    name$f = "@firebase/functions";
    name$e = "@firebase/functions-compat";
    name$d = "@firebase/installations";
    name$c = "@firebase/installations-compat";
    name$b = "@firebase/messaging";
    name$a = "@firebase/messaging-compat";
    name$9 = "@firebase/performance";
    name$8 = "@firebase/performance-compat";
    name$7 = "@firebase/remote-config";
    name$6 = "@firebase/remote-config-compat";
    name$5 = "@firebase/storage";
    name$4 = "@firebase/storage-compat";
    name$3 = "@firebase/firestore";
    name$2 = "@firebase/ai";
    name$1 = "@firebase/firestore-compat";
    name = "firebase";
    version = "11.10.0";
    DEFAULT_ENTRY_NAME2 = "[DEFAULT]";
    PLATFORM_LOG_STRING = {
      [name$q]: "fire-core",
      [name$p]: "fire-core-compat",
      [name$n]: "fire-analytics",
      [name$o]: "fire-analytics-compat",
      [name$l]: "fire-app-check",
      [name$m]: "fire-app-check-compat",
      [name$k]: "fire-auth",
      [name$j]: "fire-auth-compat",
      [name$i]: "fire-rtdb",
      [name$h]: "fire-data-connect",
      [name$g]: "fire-rtdb-compat",
      [name$f]: "fire-fn",
      [name$e]: "fire-fn-compat",
      [name$d]: "fire-iid",
      [name$c]: "fire-iid-compat",
      [name$b]: "fire-fcm",
      [name$a]: "fire-fcm-compat",
      [name$9]: "fire-perf",
      [name$8]: "fire-perf-compat",
      [name$7]: "fire-rc",
      [name$6]: "fire-rc-compat",
      [name$5]: "fire-gcs",
      [name$4]: "fire-gcs-compat",
      [name$3]: "fire-fst",
      [name$1]: "fire-fst-compat",
      [name$2]: "fire-vertex",
      "fire-js": "fire-js",
      // Platform identifier for JS SDK.
      [name]: "fire-js-all"
    };
    _apps = /* @__PURE__ */ new Map();
    _serverApps = /* @__PURE__ */ new Map();
    _components = /* @__PURE__ */ new Map();
    ERRORS = {
      [
        "no-app"
        /* AppError.NO_APP */
      ]: "No Firebase App '{$appName}' has been created - call initializeApp() first",
      [
        "bad-app-name"
        /* AppError.BAD_APP_NAME */
      ]: "Illegal App name: '{$appName}'",
      [
        "duplicate-app"
        /* AppError.DUPLICATE_APP */
      ]: "Firebase App named '{$appName}' already exists with different options or config",
      [
        "app-deleted"
        /* AppError.APP_DELETED */
      ]: "Firebase App named '{$appName}' already deleted",
      [
        "server-app-deleted"
        /* AppError.SERVER_APP_DELETED */
      ]: "Firebase Server App has been deleted",
      [
        "no-options"
        /* AppError.NO_OPTIONS */
      ]: "Need to provide options, when not being deployed to hosting via source.",
      [
        "invalid-app-argument"
        /* AppError.INVALID_APP_ARGUMENT */
      ]: "firebase.{$appName}() takes either no argument or a Firebase App instance.",
      [
        "invalid-log-argument"
        /* AppError.INVALID_LOG_ARGUMENT */
      ]: "First argument to `onLog` must be null or a function.",
      [
        "idb-open"
        /* AppError.IDB_OPEN */
      ]: "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
      [
        "idb-get"
        /* AppError.IDB_GET */
      ]: "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
      [
        "idb-set"
        /* AppError.IDB_WRITE */
      ]: "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
      [
        "idb-delete"
        /* AppError.IDB_DELETE */
      ]: "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
      [
        "finalization-registry-not-supported"
        /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */
      ]: "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
      [
        "invalid-server-app-environment"
        /* AppError.INVALID_SERVER_APP_ENVIRONMENT */
      ]: "FirebaseServerApp is not for use in browser environments."
    };
    ERROR_FACTORY = new ErrorFactory("app", "Firebase", ERRORS);
    FirebaseAppImpl = class {
      constructor(options, config, container) {
        this._isDeleted = false;
        this._options = Object.assign({}, options);
        this._config = Object.assign({}, config);
        this._name = config.name;
        this._automaticDataCollectionEnabled = config.automaticDataCollectionEnabled;
        this._container = container;
        this.container.addComponent(new Component(
          "app",
          () => this,
          "PUBLIC"
          /* ComponentType.PUBLIC */
        ));
      }
      get automaticDataCollectionEnabled() {
        this.checkDestroyed();
        return this._automaticDataCollectionEnabled;
      }
      set automaticDataCollectionEnabled(val) {
        this.checkDestroyed();
        this._automaticDataCollectionEnabled = val;
      }
      get name() {
        this.checkDestroyed();
        return this._name;
      }
      get options() {
        this.checkDestroyed();
        return this._options;
      }
      get config() {
        this.checkDestroyed();
        return this._config;
      }
      get container() {
        return this._container;
      }
      get isDeleted() {
        return this._isDeleted;
      }
      set isDeleted(val) {
        this._isDeleted = val;
      }
      /**
       * This function will throw an Error if the App has already been deleted -
       * use before performing API actions on the App.
       */
      checkDestroyed() {
        if (this.isDeleted) {
          throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
        }
      }
    };
    SDK_VERSION = version;
    DB_NAME = "firebase-heartbeat-database";
    DB_VERSION = 1;
    STORE_NAME = "firebase-heartbeat-store";
    dbPromise = null;
    MAX_HEADER_BYTES = 1024;
    MAX_NUM_STORED_HEARTBEATS = 30;
    HeartbeatServiceImpl = class {
      constructor(container) {
        this.container = container;
        this._heartbeatsCache = null;
        const app = this.container.getProvider("app").getImmediate();
        this._storage = new HeartbeatStorageImpl(app);
        this._heartbeatsCachePromise = this._storage.read().then((result) => {
          this._heartbeatsCache = result;
          return result;
        });
      }
      /**
       * Called to report a heartbeat. The function will generate
       * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
       * to IndexedDB.
       * Note that we only store one heartbeat per day. So if a heartbeat for today is
       * already logged, subsequent calls to this function in the same day will be ignored.
       */
      async triggerHeartbeat() {
        var _a, _b;
        try {
          const platformLogger = this.container.getProvider("platform-logger").getImmediate();
          const agent = platformLogger.getPlatformInfoString();
          const date = getUTCDateString();
          if (((_a = this._heartbeatsCache) === null || _a === void 0 ? void 0 : _a.heartbeats) == null) {
            this._heartbeatsCache = await this._heartbeatsCachePromise;
            if (((_b = this._heartbeatsCache) === null || _b === void 0 ? void 0 : _b.heartbeats) == null) {
              return;
            }
          }
          if (this._heartbeatsCache.lastSentHeartbeatDate === date || this._heartbeatsCache.heartbeats.some((singleDateHeartbeat) => singleDateHeartbeat.date === date)) {
            return;
          } else {
            this._heartbeatsCache.heartbeats.push({ date, agent });
            if (this._heartbeatsCache.heartbeats.length > MAX_NUM_STORED_HEARTBEATS) {
              const earliestHeartbeatIdx = getEarliestHeartbeatIdx(this._heartbeatsCache.heartbeats);
              this._heartbeatsCache.heartbeats.splice(earliestHeartbeatIdx, 1);
            }
          }
          return this._storage.overwrite(this._heartbeatsCache);
        } catch (e) {
          logger6.warn(e);
        }
      }
      /**
       * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
       * It also clears all heartbeats from memory as well as in IndexedDB.
       *
       * NOTE: Consuming product SDKs should not send the header if this method
       * returns an empty string.
       */
      async getHeartbeatsHeader() {
        var _a;
        try {
          if (this._heartbeatsCache === null) {
            await this._heartbeatsCachePromise;
          }
          if (((_a = this._heartbeatsCache) === null || _a === void 0 ? void 0 : _a.heartbeats) == null || this._heartbeatsCache.heartbeats.length === 0) {
            return "";
          }
          const date = getUTCDateString();
          const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
          const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
          this._heartbeatsCache.lastSentHeartbeatDate = date;
          if (unsentEntries.length > 0) {
            this._heartbeatsCache.heartbeats = unsentEntries;
            await this._storage.overwrite(this._heartbeatsCache);
          } else {
            this._heartbeatsCache.heartbeats = [];
            void this._storage.overwrite(this._heartbeatsCache);
          }
          return headerString;
        } catch (e) {
          logger6.warn(e);
          return "";
        }
      }
    };
    HeartbeatStorageImpl = class {
      constructor(app) {
        this.app = app;
        this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
      }
      async runIndexedDBEnvironmentCheck() {
        if (!isIndexedDBAvailable()) {
          return false;
        } else {
          return validateIndexedDBOpenable().then(() => true).catch(() => false);
        }
      }
      /**
       * Read all heartbeats.
       */
      async read() {
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
          return { heartbeats: [] };
        } else {
          const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
          if (idbHeartbeatObject === null || idbHeartbeatObject === void 0 ? void 0 : idbHeartbeatObject.heartbeats) {
            return idbHeartbeatObject;
          } else {
            return { heartbeats: [] };
          }
        }
      }
      // overwrite the storage with the provided heartbeats
      async overwrite(heartbeatsObject) {
        var _a;
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
          return;
        } else {
          const existingHeartbeatsObject = await this.read();
          return writeHeartbeatsToIndexedDB(this.app, {
            lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== void 0 ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
            heartbeats: heartbeatsObject.heartbeats
          });
        }
      }
      // add heartbeats
      async add(heartbeatsObject) {
        var _a;
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
          return;
        } else {
          const existingHeartbeatsObject = await this.read();
          return writeHeartbeatsToIndexedDB(this.app, {
            lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== void 0 ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
            heartbeats: [
              ...existingHeartbeatsObject.heartbeats,
              ...heartbeatsObject.heartbeats
            ]
          });
        }
      }
    };
    registerCoreComponents("");
  }
});

// ../node_modules/react/cjs/react.production.js
var require_react_production = __commonJS({
  "../node_modules/react/cjs/react.production.js"(exports2) {
    "use strict";
    var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
    var REACT_PORTAL_TYPE = Symbol.for("react.portal");
    var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
    var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
    var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
    var REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
    var REACT_CONTEXT_TYPE = Symbol.for("react.context");
    var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
    var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
    var REACT_MEMO_TYPE = Symbol.for("react.memo");
    var REACT_LAZY_TYPE = Symbol.for("react.lazy");
    var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
    function getIteratorFn(maybeIterable) {
      if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
      maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
      return "function" === typeof maybeIterable ? maybeIterable : null;
    }
    var ReactNoopUpdateQueue = {
      isMounted: function() {
        return false;
      },
      enqueueForceUpdate: function() {
      },
      enqueueReplaceState: function() {
      },
      enqueueSetState: function() {
      }
    };
    var assign = Object.assign;
    var emptyObject = {};
    function Component2(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    Component2.prototype.isReactComponent = {};
    Component2.prototype.setState = function(partialState, callback) {
      if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
        throw Error(
          "takes an object of state variables to update or a function which returns an object of state variables."
        );
      this.updater.enqueueSetState(this, partialState, callback, "setState");
    };
    Component2.prototype.forceUpdate = function(callback) {
      this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
    };
    function ComponentDummy() {
    }
    ComponentDummy.prototype = Component2.prototype;
    function PureComponent(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
    pureComponentPrototype.constructor = PureComponent;
    assign(pureComponentPrototype, Component2.prototype);
    pureComponentPrototype.isPureReactComponent = true;
    var isArrayImpl = Array.isArray;
    var ReactSharedInternals = { H: null, A: null, T: null, S: null, V: null };
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function ReactElement(type, key, self2, source, owner, props) {
      self2 = props.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref: void 0 !== self2 ? self2 : null,
        props
      };
    }
    function cloneAndReplaceKey(oldElement, newKey) {
      return ReactElement(
        oldElement.type,
        newKey,
        void 0,
        void 0,
        void 0,
        oldElement.props
      );
    }
    function isValidElement(object) {
      return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    function escape(key) {
      var escaperLookup = { "=": "=0", ":": "=2" };
      return "$" + key.replace(/[=:]/g, function(match) {
        return escaperLookup[match];
      });
    }
    var userProvidedKeyEscapeRegex = /\/+/g;
    function getElementKey(element, index) {
      return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
    }
    function noop$1() {
    }
    function resolveThenable(thenable) {
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
        default:
          switch ("string" === typeof thenable.status ? thenable.then(noop$1, noop$1) : (thenable.status = "pending", thenable.then(
            function(fulfilledValue) {
              "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
            },
            function(error) {
              "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
            }
          )), thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
          }
      }
      throw thenable;
    }
    function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
      var type = typeof children;
      if ("undefined" === type || "boolean" === type) children = null;
      var invokeCallback = false;
      if (null === children) invokeCallback = true;
      else
        switch (type) {
          case "bigint":
          case "string":
          case "number":
            invokeCallback = true;
            break;
          case "object":
            switch (children.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                invokeCallback = true;
                break;
              case REACT_LAZY_TYPE:
                return invokeCallback = children._init, mapIntoArray(
                  invokeCallback(children._payload),
                  array,
                  escapedPrefix,
                  nameSoFar,
                  callback
                );
            }
        }
      if (invokeCallback)
        return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
          return c;
        })) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(
          callback,
          escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(
            userProvidedKeyEscapeRegex,
            "$&/"
          ) + "/") + invokeCallback
        )), array.push(callback)), 1;
      invokeCallback = 0;
      var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
      if (isArrayImpl(children))
        for (var i = 0; i < children.length; i++)
          nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if (i = getIteratorFn(children), "function" === typeof i)
        for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
          nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if ("object" === type) {
        if ("function" === typeof children.then)
          return mapIntoArray(
            resolveThenable(children),
            array,
            escapedPrefix,
            nameSoFar,
            callback
          );
        array = String(children);
        throw Error(
          "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
        );
      }
      return invokeCallback;
    }
    function mapChildren(children, func, context) {
      if (null == children) return children;
      var result = [], count = 0;
      mapIntoArray(children, result, "", "", function(child) {
        return func.call(context, child, count++);
      });
      return result;
    }
    function lazyInitializer(payload) {
      if (-1 === payload._status) {
        var ctor = payload._result;
        ctor = ctor();
        ctor.then(
          function(moduleObject) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 1, payload._result = moduleObject;
          },
          function(error) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 2, payload._result = error;
          }
        );
        -1 === payload._status && (payload._status = 0, payload._result = ctor);
      }
      if (1 === payload._status) return payload._result.default;
      throw payload._result;
    }
    var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
      if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
        var event = new window.ErrorEvent("error", {
          bubbles: true,
          cancelable: true,
          message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
          error
        });
        if (!window.dispatchEvent(event)) return;
      } else if ("object" === typeof process && "function" === typeof process.emit) {
        process.emit("uncaughtException", error);
        return;
      }
      console.error(error);
    };
    function noop2() {
    }
    exports2.Children = {
      map: mapChildren,
      forEach: function(children, forEachFunc, forEachContext) {
        mapChildren(
          children,
          function() {
            forEachFunc.apply(this, arguments);
          },
          forEachContext
        );
      },
      count: function(children) {
        var n = 0;
        mapChildren(children, function() {
          n++;
        });
        return n;
      },
      toArray: function(children) {
        return mapChildren(children, function(child) {
          return child;
        }) || [];
      },
      only: function(children) {
        if (!isValidElement(children))
          throw Error(
            "React.Children.only expected to receive a single React element child."
          );
        return children;
      }
    };
    exports2.Component = Component2;
    exports2.Fragment = REACT_FRAGMENT_TYPE;
    exports2.Profiler = REACT_PROFILER_TYPE;
    exports2.PureComponent = PureComponent;
    exports2.StrictMode = REACT_STRICT_MODE_TYPE;
    exports2.Suspense = REACT_SUSPENSE_TYPE;
    exports2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
    exports2.__COMPILER_RUNTIME = {
      __proto__: null,
      c: function(size) {
        return ReactSharedInternals.H.useMemoCache(size);
      }
    };
    exports2.cache = function(fn) {
      return function() {
        return fn.apply(null, arguments);
      };
    };
    exports2.cloneElement = function(element, config, children) {
      if (null === element || void 0 === element)
        throw Error(
          "The argument must be a React element, but you passed " + element + "."
        );
      var props = assign({}, element.props), key = element.key, owner = void 0;
      if (null != config)
        for (propName in void 0 !== config.ref && (owner = void 0), void 0 !== config.key && (key = "" + config.key), config)
          !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
      var propName = arguments.length - 2;
      if (1 === propName) props.children = children;
      else if (1 < propName) {
        for (var childArray = Array(propName), i = 0; i < propName; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      return ReactElement(element.type, key, void 0, void 0, owner, props);
    };
    exports2.createContext = function(defaultValue) {
      defaultValue = {
        $$typeof: REACT_CONTEXT_TYPE,
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
        _threadCount: 0,
        Provider: null,
        Consumer: null
      };
      defaultValue.Provider = defaultValue;
      defaultValue.Consumer = {
        $$typeof: REACT_CONSUMER_TYPE,
        _context: defaultValue
      };
      return defaultValue;
    };
    exports2.createElement = function(type, config, children) {
      var propName, props = {}, key = null;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
          hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
      var childrenLength = arguments.length - 2;
      if (1 === childrenLength) props.children = children;
      else if (1 < childrenLength) {
        for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      if (type && type.defaultProps)
        for (propName in childrenLength = type.defaultProps, childrenLength)
          void 0 === props[propName] && (props[propName] = childrenLength[propName]);
      return ReactElement(type, key, void 0, void 0, null, props);
    };
    exports2.createRef = function() {
      return { current: null };
    };
    exports2.forwardRef = function(render) {
      return { $$typeof: REACT_FORWARD_REF_TYPE, render };
    };
    exports2.isValidElement = isValidElement;
    exports2.lazy = function(ctor) {
      return {
        $$typeof: REACT_LAZY_TYPE,
        _payload: { _status: -1, _result: ctor },
        _init: lazyInitializer
      };
    };
    exports2.memo = function(type, compare) {
      return {
        $$typeof: REACT_MEMO_TYPE,
        type,
        compare: void 0 === compare ? null : compare
      };
    };
    exports2.startTransition = function(scope) {
      var prevTransition = ReactSharedInternals.T, currentTransition = {};
      ReactSharedInternals.T = currentTransition;
      try {
        var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
        null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
        "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop2, reportGlobalError);
      } catch (error) {
        reportGlobalError(error);
      } finally {
        ReactSharedInternals.T = prevTransition;
      }
    };
    exports2.unstable_useCacheRefresh = function() {
      return ReactSharedInternals.H.useCacheRefresh();
    };
    exports2.use = function(usable) {
      return ReactSharedInternals.H.use(usable);
    };
    exports2.useActionState = function(action, initialState, permalink) {
      return ReactSharedInternals.H.useActionState(action, initialState, permalink);
    };
    exports2.useCallback = function(callback, deps) {
      return ReactSharedInternals.H.useCallback(callback, deps);
    };
    exports2.useContext = function(Context) {
      return ReactSharedInternals.H.useContext(Context);
    };
    exports2.useDebugValue = function() {
    };
    exports2.useDeferredValue = function(value, initialValue) {
      return ReactSharedInternals.H.useDeferredValue(value, initialValue);
    };
    exports2.useEffect = function(create, createDeps, update) {
      var dispatcher = ReactSharedInternals.H;
      if ("function" === typeof update)
        throw Error(
          "useEffect CRUD overload is not enabled in this build of React."
        );
      return dispatcher.useEffect(create, createDeps);
    };
    exports2.useId = function() {
      return ReactSharedInternals.H.useId();
    };
    exports2.useImperativeHandle = function(ref, create, deps) {
      return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
    };
    exports2.useInsertionEffect = function(create, deps) {
      return ReactSharedInternals.H.useInsertionEffect(create, deps);
    };
    exports2.useLayoutEffect = function(create, deps) {
      return ReactSharedInternals.H.useLayoutEffect(create, deps);
    };
    exports2.useMemo = function(create, deps) {
      return ReactSharedInternals.H.useMemo(create, deps);
    };
    exports2.useOptimistic = function(passthrough, reducer) {
      return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
    };
    exports2.useReducer = function(reducer, initialArg, init) {
      return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
    };
    exports2.useRef = function(initialValue) {
      return ReactSharedInternals.H.useRef(initialValue);
    };
    exports2.useState = function(initialState) {
      return ReactSharedInternals.H.useState(initialState);
    };
    exports2.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
      return ReactSharedInternals.H.useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
      );
    };
    exports2.useTransition = function() {
      return ReactSharedInternals.H.useTransition();
    };
    exports2.version = "19.1.0";
  }
});

// ../node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "../node_modules/react/cjs/react.development.js"(exports2, module2) {
    "use strict";
    "production" !== process.env.NODE_ENV && function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component2.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info[0],
              info[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component2(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return (type.displayName || "Context") + ".Provider";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name4 = getComponentNameFromType(type);
          return name4 ? "<" + name4 + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, self2, source, owner, props, debugStack, debugTask) {
        self2 = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== self2 ? self2 : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          void 0,
          void 0,
          oldElement._owner,
          oldElement.props,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function noop$1() {
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop$1, noop$1) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ctor = payload._result;
          ctor = ctor();
          ctor.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status)
                payload._status = 1, payload._result = moduleObject;
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status)
                payload._status = 2, payload._result = error;
            }
          );
          -1 === payload._status && (payload._status = 0, payload._result = ctor);
        }
        if (1 === payload._status)
          return ctor = payload._result, void 0 === ctor && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ctor
          ), "default" in ctor || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ctor
          ), ctor.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function noop2() {
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module2 && module2[requireString]).call(
              module2,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error) {
              ReactSharedInternals.thrownErrors.push(error);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler");
      Symbol.for("react.provider");
      var REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component2.prototype.isReactComponent = {};
      Component2.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component2.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      }, fnName;
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component2.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component2.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        V: null,
        actQueue: null,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        "react-stack-bottom-frame": function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs["react-stack-bottom-frame"].bind(deprecatedAPIs, UnknownOwner)();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      exports2.Children = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports2.Component = Component2;
      exports2.Fragment = REACT_FRAGMENT_TYPE;
      exports2.Profiler = REACT_PROFILER_TYPE;
      exports2.PureComponent = PureComponent;
      exports2.StrictMode = REACT_STRICT_MODE_TYPE;
      exports2.Suspense = REACT_SUSPENSE_TYPE;
      exports2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports2.__COMPILER_RUNTIME = deprecatedAPIs;
      exports2.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports2.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports2.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports2.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key,
          void 0,
          void 0,
          owner,
          props,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          owner = arguments[key], isValidElement(owner) && owner._store && (owner._store.validated = 1);
        return props;
      };
      exports2.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports2.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++) {
          var node = arguments[i];
          isValidElement(node) && node._store && (node._store.validated = 1);
        }
        i = {};
        node = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), node = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        node && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return ReactElement(
          type,
          node,
          void 0,
          void 0,
          getOwner(),
          i,
          propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports2.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports2.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name4) {
            ownName = name4;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name4 }), render.displayName = name4);
          }
        });
        return elementType;
      };
      exports2.isValidElement = isValidElement;
      exports2.lazy = function(ctor) {
        return {
          $$typeof: REACT_LAZY_TYPE,
          _payload: { _status: -1, _result: ctor },
          _init: lazyInitializer
        };
      };
      exports2.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name4) {
            ownName = name4;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name4 }), type.displayName = name4);
          }
        });
        return compare;
      };
      exports2.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        ReactSharedInternals.T = currentTransition;
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop2, reportGlobalError);
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), ReactSharedInternals.T = prevTransition;
        }
      };
      exports2.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports2.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports2.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports2.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports2.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports2.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports2.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports2.useEffect = function(create, createDeps, update) {
        null == create && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        var dispatcher = resolveDispatcher();
        if ("function" === typeof update)
          throw Error(
            "useEffect CRUD overload is not enabled in this build of React."
          );
        return dispatcher.useEffect(create, createDeps);
      };
      exports2.useId = function() {
        return resolveDispatcher().useId();
      };
      exports2.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports2.useInsertionEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports2.useLayoutEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports2.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports2.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports2.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports2.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports2.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports2.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports2.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports2.version = "19.1.0";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
  }
});

// ../node_modules/react/index.js
var require_react = __commonJS({
  "../node_modules/react/index.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_react_production();
    } else {
      module2.exports = require_react_development();
    }
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  aiProxy: () => aiProxy,
  b2bInboundVoiceWebhook: () => b2bInboundVoiceWebhook,
  b2bOrderStaffOps: () => b2bOrderStaffOps,
  b2bStaffQueueSnapshot: () => b2bStaffQueueSnapshot,
  b2bVoiceOrchestrationHook: () => b2bVoiceOrchestrationHook,
  walletOps: () => walletOps
});
module.exports = __toCommonJS(index_exports);

// src/firebaseInit.ts
var import_app = require("firebase-admin/app");
var import_firestore3 = require("firebase-admin/firestore");

// ../src/services/b2b/engines/bookingEngine.ts
var createBookingTransactionImpl = null;
function registerCreateBookingTransaction(impl) {
  createBookingTransactionImpl = impl;
}
async function createBookingTransaction(db2, cmd) {
  if (createBookingTransactionImpl) return createBookingTransactionImpl(db2, cmd);
  return { ok: false, code: "not_implemented", message: "Register createBookingTransaction via registerCreateBookingTransaction (e.g. Cloud Functions init)" };
}

// ../src/services/b2b/engines/orderEngine.ts
var createOrderTransactionImpl = null;
function registerCreateOrderTransaction(impl) {
  createOrderTransactionImpl = impl;
}
async function createOrderTransaction(db2, cmd) {
  if (createOrderTransactionImpl) return createOrderTransactionImpl(db2, cmd);
  return {
    ok: false,
    code: "not_implemented",
    message: "Register createOrderTransaction via registerCreateOrderTransaction (e.g. Cloud Functions init)"
  };
}

// src/b2b/booking/createBookingTransactionAdmin.ts
var import_firestore = require("firebase-admin/firestore");
var import_v2 = require("firebase-functions/v2");

// ../src/domain/b2b/collections.ts
var B2B_ROOT = {
  tenants: "b2b_tenants",
  locations: "locations",
  services: "business_services",
  resources: "business_resources",
  bookings: "business_bookings",
  orders: "business_orders",
  callSessions: "business_call_sessions",
  billingEvents: "business_billing_events",
  staff: "business_staff_accounts",
  /** Maps E.164 inbound number → tenant + location (written only by backend). */
  phoneRouteIndex: "b2b_phone_routes"
};
function tenantDocPath(tenantId) {
  return `${B2B_ROOT.tenants}/${tenantId}`;
}
function tenantSubcollection(tenantId, name4) {
  return `${tenantDocPath(tenantId)}/${name4}`;
}
function resourcesCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.resources);
}
function bookingsCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.bookings);
}
function ordersCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.orders);
}
function callSessionsCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.callSessions);
}
function billingEventsCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.billingEvents);
}
function phoneRouteDocPath(e164) {
  const key = e164.replace(/[^\d+]/g, "");
  return `${B2B_ROOT.phoneRouteIndex}/${key}`;
}

// ../src/config/countryPacks/packs.ts
var EU_EMERGENCY = { primaryNumber: "112", fallbackNumbers: ["112"] };
var EU_DOC_HINT = "Gi\u1EA5y t\u1EDD li\xEAn quan \u0111\u1ECBnh c\u01B0, visa v\xE0 lao \u0111\u1ED9ng t\u1EA1i EU/khu v\u1EF1c ch\xE2u \xC2u; \u01B0u ti\xEAn tr\xEDch xu\u1EA5t ng\xE0y h\u1EBFt h\u1EA1n ch\xEDnh x\xE1c.";
var COUNTRY_PACKS = {
  CZ: {
    countryCode: "CZ",
    regionCode: "EU-CENTRAL",
    locale: "cs-CZ",
    pricingTier: "T1",
    currencyCode: "CZK",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "cs",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  SK: {
    countryCode: "SK",
    regionCode: "EU-CENTRAL",
    locale: "sk-SK",
    pricingTier: "T1",
    currencyCode: "EUR",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "sk",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  PL: {
    countryCode: "PL",
    regionCode: "EU-CENTRAL",
    locale: "pl-PL",
    pricingTier: "T1",
    currencyCode: "PLN",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "pl",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  DE: {
    countryCode: "DE",
    regionCode: "EU-WEST",
    locale: "de-DE",
    pricingTier: "T2",
    currencyCode: "EUR",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "de",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  FR: {
    countryCode: "FR",
    regionCode: "EU-WEST",
    locale: "fr-FR",
    pricingTier: "T2",
    currencyCode: "EUR",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "fr",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  UK: {
    countryCode: "UK",
    regionCode: "EU-WEST",
    locale: "en-GB",
    pricingTier: "T2",
    currencyCode: "GBP",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "en",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  GB: {
    countryCode: "GB",
    regionCode: "EU-WEST",
    locale: "en-GB",
    pricingTier: "T2",
    currencyCode: "GBP",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "en",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  CH: {
    countryCode: "CH",
    regionCode: "EU-WEST",
    locale: "de-CH",
    pricingTier: "T2",
    currencyCode: "CHF",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "de",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  VN: {
    countryCode: "VN",
    regionCode: "SEA",
    locale: "vi-VN",
    pricingTier: "T2",
    currencyCode: "EUR",
    emergencyConfig: { primaryNumber: "115", fallbackNumbers: ["113", "114"] },
    holidayPack: "vn",
    defaultLanguage: "vi",
    legalFlowConfig: {
      defaultScenario: "general",
      visaRenewalEnabled: false,
      documentJurisdictionHint: "Gi\u1EA5y t\u1EDD Vi\u1EC7t Nam ho\u1EB7c gi\u1EA5y t\u1EDD h\u1ED9 chi\u1EBFu/visa li\xEAn quan nh\u1EADp c\u1EA3nh VN."
    }
  }
};
var GLOBAL_UNLISTED_COUNTRY_PACK = {
  countryCode: "ZZ",
  regionCode: "GLOBAL-UNLISTED",
  locale: "en-GB",
  pricingTier: "T2",
  currencyCode: "EUR",
  emergencyConfig: EU_EMERGENCY,
  holidayPack: "global",
  defaultLanguage: "en",
  legalFlowConfig: {
    defaultScenario: "general",
    visaRenewalEnabled: false,
    documentJurisdictionHint: "Gi\u1EA5y t\u1EDD c\xF3 th\u1EC3 \u0111a qu\u1ED1c gia; tr\xEDch xu\u1EA5t ng\xE0y h\u1EBFt h\u1EA1n ch\xEDnh x\xE1c, kh\xF4ng gi\u1EA3 \u0111\u1ECBnh m\u1ED9t khu v\u1EF1c ph\xE1p l\xFD duy nh\u1EA5t."
  }
};

// ../src/config/countryPacks/pricingByTier.ts
var OUTBOUND_CALL_CREDITS_BY_TIER = {
  T1: 99,
  T2: 199,
  T3: 249,
  T4: 349
};
var LETAN_BOOKING_CREDITS_BY_TIER = {
  T1: 29,
  T2: 99,
  T3: 99,
  T4: 129
};

// ../src/config/countryPacks/index.ts
function normalizeCountryCodeOrSentinel(countryCode) {
  const trimmed = countryCode?.trim() ?? "";
  if (!trimmed) return "ZZ";
  const normalized = trimmed.toUpperCase();
  return normalized.length === 2 ? normalized : "ZZ";
}
function resolveCountryPack(countryCode) {
  const normalized = normalizeCountryCodeOrSentinel(countryCode);
  if (normalized === "ZZ") {
    return GLOBAL_UNLISTED_COUNTRY_PACK;
  }
  return COUNTRY_PACKS[normalized] ?? GLOBAL_UNLISTED_COUNTRY_PACK;
}
function pricingTierForUsageDebits(countryCode) {
  const trimmed = countryCode?.trim() ?? "";
  if (!trimmed) {
    return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
  }
  const normalized = trimmed.toUpperCase();
  if (normalized.length !== 2) {
    return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
  }
  const row = COUNTRY_PACKS[normalized];
  if (row) return row.pricingTier;
  return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
}

// ../src/services/b2b/billing/b2bUsagePricing.ts
function creditsPerSuccessfulInboundForTier(tier) {
  return LETAN_BOOKING_CREDITS_BY_TIER[tier];
}
function creditsPerSuccessfulInbound(group) {
  return creditsPerSuccessfulInboundForTier(pricingGroupToTier(group));
}
function pricingGroupToTier(group) {
  return group === "group1" ? "T1" : "T2";
}

// ../src/services/b2b/billing/b2bBillingService.ts
function buildUsageBillingEventPayload(input) {
  const credits = creditsPerSuccessfulInbound(input.pricingGroup);
  return {
    tenantId: input.tenantId,
    type: input.type,
    creditsDelta: -Math.abs(credits),
    idempotencyKey: input.idempotencyKey,
    referenceType: input.type === "usage_successful_booking" ? "booking" : "order",
    referenceId: input.reference.id,
    pricingGroup: input.pricingGroup,
    metadata: {
      source: "inbound_ai_receptionist",
      ...input.reference.b2bVertical ? { b2bVertical: input.reference.b2bVertical } : {},
      ..."isInquiryOnly" in input.reference && input.reference.isInquiryOnly === true ? { billingNote: "inquiry_only_not_debited_here" } : {},
      ...input.type === "usage_successful_order" && "orderSegment" in input.reference && input.reference.orderSegment ? { orderSegment: input.reference.orderSegment } : {},
      ...input.type === "usage_successful_order" && "wholesaleQualification" in input.reference && input.reference.wholesaleQualification ? { wholesaleQualification: input.reference.wholesaleQualification } : {}
    }
  };
}

// ../src/services/b2b/engines/bookingEngineCore.ts
var BOOKING_NON_BLOCKING_STATUSES = ["canceled", "failed"];
function isBlockingBookingStatus(status) {
  return !BOOKING_NON_BLOCKING_STATUSES.includes(status);
}
function intervalsOverlapHalfOpen(startMs, endMs, bStartMs, bEndMs) {
  return endMs > bStartMs && startMs < bEndMs;
}
function bookingConflictsWithWindow(b, startMs, endMs, resourceIds) {
  if (!isBlockingBookingStatus(b.status)) return false;
  const touchesResource = b.resourceIds.some((r) => resourceIds.has(r));
  if (!touchesResource) return false;
  return intervalsOverlapHalfOpen(startMs, endMs, b.startsAtMs, b.endsAtMs);
}
function anyConflict(candidates, startMs, endMs, resourceIds) {
  return candidates.find((b) => bookingConflictsWithWindow(b, startMs, endMs, resourceIds));
}
function pickFirstFreeResource(candidateOrder, existing, windowStartMs, windowEndMs, partySize, resourceCapacity) {
  for (const rid of candidateOrder) {
    const cap = resourceCapacity(rid);
    if (partySize != null && cap != null && partySize > cap) continue;
    const conflict = anyConflict(existing, windowStartMs, windowEndMs, /* @__PURE__ */ new Set([rid]));
    if (!conflict) return [String(rid)];
  }
  return void 0;
}

// ../src/domain/b2b/b2bVerticalBridge.ts
function requiredBookingSlotKeys(bt) {
  if (bt === "hospitality_stay") {
    return ["stayCheckIn", "stayCheckOut", "occupancy", "name"];
  }
  return ["service", "time", "name"];
}

// ../src/services/b2b/merchant/merchantHandoffSummary.ts
function verticalLabel(bt) {
  if (!bt) return "Unknown vertical";
  switch (bt) {
    case "hospitality_stay":
      return "Hospitality \xB7 stay request";
    case "grocery_wholesale":
      return "Grocery \xB7 wholesale (\u0111\u1ED5 h\xE0ng)";
    case "grocery_retail":
      return "Grocery \xB7 retail";
    case "potraviny":
      return "Grocery \xB7 retail (legacy businessType; migrate to grocery_retail)";
    case "nails":
      return "Nails";
    case "restaurant":
      return "Restaurant";
    default:
      return bt;
  }
}
function buildBookingHandoffSummary(booking) {
  const bt = booking.b2bVertical;
  const inquiry = booking.isInquiryOnly === true || bt === "hospitality_stay" && booking.status === "pending_confirm";
  const stayParts = [
    booking.stayCheckInDate && `Check-in: ${booking.stayCheckInDate}`,
    booking.stayCheckOutDate && `Check-out: ${booking.stayCheckOutDate}`,
    booking.adults != null && `Adults: ${booking.adults}`,
    booking.children != null && `Children: ${booking.children}`,
    booking.roomUnitLabel && `Room/unit: ${booking.roomUnitLabel}`
  ].filter(Boolean);
  const lines = [
    `Vertical: ${verticalLabel(bt)}`,
    `Status: ${booking.status}`,
    inquiry ? "Type: inquiry / awaiting staff confirmation (not a final sale)." : "Type: committed booking record.",
    `Customer: ${booking.customerName ?? "\u2014"} \xB7 ${booking.customerPhoneE164 ?? "\u2014"}`,
    `Resources: ${booking.resourceIds.join(", ") || "\u2014"}`,
    `Services: ${booking.serviceIds.join(", ") || "\u2014"}`,
    ...stayParts,
    booking.partySize != null ? `Party size: ${booking.partySize}` : "",
    booking.notes ? `Notes: ${booking.notes}` : ""
  ].filter(Boolean);
  return {
    title: inquiry ? "Stay / booking \u2014 inquiry" : "Stay / booking \u2014 update",
    lines,
    escalation: inquiry ? "staff_callback" : "none",
    billableNote: inquiry ? "No usage debit until policy marks billable confirm." : "Debit only if matching billing event exists on server."
  };
}
function buildOrderHandoffSummary(order) {
  const seg = order.orderSegment ?? (order.b2bVertical === "grocery_wholesale" ? "wholesale" : "retail");
  const qual = order.wholesaleQualification ?? "needs_clarification";
  const wholesale = seg === "wholesale";
  const lineSummaries = order.lines.map((l, i) => {
    const flag = l.needsClarification ? " [CLARIFY]" : "";
    return `${i + 1}. ${l.name} \xD7 ${l.quantity}${flag}`;
  });
  const clar = order.lineClarifications?.length ? order.lineClarifications.map((c) => `Line ${c.lineIndex + 1}: ${c.vi ?? c.en ?? c.cs ?? "?"}`).join(" | ") : "";
  const lines = [
    `Vertical: ${verticalLabel(order.b2bVertical)} \xB7 segment: ${seg}`,
    `Fulfillment: ${order.fulfillment}`,
    `Status: ${order.status}`,
    wholesale ? `Wholesale stage: ${qual} (confirmed_for_fulfillment = OK to treat as firm).` : "",
    `Customer: ${order.customerName ?? "\u2014"} \xB7 ${order.customerPhoneE164 ?? "\u2014"}`,
    order.deliveryAddress ? `Address: ${order.deliveryAddress}` : "",
    order.palletOrVolumeHint ? `Volume hint: ${order.palletOrVolumeHint}` : "",
    "Lines:",
    ...lineSummaries,
    clar ? `Open questions: ${clar}` : ""
  ].filter(Boolean);
  let escalation = "none";
  if (wholesale && qual !== "confirmed_for_fulfillment") escalation = "clarification_required";
  if (order.lines.some((l) => l.needsClarification)) escalation = "clarification_required";
  return {
    title: wholesale ? "Wholesale order \u2014 intake" : "Retail order \u2014 intake",
    lines,
    escalation,
    billableNote: wholesale && qual !== "confirmed_for_fulfillment" ? "Do not debit usage until wholesale is qualified and confirmed for fulfillment." : "Debit only after server posts usage_successful_order."
  };
}
function formatHandoffBlock(block) {
  return [block.title, "", ...block.lines, "", `Escalation: ${block.escalation}`, `Billing: ${block.billableNote}`].join(
    "\n"
  );
}

// ../src/services/b2b/reliability/idempotency.ts
function bookingIdempotencyKey(callSessionId, provisionalSlotDigest) {
  return `booking:${callSessionId}:${provisionalSlotDigest}`;
}
function orderIdempotencyKey(callSessionId, cartDigest) {
  return `order:${callSessionId}:${cartDigest}`;
}
function callSessionIdempotencyKey(provider, externalCallId) {
  return `call:${provider}:${externalCallId}`;
}
function billingUsageIdempotencyKey(kind, entityId) {
  return `billing:usage:${kind}:${entityId}`;
}

// src/b2b/booking/createBookingTransactionAdmin.ts
function docToBooking(id, d) {
  return {
    id,
    tenantId: String(d.tenantId ?? ""),
    locationId: String(d.locationId ?? ""),
    status: d.status,
    customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : void 0,
    customerName: d.customerName ? String(d.customerName) : void 0,
    serviceIds: Array.isArray(d.serviceIds) ? d.serviceIds : [],
    resourceIds: Array.isArray(d.resourceIds) ? d.resourceIds : [],
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    idempotencyKey: String(d.idempotencyKey ?? ""),
    sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : void 0,
    notes: d.notes ? String(d.notes) : void 0,
    partySize: typeof d.partySize === "number" ? d.partySize : void 0,
    b2bVertical: d.b2bVertical,
    stayCheckInDate: d.stayCheckInDate ? String(d.stayCheckInDate) : void 0,
    stayCheckOutDate: d.stayCheckOutDate ? String(d.stayCheckOutDate) : void 0,
    adults: typeof d.adults === "number" ? d.adults : void 0,
    children: typeof d.children === "number" ? d.children : void 0,
    roomUnitLabel: d.roomUnitLabel ? String(d.roomUnitLabel) : void 0,
    isInquiryOnly: d.isInquiryOnly === true,
    staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}
function toOverlapLike(id, d, startMs, endMs) {
  const status = d.status;
  const startsAt = d.startsAt;
  const endsAt = d.endsAt;
  if (!startsAt?.toMillis || !endsAt?.toMillis) return null;
  const startsAtMs = startsAt.toMillis();
  const endsAtMs = endsAt.toMillis();
  if (!intervalsOverlapHalfOpen(startMs, endMs, startsAtMs, endsAtMs)) return null;
  if (!isBlockingBookingStatus(status)) return null;
  const resourceIds = Array.isArray(d.resourceIds) ? d.resourceIds : [];
  return { id, startsAtMs, endsAtMs, resourceIds, status };
}
function snapToOverlappers(snap, windowStart, windowEnd) {
  const out = [];
  for (const doc of snap.docs) {
    const row = toOverlapLike(doc.id, doc.data(), windowStart, windowEnd);
    if (row) out.push(row);
  }
  return out;
}
async function loadResourceCaps(tx, db2, tenantId, ids) {
  const map = /* @__PURE__ */ new Map();
  for (const rid of ids) {
    const ref = db2.doc(`${resourcesCollectionPath(tenantId)}/${rid}`);
    const s = await tx.get(ref);
    if (!s.exists) continue;
    const d = s.data();
    map.set(rid, {
      locationId: String(d.locationId ?? ""),
      active: Boolean(d.active ?? true),
      capacity: typeof d.capacity === "number" ? d.capacity : 1
    });
  }
  return map;
}
async function createBookingTransactionAdmin(db2, cmd) {
  if (cmd.endsAtMs <= cmd.startsAtMs) {
    return { ok: false, code: "invalid_window", message: "endsAtMs must be after startsAtMs" };
  }
  const tenantRef = db2.doc(tenantDocPath(cmd.tenantId));
  const bookingsPath = bookingsCollectionPath(cmd.tenantId);
  const bookingsCol = db2.collection(bookingsPath);
  const billingCol = db2.collection(billingEventsCollectionPath(cmd.tenantId));
  try {
    const outcome = await db2.runTransaction(async (tx) => {
      const tenantSnap = await tx.get(tenantRef);
      if (!tenantSnap.exists) {
        return { outcome: "fail", code: "tenant_not_found", message: "Tenant doc missing" };
      }
      const tenant = tenantSnap.data();
      if (tenant.status === "suspended") {
        return { outcome: "fail", code: "tenant_suspended", message: "AI reception disabled for tenant" };
      }
      const idemQ = bookingsCol.where("idempotencyKey", "==", cmd.idempotencyKey).limit(1);
      const idemSnap = await tx.get(idemQ);
      if (!idemSnap.empty) {
        const doc = idemSnap.docs[0];
        const existingBooking = docToBooking(doc.id, doc.data());
        const billingIdem = billingUsageIdempotencyKey("booking", existingBooking.id);
        const billQ = billingCol.where("idempotencyKey", "==", billingIdem).limit(1);
        const billSnap = await tx.get(billQ);
        const billingEventId = billSnap.empty ? void 0 : billSnap.docs[0].id;
        return { outcome: "success", booking: existingBooking, billingEventId };
      }
      const pricingGroup = tenant.billing?.pricingGroup ?? "group2";
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const billable = cmd.billable !== false;
      const balance = tenant.billing?.walletCreditsBalance ?? 0;
      if (billable && balance < credits) {
        return {
          outcome: "fail",
          code: "insufficient_credits",
          message: `Need ${credits} credits, balance ${balance}`
        };
      }
      let finalResourceIds = [...cmd.resourceIds];
      const stayInquiryProvisional = !billable && (cmd.businessType === "hospitality_stay" || cmd.treatAsStayInquiry === true);
      if (finalResourceIds.length === 0) {
        const candidates = cmd.resourceCandidateIds ?? [];
        if (candidates.length === 0) {
          if (stayInquiryProvisional) {
            finalResourceIds = [];
          } else {
            return {
              outcome: "fail",
              code: "invalid_resource",
              message: "resourceIds or resourceCandidateIds required"
            };
          }
        } else {
          const capMap = await loadResourceCaps(tx, db2, cmd.tenantId, candidates);
          const resourceCapacity = (rid) => capMap.get(rid)?.capacity;
          const merged = [];
          for (const rid of candidates) {
            const meta = capMap.get(rid);
            if (!meta || !meta.active || meta.locationId !== cmd.locationId) continue;
            const q = bookingsCol.where("locationId", "==", cmd.locationId).where("resourceIds", "array-contains", rid).where("startsAt", "<", import_firestore.Timestamp.fromMillis(cmd.endsAtMs));
            const os = await tx.get(q);
            merged.push(...snapToOverlappers(os, cmd.startsAtMs, cmd.endsAtMs));
          }
          const dedupe = dedupeOverlappers(merged);
          const picked = pickFirstFreeResource(
            candidates,
            dedupe,
            cmd.startsAtMs,
            cmd.endsAtMs,
            cmd.partySize,
            resourceCapacity
          );
          if (!picked) {
            return { outcome: "fail", code: "overlap", message: "No free resource in candidates" };
          }
          finalResourceIds = picked;
        }
      }
      if (finalResourceIds.length > 0) {
        const capMapAssigned = await loadResourceCaps(tx, db2, cmd.tenantId, finalResourceIds);
        for (const rid of finalResourceIds) {
          const meta = capMapAssigned.get(rid);
          if (!meta || !meta.active || meta.locationId !== cmd.locationId) {
            return { outcome: "fail", code: "invalid_resource", message: `Resource ${rid} not usable at location` };
          }
          if (cmd.businessType === "restaurant" && cmd.partySize != null && cmd.partySize > meta.capacity) {
            return {
              outcome: "fail",
              code: "party_size",
              message: `Party ${cmd.partySize} exceeds resource capacity ${meta.capacity}`
            };
          }
        }
        const overlappersAcc = [];
        for (const rid of finalResourceIds) {
          const q = bookingsCol.where("locationId", "==", cmd.locationId).where("resourceIds", "array-contains", rid).where("startsAt", "<", import_firestore.Timestamp.fromMillis(cmd.endsAtMs));
          const os = await tx.get(q);
          overlappersAcc.push(...snapToOverlappers(os, cmd.startsAtMs, cmd.endsAtMs));
        }
        const unique = dedupeOverlappers(overlappersAcc);
        const conflict = anyConflict(unique, cmd.startsAtMs, cmd.endsAtMs, new Set(finalResourceIds));
        if (conflict) {
          return { outcome: "fail", code: "overlap", message: `Resource held by booking ${conflict.id}` };
        }
      }
      const bookingRef = bookingsCol.doc();
      const billingRef = billingCol.doc();
      const now = import_firestore.FieldValue.serverTimestamp();
      const bookingId = bookingRef.id;
      const startsAtTs = import_firestore.Timestamp.fromMillis(cmd.startsAtMs);
      const endsAtTs = import_firestore.Timestamp.fromMillis(cmd.endsAtMs);
      const bookingStatus = billable ? "confirmed" : "pending_confirm";
      const bookingStub = {
        id: bookingId,
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: bookingStatus,
        customerPhoneE164: cmd.customerPhoneE164,
        customerName: cmd.customerName,
        serviceIds: cmd.serviceIds,
        resourceIds: finalResourceIds,
        startsAt: startsAtTs,
        endsAt: endsAtTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId,
        notes: cmd.notes,
        partySize: cmd.partySize,
        b2bVertical: cmd.businessType,
        stayCheckInDate: cmd.stayCheckInDate,
        stayCheckOutDate: cmd.stayCheckOutDate,
        adults: cmd.adults,
        children: cmd.children,
        roomUnitLabel: cmd.roomUnitLabel,
        isInquiryOnly: cmd.isInquiryOnly === true || !billable,
        createdAt: now,
        updatedAt: now
      };
      const staffHandoffSummary = cmd.staffHandoffSummary ?? formatHandoffBlock(buildBookingHandoffSummary(bookingStub));
      const bookingRow = {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: bookingStatus,
        customerPhoneE164: cmd.customerPhoneE164 ?? null,
        customerName: cmd.customerName ?? null,
        serviceIds: cmd.serviceIds,
        resourceIds: finalResourceIds,
        startsAt: startsAtTs,
        endsAt: endsAtTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId ?? null,
        notes: cmd.notes ?? null,
        partySize: cmd.partySize ?? null,
        b2bVertical: cmd.businessType,
        stayCheckInDate: cmd.stayCheckInDate ?? null,
        stayCheckOutDate: cmd.stayCheckOutDate ?? null,
        adults: cmd.adults ?? null,
        children: cmd.children ?? null,
        roomUnitLabel: cmd.roomUnitLabel ?? null,
        isInquiryOnly: cmd.isInquiryOnly === true || !billable,
        staffHandoffSummary,
        createdAt: now,
        updatedAt: now
      };
      tx.set(bookingRef, bookingRow);
      Object.assign(bookingStub, { staffHandoffSummary });
      if (billable) {
        const billingPayload = buildUsageBillingEventPayload({
          tenantId: cmd.tenantId,
          pricingGroup,
          type: "usage_successful_booking",
          idempotencyKey: billingUsageIdempotencyKey("booking", bookingId),
          reference: bookingStub
        });
        tx.set(billingRef, {
          ...billingPayload,
          id: billingRef.id,
          createdAt: now
        });
        tx.update(tenantRef, {
          "billing.walletCreditsBalance": import_firestore.FieldValue.increment(-credits),
          updatedAt: now
        });
      }
      return { outcome: "success", booking: bookingStub, billingEventId: billable ? billingRef.id : void 0 };
    });
    if (outcome.outcome === "fail") {
      return { ok: false, code: outcome.code, message: outcome.message };
    }
    const fresh = await db2.collection(bookingsPath).doc(outcome.booking.id).get();
    if (fresh.exists) {
      import_v2.logger.info("[b2bBooking] transaction_ok", {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        bookingId: fresh.id,
        billingEventId: outcome.billingEventId,
        idempotencyKey: cmd.idempotencyKey
      });
      return {
        ok: true,
        booking: docToBooking(fresh.id, fresh.data()),
        billingEventId: outcome.billingEventId
      };
    }
    import_v2.logger.info("[b2bBooking] transaction_ok", {
      tenantId: cmd.tenantId,
      locationId: cmd.locationId,
      bookingId: outcome.booking.id,
      billingEventId: outcome.billingEventId,
      idempotencyKey: cmd.idempotencyKey
    });
    return { ok: true, booking: outcome.booking, billingEventId: outcome.billingEventId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "transaction_aborted", message: msg };
  }
}
function dedupeOverlappers(rows) {
  const byId = /* @__PURE__ */ new Map();
  for (const r of rows) byId.set(r.id, r);
  return [...byId.values()];
}

// src/b2b/order/createOrderTransactionAdmin.ts
var import_firestore2 = require("firebase-admin/firestore");
var import_v22 = require("firebase-functions/v2");

// src/b2b/order/orderDocMappers.ts
function docToOrder(id, d) {
  return {
    id,
    tenantId: String(d.tenantId ?? ""),
    locationId: String(d.locationId ?? ""),
    status: d.status,
    lines: Array.isArray(d.lines) ? d.lines : [],
    customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : void 0,
    customerName: d.customerName ? String(d.customerName) : void 0,
    fulfillment: d.fulfillment ?? "pickup",
    windowStart: d.windowStart,
    windowEnd: d.windowEnd,
    idempotencyKey: String(d.idempotencyKey ?? ""),
    sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : void 0,
    deliveryAddress: d.deliveryAddress ? String(d.deliveryAddress) : void 0,
    b2bVertical: d.b2bVertical,
    orderSegment: d.orderSegment,
    wholesaleQualification: d.wholesaleQualification,
    lineClarifications: Array.isArray(d.lineClarifications) ? d.lineClarifications : void 0,
    palletOrVolumeHint: d.palletOrVolumeHint ? String(d.palletOrVolumeHint) : void 0,
    staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}

// src/b2b/order/createOrderTransactionAdmin.ts
async function createOrderTransactionAdmin(db2, cmd) {
  if (!cmd.lines?.length) {
    return { ok: false, code: "invalid_lines", message: "At least one order line required" };
  }
  if (cmd.windowEndMs <= cmd.windowStartMs) {
    return { ok: false, code: "invalid_window", message: "windowEndMs must be after windowStartMs" };
  }
  const tenantRef = db2.doc(tenantDocPath(cmd.tenantId));
  const ordersPath = ordersCollectionPath(cmd.tenantId);
  const ordersCol = db2.collection(ordersPath);
  const billingCol = db2.collection(billingEventsCollectionPath(cmd.tenantId));
  try {
    const outcome = await db2.runTransaction(async (tx) => {
      const tenantSnap = await tx.get(tenantRef);
      if (!tenantSnap.exists) {
        return { outcome: "fail", code: "tenant_not_found", message: "Tenant doc missing" };
      }
      const tenant = tenantSnap.data();
      if (tenant.status === "suspended") {
        return { outcome: "fail", code: "tenant_suspended", message: "AI reception disabled for tenant" };
      }
      const idemQ = ordersCol.where("idempotencyKey", "==", cmd.idempotencyKey).limit(1);
      const idemSnap = await tx.get(idemQ);
      if (!idemSnap.empty) {
        const doc = idemSnap.docs[0];
        const existing = docToOrder(doc.id, doc.data());
        const billingIdem = billingUsageIdempotencyKey("order", existing.id);
        const billQ = billingCol.where("idempotencyKey", "==", billingIdem).limit(1);
        const billSnap = await tx.get(billQ);
        const billingEventId = billSnap.empty ? void 0 : billSnap.docs[0].id;
        return { outcome: "success", order: existing, billingEventId };
      }
      const pricingGroup = tenant.billing?.pricingGroup ?? "group2";
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const balance = tenant.billing?.walletCreditsBalance ?? 0;
      const orderSegment = cmd.orderSegment ?? (cmd.businessType === "grocery_wholesale" ? "wholesale" : "retail");
      const wholesale = orderSegment === "wholesale" || cmd.businessType === "grocery_wholesale";
      const wholesaleQualification = wholesale ? cmd.wholesaleQualification ?? "needs_clarification" : cmd.wholesaleQualification;
      const billWanted = cmd.billable === true;
      const debitAllowed = billWanted && (!wholesale || wholesaleQualification === "confirmed_for_fulfillment");
      if (debitAllowed && balance < credits) {
        return {
          outcome: "fail",
          code: "insufficient_credits",
          message: `Need ${credits} credits, balance ${balance}`
        };
      }
      const orderRef = ordersCol.doc();
      const billingRef = billingCol.doc();
      const now = import_firestore2.FieldValue.serverTimestamp();
      const orderId = orderRef.id;
      const windowStartTs = import_firestore2.Timestamp.fromMillis(cmd.windowStartMs);
      const windowEndTs = import_firestore2.Timestamp.fromMillis(cmd.windowEndMs);
      const orderStatus = debitAllowed ? "confirmed" : "pending_confirm";
      const b2bVertical = cmd.b2bVertical ?? cmd.businessType;
      const orderStub = {
        id: orderId,
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: orderStatus,
        lines: cmd.lines,
        customerPhoneE164: cmd.customerPhoneE164,
        customerName: cmd.customerName,
        fulfillment: cmd.fulfillment,
        windowStart: windowStartTs,
        windowEnd: windowEndTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId,
        deliveryAddress: cmd.deliveryAddress,
        b2bVertical,
        orderSegment,
        wholesaleQualification,
        lineClarifications: cmd.lineClarifications,
        palletOrVolumeHint: cmd.palletOrVolumeHint,
        createdAt: now,
        updatedAt: now
      };
      const staffHandoffSummary = cmd.staffHandoffSummary ?? formatHandoffBlock(buildOrderHandoffSummary(orderStub));
      Object.assign(orderStub, { staffHandoffSummary });
      const orderRow = {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: orderStatus,
        lines: cmd.lines,
        customerPhoneE164: cmd.customerPhoneE164 ?? null,
        customerName: cmd.customerName ?? null,
        fulfillment: cmd.fulfillment,
        windowStart: windowStartTs,
        windowEnd: windowEndTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId ?? null,
        deliveryAddress: cmd.deliveryAddress ?? null,
        b2bVertical,
        orderSegment,
        wholesaleQualification: wholesaleQualification ?? null,
        lineClarifications: cmd.lineClarifications ?? null,
        palletOrVolumeHint: cmd.palletOrVolumeHint ?? null,
        staffHandoffSummary,
        createdAt: now,
        updatedAt: now
      };
      tx.set(orderRef, orderRow);
      if (debitAllowed) {
        const billingPayload = buildUsageBillingEventPayload({
          tenantId: cmd.tenantId,
          pricingGroup,
          type: "usage_successful_order",
          idempotencyKey: billingUsageIdempotencyKey("order", orderId),
          reference: orderStub
        });
        tx.set(billingRef, {
          ...billingPayload,
          id: billingRef.id,
          createdAt: now
        });
        tx.update(tenantRef, {
          "billing.walletCreditsBalance": import_firestore2.FieldValue.increment(-credits),
          updatedAt: now
        });
      }
      return { outcome: "success", order: orderStub, billingEventId: debitAllowed ? billingRef.id : void 0 };
    });
    if (outcome.outcome === "fail") {
      return { ok: false, code: outcome.code, message: outcome.message };
    }
    const fresh = await db2.collection(ordersPath).doc(outcome.order.id).get();
    if (fresh.exists) {
      import_v22.logger.info("[b2bOrder] transaction_ok", {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        orderId: fresh.id,
        billingEventId: outcome.billingEventId,
        idempotencyKey: cmd.idempotencyKey
      });
      return {
        ok: true,
        order: docToOrder(fresh.id, fresh.data()),
        billingEventId: outcome.billingEventId
      };
    }
    return { ok: true, order: outcome.order, billingEventId: outcome.billingEventId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "transaction_aborted", message: msg };
  }
}

// src/firebaseInit.ts
(0, import_app.initializeApp)();
registerCreateBookingTransaction((db2, cmd) => {
  const fs = db2 ?? (0, import_firestore3.getFirestore)();
  return createBookingTransactionAdmin(fs, cmd);
});
registerCreateOrderTransaction((db2, cmd) => {
  const fs = db2 ?? (0, import_firestore3.getFirestore)();
  return createOrderTransactionAdmin(fs, cmd);
});

// src/index.ts
var import_firestore7 = require("firebase-admin/firestore");
var import_v29 = require("firebase-functions/v2");
var import_https2 = require("firebase-functions/v2/https");
var import_firestore8 = require("firebase-admin/firestore");

// ../src/services/b2b/ai/receptionistOrchestrator.ts
async function resolveTenantByPhone(db2, repos, input) {
  return repos.phoneRoute.getByInboundE164(db2, input.inboundNumberE164);
}
async function commitBooking(db2, _repos, cmd) {
  return createBookingTransaction(db2, cmd);
}
async function commitOrder(db2, _repos, cmd) {
  return createOrderTransaction(db2, cmd);
}

// src/appCheckGate.ts
var import_app_check = require("firebase-admin/app-check");
var import_v23 = require("firebase-functions/v2");
async function verifyAppCheckForRequest(req, context) {
  const enforce = process.env.FIREBASE_APP_CHECK_ENFORCE?.trim() === "1";
  const token = String(req.header("X-Firebase-AppCheck") ?? req.header("x-firebase-appcheck") ?? "").trim();
  if (!token) {
    if (enforce) {
      import_v23.logger.error(`[${context}] app_check_missing_enforced`, {
        trust_gate: "app_check",
        context,
        enforce: true,
        doc: "docs/G5_PLATFORM_TRUST.md"
      });
      return { ok: false, status: 401, error: "app_check_token_required" };
    }
    return { ok: true };
  }
  try {
    await (0, import_app_check.getAppCheck)().verifyToken(token);
    if (!enforce) {
      import_v23.logger.info(`[${context}] app_check_ok_optional`, { trust_gate: "app_check", context, enforce: false });
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "verify_failed";
    if (enforce) {
      import_v23.logger.warn(`[${context}] app_check_invalid`, { message: msg });
      return { ok: false, status: 401, error: "app_check_invalid" };
    }
    import_v23.logger.warn(`[${context}] app_check_invalid_optional`, { message: msg });
    return { ok: true };
  }
}

// src/trustRuntimeDiagnostics.ts
var import_v24 = require("firebase-functions/v2");
var logged = false;
function logRuntimeTrustPostureOnce() {
  if (logged) return;
  logged = true;
  const appCheckEnforced = process.env.FIREBASE_APP_CHECK_ENFORCE?.trim() === "1";
  const appCheckNativeExpected = process.env.FIREBASE_APP_CHECK_NATIVE_EXPECTED?.trim() === "1";
  const aiProxyAuthRequired = process.env.AI_PROXY_REQUIRE_AUTH?.trim() !== "0";
  const receiptEnforced = process.env.WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT?.trim() === "1";
  const trustProfile = (process.env.RUNTIME_TRUST_PROFILE ?? "pilot_default").trim() || "pilot_default";
  import_v24.logger.info("[trust_runtime] cold_start_posture", {
    trust_profile: trustProfile,
    app_check_enforced: appCheckEnforced,
    app_check_native_expected: appCheckNativeExpected,
    ai_proxy_auth_required: aiProxyAuthRequired,
    wallet_topup_receipt_enforced: receiptEnforced,
    wallet_topup_receipt_require_wallet_uid: process.env.WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID?.trim() === "1",
    wallet_topup_receipt_require_credits_grant: process.env.WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT?.trim() === "1"
  });
  if (appCheckEnforced) {
    if (appCheckNativeExpected) {
      import_v24.logger.info("[trust_runtime] app_check_enforce_with_native_expected", {
        reminder: "FIREBASE_APP_CHECK_ENFORCE=1 and FIREBASE_APP_CHECK_NATIVE_EXPECTED=1: operators assert iOS/Android clients send X-Firebase-AppCheck (M1: @react-native-firebase/app-check). Revoke NATIVE_EXPECTED if store builds regress. Web uses EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY. See docs/G5_PLATFORM_TRUST.md"
      });
    } else {
      const webOnlyAck = process.env.FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT?.trim() === "1";
      if (webOnlyAck) {
        import_v24.logger.warn("[trust_runtime] app_check_enforce_WEB_ONLY_ACK", {
          reminder: "FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1: operators assert this deployment is never hit by native/Expo Go without tokens (401 on gated HTTPS when enforce=1). If native traffic shares this URL, fix routing or set FIREBASE_APP_CHECK_NATIVE_EXPECTED=1 after M1 verification. docs/G5_PLATFORM_TRUST.md"
        });
      } else {
        import_v24.logger.error("[trust_runtime] app_check_enforce_WITHOUT_native_expected_UNSAFE_DEFAULT", {
          reminder: "FIREBASE_APP_CHECK_ENFORCE=1 without FIREBASE_APP_CHECK_NATIVE_EXPECTED=1: native dev-client/store builds that lack a valid App Check token will get 401 on aiProxy/walletOps/b2bStaffQueueSnapshot. Expo Go cannot send native App Check. After verifying native tokens E2E, set FIREBASE_APP_CHECK_NATIVE_EXPECTED=1. For deliberately web-only enforced backends, set FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1 (see docs/G5_PLATFORM_TRUST.md)."
        });
      }
    }
  }
}

// src/b2b/order/processOrderStaffOpsRequest.ts
var import_firestore4 = require("firebase-admin/firestore");
var import_v25 = require("firebase-functions/v2");
async function processOrderStaffOpsRequest(db2, body) {
  if (body.action !== "set_wholesale_qualification") {
    return { ok: false, error: "unsupported_action" };
  }
  const tenantId = body.tenantId?.trim();
  const orderId = body.orderId?.trim();
  if (!tenantId || !orderId) {
    return { ok: false, error: "missing_tenantId_or_orderId" };
  }
  const orderRef = db2.doc(`${ordersCollectionPath(tenantId)}/${orderId}`);
  const tenantRef = db2.doc(tenantDocPath(tenantId));
  const billingCol = db2.collection(billingEventsCollectionPath(tenantId));
  try {
    const out = await db2.runTransaction(async (tx) => {
      const [orderSnap, tenantSnap] = await Promise.all([tx.get(orderRef), tx.get(tenantRef)]);
      if (!tenantSnap.exists) {
        return { kind: "fail", error: "tenant_not_found" };
      }
      if (!orderSnap.exists) {
        return { kind: "fail", error: "order_not_found" };
      }
      const tenant = tenantSnap.data();
      if (tenant.status === "suspended") {
        return { kind: "fail", error: "tenant_suspended" };
      }
      const row = docToOrder(orderId, orderSnap.data());
      const wholesale = row.orderSegment === "wholesale" || row.b2bVertical === "grocery_wholesale";
      if (!wholesale) {
        return { kind: "fail", error: "order_not_wholesale_segment" };
      }
      const next = body.wholesaleQualification;
      const debitWanted = next === "confirmed_for_fulfillment" && body.requestUsageDebit !== false;
      const pricingGroup = tenant.billing?.pricingGroup ?? "group2";
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const balance = tenant.billing?.walletCreditsBalance ?? 0;
      const billingIdem = billingUsageIdempotencyKey("order", orderId);
      const billQ = billingCol.where("idempotencyKey", "==", billingIdem).limit(1);
      const billSnap = await tx.get(billQ);
      const alreadyBilled = !billSnap.empty;
      if (debitWanted && !alreadyBilled && balance < credits) {
        return { kind: "fail", error: "insufficient_credits" };
      }
      const now = import_firestore4.FieldValue.serverTimestamp();
      const newStatus = next === "confirmed_for_fulfillment" ? "confirmed" : row.status === "draft" ? "pending_confirm" : row.status;
      const updated = {
        ...row,
        wholesaleQualification: next,
        status: newStatus,
        updatedAt: now
      };
      const staffHandoffSummary = formatHandoffBlock(buildOrderHandoffSummary(updated));
      tx.update(orderRef, {
        wholesaleQualification: next,
        status: newStatus,
        staffHandoffSummary,
        updatedAt: now
      });
      let billingEventId;
      if (debitWanted && !alreadyBilled) {
        const billingRef = billingCol.doc();
        const billingPayload = buildUsageBillingEventPayload({
          tenantId,
          pricingGroup,
          type: "usage_successful_order",
          idempotencyKey: billingIdem,
          reference: { ...updated, id: orderId }
        });
        tx.set(billingRef, {
          ...billingPayload,
          id: billingRef.id,
          createdAt: now
        });
        tx.update(tenantRef, {
          "billing.walletCreditsBalance": import_firestore4.FieldValue.increment(-credits),
          updatedAt: now
        });
        billingEventId = billingRef.id;
      } else if (alreadyBilled) {
        billingEventId = billSnap.docs[0].id;
      }
      return { kind: "ok", wholesaleQualification: next, billingEventId };
    });
    if (out.kind === "fail") {
      return { ok: false, error: out.error };
    }
    import_v25.logger.info("[b2bOrderStaff] qualification_updated", {
      tenantId,
      orderId,
      wholesaleQualification: out.wholesaleQualification,
      billingEventId: out.billingEventId
    });
    return {
      ok: true,
      orderId,
      wholesaleQualification: out.wholesaleQualification,
      billingEventId: out.billingEventId
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

// src/b2b/voice/processVoiceOrchestrationRequest.ts
var import_v27 = require("firebase-functions/v2");

// ../src/services/b2b/ai/bookingToCallSessionFailure.ts
function mapBookingCodeToCallFailure(code, message) {
  const msg = message ?? code;
  switch (code) {
    case "overlap":
      return { outcome: "fail", failureCode: "no_available_resource", failureReason: msg };
    case "insufficient_credits":
      return { outcome: "fail", failureCode: "insufficient_credits", failureReason: msg };
    case "invalid_resource":
    case "invalid_window":
    case "party_size":
    case "not_implemented":
      return { outcome: "fail", failureCode: "invalid_input", failureReason: msg };
    case "tenant_not_found":
      return { outcome: "fail", failureCode: "tenant_not_found", failureReason: msg };
    case "tenant_suspended":
      return { outcome: "fail", failureCode: "tenant_suspended", failureReason: msg };
    default:
      return { outcome: "fail", failureCode: "internal_error", failureReason: msg };
  }
}
function mapOrderCodeToCallFailure(code, message) {
  const msg = message ?? code;
  switch (code) {
    case "insufficient_credits":
      return { outcome: "fail", failureCode: "insufficient_credits", failureReason: msg };
    case "invalid_lines":
    case "invalid_window":
    case "not_implemented":
      return { outcome: "fail", failureCode: "invalid_input", failureReason: msg };
    case "tenant_not_found":
      return { outcome: "fail", failureCode: "tenant_not_found", failureReason: msg };
    case "tenant_suspended":
      return { outcome: "fail", failureCode: "tenant_suspended", failureReason: msg };
    default:
      return { outcome: "fail", failureCode: "internal_error", failureReason: msg };
  }
}

// ../src/services/b2b/ai/bookingSlotExtraction.ts
function stripRolePrefix(line) {
  return line.replace(/^\s*Caller:\s*/i, "").replace(/^\s*Assistant:\s*/i, "").trim();
}
function mergeField(prev, next) {
  if (next != null && String(next).trim().length > 0) return String(next).trim();
  return prev;
}
function mergeSlotState(prev, patch) {
  return {
    service: mergeField(prev.service, patch.service),
    time: mergeField(prev.time, patch.time),
    name: mergeField(prev.name, patch.name),
    stayCheckIn: mergeField(prev.stayCheckIn, patch.stayCheckIn),
    stayCheckOut: mergeField(prev.stayCheckOut, patch.stayCheckOut),
    occupancy: mergeField(prev.occupancy, patch.occupancy)
  };
}
function slotValue(s, key) {
  switch (key) {
    case "service":
      return s.service;
    case "time":
      return s.time;
    case "name":
      return s.name;
    case "stayCheckIn":
      return s.stayCheckIn;
    case "stayCheckOut":
      return s.stayCheckOut;
    case "occupancy":
      return s.occupancy;
  }
}
function missingBookingSlots(bt, s) {
  return requiredBookingSlotKeys(bt).filter((k) => !String(slotValue(s, k) ?? "").trim());
}
function allBookingSlotsFilled(bt, s) {
  return missingBookingSlots(bt, s).length === 0;
}
function extractSlotsFromUtterance(raw) {
  const text = stripRolePrefix(raw).trim();
  if (!text) return {};
  const out = {};
  const namePatterns = [
    /(?:my name is|i'?m\s+called|i am|call me|tên\s*(?:là|of|is))\s*[:\-]?\s*([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s'.-]{1,48})/iu,
    /(?:jmenuji se|jméno je)\s+([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s'.-]{1,48})/iu
  ];
  for (const re of namePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      out.name = m[1].trim();
      break;
    }
  }
  const timePatterns = [
    /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/i,
    /\b(\d{1,2}\s*(?:am|pm))\b/i,
    /\b(?:tomorrow|today|tonight|mai|hôm nay|ngày mai)\b[^.!?]*(?:\d{1,2}\s*(?:giờ|h|:))?\s*/iu,
    /\b(?:lúc|at|@)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|giờ)?)\b/iu,
    /\b(?:morning|afternoon|evening|chiều|sáng|tối)\b/iu
  ];
  for (const re of timePatterns) {
    const m = text.match(re);
    if (m?.[0]) {
      out.time = m[0].replace(/\s+/g, " ").trim();
      break;
    }
  }
  if (!out.time && /\b\d{1,2}:\d{2}\b/.test(text)) {
    const m = text.match(/\b\d{1,2}:\d{2}\b/);
    if (m) out.time = m[0];
  }
  const servicePatterns = [
    /(?:book|booking|đặt|appointment|reservation|service)\s+(?:for|a|an|the)?\s*([^.!?\n]{2,60})/iu,
    /(?:mani|manicure|gel|nails|pedicure|haircut|massage|facial|table|party|chỗ|dịch vụ)\s*[a-zA-ZÀ-ỹ0-9\s]*/iu
  ];
  for (const re of servicePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const cand = m[1].trim();
      if (cand.length >= 2 && !/^\d+$/.test(cand)) {
        out.service = cand.replace(/\s+/g, " ");
        break;
      }
    }
  }
  if (!out.service) {
    const m2 = text.match(
      /\b(manicure|pedicure|gel|nails|haircut|massage|facial|table|appointment)\b/i
    );
    if (m2?.[1]) out.service = m2[1];
  }
  const isoRange = text.match(
    /\b(20\d{2}-\d{2}-\d{2})\b.*\b(20\d{2}-\d{2}-\d{2})\b/
  );
  if (isoRange) {
    out.stayCheckIn = out.stayCheckIn ?? isoRange[1];
    out.stayCheckOut = out.stayCheckOut ?? isoRange[2];
  }
  const stayIn = text.match(/\b(?:check[-\s]?in|nhận\s*phòng|ở\s*từ)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|[^\n,.]{3,40})/iu) ?? text.match(/\b(?:từ\s*ngày|from)\s+(\d{1,2}[./]\d{1,2}|[^\n,.]{3,36})/iu);
  if (stayIn?.[1]) out.stayCheckIn = out.stayCheckIn ?? stayIn[1].trim();
  const stayOut = text.match(/\b(?:check[-\s]?out|trả\s*phòng|đến\s*ngày|until)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|[^\n,.]{3,40})/iu);
  if (stayOut?.[1]) out.stayCheckOut = out.stayCheckOut ?? stayOut[1].trim();
  const occ = text.match(
    /\b(\d+\s*(?:adults?|người lớn|trẻ em|children|kids?)[^\n,.]{0,40})/iu
  ) ?? text.match(/\b(\d+\s*(?:khách|guests?))\b/iu);
  if (occ?.[1]) out.occupancy = occ[1].replace(/\s+/g, " ").trim();
  return out;
}
function parseConfirmationUtterance(raw) {
  const t = stripRolePrefix(raw).trim().toLowerCase();
  if (!t) return "unknown";
  if (/^(yes|yeah|yep|ok|okay|correct|right|sure|đúng|vâng|dạ|ừ|oke|jasně|ano)$/iu.test(t) || /\b(đúng rồi|chính xác|xác nhận|potvrzuji)\b/iu.test(t)) {
    return "yes";
  }
  if (/^(no|nope|nah|wrong|cancel|không|ne)$/iu.test(t) || /\b(chưa đúng|sai rồi|không phải)\b/iu.test(t)) {
    return "no";
  }
  return "unknown";
}

// ../src/services/b2b/ai/bookingSlotVoice.ts
function normalizeSpoken(text) {
  return text.replace(/\s+/g, " ").replace(/\*/g, "").trim();
}
function isVi(lang) {
  return (lang ?? "").toLowerCase().startsWith("vi");
}
function promptForMissingBookingSlot(slot, lang) {
  if (isVi(lang)) {
    switch (slot) {
      case "service":
        return "B\u1EA1n mu\u1ED1n \u0111\u1EB7t d\u1ECBch v\u1EE5 ho\u1EB7c lo\u1EA1i ph\xF2ng g\xEC \u1EA1?";
      case "time":
        return "B\u1EA1n mu\u1ED1n \u0111\u1EB7t v\xE0o l\xFAc n\xE0o?";
      case "name":
        return "Cho t\xF4i xin t\xEAn li\xEAn h\u1EC7 \u0111\u1EC3 ghi nh\u1EADn nh\xE9?";
      case "stayCheckIn":
        return "B\u1EA1n nh\u1EADn ph\xF2ng t\u1EEB ng\xE0y n\xE0o?";
      case "stayCheckOut":
        return "B\u1EA1n tr\u1EA3 ph\xF2ng ng\xE0y n\xE0o?";
      case "occupancy":
        return "B\u1EA1n \u0111i m\u1EA5y ng\u01B0\u1EDDi (ng\u01B0\u1EDDi l\u1EDBn / tr\u1EBB em)?";
      default:
        return "";
    }
  }
  switch (slot) {
    case "service":
      return "Which service or room type would you like?";
    case "time":
      return "What day and time work for you?";
    case "name":
      return "What name should I use for this request?";
    case "stayCheckIn":
      return "What is your check-in date?";
    case "stayCheckOut":
      return "What is your check-out date?";
    case "occupancy":
      return "How many guests (adults and children)?";
    default:
      return "";
  }
}
function buildBookingConfirmationSummary(slots, lang, businessType) {
  if (businessType === "hospitality_stay") {
    const inD = slots.stayCheckIn ?? "";
    const outD = slots.stayCheckOut ?? "";
    const occ = slots.occupancy ?? "";
    const n2 = slots.name ?? "";
    if (isVi(lang)) {
      return normalizeSpoken(
        `Ghi nh\u1EADn y\xEAu c\u1EA7u \u1EDF: nh\u1EADn ${inD}, tr\u1EA3 ${outD}, ${occ}, li\xEAn h\u1EC7 ${n2}. \u0110\xFAng th\xF4ng tin ch\u01B0a? (L\u1EC5 t\xE2n s\u1EBD x\xE1c nh\u1EADn ph\xF2ng v\xE0 gi\xE1.)`
      );
    }
    return normalizeSpoken(
      `I have a stay request: check-in ${inD}, check-out ${outD}, guests ${occ}, contact ${n2}. Is that correct? Staff will confirm room and rate.`
    );
  }
  const s = slots.service ?? "";
  const t = slots.time ?? "";
  const n = slots.name ? isVi(lang) ? `, t\xEAn ${slots.name}` : `, under the name ${slots.name}` : "";
  if (isVi(lang)) {
    return normalizeSpoken(`B\u1EA1n mu\u1ED1n \u0111\u1EB7t ${s} l\xFAc ${t}${n}, \u0111\xFAng kh\xF4ng?`);
  }
  const namePart = slots.name ? `, under the name ${slots.name}` : "";
  return normalizeSpoken(`You'd like to book ${s} at ${t}${namePart}. Is that correct?`);
}
function acknowledgmentAfterConfirm(lang) {
  return isVi(lang) ? "C\u1EA3m \u01A1n b\u1EA1n. B\u1EA1n c\xF3 th\u1EC3 x\xE1c nh\u1EADn \u0111\u1EB7t ch\u1ED7 tr\xEAn m\xE0n h\xECnh ho\u1EB7c t\xF4i s\u1EBD chuy\u1EC3n ti\u1EBFp." : "Thank you. You can confirm the booking on your side, or I will proceed when you are ready.";
}
function acknowledgmentAfterConfirmForBusinessType(lang, businessType) {
  if (businessType === "hospitality_stay") {
    return isVi(lang) ? "C\u1EA3m \u01A1n b\u1EA1n. T\xF4i \u0111\xE3 ghi nh\u1EADn y\xEAu c\u1EA7u l\u01B0u tr\xFA \u0111\u1EC3 l\u1EC5 t\xE2n x\xE1c nh\u1EADn ph\xF2ng v\xE0 gi\xE1 \u2014 \u0111\xE2y ch\u01B0a ph\u1EA3i x\xE1c nh\u1EADn cu\u1ED1i c\xF9ng hay \u0111\xE3 thanh to\xE1n." : "Thank you. I have recorded your stay request for staff to confirm room and rate \u2014 this is not a final reservation or payment confirmation yet.";
  }
  return acknowledgmentAfterConfirm(lang);
}
function followUpWhenClosing(lang) {
  return isVi(lang) ? "B\u1EA1n c\u1EA7n h\u1ED7 tr\u1EE3 th\xEAm g\xEC kh\xF4ng \u1EA1?" : "Anything else I can help with?";
}
function generateBookingVoiceResponse(input) {
  const lang = input.defaultLanguage;
  const ttsVoiceId = input.ttsVoiceId;
  const userLine = input.latestUserInput.trim();
  const base = input.session.voiceDialogueState ?? { phase: "greeting", turnCount: 0 };
  const slots = input.session.bookingSlotState ?? {};
  const conf = input.session.bookingConfirmation ?? { awaitingConfirm: false, confirmed: false };
  const bt = input.businessType;
  if (!userLine && conf.awaitingConfirm && allBookingSlotsFilled(bt, slots)) {
    const line = normalizeSpoken(
      isVi(lang) ? "M\xECnh ch\u01B0a nghe r\xF5. B\u1EA1n n\xF3i \u0111\xFAng hay kh\xF4ng \u1EA1?" : "I didn't catch that. Was that a yes or a no?"
    );
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: "booking_confirm",
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: false,
      audioEncoding: "none"
    };
  }
  if (!userLine) {
    return null;
  }
  if (conf.confirmed) {
    if (base.phase === "closing") {
      const line2 = normalizeSpoken(followUpWhenClosing(lang));
      return {
        spokenText: line2,
        voiceDialogueState: { ...base, phase: "closing", turnCount: base.turnCount + 1, lastQuestionAsked: line2 },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: true,
        audioEncoding: "none"
      };
    }
    const line = normalizeSpoken(acknowledgmentAfterConfirmForBusinessType(lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: { ...base, phase: "closing", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (conf.awaitingConfirm && allBookingSlotsFilled(bt, slots)) {
    const askedSummary = /\b(đúng không|phải không)\b/i.test(base.lastQuestionAsked ?? "") || /\bis that correct\b/i.test(base.lastQuestionAsked ?? "");
    const unclear = !userLine || userLine && parseConfirmationUtterance(userLine) === "unknown" && askedSummary;
    if (askedSummary && unclear) {
      const line2 = normalizeSpoken(
        isVi(lang) ? "B\u1EA1n vui l\xF2ng n\xF3i \u0111\xFAng ho\u1EB7c kh\xF4ng \u0111\u1EC3 t\xF4i x\xE1c nh\u1EADn nh\xE9." : "Please say yes or no so I can confirm."
      );
      return {
        spokenText: line2,
        voiceDialogueState: {
          ...base,
          phase: "booking_confirm",
          turnCount: base.turnCount + 1,
          lastQuestionAsked: line2
        },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: false,
        audioEncoding: "none"
      };
    }
    const line = normalizeSpoken(buildBookingConfirmationSummary(slots, lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: "booking_confirm",
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  const miss = missingBookingSlots(bt, slots);
  if (miss.length > 0) {
    const line = normalizeSpoken(promptForMissingBookingSlot(miss[0], lang));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: "booking_slot_fill",
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (allBookingSlotsFilled(bt, slots) && !conf.awaitingConfirm && !conf.confirmed) {
    const line = normalizeSpoken(buildBookingConfirmationSummary(slots, lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: "booking_confirm",
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  return null;
}

// ../src/services/selling/detectOpportunity.ts
var BOOKING_KEYWORDS = [
  "\u0111\u1EB7t l\u1ECBch",
  "dat lich",
  "book",
  "booking",
  "h\u1EB9n",
  "hen",
  "appointment",
  "gia h\u1EA1n",
  "renew"
];
var LANGUAGE_CONFUSION_KEYWORDS = [
  "kh\xF4ng hi\u1EC3u",
  "khong hieu",
  "kh\xF4ng hi\u1EC3u ti\u1EBFng",
  "d\u1ECBch",
  "dich",
  "translate",
  "i dont understand",
  "i do not understand",
  "don't understand"
];
var SERVICE_SEARCH_KEYWORDS = [
  "t\xECm",
  "tim",
  "t\xECm ti\u1EC7m",
  "tim tiem",
  "t\xECm qu\xE1n",
  "tim quan",
  "g\u1EA7n",
  "gan",
  "nearby",
  "near me",
  "d\u1ECBch v\u1EE5",
  "dich vu"
];
function normalize(text) {
  return text.trim().toLowerCase();
}
function includesAny(source, words) {
  return words.some((word) => source.includes(word));
}
function detectOpportunity(input) {
  const raw = normalize(input.userInput);
  if (includesAny(raw, LANGUAGE_CONFUSION_KEYWORDS) || input.context.scenario === "language_confusion" || input.intent === "language_confusion") {
    return "interpreter";
  }
  const isBookingIntent = input.intent === "booking" || includesAny(raw, BOOKING_KEYWORDS);
  if (isBookingIntent) return "booking_call";
  const isCallAssistIntent = input.intent === "service_search" || includesAny(raw, SERVICE_SEARCH_KEYWORDS);
  if (isCallAssistIntent) return "call_assist";
  return null;
}

// ../src/services/voice/voicePersonaRegistry.ts
function extendedToneToCatalogTone(tone) {
  switch (tone) {
    case "formal":
    case "urgent":
      return "formal";
    case "reassuring":
    case "friendly":
      return "friendly";
    case "neutral":
    default:
      return "neutral";
  }
}
function scenarioBaseTone(scenario) {
  switch (scenario) {
    case "doctor":
    case "government":
      return "formal";
    case "nails":
    case "restaurant":
      return "friendly";
    case "potraviny":
    case "grocery_wholesale":
    case "work":
      return "neutral";
    case "hospitality_stay":
      return "formal";
    case "leona_outbound":
      return "formal";
    case "b2b_receptionist":
    case "general":
    case "live_interpreter":
      return "friendly";
    default:
      return "friendly";
  }
}
function businessWarmthAdjust(bt) {
  if (!bt) return null;
  if (bt === "nails" || bt === "restaurant") return "friendly";
  if (bt === "potraviny" || bt === "grocery_retail" || bt === "grocery_wholesale") return "neutral";
  if (bt === "hospitality_stay") return "formal";
  return null;
}
function buildPersonaKey(mode, scenario, businessType, tone) {
  const vertical = businessType ?? "generic";
  return `${mode}.${vertical}.${scenario}.${tone}`;
}
function defaultsForModeAndTone(mode, tone) {
  const formalLike = tone === "formal" || tone === "urgent";
  const warm = tone === "reassuring" || tone === "friendly";
  let base = {
    speakingRate: formalLike ? 0.98 : warm ? 1.02 : 1,
    pitchStyle: warm ? "warm" : formalLike ? "neutral" : "neutral",
    fillerStyle: formalLike ? "minimal" : warm ? "natural" : "natural",
    hesitationStyle: formalLike ? "light" : warm ? "moderate" : "light"
  };
  switch (mode) {
    case "leona_outbound":
      base = { ...base, speakingRate: 0.97, fillerStyle: "minimal", hesitationStyle: "light" };
      break;
    case "b2b_inbound":
      base = { ...base, fillerStyle: warm ? "natural" : "minimal" };
      break;
    case "live_interpreter":
      base = { ...base, speakingRate: 1, hesitationStyle: "light", fillerStyle: "minimal" };
      break;
    case "call_assist":
      base = { ...base, speakingRate: 0.99, fillerStyle: "natural" };
      break;
    case "chau_loan":
      base = { ...base, speakingRate: 1.01, fillerStyle: "natural" };
      break;
    default:
      break;
  }
  return base;
}
function resolveEffectiveTone(mode, scenario, businessType, tenantPreferred) {
  if (tenantPreferred) return tenantPreferred;
  let tone = scenarioBaseTone(scenario);
  const biz = businessWarmthAdjust(businessType);
  if (biz) {
    if (scenario === "general" || scenario === "b2b_receptionist" || scenario === "live_interpreter") {
      tone = biz;
    }
  }
  if (mode === "leona_outbound" && scenario === "leona_outbound") {
    tone = "formal";
  }
  return tone;
}

// ../src/services/voicePersona/voiceCatalog.ts
function envVoice(key, fallback) {
  const raw = process.env[key]?.trim()?.toLowerCase();
  if (raw === "nova" || raw === "alloy" || raw === "shimmer") return raw;
  return fallback;
}
function getVoiceCatalog() {
  return {
    provider: "openai_tts",
    matrix: {
      "female:friendly:vi": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_VI", "shimmer"),
      "male:friendly:vi": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_VI", "alloy"),
      "female:formal:vi": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_VI", "nova"),
      "male:formal:vi": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_VI", "alloy"),
      "female:neutral:vi": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_VI", "shimmer"),
      "male:neutral:vi": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_VI", "alloy"),
      "female:friendly:en": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_EN", "shimmer"),
      "male:friendly:en": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_EN", "alloy"),
      "female:formal:en": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_EN", "nova"),
      "male:formal:en": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_EN", "alloy"),
      "female:neutral:en": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_EN", "shimmer"),
      "male:neutral:en": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_EN", "alloy"),
      "female:friendly:cs": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_CS", "shimmer"),
      "male:friendly:cs": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_CS", "alloy"),
      "female:formal:cs": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_CS", "nova"),
      "male:formal:cs": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_CS", "alloy"),
      "female:neutral:cs": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_CS", "shimmer"),
      "male:neutral:cs": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_CS", "alloy"),
      "female:friendly:de": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_DE", "shimmer"),
      "male:friendly:de": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_DE", "alloy"),
      "female:formal:de": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_DE", "nova"),
      "male:formal:de": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_DE", "alloy"),
      "female:neutral:de": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_DE", "shimmer"),
      "male:neutral:de": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_DE", "alloy"),
      "female:friendly:other": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_OTHER", "shimmer"),
      "male:friendly:other": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_OTHER", "alloy"),
      "female:formal:other": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_OTHER", "nova"),
      "male:formal:other": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_OTHER", "alloy"),
      "female:neutral:other": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_OTHER", "shimmer"),
      "male:neutral:other": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_OTHER", "alloy")
    },
    fallback: envVoice("EXPO_PUBLIC_VOICE_FALLBACK", "alloy")
  };
}
function languageToBucket(language) {
  const base = language.trim().toLowerCase().split(/[-_]/)[0] ?? "en";
  if (base === "vi") return "vi";
  if (base === "en") return "en";
  if (base === "cs" || base === "sk") return "cs";
  if (base === "de") return "de";
  return "other";
}
function lookupVoiceIdInCatalog(gender, tone, bucket, catalog = getVoiceCatalog()) {
  const key = `${gender}:${tone}:${bucket}`;
  const hit = catalog.matrix[key];
  if (hit) return hit;
  const fallbackKey = `${gender}:${tone}:en`;
  const hitEn = catalog.matrix[fallbackKey];
  if (hitEn) return hitEn;
  return catalog.fallback;
}

// ../src/services/voicePersona/resolveVoiceProfile.ts
function resolveAssistantGender(userGender) {
  if (userGender === "male") return "male";
  if (userGender === "female") return "female";
  return "female";
}

// ../src/services/voice/resolveVoicePersona.ts
function normalizeLanguageTag(raw, tenantDefault) {
  const t = raw.trim();
  if (t) return t;
  return tenantDefault?.trim() || "en";
}
function resolveVoicePersona(input) {
  const lang = normalizeLanguageTag(input.language, input.tenantConfig?.defaultLanguage);
  const tenant = input.tenantConfig;
  const tone = resolveEffectiveTone(
    input.mode,
    input.scenario,
    input.businessType,
    tenant?.preferredTone
  );
  const personaKey = tenant?.personaKeyOverride ?? buildPersonaKey(input.mode, input.scenario, input.businessType, tone);
  const gender = input.assistantVoiceGenderOverride ?? resolveAssistantGender(input.userGender);
  const catalogTone = extendedToneToCatalogTone(tone);
  const bucket = languageToBucket(lang);
  const catalog = getVoiceCatalog();
  const voiceId = tenant?.voiceIdOverride?.trim() || lookupVoiceIdInCatalog(gender, catalogTone, bucket, catalog);
  const d = defaultsForModeAndTone(input.mode, tone);
  return {
    personaKey,
    gender,
    language: lang,
    tone,
    voiceId,
    speakingRate: tenant?.speakingRateOverride ?? d.speakingRate,
    pitchStyle: tenant?.pitchStyleOverride ?? d.pitchStyle,
    fillerStyle: tenant?.fillerStyleOverride ?? d.fillerStyle,
    hesitationStyle: tenant?.hesitationStyleOverride ?? d.hesitationStyle
  };
}

// ../src/services/voice/realismTypes.ts
function b2bPhaseToDialoguePhase(phase) {
  switch (phase) {
    case "greeting":
      return "greeting";
    case "intent_clarify":
      return "clarify";
    case "booking_collect":
    case "order_collect":
    case "booking_slot_fill":
    case "faq":
      return "collect";
    case "booking_confirm":
    case "confirm_handoff":
      return "confirm";
    case "closing":
      return "close";
    default:
      return "collect";
  }
}

// ../src/services/voice/realismLanguagePacks.ts
var packs = {
  vi: {
    id: "vi",
    fillers: ["\xE0", "\u1EEBm", "\u0111\u1EC3 t\xF4i xem", "m\u1ED9t ch\xFAt nh\xE9"],
    hesitation: ["\u1EEBm\u2026", "\xE0\u2026", "\u0111\u1EC3 t\xF4i\u2026"],
    softening: ["xin l\u1ED7i nh\xE9", "b\u1EA1n ch\u1EDD ch\xFAt", "\u0111\u1EC3 m\xECnh ki\u1EC3m tra"],
    formalityNote: "deferential",
    clausePause: "\u2026 "
  },
  de: {
    id: "de",
    fillers: ["\xE4h", "also", "genau", "einen Moment"],
    hesitation: ["\xE4h\u2026", "also\u2026", "moment\u2026"],
    softening: ["einen Moment bitte", "kurz", "sorry"],
    formalityNote: "standard",
    clausePause: " \u2014 "
  },
  cs: {
    id: "cs",
    fillers: ["ehm", "tak", "jo", "chvilku"],
    hesitation: ["ehm\u2026", "tak\u2026", "moment\u2026"],
    softening: ["chvilku pros\xEDm", "jen kr\xE1tce", "pardon"],
    formalityNote: "compact",
    clausePause: " \u2026 "
  },
  en: {
    id: "en",
    fillers: ["uh", "hmm", "well", "let me check"],
    hesitation: ["uh\u2026", "hmm\u2026", "one moment\u2026"],
    softening: ["sorry", "one sec", "just a moment"],
    formalityNote: "standard",
    clausePause: " \u2026 "
  }
};
function languageToPackId(language) {
  const base = language.trim().toLowerCase().split(/[-_]/)[0] ?? "en";
  if (base === "vi") return "vi";
  if (base === "de") return "de";
  if (base === "cs" || base === "sk") return "cs";
  return "en";
}
function getRealismLanguagePack(language) {
  return packs[languageToPackId(language)];
}
function phaseFillerWeight(phase) {
  switch (phase) {
    case "clarify":
    case "fallback":
      return "hesitation";
    case "confirm":
    case "close":
      return "softening";
    default:
      return "fillers";
  }
}

// ../src/services/voice/humanizeSpokenResponse.ts
function stableHash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(31, h) + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function pickDeterministic(arr, seed) {
  if (arr.length === 0) throw new Error("empty_pick");
  return arr[seed % arr.length];
}
function pickLive(arr, rng) {
  if (arr.length === 0) throw new Error("empty_pick");
  return arr[Math.floor(rng() * arr.length)];
}
function makeRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = s * 16807 % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function sentencesOf(text) {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}
function maybeShorten(text, phase, realismLevel) {
  if (realismLevel === "off" || realismLevel === "low") return { text, shortened: false };
  if (phase !== "clarify" && phase !== "fallback") return { text, shortened: false };
  const s = sentencesOf(text);
  if (s.length <= 2 || text.length < 200) return { text, shortened: false };
  return { text: s.slice(0, 2).join(" "), shortened: true };
}
function insertMicroPauses(text, language, maxMarkers) {
  const pack = getRealismLanguagePack(language);
  if (maxMarkers <= 0 || text.length < 140) return { text, count: 0 };
  const parts = text.split(", ");
  if (parts.length < 3) return { text, count: 0 };
  const head = parts.slice(0, 2).join(", ");
  const tail = parts.slice(2).join(", ");
  return { text: `${head}${pack.clausePause}${tail}`, count: 1 };
}
function humanizeSpokenResponse(input) {
  const raw = input.rawText.replace(/\s+/g, " ").trim();
  if (!raw) {
    return {
      spokenText: "",
      humanizationMeta: {
        appliedFiller: false,
        appliedDelayMs: 0,
        appliedChunks: 0,
        pauseMarkersInserted: 0
      }
    };
  }
  if (input.realismLevel === "off") {
    return {
      spokenText: raw,
      humanizationMeta: {
        appliedFiller: false,
        appliedDelayMs: 0,
        appliedChunks: sentencesOf(raw).length,
        pauseMarkersInserted: 0
      }
    };
  }
  const seedBase = input.deterministicSeed ?? `${input.dialoguePhase}|${input.tone}|${input.language}|${raw}`;
  const seed = stableHash(seedBase);
  const rng = input.engineMode === "deterministic" ? makeRng(seed) : () => Math.random();
  const pack = getRealismLanguagePack(input.language);
  const slot = phaseFillerWeight(input.dialoguePhase);
  const pool = slot === "hesitation" ? pack.hesitation : slot === "softening" ? pack.softening : pack.fillers;
  let spoken = raw;
  let appliedFiller = false;
  let pauseMarkersInserted = 0;
  const short = maybeShorten(spoken, input.dialoguePhase, input.realismLevel);
  spoken = short.text;
  const maxPause = input.realismLevel === "high" ? 2 : input.realismLevel === "medium" ? 1 : 0;
  const paused = insertMicroPauses(spoken, input.language, maxPause);
  spoken = paused.text;
  pauseMarkersInserted = paused.count;
  const shouldLeadFiller = input.realismLevel !== "low" && input.dialoguePhase !== "confirm" && input.tone !== "formal" && input.tone !== "urgent";
  if (shouldLeadFiller && pool.length > 0) {
    const filler = input.engineMode === "deterministic" ? pickDeterministic(pool, seed) : pickLive(pool, rng);
    if (!spoken.toLowerCase().startsWith(filler.toLowerCase().slice(0, 3))) {
      spoken = `${filler} ${spoken}`.replace(/\s+/g, " ").trim();
      appliedFiller = true;
    }
  }
  let delayMs = 0;
  if (input.dialoguePhase === "clarify" || input.dialoguePhase === "fallback") {
    delayMs = input.engineMode === "deterministic" ? 120 + seed % 80 : 120 + Math.floor(rng() * 120);
  } else if (input.dialoguePhase === "greeting") {
    delayMs = input.engineMode === "deterministic" ? 40 + seed % 40 : 40 + Math.floor(rng() * 60);
  }
  const chunks = sentencesOf(spoken).length || 1;
  return {
    spokenText: spoken,
    humanizationMeta: {
      appliedFiller,
      appliedDelayMs: delayMs,
      appliedChunks: chunks,
      pauseMarkersInserted
    }
  };
}

// ../src/services/voice/realismEnv.ts
function getVoiceRealismEngineConfig() {
  const m = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_VOICE_REALISM_MODE ? process.env.EXPO_PUBLIC_VOICE_REALISM_MODE : "live").toLowerCase();
  const mode = m === "deterministic" ? "deterministic" : "live";
  const raw = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_VOICE_REALISM_LEVEL ? process.env.EXPO_PUBLIC_VOICE_REALISM_LEVEL : "medium").toLowerCase();
  const level = raw === "off" || raw === "low" || raw === "medium" || raw === "high" ? raw : "medium";
  return { mode, level };
}

// ../src/services/OpenAIService.ts
var import_async_storage7 = __toESM(require("@react-native-async-storage/async-storage"));
var FileSystem = __toESM(require("expo-file-system/legacy"));
var import_react_native3 = require("react-native");

// ../src/services/walletFirebaseSession.ts
var import_async_storage = __toESM(require("@react-native-async-storage/async-storage"));

// ../node_modules/firebase/auth/dist/index.mjs
var dist_exports = {};
__export(dist_exports, {
  ActionCodeOperation: () => ActionCodeOperation,
  ActionCodeURL: () => ActionCodeURL,
  AuthCredential: () => AuthCredential,
  AuthErrorCodes: () => AUTH_ERROR_CODES_MAP_DO_NOT_USE_INTERNALLY,
  EmailAuthCredential: () => EmailAuthCredential,
  EmailAuthProvider: () => EmailAuthProvider,
  FacebookAuthProvider: () => FacebookAuthProvider,
  FactorId: () => FactorId,
  GithubAuthProvider: () => GithubAuthProvider,
  GoogleAuthProvider: () => GoogleAuthProvider,
  OAuthCredential: () => OAuthCredential,
  OAuthProvider: () => OAuthProvider,
  OperationType: () => OperationType,
  PhoneAuthCredential: () => PhoneAuthCredential,
  PhoneAuthProvider: () => PhoneAuthProvider,
  PhoneMultiFactorGenerator: () => PhoneMultiFactorGenerator,
  ProviderId: () => ProviderId,
  RecaptchaVerifier: () => RecaptchaVerifier,
  SAMLAuthProvider: () => SAMLAuthProvider,
  SignInMethod: () => SignInMethod,
  TotpMultiFactorGenerator: () => TotpMultiFactorGenerator,
  TotpSecret: () => TotpSecret,
  TwitterAuthProvider: () => TwitterAuthProvider,
  applyActionCode: () => applyActionCode,
  beforeAuthStateChanged: () => beforeAuthStateChanged,
  browserCookiePersistence: () => browserCookiePersistence,
  browserLocalPersistence: () => browserLocalPersistence,
  browserPopupRedirectResolver: () => browserPopupRedirectResolver,
  browserSessionPersistence: () => browserSessionPersistence,
  checkActionCode: () => checkActionCode,
  confirmPasswordReset: () => confirmPasswordReset,
  connectAuthEmulator: () => connectAuthEmulator,
  createUserWithEmailAndPassword: () => createUserWithEmailAndPassword,
  debugErrorMap: () => debugErrorMap,
  deleteUser: () => deleteUser,
  fetchSignInMethodsForEmail: () => fetchSignInMethodsForEmail,
  getAdditionalUserInfo: () => getAdditionalUserInfo,
  getAuth: () => getAuth,
  getIdToken: () => getIdToken,
  getIdTokenResult: () => getIdTokenResult,
  getMultiFactorResolver: () => getMultiFactorResolver,
  getRedirectResult: () => getRedirectResult,
  inMemoryPersistence: () => inMemoryPersistence,
  indexedDBLocalPersistence: () => indexedDBLocalPersistence,
  initializeAuth: () => initializeAuth,
  initializeRecaptchaConfig: () => initializeRecaptchaConfig,
  isSignInWithEmailLink: () => isSignInWithEmailLink,
  linkWithCredential: () => linkWithCredential,
  linkWithPhoneNumber: () => linkWithPhoneNumber,
  linkWithPopup: () => linkWithPopup,
  linkWithRedirect: () => linkWithRedirect,
  multiFactor: () => multiFactor,
  onAuthStateChanged: () => onAuthStateChanged,
  onIdTokenChanged: () => onIdTokenChanged,
  parseActionCodeURL: () => parseActionCodeURL,
  prodErrorMap: () => prodErrorMap,
  reauthenticateWithCredential: () => reauthenticateWithCredential,
  reauthenticateWithPhoneNumber: () => reauthenticateWithPhoneNumber,
  reauthenticateWithPopup: () => reauthenticateWithPopup,
  reauthenticateWithRedirect: () => reauthenticateWithRedirect,
  reload: () => reload,
  revokeAccessToken: () => revokeAccessToken,
  sendEmailVerification: () => sendEmailVerification,
  sendPasswordResetEmail: () => sendPasswordResetEmail,
  sendSignInLinkToEmail: () => sendSignInLinkToEmail,
  setPersistence: () => setPersistence,
  signInAnonymously: () => signInAnonymously,
  signInWithCredential: () => signInWithCredential,
  signInWithCustomToken: () => signInWithCustomToken,
  signInWithEmailAndPassword: () => signInWithEmailAndPassword,
  signInWithEmailLink: () => signInWithEmailLink,
  signInWithPhoneNumber: () => signInWithPhoneNumber,
  signInWithPopup: () => signInWithPopup,
  signInWithRedirect: () => signInWithRedirect,
  signOut: () => signOut,
  unlink: () => unlink,
  updateCurrentUser: () => updateCurrentUser,
  updateEmail: () => updateEmail,
  updatePassword: () => updatePassword,
  updatePhoneNumber: () => updatePhoneNumber,
  updateProfile: () => updateProfile,
  useDeviceLanguage: () => useDeviceLanguage,
  validatePassword: () => validatePassword,
  verifyBeforeUpdateEmail: () => verifyBeforeUpdateEmail,
  verifyPasswordResetCode: () => verifyPasswordResetCode
});

// ../node_modules/@firebase/auth/dist/node-esm/totp-a9833fe5.js
init_index_esm20173();
init_index_node_esm();

// ../node_modules/tslib/tslib.es6.mjs
function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}

// ../node_modules/@firebase/auth/dist/node-esm/totp-a9833fe5.js
init_index_esm2017();
init_index_esm20172();
var FactorId = {
  /** Phone as second factor */
  PHONE: "phone",
  TOTP: "totp"
};
var ProviderId = {
  /** Facebook provider ID */
  FACEBOOK: "facebook.com",
  /** GitHub provider ID */
  GITHUB: "github.com",
  /** Google provider ID */
  GOOGLE: "google.com",
  /** Password provider */
  PASSWORD: "password",
  /** Phone provider */
  PHONE: "phone",
  /** Twitter provider ID */
  TWITTER: "twitter.com"
};
var SignInMethod = {
  /** Email link sign in method */
  EMAIL_LINK: "emailLink",
  /** Email/password sign in method */
  EMAIL_PASSWORD: "password",
  /** Facebook sign in method */
  FACEBOOK: "facebook.com",
  /** GitHub sign in method */
  GITHUB: "github.com",
  /** Google sign in method */
  GOOGLE: "google.com",
  /** Phone sign in method */
  PHONE: "phone",
  /** Twitter sign in method */
  TWITTER: "twitter.com"
};
var OperationType = {
  /** Operation involving linking an additional provider to an already signed-in user. */
  LINK: "link",
  /** Operation involving using a provider to reauthenticate an already signed-in user. */
  REAUTHENTICATE: "reauthenticate",
  /** Operation involving signing in a user. */
  SIGN_IN: "signIn"
};
var ActionCodeOperation = {
  /** The email link sign-in action. */
  EMAIL_SIGNIN: "EMAIL_SIGNIN",
  /** The password reset action. */
  PASSWORD_RESET: "PASSWORD_RESET",
  /** The email revocation action. */
  RECOVER_EMAIL: "RECOVER_EMAIL",
  /** The revert second factor addition email action. */
  REVERT_SECOND_FACTOR_ADDITION: "REVERT_SECOND_FACTOR_ADDITION",
  /** The revert second factor addition email action. */
  VERIFY_AND_CHANGE_EMAIL: "VERIFY_AND_CHANGE_EMAIL",
  /** The email verification action. */
  VERIFY_EMAIL: "VERIFY_EMAIL"
};
function _debugErrorMap() {
  return {
    [
      "admin-restricted-operation"
      /* AuthErrorCode.ADMIN_ONLY_OPERATION */
    ]: "This operation is restricted to administrators only.",
    [
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    ]: "",
    [
      "app-not-authorized"
      /* AuthErrorCode.APP_NOT_AUTHORIZED */
    ]: "This app, identified by the domain where it's hosted, is not authorized to use Firebase Authentication with the provided API key. Review your key configuration in the Google API console.",
    [
      "app-not-installed"
      /* AuthErrorCode.APP_NOT_INSTALLED */
    ]: "The requested mobile application corresponding to the identifier (Android package name or iOS bundle ID) provided is not installed on this device.",
    [
      "captcha-check-failed"
      /* AuthErrorCode.CAPTCHA_CHECK_FAILED */
    ]: "The reCAPTCHA response token provided is either invalid, expired, already used or the domain associated with it does not match the list of whitelisted domains.",
    [
      "code-expired"
      /* AuthErrorCode.CODE_EXPIRED */
    ]: "The SMS code has expired. Please re-send the verification code to try again.",
    [
      "cordova-not-ready"
      /* AuthErrorCode.CORDOVA_NOT_READY */
    ]: "Cordova framework is not ready.",
    [
      "cors-unsupported"
      /* AuthErrorCode.CORS_UNSUPPORTED */
    ]: "This browser is not supported.",
    [
      "credential-already-in-use"
      /* AuthErrorCode.CREDENTIAL_ALREADY_IN_USE */
    ]: "This credential is already associated with a different user account.",
    [
      "custom-token-mismatch"
      /* AuthErrorCode.CREDENTIAL_MISMATCH */
    ]: "The custom token corresponds to a different audience.",
    [
      "requires-recent-login"
      /* AuthErrorCode.CREDENTIAL_TOO_OLD_LOGIN_AGAIN */
    ]: "This operation is sensitive and requires recent authentication. Log in again before retrying this request.",
    [
      "dependent-sdk-initialized-before-auth"
      /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
    ]: "Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK.",
    [
      "dynamic-link-not-activated"
      /* AuthErrorCode.DYNAMIC_LINK_NOT_ACTIVATED */
    ]: "Please activate Dynamic Links in the Firebase Console and agree to the terms and conditions.",
    [
      "email-change-needs-verification"
      /* AuthErrorCode.EMAIL_CHANGE_NEEDS_VERIFICATION */
    ]: "Multi-factor users must always have a verified email.",
    [
      "email-already-in-use"
      /* AuthErrorCode.EMAIL_EXISTS */
    ]: "The email address is already in use by another account.",
    [
      "emulator-config-failed"
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    ]: 'Auth instance has already been used to make a network call. Auth can no longer be configured to use the emulator. Try calling "connectAuthEmulator()" sooner.',
    [
      "expired-action-code"
      /* AuthErrorCode.EXPIRED_OOB_CODE */
    ]: "The action code has expired.",
    [
      "cancelled-popup-request"
      /* AuthErrorCode.EXPIRED_POPUP_REQUEST */
    ]: "This operation has been cancelled due to another conflicting popup being opened.",
    [
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    ]: "An internal AuthError has occurred.",
    [
      "invalid-app-credential"
      /* AuthErrorCode.INVALID_APP_CREDENTIAL */
    ]: "The phone verification request contains an invalid application verifier. The reCAPTCHA token response is either invalid or expired.",
    [
      "invalid-app-id"
      /* AuthErrorCode.INVALID_APP_ID */
    ]: "The mobile app identifier is not registered for the current project.",
    [
      "invalid-user-token"
      /* AuthErrorCode.INVALID_AUTH */
    ]: "This user's credential isn't valid for this project. This can happen if the user's token has been tampered with, or if the user isn't for the project associated with this API key.",
    [
      "invalid-auth-event"
      /* AuthErrorCode.INVALID_AUTH_EVENT */
    ]: "An internal AuthError has occurred.",
    [
      "invalid-verification-code"
      /* AuthErrorCode.INVALID_CODE */
    ]: "The SMS verification code used to create the phone auth credential is invalid. Please resend the verification code sms and be sure to use the verification code provided by the user.",
    [
      "invalid-continue-uri"
      /* AuthErrorCode.INVALID_CONTINUE_URI */
    ]: "The continue URL provided in the request is invalid.",
    [
      "invalid-cordova-configuration"
      /* AuthErrorCode.INVALID_CORDOVA_CONFIGURATION */
    ]: "The following Cordova plugins must be installed to enable OAuth sign-in: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser and cordova-plugin-customurlscheme.",
    [
      "invalid-custom-token"
      /* AuthErrorCode.INVALID_CUSTOM_TOKEN */
    ]: "The custom token format is incorrect. Please check the documentation.",
    [
      "invalid-dynamic-link-domain"
      /* AuthErrorCode.INVALID_DYNAMIC_LINK_DOMAIN */
    ]: "The provided dynamic link domain is not configured or authorized for the current project.",
    [
      "invalid-email"
      /* AuthErrorCode.INVALID_EMAIL */
    ]: "The email address is badly formatted.",
    [
      "invalid-emulator-scheme"
      /* AuthErrorCode.INVALID_EMULATOR_SCHEME */
    ]: "Emulator URL must start with a valid scheme (http:// or https://).",
    [
      "invalid-api-key"
      /* AuthErrorCode.INVALID_API_KEY */
    ]: "Your API key is invalid, please check you have copied it correctly.",
    [
      "invalid-cert-hash"
      /* AuthErrorCode.INVALID_CERT_HASH */
    ]: "The SHA-1 certificate hash provided is invalid.",
    [
      "invalid-credential"
      /* AuthErrorCode.INVALID_CREDENTIAL */
    ]: "The supplied auth credential is incorrect, malformed or has expired.",
    [
      "invalid-message-payload"
      /* AuthErrorCode.INVALID_MESSAGE_PAYLOAD */
    ]: "The email template corresponding to this action contains invalid characters in its message. Please fix by going to the Auth email templates section in the Firebase Console.",
    [
      "invalid-multi-factor-session"
      /* AuthErrorCode.INVALID_MFA_SESSION */
    ]: "The request does not contain a valid proof of first factor successful sign-in.",
    [
      "invalid-oauth-provider"
      /* AuthErrorCode.INVALID_OAUTH_PROVIDER */
    ]: "EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.",
    [
      "invalid-oauth-client-id"
      /* AuthErrorCode.INVALID_OAUTH_CLIENT_ID */
    ]: "The OAuth client ID provided is either invalid or does not match the specified API key.",
    [
      "unauthorized-domain"
      /* AuthErrorCode.INVALID_ORIGIN */
    ]: "This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.",
    [
      "invalid-action-code"
      /* AuthErrorCode.INVALID_OOB_CODE */
    ]: "The action code is invalid. This can happen if the code is malformed, expired, or has already been used.",
    [
      "wrong-password"
      /* AuthErrorCode.INVALID_PASSWORD */
    ]: "The password is invalid or the user does not have a password.",
    [
      "invalid-persistence-type"
      /* AuthErrorCode.INVALID_PERSISTENCE */
    ]: "The specified persistence type is invalid. It can only be local, session or none.",
    [
      "invalid-phone-number"
      /* AuthErrorCode.INVALID_PHONE_NUMBER */
    ]: "The format of the phone number provided is incorrect. Please enter the phone number in a format that can be parsed into E.164 format. E.164 phone numbers are written in the format [+][country code][subscriber number including area code].",
    [
      "invalid-provider-id"
      /* AuthErrorCode.INVALID_PROVIDER_ID */
    ]: "The specified provider ID is invalid.",
    [
      "invalid-recipient-email"
      /* AuthErrorCode.INVALID_RECIPIENT_EMAIL */
    ]: "The email corresponding to this action failed to send as the provided recipient email address is invalid.",
    [
      "invalid-sender"
      /* AuthErrorCode.INVALID_SENDER */
    ]: "The email template corresponding to this action contains an invalid sender email or name. Please fix by going to the Auth email templates section in the Firebase Console.",
    [
      "invalid-verification-id"
      /* AuthErrorCode.INVALID_SESSION_INFO */
    ]: "The verification ID used to create the phone auth credential is invalid.",
    [
      "invalid-tenant-id"
      /* AuthErrorCode.INVALID_TENANT_ID */
    ]: "The Auth instance's tenant ID is invalid.",
    [
      "login-blocked"
      /* AuthErrorCode.LOGIN_BLOCKED */
    ]: "Login blocked by user-provided method: {$originalMessage}",
    [
      "missing-android-pkg-name"
      /* AuthErrorCode.MISSING_ANDROID_PACKAGE_NAME */
    ]: "An Android Package Name must be provided if the Android App is required to be installed.",
    [
      "auth-domain-config-required"
      /* AuthErrorCode.MISSING_AUTH_DOMAIN */
    ]: "Be sure to include authDomain when calling firebase.initializeApp(), by following the instructions in the Firebase console.",
    [
      "missing-app-credential"
      /* AuthErrorCode.MISSING_APP_CREDENTIAL */
    ]: "The phone verification request is missing an application verifier assertion. A reCAPTCHA response token needs to be provided.",
    [
      "missing-verification-code"
      /* AuthErrorCode.MISSING_CODE */
    ]: "The phone auth credential was created with an empty SMS verification code.",
    [
      "missing-continue-uri"
      /* AuthErrorCode.MISSING_CONTINUE_URI */
    ]: "A continue URL must be provided in the request.",
    [
      "missing-iframe-start"
      /* AuthErrorCode.MISSING_IFRAME_START */
    ]: "An internal AuthError has occurred.",
    [
      "missing-ios-bundle-id"
      /* AuthErrorCode.MISSING_IOS_BUNDLE_ID */
    ]: "An iOS Bundle ID must be provided if an App Store ID is provided.",
    [
      "missing-or-invalid-nonce"
      /* AuthErrorCode.MISSING_OR_INVALID_NONCE */
    ]: "The request does not contain a valid nonce. This can occur if the SHA-256 hash of the provided raw nonce does not match the hashed nonce in the ID token payload.",
    [
      "missing-password"
      /* AuthErrorCode.MISSING_PASSWORD */
    ]: "A non-empty password must be provided",
    [
      "missing-multi-factor-info"
      /* AuthErrorCode.MISSING_MFA_INFO */
    ]: "No second factor identifier is provided.",
    [
      "missing-multi-factor-session"
      /* AuthErrorCode.MISSING_MFA_SESSION */
    ]: "The request is missing proof of first factor successful sign-in.",
    [
      "missing-phone-number"
      /* AuthErrorCode.MISSING_PHONE_NUMBER */
    ]: "To send verification codes, provide a phone number for the recipient.",
    [
      "missing-verification-id"
      /* AuthErrorCode.MISSING_SESSION_INFO */
    ]: "The phone auth credential was created with an empty verification ID.",
    [
      "app-deleted"
      /* AuthErrorCode.MODULE_DESTROYED */
    ]: "This instance of FirebaseApp has been deleted.",
    [
      "multi-factor-info-not-found"
      /* AuthErrorCode.MFA_INFO_NOT_FOUND */
    ]: "The user does not have a second factor matching the identifier provided.",
    [
      "multi-factor-auth-required"
      /* AuthErrorCode.MFA_REQUIRED */
    ]: "Proof of ownership of a second factor is required to complete sign-in.",
    [
      "account-exists-with-different-credential"
      /* AuthErrorCode.NEED_CONFIRMATION */
    ]: "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.",
    [
      "network-request-failed"
      /* AuthErrorCode.NETWORK_REQUEST_FAILED */
    ]: "A network AuthError (such as timeout, interrupted connection or unreachable host) has occurred.",
    [
      "no-auth-event"
      /* AuthErrorCode.NO_AUTH_EVENT */
    ]: "An internal AuthError has occurred.",
    [
      "no-such-provider"
      /* AuthErrorCode.NO_SUCH_PROVIDER */
    ]: "User was not linked to an account with the given provider.",
    [
      "null-user"
      /* AuthErrorCode.NULL_USER */
    ]: "A null user object was provided as the argument for an operation which requires a non-null user object.",
    [
      "operation-not-allowed"
      /* AuthErrorCode.OPERATION_NOT_ALLOWED */
    ]: "The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section.",
    [
      "operation-not-supported-in-this-environment"
      /* AuthErrorCode.OPERATION_NOT_SUPPORTED */
    ]: 'This operation is not supported in the environment this application is running on. "location.protocol" must be http, https or chrome-extension and web storage must be enabled.',
    [
      "popup-blocked"
      /* AuthErrorCode.POPUP_BLOCKED */
    ]: "Unable to establish a connection with the popup. It may have been blocked by the browser.",
    [
      "popup-closed-by-user"
      /* AuthErrorCode.POPUP_CLOSED_BY_USER */
    ]: "The popup has been closed by the user before finalizing the operation.",
    [
      "provider-already-linked"
      /* AuthErrorCode.PROVIDER_ALREADY_LINKED */
    ]: "User can only be linked to one identity for the given provider.",
    [
      "quota-exceeded"
      /* AuthErrorCode.QUOTA_EXCEEDED */
    ]: "The project's quota for this operation has been exceeded.",
    [
      "redirect-cancelled-by-user"
      /* AuthErrorCode.REDIRECT_CANCELLED_BY_USER */
    ]: "The redirect operation has been cancelled by the user before finalizing.",
    [
      "redirect-operation-pending"
      /* AuthErrorCode.REDIRECT_OPERATION_PENDING */
    ]: "A redirect sign-in operation is already pending.",
    [
      "rejected-credential"
      /* AuthErrorCode.REJECTED_CREDENTIAL */
    ]: "The request contains malformed or mismatching credentials.",
    [
      "second-factor-already-in-use"
      /* AuthErrorCode.SECOND_FACTOR_ALREADY_ENROLLED */
    ]: "The second factor is already enrolled on this account.",
    [
      "maximum-second-factor-count-exceeded"
      /* AuthErrorCode.SECOND_FACTOR_LIMIT_EXCEEDED */
    ]: "The maximum allowed number of second factors on a user has been exceeded.",
    [
      "tenant-id-mismatch"
      /* AuthErrorCode.TENANT_ID_MISMATCH */
    ]: "The provided tenant ID does not match the Auth instance's tenant ID",
    [
      "timeout"
      /* AuthErrorCode.TIMEOUT */
    ]: "The operation has timed out.",
    [
      "user-token-expired"
      /* AuthErrorCode.TOKEN_EXPIRED */
    ]: "The user's credential is no longer valid. The user must sign in again.",
    [
      "too-many-requests"
      /* AuthErrorCode.TOO_MANY_ATTEMPTS_TRY_LATER */
    ]: "We have blocked all requests from this device due to unusual activity. Try again later.",
    [
      "unauthorized-continue-uri"
      /* AuthErrorCode.UNAUTHORIZED_DOMAIN */
    ]: "The domain of the continue URL is not whitelisted.  Please whitelist the domain in the Firebase console.",
    [
      "unsupported-first-factor"
      /* AuthErrorCode.UNSUPPORTED_FIRST_FACTOR */
    ]: "Enrolling a second factor or signing in with a multi-factor account requires sign-in with a supported first factor.",
    [
      "unsupported-persistence-type"
      /* AuthErrorCode.UNSUPPORTED_PERSISTENCE */
    ]: "The current environment does not support the specified persistence type.",
    [
      "unsupported-tenant-operation"
      /* AuthErrorCode.UNSUPPORTED_TENANT_OPERATION */
    ]: "This operation is not supported in a multi-tenant context.",
    [
      "unverified-email"
      /* AuthErrorCode.UNVERIFIED_EMAIL */
    ]: "The operation requires a verified email.",
    [
      "user-cancelled"
      /* AuthErrorCode.USER_CANCELLED */
    ]: "The user did not grant your application the permissions it requested.",
    [
      "user-not-found"
      /* AuthErrorCode.USER_DELETED */
    ]: "There is no user record corresponding to this identifier. The user may have been deleted.",
    [
      "user-disabled"
      /* AuthErrorCode.USER_DISABLED */
    ]: "The user account has been disabled by an administrator.",
    [
      "user-mismatch"
      /* AuthErrorCode.USER_MISMATCH */
    ]: "The supplied credentials do not correspond to the previously signed in user.",
    [
      "user-signed-out"
      /* AuthErrorCode.USER_SIGNED_OUT */
    ]: "",
    [
      "weak-password"
      /* AuthErrorCode.WEAK_PASSWORD */
    ]: "The password must be 6 characters long or more.",
    [
      "web-storage-unsupported"
      /* AuthErrorCode.WEB_STORAGE_UNSUPPORTED */
    ]: "This browser is not supported or 3rd party cookies and data may be disabled.",
    [
      "already-initialized"
      /* AuthErrorCode.ALREADY_INITIALIZED */
    ]: "initializeAuth() has already been called with different options. To avoid this error, call initializeAuth() with the same options as when it was originally called, or call getAuth() to return the already initialized instance.",
    [
      "missing-recaptcha-token"
      /* AuthErrorCode.MISSING_RECAPTCHA_TOKEN */
    ]: "The reCAPTCHA token is missing when sending request to the backend.",
    [
      "invalid-recaptcha-token"
      /* AuthErrorCode.INVALID_RECAPTCHA_TOKEN */
    ]: "The reCAPTCHA token is invalid when sending request to the backend.",
    [
      "invalid-recaptcha-action"
      /* AuthErrorCode.INVALID_RECAPTCHA_ACTION */
    ]: "The reCAPTCHA action is invalid when sending request to the backend.",
    [
      "recaptcha-not-enabled"
      /* AuthErrorCode.RECAPTCHA_NOT_ENABLED */
    ]: "reCAPTCHA Enterprise integration is not enabled for this project.",
    [
      "missing-client-type"
      /* AuthErrorCode.MISSING_CLIENT_TYPE */
    ]: "The reCAPTCHA client type is missing when sending request to the backend.",
    [
      "missing-recaptcha-version"
      /* AuthErrorCode.MISSING_RECAPTCHA_VERSION */
    ]: "The reCAPTCHA version is missing when sending request to the backend.",
    [
      "invalid-req-type"
      /* AuthErrorCode.INVALID_REQ_TYPE */
    ]: "Invalid request parameters.",
    [
      "invalid-recaptcha-version"
      /* AuthErrorCode.INVALID_RECAPTCHA_VERSION */
    ]: "The reCAPTCHA version is invalid when sending request to the backend.",
    [
      "unsupported-password-policy-schema-version"
      /* AuthErrorCode.UNSUPPORTED_PASSWORD_POLICY_SCHEMA_VERSION */
    ]: "The password policy received from the backend uses a schema version that is not supported by this version of the Firebase SDK.",
    [
      "password-does-not-meet-requirements"
      /* AuthErrorCode.PASSWORD_DOES_NOT_MEET_REQUIREMENTS */
    ]: "The password does not meet the requirements.",
    [
      "invalid-hosting-link-domain"
      /* AuthErrorCode.INVALID_HOSTING_LINK_DOMAIN */
    ]: "The provided Hosting link domain is not configured in Firebase Hosting or is not owned by the current project. This cannot be a default Hosting domain (`web.app` or `firebaseapp.com`)."
  };
}
function _prodErrorMap() {
  return {
    [
      "dependent-sdk-initialized-before-auth"
      /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
    ]: "Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."
  };
}
var debugErrorMap = _debugErrorMap;
var prodErrorMap = _prodErrorMap;
var _DEFAULT_AUTH_ERROR_FACTORY = new ErrorFactory("auth", "Firebase", _prodErrorMap());
var AUTH_ERROR_CODES_MAP_DO_NOT_USE_INTERNALLY = {
  ADMIN_ONLY_OPERATION: "auth/admin-restricted-operation",
  ARGUMENT_ERROR: "auth/argument-error",
  APP_NOT_AUTHORIZED: "auth/app-not-authorized",
  APP_NOT_INSTALLED: "auth/app-not-installed",
  CAPTCHA_CHECK_FAILED: "auth/captcha-check-failed",
  CODE_EXPIRED: "auth/code-expired",
  CORDOVA_NOT_READY: "auth/cordova-not-ready",
  CORS_UNSUPPORTED: "auth/cors-unsupported",
  CREDENTIAL_ALREADY_IN_USE: "auth/credential-already-in-use",
  CREDENTIAL_MISMATCH: "auth/custom-token-mismatch",
  CREDENTIAL_TOO_OLD_LOGIN_AGAIN: "auth/requires-recent-login",
  DEPENDENT_SDK_INIT_BEFORE_AUTH: "auth/dependent-sdk-initialized-before-auth",
  DYNAMIC_LINK_NOT_ACTIVATED: "auth/dynamic-link-not-activated",
  EMAIL_CHANGE_NEEDS_VERIFICATION: "auth/email-change-needs-verification",
  EMAIL_EXISTS: "auth/email-already-in-use",
  EMULATOR_CONFIG_FAILED: "auth/emulator-config-failed",
  EXPIRED_OOB_CODE: "auth/expired-action-code",
  EXPIRED_POPUP_REQUEST: "auth/cancelled-popup-request",
  INTERNAL_ERROR: "auth/internal-error",
  INVALID_API_KEY: "auth/invalid-api-key",
  INVALID_APP_CREDENTIAL: "auth/invalid-app-credential",
  INVALID_APP_ID: "auth/invalid-app-id",
  INVALID_AUTH: "auth/invalid-user-token",
  INVALID_AUTH_EVENT: "auth/invalid-auth-event",
  INVALID_CERT_HASH: "auth/invalid-cert-hash",
  INVALID_CODE: "auth/invalid-verification-code",
  INVALID_CONTINUE_URI: "auth/invalid-continue-uri",
  INVALID_CORDOVA_CONFIGURATION: "auth/invalid-cordova-configuration",
  INVALID_CUSTOM_TOKEN: "auth/invalid-custom-token",
  INVALID_DYNAMIC_LINK_DOMAIN: "auth/invalid-dynamic-link-domain",
  INVALID_EMAIL: "auth/invalid-email",
  INVALID_EMULATOR_SCHEME: "auth/invalid-emulator-scheme",
  INVALID_IDP_RESPONSE: "auth/invalid-credential",
  INVALID_LOGIN_CREDENTIALS: "auth/invalid-credential",
  INVALID_MESSAGE_PAYLOAD: "auth/invalid-message-payload",
  INVALID_MFA_SESSION: "auth/invalid-multi-factor-session",
  INVALID_OAUTH_CLIENT_ID: "auth/invalid-oauth-client-id",
  INVALID_OAUTH_PROVIDER: "auth/invalid-oauth-provider",
  INVALID_OOB_CODE: "auth/invalid-action-code",
  INVALID_ORIGIN: "auth/unauthorized-domain",
  INVALID_PASSWORD: "auth/wrong-password",
  INVALID_PERSISTENCE: "auth/invalid-persistence-type",
  INVALID_PHONE_NUMBER: "auth/invalid-phone-number",
  INVALID_PROVIDER_ID: "auth/invalid-provider-id",
  INVALID_RECIPIENT_EMAIL: "auth/invalid-recipient-email",
  INVALID_SENDER: "auth/invalid-sender",
  INVALID_SESSION_INFO: "auth/invalid-verification-id",
  INVALID_TENANT_ID: "auth/invalid-tenant-id",
  MFA_INFO_NOT_FOUND: "auth/multi-factor-info-not-found",
  MFA_REQUIRED: "auth/multi-factor-auth-required",
  MISSING_ANDROID_PACKAGE_NAME: "auth/missing-android-pkg-name",
  MISSING_APP_CREDENTIAL: "auth/missing-app-credential",
  MISSING_AUTH_DOMAIN: "auth/auth-domain-config-required",
  MISSING_CODE: "auth/missing-verification-code",
  MISSING_CONTINUE_URI: "auth/missing-continue-uri",
  MISSING_IFRAME_START: "auth/missing-iframe-start",
  MISSING_IOS_BUNDLE_ID: "auth/missing-ios-bundle-id",
  MISSING_OR_INVALID_NONCE: "auth/missing-or-invalid-nonce",
  MISSING_MFA_INFO: "auth/missing-multi-factor-info",
  MISSING_MFA_SESSION: "auth/missing-multi-factor-session",
  MISSING_PHONE_NUMBER: "auth/missing-phone-number",
  MISSING_SESSION_INFO: "auth/missing-verification-id",
  MODULE_DESTROYED: "auth/app-deleted",
  NEED_CONFIRMATION: "auth/account-exists-with-different-credential",
  NETWORK_REQUEST_FAILED: "auth/network-request-failed",
  NULL_USER: "auth/null-user",
  NO_AUTH_EVENT: "auth/no-auth-event",
  NO_SUCH_PROVIDER: "auth/no-such-provider",
  OPERATION_NOT_ALLOWED: "auth/operation-not-allowed",
  OPERATION_NOT_SUPPORTED: "auth/operation-not-supported-in-this-environment",
  POPUP_BLOCKED: "auth/popup-blocked",
  POPUP_CLOSED_BY_USER: "auth/popup-closed-by-user",
  PROVIDER_ALREADY_LINKED: "auth/provider-already-linked",
  QUOTA_EXCEEDED: "auth/quota-exceeded",
  REDIRECT_CANCELLED_BY_USER: "auth/redirect-cancelled-by-user",
  REDIRECT_OPERATION_PENDING: "auth/redirect-operation-pending",
  REJECTED_CREDENTIAL: "auth/rejected-credential",
  SECOND_FACTOR_ALREADY_ENROLLED: "auth/second-factor-already-in-use",
  SECOND_FACTOR_LIMIT_EXCEEDED: "auth/maximum-second-factor-count-exceeded",
  TENANT_ID_MISMATCH: "auth/tenant-id-mismatch",
  TIMEOUT: "auth/timeout",
  TOKEN_EXPIRED: "auth/user-token-expired",
  TOO_MANY_ATTEMPTS_TRY_LATER: "auth/too-many-requests",
  UNAUTHORIZED_DOMAIN: "auth/unauthorized-continue-uri",
  UNSUPPORTED_FIRST_FACTOR: "auth/unsupported-first-factor",
  UNSUPPORTED_PERSISTENCE: "auth/unsupported-persistence-type",
  UNSUPPORTED_TENANT_OPERATION: "auth/unsupported-tenant-operation",
  UNVERIFIED_EMAIL: "auth/unverified-email",
  USER_CANCELLED: "auth/user-cancelled",
  USER_DELETED: "auth/user-not-found",
  USER_DISABLED: "auth/user-disabled",
  USER_MISMATCH: "auth/user-mismatch",
  USER_SIGNED_OUT: "auth/user-signed-out",
  WEAK_PASSWORD: "auth/weak-password",
  WEB_STORAGE_UNSUPPORTED: "auth/web-storage-unsupported",
  ALREADY_INITIALIZED: "auth/already-initialized",
  RECAPTCHA_NOT_ENABLED: "auth/recaptcha-not-enabled",
  MISSING_RECAPTCHA_TOKEN: "auth/missing-recaptcha-token",
  INVALID_RECAPTCHA_TOKEN: "auth/invalid-recaptcha-token",
  INVALID_RECAPTCHA_ACTION: "auth/invalid-recaptcha-action",
  MISSING_CLIENT_TYPE: "auth/missing-client-type",
  MISSING_RECAPTCHA_VERSION: "auth/missing-recaptcha-version",
  INVALID_RECAPTCHA_VERSION: "auth/invalid-recaptcha-version",
  INVALID_REQ_TYPE: "auth/invalid-req-type",
  INVALID_HOSTING_LINK_DOMAIN: "auth/invalid-hosting-link-domain"
};
var logClient = new Logger("@firebase/auth");
function _logWarn(msg, ...args) {
  if (logClient.logLevel <= LogLevel.WARN) {
    logClient.warn(`Auth (${SDK_VERSION}): ${msg}`, ...args);
  }
}
function _logError(msg, ...args) {
  if (logClient.logLevel <= LogLevel.ERROR) {
    logClient.error(`Auth (${SDK_VERSION}): ${msg}`, ...args);
  }
}
function _fail(authOrCode, ...rest) {
  throw createErrorInternal(authOrCode, ...rest);
}
function _createError(authOrCode, ...rest) {
  return createErrorInternal(authOrCode, ...rest);
}
function _errorWithCustomMessage(auth, code, message) {
  const errorMap = Object.assign(Object.assign({}, prodErrorMap()), { [code]: message });
  const factory = new ErrorFactory("auth", "Firebase", errorMap);
  return factory.create(code, {
    appName: auth.name
  });
}
function _serverAppCurrentUserOperationNotSupportedError(auth) {
  return _errorWithCustomMessage(auth, "operation-not-supported-in-this-environment", "Operations that alter the current user are not supported in conjunction with FirebaseServerApp");
}
function createErrorInternal(authOrCode, ...rest) {
  if (typeof authOrCode !== "string") {
    const code = rest[0];
    const fullParams = [...rest.slice(1)];
    if (fullParams[0]) {
      fullParams[0].appName = authOrCode.name;
    }
    return authOrCode._errorFactory.create(code, ...fullParams);
  }
  return _DEFAULT_AUTH_ERROR_FACTORY.create(authOrCode, ...rest);
}
function _assert(assertion, authOrCode, ...rest) {
  if (!assertion) {
    throw createErrorInternal(authOrCode, ...rest);
  }
}
function debugFail(failure) {
  const message = `INTERNAL ASSERTION FAILED: ` + failure;
  _logError(message);
  throw new Error(message);
}
function debugAssert(assertion, message) {
  if (!assertion) {
    debugFail(message);
  }
}
function _getCurrentUrl() {
  var _a;
  return typeof self !== "undefined" && ((_a = self.location) === null || _a === void 0 ? void 0 : _a.href) || "";
}
function _isHttpOrHttps() {
  return _getCurrentScheme() === "http:" || _getCurrentScheme() === "https:";
}
function _getCurrentScheme() {
  var _a;
  return typeof self !== "undefined" && ((_a = self.location) === null || _a === void 0 ? void 0 : _a.protocol) || null;
}
function _isOnline() {
  if (typeof navigator !== "undefined" && navigator && "onLine" in navigator && typeof navigator.onLine === "boolean" && // Apply only for traditional web apps and Chrome extensions.
  // This is especially true for Cordova apps which have unreliable
  // navigator.onLine behavior unless cordova-plugin-network-information is
  // installed which overwrites the native navigator.onLine value and
  // defines navigator.connection.
  (_isHttpOrHttps() || isBrowserExtension() || "connection" in navigator)) {
    return navigator.onLine;
  }
  return true;
}
function _getUserLanguage() {
  if (typeof navigator === "undefined") {
    return null;
  }
  const navigatorLanguage = navigator;
  return (
    // Most reliable, but only supported in Chrome/Firefox.
    navigatorLanguage.languages && navigatorLanguage.languages[0] || // Supported in most browsers, but returns the language of the browser
    // UI, not the language set in browser settings.
    navigatorLanguage.language || // Couldn't determine language.
    null
  );
}
var Delay = class {
  constructor(shortDelay, longDelay) {
    this.shortDelay = shortDelay;
    this.longDelay = longDelay;
    debugAssert(longDelay > shortDelay, "Short delay should be less than long delay!");
    this.isMobile = isMobileCordova() || isReactNative();
  }
  get() {
    if (!_isOnline()) {
      return Math.min(5e3, this.shortDelay);
    }
    return this.isMobile ? this.longDelay : this.shortDelay;
  }
};
function _emulatorUrl(config, path) {
  debugAssert(config.emulator, "Emulator should always be set here");
  const { url } = config.emulator;
  if (!path) {
    return url;
  }
  return `${url}${path.startsWith("/") ? path.slice(1) : path}`;
}
var FetchProvider = class {
  static initialize(fetchImpl, headersImpl, responseImpl) {
    this.fetchImpl = fetchImpl;
    if (headersImpl) {
      this.headersImpl = headersImpl;
    }
    if (responseImpl) {
      this.responseImpl = responseImpl;
    }
  }
  static fetch() {
    if (this.fetchImpl) {
      return this.fetchImpl;
    }
    if (typeof self !== "undefined" && "fetch" in self) {
      return self.fetch;
    }
    if (typeof globalThis !== "undefined" && globalThis.fetch) {
      return globalThis.fetch;
    }
    if (typeof fetch !== "undefined") {
      return fetch;
    }
    debugFail("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
  }
  static headers() {
    if (this.headersImpl) {
      return this.headersImpl;
    }
    if (typeof self !== "undefined" && "Headers" in self) {
      return self.Headers;
    }
    if (typeof globalThis !== "undefined" && globalThis.Headers) {
      return globalThis.Headers;
    }
    if (typeof Headers !== "undefined") {
      return Headers;
    }
    debugFail("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
  }
  static response() {
    if (this.responseImpl) {
      return this.responseImpl;
    }
    if (typeof self !== "undefined" && "Response" in self) {
      return self.Response;
    }
    if (typeof globalThis !== "undefined" && globalThis.Response) {
      return globalThis.Response;
    }
    if (typeof Response !== "undefined") {
      return Response;
    }
    debugFail("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
  }
};
var SERVER_ERROR_MAP = {
  // Custom token errors.
  [
    "CREDENTIAL_MISMATCH"
    /* ServerError.CREDENTIAL_MISMATCH */
  ]: "custom-token-mismatch",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_CUSTOM_TOKEN"
    /* ServerError.MISSING_CUSTOM_TOKEN */
  ]: "internal-error",
  // Create Auth URI errors.
  [
    "INVALID_IDENTIFIER"
    /* ServerError.INVALID_IDENTIFIER */
  ]: "invalid-email",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_CONTINUE_URI"
    /* ServerError.MISSING_CONTINUE_URI */
  ]: "internal-error",
  // Sign in with email and password errors (some apply to sign up too).
  [
    "INVALID_PASSWORD"
    /* ServerError.INVALID_PASSWORD */
  ]: "wrong-password",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_PASSWORD"
    /* ServerError.MISSING_PASSWORD */
  ]: "missing-password",
  // Thrown if Email Enumeration Protection is enabled in the project and the email or password is
  // invalid.
  [
    "INVALID_LOGIN_CREDENTIALS"
    /* ServerError.INVALID_LOGIN_CREDENTIALS */
  ]: "invalid-credential",
  // Sign up with email and password errors.
  [
    "EMAIL_EXISTS"
    /* ServerError.EMAIL_EXISTS */
  ]: "email-already-in-use",
  [
    "PASSWORD_LOGIN_DISABLED"
    /* ServerError.PASSWORD_LOGIN_DISABLED */
  ]: "operation-not-allowed",
  // Verify assertion for sign in with credential errors:
  [
    "INVALID_IDP_RESPONSE"
    /* ServerError.INVALID_IDP_RESPONSE */
  ]: "invalid-credential",
  [
    "INVALID_PENDING_TOKEN"
    /* ServerError.INVALID_PENDING_TOKEN */
  ]: "invalid-credential",
  [
    "FEDERATED_USER_ID_ALREADY_LINKED"
    /* ServerError.FEDERATED_USER_ID_ALREADY_LINKED */
  ]: "credential-already-in-use",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_REQ_TYPE"
    /* ServerError.MISSING_REQ_TYPE */
  ]: "internal-error",
  // Send Password reset email errors:
  [
    "EMAIL_NOT_FOUND"
    /* ServerError.EMAIL_NOT_FOUND */
  ]: "user-not-found",
  [
    "RESET_PASSWORD_EXCEED_LIMIT"
    /* ServerError.RESET_PASSWORD_EXCEED_LIMIT */
  ]: "too-many-requests",
  [
    "EXPIRED_OOB_CODE"
    /* ServerError.EXPIRED_OOB_CODE */
  ]: "expired-action-code",
  [
    "INVALID_OOB_CODE"
    /* ServerError.INVALID_OOB_CODE */
  ]: "invalid-action-code",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_OOB_CODE"
    /* ServerError.MISSING_OOB_CODE */
  ]: "internal-error",
  // Operations that require ID token in request:
  [
    "CREDENTIAL_TOO_OLD_LOGIN_AGAIN"
    /* ServerError.CREDENTIAL_TOO_OLD_LOGIN_AGAIN */
  ]: "requires-recent-login",
  [
    "INVALID_ID_TOKEN"
    /* ServerError.INVALID_ID_TOKEN */
  ]: "invalid-user-token",
  [
    "TOKEN_EXPIRED"
    /* ServerError.TOKEN_EXPIRED */
  ]: "user-token-expired",
  [
    "USER_NOT_FOUND"
    /* ServerError.USER_NOT_FOUND */
  ]: "user-token-expired",
  // Other errors.
  [
    "TOO_MANY_ATTEMPTS_TRY_LATER"
    /* ServerError.TOO_MANY_ATTEMPTS_TRY_LATER */
  ]: "too-many-requests",
  [
    "PASSWORD_DOES_NOT_MEET_REQUIREMENTS"
    /* ServerError.PASSWORD_DOES_NOT_MEET_REQUIREMENTS */
  ]: "password-does-not-meet-requirements",
  // Phone Auth related errors.
  [
    "INVALID_CODE"
    /* ServerError.INVALID_CODE */
  ]: "invalid-verification-code",
  [
    "INVALID_SESSION_INFO"
    /* ServerError.INVALID_SESSION_INFO */
  ]: "invalid-verification-id",
  [
    "INVALID_TEMPORARY_PROOF"
    /* ServerError.INVALID_TEMPORARY_PROOF */
  ]: "invalid-credential",
  [
    "MISSING_SESSION_INFO"
    /* ServerError.MISSING_SESSION_INFO */
  ]: "missing-verification-id",
  [
    "SESSION_EXPIRED"
    /* ServerError.SESSION_EXPIRED */
  ]: "code-expired",
  // Other action code errors when additional settings passed.
  // MISSING_CONTINUE_URI is getting mapped to INTERNAL_ERROR above.
  // This is OK as this error will be caught by client side validation.
  [
    "MISSING_ANDROID_PACKAGE_NAME"
    /* ServerError.MISSING_ANDROID_PACKAGE_NAME */
  ]: "missing-android-pkg-name",
  [
    "UNAUTHORIZED_DOMAIN"
    /* ServerError.UNAUTHORIZED_DOMAIN */
  ]: "unauthorized-continue-uri",
  // getProjectConfig errors when clientId is passed.
  [
    "INVALID_OAUTH_CLIENT_ID"
    /* ServerError.INVALID_OAUTH_CLIENT_ID */
  ]: "invalid-oauth-client-id",
  // User actions (sign-up or deletion) disabled errors.
  [
    "ADMIN_ONLY_OPERATION"
    /* ServerError.ADMIN_ONLY_OPERATION */
  ]: "admin-restricted-operation",
  // Multi factor related errors.
  [
    "INVALID_MFA_PENDING_CREDENTIAL"
    /* ServerError.INVALID_MFA_PENDING_CREDENTIAL */
  ]: "invalid-multi-factor-session",
  [
    "MFA_ENROLLMENT_NOT_FOUND"
    /* ServerError.MFA_ENROLLMENT_NOT_FOUND */
  ]: "multi-factor-info-not-found",
  [
    "MISSING_MFA_ENROLLMENT_ID"
    /* ServerError.MISSING_MFA_ENROLLMENT_ID */
  ]: "missing-multi-factor-info",
  [
    "MISSING_MFA_PENDING_CREDENTIAL"
    /* ServerError.MISSING_MFA_PENDING_CREDENTIAL */
  ]: "missing-multi-factor-session",
  [
    "SECOND_FACTOR_EXISTS"
    /* ServerError.SECOND_FACTOR_EXISTS */
  ]: "second-factor-already-in-use",
  [
    "SECOND_FACTOR_LIMIT_EXCEEDED"
    /* ServerError.SECOND_FACTOR_LIMIT_EXCEEDED */
  ]: "maximum-second-factor-count-exceeded",
  // Blocking functions related errors.
  [
    "BLOCKING_FUNCTION_ERROR_RESPONSE"
    /* ServerError.BLOCKING_FUNCTION_ERROR_RESPONSE */
  ]: "internal-error",
  // Recaptcha related errors.
  [
    "RECAPTCHA_NOT_ENABLED"
    /* ServerError.RECAPTCHA_NOT_ENABLED */
  ]: "recaptcha-not-enabled",
  [
    "MISSING_RECAPTCHA_TOKEN"
    /* ServerError.MISSING_RECAPTCHA_TOKEN */
  ]: "missing-recaptcha-token",
  [
    "INVALID_RECAPTCHA_TOKEN"
    /* ServerError.INVALID_RECAPTCHA_TOKEN */
  ]: "invalid-recaptcha-token",
  [
    "INVALID_RECAPTCHA_ACTION"
    /* ServerError.INVALID_RECAPTCHA_ACTION */
  ]: "invalid-recaptcha-action",
  [
    "MISSING_CLIENT_TYPE"
    /* ServerError.MISSING_CLIENT_TYPE */
  ]: "missing-client-type",
  [
    "MISSING_RECAPTCHA_VERSION"
    /* ServerError.MISSING_RECAPTCHA_VERSION */
  ]: "missing-recaptcha-version",
  [
    "INVALID_RECAPTCHA_VERSION"
    /* ServerError.INVALID_RECAPTCHA_VERSION */
  ]: "invalid-recaptcha-version",
  [
    "INVALID_REQ_TYPE"
    /* ServerError.INVALID_REQ_TYPE */
  ]: "invalid-req-type"
  /* AuthErrorCode.INVALID_REQ_TYPE */
};
var CookieAuthProxiedEndpoints = [
  "/v1/accounts:signInWithCustomToken",
  "/v1/accounts:signInWithEmailLink",
  "/v1/accounts:signInWithIdp",
  "/v1/accounts:signInWithPassword",
  "/v1/accounts:signInWithPhoneNumber",
  "/v1/token"
  /* Endpoint.TOKEN */
];
var DEFAULT_API_TIMEOUT_MS = new Delay(3e4, 6e4);
function _addTidIfNecessary(auth, request) {
  if (auth.tenantId && !request.tenantId) {
    return Object.assign(Object.assign({}, request), { tenantId: auth.tenantId });
  }
  return request;
}
async function _performApiRequest(auth, method, path, request, customErrorMap = {}) {
  return _performFetchWithErrorHandling(auth, customErrorMap, async () => {
    let body = {};
    let params = {};
    if (request) {
      if (method === "GET") {
        params = request;
      } else {
        body = {
          body: JSON.stringify(request)
        };
      }
    }
    const query = querystring(Object.assign({ key: auth.config.apiKey }, params)).slice(1);
    const headers = await auth._getAdditionalHeaders();
    headers[
      "Content-Type"
      /* HttpHeader.CONTENT_TYPE */
    ] = "application/json";
    if (auth.languageCode) {
      headers[
        "X-Firebase-Locale"
        /* HttpHeader.X_FIREBASE_LOCALE */
      ] = auth.languageCode;
    }
    const fetchArgs = Object.assign({
      method,
      headers
    }, body);
    if (!isCloudflareWorker()) {
      fetchArgs.referrerPolicy = "no-referrer";
    }
    if (auth.emulatorConfig && isCloudWorkstation(auth.emulatorConfig.host)) {
      fetchArgs.credentials = "include";
    }
    return FetchProvider.fetch()(await _getFinalTarget(auth, auth.config.apiHost, path, query), fetchArgs);
  });
}
async function _performFetchWithErrorHandling(auth, customErrorMap, fetchFn) {
  auth._canInitEmulator = false;
  const errorMap = Object.assign(Object.assign({}, SERVER_ERROR_MAP), customErrorMap);
  try {
    const networkTimeout = new NetworkTimeout(auth);
    const response = await Promise.race([
      fetchFn(),
      networkTimeout.promise
    ]);
    networkTimeout.clearNetworkTimeout();
    const json = await response.json();
    if ("needConfirmation" in json) {
      throw _makeTaggedError(auth, "account-exists-with-different-credential", json);
    }
    if (response.ok && !("errorMessage" in json)) {
      return json;
    } else {
      const errorMessage = response.ok ? json.errorMessage : json.error.message;
      const [serverErrorCode, serverErrorMessage] = errorMessage.split(" : ");
      if (serverErrorCode === "FEDERATED_USER_ID_ALREADY_LINKED") {
        throw _makeTaggedError(auth, "credential-already-in-use", json);
      } else if (serverErrorCode === "EMAIL_EXISTS") {
        throw _makeTaggedError(auth, "email-already-in-use", json);
      } else if (serverErrorCode === "USER_DISABLED") {
        throw _makeTaggedError(auth, "user-disabled", json);
      }
      const authError = errorMap[serverErrorCode] || serverErrorCode.toLowerCase().replace(/[_\s]+/g, "-");
      if (serverErrorMessage) {
        throw _errorWithCustomMessage(auth, authError, serverErrorMessage);
      } else {
        _fail(auth, authError);
      }
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      throw e;
    }
    _fail(auth, "network-request-failed", { "message": String(e) });
  }
}
async function _performSignInRequest(auth, method, path, request, customErrorMap = {}) {
  const serverResponse = await _performApiRequest(auth, method, path, request, customErrorMap);
  if ("mfaPendingCredential" in serverResponse) {
    _fail(auth, "multi-factor-auth-required", {
      _serverResponse: serverResponse
    });
  }
  return serverResponse;
}
async function _getFinalTarget(auth, host, path, query) {
  const base = `${host}${path}?${query}`;
  const authInternal = auth;
  const finalTarget = authInternal.config.emulator ? _emulatorUrl(auth.config, base) : `${auth.config.apiScheme}://${base}`;
  if (CookieAuthProxiedEndpoints.includes(path)) {
    await authInternal._persistenceManagerAvailable;
    if (authInternal._getPersistenceType() === "COOKIE") {
      const cookiePersistence = authInternal._getPersistence();
      return cookiePersistence._getFinalTarget(finalTarget).toString();
    }
  }
  return finalTarget;
}
function _parseEnforcementState(enforcementStateStr) {
  switch (enforcementStateStr) {
    case "ENFORCE":
      return "ENFORCE";
    case "AUDIT":
      return "AUDIT";
    case "OFF":
      return "OFF";
    default:
      return "ENFORCEMENT_STATE_UNSPECIFIED";
  }
}
var NetworkTimeout = class {
  clearNetworkTimeout() {
    clearTimeout(this.timer);
  }
  constructor(auth) {
    this.auth = auth;
    this.timer = null;
    this.promise = new Promise((_, reject) => {
      this.timer = setTimeout(() => {
        return reject(_createError(
          this.auth,
          "network-request-failed"
          /* AuthErrorCode.NETWORK_REQUEST_FAILED */
        ));
      }, DEFAULT_API_TIMEOUT_MS.get());
    });
  }
};
function _makeTaggedError(auth, code, response) {
  const errorParams = {
    appName: auth.name
  };
  if (response.email) {
    errorParams.email = response.email;
  }
  if (response.phoneNumber) {
    errorParams.phoneNumber = response.phoneNumber;
  }
  const error = _createError(auth, code, errorParams);
  error.customData._tokenResponse = response;
  return error;
}
function isEnterprise(grecaptcha) {
  return grecaptcha !== void 0 && grecaptcha.enterprise !== void 0;
}
var RecaptchaConfig = class {
  constructor(response) {
    this.siteKey = "";
    this.recaptchaEnforcementState = [];
    if (response.recaptchaKey === void 0) {
      throw new Error("recaptchaKey undefined");
    }
    this.siteKey = response.recaptchaKey.split("/")[3];
    this.recaptchaEnforcementState = response.recaptchaEnforcementState;
  }
  /**
   * Returns the reCAPTCHA Enterprise enforcement state for the given provider.
   *
   * @param providerStr - The provider whose enforcement state is to be returned.
   * @returns The reCAPTCHA Enterprise enforcement state for the given provider.
   */
  getProviderEnforcementState(providerStr) {
    if (!this.recaptchaEnforcementState || this.recaptchaEnforcementState.length === 0) {
      return null;
    }
    for (const recaptchaEnforcementState of this.recaptchaEnforcementState) {
      if (recaptchaEnforcementState.provider && recaptchaEnforcementState.provider === providerStr) {
        return _parseEnforcementState(recaptchaEnforcementState.enforcementState);
      }
    }
    return null;
  }
  /**
   * Returns true if the reCAPTCHA Enterprise enforcement state for the provider is set to ENFORCE or AUDIT.
   *
   * @param providerStr - The provider whose enablement state is to be returned.
   * @returns Whether or not reCAPTCHA Enterprise protection is enabled for the given provider.
   */
  isProviderEnabled(providerStr) {
    return this.getProviderEnforcementState(providerStr) === "ENFORCE" || this.getProviderEnforcementState(providerStr) === "AUDIT";
  }
  /**
   * Returns true if reCAPTCHA Enterprise protection is enabled in at least one provider, otherwise
   * returns false.
   *
   * @returns Whether or not reCAPTCHA Enterprise protection is enabled for at least one provider.
   */
  isAnyProviderEnabled() {
    return this.isProviderEnabled(
      "EMAIL_PASSWORD_PROVIDER"
      /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
    ) || this.isProviderEnabled(
      "PHONE_PROVIDER"
      /* RecaptchaAuthProvider.PHONE_PROVIDER */
    );
  }
};
async function getRecaptchaConfig(auth, request) {
  return _performApiRequest(auth, "GET", "/v2/recaptchaConfig", _addTidIfNecessary(auth, request));
}
async function deleteAccount(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:delete", request);
}
async function deleteLinkedAccounts(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:update", request);
}
async function getAccountInfo(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:lookup", request);
}
function utcTimestampToDateString(utcTimestamp) {
  if (!utcTimestamp) {
    return void 0;
  }
  try {
    const date = new Date(Number(utcTimestamp));
    if (!isNaN(date.getTime())) {
      return date.toUTCString();
    }
  } catch (e) {
  }
  return void 0;
}
function getIdToken(user, forceRefresh = false) {
  return getModularInstance(user).getIdToken(forceRefresh);
}
async function getIdTokenResult(user, forceRefresh = false) {
  const userInternal = getModularInstance(user);
  const token = await userInternal.getIdToken(forceRefresh);
  const claims = _parseToken(token);
  _assert(
    claims && claims.exp && claims.auth_time && claims.iat,
    userInternal.auth,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  const firebase = typeof claims.firebase === "object" ? claims.firebase : void 0;
  const signInProvider = firebase === null || firebase === void 0 ? void 0 : firebase["sign_in_provider"];
  return {
    claims,
    token,
    authTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.auth_time)),
    issuedAtTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.iat)),
    expirationTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.exp)),
    signInProvider: signInProvider || null,
    signInSecondFactor: (firebase === null || firebase === void 0 ? void 0 : firebase["sign_in_second_factor"]) || null
  };
}
function secondsStringToMilliseconds(seconds) {
  return Number(seconds) * 1e3;
}
function _parseToken(token) {
  const [algorithm, payload, signature] = token.split(".");
  if (algorithm === void 0 || payload === void 0 || signature === void 0) {
    _logError("JWT malformed, contained fewer than 3 sections");
    return null;
  }
  try {
    const decoded = base64Decode(payload);
    if (!decoded) {
      _logError("Failed to decode base64 JWT payload");
      return null;
    }
    return JSON.parse(decoded);
  } catch (e) {
    _logError("Caught error parsing JWT payload as JSON", e === null || e === void 0 ? void 0 : e.toString());
    return null;
  }
}
function _tokenExpiresIn(token) {
  const parsedToken = _parseToken(token);
  _assert(
    parsedToken,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  _assert(
    typeof parsedToken.exp !== "undefined",
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  _assert(
    typeof parsedToken.iat !== "undefined",
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return Number(parsedToken.exp) - Number(parsedToken.iat);
}
async function _logoutIfInvalidated(user, promise, bypassAuthState = false) {
  if (bypassAuthState) {
    return promise;
  }
  try {
    return await promise;
  } catch (e) {
    if (e instanceof FirebaseError && isUserInvalidated(e)) {
      if (user.auth.currentUser === user) {
        await user.auth.signOut();
      }
    }
    throw e;
  }
}
function isUserInvalidated({ code }) {
  return code === `auth/${"user-disabled"}` || code === `auth/${"user-token-expired"}`;
}
var ProactiveRefresh = class {
  constructor(user) {
    this.user = user;
    this.isRunning = false;
    this.timerId = null;
    this.errorBackoff = 3e4;
  }
  _start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.schedule();
  }
  _stop() {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
  }
  getInterval(wasError) {
    var _a;
    if (wasError) {
      const interval = this.errorBackoff;
      this.errorBackoff = Math.min(
        this.errorBackoff * 2,
        96e4
        /* Duration.RETRY_BACKOFF_MAX */
      );
      return interval;
    } else {
      this.errorBackoff = 3e4;
      const expTime = (_a = this.user.stsTokenManager.expirationTime) !== null && _a !== void 0 ? _a : 0;
      const interval = expTime - Date.now() - 3e5;
      return Math.max(0, interval);
    }
  }
  schedule(wasError = false) {
    if (!this.isRunning) {
      return;
    }
    const interval = this.getInterval(wasError);
    this.timerId = setTimeout(async () => {
      await this.iteration();
    }, interval);
  }
  async iteration() {
    try {
      await this.user.getIdToken(true);
    } catch (e) {
      if ((e === null || e === void 0 ? void 0 : e.code) === `auth/${"network-request-failed"}`) {
        this.schedule(
          /* wasError */
          true
        );
      }
      return;
    }
    this.schedule();
  }
};
var UserMetadata = class {
  constructor(createdAt, lastLoginAt) {
    this.createdAt = createdAt;
    this.lastLoginAt = lastLoginAt;
    this._initializeTime();
  }
  _initializeTime() {
    this.lastSignInTime = utcTimestampToDateString(this.lastLoginAt);
    this.creationTime = utcTimestampToDateString(this.createdAt);
  }
  _copy(metadata) {
    this.createdAt = metadata.createdAt;
    this.lastLoginAt = metadata.lastLoginAt;
    this._initializeTime();
  }
  toJSON() {
    return {
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt
    };
  }
};
async function _reloadWithoutSaving(user) {
  var _a;
  const auth = user.auth;
  const idToken = await user.getIdToken();
  const response = await _logoutIfInvalidated(user, getAccountInfo(auth, { idToken }));
  _assert(
    response === null || response === void 0 ? void 0 : response.users.length,
    auth,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  const coreAccount = response.users[0];
  user._notifyReloadListener(coreAccount);
  const newProviderData = ((_a = coreAccount.providerUserInfo) === null || _a === void 0 ? void 0 : _a.length) ? extractProviderData(coreAccount.providerUserInfo) : [];
  const providerData = mergeProviderData(user.providerData, newProviderData);
  const oldIsAnonymous = user.isAnonymous;
  const newIsAnonymous = !(user.email && coreAccount.passwordHash) && !(providerData === null || providerData === void 0 ? void 0 : providerData.length);
  const isAnonymous = !oldIsAnonymous ? false : newIsAnonymous;
  const updates = {
    uid: coreAccount.localId,
    displayName: coreAccount.displayName || null,
    photoURL: coreAccount.photoUrl || null,
    email: coreAccount.email || null,
    emailVerified: coreAccount.emailVerified || false,
    phoneNumber: coreAccount.phoneNumber || null,
    tenantId: coreAccount.tenantId || null,
    providerData,
    metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
    isAnonymous
  };
  Object.assign(user, updates);
}
async function reload(user) {
  const userInternal = getModularInstance(user);
  await _reloadWithoutSaving(userInternal);
  await userInternal.auth._persistUserIfCurrent(userInternal);
  userInternal.auth._notifyListenersIfCurrent(userInternal);
}
function mergeProviderData(original, newData) {
  const deduped = original.filter((o) => !newData.some((n) => n.providerId === o.providerId));
  return [...deduped, ...newData];
}
function extractProviderData(providers) {
  return providers.map((_a) => {
    var { providerId } = _a, provider = __rest(_a, ["providerId"]);
    return {
      providerId,
      uid: provider.rawId || "",
      displayName: provider.displayName || null,
      email: provider.email || null,
      phoneNumber: provider.phoneNumber || null,
      photoURL: provider.photoUrl || null
    };
  });
}
async function requestStsToken(auth, refreshToken) {
  const response = await _performFetchWithErrorHandling(auth, {}, async () => {
    const body = querystring({
      "grant_type": "refresh_token",
      "refresh_token": refreshToken
    }).slice(1);
    const { tokenApiHost, apiKey } = auth.config;
    const url = await _getFinalTarget(auth, tokenApiHost, "/v1/token", `key=${apiKey}`);
    const headers = await auth._getAdditionalHeaders();
    headers[
      "Content-Type"
      /* HttpHeader.CONTENT_TYPE */
    ] = "application/x-www-form-urlencoded";
    const options = {
      method: "POST",
      headers,
      body
    };
    if (auth.emulatorConfig && isCloudWorkstation(auth.emulatorConfig.host)) {
      options.credentials = "include";
    }
    return FetchProvider.fetch()(url, options);
  });
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token
  };
}
async function revokeToken(auth, request) {
  return _performApiRequest(auth, "POST", "/v2/accounts:revokeToken", _addTidIfNecessary(auth, request));
}
var StsTokenManager = class _StsTokenManager {
  constructor() {
    this.refreshToken = null;
    this.accessToken = null;
    this.expirationTime = null;
  }
  get isExpired() {
    return !this.expirationTime || Date.now() > this.expirationTime - 3e4;
  }
  updateFromServerResponse(response) {
    _assert(
      response.idToken,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof response.idToken !== "undefined",
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof response.refreshToken !== "undefined",
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const expiresIn = "expiresIn" in response && typeof response.expiresIn !== "undefined" ? Number(response.expiresIn) : _tokenExpiresIn(response.idToken);
    this.updateTokensAndExpiration(response.idToken, response.refreshToken, expiresIn);
  }
  updateFromIdToken(idToken) {
    _assert(
      idToken.length !== 0,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const expiresIn = _tokenExpiresIn(idToken);
    this.updateTokensAndExpiration(idToken, null, expiresIn);
  }
  async getToken(auth, forceRefresh = false) {
    if (!forceRefresh && this.accessToken && !this.isExpired) {
      return this.accessToken;
    }
    _assert(
      this.refreshToken,
      auth,
      "user-token-expired"
      /* AuthErrorCode.TOKEN_EXPIRED */
    );
    if (this.refreshToken) {
      await this.refresh(auth, this.refreshToken);
      return this.accessToken;
    }
    return null;
  }
  clearRefreshToken() {
    this.refreshToken = null;
  }
  async refresh(auth, oldToken) {
    const { accessToken, refreshToken, expiresIn } = await requestStsToken(auth, oldToken);
    this.updateTokensAndExpiration(accessToken, refreshToken, Number(expiresIn));
  }
  updateTokensAndExpiration(accessToken, refreshToken, expiresInSec) {
    this.refreshToken = refreshToken || null;
    this.accessToken = accessToken || null;
    this.expirationTime = Date.now() + expiresInSec * 1e3;
  }
  static fromJSON(appName, object) {
    const { refreshToken, accessToken, expirationTime } = object;
    const manager = new _StsTokenManager();
    if (refreshToken) {
      _assert(typeof refreshToken === "string", "internal-error", {
        appName
      });
      manager.refreshToken = refreshToken;
    }
    if (accessToken) {
      _assert(typeof accessToken === "string", "internal-error", {
        appName
      });
      manager.accessToken = accessToken;
    }
    if (expirationTime) {
      _assert(typeof expirationTime === "number", "internal-error", {
        appName
      });
      manager.expirationTime = expirationTime;
    }
    return manager;
  }
  toJSON() {
    return {
      refreshToken: this.refreshToken,
      accessToken: this.accessToken,
      expirationTime: this.expirationTime
    };
  }
  _assign(stsTokenManager) {
    this.accessToken = stsTokenManager.accessToken;
    this.refreshToken = stsTokenManager.refreshToken;
    this.expirationTime = stsTokenManager.expirationTime;
  }
  _clone() {
    return Object.assign(new _StsTokenManager(), this.toJSON());
  }
  _performRefresh() {
    return debugFail("not implemented");
  }
};
function assertStringOrUndefined(assertion, appName) {
  _assert(typeof assertion === "string" || typeof assertion === "undefined", "internal-error", { appName });
}
var UserImpl = class _UserImpl {
  constructor(_a) {
    var { uid, auth, stsTokenManager } = _a, opt = __rest(_a, ["uid", "auth", "stsTokenManager"]);
    this.providerId = "firebase";
    this.proactiveRefresh = new ProactiveRefresh(this);
    this.reloadUserInfo = null;
    this.reloadListener = null;
    this.uid = uid;
    this.auth = auth;
    this.stsTokenManager = stsTokenManager;
    this.accessToken = stsTokenManager.accessToken;
    this.displayName = opt.displayName || null;
    this.email = opt.email || null;
    this.emailVerified = opt.emailVerified || false;
    this.phoneNumber = opt.phoneNumber || null;
    this.photoURL = opt.photoURL || null;
    this.isAnonymous = opt.isAnonymous || false;
    this.tenantId = opt.tenantId || null;
    this.providerData = opt.providerData ? [...opt.providerData] : [];
    this.metadata = new UserMetadata(opt.createdAt || void 0, opt.lastLoginAt || void 0);
  }
  async getIdToken(forceRefresh) {
    const accessToken = await _logoutIfInvalidated(this, this.stsTokenManager.getToken(this.auth, forceRefresh));
    _assert(
      accessToken,
      this.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    if (this.accessToken !== accessToken) {
      this.accessToken = accessToken;
      await this.auth._persistUserIfCurrent(this);
      this.auth._notifyListenersIfCurrent(this);
    }
    return accessToken;
  }
  getIdTokenResult(forceRefresh) {
    return getIdTokenResult(this, forceRefresh);
  }
  reload() {
    return reload(this);
  }
  _assign(user) {
    if (this === user) {
      return;
    }
    _assert(
      this.uid === user.uid,
      this.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    this.displayName = user.displayName;
    this.photoURL = user.photoURL;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.phoneNumber = user.phoneNumber;
    this.isAnonymous = user.isAnonymous;
    this.tenantId = user.tenantId;
    this.providerData = user.providerData.map((userInfo) => Object.assign({}, userInfo));
    this.metadata._copy(user.metadata);
    this.stsTokenManager._assign(user.stsTokenManager);
  }
  _clone(auth) {
    const newUser = new _UserImpl(Object.assign(Object.assign({}, this), { auth, stsTokenManager: this.stsTokenManager._clone() }));
    newUser.metadata._copy(this.metadata);
    return newUser;
  }
  _onReload(callback) {
    _assert(
      !this.reloadListener,
      this.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    this.reloadListener = callback;
    if (this.reloadUserInfo) {
      this._notifyReloadListener(this.reloadUserInfo);
      this.reloadUserInfo = null;
    }
  }
  _notifyReloadListener(userInfo) {
    if (this.reloadListener) {
      this.reloadListener(userInfo);
    } else {
      this.reloadUserInfo = userInfo;
    }
  }
  _startProactiveRefresh() {
    this.proactiveRefresh._start();
  }
  _stopProactiveRefresh() {
    this.proactiveRefresh._stop();
  }
  async _updateTokensIfNecessary(response, reload2 = false) {
    let tokensRefreshed = false;
    if (response.idToken && response.idToken !== this.stsTokenManager.accessToken) {
      this.stsTokenManager.updateFromServerResponse(response);
      tokensRefreshed = true;
    }
    if (reload2) {
      await _reloadWithoutSaving(this);
    }
    await this.auth._persistUserIfCurrent(this);
    if (tokensRefreshed) {
      this.auth._notifyListenersIfCurrent(this);
    }
  }
  async delete() {
    if (_isFirebaseServerApp(this.auth.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this.auth));
    }
    const idToken = await this.getIdToken();
    await _logoutIfInvalidated(this, deleteAccount(this.auth, { idToken }));
    this.stsTokenManager.clearRefreshToken();
    return this.auth.signOut();
  }
  toJSON() {
    return Object.assign(Object.assign({
      uid: this.uid,
      email: this.email || void 0,
      emailVerified: this.emailVerified,
      displayName: this.displayName || void 0,
      isAnonymous: this.isAnonymous,
      photoURL: this.photoURL || void 0,
      phoneNumber: this.phoneNumber || void 0,
      tenantId: this.tenantId || void 0,
      providerData: this.providerData.map((userInfo) => Object.assign({}, userInfo)),
      stsTokenManager: this.stsTokenManager.toJSON(),
      // Redirect event ID must be maintained in case there is a pending
      // redirect event.
      _redirectEventId: this._redirectEventId
    }, this.metadata.toJSON()), {
      // Required for compatibility with the legacy SDK (go/firebase-auth-sdk-persistence-parsing):
      apiKey: this.auth.config.apiKey,
      appName: this.auth.name
    });
  }
  get refreshToken() {
    return this.stsTokenManager.refreshToken || "";
  }
  static _fromJSON(auth, object) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const displayName = (_a = object.displayName) !== null && _a !== void 0 ? _a : void 0;
    const email = (_b = object.email) !== null && _b !== void 0 ? _b : void 0;
    const phoneNumber = (_c = object.phoneNumber) !== null && _c !== void 0 ? _c : void 0;
    const photoURL = (_d = object.photoURL) !== null && _d !== void 0 ? _d : void 0;
    const tenantId = (_e = object.tenantId) !== null && _e !== void 0 ? _e : void 0;
    const _redirectEventId = (_f = object._redirectEventId) !== null && _f !== void 0 ? _f : void 0;
    const createdAt = (_g = object.createdAt) !== null && _g !== void 0 ? _g : void 0;
    const lastLoginAt = (_h = object.lastLoginAt) !== null && _h !== void 0 ? _h : void 0;
    const { uid, emailVerified, isAnonymous, providerData, stsTokenManager: plainObjectTokenManager } = object;
    _assert(
      uid && plainObjectTokenManager,
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const stsTokenManager = StsTokenManager.fromJSON(this.name, plainObjectTokenManager);
    _assert(
      typeof uid === "string",
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    assertStringOrUndefined(displayName, auth.name);
    assertStringOrUndefined(email, auth.name);
    _assert(
      typeof emailVerified === "boolean",
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof isAnonymous === "boolean",
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    assertStringOrUndefined(phoneNumber, auth.name);
    assertStringOrUndefined(photoURL, auth.name);
    assertStringOrUndefined(tenantId, auth.name);
    assertStringOrUndefined(_redirectEventId, auth.name);
    assertStringOrUndefined(createdAt, auth.name);
    assertStringOrUndefined(lastLoginAt, auth.name);
    const user = new _UserImpl({
      uid,
      auth,
      email,
      emailVerified,
      displayName,
      isAnonymous,
      photoURL,
      phoneNumber,
      tenantId,
      stsTokenManager,
      createdAt,
      lastLoginAt
    });
    if (providerData && Array.isArray(providerData)) {
      user.providerData = providerData.map((userInfo) => Object.assign({}, userInfo));
    }
    if (_redirectEventId) {
      user._redirectEventId = _redirectEventId;
    }
    return user;
  }
  /**
   * Initialize a User from an idToken server response
   * @param auth
   * @param idTokenResponse
   */
  static async _fromIdTokenResponse(auth, idTokenResponse, isAnonymous = false) {
    const stsTokenManager = new StsTokenManager();
    stsTokenManager.updateFromServerResponse(idTokenResponse);
    const user = new _UserImpl({
      uid: idTokenResponse.localId,
      auth,
      stsTokenManager,
      isAnonymous
    });
    await _reloadWithoutSaving(user);
    return user;
  }
  /**
   * Initialize a User from an idToken server response
   * @param auth
   * @param idTokenResponse
   */
  static async _fromGetAccountInfoResponse(auth, response, idToken) {
    const coreAccount = response.users[0];
    _assert(
      coreAccount.localId !== void 0,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const providerData = coreAccount.providerUserInfo !== void 0 ? extractProviderData(coreAccount.providerUserInfo) : [];
    const isAnonymous = !(coreAccount.email && coreAccount.passwordHash) && !(providerData === null || providerData === void 0 ? void 0 : providerData.length);
    const stsTokenManager = new StsTokenManager();
    stsTokenManager.updateFromIdToken(idToken);
    const user = new _UserImpl({
      uid: coreAccount.localId,
      auth,
      stsTokenManager,
      isAnonymous
    });
    const updates = {
      uid: coreAccount.localId,
      displayName: coreAccount.displayName || null,
      photoURL: coreAccount.photoUrl || null,
      email: coreAccount.email || null,
      emailVerified: coreAccount.emailVerified || false,
      phoneNumber: coreAccount.phoneNumber || null,
      tenantId: coreAccount.tenantId || null,
      providerData,
      metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
      isAnonymous: !(coreAccount.email && coreAccount.passwordHash) && !(providerData === null || providerData === void 0 ? void 0 : providerData.length)
    };
    Object.assign(user, updates);
    return user;
  }
};
var instanceCache = /* @__PURE__ */ new Map();
function _getInstance(cls) {
  debugAssert(cls instanceof Function, "Expected a class definition");
  let instance = instanceCache.get(cls);
  if (instance) {
    debugAssert(instance instanceof cls, "Instance stored in cache mismatched with class");
    return instance;
  }
  instance = new cls();
  instanceCache.set(cls, instance);
  return instance;
}
var InMemoryPersistence = class {
  constructor() {
    this.type = "NONE";
    this.storage = {};
  }
  async _isAvailable() {
    return true;
  }
  async _set(key, value) {
    this.storage[key] = value;
  }
  async _get(key) {
    const value = this.storage[key];
    return value === void 0 ? null : value;
  }
  async _remove(key) {
    delete this.storage[key];
  }
  _addListener(_key, _listener) {
    return;
  }
  _removeListener(_key, _listener) {
    return;
  }
};
InMemoryPersistence.type = "NONE";
var inMemoryPersistence = InMemoryPersistence;
function _persistenceKeyName(key, apiKey, appName) {
  return `${"firebase"}:${key}:${apiKey}:${appName}`;
}
var PersistenceUserManager = class _PersistenceUserManager {
  constructor(persistence, auth, userKey) {
    this.persistence = persistence;
    this.auth = auth;
    this.userKey = userKey;
    const { config, name: name4 } = this.auth;
    this.fullUserKey = _persistenceKeyName(this.userKey, config.apiKey, name4);
    this.fullPersistenceKey = _persistenceKeyName("persistence", config.apiKey, name4);
    this.boundEventHandler = auth._onStorageEvent.bind(auth);
    this.persistence._addListener(this.fullUserKey, this.boundEventHandler);
  }
  setCurrentUser(user) {
    return this.persistence._set(this.fullUserKey, user.toJSON());
  }
  async getCurrentUser() {
    const blob = await this.persistence._get(this.fullUserKey);
    if (!blob) {
      return null;
    }
    if (typeof blob === "string") {
      const response = await getAccountInfo(this.auth, { idToken: blob }).catch(() => void 0);
      if (!response) {
        return null;
      }
      return UserImpl._fromGetAccountInfoResponse(this.auth, response, blob);
    }
    return UserImpl._fromJSON(this.auth, blob);
  }
  removeCurrentUser() {
    return this.persistence._remove(this.fullUserKey);
  }
  savePersistenceForRedirect() {
    return this.persistence._set(this.fullPersistenceKey, this.persistence.type);
  }
  async setPersistence(newPersistence) {
    if (this.persistence === newPersistence) {
      return;
    }
    const currentUser = await this.getCurrentUser();
    await this.removeCurrentUser();
    this.persistence = newPersistence;
    if (currentUser) {
      return this.setCurrentUser(currentUser);
    }
  }
  delete() {
    this.persistence._removeListener(this.fullUserKey, this.boundEventHandler);
  }
  static async create(auth, persistenceHierarchy, userKey = "authUser") {
    if (!persistenceHierarchy.length) {
      return new _PersistenceUserManager(_getInstance(inMemoryPersistence), auth, userKey);
    }
    const availablePersistences = (await Promise.all(persistenceHierarchy.map(async (persistence) => {
      if (await persistence._isAvailable()) {
        return persistence;
      }
      return void 0;
    }))).filter((persistence) => persistence);
    let selectedPersistence = availablePersistences[0] || _getInstance(inMemoryPersistence);
    const key = _persistenceKeyName(userKey, auth.config.apiKey, auth.name);
    let userToMigrate = null;
    for (const persistence of persistenceHierarchy) {
      try {
        const blob = await persistence._get(key);
        if (blob) {
          let user;
          if (typeof blob === "string") {
            const response = await getAccountInfo(auth, {
              idToken: blob
            }).catch(() => void 0);
            if (!response) {
              break;
            }
            user = await UserImpl._fromGetAccountInfoResponse(auth, response, blob);
          } else {
            user = UserImpl._fromJSON(auth, blob);
          }
          if (persistence !== selectedPersistence) {
            userToMigrate = user;
          }
          selectedPersistence = persistence;
          break;
        }
      } catch (_a) {
      }
    }
    const migrationHierarchy = availablePersistences.filter((p) => p._shouldAllowMigration);
    if (!selectedPersistence._shouldAllowMigration || !migrationHierarchy.length) {
      return new _PersistenceUserManager(selectedPersistence, auth, userKey);
    }
    selectedPersistence = migrationHierarchy[0];
    if (userToMigrate) {
      await selectedPersistence._set(key, userToMigrate.toJSON());
    }
    await Promise.all(persistenceHierarchy.map(async (persistence) => {
      if (persistence !== selectedPersistence) {
        try {
          await persistence._remove(key);
        } catch (_a) {
        }
      }
    }));
    return new _PersistenceUserManager(selectedPersistence, auth, userKey);
  }
};
function _getBrowserName(userAgent) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("opera/") || ua.includes("opr/") || ua.includes("opios/")) {
    return "Opera";
  } else if (_isIEMobile(ua)) {
    return "IEMobile";
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    return "IE";
  } else if (ua.includes("edge/")) {
    return "Edge";
  } else if (_isFirefox(ua)) {
    return "Firefox";
  } else if (ua.includes("silk/")) {
    return "Silk";
  } else if (_isBlackBerry(ua)) {
    return "Blackberry";
  } else if (_isWebOS(ua)) {
    return "Webos";
  } else if (_isSafari(ua)) {
    return "Safari";
  } else if ((ua.includes("chrome/") || _isChromeIOS(ua)) && !ua.includes("edge/")) {
    return "Chrome";
  } else if (_isAndroid(ua)) {
    return "Android";
  } else {
    const re = /([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/;
    const matches = userAgent.match(re);
    if ((matches === null || matches === void 0 ? void 0 : matches.length) === 2) {
      return matches[1];
    }
  }
  return "Other";
}
function _isFirefox(ua = getUA()) {
  return /firefox\//i.test(ua);
}
function _isSafari(userAgent = getUA()) {
  const ua = userAgent.toLowerCase();
  return ua.includes("safari/") && !ua.includes("chrome/") && !ua.includes("crios/") && !ua.includes("android");
}
function _isChromeIOS(ua = getUA()) {
  return /crios\//i.test(ua);
}
function _isIEMobile(ua = getUA()) {
  return /iemobile/i.test(ua);
}
function _isAndroid(ua = getUA()) {
  return /android/i.test(ua);
}
function _isBlackBerry(ua = getUA()) {
  return /blackberry/i.test(ua);
}
function _isWebOS(ua = getUA()) {
  return /webos/i.test(ua);
}
function _getClientVersion(clientPlatform, frameworks = []) {
  let reportedPlatform;
  switch (clientPlatform) {
    case "Browser":
      reportedPlatform = _getBrowserName(getUA());
      break;
    case "Worker":
      reportedPlatform = `${_getBrowserName(getUA())}-${clientPlatform}`;
      break;
    default:
      reportedPlatform = clientPlatform;
  }
  const reportedFrameworks = frameworks.length ? frameworks.join(",") : "FirebaseCore-web";
  return `${reportedPlatform}/${"JsCore"}/${SDK_VERSION}/${reportedFrameworks}`;
}
var AuthMiddlewareQueue = class {
  constructor(auth) {
    this.auth = auth;
    this.queue = [];
  }
  pushCallback(callback, onAbort) {
    const wrappedCallback = (user) => new Promise((resolve, reject) => {
      try {
        const result = callback(user);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    wrappedCallback.onAbort = onAbort;
    this.queue.push(wrappedCallback);
    const index = this.queue.length - 1;
    return () => {
      this.queue[index] = () => Promise.resolve();
    };
  }
  async runMiddleware(nextUser) {
    if (this.auth.currentUser === nextUser) {
      return;
    }
    const onAbortStack = [];
    try {
      for (const beforeStateCallback of this.queue) {
        await beforeStateCallback(nextUser);
        if (beforeStateCallback.onAbort) {
          onAbortStack.push(beforeStateCallback.onAbort);
        }
      }
    } catch (e) {
      onAbortStack.reverse();
      for (const onAbort of onAbortStack) {
        try {
          onAbort();
        } catch (_) {
        }
      }
      throw this.auth._errorFactory.create("login-blocked", {
        originalMessage: e === null || e === void 0 ? void 0 : e.message
      });
    }
  }
};
async function _getPasswordPolicy(auth, request = {}) {
  return _performApiRequest(auth, "GET", "/v2/passwordPolicy", _addTidIfNecessary(auth, request));
}
var MINIMUM_MIN_PASSWORD_LENGTH = 6;
var PasswordPolicyImpl = class {
  constructor(response) {
    var _a, _b, _c, _d;
    const responseOptions = response.customStrengthOptions;
    this.customStrengthOptions = {};
    this.customStrengthOptions.minPasswordLength = (_a = responseOptions.minPasswordLength) !== null && _a !== void 0 ? _a : MINIMUM_MIN_PASSWORD_LENGTH;
    if (responseOptions.maxPasswordLength) {
      this.customStrengthOptions.maxPasswordLength = responseOptions.maxPasswordLength;
    }
    if (responseOptions.containsLowercaseCharacter !== void 0) {
      this.customStrengthOptions.containsLowercaseLetter = responseOptions.containsLowercaseCharacter;
    }
    if (responseOptions.containsUppercaseCharacter !== void 0) {
      this.customStrengthOptions.containsUppercaseLetter = responseOptions.containsUppercaseCharacter;
    }
    if (responseOptions.containsNumericCharacter !== void 0) {
      this.customStrengthOptions.containsNumericCharacter = responseOptions.containsNumericCharacter;
    }
    if (responseOptions.containsNonAlphanumericCharacter !== void 0) {
      this.customStrengthOptions.containsNonAlphanumericCharacter = responseOptions.containsNonAlphanumericCharacter;
    }
    this.enforcementState = response.enforcementState;
    if (this.enforcementState === "ENFORCEMENT_STATE_UNSPECIFIED") {
      this.enforcementState = "OFF";
    }
    this.allowedNonAlphanumericCharacters = (_c = (_b = response.allowedNonAlphanumericCharacters) === null || _b === void 0 ? void 0 : _b.join("")) !== null && _c !== void 0 ? _c : "";
    this.forceUpgradeOnSignin = (_d = response.forceUpgradeOnSignin) !== null && _d !== void 0 ? _d : false;
    this.schemaVersion = response.schemaVersion;
  }
  validatePassword(password) {
    var _a, _b, _c, _d, _e, _f;
    const status = {
      isValid: true,
      passwordPolicy: this
    };
    this.validatePasswordLengthOptions(password, status);
    this.validatePasswordCharacterOptions(password, status);
    status.isValid && (status.isValid = (_a = status.meetsMinPasswordLength) !== null && _a !== void 0 ? _a : true);
    status.isValid && (status.isValid = (_b = status.meetsMaxPasswordLength) !== null && _b !== void 0 ? _b : true);
    status.isValid && (status.isValid = (_c = status.containsLowercaseLetter) !== null && _c !== void 0 ? _c : true);
    status.isValid && (status.isValid = (_d = status.containsUppercaseLetter) !== null && _d !== void 0 ? _d : true);
    status.isValid && (status.isValid = (_e = status.containsNumericCharacter) !== null && _e !== void 0 ? _e : true);
    status.isValid && (status.isValid = (_f = status.containsNonAlphanumericCharacter) !== null && _f !== void 0 ? _f : true);
    return status;
  }
  /**
   * Validates that the password meets the length options for the policy.
   *
   * @param password Password to validate.
   * @param status Validation status.
   */
  validatePasswordLengthOptions(password, status) {
    const minPasswordLength = this.customStrengthOptions.minPasswordLength;
    const maxPasswordLength = this.customStrengthOptions.maxPasswordLength;
    if (minPasswordLength) {
      status.meetsMinPasswordLength = password.length >= minPasswordLength;
    }
    if (maxPasswordLength) {
      status.meetsMaxPasswordLength = password.length <= maxPasswordLength;
    }
  }
  /**
   * Validates that the password meets the character options for the policy.
   *
   * @param password Password to validate.
   * @param status Validation status.
   */
  validatePasswordCharacterOptions(password, status) {
    this.updatePasswordCharacterOptionsStatuses(
      status,
      /* containsLowercaseCharacter= */
      false,
      /* containsUppercaseCharacter= */
      false,
      /* containsNumericCharacter= */
      false,
      /* containsNonAlphanumericCharacter= */
      false
    );
    let passwordChar;
    for (let i = 0; i < password.length; i++) {
      passwordChar = password.charAt(i);
      this.updatePasswordCharacterOptionsStatuses(
        status,
        /* containsLowercaseCharacter= */
        passwordChar >= "a" && passwordChar <= "z",
        /* containsUppercaseCharacter= */
        passwordChar >= "A" && passwordChar <= "Z",
        /* containsNumericCharacter= */
        passwordChar >= "0" && passwordChar <= "9",
        /* containsNonAlphanumericCharacter= */
        this.allowedNonAlphanumericCharacters.includes(passwordChar)
      );
    }
  }
  /**
   * Updates the running validation status with the statuses for the character options.
   * Expected to be called each time a character is processed to update each option status
   * based on the current character.
   *
   * @param status Validation status.
   * @param containsLowercaseCharacter Whether the character is a lowercase letter.
   * @param containsUppercaseCharacter Whether the character is an uppercase letter.
   * @param containsNumericCharacter Whether the character is a numeric character.
   * @param containsNonAlphanumericCharacter Whether the character is a non-alphanumeric character.
   */
  updatePasswordCharacterOptionsStatuses(status, containsLowercaseCharacter, containsUppercaseCharacter, containsNumericCharacter, containsNonAlphanumericCharacter) {
    if (this.customStrengthOptions.containsLowercaseLetter) {
      status.containsLowercaseLetter || (status.containsLowercaseLetter = containsLowercaseCharacter);
    }
    if (this.customStrengthOptions.containsUppercaseLetter) {
      status.containsUppercaseLetter || (status.containsUppercaseLetter = containsUppercaseCharacter);
    }
    if (this.customStrengthOptions.containsNumericCharacter) {
      status.containsNumericCharacter || (status.containsNumericCharacter = containsNumericCharacter);
    }
    if (this.customStrengthOptions.containsNonAlphanumericCharacter) {
      status.containsNonAlphanumericCharacter || (status.containsNonAlphanumericCharacter = containsNonAlphanumericCharacter);
    }
  }
};
var AuthImpl = class {
  constructor(app, heartbeatServiceProvider, appCheckServiceProvider, config) {
    this.app = app;
    this.heartbeatServiceProvider = heartbeatServiceProvider;
    this.appCheckServiceProvider = appCheckServiceProvider;
    this.config = config;
    this.currentUser = null;
    this.emulatorConfig = null;
    this.operations = Promise.resolve();
    this.authStateSubscription = new Subscription(this);
    this.idTokenSubscription = new Subscription(this);
    this.beforeStateQueue = new AuthMiddlewareQueue(this);
    this.redirectUser = null;
    this.isProactiveRefreshEnabled = false;
    this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION = 1;
    this._canInitEmulator = true;
    this._isInitialized = false;
    this._deleted = false;
    this._initializationPromise = null;
    this._popupRedirectResolver = null;
    this._errorFactory = _DEFAULT_AUTH_ERROR_FACTORY;
    this._agentRecaptchaConfig = null;
    this._tenantRecaptchaConfigs = {};
    this._projectPasswordPolicy = null;
    this._tenantPasswordPolicies = {};
    this._resolvePersistenceManagerAvailable = void 0;
    this.lastNotifiedUid = void 0;
    this.languageCode = null;
    this.tenantId = null;
    this.settings = { appVerificationDisabledForTesting: false };
    this.frameworks = [];
    this.name = app.name;
    this.clientVersion = config.sdkClientVersion;
    this._persistenceManagerAvailable = new Promise((resolve) => this._resolvePersistenceManagerAvailable = resolve);
  }
  _initializeWithPersistence(persistenceHierarchy, popupRedirectResolver) {
    if (popupRedirectResolver) {
      this._popupRedirectResolver = _getInstance(popupRedirectResolver);
    }
    this._initializationPromise = this.queue(async () => {
      var _a, _b, _c;
      if (this._deleted) {
        return;
      }
      this.persistenceManager = await PersistenceUserManager.create(this, persistenceHierarchy);
      (_a = this._resolvePersistenceManagerAvailable) === null || _a === void 0 ? void 0 : _a.call(this);
      if (this._deleted) {
        return;
      }
      if ((_b = this._popupRedirectResolver) === null || _b === void 0 ? void 0 : _b._shouldInitProactively) {
        try {
          await this._popupRedirectResolver._initialize(this);
        } catch (e) {
        }
      }
      await this.initializeCurrentUser(popupRedirectResolver);
      this.lastNotifiedUid = ((_c = this.currentUser) === null || _c === void 0 ? void 0 : _c.uid) || null;
      if (this._deleted) {
        return;
      }
      this._isInitialized = true;
    });
    return this._initializationPromise;
  }
  /**
   * If the persistence is changed in another window, the user manager will let us know
   */
  async _onStorageEvent() {
    if (this._deleted) {
      return;
    }
    const user = await this.assertedPersistence.getCurrentUser();
    if (!this.currentUser && !user) {
      return;
    }
    if (this.currentUser && user && this.currentUser.uid === user.uid) {
      this._currentUser._assign(user);
      await this.currentUser.getIdToken();
      return;
    }
    await this._updateCurrentUser(
      user,
      /* skipBeforeStateCallbacks */
      true
    );
  }
  async initializeCurrentUserFromIdToken(idToken) {
    try {
      const response = await getAccountInfo(this, { idToken });
      const user = await UserImpl._fromGetAccountInfoResponse(this, response, idToken);
      await this.directlySetCurrentUser(user);
    } catch (err) {
      console.warn("FirebaseServerApp could not login user with provided authIdToken: ", err);
      await this.directlySetCurrentUser(null);
    }
  }
  async initializeCurrentUser(popupRedirectResolver) {
    var _a;
    if (_isFirebaseServerApp(this.app)) {
      const idToken = this.app.settings.authIdToken;
      if (idToken) {
        return new Promise((resolve) => {
          setTimeout(() => this.initializeCurrentUserFromIdToken(idToken).then(resolve, resolve));
        });
      } else {
        return this.directlySetCurrentUser(null);
      }
    }
    const previouslyStoredUser = await this.assertedPersistence.getCurrentUser();
    let futureCurrentUser = previouslyStoredUser;
    let needsTocheckMiddleware = false;
    if (popupRedirectResolver && this.config.authDomain) {
      await this.getOrInitRedirectPersistenceManager();
      const redirectUserEventId = (_a = this.redirectUser) === null || _a === void 0 ? void 0 : _a._redirectEventId;
      const storedUserEventId = futureCurrentUser === null || futureCurrentUser === void 0 ? void 0 : futureCurrentUser._redirectEventId;
      const result = await this.tryRedirectSignIn(popupRedirectResolver);
      if ((!redirectUserEventId || redirectUserEventId === storedUserEventId) && (result === null || result === void 0 ? void 0 : result.user)) {
        futureCurrentUser = result.user;
        needsTocheckMiddleware = true;
      }
    }
    if (!futureCurrentUser) {
      return this.directlySetCurrentUser(null);
    }
    if (!futureCurrentUser._redirectEventId) {
      if (needsTocheckMiddleware) {
        try {
          await this.beforeStateQueue.runMiddleware(futureCurrentUser);
        } catch (e) {
          futureCurrentUser = previouslyStoredUser;
          this._popupRedirectResolver._overrideRedirectResult(this, () => Promise.reject(e));
        }
      }
      if (futureCurrentUser) {
        return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
      } else {
        return this.directlySetCurrentUser(null);
      }
    }
    _assert(
      this._popupRedirectResolver,
      this,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    await this.getOrInitRedirectPersistenceManager();
    if (this.redirectUser && this.redirectUser._redirectEventId === futureCurrentUser._redirectEventId) {
      return this.directlySetCurrentUser(futureCurrentUser);
    }
    return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
  }
  async tryRedirectSignIn(redirectResolver) {
    let result = null;
    try {
      result = await this._popupRedirectResolver._completeRedirectFn(this, redirectResolver, true);
    } catch (e) {
      await this._setRedirectUser(null);
    }
    return result;
  }
  async reloadAndSetCurrentUserOrClear(user) {
    try {
      await _reloadWithoutSaving(user);
    } catch (e) {
      if ((e === null || e === void 0 ? void 0 : e.code) !== `auth/${"network-request-failed"}`) {
        return this.directlySetCurrentUser(null);
      }
    }
    return this.directlySetCurrentUser(user);
  }
  useDeviceLanguage() {
    this.languageCode = _getUserLanguage();
  }
  async _delete() {
    this._deleted = true;
  }
  async updateCurrentUser(userExtern) {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
    }
    const user = userExtern ? getModularInstance(userExtern) : null;
    if (user) {
      _assert(
        user.auth.config.apiKey === this.config.apiKey,
        this,
        "invalid-user-token"
        /* AuthErrorCode.INVALID_AUTH */
      );
    }
    return this._updateCurrentUser(user && user._clone(this));
  }
  async _updateCurrentUser(user, skipBeforeStateCallbacks = false) {
    if (this._deleted) {
      return;
    }
    if (user) {
      _assert(
        this.tenantId === user.tenantId,
        this,
        "tenant-id-mismatch"
        /* AuthErrorCode.TENANT_ID_MISMATCH */
      );
    }
    if (!skipBeforeStateCallbacks) {
      await this.beforeStateQueue.runMiddleware(user);
    }
    return this.queue(async () => {
      await this.directlySetCurrentUser(user);
      this.notifyAuthListeners();
    });
  }
  async signOut() {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
    }
    await this.beforeStateQueue.runMiddleware(null);
    if (this.redirectPersistenceManager || this._popupRedirectResolver) {
      await this._setRedirectUser(null);
    }
    return this._updateCurrentUser(
      null,
      /* skipBeforeStateCallbacks */
      true
    );
  }
  setPersistence(persistence) {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
    }
    return this.queue(async () => {
      await this.assertedPersistence.setPersistence(_getInstance(persistence));
    });
  }
  _getRecaptchaConfig() {
    if (this.tenantId == null) {
      return this._agentRecaptchaConfig;
    } else {
      return this._tenantRecaptchaConfigs[this.tenantId];
    }
  }
  async validatePassword(password) {
    if (!this._getPasswordPolicyInternal()) {
      await this._updatePasswordPolicy();
    }
    const passwordPolicy = this._getPasswordPolicyInternal();
    if (passwordPolicy.schemaVersion !== this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION) {
      return Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version", {}));
    }
    return passwordPolicy.validatePassword(password);
  }
  _getPasswordPolicyInternal() {
    if (this.tenantId === null) {
      return this._projectPasswordPolicy;
    } else {
      return this._tenantPasswordPolicies[this.tenantId];
    }
  }
  async _updatePasswordPolicy() {
    const response = await _getPasswordPolicy(this);
    const passwordPolicy = new PasswordPolicyImpl(response);
    if (this.tenantId === null) {
      this._projectPasswordPolicy = passwordPolicy;
    } else {
      this._tenantPasswordPolicies[this.tenantId] = passwordPolicy;
    }
  }
  _getPersistenceType() {
    return this.assertedPersistence.persistence.type;
  }
  _getPersistence() {
    return this.assertedPersistence.persistence;
  }
  _updateErrorMap(errorMap) {
    this._errorFactory = new ErrorFactory("auth", "Firebase", errorMap());
  }
  onAuthStateChanged(nextOrObserver, error, completed) {
    return this.registerStateListener(this.authStateSubscription, nextOrObserver, error, completed);
  }
  beforeAuthStateChanged(callback, onAbort) {
    return this.beforeStateQueue.pushCallback(callback, onAbort);
  }
  onIdTokenChanged(nextOrObserver, error, completed) {
    return this.registerStateListener(this.idTokenSubscription, nextOrObserver, error, completed);
  }
  authStateReady() {
    return new Promise((resolve, reject) => {
      if (this.currentUser) {
        resolve();
      } else {
        const unsubscribe = this.onAuthStateChanged(() => {
          unsubscribe();
          resolve();
        }, reject);
      }
    });
  }
  /**
   * Revokes the given access token. Currently only supports Apple OAuth access tokens.
   */
  async revokeAccessToken(token) {
    if (this.currentUser) {
      const idToken = await this.currentUser.getIdToken();
      const request = {
        providerId: "apple.com",
        tokenType: "ACCESS_TOKEN",
        token,
        idToken
      };
      if (this.tenantId != null) {
        request.tenantId = this.tenantId;
      }
      await revokeToken(this, request);
    }
  }
  toJSON() {
    var _a;
    return {
      apiKey: this.config.apiKey,
      authDomain: this.config.authDomain,
      appName: this.name,
      currentUser: (_a = this._currentUser) === null || _a === void 0 ? void 0 : _a.toJSON()
    };
  }
  async _setRedirectUser(user, popupRedirectResolver) {
    const redirectManager = await this.getOrInitRedirectPersistenceManager(popupRedirectResolver);
    return user === null ? redirectManager.removeCurrentUser() : redirectManager.setCurrentUser(user);
  }
  async getOrInitRedirectPersistenceManager(popupRedirectResolver) {
    if (!this.redirectPersistenceManager) {
      const resolver = popupRedirectResolver && _getInstance(popupRedirectResolver) || this._popupRedirectResolver;
      _assert(
        resolver,
        this,
        "argument-error"
        /* AuthErrorCode.ARGUMENT_ERROR */
      );
      this.redirectPersistenceManager = await PersistenceUserManager.create(
        this,
        [_getInstance(resolver._redirectPersistence)],
        "redirectUser"
        /* KeyName.REDIRECT_USER */
      );
      this.redirectUser = await this.redirectPersistenceManager.getCurrentUser();
    }
    return this.redirectPersistenceManager;
  }
  async _redirectUserForId(id) {
    var _a, _b;
    if (this._isInitialized) {
      await this.queue(async () => {
      });
    }
    if (((_a = this._currentUser) === null || _a === void 0 ? void 0 : _a._redirectEventId) === id) {
      return this._currentUser;
    }
    if (((_b = this.redirectUser) === null || _b === void 0 ? void 0 : _b._redirectEventId) === id) {
      return this.redirectUser;
    }
    return null;
  }
  async _persistUserIfCurrent(user) {
    if (user === this.currentUser) {
      return this.queue(async () => this.directlySetCurrentUser(user));
    }
  }
  /** Notifies listeners only if the user is current */
  _notifyListenersIfCurrent(user) {
    if (user === this.currentUser) {
      this.notifyAuthListeners();
    }
  }
  _key() {
    return `${this.config.authDomain}:${this.config.apiKey}:${this.name}`;
  }
  _startProactiveRefresh() {
    this.isProactiveRefreshEnabled = true;
    if (this.currentUser) {
      this._currentUser._startProactiveRefresh();
    }
  }
  _stopProactiveRefresh() {
    this.isProactiveRefreshEnabled = false;
    if (this.currentUser) {
      this._currentUser._stopProactiveRefresh();
    }
  }
  /** Returns the current user cast as the internal type */
  get _currentUser() {
    return this.currentUser;
  }
  notifyAuthListeners() {
    var _a, _b;
    if (!this._isInitialized) {
      return;
    }
    this.idTokenSubscription.next(this.currentUser);
    const currentUid = (_b = (_a = this.currentUser) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : null;
    if (this.lastNotifiedUid !== currentUid) {
      this.lastNotifiedUid = currentUid;
      this.authStateSubscription.next(this.currentUser);
    }
  }
  registerStateListener(subscription, nextOrObserver, error, completed) {
    if (this._deleted) {
      return () => {
      };
    }
    const cb = typeof nextOrObserver === "function" ? nextOrObserver : nextOrObserver.next.bind(nextOrObserver);
    let isUnsubscribed = false;
    const promise = this._isInitialized ? Promise.resolve() : this._initializationPromise;
    _assert(
      promise,
      this,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    promise.then(() => {
      if (isUnsubscribed) {
        return;
      }
      cb(this.currentUser);
    });
    if (typeof nextOrObserver === "function") {
      const unsubscribe = subscription.addObserver(nextOrObserver, error, completed);
      return () => {
        isUnsubscribed = true;
        unsubscribe();
      };
    } else {
      const unsubscribe = subscription.addObserver(nextOrObserver);
      return () => {
        isUnsubscribed = true;
        unsubscribe();
      };
    }
  }
  /**
   * Unprotected (from race conditions) method to set the current user. This
   * should only be called from within a queued callback. This is necessary
   * because the queue shouldn't rely on another queued callback.
   */
  async directlySetCurrentUser(user) {
    if (this.currentUser && this.currentUser !== user) {
      this._currentUser._stopProactiveRefresh();
    }
    if (user && this.isProactiveRefreshEnabled) {
      user._startProactiveRefresh();
    }
    this.currentUser = user;
    if (user) {
      await this.assertedPersistence.setCurrentUser(user);
    } else {
      await this.assertedPersistence.removeCurrentUser();
    }
  }
  queue(action) {
    this.operations = this.operations.then(action, action);
    return this.operations;
  }
  get assertedPersistence() {
    _assert(
      this.persistenceManager,
      this,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return this.persistenceManager;
  }
  _logFramework(framework) {
    if (!framework || this.frameworks.includes(framework)) {
      return;
    }
    this.frameworks.push(framework);
    this.frameworks.sort();
    this.clientVersion = _getClientVersion(this.config.clientPlatform, this._getFrameworks());
  }
  _getFrameworks() {
    return this.frameworks;
  }
  async _getAdditionalHeaders() {
    var _a;
    const headers = {
      [
        "X-Client-Version"
        /* HttpHeader.X_CLIENT_VERSION */
      ]: this.clientVersion
    };
    if (this.app.options.appId) {
      headers[
        "X-Firebase-gmpid"
        /* HttpHeader.X_FIREBASE_GMPID */
      ] = this.app.options.appId;
    }
    const heartbeatsHeader = await ((_a = this.heartbeatServiceProvider.getImmediate({
      optional: true
    })) === null || _a === void 0 ? void 0 : _a.getHeartbeatsHeader());
    if (heartbeatsHeader) {
      headers[
        "X-Firebase-Client"
        /* HttpHeader.X_FIREBASE_CLIENT */
      ] = heartbeatsHeader;
    }
    const appCheckToken = await this._getAppCheckToken();
    if (appCheckToken) {
      headers[
        "X-Firebase-AppCheck"
        /* HttpHeader.X_FIREBASE_APP_CHECK */
      ] = appCheckToken;
    }
    return headers;
  }
  async _getAppCheckToken() {
    var _a;
    if (_isFirebaseServerApp(this.app) && this.app.settings.appCheckToken) {
      return this.app.settings.appCheckToken;
    }
    const appCheckTokenResult = await ((_a = this.appCheckServiceProvider.getImmediate({ optional: true })) === null || _a === void 0 ? void 0 : _a.getToken());
    if (appCheckTokenResult === null || appCheckTokenResult === void 0 ? void 0 : appCheckTokenResult.error) {
      _logWarn(`Error while retrieving App Check token: ${appCheckTokenResult.error}`);
    }
    return appCheckTokenResult === null || appCheckTokenResult === void 0 ? void 0 : appCheckTokenResult.token;
  }
};
function _castAuth(auth) {
  return getModularInstance(auth);
}
var Subscription = class {
  constructor(auth) {
    this.auth = auth;
    this.observer = null;
    this.addObserver = createSubscribe((observer) => this.observer = observer);
  }
  get next() {
    _assert(
      this.observer,
      this.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return this.observer.next.bind(this.observer);
  }
};
var externalJSProvider = {
  async loadJS() {
    throw new Error("Unable to load external scripts");
  },
  recaptchaV2Script: "",
  recaptchaEnterpriseScript: "",
  gapiScript: ""
};
function _loadJS(url) {
  return externalJSProvider.loadJS(url);
}
function _recaptchaEnterpriseScriptUrl() {
  return externalJSProvider.recaptchaEnterpriseScript;
}
var MockGreCAPTCHATopLevel = class {
  constructor() {
    this.enterprise = new MockGreCAPTCHA();
  }
  ready(callback) {
    callback();
  }
  execute(_siteKey, _options) {
    return Promise.resolve("token");
  }
  render(_container, _parameters) {
    return "";
  }
};
var MockGreCAPTCHA = class {
  ready(callback) {
    callback();
  }
  execute(_siteKey, _options) {
    return Promise.resolve("token");
  }
  render(_container, _parameters) {
    return "";
  }
};
var RECAPTCHA_ENTERPRISE_VERIFIER_TYPE = "recaptcha-enterprise";
var FAKE_TOKEN = "NO_RECAPTCHA";
var RecaptchaEnterpriseVerifier = class {
  /**
   *
   * @param authExtern - The corresponding Firebase {@link Auth} instance.
   *
   */
  constructor(authExtern) {
    this.type = RECAPTCHA_ENTERPRISE_VERIFIER_TYPE;
    this.auth = _castAuth(authExtern);
  }
  /**
   * Executes the verification process.
   *
   * @returns A Promise for a token that can be used to assert the validity of a request.
   */
  async verify(action = "verify", forceRefresh = false) {
    async function retrieveSiteKey(auth) {
      if (!forceRefresh) {
        if (auth.tenantId == null && auth._agentRecaptchaConfig != null) {
          return auth._agentRecaptchaConfig.siteKey;
        }
        if (auth.tenantId != null && auth._tenantRecaptchaConfigs[auth.tenantId] !== void 0) {
          return auth._tenantRecaptchaConfigs[auth.tenantId].siteKey;
        }
      }
      return new Promise(async (resolve, reject) => {
        getRecaptchaConfig(auth, {
          clientType: "CLIENT_TYPE_WEB",
          version: "RECAPTCHA_ENTERPRISE"
          /* RecaptchaVersion.ENTERPRISE */
        }).then((response) => {
          if (response.recaptchaKey === void 0) {
            reject(new Error("recaptcha Enterprise site key undefined"));
          } else {
            const config = new RecaptchaConfig(response);
            if (auth.tenantId == null) {
              auth._agentRecaptchaConfig = config;
            } else {
              auth._tenantRecaptchaConfigs[auth.tenantId] = config;
            }
            return resolve(config.siteKey);
          }
        }).catch((error) => {
          reject(error);
        });
      });
    }
    function retrieveRecaptchaToken(siteKey, resolve, reject) {
      const grecaptcha = window.grecaptcha;
      if (isEnterprise(grecaptcha)) {
        grecaptcha.enterprise.ready(() => {
          grecaptcha.enterprise.execute(siteKey, { action }).then((token) => {
            resolve(token);
          }).catch(() => {
            resolve(FAKE_TOKEN);
          });
        });
      } else {
        reject(Error("No reCAPTCHA enterprise script loaded."));
      }
    }
    if (this.auth.settings.appVerificationDisabledForTesting) {
      const mockRecaptcha = new MockGreCAPTCHATopLevel();
      return mockRecaptcha.execute("siteKey", { action: "verify" });
    }
    return new Promise((resolve, reject) => {
      retrieveSiteKey(this.auth).then((siteKey) => {
        if (!forceRefresh && isEnterprise(window.grecaptcha)) {
          retrieveRecaptchaToken(siteKey, resolve, reject);
        } else {
          if (typeof window === "undefined") {
            reject(new Error("RecaptchaVerifier is only supported in browser"));
            return;
          }
          let url = _recaptchaEnterpriseScriptUrl();
          if (url.length !== 0) {
            url += siteKey;
          }
          _loadJS(url).then(() => {
            retrieveRecaptchaToken(siteKey, resolve, reject);
          }).catch((error) => {
            reject(error);
          });
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
async function injectRecaptchaFields(auth, request, action, isCaptchaResp = false, isFakeToken = false) {
  const verifier = new RecaptchaEnterpriseVerifier(auth);
  let captchaResponse;
  if (isFakeToken) {
    captchaResponse = FAKE_TOKEN;
  } else {
    try {
      captchaResponse = await verifier.verify(action);
    } catch (error) {
      captchaResponse = await verifier.verify(action, true);
    }
  }
  const newRequest = Object.assign({}, request);
  if (action === "mfaSmsEnrollment" || action === "mfaSmsSignIn") {
    if ("phoneEnrollmentInfo" in newRequest) {
      const phoneNumber = newRequest.phoneEnrollmentInfo.phoneNumber;
      const recaptchaToken = newRequest.phoneEnrollmentInfo.recaptchaToken;
      Object.assign(newRequest, {
        "phoneEnrollmentInfo": {
          phoneNumber,
          recaptchaToken,
          captchaResponse,
          "clientType": "CLIENT_TYPE_WEB",
          "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
          /* RecaptchaVersion.ENTERPRISE */
        }
      });
    } else if ("phoneSignInInfo" in newRequest) {
      const recaptchaToken = newRequest.phoneSignInInfo.recaptchaToken;
      Object.assign(newRequest, {
        "phoneSignInInfo": {
          recaptchaToken,
          captchaResponse,
          "clientType": "CLIENT_TYPE_WEB",
          "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
          /* RecaptchaVersion.ENTERPRISE */
        }
      });
    }
    return newRequest;
  }
  if (!isCaptchaResp) {
    Object.assign(newRequest, { captchaResponse });
  } else {
    Object.assign(newRequest, { "captchaResp": captchaResponse });
  }
  Object.assign(newRequest, {
    "clientType": "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  });
  Object.assign(newRequest, {
    "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
    /* RecaptchaVersion.ENTERPRISE */
  });
  return newRequest;
}
async function handleRecaptchaFlow(authInstance, request, actionName, actionMethod, recaptchaAuthProvider) {
  var _a, _b;
  if (recaptchaAuthProvider === "EMAIL_PASSWORD_PROVIDER") {
    if ((_a = authInstance._getRecaptchaConfig()) === null || _a === void 0 ? void 0 : _a.isProviderEnabled(
      "EMAIL_PASSWORD_PROVIDER"
      /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
    )) {
      const requestWithRecaptcha = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
        actionName === "getOobCode"
        /* RecaptchaActionName.GET_OOB_CODE */
      );
      return actionMethod(authInstance, requestWithRecaptcha);
    } else {
      return actionMethod(authInstance, request).catch(async (error) => {
        if (error.code === `auth/${"missing-recaptcha-token"}`) {
          console.log(`${actionName} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);
          const requestWithRecaptcha = await injectRecaptchaFields(
            authInstance,
            request,
            actionName,
            actionName === "getOobCode"
            /* RecaptchaActionName.GET_OOB_CODE */
          );
          return actionMethod(authInstance, requestWithRecaptcha);
        } else {
          return Promise.reject(error);
        }
      });
    }
  } else if (recaptchaAuthProvider === "PHONE_PROVIDER") {
    if ((_b = authInstance._getRecaptchaConfig()) === null || _b === void 0 ? void 0 : _b.isProviderEnabled(
      "PHONE_PROVIDER"
      /* RecaptchaAuthProvider.PHONE_PROVIDER */
    )) {
      const requestWithRecaptcha = await injectRecaptchaFields(authInstance, request, actionName);
      return actionMethod(authInstance, requestWithRecaptcha).catch(async (error) => {
        var _a2;
        if (((_a2 = authInstance._getRecaptchaConfig()) === null || _a2 === void 0 ? void 0 : _a2.getProviderEnforcementState(
          "PHONE_PROVIDER"
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        )) === "AUDIT") {
          if (error.code === `auth/${"missing-recaptcha-token"}` || error.code === `auth/${"invalid-app-credential"}`) {
            console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${actionName} flow.`);
            const requestWithRecaptchaFields = await injectRecaptchaFields(
              authInstance,
              request,
              actionName,
              false,
              // isCaptchaResp
              true
              // isFakeToken
            );
            return actionMethod(authInstance, requestWithRecaptchaFields);
          }
        }
        return Promise.reject(error);
      });
    } else {
      const requestWithRecaptchaFields = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
        false,
        // isCaptchaResp
        true
        // isFakeToken
      );
      return actionMethod(authInstance, requestWithRecaptchaFields);
    }
  } else {
    return Promise.reject(recaptchaAuthProvider + " provider is not supported.");
  }
}
async function _initializeRecaptchaConfig(auth) {
  const authInternal = _castAuth(auth);
  const response = await getRecaptchaConfig(authInternal, {
    clientType: "CLIENT_TYPE_WEB",
    version: "RECAPTCHA_ENTERPRISE"
    /* RecaptchaVersion.ENTERPRISE */
  });
  const config = new RecaptchaConfig(response);
  if (authInternal.tenantId == null) {
    authInternal._agentRecaptchaConfig = config;
  } else {
    authInternal._tenantRecaptchaConfigs[authInternal.tenantId] = config;
  }
  if (config.isAnyProviderEnabled()) {
    const verifier = new RecaptchaEnterpriseVerifier(authInternal);
    void verifier.verify();
  }
}
function initializeAuth(app, deps) {
  const provider = _getProvider(app, "auth");
  if (provider.isInitialized()) {
    const auth2 = provider.getImmediate();
    const initialOptions = provider.getOptions();
    if (deepEqual(initialOptions, deps !== null && deps !== void 0 ? deps : {})) {
      return auth2;
    } else {
      _fail(
        auth2,
        "already-initialized"
        /* AuthErrorCode.ALREADY_INITIALIZED */
      );
    }
  }
  const auth = provider.initialize({ options: deps });
  return auth;
}
function _initializeAuthInstance(auth, deps) {
  const persistence = (deps === null || deps === void 0 ? void 0 : deps.persistence) || [];
  const hierarchy = (Array.isArray(persistence) ? persistence : [persistence]).map(_getInstance);
  if (deps === null || deps === void 0 ? void 0 : deps.errorMap) {
    auth._updateErrorMap(deps.errorMap);
  }
  auth._initializeWithPersistence(hierarchy, deps === null || deps === void 0 ? void 0 : deps.popupRedirectResolver);
}
function connectAuthEmulator(auth, url, options) {
  const authInternal = _castAuth(auth);
  _assert(
    /^https?:\/\//.test(url),
    authInternal,
    "invalid-emulator-scheme"
    /* AuthErrorCode.INVALID_EMULATOR_SCHEME */
  );
  const disableWarnings = !!(options === null || options === void 0 ? void 0 : options.disableWarnings);
  const protocol = extractProtocol(url);
  const { host, port } = extractHostAndPort(url);
  const portStr = port === null ? "" : `:${port}`;
  const emulator = { url: `${protocol}//${host}${portStr}/` };
  const emulatorConfig = Object.freeze({
    host,
    port,
    protocol: protocol.replace(":", ""),
    options: Object.freeze({ disableWarnings })
  });
  if (!authInternal._canInitEmulator) {
    _assert(
      authInternal.config.emulator && authInternal.emulatorConfig,
      authInternal,
      "emulator-config-failed"
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    );
    _assert(
      deepEqual(emulator, authInternal.config.emulator) && deepEqual(emulatorConfig, authInternal.emulatorConfig),
      authInternal,
      "emulator-config-failed"
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    );
    return;
  }
  authInternal.config.emulator = emulator;
  authInternal.emulatorConfig = emulatorConfig;
  authInternal.settings.appVerificationDisabledForTesting = true;
  if (isCloudWorkstation(host)) {
    void pingServer(`${protocol}//${host}${portStr}`);
    updateEmulatorBanner("Auth", true);
  } else if (!disableWarnings) {
    emitEmulatorWarning();
  }
}
function extractProtocol(url) {
  const protocolEnd = url.indexOf(":");
  return protocolEnd < 0 ? "" : url.substr(0, protocolEnd + 1);
}
function extractHostAndPort(url) {
  const protocol = extractProtocol(url);
  const authority = /(\/\/)?([^?#/]+)/.exec(url.substr(protocol.length));
  if (!authority) {
    return { host: "", port: null };
  }
  const hostAndPort = authority[2].split("@").pop() || "";
  const bracketedIPv6 = /^(\[[^\]]+\])(:|$)/.exec(hostAndPort);
  if (bracketedIPv6) {
    const host = bracketedIPv6[1];
    return { host, port: parsePort(hostAndPort.substr(host.length + 1)) };
  } else {
    const [host, port] = hostAndPort.split(":");
    return { host, port: parsePort(port) };
  }
}
function parsePort(portStr) {
  if (!portStr) {
    return null;
  }
  const port = Number(portStr);
  if (isNaN(port)) {
    return null;
  }
  return port;
}
function emitEmulatorWarning() {
  function attachBanner() {
    const el = document.createElement("p");
    const sty = el.style;
    el.innerText = "Running in emulator mode. Do not use with production credentials.";
    sty.position = "fixed";
    sty.width = "100%";
    sty.backgroundColor = "#ffffff";
    sty.border = ".1em solid #000000";
    sty.color = "#b50000";
    sty.bottom = "0px";
    sty.left = "0px";
    sty.margin = "0px";
    sty.zIndex = "10000";
    sty.textAlign = "center";
    el.classList.add("firebase-emulator-warning");
    document.body.appendChild(el);
  }
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.");
  }
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", attachBanner);
    } else {
      attachBanner();
    }
  }
}
var AuthCredential = class {
  /** @internal */
  constructor(providerId, signInMethod) {
    this.providerId = providerId;
    this.signInMethod = signInMethod;
  }
  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns a JSON-serializable representation of this object.
   */
  toJSON() {
    return debugFail("not implemented");
  }
  /** @internal */
  _getIdTokenResponse(_auth) {
    return debugFail("not implemented");
  }
  /** @internal */
  _linkToIdToken(_auth, _idToken) {
    return debugFail("not implemented");
  }
  /** @internal */
  _getReauthenticationResolver(_auth) {
    return debugFail("not implemented");
  }
};
async function resetPassword(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:resetPassword", _addTidIfNecessary(auth, request));
}
async function updateEmailPassword(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:update", request);
}
async function linkEmailPassword(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:signUp", request);
}
async function applyActionCode$1(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:update", _addTidIfNecessary(auth, request));
}
async function signInWithPassword(auth, request) {
  return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithPassword", _addTidIfNecessary(auth, request));
}
async function sendOobCode(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:sendOobCode", _addTidIfNecessary(auth, request));
}
async function sendEmailVerification$1(auth, request) {
  return sendOobCode(auth, request);
}
async function sendPasswordResetEmail$1(auth, request) {
  return sendOobCode(auth, request);
}
async function sendSignInLinkToEmail$1(auth, request) {
  return sendOobCode(auth, request);
}
async function verifyAndChangeEmail(auth, request) {
  return sendOobCode(auth, request);
}
async function signInWithEmailLink$1(auth, request) {
  return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithEmailLink", _addTidIfNecessary(auth, request));
}
async function signInWithEmailLinkForLinking(auth, request) {
  return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithEmailLink", _addTidIfNecessary(auth, request));
}
var EmailAuthCredential = class _EmailAuthCredential extends AuthCredential {
  /** @internal */
  constructor(_email, _password, signInMethod, _tenantId = null) {
    super("password", signInMethod);
    this._email = _email;
    this._password = _password;
    this._tenantId = _tenantId;
  }
  /** @internal */
  static _fromEmailAndPassword(email, password) {
    return new _EmailAuthCredential(
      email,
      password,
      "password"
      /* SignInMethod.EMAIL_PASSWORD */
    );
  }
  /** @internal */
  static _fromEmailAndCode(email, oobCode, tenantId = null) {
    return new _EmailAuthCredential(email, oobCode, "emailLink", tenantId);
  }
  /** {@inheritdoc AuthCredential.toJSON} */
  toJSON() {
    return {
      email: this._email,
      password: this._password,
      signInMethod: this.signInMethod,
      tenantId: this._tenantId
    };
  }
  /**
   * Static method to deserialize a JSON representation of an object into an {@link  AuthCredential}.
   *
   * @param json - Either `object` or the stringified representation of the object. When string is
   * provided, `JSON.parse` would be called first.
   *
   * @returns If the JSON input does not represent an {@link AuthCredential}, null is returned.
   */
  static fromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    if ((obj === null || obj === void 0 ? void 0 : obj.email) && (obj === null || obj === void 0 ? void 0 : obj.password)) {
      if (obj.signInMethod === "password") {
        return this._fromEmailAndPassword(obj.email, obj.password);
      } else if (obj.signInMethod === "emailLink") {
        return this._fromEmailAndCode(obj.email, obj.password, obj.tenantId);
      }
    }
    return null;
  }
  /** @internal */
  async _getIdTokenResponse(auth) {
    switch (this.signInMethod) {
      case "password":
        const request = {
          returnSecureToken: true,
          email: this._email,
          password: this._password,
          clientType: "CLIENT_TYPE_WEB"
          /* RecaptchaClientType.WEB */
        };
        return handleRecaptchaFlow(
          auth,
          request,
          "signInWithPassword",
          signInWithPassword,
          "EMAIL_PASSWORD_PROVIDER"
          /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
        );
      case "emailLink":
        return signInWithEmailLink$1(auth, {
          email: this._email,
          oobCode: this._password
        });
      default:
        _fail(
          auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
    }
  }
  /** @internal */
  async _linkToIdToken(auth, idToken) {
    switch (this.signInMethod) {
      case "password":
        const request = {
          idToken,
          returnSecureToken: true,
          email: this._email,
          password: this._password,
          clientType: "CLIENT_TYPE_WEB"
          /* RecaptchaClientType.WEB */
        };
        return handleRecaptchaFlow(
          auth,
          request,
          "signUpPassword",
          linkEmailPassword,
          "EMAIL_PASSWORD_PROVIDER"
          /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
        );
      case "emailLink":
        return signInWithEmailLinkForLinking(auth, {
          idToken,
          email: this._email,
          oobCode: this._password
        });
      default:
        _fail(
          auth,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
    }
  }
  /** @internal */
  _getReauthenticationResolver(auth) {
    return this._getIdTokenResponse(auth);
  }
};
async function signInWithIdp(auth, request) {
  return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithIdp", _addTidIfNecessary(auth, request));
}
var IDP_REQUEST_URI$1 = "http://localhost";
var OAuthCredential = class _OAuthCredential extends AuthCredential {
  constructor() {
    super(...arguments);
    this.pendingToken = null;
  }
  /** @internal */
  static _fromParams(params) {
    const cred = new _OAuthCredential(params.providerId, params.signInMethod);
    if (params.idToken || params.accessToken) {
      if (params.idToken) {
        cred.idToken = params.idToken;
      }
      if (params.accessToken) {
        cred.accessToken = params.accessToken;
      }
      if (params.nonce && !params.pendingToken) {
        cred.nonce = params.nonce;
      }
      if (params.pendingToken) {
        cred.pendingToken = params.pendingToken;
      }
    } else if (params.oauthToken && params.oauthTokenSecret) {
      cred.accessToken = params.oauthToken;
      cred.secret = params.oauthTokenSecret;
    } else {
      _fail(
        "argument-error"
        /* AuthErrorCode.ARGUMENT_ERROR */
      );
    }
    return cred;
  }
  /** {@inheritdoc AuthCredential.toJSON}  */
  toJSON() {
    return {
      idToken: this.idToken,
      accessToken: this.accessToken,
      secret: this.secret,
      nonce: this.nonce,
      pendingToken: this.pendingToken,
      providerId: this.providerId,
      signInMethod: this.signInMethod
    };
  }
  /**
   * Static method to deserialize a JSON representation of an object into an
   * {@link  AuthCredential}.
   *
   * @param json - Input can be either Object or the stringified representation of the object.
   * When string is provided, JSON.parse would be called first.
   *
   * @returns If the JSON input does not represent an {@link  AuthCredential}, null is returned.
   */
  static fromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    const { providerId, signInMethod } = obj, rest = __rest(obj, ["providerId", "signInMethod"]);
    if (!providerId || !signInMethod) {
      return null;
    }
    const cred = new _OAuthCredential(providerId, signInMethod);
    cred.idToken = rest.idToken || void 0;
    cred.accessToken = rest.accessToken || void 0;
    cred.secret = rest.secret;
    cred.nonce = rest.nonce;
    cred.pendingToken = rest.pendingToken || null;
    return cred;
  }
  /** @internal */
  _getIdTokenResponse(auth) {
    const request = this.buildRequest();
    return signInWithIdp(auth, request);
  }
  /** @internal */
  _linkToIdToken(auth, idToken) {
    const request = this.buildRequest();
    request.idToken = idToken;
    return signInWithIdp(auth, request);
  }
  /** @internal */
  _getReauthenticationResolver(auth) {
    const request = this.buildRequest();
    request.autoCreate = false;
    return signInWithIdp(auth, request);
  }
  buildRequest() {
    const request = {
      requestUri: IDP_REQUEST_URI$1,
      returnSecureToken: true
    };
    if (this.pendingToken) {
      request.pendingToken = this.pendingToken;
    } else {
      const postBody = {};
      if (this.idToken) {
        postBody["id_token"] = this.idToken;
      }
      if (this.accessToken) {
        postBody["access_token"] = this.accessToken;
      }
      if (this.secret) {
        postBody["oauth_token_secret"] = this.secret;
      }
      postBody["providerId"] = this.providerId;
      if (this.nonce && !this.pendingToken) {
        postBody["nonce"] = this.nonce;
      }
      request.postBody = querystring(postBody);
    }
    return request;
  }
};
async function signInWithPhoneNumber$1(auth, request) {
  return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth, request));
}
async function linkWithPhoneNumber$1(auth, request) {
  const response = await _performSignInRequest(auth, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth, request));
  if (response.temporaryProof) {
    throw _makeTaggedError(auth, "account-exists-with-different-credential", response);
  }
  return response;
}
var VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_ = {
  [
    "USER_NOT_FOUND"
    /* ServerError.USER_NOT_FOUND */
  ]: "user-not-found"
  /* AuthErrorCode.USER_DELETED */
};
async function verifyPhoneNumberForExisting(auth, request) {
  const apiRequest = Object.assign(Object.assign({}, request), { operation: "REAUTH" });
  return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth, apiRequest), VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_);
}
var PhoneAuthCredential = class _PhoneAuthCredential extends AuthCredential {
  constructor(params) {
    super(
      "phone",
      "phone"
      /* SignInMethod.PHONE */
    );
    this.params = params;
  }
  /** @internal */
  static _fromVerification(verificationId, verificationCode) {
    return new _PhoneAuthCredential({ verificationId, verificationCode });
  }
  /** @internal */
  static _fromTokenResponse(phoneNumber, temporaryProof) {
    return new _PhoneAuthCredential({ phoneNumber, temporaryProof });
  }
  /** @internal */
  _getIdTokenResponse(auth) {
    return signInWithPhoneNumber$1(auth, this._makeVerificationRequest());
  }
  /** @internal */
  _linkToIdToken(auth, idToken) {
    return linkWithPhoneNumber$1(auth, Object.assign({ idToken }, this._makeVerificationRequest()));
  }
  /** @internal */
  _getReauthenticationResolver(auth) {
    return verifyPhoneNumberForExisting(auth, this._makeVerificationRequest());
  }
  /** @internal */
  _makeVerificationRequest() {
    const { temporaryProof, phoneNumber, verificationId, verificationCode } = this.params;
    if (temporaryProof && phoneNumber) {
      return { temporaryProof, phoneNumber };
    }
    return {
      sessionInfo: verificationId,
      code: verificationCode
    };
  }
  /** {@inheritdoc AuthCredential.toJSON} */
  toJSON() {
    const obj = {
      providerId: this.providerId
    };
    if (this.params.phoneNumber) {
      obj.phoneNumber = this.params.phoneNumber;
    }
    if (this.params.temporaryProof) {
      obj.temporaryProof = this.params.temporaryProof;
    }
    if (this.params.verificationCode) {
      obj.verificationCode = this.params.verificationCode;
    }
    if (this.params.verificationId) {
      obj.verificationId = this.params.verificationId;
    }
    return obj;
  }
  /** Generates a phone credential based on a plain object or a JSON string. */
  static fromJSON(json) {
    if (typeof json === "string") {
      json = JSON.parse(json);
    }
    const { verificationId, verificationCode, phoneNumber, temporaryProof } = json;
    if (!verificationCode && !verificationId && !phoneNumber && !temporaryProof) {
      return null;
    }
    return new _PhoneAuthCredential({
      verificationId,
      verificationCode,
      phoneNumber,
      temporaryProof
    });
  }
};
function parseMode(mode) {
  switch (mode) {
    case "recoverEmail":
      return "RECOVER_EMAIL";
    case "resetPassword":
      return "PASSWORD_RESET";
    case "signIn":
      return "EMAIL_SIGNIN";
    case "verifyEmail":
      return "VERIFY_EMAIL";
    case "verifyAndChangeEmail":
      return "VERIFY_AND_CHANGE_EMAIL";
    case "revertSecondFactorAddition":
      return "REVERT_SECOND_FACTOR_ADDITION";
    default:
      return null;
  }
}
function parseDeepLink(url) {
  const link = querystringDecode(extractQuerystring(url))["link"];
  const doubleDeepLink = link ? querystringDecode(extractQuerystring(link))["deep_link_id"] : null;
  const iOSDeepLink = querystringDecode(extractQuerystring(url))["deep_link_id"];
  const iOSDoubleDeepLink = iOSDeepLink ? querystringDecode(extractQuerystring(iOSDeepLink))["link"] : null;
  return iOSDoubleDeepLink || iOSDeepLink || doubleDeepLink || link || url;
}
var ActionCodeURL = class _ActionCodeURL {
  /**
   * @param actionLink - The link from which to extract the URL.
   * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
   *
   * @internal
   */
  constructor(actionLink) {
    var _a, _b, _c, _d, _e, _f;
    const searchParams = querystringDecode(extractQuerystring(actionLink));
    const apiKey = (_a = searchParams[
      "apiKey"
      /* QueryField.API_KEY */
    ]) !== null && _a !== void 0 ? _a : null;
    const code = (_b = searchParams[
      "oobCode"
      /* QueryField.CODE */
    ]) !== null && _b !== void 0 ? _b : null;
    const operation = parseMode((_c = searchParams[
      "mode"
      /* QueryField.MODE */
    ]) !== null && _c !== void 0 ? _c : null);
    _assert(
      apiKey && code && operation,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    this.apiKey = apiKey;
    this.operation = operation;
    this.code = code;
    this.continueUrl = (_d = searchParams[
      "continueUrl"
      /* QueryField.CONTINUE_URL */
    ]) !== null && _d !== void 0 ? _d : null;
    this.languageCode = (_e = searchParams[
      "lang"
      /* QueryField.LANGUAGE_CODE */
    ]) !== null && _e !== void 0 ? _e : null;
    this.tenantId = (_f = searchParams[
      "tenantId"
      /* QueryField.TENANT_ID */
    ]) !== null && _f !== void 0 ? _f : null;
  }
  /**
   * Parses the email action link string and returns an {@link ActionCodeURL} if the link is valid,
   * otherwise returns null.
   *
   * @param link  - The email action link string.
   * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
   *
   * @public
   */
  static parseLink(link) {
    const actionLink = parseDeepLink(link);
    try {
      return new _ActionCodeURL(actionLink);
    } catch (_a) {
      return null;
    }
  }
};
function parseActionCodeURL(link) {
  return ActionCodeURL.parseLink(link);
}
var EmailAuthProvider = class _EmailAuthProvider {
  constructor() {
    this.providerId = _EmailAuthProvider.PROVIDER_ID;
  }
  /**
   * Initialize an {@link AuthCredential} using an email and password.
   *
   * @example
   * ```javascript
   * const authCredential = EmailAuthProvider.credential(email, password);
   * const userCredential = await signInWithCredential(auth, authCredential);
   * ```
   *
   * @example
   * ```javascript
   * const userCredential = await signInWithEmailAndPassword(auth, email, password);
   * ```
   *
   * @param email - Email address.
   * @param password - User account password.
   * @returns The auth provider credential.
   */
  static credential(email, password) {
    return EmailAuthCredential._fromEmailAndPassword(email, password);
  }
  /**
   * Initialize an {@link AuthCredential} using an email and an email link after a sign in with
   * email link operation.
   *
   * @example
   * ```javascript
   * const authCredential = EmailAuthProvider.credentialWithLink(auth, email, emailLink);
   * const userCredential = await signInWithCredential(auth, authCredential);
   * ```
   *
   * @example
   * ```javascript
   * await sendSignInLinkToEmail(auth, email);
   * // Obtain emailLink from user.
   * const userCredential = await signInWithEmailLink(auth, email, emailLink);
   * ```
   *
   * @param auth - The {@link Auth} instance used to verify the link.
   * @param email - Email address.
   * @param emailLink - Sign-in email link.
   * @returns - The auth provider credential.
   */
  static credentialWithLink(email, emailLink) {
    const actionCodeUrl = ActionCodeURL.parseLink(emailLink);
    _assert(
      actionCodeUrl,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return EmailAuthCredential._fromEmailAndCode(email, actionCodeUrl.code, actionCodeUrl.tenantId);
  }
};
EmailAuthProvider.PROVIDER_ID = "password";
EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD = "password";
EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD = "emailLink";
var FederatedAuthProvider = class {
  /**
   * Constructor for generic OAuth providers.
   *
   * @param providerId - Provider for which credentials should be generated.
   */
  constructor(providerId) {
    this.providerId = providerId;
    this.defaultLanguageCode = null;
    this.customParameters = {};
  }
  /**
   * Set the language gode.
   *
   * @param languageCode - language code
   */
  setDefaultLanguage(languageCode) {
    this.defaultLanguageCode = languageCode;
  }
  /**
   * Sets the OAuth custom parameters to pass in an OAuth request for popup and redirect sign-in
   * operations.
   *
   * @remarks
   * For a detailed list, check the reserved required OAuth 2.0 parameters such as `client_id`,
   * `redirect_uri`, `scope`, `response_type`, and `state` are not allowed and will be ignored.
   *
   * @param customOAuthParameters - The custom OAuth parameters to pass in the OAuth request.
   */
  setCustomParameters(customOAuthParameters) {
    this.customParameters = customOAuthParameters;
    return this;
  }
  /**
   * Retrieve the current list of {@link CustomParameters}.
   */
  getCustomParameters() {
    return this.customParameters;
  }
};
var BaseOAuthProvider = class extends FederatedAuthProvider {
  constructor() {
    super(...arguments);
    this.scopes = [];
  }
  /**
   * Add an OAuth scope to the credential.
   *
   * @param scope - Provider OAuth scope to add.
   */
  addScope(scope) {
    if (!this.scopes.includes(scope)) {
      this.scopes.push(scope);
    }
    return this;
  }
  /**
   * Retrieve the current list of OAuth scopes.
   */
  getScopes() {
    return [...this.scopes];
  }
};
var OAuthProvider = class _OAuthProvider extends BaseOAuthProvider {
  /**
   * Creates an {@link OAuthCredential} from a JSON string or a plain object.
   * @param json - A plain object or a JSON string
   */
  static credentialFromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    _assert(
      "providerId" in obj && "signInMethod" in obj,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return OAuthCredential._fromParams(obj);
  }
  /**
   * Creates a {@link OAuthCredential} from a generic OAuth provider's access token or ID token.
   *
   * @remarks
   * The raw nonce is required when an ID token with a nonce field is provided. The SHA-256 hash of
   * the raw nonce must match the nonce field in the ID token.
   *
   * @example
   * ```javascript
   * // `googleUser` from the onsuccess Google Sign In callback.
   * // Initialize a generate OAuth provider with a `google.com` providerId.
   * const provider = new OAuthProvider('google.com');
   * const credential = provider.credential({
   *   idToken: googleUser.getAuthResponse().id_token,
   * });
   * const result = await signInWithCredential(credential);
   * ```
   *
   * @param params - Either the options object containing the ID token, access token and raw nonce
   * or the ID token string.
   */
  credential(params) {
    return this._credential(Object.assign(Object.assign({}, params), { nonce: params.rawNonce }));
  }
  /** An internal credential method that accepts more permissive options */
  _credential(params) {
    _assert(
      params.idToken || params.accessToken,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return OAuthCredential._fromParams(Object.assign(Object.assign({}, params), { providerId: this.providerId, signInMethod: this.providerId }));
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _OAuthProvider.oauthCredentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _OAuthProvider.oauthCredentialFromTaggedObject(error.customData || {});
  }
  static oauthCredentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { oauthIdToken, oauthAccessToken, oauthTokenSecret, pendingToken, nonce, providerId } = tokenResponse;
    if (!oauthAccessToken && !oauthTokenSecret && !oauthIdToken && !pendingToken) {
      return null;
    }
    if (!providerId) {
      return null;
    }
    try {
      return new _OAuthProvider(providerId)._credential({
        idToken: oauthIdToken,
        accessToken: oauthAccessToken,
        nonce,
        pendingToken
      });
    } catch (e) {
      return null;
    }
  }
};
var FacebookAuthProvider = class _FacebookAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(
      "facebook.com"
      /* ProviderId.FACEBOOK */
    );
  }
  /**
   * Creates a credential for Facebook.
   *
   * @example
   * ```javascript
   * // `event` from the Facebook auth.authResponseChange callback.
   * const credential = FacebookAuthProvider.credential(event.authResponse.accessToken);
   * const result = await signInWithCredential(credential);
   * ```
   *
   * @param accessToken - Facebook access token.
   */
  static credential(accessToken) {
    return OAuthCredential._fromParams({
      providerId: _FacebookAuthProvider.PROVIDER_ID,
      signInMethod: _FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD,
      accessToken
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _FacebookAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _FacebookAuthProvider.credentialFromTaggedObject(error.customData || {});
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
      return null;
    }
    if (!tokenResponse.oauthAccessToken) {
      return null;
    }
    try {
      return _FacebookAuthProvider.credential(tokenResponse.oauthAccessToken);
    } catch (_a) {
      return null;
    }
  }
};
FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD = "facebook.com";
FacebookAuthProvider.PROVIDER_ID = "facebook.com";
var GoogleAuthProvider = class _GoogleAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(
      "google.com"
      /* ProviderId.GOOGLE */
    );
    this.addScope("profile");
  }
  /**
   * Creates a credential for Google. At least one of ID token and access token is required.
   *
   * @example
   * ```javascript
   * // \`googleUser\` from the onsuccess Google Sign In callback.
   * const credential = GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
   * const result = await signInWithCredential(credential);
   * ```
   *
   * @param idToken - Google ID token.
   * @param accessToken - Google access token.
   */
  static credential(idToken, accessToken) {
    return OAuthCredential._fromParams({
      providerId: _GoogleAuthProvider.PROVIDER_ID,
      signInMethod: _GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD,
      idToken,
      accessToken
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _GoogleAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _GoogleAuthProvider.credentialFromTaggedObject(error.customData || {});
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { oauthIdToken, oauthAccessToken } = tokenResponse;
    if (!oauthIdToken && !oauthAccessToken) {
      return null;
    }
    try {
      return _GoogleAuthProvider.credential(oauthIdToken, oauthAccessToken);
    } catch (_a) {
      return null;
    }
  }
};
GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD = "google.com";
GoogleAuthProvider.PROVIDER_ID = "google.com";
var GithubAuthProvider = class _GithubAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(
      "github.com"
      /* ProviderId.GITHUB */
    );
  }
  /**
   * Creates a credential for GitHub.
   *
   * @param accessToken - GitHub access token.
   */
  static credential(accessToken) {
    return OAuthCredential._fromParams({
      providerId: _GithubAuthProvider.PROVIDER_ID,
      signInMethod: _GithubAuthProvider.GITHUB_SIGN_IN_METHOD,
      accessToken
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _GithubAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _GithubAuthProvider.credentialFromTaggedObject(error.customData || {});
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
      return null;
    }
    if (!tokenResponse.oauthAccessToken) {
      return null;
    }
    try {
      return _GithubAuthProvider.credential(tokenResponse.oauthAccessToken);
    } catch (_a) {
      return null;
    }
  }
};
GithubAuthProvider.GITHUB_SIGN_IN_METHOD = "github.com";
GithubAuthProvider.PROVIDER_ID = "github.com";
var IDP_REQUEST_URI = "http://localhost";
var SAMLAuthCredential = class _SAMLAuthCredential extends AuthCredential {
  /** @internal */
  constructor(providerId, pendingToken) {
    super(providerId, providerId);
    this.pendingToken = pendingToken;
  }
  /** @internal */
  _getIdTokenResponse(auth) {
    const request = this.buildRequest();
    return signInWithIdp(auth, request);
  }
  /** @internal */
  _linkToIdToken(auth, idToken) {
    const request = this.buildRequest();
    request.idToken = idToken;
    return signInWithIdp(auth, request);
  }
  /** @internal */
  _getReauthenticationResolver(auth) {
    const request = this.buildRequest();
    request.autoCreate = false;
    return signInWithIdp(auth, request);
  }
  /** {@inheritdoc AuthCredential.toJSON}  */
  toJSON() {
    return {
      signInMethod: this.signInMethod,
      providerId: this.providerId,
      pendingToken: this.pendingToken
    };
  }
  /**
   * Static method to deserialize a JSON representation of an object into an
   * {@link  AuthCredential}.
   *
   * @param json - Input can be either Object or the stringified representation of the object.
   * When string is provided, JSON.parse would be called first.
   *
   * @returns If the JSON input does not represent an {@link  AuthCredential}, null is returned.
   */
  static fromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    const { providerId, signInMethod, pendingToken } = obj;
    if (!providerId || !signInMethod || !pendingToken || providerId !== signInMethod) {
      return null;
    }
    return new _SAMLAuthCredential(providerId, pendingToken);
  }
  /**
   * Helper static method to avoid exposing the constructor to end users.
   *
   * @internal
   */
  static _create(providerId, pendingToken) {
    return new _SAMLAuthCredential(providerId, pendingToken);
  }
  buildRequest() {
    return {
      requestUri: IDP_REQUEST_URI,
      returnSecureToken: true,
      pendingToken: this.pendingToken
    };
  }
};
var SAML_PROVIDER_PREFIX = "saml.";
var SAMLAuthProvider = class _SAMLAuthProvider extends FederatedAuthProvider {
  /**
   * Constructor. The providerId must start with "saml."
   * @param providerId - SAML provider ID.
   */
  constructor(providerId) {
    _assert(
      providerId.startsWith(SAML_PROVIDER_PREFIX),
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    super(providerId);
  }
  /**
   * Generates an {@link AuthCredential} from a {@link UserCredential} after a
   * successful SAML flow completes.
   *
   * @remarks
   *
   * For example, to get an {@link AuthCredential}, you could write the
   * following code:
   *
   * ```js
   * const userCredential = await signInWithPopup(auth, samlProvider);
   * const credential = SAMLAuthProvider.credentialFromResult(userCredential);
   * ```
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _SAMLAuthProvider.samlCredentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _SAMLAuthProvider.samlCredentialFromTaggedObject(error.customData || {});
  }
  /**
   * Creates an {@link AuthCredential} from a JSON string or a plain object.
   * @param json - A plain object or a JSON string
   */
  static credentialFromJSON(json) {
    const credential = SAMLAuthCredential.fromJSON(json);
    _assert(
      credential,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return credential;
  }
  static samlCredentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { pendingToken, providerId } = tokenResponse;
    if (!pendingToken || !providerId) {
      return null;
    }
    try {
      return SAMLAuthCredential._create(providerId, pendingToken);
    } catch (e) {
      return null;
    }
  }
};
var TwitterAuthProvider = class _TwitterAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(
      "twitter.com"
      /* ProviderId.TWITTER */
    );
  }
  /**
   * Creates a credential for Twitter.
   *
   * @param token - Twitter access token.
   * @param secret - Twitter secret.
   */
  static credential(token, secret) {
    return OAuthCredential._fromParams({
      providerId: _TwitterAuthProvider.PROVIDER_ID,
      signInMethod: _TwitterAuthProvider.TWITTER_SIGN_IN_METHOD,
      oauthToken: token,
      oauthTokenSecret: secret
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _TwitterAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _TwitterAuthProvider.credentialFromTaggedObject(error.customData || {});
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { oauthAccessToken, oauthTokenSecret } = tokenResponse;
    if (!oauthAccessToken || !oauthTokenSecret) {
      return null;
    }
    try {
      return _TwitterAuthProvider.credential(oauthAccessToken, oauthTokenSecret);
    } catch (_a) {
      return null;
    }
  }
};
TwitterAuthProvider.TWITTER_SIGN_IN_METHOD = "twitter.com";
TwitterAuthProvider.PROVIDER_ID = "twitter.com";
async function signUp(auth, request) {
  return _performSignInRequest(auth, "POST", "/v1/accounts:signUp", _addTidIfNecessary(auth, request));
}
var UserCredentialImpl = class _UserCredentialImpl {
  constructor(params) {
    this.user = params.user;
    this.providerId = params.providerId;
    this._tokenResponse = params._tokenResponse;
    this.operationType = params.operationType;
  }
  static async _fromIdTokenResponse(auth, operationType, idTokenResponse, isAnonymous = false) {
    const user = await UserImpl._fromIdTokenResponse(auth, idTokenResponse, isAnonymous);
    const providerId = providerIdForResponse(idTokenResponse);
    const userCred = new _UserCredentialImpl({
      user,
      providerId,
      _tokenResponse: idTokenResponse,
      operationType
    });
    return userCred;
  }
  static async _forOperation(user, operationType, response) {
    await user._updateTokensIfNecessary(
      response,
      /* reload */
      true
    );
    const providerId = providerIdForResponse(response);
    return new _UserCredentialImpl({
      user,
      providerId,
      _tokenResponse: response,
      operationType
    });
  }
};
function providerIdForResponse(response) {
  if (response.providerId) {
    return response.providerId;
  }
  if ("phoneNumber" in response) {
    return "phone";
  }
  return null;
}
async function signInAnonymously(auth) {
  var _a;
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
  }
  const authInternal = _castAuth(auth);
  await authInternal._initializationPromise;
  if ((_a = authInternal.currentUser) === null || _a === void 0 ? void 0 : _a.isAnonymous) {
    return new UserCredentialImpl({
      user: authInternal.currentUser,
      providerId: null,
      operationType: "signIn"
      /* OperationType.SIGN_IN */
    });
  }
  const response = await signUp(authInternal, {
    returnSecureToken: true
  });
  const userCredential = await UserCredentialImpl._fromIdTokenResponse(authInternal, "signIn", response, true);
  await authInternal._updateCurrentUser(userCredential.user);
  return userCredential;
}
var MultiFactorError = class _MultiFactorError extends FirebaseError {
  constructor(auth, error, operationType, user) {
    var _a;
    super(error.code, error.message);
    this.operationType = operationType;
    this.user = user;
    Object.setPrototypeOf(this, _MultiFactorError.prototype);
    this.customData = {
      appName: auth.name,
      tenantId: (_a = auth.tenantId) !== null && _a !== void 0 ? _a : void 0,
      _serverResponse: error.customData._serverResponse,
      operationType
    };
  }
  static _fromErrorAndOperation(auth, error, operationType, user) {
    return new _MultiFactorError(auth, error, operationType, user);
  }
};
function _processCredentialSavingMfaContextIfNecessary(auth, operationType, credential, user) {
  const idTokenProvider = operationType === "reauthenticate" ? credential._getReauthenticationResolver(auth) : credential._getIdTokenResponse(auth);
  return idTokenProvider.catch((error) => {
    if (error.code === `auth/${"multi-factor-auth-required"}`) {
      throw MultiFactorError._fromErrorAndOperation(auth, error, operationType, user);
    }
    throw error;
  });
}
function providerDataAsNames(providerData) {
  return new Set(providerData.map(({ providerId }) => providerId).filter((pid) => !!pid));
}
async function unlink(user, providerId) {
  const userInternal = getModularInstance(user);
  await _assertLinkedStatus(true, userInternal, providerId);
  const { providerUserInfo } = await deleteLinkedAccounts(userInternal.auth, {
    idToken: await userInternal.getIdToken(),
    deleteProvider: [providerId]
  });
  const providersLeft = providerDataAsNames(providerUserInfo || []);
  userInternal.providerData = userInternal.providerData.filter((pd) => providersLeft.has(pd.providerId));
  if (!providersLeft.has(
    "phone"
    /* ProviderId.PHONE */
  )) {
    userInternal.phoneNumber = null;
  }
  await userInternal.auth._persistUserIfCurrent(userInternal);
  return userInternal;
}
async function _link(user, credential, bypassAuthState = false) {
  const response = await _logoutIfInvalidated(user, credential._linkToIdToken(user.auth, await user.getIdToken()), bypassAuthState);
  return UserCredentialImpl._forOperation(user, "link", response);
}
async function _assertLinkedStatus(expected, user, provider) {
  await _reloadWithoutSaving(user);
  const providerIds = providerDataAsNames(user.providerData);
  const code = expected === false ? "provider-already-linked" : "no-such-provider";
  _assert(providerIds.has(provider) === expected, user.auth, code);
}
async function _reauthenticate(user, credential, bypassAuthState = false) {
  const { auth } = user;
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
  }
  const operationType = "reauthenticate";
  try {
    const response = await _logoutIfInvalidated(user, _processCredentialSavingMfaContextIfNecessary(auth, operationType, credential, user), bypassAuthState);
    _assert(
      response.idToken,
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const parsed = _parseToken(response.idToken);
    _assert(
      parsed,
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const { sub: localId } = parsed;
    _assert(
      user.uid === localId,
      auth,
      "user-mismatch"
      /* AuthErrorCode.USER_MISMATCH */
    );
    return UserCredentialImpl._forOperation(user, operationType, response);
  } catch (e) {
    if ((e === null || e === void 0 ? void 0 : e.code) === `auth/${"user-not-found"}`) {
      _fail(
        auth,
        "user-mismatch"
        /* AuthErrorCode.USER_MISMATCH */
      );
    }
    throw e;
  }
}
async function _signInWithCredential(auth, credential, bypassAuthState = false) {
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
  }
  const operationType = "signIn";
  const response = await _processCredentialSavingMfaContextIfNecessary(auth, operationType, credential);
  const userCredential = await UserCredentialImpl._fromIdTokenResponse(auth, operationType, response);
  if (!bypassAuthState) {
    await auth._updateCurrentUser(userCredential.user);
  }
  return userCredential;
}
async function signInWithCredential(auth, credential) {
  return _signInWithCredential(_castAuth(auth), credential);
}
async function linkWithCredential(user, credential) {
  const userInternal = getModularInstance(user);
  await _assertLinkedStatus(false, userInternal, credential.providerId);
  return _link(userInternal, credential);
}
async function reauthenticateWithCredential(user, credential) {
  return _reauthenticate(getModularInstance(user), credential);
}
async function signInWithCustomToken$1(auth, request) {
  return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithCustomToken", _addTidIfNecessary(auth, request));
}
async function signInWithCustomToken(auth, customToken) {
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
  }
  const authInternal = _castAuth(auth);
  const response = await signInWithCustomToken$1(authInternal, {
    token: customToken,
    returnSecureToken: true
  });
  const cred = await UserCredentialImpl._fromIdTokenResponse(authInternal, "signIn", response);
  await authInternal._updateCurrentUser(cred.user);
  return cred;
}
var MultiFactorInfoImpl = class {
  constructor(factorId, response) {
    this.factorId = factorId;
    this.uid = response.mfaEnrollmentId;
    this.enrollmentTime = new Date(response.enrolledAt).toUTCString();
    this.displayName = response.displayName;
  }
  static _fromServerResponse(auth, enrollment) {
    if ("phoneInfo" in enrollment) {
      return PhoneMultiFactorInfoImpl._fromServerResponse(auth, enrollment);
    } else if ("totpInfo" in enrollment) {
      return TotpMultiFactorInfoImpl._fromServerResponse(auth, enrollment);
    }
    return _fail(
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
  }
};
var PhoneMultiFactorInfoImpl = class _PhoneMultiFactorInfoImpl extends MultiFactorInfoImpl {
  constructor(response) {
    super("phone", response);
    this.phoneNumber = response.phoneInfo;
  }
  static _fromServerResponse(_auth, enrollment) {
    return new _PhoneMultiFactorInfoImpl(enrollment);
  }
};
var TotpMultiFactorInfoImpl = class _TotpMultiFactorInfoImpl extends MultiFactorInfoImpl {
  constructor(response) {
    super("totp", response);
  }
  static _fromServerResponse(_auth, enrollment) {
    return new _TotpMultiFactorInfoImpl(enrollment);
  }
};
function _setActionCodeSettingsOnRequest(auth, request, actionCodeSettings) {
  var _a;
  _assert(
    ((_a = actionCodeSettings.url) === null || _a === void 0 ? void 0 : _a.length) > 0,
    auth,
    "invalid-continue-uri"
    /* AuthErrorCode.INVALID_CONTINUE_URI */
  );
  _assert(
    typeof actionCodeSettings.dynamicLinkDomain === "undefined" || actionCodeSettings.dynamicLinkDomain.length > 0,
    auth,
    "invalid-dynamic-link-domain"
    /* AuthErrorCode.INVALID_DYNAMIC_LINK_DOMAIN */
  );
  _assert(
    typeof actionCodeSettings.linkDomain === "undefined" || actionCodeSettings.linkDomain.length > 0,
    auth,
    "invalid-hosting-link-domain"
    /* AuthErrorCode.INVALID_HOSTING_LINK_DOMAIN */
  );
  request.continueUrl = actionCodeSettings.url;
  request.dynamicLinkDomain = actionCodeSettings.dynamicLinkDomain;
  request.linkDomain = actionCodeSettings.linkDomain;
  request.canHandleCodeInApp = actionCodeSettings.handleCodeInApp;
  if (actionCodeSettings.iOS) {
    _assert(
      actionCodeSettings.iOS.bundleId.length > 0,
      auth,
      "missing-ios-bundle-id"
      /* AuthErrorCode.MISSING_IOS_BUNDLE_ID */
    );
    request.iOSBundleId = actionCodeSettings.iOS.bundleId;
  }
  if (actionCodeSettings.android) {
    _assert(
      actionCodeSettings.android.packageName.length > 0,
      auth,
      "missing-android-pkg-name"
      /* AuthErrorCode.MISSING_ANDROID_PACKAGE_NAME */
    );
    request.androidInstallApp = actionCodeSettings.android.installApp;
    request.androidMinimumVersionCode = actionCodeSettings.android.minimumVersion;
    request.androidPackageName = actionCodeSettings.android.packageName;
  }
}
async function recachePasswordPolicy(auth) {
  const authInternal = _castAuth(auth);
  if (authInternal._getPasswordPolicyInternal()) {
    await authInternal._updatePasswordPolicy();
  }
}
async function sendPasswordResetEmail(auth, email, actionCodeSettings) {
  const authInternal = _castAuth(auth);
  const request = {
    requestType: "PASSWORD_RESET",
    email,
    clientType: "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  };
  if (actionCodeSettings) {
    _setActionCodeSettingsOnRequest(authInternal, request, actionCodeSettings);
  }
  await handleRecaptchaFlow(
    authInternal,
    request,
    "getOobCode",
    sendPasswordResetEmail$1,
    "EMAIL_PASSWORD_PROVIDER"
    /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
  );
}
async function confirmPasswordReset(auth, oobCode, newPassword) {
  await resetPassword(getModularInstance(auth), {
    oobCode,
    newPassword
  }).catch(async (error) => {
    if (error.code === `auth/${"password-does-not-meet-requirements"}`) {
      void recachePasswordPolicy(auth);
    }
    throw error;
  });
}
async function applyActionCode(auth, oobCode) {
  await applyActionCode$1(getModularInstance(auth), { oobCode });
}
async function checkActionCode(auth, oobCode) {
  const authModular = getModularInstance(auth);
  const response = await resetPassword(authModular, { oobCode });
  const operation = response.requestType;
  _assert(
    operation,
    authModular,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  switch (operation) {
    case "EMAIL_SIGNIN":
      break;
    case "VERIFY_AND_CHANGE_EMAIL":
      _assert(
        response.newEmail,
        authModular,
        "internal-error"
        /* AuthErrorCode.INTERNAL_ERROR */
      );
      break;
    case "REVERT_SECOND_FACTOR_ADDITION":
      _assert(
        response.mfaInfo,
        authModular,
        "internal-error"
        /* AuthErrorCode.INTERNAL_ERROR */
      );
    // fall through
    default:
      _assert(
        response.email,
        authModular,
        "internal-error"
        /* AuthErrorCode.INTERNAL_ERROR */
      );
  }
  let multiFactorInfo = null;
  if (response.mfaInfo) {
    multiFactorInfo = MultiFactorInfoImpl._fromServerResponse(_castAuth(authModular), response.mfaInfo);
  }
  return {
    data: {
      email: (response.requestType === "VERIFY_AND_CHANGE_EMAIL" ? response.newEmail : response.email) || null,
      previousEmail: (response.requestType === "VERIFY_AND_CHANGE_EMAIL" ? response.email : response.newEmail) || null,
      multiFactorInfo
    },
    operation
  };
}
async function verifyPasswordResetCode(auth, code) {
  const { data } = await checkActionCode(getModularInstance(auth), code);
  return data.email;
}
async function createUserWithEmailAndPassword(auth, email, password) {
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
  }
  const authInternal = _castAuth(auth);
  const request = {
    returnSecureToken: true,
    email,
    password,
    clientType: "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  };
  const signUpResponse = handleRecaptchaFlow(
    authInternal,
    request,
    "signUpPassword",
    signUp,
    "EMAIL_PASSWORD_PROVIDER"
    /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
  );
  const response = await signUpResponse.catch((error) => {
    if (error.code === `auth/${"password-does-not-meet-requirements"}`) {
      void recachePasswordPolicy(auth);
    }
    throw error;
  });
  const userCredential = await UserCredentialImpl._fromIdTokenResponse(authInternal, "signIn", response);
  await authInternal._updateCurrentUser(userCredential.user);
  return userCredential;
}
function signInWithEmailAndPassword(auth, email, password) {
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
  }
  return signInWithCredential(getModularInstance(auth), EmailAuthProvider.credential(email, password)).catch(async (error) => {
    if (error.code === `auth/${"password-does-not-meet-requirements"}`) {
      void recachePasswordPolicy(auth);
    }
    throw error;
  });
}
async function sendSignInLinkToEmail(auth, email, actionCodeSettings) {
  const authInternal = _castAuth(auth);
  const request = {
    requestType: "EMAIL_SIGNIN",
    email,
    clientType: "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  };
  function setActionCodeSettings(request2, actionCodeSettings2) {
    _assert(
      actionCodeSettings2.handleCodeInApp,
      authInternal,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    if (actionCodeSettings2) {
      _setActionCodeSettingsOnRequest(authInternal, request2, actionCodeSettings2);
    }
  }
  setActionCodeSettings(request, actionCodeSettings);
  await handleRecaptchaFlow(
    authInternal,
    request,
    "getOobCode",
    sendSignInLinkToEmail$1,
    "EMAIL_PASSWORD_PROVIDER"
    /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
  );
}
function isSignInWithEmailLink(auth, emailLink) {
  const actionCodeUrl = ActionCodeURL.parseLink(emailLink);
  return (actionCodeUrl === null || actionCodeUrl === void 0 ? void 0 : actionCodeUrl.operation) === "EMAIL_SIGNIN";
}
async function signInWithEmailLink(auth, email, emailLink) {
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
  }
  const authModular = getModularInstance(auth);
  const credential = EmailAuthProvider.credentialWithLink(email, emailLink || _getCurrentUrl());
  _assert(
    credential._tenantId === (authModular.tenantId || null),
    authModular,
    "tenant-id-mismatch"
    /* AuthErrorCode.TENANT_ID_MISMATCH */
  );
  return signInWithCredential(authModular, credential);
}
async function createAuthUri(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:createAuthUri", _addTidIfNecessary(auth, request));
}
async function fetchSignInMethodsForEmail(auth, email) {
  const continueUri = _isHttpOrHttps() ? _getCurrentUrl() : "http://localhost";
  const request = {
    identifier: email,
    continueUri
  };
  const { signinMethods } = await createAuthUri(getModularInstance(auth), request);
  return signinMethods || [];
}
async function sendEmailVerification(user, actionCodeSettings) {
  const userInternal = getModularInstance(user);
  const idToken = await user.getIdToken();
  const request = {
    requestType: "VERIFY_EMAIL",
    idToken
  };
  if (actionCodeSettings) {
    _setActionCodeSettingsOnRequest(userInternal.auth, request, actionCodeSettings);
  }
  const { email } = await sendEmailVerification$1(userInternal.auth, request);
  if (email !== user.email) {
    await user.reload();
  }
}
async function verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings) {
  const userInternal = getModularInstance(user);
  const idToken = await user.getIdToken();
  const request = {
    requestType: "VERIFY_AND_CHANGE_EMAIL",
    idToken,
    newEmail
  };
  if (actionCodeSettings) {
    _setActionCodeSettingsOnRequest(userInternal.auth, request, actionCodeSettings);
  }
  const { email } = await verifyAndChangeEmail(userInternal.auth, request);
  if (email !== user.email) {
    await user.reload();
  }
}
async function updateProfile$1(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:update", request);
}
async function updateProfile(user, { displayName, photoURL: photoUrl }) {
  if (displayName === void 0 && photoUrl === void 0) {
    return;
  }
  const userInternal = getModularInstance(user);
  const idToken = await userInternal.getIdToken();
  const profileRequest = {
    idToken,
    displayName,
    photoUrl,
    returnSecureToken: true
  };
  const response = await _logoutIfInvalidated(userInternal, updateProfile$1(userInternal.auth, profileRequest));
  userInternal.displayName = response.displayName || null;
  userInternal.photoURL = response.photoUrl || null;
  const passwordProvider = userInternal.providerData.find(
    ({ providerId }) => providerId === "password"
    /* ProviderId.PASSWORD */
  );
  if (passwordProvider) {
    passwordProvider.displayName = userInternal.displayName;
    passwordProvider.photoURL = userInternal.photoURL;
  }
  await userInternal._updateTokensIfNecessary(response);
}
function updateEmail(user, newEmail) {
  const userInternal = getModularInstance(user);
  if (_isFirebaseServerApp(userInternal.auth.app)) {
    return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(userInternal.auth));
  }
  return updateEmailOrPassword(userInternal, newEmail, null);
}
function updatePassword(user, newPassword) {
  return updateEmailOrPassword(getModularInstance(user), null, newPassword);
}
async function updateEmailOrPassword(user, email, password) {
  const { auth } = user;
  const idToken = await user.getIdToken();
  const request = {
    idToken,
    returnSecureToken: true
  };
  if (email) {
    request.email = email;
  }
  if (password) {
    request.password = password;
  }
  const response = await _logoutIfInvalidated(user, updateEmailPassword(auth, request));
  await user._updateTokensIfNecessary(
    response,
    /* reload */
    true
  );
}
function _fromIdTokenResponse(idTokenResponse) {
  var _a, _b;
  if (!idTokenResponse) {
    return null;
  }
  const { providerId } = idTokenResponse;
  const profile = idTokenResponse.rawUserInfo ? JSON.parse(idTokenResponse.rawUserInfo) : {};
  const isNewUser = idTokenResponse.isNewUser || idTokenResponse.kind === "identitytoolkit#SignupNewUserResponse";
  if (!providerId && (idTokenResponse === null || idTokenResponse === void 0 ? void 0 : idTokenResponse.idToken)) {
    const signInProvider = (_b = (_a = _parseToken(idTokenResponse.idToken)) === null || _a === void 0 ? void 0 : _a.firebase) === null || _b === void 0 ? void 0 : _b["sign_in_provider"];
    if (signInProvider) {
      const filteredProviderId = signInProvider !== "anonymous" && signInProvider !== "custom" ? signInProvider : null;
      return new GenericAdditionalUserInfo(isNewUser, filteredProviderId);
    }
  }
  if (!providerId) {
    return null;
  }
  switch (providerId) {
    case "facebook.com":
      return new FacebookAdditionalUserInfo(isNewUser, profile);
    case "github.com":
      return new GithubAdditionalUserInfo(isNewUser, profile);
    case "google.com":
      return new GoogleAdditionalUserInfo(isNewUser, profile);
    case "twitter.com":
      return new TwitterAdditionalUserInfo(isNewUser, profile, idTokenResponse.screenName || null);
    case "custom":
    case "anonymous":
      return new GenericAdditionalUserInfo(isNewUser, null);
    default:
      return new GenericAdditionalUserInfo(isNewUser, providerId, profile);
  }
}
var GenericAdditionalUserInfo = class {
  constructor(isNewUser, providerId, profile = {}) {
    this.isNewUser = isNewUser;
    this.providerId = providerId;
    this.profile = profile;
  }
};
var FederatedAdditionalUserInfoWithUsername = class extends GenericAdditionalUserInfo {
  constructor(isNewUser, providerId, profile, username) {
    super(isNewUser, providerId, profile);
    this.username = username;
  }
};
var FacebookAdditionalUserInfo = class extends GenericAdditionalUserInfo {
  constructor(isNewUser, profile) {
    super(isNewUser, "facebook.com", profile);
  }
};
var GithubAdditionalUserInfo = class extends FederatedAdditionalUserInfoWithUsername {
  constructor(isNewUser, profile) {
    super(isNewUser, "github.com", profile, typeof (profile === null || profile === void 0 ? void 0 : profile.login) === "string" ? profile === null || profile === void 0 ? void 0 : profile.login : null);
  }
};
var GoogleAdditionalUserInfo = class extends GenericAdditionalUserInfo {
  constructor(isNewUser, profile) {
    super(isNewUser, "google.com", profile);
  }
};
var TwitterAdditionalUserInfo = class extends FederatedAdditionalUserInfoWithUsername {
  constructor(isNewUser, profile, screenName) {
    super(isNewUser, "twitter.com", profile, screenName);
  }
};
function getAdditionalUserInfo(userCredential) {
  const { user, _tokenResponse } = userCredential;
  if (user.isAnonymous && !_tokenResponse) {
    return {
      providerId: null,
      isNewUser: false,
      profile: null
    };
  }
  return _fromIdTokenResponse(_tokenResponse);
}
function setPersistence(auth, persistence) {
  return getModularInstance(auth).setPersistence(persistence);
}
function initializeRecaptchaConfig(auth) {
  return _initializeRecaptchaConfig(auth);
}
async function validatePassword(auth, password) {
  const authInternal = _castAuth(auth);
  return authInternal.validatePassword(password);
}
function onIdTokenChanged(auth, nextOrObserver, error, completed) {
  return getModularInstance(auth).onIdTokenChanged(nextOrObserver, error, completed);
}
function beforeAuthStateChanged(auth, callback, onAbort) {
  return getModularInstance(auth).beforeAuthStateChanged(callback, onAbort);
}
function onAuthStateChanged(auth, nextOrObserver, error, completed) {
  return getModularInstance(auth).onAuthStateChanged(nextOrObserver, error, completed);
}
function useDeviceLanguage(auth) {
  getModularInstance(auth).useDeviceLanguage();
}
function updateCurrentUser(auth, user) {
  return getModularInstance(auth).updateCurrentUser(user);
}
function signOut(auth) {
  return getModularInstance(auth).signOut();
}
function revokeAccessToken(auth, token) {
  const authInternal = _castAuth(auth);
  return authInternal.revokeAccessToken(token);
}
async function deleteUser(user) {
  return getModularInstance(user).delete();
}
var MultiFactorSessionImpl = class _MultiFactorSessionImpl {
  constructor(type, credential, user) {
    this.type = type;
    this.credential = credential;
    this.user = user;
  }
  static _fromIdtoken(idToken, user) {
    return new _MultiFactorSessionImpl("enroll", idToken, user);
  }
  static _fromMfaPendingCredential(mfaPendingCredential) {
    return new _MultiFactorSessionImpl("signin", mfaPendingCredential);
  }
  toJSON() {
    const key = this.type === "enroll" ? "idToken" : "pendingCredential";
    return {
      multiFactorSession: {
        [key]: this.credential
      }
    };
  }
  static fromJSON(obj) {
    var _a, _b;
    if (obj === null || obj === void 0 ? void 0 : obj.multiFactorSession) {
      if ((_a = obj.multiFactorSession) === null || _a === void 0 ? void 0 : _a.pendingCredential) {
        return _MultiFactorSessionImpl._fromMfaPendingCredential(obj.multiFactorSession.pendingCredential);
      } else if ((_b = obj.multiFactorSession) === null || _b === void 0 ? void 0 : _b.idToken) {
        return _MultiFactorSessionImpl._fromIdtoken(obj.multiFactorSession.idToken);
      }
    }
    return null;
  }
};
var MultiFactorResolverImpl = class _MultiFactorResolverImpl {
  constructor(session, hints, signInResolver) {
    this.session = session;
    this.hints = hints;
    this.signInResolver = signInResolver;
  }
  /** @internal */
  static _fromError(authExtern, error) {
    const auth = _castAuth(authExtern);
    const serverResponse = error.customData._serverResponse;
    const hints = (serverResponse.mfaInfo || []).map((enrollment) => MultiFactorInfoImpl._fromServerResponse(auth, enrollment));
    _assert(
      serverResponse.mfaPendingCredential,
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const session = MultiFactorSessionImpl._fromMfaPendingCredential(serverResponse.mfaPendingCredential);
    return new _MultiFactorResolverImpl(session, hints, async (assertion) => {
      const mfaResponse = await assertion._process(auth, session);
      delete serverResponse.mfaInfo;
      delete serverResponse.mfaPendingCredential;
      const idTokenResponse = Object.assign(Object.assign({}, serverResponse), { idToken: mfaResponse.idToken, refreshToken: mfaResponse.refreshToken });
      switch (error.operationType) {
        case "signIn":
          const userCredential = await UserCredentialImpl._fromIdTokenResponse(auth, error.operationType, idTokenResponse);
          await auth._updateCurrentUser(userCredential.user);
          return userCredential;
        case "reauthenticate":
          _assert(
            error.user,
            auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          return UserCredentialImpl._forOperation(error.user, error.operationType, idTokenResponse);
        default:
          _fail(
            auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
      }
    });
  }
  async resolveSignIn(assertionExtern) {
    const assertion = assertionExtern;
    return this.signInResolver(assertion);
  }
};
function getMultiFactorResolver(auth, error) {
  var _a;
  const authModular = getModularInstance(auth);
  const errorInternal = error;
  _assert(
    error.customData.operationType,
    authModular,
    "argument-error"
    /* AuthErrorCode.ARGUMENT_ERROR */
  );
  _assert(
    (_a = errorInternal.customData._serverResponse) === null || _a === void 0 ? void 0 : _a.mfaPendingCredential,
    authModular,
    "argument-error"
    /* AuthErrorCode.ARGUMENT_ERROR */
  );
  return MultiFactorResolverImpl._fromError(authModular, errorInternal);
}
function startEnrollTotpMfa(auth, request) {
  return _performApiRequest(auth, "POST", "/v2/accounts/mfaEnrollment:start", _addTidIfNecessary(auth, request));
}
function finalizeEnrollTotpMfa(auth, request) {
  return _performApiRequest(auth, "POST", "/v2/accounts/mfaEnrollment:finalize", _addTidIfNecessary(auth, request));
}
function withdrawMfa(auth, request) {
  return _performApiRequest(auth, "POST", "/v2/accounts/mfaEnrollment:withdraw", _addTidIfNecessary(auth, request));
}
var MultiFactorUserImpl = class _MultiFactorUserImpl {
  constructor(user) {
    this.user = user;
    this.enrolledFactors = [];
    user._onReload((userInfo) => {
      if (userInfo.mfaInfo) {
        this.enrolledFactors = userInfo.mfaInfo.map((enrollment) => MultiFactorInfoImpl._fromServerResponse(user.auth, enrollment));
      }
    });
  }
  static _fromUser(user) {
    return new _MultiFactorUserImpl(user);
  }
  async getSession() {
    return MultiFactorSessionImpl._fromIdtoken(await this.user.getIdToken(), this.user);
  }
  async enroll(assertionExtern, displayName) {
    const assertion = assertionExtern;
    const session = await this.getSession();
    const finalizeMfaResponse = await _logoutIfInvalidated(this.user, assertion._process(this.user.auth, session, displayName));
    await this.user._updateTokensIfNecessary(finalizeMfaResponse);
    return this.user.reload();
  }
  async unenroll(infoOrUid) {
    const mfaEnrollmentId = typeof infoOrUid === "string" ? infoOrUid : infoOrUid.uid;
    const idToken = await this.user.getIdToken();
    try {
      const idTokenResponse = await _logoutIfInvalidated(this.user, withdrawMfa(this.user.auth, {
        idToken,
        mfaEnrollmentId
      }));
      this.enrolledFactors = this.enrolledFactors.filter(({ uid }) => uid !== mfaEnrollmentId);
      await this.user._updateTokensIfNecessary(idTokenResponse);
      await this.user.reload();
    } catch (e) {
      throw e;
    }
  }
};
var multiFactorUserCache = /* @__PURE__ */ new WeakMap();
function multiFactor(user) {
  const userModular = getModularInstance(user);
  if (!multiFactorUserCache.has(userModular)) {
    multiFactorUserCache.set(userModular, MultiFactorUserImpl._fromUser(userModular));
  }
  return multiFactorUserCache.get(userModular);
}
var name2 = "@firebase/auth";
var version2 = "1.10.8";
var AuthInterop = class {
  constructor(auth) {
    this.auth = auth;
    this.internalListeners = /* @__PURE__ */ new Map();
  }
  getUid() {
    var _a;
    this.assertAuthConfigured();
    return ((_a = this.auth.currentUser) === null || _a === void 0 ? void 0 : _a.uid) || null;
  }
  async getToken(forceRefresh) {
    this.assertAuthConfigured();
    await this.auth._initializationPromise;
    if (!this.auth.currentUser) {
      return null;
    }
    const accessToken = await this.auth.currentUser.getIdToken(forceRefresh);
    return { accessToken };
  }
  addAuthTokenListener(listener) {
    this.assertAuthConfigured();
    if (this.internalListeners.has(listener)) {
      return;
    }
    const unsubscribe = this.auth.onIdTokenChanged((user) => {
      listener((user === null || user === void 0 ? void 0 : user.stsTokenManager.accessToken) || null);
    });
    this.internalListeners.set(listener, unsubscribe);
    this.updateProactiveRefresh();
  }
  removeAuthTokenListener(listener) {
    this.assertAuthConfigured();
    const unsubscribe = this.internalListeners.get(listener);
    if (!unsubscribe) {
      return;
    }
    this.internalListeners.delete(listener);
    unsubscribe();
    this.updateProactiveRefresh();
  }
  assertAuthConfigured() {
    _assert(
      this.auth._initializationPromise,
      "dependent-sdk-initialized-before-auth"
      /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
    );
  }
  updateProactiveRefresh() {
    if (this.internalListeners.size > 0) {
      this.auth._startProactiveRefresh();
    } else {
      this.auth._stopProactiveRefresh();
    }
  }
};
function getVersionForPlatform(clientPlatform) {
  switch (clientPlatform) {
    case "Node":
      return "node";
    case "ReactNative":
      return "rn";
    case "Worker":
      return "webworker";
    case "Cordova":
      return "cordova";
    case "WebExtension":
      return "web-extension";
    default:
      return void 0;
  }
}
function registerAuth(clientPlatform) {
  _registerComponent(new Component(
    "auth",
    (container, { options: deps }) => {
      const app = container.getProvider("app").getImmediate();
      const heartbeatServiceProvider = container.getProvider("heartbeat");
      const appCheckServiceProvider = container.getProvider("app-check-internal");
      const { apiKey, authDomain } = app.options;
      _assert(apiKey && !apiKey.includes(":"), "invalid-api-key", { appName: app.name });
      const config = {
        apiKey,
        authDomain,
        clientPlatform,
        apiHost: "identitytoolkit.googleapis.com",
        tokenApiHost: "securetoken.googleapis.com",
        apiScheme: "https",
        sdkClientVersion: _getClientVersion(clientPlatform)
      };
      const authInstance = new AuthImpl(app, heartbeatServiceProvider, appCheckServiceProvider, config);
      _initializeAuthInstance(authInstance, deps);
      return authInstance;
    },
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ).setInstantiationMode(
    "EXPLICIT"
    /* InstantiationMode.EXPLICIT */
  ).setInstanceCreatedCallback((container, _instanceIdentifier, _instance) => {
    const authInternalProvider = container.getProvider(
      "auth-internal"
      /* _ComponentName.AUTH_INTERNAL */
    );
    authInternalProvider.initialize();
  }));
  _registerComponent(new Component(
    "auth-internal",
    (container) => {
      const auth = _castAuth(container.getProvider(
        "auth"
        /* _ComponentName.AUTH */
      ).getImmediate());
      return ((auth2) => new AuthInterop(auth2))(auth);
    },
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ).setInstantiationMode(
    "EXPLICIT"
    /* InstantiationMode.EXPLICIT */
  ));
  registerVersion(name2, version2, getVersionForPlatform(clientPlatform));
  registerVersion(name2, version2, "esm2017");
}
FetchProvider.initialize(fetch, Headers, Response);
function getAuth(app = getApp()) {
  const provider = _getProvider(app, "auth");
  if (provider.isInitialized()) {
    return provider.getImmediate();
  }
  const auth = initializeAuth(app);
  const authEmulatorHost = getDefaultEmulatorHost("auth");
  if (authEmulatorHost) {
    connectAuthEmulator(auth, `http://${authEmulatorHost}`);
  }
  return auth;
}
registerAuth(
  "Node"
  /* ClientPlatform.NODE */
);
var NOT_AVAILABLE_ERROR = _createError(
  "operation-not-supported-in-this-environment"
  /* AuthErrorCode.OPERATION_NOT_SUPPORTED */
);
async function fail() {
  throw NOT_AVAILABLE_ERROR;
}
var FailClass = class {
  constructor() {
    throw NOT_AVAILABLE_ERROR;
  }
};
var browserLocalPersistence = inMemoryPersistence;
var browserSessionPersistence = inMemoryPersistence;
var browserCookiePersistence = inMemoryPersistence;
var indexedDBLocalPersistence = inMemoryPersistence;
var browserPopupRedirectResolver = NOT_AVAILABLE_ERROR;
var PhoneAuthProvider = FailClass;
var signInWithPhoneNumber = fail;
var linkWithPhoneNumber = fail;
var reauthenticateWithPhoneNumber = fail;
var updatePhoneNumber = fail;
var signInWithPopup = fail;
var linkWithPopup = fail;
var reauthenticateWithPopup = fail;
var signInWithRedirect = fail;
var linkWithRedirect = fail;
var reauthenticateWithRedirect = fail;
var getRedirectResult = fail;
var RecaptchaVerifier = FailClass;
var PhoneMultiFactorGenerator = class {
  static assertion() {
    throw NOT_AVAILABLE_ERROR;
  }
};
AuthImpl.prototype.setPersistence = async () => {
};
function finalizeSignInTotpMfa(auth, request) {
  return _performApiRequest(auth, "POST", "/v2/accounts/mfaSignIn:finalize", _addTidIfNecessary(auth, request));
}
var MultiFactorAssertionImpl = class {
  constructor(factorId) {
    this.factorId = factorId;
  }
  _process(auth, session, displayName) {
    switch (session.type) {
      case "enroll":
        return this._finalizeEnroll(auth, session.credential, displayName);
      case "signin":
        return this._finalizeSignIn(auth, session.credential);
      default:
        return debugFail("unexpected MultiFactorSessionType");
    }
  }
};
var TotpMultiFactorGenerator = class {
  /**
   * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of
   * the TOTP (time-based one-time password) second factor.
   * This assertion is used to complete enrollment in TOTP second factor.
   *
   * @param secret A {@link TotpSecret} containing the shared secret key and other TOTP parameters.
   * @param oneTimePassword One-time password from TOTP App.
   * @returns A {@link TotpMultiFactorAssertion} which can be used with
   * {@link MultiFactorUser.enroll}.
   */
  static assertionForEnrollment(secret, oneTimePassword) {
    return TotpMultiFactorAssertionImpl._fromSecret(secret, oneTimePassword);
  }
  /**
   * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of the TOTP second factor.
   * This assertion is used to complete signIn with TOTP as the second factor.
   *
   * @param enrollmentId identifies the enrolled TOTP second factor.
   * @param oneTimePassword One-time password from TOTP App.
   * @returns A {@link TotpMultiFactorAssertion} which can be used with
   * {@link MultiFactorResolver.resolveSignIn}.
   */
  static assertionForSignIn(enrollmentId, oneTimePassword) {
    return TotpMultiFactorAssertionImpl._fromEnrollmentId(enrollmentId, oneTimePassword);
  }
  /**
   * Returns a promise to {@link TotpSecret} which contains the TOTP shared secret key and other parameters.
   * Creates a TOTP secret as part of enrolling a TOTP second factor.
   * Used for generating a QR code URL or inputting into a TOTP app.
   * This method uses the auth instance corresponding to the user in the multiFactorSession.
   *
   * @param session The {@link MultiFactorSession} that the user is part of.
   * @returns A promise to {@link TotpSecret}.
   */
  static async generateSecret(session) {
    var _a;
    const mfaSession = session;
    _assert(
      typeof ((_a = mfaSession.user) === null || _a === void 0 ? void 0 : _a.auth) !== "undefined",
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const response = await startEnrollTotpMfa(mfaSession.user.auth, {
      idToken: mfaSession.credential,
      totpEnrollmentInfo: {}
    });
    return TotpSecret._fromStartTotpMfaEnrollmentResponse(response, mfaSession.user.auth);
  }
};
TotpMultiFactorGenerator.FACTOR_ID = "totp";
var TotpMultiFactorAssertionImpl = class _TotpMultiFactorAssertionImpl extends MultiFactorAssertionImpl {
  constructor(otp, enrollmentId, secret) {
    super(
      "totp"
      /* FactorId.TOTP */
    );
    this.otp = otp;
    this.enrollmentId = enrollmentId;
    this.secret = secret;
  }
  /** @internal */
  static _fromSecret(secret, otp) {
    return new _TotpMultiFactorAssertionImpl(otp, void 0, secret);
  }
  /** @internal */
  static _fromEnrollmentId(enrollmentId, otp) {
    return new _TotpMultiFactorAssertionImpl(otp, enrollmentId);
  }
  /** @internal */
  async _finalizeEnroll(auth, idToken, displayName) {
    _assert(
      typeof this.secret !== "undefined",
      auth,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return finalizeEnrollTotpMfa(auth, {
      idToken,
      displayName,
      totpVerificationInfo: this.secret._makeTotpVerificationInfo(this.otp)
    });
  }
  /** @internal */
  async _finalizeSignIn(auth, mfaPendingCredential) {
    _assert(
      this.enrollmentId !== void 0 && this.otp !== void 0,
      auth,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    const totpVerificationInfo = { verificationCode: this.otp };
    return finalizeSignInTotpMfa(auth, {
      mfaPendingCredential,
      mfaEnrollmentId: this.enrollmentId,
      totpVerificationInfo
    });
  }
};
var TotpSecret = class _TotpSecret {
  // The public members are declared outside the constructor so the docs can be generated.
  constructor(secretKey, hashingAlgorithm, codeLength, codeIntervalSeconds, enrollmentCompletionDeadline, sessionInfo, auth) {
    this.sessionInfo = sessionInfo;
    this.auth = auth;
    this.secretKey = secretKey;
    this.hashingAlgorithm = hashingAlgorithm;
    this.codeLength = codeLength;
    this.codeIntervalSeconds = codeIntervalSeconds;
    this.enrollmentCompletionDeadline = enrollmentCompletionDeadline;
  }
  /** @internal */
  static _fromStartTotpMfaEnrollmentResponse(response, auth) {
    return new _TotpSecret(response.totpSessionInfo.sharedSecretKey, response.totpSessionInfo.hashingAlgorithm, response.totpSessionInfo.verificationCodeLength, response.totpSessionInfo.periodSec, new Date(response.totpSessionInfo.finalizeEnrollmentTime).toUTCString(), response.totpSessionInfo.sessionInfo, auth);
  }
  /** @internal */
  _makeTotpVerificationInfo(otp) {
    return { sessionInfo: this.sessionInfo, verificationCode: otp };
  }
  /**
   * Returns a QR code URL as described in
   * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
   * This can be displayed to the user as a QR code to be scanned into a TOTP app like Google Authenticator.
   * If the optional parameters are unspecified, an accountName of <userEmail> and issuer of <firebaseAppName> are used.
   *
   * @param accountName the name of the account/app along with a user identifier.
   * @param issuer issuer of the TOTP (likely the app name).
   * @returns A QR code URL string.
   */
  generateQrCodeUrl(accountName, issuer) {
    var _a;
    let useDefaults = false;
    if (_isEmptyString(accountName) || _isEmptyString(issuer)) {
      useDefaults = true;
    }
    if (useDefaults) {
      if (_isEmptyString(accountName)) {
        accountName = ((_a = this.auth.currentUser) === null || _a === void 0 ? void 0 : _a.email) || "unknownuser";
      }
      if (_isEmptyString(issuer)) {
        issuer = this.auth.name;
      }
    }
    return `otpauth://totp/${issuer}:${accountName}?secret=${this.secretKey}&issuer=${issuer}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`;
  }
};
function _isEmptyString(input) {
  return typeof input === "undefined" || (input === null || input === void 0 ? void 0 : input.length) === 0;
}

// ../node_modules/@firebase/auth/dist/node-esm/index.js
init_index_esm20173();
init_index_node_esm();
init_index_esm2017();
init_index_esm20172();

// ../src/config/appCheckClient.ts
var import_react_native = require("react-native");

// ../node_modules/firebase/app/dist/index.mjs
init_index_esm20173();
init_index_esm20173();
var name3 = "firebase";
var version3 = "11.10.0";
registerVersion(name3, version3, "app");

// ../src/config/runtimeTrustProfile.ts
var import_react_native2 = require("react-native");

// ../src/services/walletFirebaseSession.ts
var { getAuth: getAuth2, getIdToken: getIdToken2, initializeAuth: initializeAuth2, signInAnonymously: signInAnonymously2 } = dist_exports;

// ../src/storage/storageKeys.ts
var STORAGE_KEYS = {
  schemaVersion: "ketnoieu.storage.schema.version",
  // owner: storage/runMigrations
  authSession: "ketnoieu.auth.session.v1",
  // owner: AuthContext
  wallet: "ketnoieu.wallet.v1",
  // owner: state/wallet (server balance is truth)
  usageHistory: "ketnoieu.usage.history.v1",
  // owner: services/history (interpreter/leona/booking/…)
  growthSnapshot: "ketnoieu.growth.snapshot.v1",
  // owner: services/growth
  dailyLoop: "ketnoieu.engagement.dailyLoop.v1",
  // owner: services/engagement
  companionMemory: "ketnoieu.companion.memory.v1",
  // owner: services/companion
  networkEffectAggregates: "ketnoieu.networkEffect.aggregates.v1",
  // owner: services/networkEffect
  lifeOsRecentActions: "ketnoieu.lifeos.recentActions.v1",
  // owner: services/selling
  sellPendingResume: "ketnoieu.sell.pendingResume.v1",
  // owner: services/selling
  guidedIntentCompleted: "ketnoieu.guided.intent.completed.v1",
  // owner: onboarding
  guidedLeTanAiSeed: "ketnoieu.guided.letan.aiSeed.v1",
  // owner: onboarding
  guidedMicroPrefix: "ketnoieu.guided.micro.",
  // owner: onboarding (pairs with STORAGE_KEY_BUILDERS.guidedMicro)
  adminUnlock: "ketnoieu.admin.unlocked.v1",
  // owner: HomeScreen/CaNhanScreen
  proactiveSuggestions: "ketnoieu.proactive.suggestions.v1",
  // owner: components/ProactiveSuggestions
  ttsClientCache: "ketnoieu.tts.cache.v1",
  // owner: services/OpenAIService
  documentVault: "ketnoieu.userDocuments.v1",
  // owner: services/DocumentAlarmService (+ Vault UI)
  documentAlarmSeen: "ketnoieu.documentAlarmSeen.v1",
  // owner: services/DocumentAlarmService
  learningB1B2Unlocked: "ketnoieu.learning.b1b2.unlocked.v1",
  // owner: screens/HocTapScreen
  marketplaceTransactions: "ketnoieu.marketplace.transactions.v1",
  // owner: services/marketplace
  moatHabitSignals: "ketnoieu.moat.habit.signals.v1",
  // owner: services/moat/habitLoop
  moatB2bLockIn: "ketnoieu.moat.b2b.lockin.v1",
  // owner: services/moat/b2bLockIn
  moatLearningAggregates: "ketnoieu.moat.learning.aggregates.v1",
  // owner: services/moat/centralLearningData
  autonomyAudit: "ketnoieu.autonomy.audit.v1"
  // owner: services/autonomy/auditLogStorage
};

// ../src/services/identity/aiIdentityService.ts
var import_async_storage2 = __toESM(require("@react-native-async-storage/async-storage"));
var AUTH_STORAGE_KEY = STORAGE_KEYS.authSession;

// ../src/services/networkEffect/store.ts
var import_async_storage3 = __toESM(require("@react-native-async-storage/async-storage"));
var STORE_KEY = STORAGE_KEYS.networkEffectAggregates;

// ../src/services/moat/centralLearningData.ts
var import_async_storage4 = __toESM(require("@react-native-async-storage/async-storage"));
var KEY = STORAGE_KEYS.moatLearningAggregates;

// ../src/services/moat/b2bLockIn.ts
var import_async_storage5 = __toESM(require("@react-native-async-storage/async-storage"));
var KEY2 = STORAGE_KEYS.moatB2bLockIn;

// ../src/services/moat/habitLoop.ts
var import_async_storage6 = __toESM(require("@react-native-async-storage/async-storage"));
var KEY3 = STORAGE_KEYS.moatHabitSignals;

// ../src/services/OpenAIService.ts
var BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? "";
var TTS_CACHE_API_BASE = process.env.EXPO_PUBLIC_TTS_CACHE_API_BASE?.trim() ?? "";
var TTS_CACHE_TTL_DAYS = Number(process.env.EXPO_PUBLIC_TTS_CACHE_TTL_DAYS ?? "90");
var TTS_CACHE_VERSION = (process.env.EXPO_PUBLIC_TTS_CACHE_VERSION ?? "v1").trim() || "v1";
var AUTH_STORAGE_KEY2 = STORAGE_KEYS.authSession;
var TTS_CACHE_STORAGE_KEY = STORAGE_KEYS.ttsClientCache;

// ../src/state/assistantSettings.ts
var import_react = __toESM(require_react());

// ../src/services/liveInterpreterService.ts
var INTERPRETER_SESSION_CREDITS = 25;
var INTERPRETER_MAX_SESSION_MINUTES = 8;
var INTERPRETER_MAX_SESSION_MS = INTERPRETER_MAX_SESSION_MINUTES * 60 * 1e3;

// ../src/services/PaymentsService.ts
var PAYMENTS_API_BASE = process.env.EXPO_PUBLIC_PAYMENTS_API_BASE?.trim() ?? "";
function normalizeCountry(input) {
  return resolveCountryPack(input).countryCode;
}
function formatMoney(amount) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount);
}
function calculateCallCreditPrice(userCountry) {
  const country = normalizeCountry(userCountry);
  const tier = pricingTierForUsageDebits(country);
  const creditsPerCall = OUTBOUND_CALL_CREDITS_BY_TIER[tier];
  return {
    country,
    creditsPerCall,
    basePerCallCzk: creditsPerCall,
    localAmount: creditsPerCall,
    currencyCode: "CREDITS",
    amountLabel: `${formatMoney(creditsPerCall)} Credits/cu\u1ED9c`
  };
}
function calculateLeTanBookingPrice(userCountry) {
  const country = normalizeCountry(userCountry);
  const tier = pricingTierForUsageDebits(country);
  const creditsPerBooking = LETAN_BOOKING_CREDITS_BY_TIER[tier];
  return {
    country,
    creditsPerBooking,
    localAmount: creditsPerBooking,
    currencyCode: "CREDITS",
    amountLabel: `${creditsPerBooking} Credits/l\u01B0\u1EE3t`
  };
}

// ../src/services/selling/generateSellCTA.ts
function snippet(input) {
  const s = input.trim().replace(/\s+/g, " ");
  return s.length > 42 ? `${s.slice(0, 42)}...` : s;
}
function actionToPrefill(action, userInput) {
  const s = snippet(userInput);
  switch (action) {
    case "leona_booking":
      return { prefillRequest: `G\u1ECDi h\u1ED7 tr\u1EE3 theo nhu c\u1EA7u c\u1EE7a t\xF4i: "${s}". T\u1EADp trung \u0111\u1EB7t l\u1ECBch / x\xE1c nh\u1EADn l\u1ECBch ngay.` };
    case "start_interpreter":
      return {};
    case "leTan_assist":
      return { proactiveQuestion: `H\u1ED7 tr\u1EE3 cu\u1ED9c g\u1ECDi/ch\u1ED1t l\u1ECBch nhanh: "${s}".` };
    default:
      return {};
  }
}
function generateSellCTA(opportunity, input) {
  if (!opportunity) return null;
  const safeInput = input ?? {
    userInput: "",
    intent: null,
    context: {}
  };
  const userCountry = safeInput.context.userCountry;
  const bookingCost = calculateCallCreditPrice(userCountry).localAmount;
  const interpreterCost = INTERPRETER_SESSION_CREDITS;
  const leTanCost = calculateLeTanBookingPrice(userCountry).localAmount;
  switch (opportunity) {
    case "booking_call": {
      const action = "leona_booking";
      const { prefillRequest } = actionToPrefill(action, safeInput.userInput);
      return {
        action,
        creditsCost: bookingCost,
        message: `Mu\u1ED1n m\xECnh g\u1ECDi Leona \u0111\u1EB7t l\u1ECBch / gia h\u1EA1n ngay kh\xF4ng? (C\u1EA7n ${bookingCost} Credits)
Ti\u1EBFp theo: n\u1EBFu c\u1EA7n, m\xECnh gi\xFAp b\u1EA1n s\u1EAFp l\u1ECBch gi\u1EA5y t\u1EDD theo \u0111\xFAng m\u1ED1c.`,
        resume: { route: "LeonaCall", params: { prefillRequest, autoSubmit: true } }
      };
    }
    case "interpreter": {
      const action = "start_interpreter";
      return {
        action,
        creditsCost: interpreterCost,
        message: `M\xECnh m\u1EDF phi\xEAn d\u1ECBch ngay \u0111\u1EC3 b\u1EA1n n\xF3i tr\xF4i ch\u1EA3y h\u01A1n. (C\u1EA7n ${interpreterCost} Credits/phi\xEAn)
Ti\u1EBFp theo: n\u1EBFu b\u1EA1n mu\u1ED1n g\u1ECDi \u0111\u1EB7t l\u1ECBch, m\xECnh g\u1EE3i \xFD chuy\u1EC3n sang Leona.`,
        resume: { route: "LiveInterpreter", params: { guidedEntry: true, scenario: "general" } }
      };
    }
    case "call_assist": {
      const action = "leTan_assist";
      const { proactiveQuestion } = actionToPrefill(action, safeInput.userInput);
      return {
        action,
        creditsCost: leTanCost,
        message: `M\xECnh c\xF3 th\u1EC3 chuy\u1EC3n b\u1EA1n sang L\u1EC5 t\xE2n \u0111\u1EC3 h\u1ED7 tr\u1EE3 ch\u1ED1t nhanh. (C\u1EA7n ${leTanCost} Credits/l\u01B0\u1EE3t m\xF4 ph\u1ECFng)
Ti\u1EBFp theo: sau khi ch\u1ED1t, n\u1EBFu c\u1EA7n x\xE1c nh\u1EADn cu\u1ED9c g\u1ECDi th\u1EADt, m\xECnh \u0111\u1EC1 xu\u1EA5t Leona.`,
        resume: {
          route: "Tabs",
          params: {
            screen: "LeTan",
            params: { proactiveQuestion, autoSimulate: true }
          }
        }
      };
    }
    default:
      return null;
  }
}

// ../src/services/selling/sellEngine.ts
function maybeGenerateSellCTA(input) {
  const opportunity = detectOpportunity(input);
  const cta = opportunity ? generateSellCTA(opportunity, input) : null;
  return { opportunity: opportunity ?? null, cta };
}

// ../src/services/b2b/ai/callResponseGenerator.ts
var customGenerator = null;
function normalizeSpoken2(text) {
  return text.replace(/\s+/g, " ").replace(/\*/g, "").trim();
}
function inferIntentFromUtterance(raw) {
  const t = raw.toLowerCase();
  if (/\b(hotel|room|suite|stay|overnight|check[-\s]?in|check[-\s]?out|phòng|khách sạn|nhận phòng|trả phòng|đêm)\b/i.test(
    t
  )) {
    return "stay_booking";
  }
  if (/\b(wholesale|pallet|đổ hàng|bán sỉ|sỉ\b|nguyên cont|bulk)\b/i.test(t)) {
    return "wholesale_order";
  }
  if (/\b(book|booking|appointment|reservation|reserve|table|slot|đặt|đặt chỗ|objednat|rezerv)\b/i.test(t))
    return "booking";
  if (/\b(order|pickup|delivery|takeaway|objednáv|giao|mang)\b/i.test(t)) return "order";
  if (/\b(transfer|human|speak to|manager|operátor)\b/i.test(t)) return "transfer";
  if (/\b(what|when|where|hours|open|price|faq|help|question)\b/i.test(t)) return "faq";
  return null;
}
function effectiveIntent(session, latestUserInput) {
  const fromSession = session.detectedIntent ?? session.intent;
  if (fromSession && fromSession !== "unknown") return fromSession;
  const inferred = inferIntentFromUtterance(latestUserInput);
  return inferred ?? "unknown";
}
function nextPhaseForIntent(intent) {
  switch (intent) {
    case "booking":
    case "stay_booking":
      return "booking_collect";
    case "order":
    case "wholesale_order":
      return "order_collect";
    case "faq":
      return "faq";
    case "transfer":
      return "confirm_handoff";
    default:
      return "intent_clarify";
  }
}
function clarificationResponse(state, languageHint) {
  const lang = languageHint?.slice(0, 2);
  const line = lang === "vi" ? "Xin l\u1ED7i, t\xF4i kh\xF4ng nghe r\xF5. B\u1EA1n n\xF3i l\u1EA1i gi\xFAp t\xF4i m\u1ED9t l\u1EA7n \u0111\u01B0\u1EE3c kh\xF4ng?" : lang === "cs" ? "Promi\u0148te, nerozum\u011Bl jsem. Zopakujte to pros\xEDm jednou?" : "Sorry, I didn't quite catch that. Could you say that again, please?";
  return {
    spokenText: normalizeSpoken2(line),
    voiceDialogueState: {
      ...state,
      turnCount: state.turnCount + 1,
      lastQuestionAsked: line
    },
    tts: { synthesizeFromText: true, language: languageHint },
    advancedPhase: false,
    audioEncoding: "none"
  };
}
function bookingSlotQuestion(businessType) {
  switch (businessType) {
    case "hospitality_stay":
      return "What are your check-in and check-out dates, how many guests, and the name for the reservation request?";
    case "restaurant":
      return "What day, time, and party size should I book?";
    case "nails":
      return "What service and time work best for you?";
    case "grocery_retail":
    case "potraviny":
      return "What time works for pickup or delivery, and what should we prepare?";
    case "grocery_wholesale":
      return "For a wholesale request, what products and approximate volumes do you need, and pickup or delivery?";
    default:
      return "What time would you like, and is there anything we should prepare in advance?";
  }
}
function maybeAppendSellCta(line, latestUserInput, intent) {
  const out = maybeGenerateSellCTA({
    userInput: latestUserInput,
    intent,
    context: {}
  });
  if (!out.cta) return line;
  return normalizeSpoken2(`${line} ${out.cta.message.split("\n")[0] ?? ""}`);
}
function defaultGenerateCallResponse(input) {
  const { session, latestUserInput, tenantDisplayName, businessType } = input;
  const lang = input.defaultLanguage;
  const ttsVoiceId = input.ttsVoiceId;
  const base = session.voiceDialogueState ?? { phase: "greeting", turnCount: 0 };
  const userLine = latestUserInput.trim();
  const intent = effectiveIntent(session, userLine);
  let phase = base.phase;
  if (intent === "booking" || intent === "stay_booking") {
    const bookingVoice = generateBookingVoiceResponse(input);
    if (bookingVoice) return bookingVoice;
  }
  if (!userLine) {
    if (base.phase === "greeting" && base.turnCount === 0) {
      const line = normalizeSpoken2(
        `Thanks for calling ${tenantDisplayName}. Do you need a booking, retail or wholesale order, a hotel stay request, or something else?`
      );
      return {
        spokenText: line,
        voiceDialogueState: { phase: "intent_clarify", turnCount: 1, lastQuestionAsked: line },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: true,
        audioEncoding: "none"
      };
    }
    return clarificationResponse(base, lang);
  }
  if (phase === "greeting") {
    phase = intent === "unknown" ? "intent_clarify" : nextPhaseForIntent(intent);
  }
  if (intent === "unknown") {
    const baseLine = normalizeSpoken2(
      `Are you looking to book a visit, hotel stay, retail or wholesale order, ask a question, or speak with someone at ${tenantDisplayName}?`
    );
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "intent_clarify", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "booking" || intent === "stay_booking") {
    const baseLine = normalizeSpoken2(bookingSlotQuestion(businessType));
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "booking_slot_fill", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "order") {
    const baseLine = businessType === "grocery_wholesale" ? normalizeSpoken2(
      "For wholesale: pickup or delivery, line items with quantities or pallets, and any special handling? I will record this as a request for staff to confirm before it is final."
    ) : normalizeSpoken2("Would you like pickup or delivery, and what should I put on the order?");
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "order_collect", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "wholesale_order") {
    const baseLine = normalizeSpoken2(
      "I will take a wholesale order request: please list products, quantities or pallets, pickup or delivery window, and contact name. Staff must confirm stock and price \u2014 this is not a final order until they respond."
    );
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "order_collect", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "faq") {
    const baseLine = normalizeSpoken2(`What would you like to know about ${tenantDisplayName}?`);
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "faq", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "transfer") {
    const baseLine = normalizeSpoken2("Connecting you with the team. Please hold for a moment.");
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "confirm_handoff", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  return clarificationResponse(base, lang);
}
function generateCallResponse(input) {
  if (customGenerator) return customGenerator(input);
  return defaultGenerateCallResponse(input);
}

// ../src/services/b2b/ai/voiceOrderCommit.ts
function parseVoiceOrderCommitLines(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const lines = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") return null;
    const o = row;
    const name4 = o.name;
    const quantity = o.quantity;
    if (typeof name4 !== "string" || !name4.trim()) return null;
    const q = typeof quantity === "number" && Number.isFinite(quantity) ? quantity : typeof quantity === "string" ? parseInt(quantity, 10) : NaN;
    if (!Number.isFinite(q) || q <= 0) return null;
    lines.push({
      name: name4.trim(),
      quantity: Math.floor(q),
      needsClarification: o.needsClarification === true,
      notes: typeof o.notes === "string" ? o.notes : void 0,
      sku: typeof o.sku === "string" ? o.sku : void 0
    });
  }
  return lines;
}
function parseVoiceOrderLineClarifications(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return void 0;
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") continue;
    const o = row;
    const lineIndex = typeof o.lineIndex === "number" && Number.isFinite(o.lineIndex) ? o.lineIndex : typeof o.lineIndex === "string" ? parseInt(o.lineIndex, 10) : i;
    if (!Number.isFinite(lineIndex)) continue;
    out.push({
      lineIndex: Math.max(0, Math.floor(lineIndex)),
      vi: typeof o.vi === "string" ? o.vi : void 0,
      en: typeof o.en === "string" ? o.en : void 0,
      cs: typeof o.cs === "string" ? o.cs : void 0
    });
  }
  return out.length ? out : void 0;
}

// ../src/services/b2b/hospitality/stayCommitMapping.ts
function normalizeStayDateInput(raw) {
  if (!raw) return void 0;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  return t.length > 0 ? t.slice(0, 80) : void 0;
}
function parseOccupancyGuestCounts(occupancy) {
  if (!occupancy?.trim()) return {};
  const adults = occupancy.match(/(\d+)\s*(?:adults?|người\s*lớn|khách(?:\s*lớn)?)/iu) ?? occupancy.match(/\b(\d+)\s*(?:x\s*)?(?:người|người\s*đi)\b/iu);
  const children = occupancy.match(/(\d+)\s*(?:children|kids?|trẻ|trẻ\s*em)/iu) ?? occupancy.match(/(\d+)\s*(?:trẻ)/iu);
  const out = {};
  if (adults?.[1]) {
    const n = parseInt(adults[1], 10);
    if (Number.isFinite(n)) out.adults = n;
  }
  if (children?.[1]) {
    const n = parseInt(children[1], 10);
    if (Number.isFinite(n)) out.children = n;
  }
  return out;
}
function buildHospitalityStayInquiryNotes(existing) {
  const tag = "[Hospitality \xB7 voice inquiry] Recorded as reservation request / inquiry only \u2014 not billed; staff must confirm room, rate, and guarantee before treating as a firm booking.";
  if (!existing?.trim()) return tag;
  return `${existing.trim()}

${tag}`;
}

// src/b2b/voice/callSessionAdmin.ts
var import_firestore5 = require("firebase-admin/firestore");
var import_v26 = require("firebase-functions/v2");

// ../src/services/b2b/ai/bookingSlotSessionApply.ts
var defaultConf = () => ({
  awaitingConfirm: false,
  confirmed: false
});
function isBookingLikeIntent(i) {
  return i === "booking" || i === "stay_booking";
}
function transitionBookingSlotState(input) {
  const intent = input.detectedIntent ?? input.intent;
  if (!isBookingLikeIntent(intent)) return null;
  const slots = { ...input.bookingSlotState ?? {} };
  const bt = input.businessType;
  let conf = input.bookingConfirmation ? { ...input.bookingConfirmation } : defaultConf();
  if (conf.awaitingConfirm && !conf.confirmed) {
    const ans = parseConfirmationUtterance(input.latestUserInput);
    if (ans === "yes") {
      return {
        bookingSlotState: slots,
        bookingConfirmation: { awaitingConfirm: false, confirmed: true },
        voicePhase: "booking_confirm"
      };
    }
    if (ans === "no") {
      return {
        bookingSlotState: slots,
        bookingConfirmation: { awaitingConfirm: false, confirmed: false },
        voicePhase: "booking_slot_fill"
      };
    }
    return {
      bookingSlotState: slots,
      bookingConfirmation: conf,
      voicePhase: "booking_confirm"
    };
  }
  if (conf.confirmed) {
    return {
      bookingSlotState: slots,
      bookingConfirmation: conf,
      voicePhase: "closing"
    };
  }
  const extracted = extractSlotsFromUtterance(input.latestUserInput);
  const mergedSlots = mergeSlotState(slots, extracted);
  if (!allBookingSlotsFilled(bt, mergedSlots)) {
    return {
      bookingSlotState: mergedSlots,
      bookingConfirmation: { ...conf, awaitingConfirm: false, confirmed: false },
      voicePhase: "booking_slot_fill"
    };
  }
  return {
    bookingSlotState: mergedSlots,
    bookingConfirmation: { awaitingConfirm: true, confirmed: false },
    voicePhase: "booking_confirm"
  };
}

// src/b2b/voice/callSessionAdmin.ts
var TRANSCRIPT_SEP = "\n";
function stableSessionDocId(provider, externalCallId) {
  const raw = `${provider}:${externalCallId}`.toLowerCase();
  return raw.replace(/[^a-z0-9:_-]/g, "_").slice(0, 120);
}
function sessionCol(db2, tenantId) {
  return db2.collection(callSessionsCollectionPath(tenantId));
}
function docToSession(id, d) {
  return {
    id,
    tenantId: String(d.tenantId ?? ""),
    locationId: String(d.locationId ?? ""),
    externalCallId: String(d.externalCallId ?? ""),
    inboundNumberE164: String(d.inboundNumberE164 ?? ""),
    phoneNumber: d.phoneNumber ? String(d.phoneNumber) : void 0,
    status: d.status,
    idempotencyKey: String(d.idempotencyKey ?? ""),
    intent: d.intent,
    detectedIntent: d.detectedIntent,
    transcriptUri: d.transcriptUri ? String(d.transcriptUri) : void 0,
    transcript: d.transcript ? String(d.transcript) : void 0,
    extractedPayload: d.extractedPayload,
    bookingId: d.bookingId ? String(d.bookingId) : void 0,
    orderId: d.orderId ? String(d.orderId) : void 0,
    billingEventId: d.billingEventId ? String(d.billingEventId) : void 0,
    orderBillingEventId: d.orderBillingEventId ? String(d.orderBillingEventId) : void 0,
    errorCode: d.errorCode ? String(d.errorCode) : void 0,
    outcome: d.outcome,
    failureReason: d.failureReason ? String(d.failureReason) : void 0,
    failureCode: d.failureCode,
    voiceDialogueState: d.voiceDialogueState ?? void 0,
    bookingSlotState: d.bookingSlotState,
    bookingConfirmation: d.bookingConfirmation,
    staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
    startedAt: d.startedAt,
    endedAt: d.endedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}
async function getCallSessionById(db2, tenantId, sessionId) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return docToSession(snap.id, snap.data());
}
async function findSessionByExternalCallId(db2, tenantId, externalCallId) {
  const q = sessionCol(db2, tenantId).where("externalCallId", "==", externalCallId).limit(1);
  const snap = await q.get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, data: docToSession(doc.id, doc.data()) };
}
async function ensureCallSession(db2, input) {
  const provider = input.provider ?? "twilio";
  const ref = sessionCol(db2, input.tenantId).doc(stableSessionDocId(provider, input.externalCallId));
  const idem = callSessionIdempotencyKey(provider, input.externalCallId);
  const now = import_firestore5.FieldValue.serverTimestamp();
  const status = input.initialStatus ?? "ringing";
  return db2.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      import_v26.logger.info("[callSession] idempotent_existing", {
        tenantId: input.tenantId,
        sessionDocId: ref.id,
        externalCallId: input.externalCallId,
        provider
      });
      return { sessionId: ref.id, created: false };
    }
    import_v26.logger.info("[callSession] created", {
      tenantId: input.tenantId,
      sessionDocId: ref.id,
      externalCallId: input.externalCallId,
      provider
    });
    tx.set(ref, {
      tenantId: input.tenantId,
      locationId: input.locationId,
      externalCallId: input.externalCallId,
      inboundNumberE164: input.inboundNumberE164,
      phoneNumber: input.callerPhoneE164 ?? null,
      status,
      idempotencyKey: idem,
      voiceDialogueState: { phase: "greeting", turnCount: 0 },
      startedAt: now,
      createdAt: now,
      updatedAt: now
    });
    return { sessionId: ref.id, created: true };
  });
}
async function appendTranscriptChunk(db2, tenantId, sessionId, chunk) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  await db2.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.get("transcript") ?? "";
    const next = cur ? `${cur}${TRANSCRIPT_SEP}${chunk}` : chunk;
    tx.update(ref, { transcript: next, updatedAt: import_firestore5.FieldValue.serverTimestamp() });
  });
}
async function persistVoiceAssistantTurn(db2, tenantId, sessionId, voice) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  await db2.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.get("transcript") ?? "";
    const line = `Assistant: ${voice.spokenText}`;
    const next = cur ? `${cur}${TRANSCRIPT_SEP}${line}` : line;
    tx.update(ref, {
      transcript: next,
      voiceDialogueState: voice.voiceDialogueState,
      updatedAt: import_firestore5.FieldValue.serverTimestamp()
    });
  });
}
async function applyBookingSlotTransitionFromUtterance(db2, tenantId, sessionId, latestUserInput) {
  const session = await getCallSessionById(db2, tenantId, sessionId);
  if (!session) return;
  const tenant = await loadTenant(db2, tenantId);
  const businessType = tenant?.businessType ?? "restaurant";
  const tr = transitionBookingSlotState({
    intent: session.intent,
    detectedIntent: session.detectedIntent,
    latestUserInput,
    bookingSlotState: session.bookingSlotState,
    bookingConfirmation: session.bookingConfirmation,
    businessType
  });
  if (!tr) return;
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const prev = session.voiceDialogueState ?? { turnCount: 0, phase: "greeting" };
  await ref.update({
    bookingSlotState: tr.bookingSlotState,
    bookingConfirmation: tr.bookingConfirmation,
    voiceDialogueState: {
      ...prev,
      phase: tr.voicePhase
    },
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  });
}
async function updateCallSessionIntent(db2, tenantId, sessionId, detectedIntent, extractedPayload) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const snap = await ref.get();
  const patch = {
    intent: detectedIntent,
    detectedIntent,
    status: "collecting",
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  };
  if (extractedPayload != null) patch.extractedPayload = extractedPayload;
  if (detectedIntent === "booking" || detectedIntent === "stay_booking") {
    if (!snap.get("bookingSlotState")) patch.bookingSlotState = {};
    if (!snap.get("bookingConfirmation")) {
      patch.bookingConfirmation = { awaitingConfirm: false, confirmed: false };
    }
  }
  await ref.update(patch);
}
async function markCallSessionBookingSuccess(db2, tenantId, sessionId, bookingId, billingEventId, options) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const patch = {
    bookingId,
    outcome: "success",
    status: "completed",
    billingEventId: billingEventId ?? null,
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  };
  if (options?.staffHandoffSummary) {
    patch.staffHandoffSummary = options.staffHandoffSummary;
  }
  await ref.update(patch);
}
async function markCallSessionOrderSuccess(db2, tenantId, sessionId, orderId, orderBillingEventId, options) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const patch = {
    orderId,
    outcome: "success",
    status: "completed",
    orderBillingEventId: orderBillingEventId ?? null,
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  };
  if (options?.staffHandoffSummary) {
    patch.staffHandoffSummary = options.staffHandoffSummary;
  }
  await ref.update(patch);
}
async function markCallSessionBookingFailure(db2, tenantId, sessionId, failureCode, failureReason) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  await ref.update({
    outcome: "fail",
    failureCode,
    failureReason,
    status: "error",
    errorCode: failureCode,
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  });
}
async function finalizeCallSession(db2, tenantId, sessionId, status = "completed") {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  await ref.update({
    status,
    endedAt: import_firestore5.FieldValue.serverTimestamp(),
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  });
}
async function loadTenant(db2, tenantId) {
  const snap = await db2.doc(tenantDocPath(tenantId)).get();
  if (!snap.exists) return null;
  return snap.data();
}

// src/b2b/voice/processVoiceOrchestrationRequest.ts
async function requireTrustedTenantFromInboundDid(db2, repos, body) {
  const to = body.to?.trim();
  if (!to) return badRequest("missing_to", "invalid_input");
  const route = await resolveTenantByPhone(db2, repos, { inboundNumberE164: to });
  if (!route) return badRequest("tenant_not_found", "tenant_not_found");
  if (body.tenantId && body.tenantId !== route.tenantId) {
    import_v27.logger.warn("[b2bVoice] tenant_claim_mismatch", {
      claimedTenantId: body.tenantId,
      resolvedTenantId: route.tenantId,
      externalCallId: body.externalCallId,
      inboundDid: to
    });
    return badRequest("tenant_mismatch", "invalid_input");
  }
  return { tenantId: route.tenantId };
}
function adminPhoneRouteRepo(db2) {
  return {
    async getByInboundE164(_db, e164) {
      const snap = await db2.doc(phoneRouteDocPath(e164)).get();
      if (!snap.exists) return null;
      const d = snap.data();
      if (!d?.tenantId || !d?.locationId) return null;
      return {
        tenantId: String(d.tenantId),
        locationId: String(d.locationId),
        inboundNumberE164: String(d.inboundNumberE164 ?? e164)
      };
    }
  };
}
var noopRepos = {};
function businessTypeToVoiceScenario(bt) {
  switch (bt) {
    case "nails":
      return "nails";
    case "restaurant":
      return "restaurant";
    case "potraviny":
    case "grocery_retail":
      return "potraviny";
    case "grocery_wholesale":
      return "grocery_wholesale";
    case "hospitality_stay":
      return "hospitality_stay";
    default:
      return "b2b_receptionist";
  }
}
function badRequest(msg, failureCode) {
  if (failureCode) return { ok: false, error: msg, failureCode };
  return { ok: false, error: msg };
}
async function runVoiceTurn(db2, sid, latestUserInput, skipVoice) {
  if (skipVoice) return {};
  const tenant = await loadTenant(db2, sid.tenantId);
  if (!tenant) return {};
  const session = await getCallSessionById(db2, sid.tenantId, sid.sessionId);
  if (!session) return {};
  const vp = resolveVoicePersona({
    mode: "b2b_inbound",
    scenario: businessTypeToVoiceScenario(tenant.businessType),
    language: tenant.ai?.defaultLanguage ?? "vi",
    userGender: "unknown",
    businessType: tenant.businessType,
    tenantConfig: { defaultLanguage: tenant.ai?.defaultLanguage }
  });
  const voice = generateCallResponse({
    session: {
      id: session.id,
      transcript: session.transcript,
      intent: session.intent,
      detectedIntent: session.detectedIntent,
      extractedPayload: session.extractedPayload,
      voiceDialogueState: session.voiceDialogueState,
      bookingSlotState: session.bookingSlotState,
      bookingConfirmation: session.bookingConfirmation
    },
    latestUserInput,
    tenantDisplayName: tenant.name,
    businessType: tenant.businessType,
    defaultLanguage: tenant.ai?.defaultLanguage,
    ttsVoiceId: vp.voiceId
  });
  const { mode, level } = getVoiceRealismEngineConfig();
  const phase = session.voiceDialogueState?.phase ?? "greeting";
  const humanized = humanizeSpokenResponse({
    rawText: voice.spokenText,
    language: tenant.ai?.defaultLanguage ?? "vi",
    tone: vp.tone,
    dialoguePhase: b2bPhaseToDialoguePhase(phase),
    realismLevel: level,
    engineMode: mode
  });
  const voiceForPersist = { ...voice, spokenText: humanized.spokenText };
  await persistVoiceAssistantTurn(db2, sid.tenantId, sid.sessionId, voiceForPersist);
  return {
    voiceResponse: {
      spokenText: humanized.spokenText,
      voiceDialogueState: voice.voiceDialogueState,
      tts: voice.tts,
      audioEncoding: voice.audioEncoding,
      audioBase64: voice.audioBase64
    }
  };
}
async function processVoiceOrchestrationRequest(db2, body) {
  const action = body?.action;
  if (action !== "ensure_session" && action !== "append_transcript" && action !== "set_intent" && action !== "commit_booking" && action !== "commit_order" && action !== "finalize_session") {
    return badRequest("invalid_action", "invalid_input");
  }
  if (!body.externalCallId || typeof body.externalCallId !== "string") {
    return badRequest("missing_externalCallId", "invalid_input");
  }
  const repos = { phoneRoute: adminPhoneRouteRepo(db2) };
  const resolveSid = async (tenantId) => {
    const sessionIdFromBody = body.sessionId;
    if (sessionIdFromBody) {
      const sref = db2.doc(`${callSessionsCollectionPath(tenantId)}/${sessionIdFromBody}`);
      const snap = await sref.get();
      if (!snap.exists) return null;
      if (String(snap.get("externalCallId") ?? "") !== body.externalCallId) return null;
      return { tenantId, sessionId: sessionIdFromBody };
    }
    const hit = await findSessionByExternalCallId(db2, tenantId, body.externalCallId);
    if (!hit) return null;
    return { tenantId, sessionId: hit.id };
  };
  switch (body.action) {
    case "ensure_session": {
      const to = body.to?.trim();
      if (!to) return badRequest("missing_to", "invalid_input");
      const route = await resolveTenantByPhone(db2, repos, { inboundNumberE164: to });
      if (!route) return badRequest("tenant_not_found", "tenant_not_found");
      if (body.tenantId && body.tenantId !== route.tenantId) {
        import_v27.logger.warn("[b2bVoice] tenant_claim_mismatch", {
          claimedTenantId: body.tenantId,
          resolvedTenantId: route.tenantId,
          externalCallId: body.externalCallId,
          inboundDid: to
        });
        return badRequest("tenant_mismatch", "invalid_input");
      }
      const { sessionId } = await ensureCallSession(db2, {
        tenantId: route.tenantId,
        locationId: route.locationId,
        externalCallId: body.externalCallId,
        provider: body.provider,
        inboundNumberE164: to,
        callerPhoneE164: body.from?.trim(),
        initialStatus: "greeting"
      });
      return {
        ok: true,
        sessionId,
        action: body.action,
        tenantId: route.tenantId
      };
    }
    case "append_transcript": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] append_transcript", { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      const chunk = body.transcriptChunk?.trim();
      if (!chunk) return badRequest("missing_transcriptChunk", "invalid_input");
      const line = chunk.startsWith("Caller:") || chunk.startsWith("Assistant:") ? chunk : `Caller: ${chunk}`;
      await appendTranscriptChunk(db2, sid.tenantId, sid.sessionId, line);
      await applyBookingSlotTransitionFromUtterance(db2, sid.tenantId, sid.sessionId, chunk);
      const voicePart = await runVoiceTurn(db2, sid, chunk, body.skipVoiceResponse);
      return { ok: true, sessionId: sid.sessionId, action: body.action, ...voicePart };
    }
    case "set_intent": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] set_intent", { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      const intent = body.detectedIntent;
      if (!intent) return badRequest("missing_detectedIntent", "invalid_input");
      await updateCallSessionIntent(db2, sid.tenantId, sid.sessionId, intent, body.extractedPayload);
      const latest = body.latestUserInput?.trim() ?? "";
      const voicePart = await runVoiceTurn(db2, sid, latest, body.skipVoiceResponse);
      return { ok: true, sessionId: sid.sessionId, action: body.action, ...voicePart };
    }
    case "commit_booking": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] commit_booking_attempt", {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        externalCallId: body.externalCallId
      });
      if (body.confirmed !== true) {
        return badRequest("commit_requires_confirmed_true", "invalid_input");
      }
      const slotDigest = body.slotDigest?.trim();
      if (!slotDigest) return badRequest("missing_slotDigest", "invalid_input");
      if (body.startsAtMs == null || body.endsAtMs == null) {
        return badRequest("missing_startsAtMs_or_endsAtMs", "invalid_input");
      }
      const tenant = await loadTenant(db2, sid.tenantId);
      if (!tenant) return badRequest("tenant_not_found", "tenant_not_found");
      const sessionRef = db2.doc(`${callSessionsCollectionPath(sid.tenantId)}/${sid.sessionId}`);
      const sessionSnap = await sessionRef.get();
      if (!sessionSnap.exists) return badRequest("session_not_found", "invalid_input");
      const bookingConf = sessionSnap.get("bookingConfirmation");
      if (!bookingConf?.confirmed) {
        return badRequest("booking_not_confirmed", "invalid_input");
      }
      if (String(sessionSnap.get("outcome") ?? "") === "success" && sessionSnap.get("bookingId")) {
        return {
          ok: true,
          sessionId: sid.sessionId,
          action: body.action,
          bookingId: String(sessionSnap.get("bookingId")),
          billingEventId: sessionSnap.get("billingEventId") ? String(sessionSnap.get("billingEventId")) : void 0,
          outcome: "success"
        };
      }
      const locationId = body.locationId ?? String(sessionSnap.get("locationId") ?? "");
      if (!locationId) return badRequest("missing_locationId", "invalid_input");
      const slotState = sessionSnap.get("bookingSlotState");
      const sessionIntent = String(sessionSnap.get("detectedIntent") ?? sessionSnap.get("intent") ?? "");
      const stayIntent = sessionIntent === "stay_booking";
      const stayInquiryFlow = tenant.businessType === "hospitality_stay" || stayIntent;
      const occ = parseOccupancyGuestCounts(slotState?.occupancy);
      const stayIn = normalizeStayDateInput(slotState?.stayCheckIn);
      const stayOut = normalizeStayDateInput(slotState?.stayCheckOut);
      const roomOrService = typeof body.extractedPayload?.roomUnitLabel === "string" ? String(body.extractedPayload.roomUnitLabel) : slotState?.service?.trim();
      let notes = typeof body.extractedPayload?.notes === "string" ? String(body.extractedPayload.notes) : void 0;
      if (stayInquiryFlow) {
        notes = buildHospitalityStayInquiryNotes(notes);
      }
      const cmd = {
        tenantId: sid.tenantId,
        locationId,
        businessType: tenant.businessType,
        serviceIds: body.serviceIds ?? [],
        resourceIds: body.resourceIds ?? [],
        resourceCandidateIds: body.resourceCandidateIds,
        startsAtMs: Number(body.startsAtMs),
        endsAtMs: Number(body.endsAtMs),
        customerPhoneE164: body.from ?? (sessionSnap.get("phoneNumber") ? String(sessionSnap.get("phoneNumber")) : void 0),
        customerName: body.customerName ?? slotState?.name,
        partySize: body.partySize ?? occ.adults,
        idempotencyKey: bookingIdempotencyKey(sid.sessionId, slotDigest),
        sourceCallSessionId: sid.sessionId,
        notes,
        stayCheckInDate: stayIn,
        stayCheckOutDate: stayOut,
        adults: occ.adults,
        children: occ.children,
        roomUnitLabel: roomOrService,
        ...stayInquiryFlow ? {
          billable: false,
          isInquiryOnly: true,
          treatAsStayInquiry: tenant.businessType !== "hospitality_stay" && stayIntent
        } : {}
      };
      const result = await commitBooking(db2, noopRepos, cmd);
      if (!result.ok) {
        const mapped = mapBookingCodeToCallFailure(result.code, result.message);
        await markCallSessionBookingFailure(
          db2,
          sid.tenantId,
          sid.sessionId,
          mapped.failureCode,
          mapped.failureReason
        );
        return {
          ok: false,
          error: mapped.failureReason,
          failureCode: mapped.failureCode,
          sessionId: sid.sessionId
        };
      }
      await markCallSessionBookingSuccess(db2, sid.tenantId, sid.sessionId, result.booking.id, result.billingEventId, {
        staffHandoffSummary: result.booking.staffHandoffSummary
      });
      import_v27.logger.info("[b2bVoice] commit_booking_success", {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        bookingId: result.booking.id,
        billingEventId: result.billingEventId,
        externalCallId: body.externalCallId
      });
      return {
        ok: true,
        sessionId: sid.sessionId,
        action: body.action,
        bookingId: result.booking.id,
        billingEventId: result.billingEventId,
        outcome: "success"
      };
    }
    case "commit_order": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] commit_order_attempt", {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        externalCallId: body.externalCallId
      });
      if (body.confirmed !== true) {
        return badRequest("commit_order_requires_confirmed_true", "invalid_input");
      }
      const orderDigest = body.orderDigest?.trim();
      if (!orderDigest) return badRequest("missing_orderDigest", "invalid_input");
      if (body.windowStartMs == null || body.windowEndMs == null) {
        return badRequest("missing_window_bounds", "invalid_input");
      }
      const lines = parseVoiceOrderCommitLines(body.lines);
      if (!lines) return badRequest("invalid_order_lines", "invalid_input");
      const tenant = await loadTenant(db2, sid.tenantId);
      if (!tenant) return badRequest("tenant_not_found", "tenant_not_found");
      const sessionRef = db2.doc(`${callSessionsCollectionPath(sid.tenantId)}/${sid.sessionId}`);
      const sessionSnap = await sessionRef.get();
      if (!sessionSnap.exists) return badRequest("session_not_found", "invalid_input");
      if (String(sessionSnap.get("outcome") ?? "") === "success" && sessionSnap.get("orderId")) {
        return {
          ok: true,
          sessionId: sid.sessionId,
          action: body.action,
          orderId: String(sessionSnap.get("orderId")),
          orderBillingEventId: sessionSnap.get("orderBillingEventId") ? String(sessionSnap.get("orderBillingEventId")) : void 0,
          outcome: "success"
        };
      }
      const locationId = body.locationId ?? String(sessionSnap.get("locationId") ?? "");
      if (!locationId) return badRequest("missing_locationId", "invalid_input");
      const fulfillment = body.fulfillment === "delivery" ? "delivery" : "pickup";
      const lineClarifications = parseVoiceOrderLineClarifications(body.lineClarifications);
      const palletOrVolumeHint = typeof body.palletOrVolumeHint === "string" ? body.palletOrVolumeHint.trim() : void 0;
      const ocmd = {
        tenantId: sid.tenantId,
        locationId,
        businessType: tenant.businessType,
        lines,
        fulfillment,
        windowStartMs: Number(body.windowStartMs),
        windowEndMs: Number(body.windowEndMs),
        customerPhoneE164: body.from ?? (sessionSnap.get("phoneNumber") ? String(sessionSnap.get("phoneNumber")) : void 0),
        customerName: typeof body.customerName === "string" ? body.customerName : sessionSnap.get("bookingSlotState")?.name,
        deliveryAddress: typeof body.extractedPayload?.deliveryAddress === "string" ? String(body.extractedPayload.deliveryAddress) : void 0,
        idempotencyKey: orderIdempotencyKey(sid.sessionId, orderDigest),
        sourceCallSessionId: sid.sessionId,
        lineClarifications,
        palletOrVolumeHint,
        /** Voice intake: never debit until wholesale staff confirmation path or explicit billable create. */
        billable: false
      };
      const oresult = await commitOrder(db2, noopRepos, ocmd);
      if (!oresult.ok) {
        const mapped = mapOrderCodeToCallFailure(oresult.code, oresult.message);
        await markCallSessionBookingFailure(
          db2,
          sid.tenantId,
          sid.sessionId,
          mapped.failureCode,
          mapped.failureReason
        );
        return {
          ok: false,
          error: mapped.failureReason,
          failureCode: mapped.failureCode,
          sessionId: sid.sessionId
        };
      }
      await markCallSessionOrderSuccess(
        db2,
        sid.tenantId,
        sid.sessionId,
        oresult.order.id,
        oresult.billingEventId,
        { staffHandoffSummary: oresult.order.staffHandoffSummary }
      );
      import_v27.logger.info("[b2bVoice] commit_order_success", {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        orderId: oresult.order.id,
        orderBillingEventId: oresult.billingEventId,
        externalCallId: body.externalCallId
      });
      return {
        ok: true,
        sessionId: sid.sessionId,
        action: body.action,
        orderId: oresult.order.id,
        orderBillingEventId: oresult.billingEventId,
        outcome: "success"
      };
    }
    case "finalize_session": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] finalize_session", { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      await finalizeCallSession(db2, sid.tenantId, sid.sessionId);
      return { ok: true, sessionId: sid.sessionId, action: body.action };
    }
    default:
      return badRequest("unknown_action", "invalid_input");
  }
}

// src/aiProxyRateLimit.ts
var buckets = /* @__PURE__ */ new Map();
var PRUNE_EVERY = 500;
var pruneCounter = 0;
function takeAiProxyRateSlot(uid, maxPerWindow, windowMs) {
  if (maxPerWindow <= 0) return true;
  const now = Date.now();
  const cur = buckets.get(uid);
  if (!cur || now - cur.windowStart >= windowMs) {
    buckets.set(uid, { windowStart: now, count: 1 });
    pruneCounter += 1;
    if (pruneCounter >= PRUNE_EVERY) {
      pruneCounter = 0;
      for (const [k, v] of buckets) {
        if (now - v.windowStart > windowMs * 3) buckets.delete(k);
      }
    }
    return true;
  }
  if (cur.count >= maxPerWindow) return false;
  cur.count += 1;
  return true;
}

// src/aiProxyValidation.ts
var AI_PROXY_MAX_BODY_BYTES = 6 * 1024 * 1024;
var CHAT_MAX_MESSAGES = 48;
var CHAT_MAX_TOTAL_TEXT_CHARS = 2e5;
var CHAT_MAX_SINGLE_STRING = 1e5;
var CHAT_MAX_IMAGE_DATA_URL_CHARS = 45e5;
var CHAT_MAX_IMAGE_PARTS = 8;
var STT_MAX_BASE64_CHARS = 12e6;
var TTS_MAX_CHARS = 4096;
var ALLOWED_TTS_VOICES = /* @__PURE__ */ new Set(["nova", "alloy", "shimmer"]);
var ALLOWED_STT_MIME = /* @__PURE__ */ new Set([
  "audio/mp4",
  "audio/m4a",
  "audio/mpeg",
  "audio/webm",
  "audio/wav",
  "audio/x-m4a",
  "video/mp4"
]);
function validateImageParts(content) {
  if (typeof content === "string" || !Array.isArray(content)) return { ok: true };
  let images = 0;
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const p = part;
    if (p.type !== "image_url") continue;
    images += 1;
    if (images > CHAT_MAX_IMAGE_PARTS) return { ok: false, error: "chat_too_many_images" };
    const url = p.image_url?.url;
    if (typeof url !== "string" || url.length === 0) return { ok: false, error: "chat_invalid_image_url" };
    if (url.length > CHAT_MAX_IMAGE_DATA_URL_CHARS) return { ok: false, error: "chat_image_payload_too_large" };
    const lower = url.slice(0, 32).toLowerCase();
    if (!lower.startsWith("data:image/") && !lower.startsWith("https://") && !lower.startsWith("http://")) {
      return { ok: false, error: "chat_image_url_not_allowed" };
    }
  }
  return { ok: true };
}
function parseAndValidateChatPayload(body) {
  const raw = body.messages;
  if (!Array.isArray(raw)) return { ok: false, error: "chat_messages_required" };
  if (raw.length === 0 || raw.length > CHAT_MAX_MESSAGES) return { ok: false, error: "chat_messages_count_invalid" };
  const messages = [];
  let totalText = 0;
  for (const m of raw) {
    if (!m || typeof m !== "object") return { ok: false, error: "chat_message_invalid" };
    const role = m.role;
    if (role !== "system" && role !== "user" && role !== "assistant") {
      return { ok: false, error: "chat_role_invalid" };
    }
    const content = m.content;
    if (content === void 0) return { ok: false, error: "chat_content_missing" };
    if (typeof content === "string") {
      if (content.length > CHAT_MAX_SINGLE_STRING) return { ok: false, error: "chat_content_too_long" };
      totalText += content.length;
    } else if (Array.isArray(content)) {
      const img = validateImageParts(content);
      if (!img.ok) return img;
      for (const part of content) {
        if (!part || typeof part !== "object") return { ok: false, error: "chat_part_invalid" };
        const p = part;
        if (p.type === "text") {
          if (typeof p.text !== "string") return { ok: false, error: "chat_text_part_invalid" };
          totalText += p.text.length;
        } else if (p.type === "image_url") {
        } else {
          return { ok: false, error: "chat_part_type_not_allowed" };
        }
      }
    } else {
      return { ok: false, error: "chat_content_type_invalid" };
    }
    messages.push({ role, content });
  }
  if (totalText > CHAT_MAX_TOTAL_TEXT_CHARS) return { ok: false, error: "chat_total_text_too_large" };
  let temperature = typeof body.temperature === "number" ? body.temperature : 0.6;
  if (!Number.isFinite(temperature)) temperature = 0.6;
  temperature = Math.min(2, Math.max(0, temperature));
  let maxTokens = typeof body.maxTokens === "number" ? body.maxTokens : 240;
  if (!Number.isFinite(maxTokens)) maxTokens = 240;
  maxTokens = Math.min(8192, Math.max(1, Math.floor(maxTokens)));
  return { ok: true, messages, temperature, maxTokens };
}
function validateSttPayload(body) {
  const base64Audio = typeof body.base64Audio === "string" ? body.base64Audio : "";
  if (!base64Audio) return { ok: false, error: "stt_audio_missing" };
  if (base64Audio.length > STT_MAX_BASE64_CHARS) return { ok: false, error: "stt_audio_too_large" };
  const mimeRaw = typeof body.mime === "string" && body.mime.trim() ? body.mime.trim() : "audio/mp4";
  const mime = mimeRaw.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_STT_MIME.has(mime)) return { ok: false, error: "stt_mime_not_allowed" };
  return { ok: true, base64Audio, mime: mimeRaw };
}
function validateTtsPayload(body) {
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return { ok: false, error: "tts_text_missing" };
  if (text.length > TTS_MAX_CHARS) return { ok: false, error: "tts_text_too_long" };
  const v = String(body.voice ?? "nova");
  if (!ALLOWED_TTS_VOICES.has(v)) return { ok: false, error: "tts_voice_invalid" };
  return { ok: true, text, voice: v };
}
function requestBodyByteLength(req) {
  const raw = req.rawBody;
  if (Buffer.isBuffer(raw)) return raw.length;
  if (typeof raw === "string") return Buffer.byteLength(raw, "utf8");
  return 0;
}

// src/payments/paymentReceiptModel.ts
var PAYMENT_RECEIPTS_COLLECTION = "platform_payment_receipts";
function paymentReceiptDocPath(paymentEventId) {
  const safe = paymentEventId.trim().replace(/\//g, "_");
  return `${PAYMENT_RECEIPTS_COLLECTION}/${safe}`;
}

// src/security.ts
var import_node_crypto = require("node:crypto");
var REPLAY_WINDOW_MS = 5 * 60 * 1e3;
function sig(secret, ts, body) {
  return (0, import_node_crypto.createHmac)("sha256", secret).update(`${ts}.${body}`).digest("hex");
}
function verifySignedRequest(req, secret) {
  const ts = String(req.header("x-ketnoi-ts") ?? "");
  const incoming = String(req.header("x-ketnoi-signature") ?? "");
  if (!ts || !incoming) return { ok: false, reason: "missing_signature_headers" };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, reason: "invalid_timestamp" };
  if (Math.abs(Date.now() - tsNum) > REPLAY_WINDOW_MS) return { ok: false, reason: "replay_window_exceeded" };
  const bodyRaw = typeof req.rawBody === "string" ? req.rawBody : Buffer.from(req.rawBody ?? "").toString("utf8");
  const expected = sig(secret, ts, bodyRaw);
  const a = Buffer.from(expected);
  const b = Buffer.from(incoming);
  if (a.length !== b.length) return { ok: false, reason: "signature_mismatch" };
  if (!(0, import_node_crypto.timingSafeEqual)(a, b)) return { ok: false, reason: "signature_mismatch" };
  return { ok: true };
}

// src/openaiProxy.ts
var OPENAI_BASE = "https://api.openai.com/v1";
var OPENAI_KEY = process.env.OPENAI_API_KEY?.trim() ?? "";
function authHeaders() {
  if (!OPENAI_KEY) throw new Error("openai_key_missing");
  return { Authorization: `Bearer ${OPENAI_KEY}` };
}
async function proxyChat(messages, temperature = 0.6, maxTokens = 240) {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature, max_tokens: maxTokens, messages })
  });
  if (!res.ok) throw new Error(`openai_chat_${res.status}`);
  return await res.json();
}
async function proxyStt(base64Audio, mime = "audio/mp4") {
  const binary = Buffer.from(base64Audio, "base64");
  const form = new FormData();
  form.append("model", "whisper-1");
  form.append("file", new File([binary], "recording.m4a", { type: mime }));
  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: form
  });
  if (!res.ok) throw new Error(`openai_stt_${res.status}`);
  return await res.json();
}
async function proxyTts(text, voice) {
  const res = await fetch(`${OPENAI_BASE}/audio/speech`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1", input: text.slice(0, 4096), voice, response_format: "mp3" })
  });
  if (!res.ok) throw new Error(`openai_tts_${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr).toString("base64");
}

// src/walletAuth.ts
var import_auth = require("firebase-admin/auth");
async function requireFirebaseBearerUser(req) {
  const raw = String(req.header("authorization") ?? req.header("Authorization") ?? "");
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "missing_bearer_token" };
  try {
    const decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: "invalid_id_token" };
  }
}
async function requireFirebaseBearerUserDecoded(req) {
  const raw = String(req.header("authorization") ?? req.header("Authorization") ?? "");
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "missing_bearer_token" };
  try {
    const decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
    return { ok: true, uid: decoded.uid, decoded };
  } catch {
    return { ok: false, status: 401, error: "invalid_id_token" };
  }
}

// src/b2b/staff/b2bStaffQueueSnapshot.ts
var import_firestore6 = require("firebase-admin/firestore");
var import_v28 = require("firebase-functions/v2");
var import_https = require("firebase-functions/v2/https");

// ../src/services/b2b/merchant/staffQueueLabels.ts
function operationalLineForBooking(b) {
  const stay = b.b2bVertical === "hospitality_stay";
  if (b.isInquiryOnly === true || stay && b.status === "pending_confirm") {
    return stay ? "L\u01B0u tr\xFA \xB7 ghi nh\u1EADn y\xEAu c\u1EA7u (inquiry) \u2014 kh\xF4ng ph\u1EA3i x\xE1c nh\u1EADn ph\xF2ng/gi\xE1 cu\u1ED1i; ch\u01B0a debit usage tr\xEAn lu\u1ED3ng inquiry." : "Ghi nh\u1EADn / ch\u1EDD x\xE1c nh\u1EADn \u2014 ki\u1EC3m tra billing event tr\u01B0\u1EDBc khi coi l\xE0 \u0111\xE3 t\xEDnh ph\xED.";
  }
  if (b.status === "pending_confirm") return "Ch\u1EDD x\xE1c nh\u1EADn n\u1ED9i b\u1ED9.";
  if (b.status === "confirmed") return "\u0110\xE3 x\xE1c nh\u1EADn \u2014 ki\u1EC3m tra ledger n\u1EBFu c\u1EA7n bi\u1EBFt \u0111\xE3 debit usage hay ch\u01B0a.";
  return `Tr\u1EA1ng th\xE1i: ${b.status}`;
}
function operationalLineForOrder(o) {
  const wholesale = o.orderSegment === "wholesale" || o.b2bVertical === "grocery_wholesale";
  if (!wholesale) {
    if (o.status === "pending_confirm") return "\u0110\u01A1n retail \xB7 ch\u1EDD x\xE1c nh\u1EADn \u2014 ch\u01B0a ch\u1EAFc \u0111\xE3 debit.";
    return `\u0110\u01A1n retail \xB7 ${o.status}`;
  }
  const q = o.wholesaleQualification ?? "needs_clarification";
  if (q === "needs_clarification") return "\u0110\u1ED5 h\xE0ng \xB7 c\u1EA7n l\xE0m r\xF5 d\xF2ng h\xE0ng \u2014 ch\u01B0a debit usage (giai \u0111o\u1EA1n intake).";
  if (q === "qualified_pending_confirm")
    return "\u0110\u1ED5 h\xE0ng \xB7 \u0111\u1EE7 \u0111i\u1EC1u ki\u1EC7n s\u01A1 b\u1ED9 \u2014 ch\u1EDD x\xE1c nh\u1EADn fulfillment; ch\u01B0a ch\u1EAFc \u0111\xE3 debit.";
  if (q === "confirmed_for_fulfillment")
    return "\u0110\u1ED5 h\xE0ng \xB7 \u0111\xE3 x\xE1c nh\u1EADn fulfillment \u2014 ki\u1EC3m tra billing event cho usage debit.";
  return `\u0110\u1ED5 h\xE0ng \xB7 ${q}`;
}
function escalationHintFromHandoffBlock(text) {
  const m = text.match(/Escalation:\s*([^\n]+)/);
  if (!m) return void 0;
  const v = m[1].trim();
  if (v === "none") return void 0;
  return v.replace(/_/g, " ");
}

// ../src/services/b2b/merchant/staffQueueRowMapping.ts
function timestampLabel(v) {
  if (v && typeof v === "object" && "toDate" in v && typeof v.toDate === "function") {
    try {
      return v.toDate().toLocaleString();
    } catch {
      return "\u2014";
    }
  }
  return "\u2014";
}
function docToBookingLite(id, d) {
  try {
    return {
      id,
      tenantId: String(d.tenantId ?? ""),
      locationId: String(d.locationId ?? ""),
      status: d.status,
      customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : void 0,
      customerName: d.customerName ? String(d.customerName) : void 0,
      serviceIds: Array.isArray(d.serviceIds) ? d.serviceIds : [],
      resourceIds: Array.isArray(d.resourceIds) ? d.resourceIds : [],
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      idempotencyKey: String(d.idempotencyKey ?? ""),
      sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : void 0,
      notes: d.notes ? String(d.notes) : void 0,
      partySize: typeof d.partySize === "number" ? d.partySize : void 0,
      b2bVertical: d.b2bVertical,
      stayCheckInDate: d.stayCheckInDate ? String(d.stayCheckInDate) : void 0,
      stayCheckOutDate: d.stayCheckOutDate ? String(d.stayCheckOutDate) : void 0,
      adults: typeof d.adults === "number" ? d.adults : void 0,
      children: typeof d.children === "number" ? d.children : void 0,
      roomUnitLabel: d.roomUnitLabel ? String(d.roomUnitLabel) : void 0,
      isInquiryOnly: d.isInquiryOnly === true,
      staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    };
  } catch {
    return null;
  }
}
function docToOrderLite(id, d) {
  try {
    return {
      id,
      tenantId: String(d.tenantId ?? ""),
      locationId: String(d.locationId ?? ""),
      status: d.status,
      lines: Array.isArray(d.lines) ? d.lines : [],
      customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : void 0,
      customerName: d.customerName ? String(d.customerName) : void 0,
      fulfillment: d.fulfillment ?? "pickup",
      windowStart: d.windowStart,
      windowEnd: d.windowEnd,
      idempotencyKey: String(d.idempotencyKey ?? ""),
      sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : void 0,
      deliveryAddress: d.deliveryAddress ? String(d.deliveryAddress) : void 0,
      b2bVertical: d.b2bVertical,
      orderSegment: d.orderSegment,
      wholesaleQualification: d.wholesaleQualification,
      lineClarifications: Array.isArray(d.lineClarifications) ? d.lineClarifications : void 0,
      palletOrVolumeHint: d.palletOrVolumeHint ? String(d.palletOrVolumeHint) : void 0,
      staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    };
  } catch {
    return null;
  }
}
function liveStaffQueueRowFromBookingDoc(docId, d, queueDataSource) {
  const b = docToBookingLite(docId, d);
  if (!b) return null;
  const handoff = b.staffHandoffSummary?.trim() || "(Ch\u01B0a c\xF3 staffHandoffSummary tr\xEAn document \u2014 ki\u1EC3m tra phi\xEAn b\u1EA3n backend.)";
  const op = operationalLineForBooking(b);
  return {
    id: docId,
    source: "booking",
    updatedAtLabel: timestampLabel(d.updatedAt ?? d.createdAt),
    customerLabel: b.customerName ?? b.customerPhoneE164 ?? "\u2014",
    headline: b.b2bVertical === "hospitality_stay" ? `L\u01B0u tr\xFA \xB7 ${b.stayCheckInDate ?? "?"} \u2192 ${b.stayCheckOutDate ?? "?"}` : `Booking \xB7 ${b.status}`,
    operationalLine: op,
    escalationHint: escalationHintFromHandoffBlock(handoff),
    staffHandoffSummary: handoff,
    b2bVertical: b.b2bVertical,
    bookingStatus: b.status,
    isInquiryOnly: b.isInquiryOnly === true,
    queueDataSource
  };
}
function liveStaffQueueRowFromOrderDoc(docId, d, queueDataSource) {
  const o = docToOrderLite(docId, d);
  if (!o) return null;
  const handoff = o.staffHandoffSummary?.trim() || "(Ch\u01B0a c\xF3 staffHandoffSummary tr\xEAn document.)";
  const lineHint = o.lines[0] ? `${o.lines[0].name} \xD7 ${o.lines[0].quantity}` : "\u0110\u01A1n h\xE0ng";
  return {
    id: docId,
    source: "order",
    updatedAtLabel: timestampLabel(d.updatedAt ?? d.createdAt),
    customerLabel: o.customerName ?? o.customerPhoneE164 ?? "\u2014",
    headline: `\u0110\u01A1n \xB7 ${lineHint}`,
    operationalLine: operationalLineForOrder(o),
    escalationHint: escalationHintFromHandoffBlock(handoff),
    staffHandoffSummary: handoff,
    b2bVertical: o.b2bVertical,
    orderStatus: o.status,
    wholesaleQualification: o.wholesaleQualification,
    queueDataSource
  };
}

// src/b2b/staff/b2bStaffQueueSnapshot.ts
var B2B_TENANT_CLAIM = "b2bTenantId";
function parseLimit(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 40);
}
async function handle(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const ac = await verifyAppCheckForRequest(req, "b2bStaffQueue");
  if (!ac.ok) {
    import_v28.logger.warn("[b2b_staff_queue_snapshot] denied", {
      trust_surface: "b2b_staff_queue_snapshot",
      gate: "app_check",
      status: ac.status,
      error: ac.error
    });
    res.status(ac.status).json({ ok: false, error: ac.error });
    return;
  }
  const auth = await requireFirebaseBearerUserDecoded(req);
  if (!auth.ok) {
    import_v28.logger.warn("[b2b_staff_queue_snapshot] denied", {
      trust_surface: "b2b_staff_queue_snapshot",
      gate: "firebase_bearer",
      status: auth.status,
      error: auth.error
    });
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }
  const claimRaw = auth.decoded[B2B_TENANT_CLAIM];
  const tenantId = typeof claimRaw === "string" ? claimRaw.trim() : "";
  if (!tenantId) {
    import_v28.logger.warn("[b2b_staff_queue_snapshot] denied", {
      trust_surface: "b2b_staff_queue_snapshot",
      gate: "b2b_tenant_claim",
      error: "b2b_tenant_claim_missing"
    });
    res.status(403).json({ ok: false, error: "b2b_tenant_claim_missing" });
    return;
  }
  const lim = parseLimit(typeof req.query?.limit === "string" ? req.query.limit : void 0, 12);
  const db2 = (0, import_firestore6.getFirestore)();
  const rows = [];
  const errs = [];
  try {
    const bSnap = await db2.collection(B2B_ROOT.tenants).doc(tenantId).collection(B2B_ROOT.bookings).orderBy("createdAt", "desc").limit(lim).get();
    for (const doc of bSnap.docs) {
      const row = liveStaffQueueRowFromBookingDoc(doc.id, doc.data(), "functions_https");
      if (row) rows.push(row);
    }
  } catch (e) {
    errs.push(`business_bookings: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    const oSnap = await db2.collection(B2B_ROOT.tenants).doc(tenantId).collection(B2B_ROOT.orders).orderBy("createdAt", "desc").limit(lim).get();
    for (const doc of oSnap.docs) {
      const row = liveStaffQueueRowFromOrderDoc(doc.id, doc.data(), "functions_https");
      if (row) rows.push(row);
    }
  } catch (e) {
    errs.push(`business_orders: ${e instanceof Error ? e.message : String(e)}`);
  }
  rows.sort((a, b) => b.updatedAtLabel.localeCompare(a.updatedAtLabel));
  const sliced = rows.slice(0, lim * 2);
  import_v28.logger.info("[b2b_staff_queue_snapshot] ok", {
    trust_surface: "b2b_staff_queue_snapshot",
    firebaseUid: auth.uid,
    tenantId,
    rowCount: sliced.length,
    errors: errs.length ? errs : void 0
  });
  if (errs.length && sliced.length === 0) {
    res.status(200).json({
      ok: true,
      rows: [],
      partialWarning: errs.join(" | "),
      error: null
    });
    return;
  }
  res.status(200).json({
    ok: true,
    rows: sliced,
    partialWarning: errs.length ? `M\u1ED9t ph\u1EA7n l\u1ED7i: ${errs.join(" | ")}` : null
  });
}
var b2bStaffQueueSnapshot = (0, import_https.onRequest)(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 60,
    memory: "256MiB"
  },
  async (req, res) => {
    try {
      await handle(req, res);
    } catch (e) {
      import_v28.logger.error("[b2b_staff_queue_snapshot] unhandled", {
        trust_surface: "b2b_staff_queue_snapshot",
        message: e instanceof Error ? e.message : String(e)
      });
      res.status(500).json({ ok: false, error: "internal" });
    }
  }
);

// src/index.ts
var db = (0, import_firestore7.getFirestore)();
var B2B_WEBHOOK_SECRET = process.env.B2B_WEBHOOK_SECRET?.trim() ?? "";
async function receiptAllowsTopup(fs, paymentEventId, walletUid, creditsAmount) {
  if (process.env.WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT?.trim() !== "1") {
    return { ok: true };
  }
  const snap = await fs.doc(paymentReceiptDocPath(paymentEventId)).get();
  if (!snap.exists) return { ok: false, error: "payment_receipt_missing" };
  const r = snap.data();
  if (r.status !== "paid") return { ok: false, error: "payment_receipt_not_paid" };
  if (process.env.WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID?.trim() === "1") {
    if (!r.walletUid || typeof r.walletUid !== "string") {
      return { ok: false, error: "payment_receipt_wallet_uid_required" };
    }
  }
  if (r.walletUid && r.walletUid !== walletUid) return { ok: false, error: "payment_receipt_wallet_mismatch" };
  const grant = r.creditsToGrant;
  const strictCredits = process.env.WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT?.trim() === "1";
  if (strictCredits) {
    if (typeof grant !== "number" || !Number.isFinite(grant) || grant <= 0) {
      return { ok: false, error: "payment_receipt_credits_grant_required" };
    }
    if (grant !== creditsAmount) return { ok: false, error: "payment_receipt_amount_mismatch" };
  } else if (typeof grant === "number" && grant !== creditsAmount) {
    return { ok: false, error: "payment_receipt_amount_mismatch" };
  }
  return { ok: true };
}
var AI_PROXY_REQUIRE_AUTH = process.env.AI_PROXY_REQUIRE_AUTH?.trim() !== "0";
var AI_PROXY_MAX_RPM = Math.max(0, Number.parseInt(process.env.AI_PROXY_MAX_RPM ?? "120", 10) || 120);
var AI_PROXY_RATE_WINDOW_MS = Math.max(1e4, Number.parseInt(process.env.AI_PROXY_RATE_WINDOW_MS ?? "60000", 10) || 6e4);
logRuntimeTrustPostureOnce();
function adminPhoneRouteRepo2() {
  return {
    async getByInboundE164(_db, e164) {
      const snap = await db.doc(phoneRouteDocPath(e164)).get();
      if (!snap.exists) return null;
      const d = snap.data();
      if (!d?.tenantId || !d?.locationId) return null;
      return {
        tenantId: String(d.tenantId),
        locationId: String(d.locationId),
        inboundNumberE164: String(d.inboundNumberE164 ?? e164)
      };
    }
  };
}
var reposStub = {
  phoneRoute: adminPhoneRouteRepo2()
};
var b2bInboundVoiceWebhook = (0, import_https2.onRequest)(
  {
    region: "europe-west1",
    cors: false,
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: "missing_webhook_secret" });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? "unauthorized" });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    if (body.action && body.externalCallId) {
      const result = await processVoiceOrchestrationRequest(db, body);
      res.status(result.ok ? 200 : 400).json(result);
      return;
    }
    res.status(501).json({
      error: "not_implemented",
      hint: "POST JSON { action, externalCallId, ... } for pipeline, or implement Twilio/form parser \u2192 processVoiceOrchestrationRequest."
    });
  }
);
var b2bVoiceOrchestrationHook = (0, import_https2.onRequest)(
  {
    region: "europe-west1",
    timeoutSeconds: 120,
    memory: "512MiB"
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: "missing_webhook_secret" });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? "unauthorized" });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const raw = typeof req.body === "object" && req.body !== null ? req.body : {};
    if (!raw.action || !raw.externalCallId) {
      const to = String(raw.to ?? req.query?.to ?? "");
      if (!to) {
        res.status(400).json({ ok: false, error: "missing_action_or_externalCallId_and_to" });
        return;
      }
      const route = await resolveTenantByPhone(db, reposStub, { inboundNumberE164: to });
      if (!route) {
        res.status(404).json({ ok: false, error: "tenant_not_found", failureCode: "tenant_not_found" });
        return;
      }
      res.status(200).json({ ok: true, tenantId: route.tenantId, locationId: route.locationId });
      return;
    }
    const result = await processVoiceOrchestrationRequest(db, raw);
    const status = result.ok ? 200 : result.failureCode === "tenant_not_found" ? 404 : 400;
    res.status(status).json(result);
  }
);
var b2bOrderStaffOps = (0, import_https2.onRequest)(
  {
    region: "europe-west1",
    timeoutSeconds: 60,
    memory: "256MiB"
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: "missing_webhook_secret" });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? "unauthorized" });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const raw = typeof req.body === "object" && req.body !== null ? req.body : {};
    if (raw.action !== "set_wholesale_qualification" || typeof raw.tenantId !== "string" || typeof raw.orderId !== "string" || !raw.wholesaleQualification) {
      res.status(400).json({ ok: false, error: "invalid_staff_ops_body" });
      return;
    }
    const result = await processOrderStaffOpsRequest(db, raw);
    res.status(result.ok ? 200 : 400).json(result);
  }
);
var aiProxy = (0, import_https2.onRequest)(
  { region: "europe-west1", cors: true, timeoutSeconds: 120, memory: "1GiB" },
  async (req, res) => {
    if (req.method !== "POST") return void res.status(405).send("Method Not Allowed");
    try {
      const byteLen = requestBodyByteLength(req);
      if (byteLen > AI_PROXY_MAX_BODY_BYTES) {
        import_v29.logger.warn("[aiProxy] body_too_large", { byteLen, max: AI_PROXY_MAX_BODY_BYTES });
        return void res.status(413).json({ ok: false, error: "payload_too_large" });
      }
      const acAi = await verifyAppCheckForRequest(req, "aiProxy");
      if (!acAi.ok) {
        import_v29.logger.warn("[aiProxy] denied", { trust_surface: "ai_proxy", gate: "app_check", status: acAi.status, error: acAi.error });
        return void res.status(acAi.status).json({ ok: false, error: acAi.error });
      }
      let uid = "anonymous";
      if (AI_PROXY_REQUIRE_AUTH) {
        const auth = await requireFirebaseBearerUser(req);
        if (!auth.ok) {
          import_v29.logger.warn("[aiProxy] denied", { trust_surface: "ai_proxy", gate: "firebase_bearer", status: auth.status, error: auth.error });
          return void res.status(auth.status).json({ ok: false, error: auth.error });
        }
        uid = auth.uid;
      }
      if (AI_PROXY_MAX_RPM > 0 && uid !== "anonymous") {
        const allowed = takeAiProxyRateSlot(uid, AI_PROXY_MAX_RPM, AI_PROXY_RATE_WINDOW_MS);
        if (!allowed) {
          import_v29.logger.warn("[aiProxy] rate_limited", { firebaseUid: uid });
          return void res.status(429).json({ ok: false, error: "rate_limited" });
        }
      }
      const body = typeof req.body === "object" && req.body !== null ? req.body : {};
      const op = String(body.op ?? "");
      if (op === "chat") {
        const parsed = parseAndValidateChatPayload(body);
        if (!parsed.ok) {
          return void res.status(400).json({ ok: false, error: parsed.error });
        }
        const out = await proxyChat(parsed.messages, parsed.temperature, parsed.maxTokens);
        return void res.status(200).json(out);
      }
      if (op === "stt") {
        const parsed = validateSttPayload(body);
        if (!parsed.ok) return void res.status(400).json({ ok: false, error: parsed.error });
        const out = await proxyStt(parsed.base64Audio, parsed.mime);
        return void res.status(200).json(out);
      }
      if (op === "tts") {
        const parsed = validateTtsPayload(body);
        if (!parsed.ok) return void res.status(400).json({ ok: false, error: parsed.error });
        const audioBase64 = await proxyTts(parsed.text, parsed.voice);
        return void res.status(200).json({ audioBase64 });
      }
      return void res.status(400).json({ ok: false, error: "unknown_op" });
    } catch (e) {
      import_v29.logger.error("[aiProxy] error", e instanceof Error ? e : void 0);
      return void res.status(500).json({ ok: false, error: "proxy_error" });
    }
  }
);
var walletOps = (0, import_https2.onRequest)(
  { region: "europe-west1", cors: true, timeoutSeconds: 60, memory: "256MiB" },
  async (req, res) => {
    if (req.method !== "POST") return void res.status(405).send("Method Not Allowed");
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    if (Object.prototype.hasOwnProperty.call(body, "userId")) {
      return void res.status(400).json({ ok: false, error: "userId_in_body_not_allowed" });
    }
    const acWallet = await verifyAppCheckForRequest(req, "walletOps");
    if (!acWallet.ok) {
      import_v29.logger.warn("[walletOps] denied", { trust_surface: "wallet_ops", gate: "app_check", status: acWallet.status, error: acWallet.error });
      return void res.status(acWallet.status).json({ ok: false, error: acWallet.error });
    }
    const who = await requireFirebaseBearerUser(req);
    if (!who.ok) {
      import_v29.logger.warn("[walletOps] denied", { trust_surface: "wallet_ops", gate: "firebase_bearer", status: who.status, error: who.error });
      return void res.status(who.status).json({ ok: false, error: who.error });
    }
    const userId = who.uid;
    const op = String(body.op ?? "");
    import_v29.logger.info("[walletOps] request", { trust_surface: "wallet_ops", firebaseUid: userId, op });
    const ref = db.collection("wallets").doc(userId);
    if (op === "get") {
      const snap = await ref.get();
      const d = snap.data();
      return void res.status(200).json({
        ok: true,
        credits: typeof d?.credits === "number" ? d.credits : 0,
        lifetimeSpent: typeof d?.lifetimeSpent === "number" ? d.lifetimeSpent : 0
      });
    }
    if (op === "topup") {
      const amount = Number(body.amount ?? 0);
      const paymentEventId = String(body.paymentEventId ?? "").trim().replace(/\//g, "_");
      if (!paymentEventId) return void res.status(400).json({ ok: false, error: "payment_event_id_required" });
      if (!Number.isFinite(amount) || amount <= 0) return void res.status(400).json({ ok: false, error: "invalid_amount" });
      if (paymentEventId.length > 900) return void res.status(400).json({ ok: false, error: "payment_event_id_too_long" });
      const pre = await receiptAllowsTopup(db, paymentEventId, userId, amount);
      if (!pre.ok) {
        import_v29.logger.warn("[walletOps] topup_receipt_denied", { firebaseUid: userId, paymentEventId, error: pre.error });
        return void res.status(409).json({ ok: false, error: pre.error });
      }
      const ledgerRef = ref.collection("verifiedTopups").doc(paymentEventId);
      const result = await db.runTransaction(async (tx) => {
        const led = await tx.get(ledgerRef);
        if (led.exists) {
          const st = String(led.data()?.status ?? "");
          if (st === "applied") return { ok: true, duplicate: true };
        }
        const snap = await tx.get(ref);
        const d = snap.data() ?? {};
        const nextCredits = (d.credits ?? 0) + amount;
        tx.set(
          ref,
          { credits: nextCredits, lifetimeSpent: d.lifetimeSpent ?? 0, updatedAt: import_firestore8.FieldValue.serverTimestamp() },
          { merge: true }
        );
        tx.set(ledgerRef, {
          status: "applied",
          creditsGranted: amount,
          createdAt: import_firestore8.FieldValue.serverTimestamp()
        });
        return { ok: true, duplicate: false };
      });
      import_v29.logger.info("[walletOps] topup", {
        firebaseUid: userId,
        paymentEventId,
        amount,
        duplicate: result.duplicate === true
      });
      return void res.status(200).json({ ok: true, duplicate: result.duplicate === true });
    }
    if (op === "chargeTrustedService") {
      const amount = Number(body.amount ?? 0);
      const idempotencyKey = String(body.idempotencyKey ?? "").trim().replace(/\//g, "_");
      const serviceKind = String(body.serviceKind ?? "").trim();
      const allowed = /* @__PURE__ */ new Set(["leona_outbound", "letan_booking"]);
      if (!allowed.has(serviceKind)) return void res.status(400).json({ ok: false, error: "invalid_service_kind" });
      if (!Number.isFinite(amount) || amount <= 0 || !idempotencyKey) {
        return void res.status(400).json({ ok: false, error: "invalid_charge_trusted" });
      }
      if (idempotencyKey.length > 900) return void res.status(400).json({ ok: false, error: "idempotency_key_too_long" });
      const chargeRef = ref.collection("trustedServiceCharges").doc(idempotencyKey);
      const result = await db.runTransaction(async (tx) => {
        const ch = await tx.get(chargeRef);
        if (ch.exists && String(ch.data()?.status ?? "") === "applied") {
          return { ok: true, duplicate: true };
        }
        const snap = await tx.get(ref);
        const d = snap.data() ?? {};
        const credits = d.credits ?? 0;
        if (credits < amount) return { ok: false, error: "insufficient_credits" };
        const spent = d.lifetimeSpent ?? 0;
        tx.set(
          ref,
          { credits: credits - amount, lifetimeSpent: spent + amount, updatedAt: import_firestore8.FieldValue.serverTimestamp() },
          { merge: true }
        );
        tx.set(chargeRef, {
          status: "applied",
          serviceKind,
          amount,
          createdAt: import_firestore8.FieldValue.serverTimestamp()
        });
        return { ok: true, duplicate: false };
      });
      if (!result.ok) return void res.status(400).json(result);
      import_v29.logger.info("[walletOps] chargeTrustedService", {
        firebaseUid: userId,
        serviceKind,
        amount,
        idempotencyKey,
        duplicate: result.duplicate === true
      });
      return void res.status(200).json({ ok: true, duplicate: result.duplicate === true });
    }
    if (op === "reserve") {
      const amount = Number(body.amount ?? 0);
      const key = String(body.idempotencyKey ?? "");
      if (!Number.isFinite(amount) || amount <= 0 || !key) return void res.status(400).json({ ok: false, error: "invalid_reserve" });
      const holdRef = ref.collection("holds").doc(key);
      const result = await db.runTransaction(async (tx) => {
        const hold = await tx.get(holdRef);
        if (hold.exists) return { ok: true, holdId: key };
        const snap = await tx.get(ref);
        const d = snap.data() ?? {};
        const credits = d.credits ?? 0;
        if (credits < amount) return { ok: false, error: "insufficient_credits" };
        tx.set(ref, { credits: credits - amount, lifetimeSpent: d.lifetimeSpent ?? 0, updatedAt: import_firestore8.FieldValue.serverTimestamp() }, { merge: true });
        tx.set(holdRef, { amount, status: "reserved", createdAt: import_firestore8.FieldValue.serverTimestamp() });
        return { ok: true, holdId: key };
      });
      return void res.status(result.ok ? 200 : 400).json(result);
    }
    if (op === "commit" || op === "rollback") {
      const key = String(body.idempotencyKey ?? "");
      if (!key) return void res.status(400).json({ ok: false, error: "missing_hold_key" });
      const holdRef = ref.collection("holds").doc(key);
      const result = await db.runTransaction(async (tx) => {
        const hold = await tx.get(holdRef);
        if (!hold.exists) return { ok: false, error: "hold_not_found" };
        const h = hold.data();
        if (h.status === "committed" && op === "commit") return { ok: true };
        if (h.status === "rolled_back" && op === "rollback") return { ok: true };
        if (op === "rollback") {
          const snap = await tx.get(ref);
          const d = snap.data() ?? {};
          tx.set(ref, { credits: (d.credits ?? 0) + (h.amount ?? 0), updatedAt: import_firestore8.FieldValue.serverTimestamp() }, { merge: true });
          tx.set(holdRef, { status: "rolled_back", updatedAt: import_firestore8.FieldValue.serverTimestamp() }, { merge: true });
          return { ok: true };
        }
        tx.set(holdRef, { status: "committed", updatedAt: import_firestore8.FieldValue.serverTimestamp() }, { merge: true });
        return { ok: true };
      });
      return void res.status(result.ok ? 200 : 400).json(result);
    }
    import_v29.logger.warn("[walletOps] unknown_op", { trust_surface: "wallet_ops", firebaseUid: userId, op });
    return void res.status(400).json({ ok: false, error: "unknown_wallet_op" });
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  aiProxy,
  b2bInboundVoiceWebhook,
  b2bOrderStaffOps,
  b2bStaffQueueSnapshot,
  b2bVoiceOrchestrationHook,
  walletOps
});
/*! Bundled license information:

@firebase/util/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/component/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/logger/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

@firebase/auth/dist/node-esm/totp-a9833fe5.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/node-esm/totp-a9833fe5.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase/app/dist/index.mjs:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
