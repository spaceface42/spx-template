/**
* SPX ~ Single Page XHR | https://spx.js.org
*
* @license CC BY-NC-ND 4.0
* @version 0.0.1-rc.1
* @copyright 2024 Nikolas Savvidis
*/
var Eo = Object.defineProperty,
    _r = Object.defineProperties;
var Yr = Object.getOwnPropertyDescriptors;
var et = Object.getOwnPropertySymbols;
var vo = Object.prototype.hasOwnProperty,
    To = Object.prototype.propertyIsEnumerable;
var xo = (e, t, o) => t in e ? Eo(e, t, {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: o
    }) : e[t] = o,
    bo = (e, t) => {
        for (var o in t || (t = {}))
            vo.call(t, o) && xo(e, o, t[o]);
        if (et)
            for (var o of et(t))
                To.call(t, o) && xo(e, o, t[o]);
        return e
    },
    No = (e, t) => _r(e, Yr(t));
var Ao = (e, t) => {
    var o = {};
    for (var r in e)
        vo.call(e, r) && t.indexOf(r) < 0 && (o[r] = e[r]);
    if (e != null && et)
        for (var r of et(e))
            t.indexOf(r) < 0 && To.call(e, r) && (o[r] = e[r]);
    return o
};
var Kr = (e, t) => {
    for (var o in t)
        Eo(e, o, {
            get: t[o],
            enumerable: !0
        });
};
var W = typeof window != "undefined" ? window : {
        screen: {},
        navigator: {}
    },
    Te = (W.matchMedia || function() {
        return {
            matches: !1
        }
    }).bind(W),
    Zr = {
        get passive() {
            return !0
        }
    },
    Co = function() {};
W.addEventListener && W.addEventListener("p", Co, Zr);
W.removeEventListener && W.removeEventListener("p", Co, !1);
var Rt = "ontouchstart" in W,
    Qr = "TouchEvent" in W,
    kt = Rt || Qr && Te("(any-pointer: coarse)").matches,
    wo = (W.navigator.maxTouchPoints || 0) > 0 || kt,
    $o = W.navigator.userAgent || "",
    es = Te("(pointer: coarse)").matches && /iPad|Macintosh/.test($o) && Math.min(W.screen.width || 0, W.screen.height || 0) >= 768,
    ts = (Te("(pointer: coarse)").matches || !Te("(pointer: fine)").matches && Rt) && !/Windows.*Firefox/.test($o),
    os = Te("(any-pointer: fine)").matches || Te("(any-hover: hover)").matches || es || !Rt,
    Pe = wo && (os || !ts) ? "hybrid" : wo ? "touchOnly" : "mouseOnly";
var Dt = typeof window != "undefined";
"content" in document.createElement("template");
document.createRange && "createContextualFragment" in document.createRange();
var oe = kt ? "pointer" : "mouse",
    de = window.location.origin,
    Lo = Object.create,
    A = "",
    Mo = () => document.documentElement,
    w = () => document.body,
    tt = () => document.head,
    d = e => e ? Object.assign(Lo(null), e) : Lo(null),
    B = e => new Set(e),
    Oo = e => new Proxy(d(), e),
    q = () => new Map;
var h = class  extends XMLHttpRequest{
    constructor()
    {
        super(...arguments);
        this.key = null;
    }
}
;
h.o = q(),
h.c = q(),
h.r = d();
var y = {
        marks: B(),
        store: void 0,
        snaps: []
    },
    s = {
        index: "",
        eval: !0,
        patched: !1,
        loaded: !1,
        logLevel: 2,
        qs: d(),
        fragments: q(),
        mounted: B(),
        registry: q(),
        instances: q(),
        maps: Oo({
            get: (e, t) => s.instances.get(e[t])
        }),
        events: d(),
        observe: d(),
        memory: d(),
        pages: d(),
        snaps: d(),
        resources: B(),
        config: {
            fragments: ["body"],
            timeout: 3e4,
            globalThis: !0,
            schema: "spx-",
            logLevel: 3,
            cache: !0,
            components: null,
            maxCache: 100,
            reverse: !0,
            preload: null,
            annotate: !1,
            eval: {
                script: null,
                style: null,
                link: null,
                meta: !1
            },
            hover: {
                trigger: "href",
                threshold: 250
            },
            intersect: {
                rootMargin: "0px 0px 0px 0px",
                threshold: 0
            },
            proximity: {
                distance: 75,
                threshold: 250,
                throttle: 500
            },
            progress: {
                bgColor: "#111",
                barHeight: "3px",
                minimum: .08,
                easing: "linear",
                speed: 200,
                threshold: 500,
                trickle: !0,
                trickleSpeed: 200
            }
        }
    };
var It = class  extends Error{
        constructor(o, r)
        {
            super(o);
            this.context = r;
            this.name = "SPX Error",
            r && (this.context = r);
        }
    }
    ,
    ot = "SPX ",
    ss = "\x1B[",
    ns = "\x1B[0m",
    is = (e, t) => ss + e + t + ns,
    v = (e, t="#999") => {
        s.logLevel === 3 && console.debug("%c" + ot + (Array.isArray(e) ? e.join(" ") : e), `color: ${t};`);
    },
    m = (e, t) => {
        s.logLevel >= 1 && (t ? console.warn(ot + e, t) : console.warn(ot + e));
    },
    F = (...e) => {
        s.logLevel === 2 && console.info(ot + is("90m", e.join("")));
    },
    L = (e, t) => {
        throw new It(e, t)
    };
var Po = /&(?:amp|lt|gt|quot|#39|#x2F|#x60|#x3D);/g,
    qo = /^[A-Z]|[_-]/;
var So = /\b(?:append|prepend)/,
    Ho = /\s+/g,
    Se = /^\b(?:true|false)$/i,
    rt = /^\d*\.?\d+$/,
    He = /^(?:[.-]?\d*\.?\d+|NaN)$/;
var Ro = /\b(?:intersect|hover|proximity)\b/;
var ko = /\b(?:SCRIPT|STYLE|LINK)\b/,
    Do = /\[(['"]?.*['"]?,?)\]/,
    Ut = /[xy]\s*|\d*\.?\d+/gi;
var Re = B(),
    Io = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&#x2F;": "/",
        "&#x60;": "`",
        "&#x3D;": "="
    };
var cs = typeof Uint8Array == "undefined" ? [] : [Object.getPrototypeOf(Uint8Array)],
    Uo = "Blob ArrayBuffer DataView FormData URLSearchParams File".split(" ").map(e => globalThis[e]).filter(e => e).concat(cs);
function S(e, t) {
    if (arguments.length === 1)
        return i => S(e, i);
    let o = t.length;
    if (o === 0)
        return;
    let r,
        n = -1;
    for (; ++n < o && (r = e(t[n], n, t), r !== !1);)
        ;
    return r
}
var Fo = e => {
        let t = e.replace(/\s+,/g, ",").replace(/,\s+/g, ",").replace(/['"]/g, "");
        return t.charCodeAt(0) === 91 && (/^\[\s*\[/.test(t) || /,/.test(t) && /\]$/.test(t)) && (t = t.replace(/^\[/, "").replace(/\]$/, "")), t.split(/,|\|/)
    },
    Z = (e, t) => {
        try {
            return JSON.parse(t || e)
        } catch (o) {
            try {
                let r = (t || e).replace(/\\'|'/g, n => n[0] === "\\" ? n : '"').replace(/"(?:\\.|[^"])*"/g, n => n.replace(/\n/g, "\\n")).replace(/\[|[^[\]]*|\]/g, n => /[[\]]/.test(n) ? n : n.split(",").map(i => i.replace(/^(\w+)$/, '"$1"').replace(/^"([\d.]+)"$/g, "$1")).join(",")).replace(/([a-zA-Z0-9_-]+)\s*:/g, '"$1":').replace(/:\s*([$\w-]+)\s*([,\]}])/g, ':"$1"$2').replace(/,(\s*[\]}])/g, "$1").replace(/([a-zA-Z_-]+)\s*,/g, '"$1",').replace(/([\]},\s]+)?"(true|false)"([\s,{}\]]+)/g, "$1$2$3");
                return JSON.parse(r)
            } catch (r) {
                return L("Invalid JSON in attribute value: " + JSON.stringify(e || t, null, 2), r), t
            }
        }
    },
    ke = e => e[e.length - 1],
    Wo = e => e.replace(/\s+/g, " ").trim(),
    jo = e => e.replace(/\./g, "\\.").replace(/@/g, "\\@").replace(/:/g, "\\:"),
    Vo = () => new Promise(e => setTimeout(() => e(), 1)),
    X = (e, t=1, o) => setTimeout(() => e(), t),
    Ft = () => Promise.resolve();
var Wt = e => {
    switch (e.nodeName) {
    case "SCRIPT":
        return e.matches(s.qs.g);
    case "STYLE":
        return e.matches(s.qs.g);
    case "META":
        return e.matches(s.qs.v);
    case "LINK":
        return e.matches(s.qs.T);
    default:
        return e.getAttribute(s.qs.b) !== "false"
    }
};
var ls = e => e.replace(Po, t => Io[t] || t),
    nt = () => new Date().getTime(),
    it = e => {
        let t = typeof e == "object";
        return o => t && o ? typeof o == "string" ? o in e : o.every(r => r ? r in e : !1) : !1
    },
    I = (e, t) => typeof e == "object" ? t in e : !1,
    jt = e => {
        switch (e) {
        case String:
            return "";
        case Boolean:
            return !1;
        case Number:
            return 0;
        case Object:
            return {};
        case Array:
            return [];
        default:
            return e
        }
    },
    Vt = e => {
        let t = d();
        return S(o => {
            let r = o.indexOf(":"),
                n = o.substring(0, r).trim().toLowerCase(),
                i = o.substring(r + 1).trim();
            n === "set-cookie" ? t[n] ? t[n].push(i) : t[n] = [i] : t[n] = i;
        }, e.split(`
`
        )), t
    },
    re = (e, t, o, r=null) => r !== null ? t in e ? e : Object.defineProperty(e, t, {
        get: () => o,
        configurable: r
    }) : Object.defineProperty(e, t, {
        get: () => o
    });
var Bt = e => "target" in e ? e.target.length === 1 && e.target[0] === "body" ? e.target : e.target.includes("body") ? (m(`The body selector passed via ${s.qs.p} will override`), ["body"]) : e.target.filter((t, o, r) => t !== "" && t.indexOf(",") === -1 ? r.indexOf(t) === o : !1) : s.config.fragments.length === 1 && s.config.fragments[0] === "body" ? ["body"] : [],
    Bo = e => {
        let t = e.tagName.toLowerCase();
        if (e.id)
            return t + "#" + e.id;
        if (e.hasAttribute("class")) {
            let o = e.className.trim().replace(/\s+/g, ".");
            o && (t += "." + o);
        }
        return `${t}:nth-child(${Array.prototype.indexOf.call(e.parentNode.children, e) + 1})`
    },
    De = e => e.length === 1 && e[0] === "body" ? "body" : e.length === 0 ? null : e.join(","),
    Ie = e => {
        let t = typeof e;
        if (t === "object") {
            for (let o in e)
                return !1;
            return !0
        }
        return t === "string" ? e[0] === void 0 : Array.isArray(e) ? e.length > 0 : null
    };
var Gt = (e=Math.floor(Math.random() * 89999 + 1e4)) => Re.has(e) ? Gt() : (Re.add(e), e),
    se = function e(t=5) {
        let o = Math.random().toString(36).slice(-t);
        return Re.has(o) ? e(t) : (Re.add(o), o)
    };
var Go = (e=2) => (t, o) => {
        let r = t.length;
        return (r < 1 || t[r - 1].length === e ? t.push([o]) : t[r - 1].push(o)) && t
    },
    Xo = e => e < 1024 ? e + " B" : e < 1048576 ? (e / 1024).toFixed(1) + " KB" : e < 1073741824 ? (e / 1048576).toFixed(1) + " MB" : (e / 1073741824).toFixed(1) + " GB",
    zo = e => e.length === 0 ? "" : e[0].toLowerCase() + e.substring(1),
    _o = e => e.length === 0 ? "" : e[0].toUpperCase() + e.substring(1),
    Xt = e => e.replace(/([a-z0-9])([A-Z])|_+/g, "$1-$2").toLowerCase(),
    Q = e => e.replace(/[-_]+(\w)/g, (t, o) => o.toUpperCase()),
    Yo = e => B([].slice.call(e)),
    z = (e, t) => {
        let o = typeof e == "string" ? w().querySelectorAll(e) : e,
            r = o.length;
        if (r === 0)
            return;
        let n = -1;
        for (; ++n < r && t(o[n], n) !== !1;)
            ;
    },
    zt = e => {
        for (let t in e)
            delete e[t];
    },
    ue = e => new DOMParser().parseFromString(e, "text/html"),
    ge = e => (e || document).documentElement.outerHTML,
    _t = e => {
        let t = e.indexOf("<title");
        if (t === -1 || e.slice(0, t).indexOf("<svg") > -1)
            return A;
        let o = e.indexOf(">", t) + 1,
            r = e.indexOf("</title", o);
        return r === -1 ? A : ls(e.slice(o, r).trim())
    },
    Ko = (e, t) => t.querySelector(e),
    Jo = (e, t) => [].slice.call(t.querySelectorAll(e)) || [],
    at = (e => {
        let t = r => new Promise(n => n(r())),
            o = async (r=2, n=200) => {
                for (; e.length > 0;) {
                    for (let i of e.splice(0, r))
                        await t(i);
                    await new Promise(i => setTimeout(i, n));
                }
            };
        return (...r) => {
            r.forEach(n => e.push(n)),
            X(() => o(), 50);
        }
    })([]);
var Zo = () => {
    if (s.patched)
        return;
    s.patched = !0;
    let e = Element.prototype.setAttribute,
        t = document.createElement("i");
    Element.prototype.setAttribute = function(r, n) {
        if (r.indexOf("@") < 0)
            return e.call(this, r, n);
        t.innerHTML = `<i ${r}="${n}"></i>`;
        let i = t.firstElementChild.getAttributeNode(r);
        t.firstElementChild.removeAttributeNode(i),
        this.setAttributeNode(i);
    };
};
var he = (() => {
    let e = [],
        t = document.createElement("div"),
        o = null,
        r,
        n = null,
        i = ({bgColor: u, barHeight: D, speed: P, easing: _}) => {
            t.style.cssText = `pointer-events:none;background:${u};height:${D};position:fixed;display:block;z-index:2147483647;top:0;left:0;width:100%;will-change:opacity,transform;transition:${P}ms ${_};`;
        },
        a = u => (-1 + u) * 100,
        c = (u, D, P) => Math.max(D, Math.min(P, u)),
        l = () => n || (t.style.transform = `translateX(${a(o || 0)}%)`, n = w().appendChild(t), t),
        p = () => {
            let u = w();
            u.contains(n) ? n.animate({
                opacity: ["1", "0"]
            }, {
                easing: "ease-out",
                duration: 100
            }).onfinish = () => {
                u.removeChild(n),
                n = null;
            } : n = null;
        },
        f = () => {
            let u = e.shift();
            u && u(f);
        },
        x = u => {
            e.push(u),
            e.length === 1 && f();
        },
        g = u => {
            u = c(u, s.config.progress.minimum, 1),
            o = u === 1 ? null : u;
            let D = l();
            x(P => {
                D.style.transform = `translateX(${a(u)}%)`,
                setTimeout(() => (u === 1 && p(), P()), s.config.progress.speed * (u === 1 ? 2 : 1));
            });
        },
        k = u => {
            if (!o)
                return K();
            o < 1 && (u || (u = o < .2 ? .1 : o < .5 ? .04 : o < .8 ? .02 : .005), g(c(o + u, 0, .994)));
        },
        E = () => setTimeout(() => o && (k(), E()), s.config.progress.trickleSpeed),
        K = u => {
            s.config.progress && (r = setTimeout(() => {
                o || g(0),
                s.config.progress.trickle && E();
            }, u || 0));
        };
    return {
        start: K,
        done: u => {
            clearTimeout(r),
            !(!u && !o) && (k(.3 + .5 * Math.random()), g(1));
        },
        style: i
    }
})();
var ct = (e, t) => {
        if (e.define.name !== "")
            return e.define.name;
        let o = e.name,
            r = t,
            n = "define" in e && "name" in e.define;
        return e.define.name = zo(t || o), t !== e.define.name && (t = Q(e.define.name)), n && o !== r && qo.test(e.define.name) && m(`Component name "${e.define.name}" is invalid and converted to: ${t}`), t
    },
    ne = (e, t=!1) => {
        for (let o in e) {
            let r = e[o],
                n = t ? o : ct(r, o);
            s.registry.has(n) || (s.registry.set(n, r), v(`Component ${r.name} registered using id: ${n}`));
        }
        s.config.components || (s.config.components = !0);
    };
function C(e, ...t) {
    let o = e === "cache",
        r = e === "disconnect" ? null : t.length === 1 ? t[0] : t.shift();
    o && (t[0] = ue(t[0]));
    let n = !0;
    return S(i => {
        let a = i.apply(r, t);
        o ? a instanceof Document ? n = a.documentElement.outerHTML : typeof n != "string" && (n = a !== !1) : n = a !== !1;
    }, s.events[e] || []), n
}
var Qo = (e, t, o) => (e in s.events || (s.events[e] = []), s.events[e].push(o ? t.bind(o) : t) - 1),
    er = (e, t) => {
        if (e in s.events) {
            let o = s.events[e];
            if (o && typeof t == "number")
                o.splice(t, 1),
                v(`Removed ${e} event listener (id: ${t})`),
                o.length === 0 && delete s.events[e];
            else {
                let r = [];
                if (o && t)
                    for (let n = 0, i = o.length; n < i; n++)
                        o[n] !== t ? r.push(o[n]) : e !== "x" && v(`Removed ${e} event listener (id: ${n})`);
                r.length ? s.events[e] = r : delete s.events[e];
            }
        } else
            m(`Unknown or invalid event listener: ${e}`);
    };
var lt = (e, t) => {
    let o = t(e);
    if (o === !1)
        return;
    o === 1 && (e = e.nextSibling);
    let r,
        n;
    for (e.firstElementChild && (n = 0, r = e.children[n]); r;)
        r && lt(r, t),
        r = e.children[++n];
};
var tr = (e, t) => `on${e}` in t ? !0 : (L(`Invalid event name "${e}" provided`, t), !1),
    or = (e, t) => {
        let o = e[t.method];
        return function(n) {
            t.attrs && (n.attrs = t.attrs),
            o.call(e, n);
        }
    },
    Ue = (e, t) => {
        t.attached && (t.listener.abort(), t.listener = new AbortController, t.options.signal = t.listener.signal, t.attached = !1, v([`Detached ${t.key} ${t.eventName} event from ${t.method}() method in component`, `${e.scope.define.name}: ${e.scope.key}`], "#D1A9FF"));
    },
    pt = (e, t, o) => {
        if (t.attached)
            return;
        if (!(t.method in e)) {
            m(`Undefined callback method: ${e.scope.define.name}.${t.method}()`);
            return
        }
        let r = o ? re(t, "dom", o).dom : t.dom;
        rr(r.attributes, t),
        t.isWindow ? tr(t.eventName, window) && addEventListener(t.eventName, or(e, t)) : tr(t.eventName, r) && r.addEventListener(t.eventName, or(e, t), t.options),
        t.attached = !0,
        v([`Attached ${t.key} ${t.eventName} event to ${t.method}() method in component`, `${e.scope.define.name}: ${e.scope.key}`], "#7b97ca");
    };
var sr = e => {
    let {scope: t, view: o} = e;
    e.state = new Proxy(t.state, {
        get: Reflect.get,
        set(n, i, a, c) {
            if (i in t.binds) {
                let l = t.binds[i],
                    p = typeof a == "object" || Array.isArray(a) ? JSON.stringify(a) : `${a}`;
                for (let f in l)
                    l[f].live && (l[f].value = p, z(l[f].selector, x => x.innerText = p));
            }
            return Reflect.set(n, i, a, c)
        }
    });
    let r = s.config.schema + t.instanceOf;
    if (Ie(t.state))
        for (let n in t.define.state)
            t.state[n] = jt(t.define.state[n]);
    else
        for (let n in t.define.state) {
            let i = t.define.state[n];
            if (!(n in t.state)) {
                t.state[n] = jt(i);
                continue
            }
            let a = `has${_o(n)}`,
                c = `${r}:${Xt(n)}`;
            console.log(n, Xt(n)),
            o.hasAttribute(c) || (c = `${r}:${n}`);
            let l = o.getAttribute(c),
                p = l !== null && l !== "";
            if (a in t.state || Reflect.set(t.state, a, p), typeof l == "string" && l.startsWith("window.")) {
                let f = l.slice(7);
                f in window ? t.state[n] = window[f] : m(`Property does not exist on window: ${s.qs.s}:${c}="${l}"`);
            } else if (Array.isArray(i))
                t.state[n] = p ? Z(l) : i;
            else {
                let f = typeof i;
                if (f === "object")
                    t.state[n] = p ? Z(l) : i;
                else if (f === "number")
                    t.state[n] = p ? Number(l) : i;
                else if (f === "boolean")
                    t.state[n] = p ? l === "true" : i;
                else if (f === "string")
                    t.state[n] = p ? l : i;
                else
                    switch (i) {
                    case String:
                        t.state[n] = p ? l : "";
                        break;
                    case Boolean:
                        t.state[n] = l === "true" || !1;
                        break;
                    case Number:
                        t.state[n] = l ? Number(l) : 0;
                        break;
                    case Object:
                        t.state[n] = p ? Z(l) : {};
                        break;
                    case Array:
                        t.state[n] = p ? Z(l) : [];
                        break
                    }
            }
        }
};
function be(e) {
    var t;
    return t = class {
        get root()
        {
            return Mo()
        }
        get view()
        {
            return this.scope.dom
        }
        constructor(o)
        {
            Reflect.defineProperty(this, "scope", {
                get() {
                    return be.scopes.get(o)
                }
            }),
            Reflect.defineProperty(this, "ref", {
                value: o,
                configurable: !1,
                enumerable: !1,
                writable: !1
            }),
            sr(this);
        }
    }
    , t.define = Object.assign({
        name: "",
        merge: !1,
        state: {},
        nodes: []
    }, e), t
}
be.scopes = q();
var Ge = {};
Kr(Ge, {
    connect: () => ye,
    disconnect: () => Be,
    hargs: () => mt,
    hook: () => ut,
    mount: () => gt,
    teardown: () => Qt
});
var ir = () => X(() => y.store = void 0),
    Yt = (e, t) => {
        for (let o of t) {
            if (!s.maps[o])
                continue;
            let r = s.maps[o],
                n = o.charCodeAt(0);
            if (n === 99)
                s.mounted.add(r.scope.key),
                r.scope.dom = e,
                r.scope.status = 2,
                v(`Component ${r.scope.define.name} mounted: ${r.scope.key}`, "#6DD093");
            else if (n === 101)
                pt(r, r.scope.events[o], e);
            else if (n === 110)
                for (let i in r.scope.nodes)
                    ++r.scope.nodes[i].live;
            else if (n === 98) {
                for (let i in r.scope.binds)
                    if (o in r.scope.binds[i]) {
                        e.innerText = r.scope.binds[i][o].value,
                        r.scope.binds[i][o].live = !0;
                        break
                    }
            }
        }
    },
    Fe = (e, t) => {
        for (let o of t) {
            if (!s.maps[o])
                continue;
            let r = s.maps[o],
                n = o.charCodeAt(0);
            if (n === 99) {
                r.scope.hooks.unmount === 2 && r.unmount(mt()),
                s.mounted.delete(r.scope.key),
                r.scope.define.merge && (r.scope.snapshot = e.innerHTML, v(`Component ${r.scope.define.name} snapshot: ${r.scope.key}`));
                for (let i in r.scope.nodes)
                    r.scope.nodes[i].live = 0,
                    r.scope.nodes[i].dom.node = void 0,
                    r.scope.nodes[i].dom.nodes = void 0;
                for (let i in r.scope.binds)
                    for (let a in r.scope.binds[i])
                        r.scope.binds[i][a].live = !1;
                for (let i in r.scope.events)
                    Ue(r, r.scope.events[i]);
                r.scope.status = 5,
                v(`Component ${r.scope.define.name} unmounted: ${r.scope.key}`, "#CAAF7C");
            } else if (n === 101)
                Ue(r, r.scope.events[o]);
            else if (n === 110)
                for (let i in r.scope.nodes)
                    --r.scope.nodes[i].live;
            else if (n === 98) {
                for (let i in r.scope.binds)
                    if (o in r.scope.binds[i]) {
                        r.scope.binds[i][o].live = !1;
                        break
                    }
            }
        }
    },
    We = e => {
        if (e.nodeType !== 1 && e.nodeType !== 11)
            return;
        let t = e.getAttribute(s.qs.e);
        t && Fe(e, t.split(","));
    },
    ar = e => {
        let t = e.getAttribute(s.qs.e);
        t ? Yt(e, t.split(",")) : ae(e.attributes) && (y.store ? y.store.l = e : y.store = je(e), ie(e, y.store));
    },
    cr = e => {
        y.store ? y.store.l = e : y.store = je(e),
        ie(e, y.store, !1);
    },
    lr = (e, t, o, r) => {
        o && (o = o.split(",")),
        r && (r = r.split(",")),
        o && r ? (Fe(e, o), Yt(e, r)) : !o && r ? Yt(e, r) : (y.store ? y.store.l = e : y.store = je(t), o && !r && Fe(e, o), ae(t.attributes) && ie(e, y.store));
    };
var fr = (e, t) => e.setAttribute(s.qs.e, e.hasAttribute(s.qs.e) ? `${e.getAttribute(s.qs.e)},${t.shift()}` : t.shift()),
    Ne = (e, t) => {
        Reflect.set(s.snaps, e, t) ? v(`Snapshot ${s.page.key} updated for: ${s.page.snap}`, "#6DD093") : m(`Snapshot ${s.page.key} could not be updated for: ${s.page.snap}`);
    },
    Ve = e => (y.snaps.push([e, q()]), e),
    mr = (e, t) => y.refs.has(e) ? y.refs.get(e).push(t) : y.refs.set(e, [t]),
    dt = (e, t) => at(() => {
        for (; y.snaps.length > 0;) {
            let [o, r] = y.snaps.shift();
            for (let [n, i] of r)
                o.matches(n) && fr(o, i),
                o.querySelectorAll(n).forEach(a => fr(a, i));
            r.clear();
        }
        Ne(t, e.documentElement.outerHTML);
    });
var Zt = (e, t) => X(() => {
        let r = ee(e.snap).querySelector(`[${s.qs.e}="${e.ref}"]`);
        r ? (r.innerHTML = e.snapshot, Ne(e.snap, r.ownerDocument.documentElement.outerHTML)) : m(`Component snapshot merge failed: ${e.instanceOf} (${t})`);
    }),
    dr = (e, t) => {
        let {page: o, dom: r} = ur(s.page.key),
            n = e.charCodeAt(0) === 114 ? "removed" : "appended";
        r.head.contains(t) ? (r.head[e](t), Ne(o.snap, r.documentElement.outerHTML), v(`Snapshot record was updated, ${n} ${t.nodeName.toLowerCase()} from <head>`)) : m("Node does not exist in the snapshot record, snapshot morph skipped", t);
    };
var mt = () => d(d(s.page)),
    Qt = () => {
        for (let e in s.maps)
            delete s.maps[e];
        for (let e of s.instances.values())
            for (let t in e.scope.events)
                Ue(e, e.scope.events[t]);
        s.instances.clear(),
        s.mounted.clear(),
        F("Component instances were disconnected");
    },
    gt = e => {
        let t = mt(),
            o = [];
        for (let [r, n, i] of e) {
            let a = s.instances.get(r),
                c = a.scope.status === 4 ? "unmount" : "onmount";
            a.scope.snap || (a.scope.snap = s.page.snap);
            let l = async () => {
                try {
                    i && a.scope.status === 1 ? (await a[n](t), await a[i](t)) : a.scope.status === 4 ? a.scope.define.merge && Zt(a.scope, r) : await a[n](t),
                    a.scope.status = a.scope.status === 4 ? 5 : 3,
                    a.scope.hooks.connect === 2 && (a.scope.hooks.connect = 3);
                } catch (p) {
                    return m(`Component to failed to ${c}: ${a.scope.instanceOf} (${r})`, p), Promise.reject(r)
                }
            };
            o.push(Ft().then(l));
        }
        return Promise.allSettled(o)
    },
    ut = () => {
        if (s.mounted.size === 0 && s.instances.size === 0 && s.registry.size > 0)
            return ze();
        let e = [];
        for (let t of s.mounted) {
            if (!s.instances.has(t))
                continue;
            let o = s.instances.get(t);
            if (o.scope.status !== 3 && o.scope.status !== 5) {
                let r = o.scope.status === 4,
                    n = r ? "unmount" : "onmount";
                n in o ? n === "onmount" && "connect" in o && o.scope.hooks.connect === 2 ? e.push([t, "connect", n]) : e.push([t, n]) : r && (o.scope.define.merge && Zt(o.scope, t), o.scope.status = 5);
            }
        }
        e.length > 0 && gt(e).catch(t => {
            let o = s.instances.get(t);
            o.scope.status = 5,
            s.mounted.delete(t);
        });
    },
    ye = () => {
        s.registry.size === 0 || s.observe.components || (s.page.type === 0 ? ze() : y.store ? Xe(y.store).then(ut).then(ir) : ut(), s.observe.components = !0);
    },
    Be = () => {
        s.observe.components && (ut(), s.observe.components = !1);
    };
var ps = (e, t) => {
        e.hooks = d(),
        S(o => {
            e.hooks[o] = o in t ? 2 : 1;
        }, ["connect", "onmount", "unmount", "onmedia"]);
    },
    fs = (e, t, o) => (r, n) => {
        if (t === !1 || o && n.status === 2) {
            s.mounted.add(n.key),
            s.instances.set(n.key, r),
            v(`Component "${n.instanceOf}" connected: ${n.key}`, "#F48FB1");
            let i = -1;
            n.hooks.connect === 2 && (i = e.push([n.key, "connect"]) - 1, n.status = 1),
            n.hooks.onmount === 2 && (i = (i > -1 ? e[i].push("onmount") : e.push([n.key, "onmount"])) - 1),
            i < 0 && (n.status = 3);
        }
    },
    gr = (e, t, o) => {
        for (let r in e.events) {
            let n = e.events[r];
            r in t.scope.events || (s.maps[r] = t.ref, t.scope.events[r] = n),
            o !== null && e.status === 3 && (s.maps[r] = e.key, t.scope.events[r] = e.events[r]),
            pt(t, e.events[r]);
        }
    },
    hr = (e, t) => {
        for (let o in e) {
            let r = e[o],
                n = `${o}Exists`;
            o in t.scope.nodes || (s.maps[o] = t.ref, t.scope.nodes[o] = r),
            n in t ? o in t.scope.nodes && ++t.scope.nodes[o].live : Object.defineProperties(t, {
                [n]: {
                    get() {
                        return this.scope.nodes[o].live > 0
                    }
                },
                [`${o}Node`]: {
                    get() {
                        let {selector: i, isChild: a, dom: c} = this.scope.nodes[o];
                        return c.node || (c.node = Ko(i, a ? this.view : w())), c.node
                    }
                },
                [`${o}Nodes`]: {
                    get() {
                        let {selector: i, isChild: a, dom: c} = this.scope.nodes[o];
                        return c.nodes || (c.nodes = Jo(i, a ? this.view : w()), c.nodes && !c.node && (c.node = c.nodes[0])), c.nodes
                    }
                }
            });
        }
    },
    ms = (e, t, o) => {
        let r = o || s.page.type === 4,
            n = fs(e, o, r);
        return (i, a) => {
            if (a)
                hr(i.nodes, a),
                gr(i, a, o);
            else {
                let c = s.registry.get(i.instanceOf),
                    l = Object.defineProperty(i, "define", {
                        get: () => c.define
                    });
                be.scopes.set(i.key, l);
                let p = new c(i.key);
                ps(i, p),
                hr(i.nodes, p),
                gr(i, p, o),
                n(p, i);
            }
        }
    },
    Xe = (e, t) => {
        let {t: o, i: r, l: n} = e,
            i = [],
            a = yr(),
            c = ms(i, a, n !== null);
        for (let l in o) {
            if (!s.registry.has(l) && !a.has(l)) {
                m(`Component does not exist in registry: ${l}`, o[l]);
                continue
            }
            for (let p of o[l]) {
                if (p.instanceOf == null)
                    if (l in r)
                        p.instanceOf = r[l];
                    else
                        continue;
                if (a.has(l))
                    for (let f of a.get(l))
                        f.scope.instanceOf === l && c(p, f);
                else
                    c(p);
            }
        }
        return X(() => [a.clear()]), (s.page.type === 0 && t || t) && dt(t, s.page.snap), i.length > 0 ? gt(i) : Promise.resolve()
    };
var ie = (e, t, o=!0) => {
        o && !ae(e.attributes) || (e.hasAttribute(s.qs.s) ? xs(e, e.getAttribute(s.qs.s), t) : xr(e, t, null, null));
    },
    ds = (e, t) => {
        let o = e.trim().replace(/\s+/, " ").split(/[|, ]/);
        for (let r = 0, n = 0, i = o.length; r < i; r++)
            o[r] !== "" && ((n = r + 2) < i && o[r + 1] === "as" ? (t(Q(o[r]), Q(o[n])), r = n) : t(Q(o[r]), null));
    },
    rr = (e, t) => {
        let o = e.length,
            r = 0;
        for (; ++r < o;) {
            let {name: n, value: i} = e[r];
            if (!s.qs.N.test(n) || n.startsWith(s.qs.d) || !i)
                continue;
            let a = n.slice(s.config.schema.length).split(":").pop();
            t.attrs === null && (t.attrs = d()),
            a in t.attrs || (t.attrs[a] = us(i));
        }
    },
    ae = e => {
        if (typeof e == "string")
            return e.includes("@") || e === s.qs.s || e === s.qs.f || e === s.qs.u;
        for (let t = e.length - 1; t >= 0; t--)
            if (ae(e[t].name))
                return !0;
        return !1
    },
    ht = (e, t) => (e.status === 2 || e.status === 3) && e.dom ? e.dom.contains(t) : !1;
var to = e => Wo(e.replace(/\s \./g, ".")).replace(/\s+/g, " ").trim().split(/[ ,]/),
    us = e => {
        if (He.test(e))
            return e === "NaN" ? NaN : +e;
        if (Se.test(e))
            return e === "true";
        let t = e.charCodeAt(0);
        return t === 123 || t === 91 ? Z(e) : e
    },
    je = (e=null, t=null) => {
        let o = d();
        return o.i = d(), o.t = d(), o.A = null, o.O = e ? d() : null, o.l = e, o.P = t, o
    },
    _e = (e, t, o, r) => (o || (o = e.getAttribute(t)), `${e.nodeName.toLowerCase()}[${t}${r ? "*=" : "="}"${o}"]`),
    yt = (e, {t, i: o}) => e in o ? ke(t[o[e]]) : e in t ? ke(t[e]) : (t[e] = [eo([e])])[0],
    xt = (e, t, o, r) => {
        s.maps[o] = t;
        let n = e.getAttribute(s.qs.e);
        return e.setAttribute(s.qs.e, n ? `${n},${o}` : o), r && mr(r, o), o
    },
    eo = ([e, t=null], o, r) => {
        let n = d();
        if (n.key = se(), n.ref = `c.${n.key}`, n.status = 5, n.state = d(), n.nodes = d(), n.binds = d(), n.events = d(), o && (n.snap = null, n.status = 2, n.inFragment = Et(o), n.alias = t || null, n.dom = o, xt(o, n.key, n.ref, _e(o, s.qs.s))), s.registry.has(e))
            if (n.instanceOf = e, n.alias)
                if (s.registry.has(n.alias))
                    L(`Component alias "${n.alias}" matched a component identifier in the registry`);
                else if (n.alias in r.t) {
                    for (let {events: i, nodes: a, binds: c} of r.t[n.alias]) {
                        if ("events" in n)
                            for (let l in i)
                                n.events[l] = i[l],
                                s.maps[l] = n.key;
                        if ("nodes" in n)
                            for (let l in a)
                                n.nodes[l] = a[l],
                                s.maps[l] = n.key;
                        if ("binds" in n)
                            for (let l in c)
                                n.binds[l] = c[l],
                                s.maps[l] = n.key;
                    }
                    delete r.t[n.alias];
                } else
                    r.i[n.alias] = e;
            else
                n.alias = null;
        else
            e ? n.alias = e : n.instanceOf = null,
            n.status === 2 && (r.i[n.alias] = null);
        return n
    },
    gs = (e, t, o, r) => {
        let n = t.slice(s.config.schema.length),
            i = n.startsWith("window:"),
            a = o.indexOf("{"),
            c = o.trim().split(a > -1 ? new RegExp("(?<=[$_\\w}])\\s+(?=[$_\\w])") : /\s+/);
        for (let l = 0, p = c.length; l < p; l++) {
            let f = c[l],
                x = new AbortController,
                g = d();
            g.key = `e.${se()}`,
            g.isWindow = i,
            g.eventName = i ? n.slice(7) : n,
            g.attached = !1,
            g.selector = _e(e, jo(t), f, !0),
            g.attrs = null,
            g.options = {
                signal: x.signal
            };
            let k = f;
            if (a > -1) {
                let u = f.slice(a, f.lastIndexOf("}", a)).match(/(passive|once|capture)/g);
                u !== null && (g.options.once = u.indexOf("once") > -1, g.options.passive = u.indexOf("passive") > -1, g.options.capture = u.indexOf("capture") > -1),
                k = f.slice(0, a);
            }
            let [E, K] = to(k)[0].split("."),
                J = yt(E, r);
            g.listener = x,
            g.method = K.trim(),
            g.isChild = ht(J, e),
            re(g, "dom", e, !0),
            xt(e, J.key, g.key, g.selector),
            J.events[g.key] = g;
        }
    },
    hs = (e, t, o) => {
        let r = to(t);
        for (let n of r) {
            let [i, a] = n.split("."),
                c = yt(i, o);
            a in c.nodes ? (c.nodes[a].live++, c.nodes[a].isChild = ht(c, e)) : c.nodes[a] = d({
                name: a,
                selector: `[${s.qs.f}*="${t}"]`,
                dom: d(),
                key: `c.${c.key}`,
                live: 1,
                isChild: ht(c, e)
            });
        }
    },
    ys = (e, t, o) => {
        var r;
        for (let n of to(t)) {
            let [i, a] = n.split("."),
                c = yt(i, o),
                l = `[${s.qs.u}="${t}"]`,
                p = xt(e, c.key, `b.${se()}`, `${e.nodeName.toLowerCase()}${l}`);
            (r = c.binds)[a] || (r[a] = d()),
            c.binds[a][p] = d({
                key: p,
                stateKey: a,
                selector: l,
                value: e.innerText,
                live: !0,
                stateAttr: `${s.config.schema}${i}:${a}`,
                isChild: ht(c, e)
            }),
            Object.defineProperty(c.binds[a][p], "dom", {
                get: () => e
            });
        }
    },
    xr = (e, t, o, r) => {
        o === null && r === null && (t.A = se());
        for (let n = e.attributes.length - 1; n >= 0; n--) {
            let {name: i, value: a} = e.attributes[n];
            if (o) {
                let c = `${s.config.schema}${o}:`;
                r && !i.startsWith(c) && (c = `${s.config.schema}${r}:`),
                i.startsWith(c) && (yt(o, t).state[Q(i.slice(c.length))] = d({
                    value: a,
                    persist: !0
                }));
            }
            i.includes("@") ? gs(e, i, a, t) : i === s.qs.u ? ys(e, a, t) : i === s.qs.f && hs(e, a, t);
        }
    },
    xs = (e, t, o) => {
        ds(t, (r, n) => {
            if (!s.registry.has(r))
                m(`Component does not exist in registry: ${r}`);
            else {
                let i;
                r in o.t ? (i = ke(o.t[r]), i.status === 5 ? (i.status = 2, i.inFragment = Et(e), i.dom = e, xt(e, i.key, i.ref, _e(e, s.qs.s))) : o.t[r].push(eo([r, n], e, o))) : o.t[r] = [eo([r, n], e, o)],
                i = ke(o.t[r]),
                n ? o.i[n] = r : i.alias && !(i.alias in o.i) && (s.registry.has(i.alias) ? (m(`Alias cannot use a component identifier: ${i.instanceOf} as ${i.alias}`), i.alias = null) : o.i[i.alias] = r),
                xr(e, o, r, i.alias);
            }
        });
    },
    ze = (e, t=null) => {
        let o = je();
        if (!e && !t) {
            let {ownerDocument: r} = Ve(s.snapDom.body);
            lt(w(), n => ie(n, o)),
            Ie(o.t) || Xe(o, r);
        } else if (t) {
            let r;
            s.snapDom.querySelector(t) ? r = Ve(s.snapDom.querySelector(t)).ownerDocument : m(`Cannot find element in snapshot using selector: ${t}`),
            lt(e, i => ie(i, o)),
            Ie(o.t) || Xe(o, r);
        } else
            return e instanceof Set ? (e.forEach(r => ie(r, o)), e.clear(), o) : (ie(e, o), o)
    };
var Et = e => {
        for (let [t, o] of s.fragments)
            if (t === e.id || o.contains(e))
                return !0;
        return !1
    },
    Tt = () => {
        s.fragments.clear();
        let e,
            t,
            o,
            r = w();
        if (s.page.target.length > 0 ? (t = s.qs.p, e = s.page.target.join(), o = Yo(r.querySelectorAll(`[id][${s.qs.s}]`))) : (t = s.qs.h, e = s.config.fragments.length === 1 && s.config.fragments[0] === "body" ? s.qs.y : `${s.config.fragments.join()},${s.qs.y}`), z(e, n => {
            if (o) {
                for (let i of o)
                    if (n.contains(i)) {
                        o.delete(i);
                        break
                    }
            }
            if (n.hasAttribute(t)) {
                let i = n.getAttribute(t).trim();
                n.id !== A && (i === "true" || i === A) ? s.fragments.set(`#${n.id}`, n) : s.fragments.set(_e(n, t, i), n);
            } else
                s.fragments.set(`#${n.id}`, n);
        }), o && o.size > 0) {
            for (let n of o)
                s.fragments.set(`#${n.id}`, n),
                s.page.target.push(`#${n.id}`),
                y.marks.add(n.id);
            o.clear();
        }
        ce("fragments", [...s.fragments.keys()]);
    },
    Er = e => {
        e.type === 6 || e.selector === "body" || e.selector === null || X(() => {
            let t = ee(e.snap),
                o = t.body.querySelectorAll(s.qs.x),
                r = w().querySelectorAll(s.qs.x);
            z(o, (n, i) => {
                if (Et(n))
                    m("The fragment or target is a decedent of an element which morphs", n);
                else {
                    if (!n.hasAttribute("id"))
                        n.setAttribute("id", `t.${se()}`),
                        r && r[i].setAttribute("id", `t.${se()}`);
                    else if (n.id.startsWith("t."))
                        return;
                    e.target.push(n.id);
                }
            }),
            Ne(e.snap, t.documentElement.outerHTML);
        });
    };
var M = e => {
        let t = it(e);
        return e.ts = nt(), e.target = Bt(e), e.selector = De(e.target), s.config.cache && (t("cache") || (e.cache = s.config.cache), e.snap || (e.snap = Gt())), s.config.hover !== !1 && e.type === 10 && (e.threshold || (e.threshold = s.config.hover.threshold)), s.config.proximity !== !1 && e.type === 12 && (e.proximity || (e.proximity = s.config.proximity.distance), e.threshold || (e.threshold = s.config.proximity.threshold)), s.config.progress && (e.progress || (e.progress = s.config.progress.threshold)), t("history") || (e.history = !0), e.scrollY || (e.scrollY = 0), e.scrollX || (e.scrollX = 0), e.fragments || (e.fragments = s.config.fragments), e.visits || (e.visits = 0), e.location || (e.location = we(e.key)), s.pages[e.key] = e, s.pages[e.key]
    },
    vr = e => {
        let t = d(No(bo({}, e), {
                target: [],
                selector: null,
                cache: s.config.cache,
                history: !0,
                scrollX: 0,
                scrollY: 0,
                fragments: s.config.fragments
            })),
            o = s.config.hover,
            r = s.config.proximity;
        return o && (t.threshold = o.threshold), r && (t.proximity = r.distance, t.threshold = r.threshold), s.config.progress && (t.progress = s.config.progress.threshold), t
    },
    ce = (e, t, o=s.history.key) => {
        o in s.pages && e in s.pages[o] && (e === "location" ? s.pages[o][e] = Object.assign(s.pages[e][o], t) : e === "target" ? (s.pages[o].target = Bt(t), s.pages[o].selector = De(s.pages[o].target)) : s.pages[o][e] = t);
    },
    Ae = (e, t) => {
        e.type > 5 && e.type > 9 && (e.type = 1),
        e.title = _t(t);
        let o = C("cache", e, t),
            r = typeof o == "string" ? o : t;
        return !s.config.cache || o === !1 ? e : e.type !== 0 && !I(e, "snap") ? le(e, r) : (s.pages[e.key] = e, s.snaps[e.snap] = r, Er(e), e)
    },
    le = (e, t=null) => {
        let o = e.key in s.pages ? s.pages[e.key] : M(e);
        return t && (s.snaps[o.snap] = t, e.title = _t(t)), Object.assign(o, e)
    },
    ur = e => {
        if (!e) {
            if (s.history === null) {
                m("Missing history state reference, page cannot be returned");
                return
            }
            e = s.history.key;
        }
        if (e in s.pages)
            return {
                get page() {
                    return s.pages[e]
                },
                get dom() {
                    return ue(s.snaps[s.pages[e].snap])
                }
            };
        L(`No record exists: ${e}`);
    },
    ee = e => {
        let t = typeof e == "number" ? e : typeof e == "string" && e.charCodeAt(0) === 47 ? s.pages[e].snap : s.page.snap;
        return ue(s.snaps[t])
    },
    yr = () => {
        let e = q();
        for (let t of s.mounted) {
            if (!s.instances.has(t))
                continue;
            let o = s.instances.get(t),
                {scope: r} = o;
            r.inFragment === !0 && (r.status === 2 || r.status === 3) && (r.alias !== null && (e.has(r.alias) ? e.get(r.alias).push(o) : e.set(r.alias, [o])), e.has(r.instanceOf) ? e.get(r.instanceOf).push(o) : e.set(r.instanceOf, [o]));
        }
        return e
    },
    Tr = e => {
        if (!e) {
            if (s.history === null) {
                m("Missing history state reference, page cannot be returned");
                return
            }
            e = s.history.key;
        }
        if (I(s.pages, e))
            return s.pages[e];
        L(`No page record exists for: ${e}`);
    },
    H = e => I(s.pages, e) && I(s.pages[e], "snap") && I(s.snaps, s.pages[e].snap) && typeof s.snaps[s.pages[e].snap] == "string";
var te = e => {
    e ? typeof e == "string" ? (delete s.snaps[s.pages[e].snap], delete s.pages[e]) : Array.isArray(e) && S(t => {
        delete s.snaps[s.pages[t].snap],
        delete s.pages[t];
    }, e) : (zt(s.snaps), zt(s.pages));
};
var U = de.replace(/(?:https?:)?(?:\/\/(?:www\.)?|(?:www\.))/, A),
    ro = (e, t) => {
        let o = t ? vr(t) : d(),
            r = e.getAttributeNames();
        for (let n = 0, i = r.length; n < i; n++) {
            let a = r[n];
            if (a.startsWith(s.qs.d)) {
                I(o, "data") || (o.data = d());
                let c = Q(a.slice(s.qs.d.length)),
                    l = e.getAttribute(a).trim();
                He.test(l) ? o.data[c] = l === "NaN" ? NaN : +l : Se.test(l) ? o.data[c] = l === "true" : l.charCodeAt(0) === 123 || l.charCodeAt(0) === 91 ? o.data[c] = Z(a, l) : o.data[c] = l;
            } else {
                if (!s.qs.w.test(a))
                    continue;
                let c = e.getAttribute(a).trim();
                if (a === "href")
                    o.rev = R(location),
                    t || (o.location = we(c), o.key = R(o.location));
                else {
                    let l = a.slice(a.lastIndexOf("-") + 1),
                        p = c.replace(Ho, A).trim();
                    if (l === "target")
                        o[l] = p === "true" ? [] : p !== A ? Fo(p) : [],
                        o.selector = De(o[l]);
                    else if (Do.test(p)) {
                        let f = p.match(/\[?[^,'"[\]()\s]+\]?/g);
                        o[l] = So.test(l) ? f.reduce(Go(2), []) : f;
                    } else if (l === "position")
                        if (Ut.test(p)) {
                            let f = p.match(Ut);
                            o[`scroll${f[0].toUpperCase()}`] = +f[1],
                            f.length === 4 && (o[`scroll${f[2].toUpperCase()}`] = +f[3]);
                        } else
                            m(`Invalid ${a} value, expected: y:number or x:number`, e);
                    else
                        l === "scroll" ? rt.test(p) ? o.scrollY = +p : m(`Invalid ${a} value, expected: number`, e) : Se.test(p) && !Ro.test(a) ? o[l] = p === "true" : He.test(p) ? o[l] = +p : (l === "history" && p !== "push" && p !== "replace" && m(`Invalid ${a} value, expected: false, push or replace`, e), o[l] = p);
                }
            }
        }
        return o
    },
    Ce = e => {
        let t = d();
        if (e.length === 1 && e.charCodeAt(0) === 47)
            return t.pathname = e, t.hash = A, t.search = A, t;
        let r = e.indexOf("#");
        r >= 0 ? (t.hash = e.slice(r), e = e.slice(0, r)) : t.hash = A;
        let n = e.indexOf("?");
        return n >= 0 ? (t.search = e.slice(n), e = e.slice(0, n)) : t.search = A, t.pathname = e, t
    },
    bt = (e, t) => {
        let o = e.indexOf("/", t);
        if (o > t) {
            let n = e.indexOf("#", o);
            return n < 0 ? e.slice(o) : e.slice(o, n)
        }
        let r = e.indexOf("?", t);
        if (r > t) {
            let n = e.indexOf("#", r);
            return n < 0 ? e.slice(r) : e.slice(r, n)
        }
        return e.length - t === U.length ? "/" : null
    },
    oo = e => {
        let t = e.startsWith("www.") ? e.slice(4) : e,
            o = t.indexOf("/");
        if (o >= 0) {
            let r = t.slice(o);
            if (t.slice(0, o) === U)
                return r.length > 0 ? Ce(r) : Ce("/")
        } else {
            let r = t.search(/[?#]/);
            if (r >= 0) {
                if (t.slice(0, r) === U)
                    return Ce("/" + t.slice(r))
            } else if (t === U)
                return Ce("/")
        }
        return null
    },
    Es = e => e.startsWith("http:") || e.startsWith("https:") ? 1 : e.startsWith("//") ? 2 : e.startsWith("www.") ? 3 : 0,
    so = e => {
        if (typeof e != "string" || e.length === 0)
            return !1;
        if (e.charCodeAt(0) === 47)
            return e.charCodeAt(1) !== 47 ? !0 : e.startsWith("www.", 2) ? e.startsWith(U, 6) : e.startsWith(U, 2);
        if (e.charCodeAt(0) === 63)
            return !0;
        if (e.startsWith("www."))
            return e.startsWith(U, 4);
        if (e.startsWith("http")) {
            let t = e.indexOf("/", 4) + 2;
            return e.startsWith("www.", t) ? e.startsWith(U, t + 4) : e.startsWith(U, t)
        }
        return !1
    },
    vs = e => e.charCodeAt(0) === 47 ? e.charCodeAt(1) !== 47 ? Ce(e) : oo(e.slice(2)) : e.charCodeAt(0) === 63 ? Ce(location.pathname + e) : e.startsWith("https:") || e.startsWith("http:") ? oo(e.slice(e.indexOf("/", 4) + 2)) : e.startsWith("www.") ? oo(e) : null,
    R = e => {
        if (typeof e == "object")
            return e.pathname + e.search;
        if (e === A || e === "/")
            return "/";
        let t = Es(e);
        if (t === 1) {
            let o = e.charCodeAt(4) === 115 ? 8 : 7,
                r = e.startsWith("www.", o) ? o + 4 : o;
            return e.startsWith(U, r) ? bt(e, r) : null
        }
        if (t === 2) {
            let o = e.startsWith("www.", 2) ? 6 : 2;
            return e.startsWith(U, o) ? bt(e, o) : null
        }
        return t === 3 ? e.startsWith(U, 4) ? bt(e, 4) : null : e.startsWith(U, 0) ? bt(e, 0) : e.charCodeAt(0) === 47 ? e : null
    },
    br = ({pathname: e, search: t, hash: o}=location) => d({
        hostname: U,
        origin: de,
        pathname: e,
        hash: o,
        search: t
    }),
    we = e => {
        if (e === A)
            return br();
        let t = vs(e);
        return t === null && m(`Invalid pathname: ${e}`), t.origin = de, t.hostname = U, t
    },
    $ = (e, t=6) => {
        if (e instanceof Element) {
            let r = ro(e);
            return r.type = t || 6, r
        }
        let o = d();
        return e === 0 ? (o.location = br(), o.key = o.rev = R(o.location), o.type = e, o.visits = 1, s.index = o.key) : t === 7 || t === 4 ? (o.location = we(e), o.key = o.rev = R(o.location), o.type = t) : (o.rev = location.pathname + location.search, o.location = we(typeof e == "string" ? e : o.rev), o.key = R(o.location), o.type = t), o
    };
var Ye = (e, {method: t="GET", body: o=null, type: r="text", headers: n=[["spx-http", "href"], ["Cache-Control", "private, max-age=0"]]}={}) => new Promise((i, a) => {
        let c = new h;
        c.key = e,
        c.responseType = r,
        c.open(t, e, !0);
        for (let [l, p] of n)
            c.setRequestHeader(l, p);
        c.onloadstart = function() {
            h.o.set(this.key, c);
        },
        c.onload = function() {
            i(this.response);
        },
        c.onerror = function() {
            a(this.statusText);
        },
        c.onabort = function() {
            delete h.r[this.key],
            h.c.delete(this.key),
            h.o.delete(this.key);
        },
        c.onloadend = function(l) {
            h.o.delete(this.key),
            s.memory.bytes = s.memory.bytes + l.loaded,
            s.memory.visits = s.memory.visits + 1;
        },
        c.send(o);
    }),
    Nt = e => e in h.r ? (clearTimeout(h.r[e]), delete h.r[e]) : !0,
    At = (e, t, o) => {
        e in h.r || H(e) || (h.r[e] = setTimeout(t, o));
    };
var no = e => {
        for (let [t, o] of h.o)
            e !== t && (o.abort(), m(`Pending request aborted: ${t}`));
    },
    Nr = e => {
        if (s.config.preload !== null) {
            if (Array.isArray(s.config.preload)) {
                let t = s.config.preload.filter(o => {
                    let r = $(o, 3);
                    return r.key !== o ? O(M(r)) : !1
                });
                return Promise.allSettled(t)
            } else if (typeof s.config.preload == "object" && I(s.config.preload, e.key)) {
                let t = s.config.preload[e.key].map(o => O(M($(o, 3))));
                return Promise.allSettled(t)
            }
        }
    },
    wt = async e => {
        if (e.rev === e.key)
            return;
        let t = M($(e.rev, 4));
        await Vo(),
        O(t).then(o => {
            o ? F(`Reverse fetch completed: ${o.rev}`) : m(`Reverse fetch failed: ${e.rev}`);
        });
    },
    Ke = async e => {
        if (!h.c.has(e.key))
            return e;
        let t = await h.c.get(e.key);
        return h.c.delete(e.key), delete h.r[e.key], Ae(e, t)
    },
    O = async e => h.o.has(e.key) && e.type !== 7 ? (e.type === 4 && h.o.has(e.rev) ? (h.o.get(e.rev).abort(), m(`Request aborted: ${e.rev}`)) : m(`Request in transit: ${e.key}`), !1) : C("fetch", e) ? (h.c.set(e.key, Ye(e.key)), Ke(e)) : (m(`Request cancelled via dispatched event: ${e.key}`), !1);
var Ct = (e, t, o) => {
        e[o] !== t[o] && (e[o] = t[o], e[o] ? e.setAttribute(o, A) : e.removeAttribute(o));
    },
    Ar = (e, t) => {
        if (t.nodeType === 11 || e.nodeType === 11)
            return;
        let o = t.attributes,
            r = e.getAttribute(s.qs.e),
            n = t.getAttribute(s.qs.e),
            i = !1,
            a,
            c,
            l,
            p,
            f;
        for (let g = o.length - 1; g >= 0; g--)
            a = o[g],
            c = a.name,
            p = a.value,
            l = a.namespaceURI,
            l ? (c = a.localName || c, f = e.getAttributeNS(l, c), f !== p && (a.prefix === "xmlns" && (c = a.name), e.setAttributeNS(l, c, p))) : (f = e.getAttribute(c), f !== p && (e.setAttribute(c, p), !r && !n && !i && (i = ae(c))));
        let x = e.attributes;
        for (let g = x.length - 1; g >= 0; g--)
            x[g] !== void 0 && (a = x[g], c = a.name, p = a.value, l = a.namespaceURI, l ? (c = a.localName || c, t.hasAttributeNS(l, c) || e.removeAttributeNS(l, c)) : (t.hasAttribute(c) || e.removeAttribute(c), i || (i = ae(c))));
        (r || n || i) && lr(e, t, r, n);
    };
var wr = (e, t) => {
        let o = e.parentNode;
        if (o) {
            let r = o.nodeName.toUpperCase();
            r === "OPTGROUP" && (o = o.parentNode, r = o && o.nodeName.toUpperCase()),
            r === "SELECT" && !o.hasAttribute("multiple") && (e.hasAttribute("selected") && !t.selected && (e.setAttribute("selected", "selected"), e.removeAttribute("selected")), o.selectedIndex = -1);
        }
        Ct(e, t, "selected");
    },
    Cr = (e, t) => {
        Ct(e, t, "checked"),
        Ct(e, t, "disabled"),
        e.value !== t.value && (e.value = t.value),
        t.hasAttribute("value") || e.removeAttribute("value");
    },
    io = (e, t) => {
        let {value: o} = t;
        e.value !== o && (e.value = o);
        let {firstChild: r} = e;
        if (r) {
            let {nodeValue: n} = r;
            if (n === o || !o && n === e.placeholder)
                return;
            r.nodeValue = o;
        }
    },
    $r = (e, t) => {
        if (!t.hasAttribute("multiple")) {
            let o = 0,
                r = -1,
                n = e.firstChild,
                i,
                a;
            for (; n;)
                if (a = n.nodeName && n.nodeName.toUpperCase(), a === "OPTGROUP")
                    i = n,
                    n = i.firstChild,
                    n || (n = i.nextSibling, i = null);
                else {
                    if (a === "OPTION") {
                        if (n.hasAttribute("selected")) {
                            r = o;
                            break
                        }
                        o++;
                    }
                    n = n.nextSibling,
                    !n && i && (n = i.nextSibling, i = null);
                }
            e.selectedIndex = r;
        }
    };
var bs = (e, t) => !t || t === "http://www.w3.org/1999/xhtml" ? document.createElement(e) : document.createElementNS(t, e),
    $t = (e, t) => {
        if (e === t)
            return !0;
        let o = e.charCodeAt(0),
            r = t.charCodeAt(0);
        return o <= 90 && r >= 97 ? e === t.toUpperCase() : r <= 90 && o >= 97 ? t === e.toUpperCase() : !1
    },
    Ns = (e, t) => {
        switch (e.nodeName) {
        case "INPUT":
            Cr(e, t);
            break;
        case "OPTION":
            wr(e, t);
            break;
        case "SELECT":
            $r(e, t);
            break;
        case "TEXTAREA":
            io(e, t);
            break
        }
    },
    pe = e => e && "getAttribute" in e ? e.getAttribute("id") : void 0,
    As = (e, t) => {
        let o = e.firstChild,
            r;
        for (; o;)
            r = o.nextSibling,
            t.appendChild(o),
            o = r;
        return t
    },
    Lt = (e, t, o, r=!0) => {
        We(e),
        t && t.removeChild(e),
        Lr(e, r, o);
    },
    ws = e => {
        e.nodeType === 1 && e.hasAttribute(s.qs.f) && cr(e);
    },
    Cs = (e, t, o) => {
        let r = t.firstChild,
            n,
            i,
            a = e.firstChild,
            c,
            l,
            p,
            f;
        e:
        for (; r;) {
            for (n = pe(r), i = r.nextSibling; a;) {
                if (p = a.nextSibling, r.isEqualNode(a)) {
                    ws(a),
                    r = i,
                    a = p;
                    continue e
                }
                c = pe(a),
                l = a.nodeType;
                let x;
                if (l === r.nodeType && (l === 1 ? (n ? n !== c && ((f = o.n.get(n)) ? p && p.isEqualNode(f) ? x = !1 : (e.insertBefore(f, a), c ? o.a.add(c) : Lt(a, e, o), a = f, c = pe(a)) : x = !1) : c && (x = !1), x = x !== !1 && $t(a.nodeName, r.nodeName), x && Mt(a, r, o)) : (l === 3 || l === 8) && (x = !0, a.nodeValue !== r.nodeValue && (a.nodeValue = r.nodeValue))), x) {
                    r = i,
                    a = p;
                    continue e
                }
                c ? o.a.add(c) : Lt(a, e, o),
                a = p;
            }
            n && (f = o.n.get(n)) && $t(f.nodeName, r.nodeName) ? (e.appendChild(f), Mt(f, r, o)) : (r.actualize && (r = r.actualize(e.ownerDocument || document)), e.appendChild(r), ao(r, o)),
            r = i,
            a = p;
        }
        $s(e, a, c, o),
        Ns(e, t);
    },
    Mt = (e, t, o) => {
        let r = pe(t);
        if (r && o.n.delete(r), e.isEqualNode(t))
            return;
        let n = e.getAttribute(s.qs.l);
        n !== "false" && (n !== "children" && Ar(e, t), e.nodeName === "TEXTAREA" ? io(e, t) : Cs(e, t, o));
    },
    Lr = (e, t, o) => {
        if (e.nodeType !== 1)
            return;
        let r = e.firstChild;
        for (; r;) {
            let n;
            t && (n = pe(r)) ? o.a.add(n) : (We(r), r.firstChild && Lr(r, t, o)),
            r = r.nextSibling;
        }
    },
    ao = (e, t) => {
        (e.nodeType === 1 || e.nodeType === 11) && ar(e);
        let o = e.firstChild;
        for (; o;) {
            let r = o.nextSibling,
                n = pe(o);
            if (n) {
                let i = t.n.get(n);
                i && $t(o.nodeName, i.nodeName) ? (o.parentNode.replaceChild(i, o), Mt(i, o, t)) : ao(o, t);
            } else
                ao(o, t);
            o = r;
        }
    },
    $s = (e, t, o, r) => {
        for (; t;) {
            let n = t.nextSibling;
            (o = pe(t)) ? r.a.add(o) : Lt(t, e, r),
            t = n;
        }
    },
    Mr = (e, t) => {
        if (e.nodeType === 1 || e.nodeType === 11) {
            let o = e.firstChild;
            for (; o;) {
                let r = pe(o);
                r && t.n.set(r, o),
                Mr(o, t),
                o = o.nextSibling;
            }
        }
    },
    $e = (e, t) => {
        let o = t.cloneNode(!0),
            r = d();
        r.a = B(),
        r.n = q(),
        o.nodeType === 11 && (o = o.firstElementChild),
        Mr(e, r);
        let n = e,
            i = n.nodeType,
            a = o.nodeType;
        if (i === 1)
            a === 1 ? $t(e.nodeName, o.nodeName) || (We(e), n = As(e, bs(o.nodeName, o.namespaceURI))) : n = o;
        else if (i === 3 || i === 8) {
            if (a === i)
                return n.nodeValue !== o.nodeValue && (n.nodeValue = o.nodeValue), n;
            n = o;
        }
        if (n.isEqualNode(o))
            We(e);
        else {
            if (o.isEqualNode(n))
                return n;
            if (Mt(n, o, r), r.a.size > 0) {
                for (let c of r.a)
                    if (r.n.has(c)) {
                        let l = r.n.get(c);
                        Lt(l, l.parentNode, r, !1);
                    }
            }
        }
        return n !== e && e.parentNode && (n.actualize && (n = n.actualize(e.ownerDocument || document)), e.parentNode.replaceChild(n, e)), r.n.clear(), r.a.clear(), n
    };
var Je = (e, t) => {
        if (!(e instanceof Element))
            return !1;
        let o = e.closest(t);
        return o && o.tagName === "A" ? o : !1
    },
    Ot = e => {
        if (e.nodeName !== "A")
            return 2;
        let t = e.getAttribute("href");
        if (!t || !so(t))
            return 2;
        let o = R(t);
        return o === null ? 2 : H(o) ? 2 : 1
    },
    Or = (e, t) => {
        let o = [];
        return z(e, r => {
            if (r.nodeName !== "A")
                z(t, n => Ot(n) === 1 ? o.push(n) : null);
            else if (r.hasAttribute("href") && so(r.href)) {
                let n = R(r.href);
                R(n) !== null && H(n) === !1 && o.push(r);
            }
        }), o
    },
    Ze = e => {
        let t = [];
        return z(e, o => Ot(o) === 1 ? t.push(o) : null), t
    };
var Pr = e => {
        let t = Je(e.target, s.qs.m);
        if (!t)
            return;
        let o = $(t, 10);
        if (H(o.key) || o.key in h.r)
            return;
        t.addEventListener(`${oe}leave`, qr, {
            once: !0
        });
        let r = M(o),
            n = r.threshold || s.config.hover.threshold;
        At(o.key, function() {
            C("prefetch", o, t) && O(r).then(function() {
                delete h.r[o.key],
                Sr(t);
            });
        }, n);
    },
    qr = e => {
        let t = Je(e.target, s.qs.m);
        t && Nt(R(t.href));
    },
    Ms = e => e.addEventListener(`${oe}enter`, Pr),
    Sr = e => {
        e.removeEventListener(`${oe}enter`, Pr),
        e.removeEventListener(`${oe}leave`, qr);
    },
    Pt = () => {
        !s.config.hover || s.observe.hover || (S(Ms, Ze(s.qs.m)), s.observe.hover = !0);
    },
    Le = () => {
        s.observe.hover && (S(Sr, Ze(s.qs.m)), s.observe.hover = !1);
    };
var Ee,
    Os = async e => {
        if (e.isIntersecting) {
            let t = $(e.target, 11);
            if (!C("prefetch", t, e.target))
                return Ee.unobserve(e.target);
            await O(M(t)) ? Ee.unobserve(e.target) : (m(`Prefetch will retry at next intersection for: ${t.key}`), Ee.observe(e.target));
        }
    },
    qt = () => {
        if (!s.config.intersect || s.observe.intersect)
            return;
        Ee || (Ee = new IntersectionObserver(S(Os), s.config.intersect));
        let e = S(o => Ee.observe(o)),
            t = Or(s.qs.C, s.qs.L);
        e(t),
        s.observe.intersect = !0;
    },
    Me = () => {
        s.observe.intersect && (Ee.disconnect(), s.observe.intersect = !1);
    };
Oe.qs = null;
function Oe(e) {
    let t = s.resources.has(e);
    Oe.qs === null && (Oe.qs = w().querySelectorAll(`${s.page.target.join()},[${s.qs.p}]`));
    let o = Oe.qs,
        r = o.length,
        n = -1;
    for (; ++n < r;)
        if (o[n].contains(e))
            return t && !1;
    return t && !0
}
var Hr = (e, t) => s.eval && ko.test(t.nodeName) ? (t.parentNode.nodeName === "HEAD" ? dr(e, t) : Oe(t) ? s.resources.delete(t) : s.resources.add(t), !1) : !0,
    Ps = (e, t) => {
        let o = -1;
        for (; ++o < t;) {
            let r = e[o];
            r.nodeType === 1 && Hr("appendChild", r) && r instanceof HTMLElement && r.hasAttribute(s.qs.s) && ze(r, Bo(r.parentElement));
        }
    },
    qs = (e, t) => {
        let o = -1;
        for (; ++o < t;) {
            let r = e[o];
            if (r.nodeType === 1 && Hr("removeChild", r) && r instanceof HTMLElement) {
                let n = r.getAttribute(s.qs.e);
                r.getAttribute(s.qs.e) && Fe(r, n.split(","));
            }
        }
    },
    St = new MutationObserver(([e]) => {
        if (e.type !== "childList")
            return;
        let t = e.addedNodes.length,
            o = e.removedNodes.length;
        t === 0 && o === 0 || (t > 0 && Ps(e.addedNodes, t), o > 0 && qs(e.removedNodes, o));
    }),
    Rr = () => {
        s.observe.mutations || (St.observe(tt(), {
            childList: !0
        }), St.observe(w(), {
            childList: !0,
            subtree: !0
        }), s.observe.mutations = !0);
    },
    kr = () => {
        if (s.observe.mutations) {
            St.takeRecords(),
            St.disconnect();
            for (let e of s.resources)
                w().removeChild(e),
                s.resources.delete(e);
            Oe.qs = null,
            s.observe.mutations = !1;
        }
    };
var Hs = ({clientX: e, clientY: t}, o) => e <= o.right && e >= o.left && t <= o.bottom && t >= o.top,
    Rs = e => {
        let t = e.getBoundingClientRect(),
            o = e.getAttribute(s.qs.E),
            r = rt.test(o) ? Number(o) : s.config.proximity.distance;
        return {
            target: e,
            top: t.top - r,
            bottom: t.bottom + r,
            left: t.left - r,
            right: t.right + r
        }
    },
    ks = (e, t=!1) => o => {
        if (t)
            return;
        t = !0;
        let r = e.findIndex(n => Hs(o, n));
        if (r === -1)
            X(() => t = !1, s.config.proximity.throttle);
        else {
            let {target: n} = e[r];
            if (Ot(n) === 2)
                e.splice(r, 1);
            else {
                let i = M($(n, 12)),
                    a = i.threshold || s.config.proximity.threshold;
                At(i.key, async () => {
                    if (!C("prefetch", i, n))
                        return fe();
                    await O(i) && (e.splice(r, 1), t = !1, e.length === 0 && (fe(), F("Proximity observer disconnected")));
                }, a);
            }
        }
    },
    po,
    Ht = () => {
        if (!s.config.proximity || s.observe.proximity)
            return;
        let t = Ze(s.qs.E).map(Rs);
        t.length > 0 && (po = ks(t), addEventListener(`${oe}move`, po, {
            passive: !0
        }), s.observe.proximity = !0);
    },
    fe = () => {
        s.observe.proximity && (removeEventListener(`${oe}move`, po), s.observe.proximity = !1);
    };
var Ds = async (e, t, o) => {
        if (!s.eval || !t.children || !o.children)
            return;
        let r = t.children,
            n = B(),
            i = o.children,
            a = [];
        for (let p = 0, f = i.length; p < f; p++)
            Wt(i[p]) && n.add(i[p].outerHTML);
        for (let p = 0, f = r.length; p < f; p++) {
            let x = r[p],
                g = Wt(x),
                k = x.outerHTML;
            n.has(k) ? g ? a.push(x) : n.delete(k) : g && a.push(x);
        }
        let c = [],
            l = document.createRange();
        for (let p of n) {
            let f = l.createContextualFragment(p).firstChild;
            if (I(f, "href") || I(f, "src")) {
                if (!C("resource", e, f))
                    continue;
                let x,
                    g = new Promise(k => x = k);
                f.addEventListener("load", () => x()),
                f.addEventListener("error", k => {
                    m(`Resource <${f.nodeName.toLowerCase()}> failed:`, k),
                    x();
                }),
                c.push(g);
            }
            t.appendChild(f),
            n.delete(p);
        }
        for (let p = 0, f = a.length; p < f; p++)
            t.removeChild(a[p]);
        await Promise.allSettled(c);
    },
    Is = (e, t) => {
        let o = w();
        if (e.selector === "body" || e.fragments.length === 0)
            $e(o, t.body);
        else {
            let r = e.target.length > 0 ? s.fragments.keys() : e.fragments,
                n = s.registry.size > 0,
                i = "render" in s.events;
            for (let a of r) {
                let c = s.fragments.get(a),
                    l = t.body.querySelector(a);
                if (!(!l || !c) && !(i && !C("render", e, c, l)))
                    if (y.marks.has(l.id))
                        l.setAttribute(s.qs.e, c.getAttribute(s.qs.e));
                    else {
                        if (c.isEqualNode(l))
                            continue;
                        n && Ve(l),
                        $e(c, l);
                    }
            }
        }
        if (y.store && dt(t, e.snap), e.type !== 6 && ce("type", 6), e.location.hash !== A) {
            let r = o.querySelector(e.location.hash);
            r && r.scrollIntoView();
        }
        scrollTo(e.scrollX, e.scrollY);
    },
    G = e => {
        Le(),
        Me(),
        fe(),
        kr(),
        Be(),
        Tt(),
        s.eval === !1 && (document.title = e.title);
        let t = ee(e.snap);
        return Ds(e, tt(), t.head), Is(e, t), he.done(), Pt(), qt(), Ht(), ye(), Rr(), C("load", e), e
    };
var N = window.history,
    Dr = () => N.state !== null && "spx" in N.state && "rev" in N.state.spx && N.state.spx.key !== N.state.spx.rev,
    uo = e => {
        if (N.state === null || typeof N.state != "object" || !("spx" in N.state))
            return !1;
        let t = it(N.state.spx)(["key", "rev", "scrollX", "scrollY", "title", "target"]);
        return typeof e == "string" ? t && N.state.spx.key === e : t
    };
var Us = e => (uo(e.key) ? (Object.assign(e, N.state.spx), scrollTo(N.state.spx.scrollX, N.state.spx.scrollY)) : me(e), e),
    me = ({key: e, rev: t, title: o, scrollX: r, scrollY: n, target: i}) => (N.replaceState({
        spx: d({
            key: e,
            rev: t,
            scrollX: r,
            scrollY: n,
            target: i,
            title: o || document.title
        })
    }, o, e), v(`History replaceState: ${e}`), N.state.spx),
    ve = ({key: e, rev: t, title: o, scrollX: r, scrollY: n, target: i}) => (N.pushState({
        spx: d({
            key: e,
            rev: t,
            scrollX: r,
            scrollY: n,
            target: i,
            title: o || document.title
        })
    }, o, e), v(`History pushState: ${e}`), N.state.spx),
    Ir = async e => {
        if (e.state === null || !("spx" in e.state))
            return;
        let {spx: t} = e.state;
        if (H(t.key)) {
            if (!H(t.rev) && t.rev !== t.key && wt(t), ce("type", 5, t.key), !C("popstate", s.pages[t.key]))
                return;
            let {type: o, key: r} = G(s.pages[t.key]);
            v(`History popState ${o === 4 ? "session" : "reverse"}: ${r}`);
        } else {
            if (v(`History popState fetch: ${t.key}`), t.type = 5, !C("popstate", t))
                return;
            let o = await O(t);
            if (!o)
                return location.assign(t.key);
            let r = R(location);
            if (o.key === r)
                v(`History popState fetch Complete: ${t.key}`),
                o.target = [],
                o.selector = null,
                G(o);
            else if (H(r))
                G(s.pages[r]);
            else {
                let n = M($(r, 5));
                if (!C("popstate", n))
                    return;
                let i = await O(n);
                i && ve(i);
            }
        }
    },
    Ur = e => {
        if (!s.observe.history)
            return addEventListener("popstate", Ir, !1), s.observe.history = !0, typeof e == "object" && e.type === 0 ? Us(e) : e
    },
    Fr = () => {
        s.observe.history && (removeEventListener("popstate", Ir, !1), s.observe.history = !1);
    };
var Fs = e => {
        for (let t of ["hover", "intersect", "proximity", "progress"])
            I(e, t) && (e[t] === !1 ? s.config[t] = !1 : typeof e[t] == "object" && Object.assign(s.config[t], e[t]), delete e[t]);
        return e
    },
    Qe = (e, t) => {
        let o = `:not([${e}${t}=false]):not([${e}link]):not`;
        switch (t.charCodeAt(0)) {
        case 104:
            return `${o}([${e}proximity]):not([${e}intersect])`;
        case 105:
            return `${o}([${e}hover]):not([${e}proximity])`;
        case 112:
            return `${o}([${e}intersect]):not([${e}hover])`
        }
    },
    Ws = (e, t, o) => {
        if ("eval" in e)
            if (e.eval) {
                if (typeof e.eval == "object") {
                    let r = Object.assign(s.config.eval, e.eval);
                    s.eval = !(r.link === !1 && r.meta === !1 && r.script === !1 && r.style === !1);


                    console.log('______________________');
                    console.log( s.eval );
                    console.log('______________________');

                }
            } else
                s.eval = !1;
        return r => {
            if (s.eval === !1 || s.config.eval[r] === !1)
                return `${r}[${t}eval]:${o}`;
            if (s.config.eval[r] === !0)
                return `${r}:${o}`;
            let n = r === "link" ? `${r}[rel=stylesheet]:${o}` : `${r}:${o}${r === "script" ? `:not([${t}eval=hydrate])` : ""}`;
            if (s.config.eval[r] === null)
                return n;
            if (Array.isArray(s.config.eval[r]))
                return s.config.eval[r].length > 0 ? s.config.eval[r].map(i => `${i}:${o}`).join(",") : (m(`Missing eval ${r} value, default will be used`), n);
            L(`Invalid "eval" ${r} value, expected boolean or array type`);
        }
    },
    js = e => {
        let t = [];
        if ("fragments" in e && Array.isArray(e.fragments) && e.fragments.length > 0)
            for (let o of e.fragments) {
                let r = o.charCodeAt(0);
                if (r === 46 || r === 91) {
                    m(`Invalid fragment, only element id values allowed: "${o}"`);
                    continue
                } else
                    r === 35 ? t.push(o.trim()) : t.push(`#${o.trim()}`);
            }
        else
            return ["body"];
        return t
    },
    Wr = (e=d()) => {
        "logLevel" in e && (s.logLevel = e.logLevel, s.logLevel === 3 && v("DEBUG MODE")),
        Zo(),
        Object.defineProperties(s, {
            history: {
                get: () => typeof N.state == "object" && "spx" in N.state ? N.state.spx : null
            },
            ready: {
                get: () => document.readyState === "complete"
            },
            types: {
                get: () => d({
                    INITIAL: 0,
                    PREFETCH: 1,
                    FETCH: 2,
                    PRELOAD: 3,
                    REVERSE: 4,
                    POPSTATE: 5,
                    VISIT: 6,
                    HYDRATE: 7,
                    CAPTURE: 8,
                    RELOAD: 9,
                    HOVER: 10,
                    INTERSECT: 11,
                    PROXIMITY: 12
                })
            }
        }),
        "components" in e && (ne(e.components), delete e.components),
        Object.assign(s.config, Fs(e));
        let t = s.config.schema,
            o = t === "spx" ? "spx" : t.endsWith("-") ? t : t === null ? A : `${t}-`,
            r = `:not([${o}disable]):not([href^=\\#])`,
            n = `not([${o}eval=false])`,
            i = Ws(e, o, n);
        s.config.fragments = js(e),
        s.config.schema = o,
        s.config.index = null,
        s.memory.bytes = 0,
        s.memory.visits = 0,
        s.memory.limit = s.config.maxCache,
        s.qs.w = new RegExp(`^href|${o}(hydrate|append|prepend|target|progress|threshold|scroll|position|proximity|hover|cache|history)$`, "i"),
        s.qs.q = new RegExp(`${o}(?:node|bind|component)|@[a-z]|[a-z]:[a-z]`, "i"),
        s.qs.N = new RegExp(`^${o}[a-zA-Z0-9-]+:`, "i"),
        s.qs.p = `${o}target`,
        s.qs.h = `${o}fragment`,
        s.qs.y = `[${s.qs.h}]`,
        s.qs.x = `[${o}target]:not(a[spx-target]):not([${o}target=false])`,
        s.qs.l = `${o}morph`,
        s.qs.b = `${o}eval`,
        s.qs.C = `[${o}intersect]${Qe(o, "intersect")}`,
        s.qs.S = `[${o}track]:not([${o}track=false])`,
        s.qs.s = `${o}component`,
        s.qs.f = `${o}node`,
        s.qs.u = `${o}bind`,
        s.qs.e = "data-spx",
        s.qs.M = `a${s.config.annotate ? `[${o}link]` : ""}${r}`,
        s.qs.g = i("script"),
        s.qs.H = i("style"),
        s.qs.T = i("link"),
        s.qs.v = i("meta"),
        s.qs.R = `script[${o}eval=hydrate]:${n}`,
        s.qs.k = `link[rel=stylesheet][href*=\\.css]:${n},script[src*=\\.js]:${n}`,
        s.qs.d = `${o}data:`,
        s.qs.E = `a[${o}proximity]${r}${Qe(o, "proximity")}`,
        s.qs.L = `a${r}${Qe(o, "intersect")}`,
        s.qs.m = s.config.hover !== !1 && s.config.hover.trigger === "href" ? `a${r}${Qe(o, "hover")}` : `a[${o}hover]${r}${Qe(o, "hover")}`,
        he.style(s.config.progress);
    };
var Vs = e => !(e.target && e.target.isContentEditable || e.defaultPrevented || e.button > 1 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey),
    V = function(e) {
        if (!Vs(e))
            return;
        let t = Je(e.target, s.qs.M);
        if (!t)
            return;
        let o = R(t.href);
        if (o === null)
            return;
        let r = o === s.page.key,
            n = () => {
                m(`Drag occurance, visit cancelled: ${o}`),
                V.drag = !0,
                t.removeEventListener("pointermove", n);
            };
        if (t.addEventListener("pointermove", n, {
            once: !0
        }), V.drag === !0)
            return V.drag = !1, V(e);
        t.removeEventListener("pointermove", n);
        let i = (a, c, l=!0) => {
            a.preventDefault(),
            s.pages[c.key].ts = nt(),
            s.pages[c.key].visits = c.visits + 1,
            s.pages[c.key].target = s.pages[c.rev].target = c.target,
            s.pages[c.key].selector = s.pages[c.rev].selector = c.selector,
            s.pages[c.rev].scrollX = window.scrollX,
            s.pages[c.rev].scrollY = window.scrollY,
            !("visit" in s.events && !C("visit", s.pages[c.key], a)) && (r ? F(`Identical pathname, page visit skipped: ${o}`) : (me(s.pages[c.rev]), l ? (ve(c), G(c)) : jr(c)));
        };
        if (Le(), fe(), Me(), H(o)) {
            let a = ro(t, s.pages[o]),
                c = le(a);
            t.onclick = l => i(l, c);
        } else if (h.c.has(o)) {
            no(o),
            F(`Request in transit: ${o}`);
            let a = s.pages[o];
            t.onclick = c => i(c, a, !1);
        } else {
            no(),
            Nt(o);
            let a = M($(t, 6));
            O(a),
            t.onclick = c => i(c, a, !1);
        }
    };
async function jr(e) {
    e.progress && he.start(e.progress);
    try {
        let t = await Ke(e);
        t ? (t.history === "replace" ? me(t) : ve(t), G(t)) : location.assign(e.key);
    } catch (t) {
        location.assign(e.key);
    }
}
var ho = async (e, t) => {
        if (t) {
            typeof t.cache == "string" && (t.cache === "clear" ? te() : te(t.key)),
            t.progress && he.start(t.progress);
            let o = await O(t);
            o ? (ve(o), G(o)) : location.assign(t.key);
        } else
            return jr(s.pages[e])
    },
    Vr = () => {
        s.observe.hrefs || (V.drag = !1, Pe === "mouseOnly" ? addEventListener("pointerdown", V, !1) : (Pe === "touchOnly" || addEventListener("pointerdown", V, !1), addEventListener("touchstart", V, !1)), s.observe.hrefs = !0);
    },
    Br = () => {
        s.observe.hrefs && (Pe === "mouseOnly" ? removeEventListener("pointerdown", V, !1) : (Pe === "touchOnly" || removeEventListener("pointerdown", V, !1), removeEventListener("touchstart", V, !1)), s.observe.hrefs = !1);
    };
var Xr = () => {
        let e = $(0),
            t = Ur(M(e));
        Object.defineProperty(y, "refs", {
            configurable: !1,
            enumerable: !1,
            get() {
                return this.snaps.length > 0 ? this.snaps[this.snaps.length - 1][1] : q()
            }
        }),
        Object.defineProperties(s, {
            prev: {
                get: () => s.pages[s.history.rev]
            },
            page: {
                get: () => s.pages[s.history.key]
            },
            snapDom: {
                get: () => ue(s.snaps[s.page.snap])
            }
        });
        let o = () => {
            let r = Ae(t, ge());
            return Vr(), Tt(), Pt(), qt(), Ht(), ye(), C("connect", r), at(() => ce("type", 6), async () => await wt(r), async () => await Nr(r)), r
        };
        return new Promise(r => {
            document.readyState === "loading" ? addEventListener("DOMContentLoaded", () => r(o())) : r(o());
        })
    },
    zr = () => {
        Fr(),
        Br(),
        Le(),
        Me(),
        fe(),
        s.config.components && (Be(), Qt(), s.registry.clear()),
        te(),
        s.config.globalThis && delete window.spx,
        F("Disconnected");
    };
function T(e={}) {
    if (!Dt)
        return L("Invalid runtime environment: window is undefined.");
    if (!T.supported)
        return L("Browser does not support SPX");
    if (!window.location.protocol.startsWith("http"))
        return L("Invalid protocol, SPX expects HTTPS or HTTP protocol");
    Wr(e),
    s.config.globalThis && window && !("spx" in window) && re(window, "spx", T);
    let t = Xr();
    return async function(o) {
        let r = await t;
        if (o.constructor.name === "AsyncFunction")
            try {
                await o(r);
            } catch (n) {
                console.error(n),
                L("Connection Error", n);
            }
        else
            o(r);
        F("Connection Established");
    }
}
T.Component = be;
T.on = Qo;
T.off = er;
T.component = Xs;
T.live = Gs;
T.capture = en;
T.form = on;
T.render = Qs;
T.session = _s;
T.reload = Ys;
T.fetch = Ks;
T.http = Js;
T.clear = te;
T.hydrate = rn;
T.prefetch = tn;
T.route = sn;
T.disconnect = zr;
T.register = zs;
T.dom = Zs;
T.supported = Bs();
Object.defineProperties(T, {
    $: {
        get: () => s
    },
    history: {
        value: {
            get state() {
                return s.history
            },
            api: N,
            push: ve,
            replace: me,
            has: uo,
            reverse: Dr
        }
    }
});
function Bs() {
    return !!(Dt && window.history.pushState && window.requestAnimationFrame && window.DOMParser && window.Proxy)
}
function Gs(e=null, ...t) {
    let o = typeof e == "string",
        r = o ? t.length > 0 ? [e].concat(t) : [e] : e,
        n = {};
    for (let i of s.mounted) {
        let a = s.instances.get(i);
        if (r !== null)
            r.indexOf(a.scope.alias) > -1 ? n[a.scope.alias] = a : r.indexOf(a.scope.instanceOf) > -1 && (a.scope.instanceOf in n ? m(`More than 1 instance defined: ${e}`) : n[a.scope.instanceOf] = a);
        else if (a.scope.alias)
            n[a.scope.alias] = a;
        else if (a.scope.instanceOf in n)
            if (Array.isArray(n[a.scope.instanceOf]))
                n[a.scope.instanceOf].push(a);
            else {
                let c = n[a.scope.instanceOf];
                n[a.scope.instanceOf] = [c, a];
            }
        else
            n[a.scope.instanceOf] = a;
    }
    return o ? n[e] : n
}
function Xs(e, t) {
    let o = [];
    for (let r of o.values()) {
        let {scope: n} = r;
        (n.instanceOf === e || n.alias === e) && o.push(r);
    }
    return t ? S(t, o) : o[0]
}
function zs(...e) {
    if (typeof e[0] == "string")
        e.length > 2 && L(`Named component registration expects 2 parameters, recieved ${e.length}.`, e),
        ne({
            [Ge[0]]: e[1]
        });
    else
        for (let t of e)
            if (Array.isArray(t))
                for (let o of t)
                    typeof o[0] == "string" ? ne({
                        [o[0]]: o[1]
                    }) : typeof o == "function" && ne({
                        [ct(o)]: o
                    }, !0);
            else
                typeof t == "function" ? ne({
                    [ct(t)]: t
                }, !0) : typeof t == "object" && ne(t);
    ye();
}
function _s() {
    return ["config", "snaps", "pages", "observers", "fragments", "instances", "mounted", "registry", "reference", "memory"].reduceRight((e, t) => Object.defineProperty(e, t, {
        get: t === "memory" ? () => s[t].size = Xo(s[t].bytes) : () => s[t],
        enumerable: !1,
        configurable: !1
    }), d())
}
async function Ys() {
    s.page.type = 9;
    let e = await O(s.page);
    return e ? (F("Triggered reload, page was re-cached"), G(e)) : (m("Reload failed, triggering refresh (cache will purge)"), location.assign(s.page.key))
}
async function Ks(e) {
    let t = $(e, 2);
    if (t.location.origin !== de) {
        L("Cross origin fetches are not allowed");
        return
    }
    let o = await Ye(t.key);
    if (o)
        return o
}
async function Js(e, g={}) {
    var k = g,
        {url: t=new URL(e, window.location.origin), method: o="GET", response: r="json", query: n, body: i, user: a=t.username, pass: c=t.password, headers: l={}, config: p, timeout: f=0} = k,
        x = Ao(k, ["url", "method", "response", "query", "body", "user", "pass", "headers", "config", "timeout"]);
    let E = new XMLHttpRequest(x),
        K = "application/json",
        J,
        u;
    if (o = o.toUpperCase(), n) {
        n = new URLSearchParams(n);
        for (let [D, P] of n)
            t.searchParams.append(D, P);
    }
    E.open(o, t.href, !0, a, c),
    E.timeout = f,
    E.responseType = r;
    for (let [D, P] of Object.entries(l))
        P && E.setRequestHeader(D, P),
        D.toLowerCase() === "accept" && (J = P),
        D.toLowerCase() === "content-type" && (u = P);
    return !J && r === "json" && E.setRequestHeader("Accept", J = K), !u && i !== void 0 && !Uo.some(D => i instanceof D) && E.setRequestHeader("Content-Type", u = K), p && p(E), new Promise((D, P) => {
        E.onreadystatechange = () => {
            if (E.readyState === E.DONE)
                try {
                    let _ = E.response,
                        yo = J === K && _ && typeof _ == "string" && _ !== "" ? JSON.parse(_) : _;
                    E.status === 304 || E.status >= 200 && E.status < 300 ? D(yo) : P(Object.assign(new Error(E.statusText || "Unknown"), {
                        status: E.status,
                        headers: Vt(E.getAllResponseHeaders()),
                        body: yo,
                        xhr: E
                    }));
                } catch (_) {
                    P(Object.assign(_, {
                        headers: Vt(E.getAllResponseHeaders()),
                        body: E.response,
                        status: E.status,
                        xhr: E
                    }));
                }
        },
        E.onerror = () => P(new Error("Network Error")),
        E.onabort = () => P(new Error("Aborted")),
        E.send(u === K ? JSON.stringify(i) : i);
    })
}
function Zs(e, ...t) {
    let o = e[0];
    for (let c = 0, l = t.length; c < l; c++)
        o += t[c] + e[c + 1];
    let r = o,
        n = document.createElement("div");
    n.innerHTML = r;
    let i = n.children.length;
    if (i === 0)
        return null;
    if (i === 1)
        return re(n.children[0], "raw", r);
    let a = re([], "raw", r);
    for (; n.firstChild;) {
        let c = n.firstElementChild;
        c && a.push(c),
        n.removeChild(n.firstChild);
    }
}
async function Qs(e, t, o) {
    let r = s.page,
        n = $(e);
    n.location.origin !== de && L("Cross origin fetches are not allowed");
    let i = await Ye(n.key, {
        type: "document"
    });
    if (i || L(`Fetch failed for: ${n.key}`, i), await o.call(r, i), t === "replace") {
        r.title = i.title;
        let a = le(Object.assign(r, n), ge(i));
        return me(a), a
    } else
        return G(Ae(n, ge(i)))
}
function en(e) {
    let t = Tr();
    if (!t)
        return;
    let o = ee();
    if (e = Array.isArray(e) ? e : t.target, e.length === 1 && e[0] === "body") {
        $e(o.body, w()),
        le(t, ge(o));
        return
    }
    let r = e.join(","),
        n = w().querySelectorAll(r);
    z(o.body.querySelectorAll(r), (i, a) => {
        $e(i, n[a]);
    }),
    le(t, ge(o));
}
async function tn(e) {
    let t = $(e, 1);
    if (H(t.key)) {
        m(`Cache already exists for ${t.key}, prefetch skipped`);
        return
    }
    let o = await O(M(t));
    if (o)
        return o;
    L(`Prefetch failed for ${t.key}`);
}
async function on(e, t) {
    let o = new FormData;
    for (let n in t.data)
        o.append(n, t.data[n]);
    return await Ye(e, {
        method: t.method,
        body: o
    })
}
async function rn(e, t) {
    let o = $(e, 7);
    if (O(o), Array.isArray(t)) {
        o.hydrate = [],
        o.preserve = [];
        for (let n of t)
            n.charCodeAt(0) === 33 ? o.preserve.push(n.slice(1)) : o.hydrate.push(n);
    } else
        o.hydrate = s.config.fragments;
    let r = await Ke(o);
    if (r) {
        let {key: n} = s.history;
        if (me(r), G(r), o.key !== n) {
            s.index === n && (s.index = o.key);
            for (let i in s.pages)
                s.pages[i].rev === n && (s.pages[i].rev = o.key);
            te(n);
        }
    }
    return ee(r.key)
}
async function sn(e, t) {
    let o = $(e),
        r = typeof t == "object" ? Object.assign(o, t) : o;
    return H(o.key) ? ho(o.key, le(r)) : ho(o.key, M(r))
}

export { T as default };

