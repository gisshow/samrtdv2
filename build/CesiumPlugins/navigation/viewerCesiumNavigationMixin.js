/**
 * Cesium Navigation - https://github.com/alberto-acevedo/cesium-navigation
 *
 * The plugin is 100% based on open source libraries. The same license that applies to Cesiumjs and terriajs applies also to this plugin. Feel free to use it,  modify it, and improve it.
 */
(function(root, factory) {
  'use strict';
  /*jshint sub:true*/

  if (typeof define === 'function' && define.amd) {
    define([], factory);
  }

  Cesium['viewerCesiumNavigationMixin'] = factory();
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this, function() {
  // <-- actual code

  /**
   * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
   * Released under MIT license, http://github.com/requirejs/almond/LICENSE
   */
  //Going sloppy to avoid 'use strict' string cost, but strict practices should
  //be followed.
  /*global setTimeout: false */

  var requirejs, require, define;
  (function(undef) {
    var main,
      req,
      makeMap,
      handlers,
      defined = {},
      waiting = {},
      config = {},
      defining = {},
      hasOwn = Object.prototype.hasOwnProperty,
      aps = [].slice,
      jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
      return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
      var nameParts,
        nameSegment,
        mapValue,
        foundMap,
        lastIndex,
        foundI,
        foundStarMap,
        starI,
        i,
        j,
        part,
        normalizedBaseParts,
        baseParts = baseName && baseName.split('/'),
        map = config.map,
        starMap = (map && map['*']) || {};

      //Adjust any relative paths.
      if (name) {
        name = name.split('/');
        lastIndex = name.length - 1;

        // If wanting node ID compatibility, strip .js from end
        // of IDs. Have to do this here, and not in nameToUrl
        // because node allows either .js or non .js to map
        // to same file.
        if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
          name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
        }

        // Starts with a '.' so need the baseName
        if (name[0].charAt(0) === '.' && baseParts) {
          //Convert baseName to array, and lop off the last part,
          //so that . matches that 'directory' and not name of the baseName's
          //module. For instance, baseName of 'one/two/three', maps to
          //'one/two/three.js', but we want the directory, 'one/two' for
          //this normalization.
          normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
          name = normalizedBaseParts.concat(name);
        }

        //start trimDots
        for (i = 0; i < name.length; i++) {
          part = name[i];
          if (part === '.') {
            name.splice(i, 1);
            i -= 1;
          } else if (part === '..') {
            // If at the start, or previous value is still ..,
            // keep them so that when converted to a path it may
            // still work when converted to a path, even though
            // as an ID it is less than ideal. In larger point
            // releases, may be better to just kick out an error.
            if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
              continue;
            } else if (i > 0) {
              name.splice(i - 1, 2);
              i -= 2;
            }
          }
        }
        //end trimDots

        name = name.join('/');
      }

      //Apply map config if available.
      if ((baseParts || starMap) && map) {
        nameParts = name.split('/');

        for (i = nameParts.length; i > 0; i -= 1) {
          nameSegment = nameParts.slice(0, i).join('/');

          if (baseParts) {
            //Find the longest baseName segment match in the config.
            //So, do joins on the biggest to smallest lengths of baseParts.
            for (j = baseParts.length; j > 0; j -= 1) {
              mapValue = map[baseParts.slice(0, j).join('/')];

              //baseName segment has  config, find if it has one for
              //this name.
              if (mapValue) {
                mapValue = mapValue[nameSegment];
                if (mapValue) {
                  //Match, update name to the new value.
                  foundMap = mapValue;
                  foundI = i;
                  break;
                }
              }
            }
          }

          if (foundMap) {
            break;
          }

          //Check for a star map match, but just hold on to it,
          //if there is a shorter segment match later in a matching
          //config, then favor over this star map.
          if (!foundStarMap && starMap && starMap[nameSegment]) {
            foundStarMap = starMap[nameSegment];
            starI = i;
          }
        }

        if (!foundMap && foundStarMap) {
          foundMap = foundStarMap;
          foundI = starI;
        }

        if (foundMap) {
          nameParts.splice(0, foundI, foundMap);
          name = nameParts.join('/');
        }
      }

      return name;
    }

    function makeRequire(relName, forceSync) {
      return function() {
        //A version of a require function that passes a moduleName
        //value for items that may need to
        //look up paths relative to the moduleName
        var args = aps.call(arguments, 0);

        //If first arg is not require('string'), and there is only
        //one arg, it is the array form without a callback. Insert
        //a null so that the following concat is correct.
        if (typeof args[0] !== 'string' && args.length === 1) {
          args.push(null);
        }
        return req.apply(undef, args.concat([relName, forceSync]));
      };
    }

    function makeNormalize(relName) {
      return function(name) {
        return normalize(name, relName);
      };
    }

    function makeLoad(depName) {
      return function(value) {
        defined[depName] = value;
      };
    }

    function callDep(name) {
      if (hasProp(waiting, name)) {
        var args = waiting[name];
        delete waiting[name];
        defining[name] = true;
        main.apply(undef, args);
      }

      if (!hasProp(defined, name) && !hasProp(defining, name)) {
        throw new Error('No ' + name);
      }
      return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
      var prefix,
        index = name ? name.indexOf('!') : -1;
      if (index > -1) {
        prefix = name.substring(0, index);
        name = name.substring(index + 1, name.length);
      }
      return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
      return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function(name, relParts) {
      var plugin,
        parts = splitPrefix(name),
        prefix = parts[0],
        relResourceName = relParts[1];

      name = parts[1];

      if (prefix) {
        prefix = normalize(prefix, relResourceName);
        plugin = callDep(prefix);
      }

      //Normalize according
      if (prefix) {
        if (plugin && plugin.normalize) {
          name = plugin.normalize(name, makeNormalize(relResourceName));
        } else {
          name = normalize(name, relResourceName);
        }
      } else {
        name = normalize(name, relResourceName);
        parts = splitPrefix(name);
        prefix = parts[0];
        name = parts[1];
        if (prefix) {
          plugin = callDep(prefix);
        }
      }

      //Using ridiculous property names for space reasons
      return {
        f: prefix ? prefix + '!' + name : name, //fullName
        n: name,
        pr: prefix,
        p: plugin,
      };
    };

    function makeConfig(name) {
      return function() {
        return (config && config.config && config.config[name]) || {};
      };
    }

    handlers = {
      require: function(name) {
        return makeRequire(name);
      },
      exports: function(name) {
        var e = defined[name];
        if (typeof e !== 'undefined') {
          return e;
        } else {
          return (defined[name] = {});
        }
      },
      module: function(name) {
        return {
          id: name,
          uri: '',
          exports: defined[name],
          config: makeConfig(name),
        };
      },
    };

    main = function(name, deps, callback, relName) {
      var cjsModule,
        depName,
        ret,
        map,
        i,
        relParts,
        args = [],
        callbackType = typeof callback,
        usingExports;

      //Use name if no relName
      relName = relName || name;
      relParts = makeRelParts(relName);

      //Call the callback to define the module, if necessary.
      if (callbackType === 'undefined' || callbackType === 'function') {
        //Pull out the defined dependencies and pass the ordered
        //values to the callback.
        //Default to [require, exports, module] if no deps
        deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
        for (i = 0; i < deps.length; i += 1) {
          map = makeMap(deps[i], relParts);
          depName = map.f;

          //Fast path CommonJS standard dependencies.
          if (depName === 'require') {
            args[i] = handlers.require(name);
          } else if (depName === 'exports') {
            //CommonJS module spec 1.1
            args[i] = handlers.exports(name);
            usingExports = true;
          } else if (depName === 'module') {
            //CommonJS module spec 1.1
            cjsModule = args[i] = handlers.module(name);
          } else if (
            hasProp(defined, depName) ||
            hasProp(waiting, depName) ||
            hasProp(defining, depName)
          ) {
            args[i] = callDep(depName);
          } else if (map.p) {
            map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
            args[i] = defined[depName];
          } else {
            throw new Error(name + ' missing ' + depName);
          }
        }

        ret = callback ? callback.apply(defined[name], args) : undefined;

        if (name) {
          //If setting exports via "module" is in play,
          //favor that over return value and exports. After that,
          //favor a non-undefined return value over exports use.
          if (cjsModule && cjsModule.exports !== undef && cjsModule.exports !== defined[name]) {
            defined[name] = cjsModule.exports;
          } else if (ret !== undef || !usingExports) {
            //Use the return value from the function.
            defined[name] = ret;
          }
        }
      } else if (name) {
        //May just be an object definition for the module. Only
        //worry about defining if have a module name.
        defined[name] = callback;
      }
    };

    requirejs = require = req = function(deps, callback, relName, forceSync, alt) {
      if (typeof deps === 'string') {
        if (handlers[deps]) {
          //callback in this case is really relName
          return handlers[deps](callback);
        }
        //Just return the module wanted. In this scenario, the
        //deps arg is the module name, and second arg (if passed)
        //is just the relName.
        //Normalize module name, if it contains . or ..
        return callDep(makeMap(deps, makeRelParts(callback)).f);
      } else if (!deps.splice) {
        //deps is a config object, not an array.
        config = deps;
        if (config.deps) {
          req(config.deps, config.callback);
        }
        if (!callback) {
          return;
        }

        if (callback.splice) {
          //callback is an array, which means it is a dependency list.
          //Adjust args if there are dependencies
          deps = callback;
          callback = relName;
          relName = null;
        } else {
          deps = undef;
        }
      }

      //Support require(['a'])
      callback = callback || function() {};

      //If relName is a function, it is an errback handler,
      //so remove it.
      if (typeof relName === 'function') {
        relName = forceSync;
        forceSync = alt;
      }

      //Simulate async callback;
      if (forceSync) {
        main(undef, deps, callback, relName);
      } else {
        //Using a non-zero value because of concern for what old browsers
        //do, and latest browsers "upgrade" to 4 if lower value is used:
        //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
        //If want a value immediately, use require('id') instead -- something
        //that works in almond on the global level, but not guaranteed and
        //unlikely to work in other AMD implementations.
        setTimeout(function() {
          main(undef, deps, callback, relName);
        }, 4);
      }

      return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function(cfg) {
      return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function(name, deps, callback) {
      if (typeof name !== 'string') {
        throw new Error('See almond README: incorrect module build, no module name');
      }

      //This module may not have dependencies
      if (!deps.splice) {
        //deps is not an array, so probably means
        //an object literal or factory function for
        //the value. Adjust args.
        callback = deps;
        deps = [];
      }

      if (!hasProp(defined, name) && !hasProp(waiting, name)) {
        waiting[name] = [name, deps, callback];
      }
    };

    define.amd = {
      jQuery: true,
    };
  })();

  define('almond', function() {});

  /*!
   * Knockout JavaScript library v3.4.2
   * (c) The Knockout.js team - http://knockoutjs.com/
   * License: MIT (http://www.opensource.org/licenses/mit-license.php)
   */

  (function() {
    (function(n) {
      var x = this || (0, eval)('this'),
        t = x.document,
        M = x.navigator,
        u = x.jQuery,
        H = x.JSON;
      (function(n) {
        'function' === typeof define && define.amd
          ? define('knockout', ['exports', 'require'], n)
          : 'object' === typeof exports && 'object' === typeof module
          ? n(module.exports || exports)
          : n((x.ko = {}));
      })(function(N, O) {
        function J(a, c) {
          return null === a || typeof a in R ? a === c : !1;
        }
        function S(b, c) {
          var d;
          return function() {
            d ||
              (d = a.a.setTimeout(function() {
                d = n;
                b();
              }, c));
          };
        }
        function T(b, c) {
          var d;
          return function() {
            clearTimeout(d);
            d = a.a.setTimeout(b, c);
          };
        }
        function U(a, c) {
          c && c !== E ? ('beforeChange' === c ? this.Ob(a) : this.Ja(a, c)) : this.Pb(a);
        }
        function V(a, c) {
          null !== c && c.k && c.k();
        }
        function W(a, c) {
          var d = this.Mc,
            e = d[s];
          e.T ||
            (this.ob && this.Oa[c]
              ? (d.Sb(c, a, this.Oa[c]), (this.Oa[c] = null), --this.ob)
              : e.s[c] || d.Sb(c, a, e.t ? { $: a } : d.yc(a)),
            a.Ha && a.Hc());
        }
        function K(b, c, d, e) {
          a.d[b] = {
            init: function(b, g, h, l, m) {
              var k, r;
              a.m(
                function() {
                  var q = g(),
                    p = a.a.c(q),
                    p = !d !== !p,
                    A = !r;
                  if (A || c || p !== k)
                    A && a.xa.Ca() && (r = a.a.wa(a.f.childNodes(b), !0)),
                      p ? (A || a.f.fa(b, a.a.wa(r)), a.hb(e ? e(m, q) : m, b)) : a.f.za(b),
                      (k = p);
                },
                null,
                { i: b },
              );
              return { controlsDescendantBindings: !0 };
            },
          };
          a.h.va[b] = !1;
          a.f.aa[b] = !0;
        }
        var a = 'undefined' !== typeof N ? N : {};
        a.b = function(b, c) {
          for (var d = b.split('.'), e = a, f = 0; f < d.length - 1; f++) e = e[d[f]];
          e[d[d.length - 1]] = c;
        };
        a.H = function(a, c, d) {
          a[c] = d;
        };
        a.version = '3.4.2';
        a.b('version', a.version);
        a.options = { deferUpdates: !1, useOnlyNativeEvents: !1 };
        a.a = (function() {
          function b(a, b) {
            for (var c in a) a.hasOwnProperty(c) && b(c, a[c]);
          }
          function c(a, b) {
            if (b) for (var c in b) b.hasOwnProperty(c) && (a[c] = b[c]);
            return a;
          }
          function d(a, b) {
            a.__proto__ = b;
            return a;
          }
          function e(b, c, d, e) {
            var m = b[c].match(r) || [];
            a.a.r(d.match(r), function(b) {
              a.a.ra(m, b, e);
            });
            b[c] = m.join(' ');
          }
          var f = { __proto__: [] } instanceof Array,
            g = 'function' === typeof Symbol,
            h = {},
            l = {};
          h[M && /Firefox\/2/i.test(M.userAgent) ? 'KeyboardEvent' : 'UIEvents'] = [
            'keyup',
            'keydown',
            'keypress',
          ];
          h.MouseEvents = 'click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave'.split(
            ' ',
          );
          b(h, function(a, b) {
            if (b.length) for (var c = 0, d = b.length; c < d; c++) l[b[c]] = a;
          });
          var m = { propertychange: !0 },
            k =
              t &&
              (function() {
                for (
                  var a = 3, b = t.createElement('div'), c = b.getElementsByTagName('i');
                  (b.innerHTML = '\x3c!--[if gt IE ' + ++a + ']><i></i><![endif]--\x3e'), c[0];

                );
                return 4 < a ? a : n;
              })(),
            r = /\S+/g;
          return {
            gc: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],
            r: function(a, b) {
              for (var c = 0, d = a.length; c < d; c++) b(a[c], c);
            },
            o: function(a, b) {
              if ('function' == typeof Array.prototype.indexOf)
                return Array.prototype.indexOf.call(a, b);
              for (var c = 0, d = a.length; c < d; c++) if (a[c] === b) return c;
              return -1;
            },
            Vb: function(a, b, c) {
              for (var d = 0, e = a.length; d < e; d++) if (b.call(c, a[d], d)) return a[d];
              return null;
            },
            Na: function(b, c) {
              var d = a.a.o(b, c);
              0 < d ? b.splice(d, 1) : 0 === d && b.shift();
            },
            Wb: function(b) {
              b = b || [];
              for (var c = [], d = 0, e = b.length; d < e; d++) 0 > a.a.o(c, b[d]) && c.push(b[d]);
              return c;
            },
            ib: function(a, b) {
              a = a || [];
              for (var c = [], d = 0, e = a.length; d < e; d++) c.push(b(a[d], d));
              return c;
            },
            Ma: function(a, b) {
              a = a || [];
              for (var c = [], d = 0, e = a.length; d < e; d++) b(a[d], d) && c.push(a[d]);
              return c;
            },
            ta: function(a, b) {
              if (b instanceof Array) a.push.apply(a, b);
              else for (var c = 0, d = b.length; c < d; c++) a.push(b[c]);
              return a;
            },
            ra: function(b, c, d) {
              var e = a.a.o(a.a.Bb(b), c);
              0 > e ? d && b.push(c) : d || b.splice(e, 1);
            },
            la: f,
            extend: c,
            $a: d,
            ab: f ? d : c,
            D: b,
            Ea: function(a, b) {
              if (!a) return a;
              var c = {},
                d;
              for (d in a) a.hasOwnProperty(d) && (c[d] = b(a[d], d, a));
              return c;
            },
            rb: function(b) {
              for (; b.firstChild; ) a.removeNode(b.firstChild);
            },
            nc: function(b) {
              b = a.a.W(b);
              for (
                var c = ((b[0] && b[0].ownerDocument) || t).createElement('div'),
                  d = 0,
                  e = b.length;
                d < e;
                d++
              )
                c.appendChild(a.ba(b[d]));
              return c;
            },
            wa: function(b, c) {
              for (var d = 0, e = b.length, m = []; d < e; d++) {
                var k = b[d].cloneNode(!0);
                m.push(c ? a.ba(k) : k);
              }
              return m;
            },
            fa: function(b, c) {
              a.a.rb(b);
              if (c) for (var d = 0, e = c.length; d < e; d++) b.appendChild(c[d]);
            },
            uc: function(b, c) {
              var d = b.nodeType ? [b] : b;
              if (0 < d.length) {
                for (var e = d[0], m = e.parentNode, k = 0, f = c.length; k < f; k++)
                  m.insertBefore(c[k], e);
                k = 0;
                for (f = d.length; k < f; k++) a.removeNode(d[k]);
              }
            },
            Ba: function(a, b) {
              if (a.length) {
                for (
                  b = (8 === b.nodeType && b.parentNode) || b;
                  a.length && a[0].parentNode !== b;

                )
                  a.splice(0, 1);
                for (; 1 < a.length && a[a.length - 1].parentNode !== b; ) a.length--;
                if (1 < a.length) {
                  var c = a[0],
                    d = a[a.length - 1];
                  for (a.length = 0; c !== d; ) a.push(c), (c = c.nextSibling);
                  a.push(d);
                }
              }
              return a;
            },
            wc: function(a, b) {
              7 > k ? a.setAttribute('selected', b) : (a.selected = b);
            },
            cb: function(a) {
              return null === a || a === n
                ? ''
                : a.trim
                ? a.trim()
                : a.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
            },
            sd: function(a, b) {
              a = a || '';
              return b.length > a.length ? !1 : a.substring(0, b.length) === b;
            },
            Rc: function(a, b) {
              if (a === b) return !0;
              if (11 === a.nodeType) return !1;
              if (b.contains) return b.contains(3 === a.nodeType ? a.parentNode : a);
              if (b.compareDocumentPosition) return 16 == (b.compareDocumentPosition(a) & 16);
              for (; a && a != b; ) a = a.parentNode;
              return !!a;
            },
            qb: function(b) {
              return a.a.Rc(b, b.ownerDocument.documentElement);
            },
            Tb: function(b) {
              return !!a.a.Vb(b, a.a.qb);
            },
            A: function(a) {
              return a && a.tagName && a.tagName.toLowerCase();
            },
            Zb: function(b) {
              return a.onError
                ? function() {
                    try {
                      return b.apply(this, arguments);
                    } catch (c) {
                      throw (a.onError && a.onError(c), c);
                    }
                  }
                : b;
            },
            setTimeout: function(b, c) {
              return setTimeout(a.a.Zb(b), c);
            },
            dc: function(b) {
              setTimeout(function() {
                a.onError && a.onError(b);
                throw b;
              }, 0);
            },
            q: function(b, c, d) {
              var e = a.a.Zb(d);
              d = k && m[c];
              if (a.options.useOnlyNativeEvents || d || !u)
                if (d || 'function' != typeof b.addEventListener)
                  if ('undefined' != typeof b.attachEvent) {
                    var f = function(a) {
                        e.call(b, a);
                      },
                      l = 'on' + c;
                    b.attachEvent(l, f);
                    a.a.G.qa(b, function() {
                      b.detachEvent(l, f);
                    });
                  } else throw Error("Browser doesn't support addEventListener or attachEvent");
                else b.addEventListener(c, e, !1);
              else u(b).bind(c, e);
            },
            Fa: function(b, c) {
              if (!b || !b.nodeType)
                throw Error('element must be a DOM node when calling triggerEvent');
              var d;
              'input' === a.a.A(b) && b.type && 'click' == c.toLowerCase()
                ? ((d = b.type), (d = 'checkbox' == d || 'radio' == d))
                : (d = !1);
              if (a.options.useOnlyNativeEvents || !u || d)
                if ('function' == typeof t.createEvent)
                  if ('function' == typeof b.dispatchEvent)
                    (d = t.createEvent(l[c] || 'HTMLEvents')),
                      d.initEvent(c, !0, !0, x, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, b),
                      b.dispatchEvent(d);
                  else throw Error("The supplied element doesn't support dispatchEvent");
                else if (d && b.click) b.click();
                else if ('undefined' != typeof b.fireEvent) b.fireEvent('on' + c);
                else throw Error("Browser doesn't support triggering events");
              else u(b).trigger(c);
            },
            c: function(b) {
              return a.I(b) ? b() : b;
            },
            Bb: function(b) {
              return a.I(b) ? b.p() : b;
            },
            fb: function(b, c, d) {
              var k;
              c &&
                ('object' === typeof b.classList
                  ? ((k = b.classList[d ? 'add' : 'remove']),
                    a.a.r(c.match(r), function(a) {
                      k.call(b.classList, a);
                    }))
                  : 'string' === typeof b.className.baseVal
                  ? e(b.className, 'baseVal', c, d)
                  : e(b, 'className', c, d));
            },
            bb: function(b, c) {
              var d = a.a.c(c);
              if (null === d || d === n) d = '';
              var e = a.f.firstChild(b);
              !e || 3 != e.nodeType || a.f.nextSibling(e)
                ? a.f.fa(b, [b.ownerDocument.createTextNode(d)])
                : (e.data = d);
              a.a.Wc(b);
            },
            vc: function(a, b) {
              a.name = b;
              if (7 >= k)
                try {
                  a.mergeAttributes(t.createElement("<input name='" + a.name + "'/>"), !1);
                } catch (c) {}
            },
            Wc: function(a) {
              9 <= k &&
                ((a = 1 == a.nodeType ? a : a.parentNode),
                a.style && (a.style.zoom = a.style.zoom));
            },
            Sc: function(a) {
              if (k) {
                var b = a.style.width;
                a.style.width = 0;
                a.style.width = b;
              }
            },
            nd: function(b, c) {
              b = a.a.c(b);
              c = a.a.c(c);
              for (var d = [], e = b; e <= c; e++) d.push(e);
              return d;
            },
            W: function(a) {
              for (var b = [], c = 0, d = a.length; c < d; c++) b.push(a[c]);
              return b;
            },
            bc: function(a) {
              return g ? Symbol(a) : a;
            },
            xd: 6 === k,
            yd: 7 === k,
            C: k,
            ic: function(b, c) {
              for (
                var d = a.a
                    .W(b.getElementsByTagName('input'))
                    .concat(a.a.W(b.getElementsByTagName('textarea'))),
                  e =
                    'string' == typeof c
                      ? function(a) {
                          return a.name === c;
                        }
                      : function(a) {
                          return c.test(a.name);
                        },
                  k = [],
                  m = d.length - 1;
                0 <= m;
                m--
              )
                e(d[m]) && k.push(d[m]);
              return k;
            },
            kd: function(b) {
              return 'string' == typeof b && (b = a.a.cb(b))
                ? H && H.parse
                  ? H.parse(b)
                  : new Function('return ' + b)()
                : null;
            },
            Gb: function(b, c, d) {
              if (!H || !H.stringify)
                throw Error(
                  "Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js",
                );
              return H.stringify(a.a.c(b), c, d);
            },
            ld: function(c, d, e) {
              e = e || {};
              var k = e.params || {},
                m = e.includeFields || this.gc,
                f = c;
              if ('object' == typeof c && 'form' === a.a.A(c))
                for (var f = c.action, l = m.length - 1; 0 <= l; l--)
                  for (var g = a.a.ic(c, m[l]), h = g.length - 1; 0 <= h; h--)
                    k[g[h].name] = g[h].value;
              d = a.a.c(d);
              var r = t.createElement('form');
              r.style.display = 'none';
              r.action = f;
              r.method = 'post';
              for (var n in d)
                (c = t.createElement('input')),
                  (c.type = 'hidden'),
                  (c.name = n),
                  (c.value = a.a.Gb(a.a.c(d[n]))),
                  r.appendChild(c);
              b(k, function(a, b) {
                var c = t.createElement('input');
                c.type = 'hidden';
                c.name = a;
                c.value = b;
                r.appendChild(c);
              });
              t.body.appendChild(r);
              e.submitter ? e.submitter(r) : r.submit();
              setTimeout(function() {
                r.parentNode.removeChild(r);
              }, 0);
            },
          };
        })();
        a.b('utils', a.a);
        a.b('utils.arrayForEach', a.a.r);
        a.b('utils.arrayFirst', a.a.Vb);
        a.b('utils.arrayFilter', a.a.Ma);
        a.b('utils.arrayGetDistinctValues', a.a.Wb);
        a.b('utils.arrayIndexOf', a.a.o);
        a.b('utils.arrayMap', a.a.ib);
        a.b('utils.arrayPushAll', a.a.ta);
        a.b('utils.arrayRemoveItem', a.a.Na);
        a.b('utils.extend', a.a.extend);
        a.b('utils.fieldsIncludedWithJsonPost', a.a.gc);
        a.b('utils.getFormFields', a.a.ic);
        a.b('utils.peekObservable', a.a.Bb);
        a.b('utils.postJson', a.a.ld);
        a.b('utils.parseJson', a.a.kd);
        a.b('utils.registerEventHandler', a.a.q);
        a.b('utils.stringifyJson', a.a.Gb);
        a.b('utils.range', a.a.nd);
        a.b('utils.toggleDomNodeCssClass', a.a.fb);
        a.b('utils.triggerEvent', a.a.Fa);
        a.b('utils.unwrapObservable', a.a.c);
        a.b('utils.objectForEach', a.a.D);
        a.b('utils.addOrRemoveItem', a.a.ra);
        a.b('utils.setTextContent', a.a.bb);
        a.b('unwrap', a.a.c);
        Function.prototype.bind ||
          (Function.prototype.bind = function(a) {
            var c = this;
            if (1 === arguments.length)
              return function() {
                return c.apply(a, arguments);
              };
            var d = Array.prototype.slice.call(arguments, 1);
            return function() {
              var e = d.slice(0);
              e.push.apply(e, arguments);
              return c.apply(a, e);
            };
          });
        a.a.e = new (function() {
          function a(b, g) {
            var h = b[d];
            if (!h || 'null' === h || !e[h]) {
              if (!g) return n;
              h = b[d] = 'ko' + c++;
              e[h] = {};
            }
            return e[h];
          }
          var c = 0,
            d = '__ko__' + new Date().getTime(),
            e = {};
          return {
            get: function(c, d) {
              var e = a(c, !1);
              return e === n ? n : e[d];
            },
            set: function(c, d, e) {
              if (e !== n || a(c, !1) !== n) a(c, !0)[d] = e;
            },
            clear: function(a) {
              var b = a[d];
              return b ? (delete e[b], (a[d] = null), !0) : !1;
            },
            J: function() {
              return c++ + d;
            },
          };
        })();
        a.b('utils.domData', a.a.e);
        a.b('utils.domData.clear', a.a.e.clear);
        a.a.G = new (function() {
          function b(b, c) {
            var e = a.a.e.get(b, d);
            e === n && c && ((e = []), a.a.e.set(b, d, e));
            return e;
          }
          function c(d) {
            var e = b(d, !1);
            if (e) for (var e = e.slice(0), l = 0; l < e.length; l++) e[l](d);
            a.a.e.clear(d);
            a.a.G.cleanExternalData(d);
            if (f[d.nodeType])
              for (e = d.firstChild; (d = e); ) (e = d.nextSibling), 8 === d.nodeType && c(d);
          }
          var d = a.a.e.J(),
            e = { 1: !0, 8: !0, 9: !0 },
            f = { 1: !0, 9: !0 };
          return {
            qa: function(a, c) {
              if ('function' != typeof c) throw Error('Callback must be a function');
              b(a, !0).push(c);
            },
            tc: function(c, e) {
              var f = b(c, !1);
              f && (a.a.Na(f, e), 0 == f.length && a.a.e.set(c, d, n));
            },
            ba: function(b) {
              if (e[b.nodeType] && (c(b), f[b.nodeType])) {
                var d = [];
                a.a.ta(d, b.getElementsByTagName('*'));
                for (var l = 0, m = d.length; l < m; l++) c(d[l]);
              }
              return b;
            },
            removeNode: function(b) {
              a.ba(b);
              b.parentNode && b.parentNode.removeChild(b);
            },
            cleanExternalData: function(a) {
              u && 'function' == typeof u.cleanData && u.cleanData([a]);
            },
          };
        })();
        a.ba = a.a.G.ba;
        a.removeNode = a.a.G.removeNode;
        a.b('cleanNode', a.ba);
        a.b('removeNode', a.removeNode);
        a.b('utils.domNodeDisposal', a.a.G);
        a.b('utils.domNodeDisposal.addDisposeCallback', a.a.G.qa);
        a.b('utils.domNodeDisposal.removeDisposeCallback', a.a.G.tc);
        (function() {
          var b = [0, '', ''],
            c = [1, '<table>', '</table>'],
            d = [3, '<table><tbody><tr>', '</tr></tbody></table>'],
            e = [1, "<select multiple='multiple'>", '</select>'],
            f = {
              thead: c,
              tbody: c,
              tfoot: c,
              tr: [2, '<table><tbody>', '</tbody></table>'],
              td: d,
              th: d,
              option: e,
              optgroup: e,
            },
            g = 8 >= a.a.C;
          a.a.na = function(c, d) {
            var e;
            if (u)
              if (u.parseHTML) e = u.parseHTML(c, d) || [];
              else {
                if ((e = u.clean([c], d)) && e[0]) {
                  for (var k = e[0]; k.parentNode && 11 !== k.parentNode.nodeType; )
                    k = k.parentNode;
                  k.parentNode && k.parentNode.removeChild(k);
                }
              }
            else {
              (e = d) || (e = t);
              var k = e.parentWindow || e.defaultView || x,
                r = a.a.cb(c).toLowerCase(),
                q = e.createElement('div'),
                p;
              p = ((r = r.match(/^<([a-z]+)[ >]/)) && f[r[1]]) || b;
              r = p[0];
              p = 'ignored<div>' + p[1] + c + p[2] + '</div>';
              'function' == typeof k.innerShiv
                ? q.appendChild(k.innerShiv(p))
                : (g && e.appendChild(q), (q.innerHTML = p), g && q.parentNode.removeChild(q));
              for (; r--; ) q = q.lastChild;
              e = a.a.W(q.lastChild.childNodes);
            }
            return e;
          };
          a.a.Eb = function(b, c) {
            a.a.rb(b);
            c = a.a.c(c);
            if (null !== c && c !== n)
              if (('string' != typeof c && (c = c.toString()), u)) u(b).html(c);
              else
                for (var d = a.a.na(c, b.ownerDocument), e = 0; e < d.length; e++)
                  b.appendChild(d[e]);
          };
        })();
        a.b('utils.parseHtmlFragment', a.a.na);
        a.b('utils.setHtml', a.a.Eb);
        a.N = (function() {
          function b(c, e) {
            if (c)
              if (8 == c.nodeType) {
                var f = a.N.pc(c.nodeValue);
                null != f && e.push({ Qc: c, hd: f });
              } else if (1 == c.nodeType)
                for (var f = 0, g = c.childNodes, h = g.length; f < h; f++) b(g[f], e);
          }
          var c = {};
          return {
            yb: function(a) {
              if ('function' != typeof a)
                throw Error('You can only pass a function to ko.memoization.memoize()');
              var b =
                ((4294967296 * (1 + Math.random())) | 0).toString(16).substring(1) +
                ((4294967296 * (1 + Math.random())) | 0).toString(16).substring(1);
              c[b] = a;
              return '\x3c!--[ko_memo:' + b + ']--\x3e';
            },
            Bc: function(a, b) {
              var f = c[a];
              if (f === n)
                throw Error(
                  "Couldn't find any memo with ID " + a + ". Perhaps it's already been unmemoized.",
                );
              try {
                return f.apply(null, b || []), !0;
              } finally {
                delete c[a];
              }
            },
            Cc: function(c, e) {
              var f = [];
              b(c, f);
              for (var g = 0, h = f.length; g < h; g++) {
                var l = f[g].Qc,
                  m = [l];
                e && a.a.ta(m, e);
                a.N.Bc(f[g].hd, m);
                l.nodeValue = '';
                l.parentNode && l.parentNode.removeChild(l);
              }
            },
            pc: function(a) {
              return (a = a.match(/^\[ko_memo\:(.*?)\]$/)) ? a[1] : null;
            },
          };
        })();
        a.b('memoization', a.N);
        a.b('memoization.memoize', a.N.yb);
        a.b('memoization.unmemoize', a.N.Bc);
        a.b('memoization.parseMemoText', a.N.pc);
        a.b('memoization.unmemoizeDomNodeAndDescendants', a.N.Cc);
        a.Z = (function() {
          function b() {
            if (e)
              for (var b = e, c = 0, m; g < e; )
                if ((m = d[g++])) {
                  if (g > b) {
                    if (5e3 <= ++c) {
                      g = e;
                      a.a.dc(Error("'Too much recursion' after processing " + c + ' task groups.'));
                      break;
                    }
                    b = e;
                  }
                  try {
                    m();
                  } catch (k) {
                    a.a.dc(k);
                  }
                }
          }
          function c() {
            b();
            g = e = d.length = 0;
          }
          var d = [],
            e = 0,
            f = 1,
            g = 0;
          return {
            scheduler: x.MutationObserver
              ? (function(a) {
                  var b = t.createElement('div');
                  new MutationObserver(a).observe(b, { attributes: !0 });
                  return function() {
                    b.classList.toggle('foo');
                  };
                })(c)
              : t && 'onreadystatechange' in t.createElement('script')
              ? function(a) {
                  var b = t.createElement('script');
                  b.onreadystatechange = function() {
                    b.onreadystatechange = null;
                    t.documentElement.removeChild(b);
                    b = null;
                    a();
                  };
                  t.documentElement.appendChild(b);
                }
              : function(a) {
                  setTimeout(a, 0);
                },
            Za: function(b) {
              e || a.Z.scheduler(c);
              d[e++] = b;
              return f++;
            },
            cancel: function(a) {
              a -= f - e;
              a >= g && a < e && (d[a] = null);
            },
            resetForTesting: function() {
              var a = e - g;
              g = e = d.length = 0;
              return a;
            },
            rd: b,
          };
        })();
        a.b('tasks', a.Z);
        a.b('tasks.schedule', a.Z.Za);
        a.b('tasks.runEarly', a.Z.rd);
        a.Aa = {
          throttle: function(b, c) {
            b.throttleEvaluation = c;
            var d = null;
            return a.B({
              read: b,
              write: function(e) {
                clearTimeout(d);
                d = a.a.setTimeout(function() {
                  b(e);
                }, c);
              },
            });
          },
          rateLimit: function(a, c) {
            var d, e, f;
            'number' == typeof c ? (d = c) : ((d = c.timeout), (e = c.method));
            a.gb = !1;
            f = 'notifyWhenChangesStop' == e ? T : S;
            a.Wa(function(a) {
              return f(a, d);
            });
          },
          deferred: function(b, c) {
            if (!0 !== c)
              throw Error(
                "The 'deferred' extender only accepts the value 'true', because it is not supported to turn deferral off once enabled.",
              );
            b.gb ||
              ((b.gb = !0),
              b.Wa(function(c) {
                var e,
                  f = !1;
                return function() {
                  if (!f) {
                    a.Z.cancel(e);
                    e = a.Z.Za(c);
                    try {
                      (f = !0), b.notifySubscribers(n, 'dirty');
                    } finally {
                      f = !1;
                    }
                  }
                };
              }));
          },
          notify: function(a, c) {
            a.equalityComparer = 'always' == c ? null : J;
          },
        };
        var R = { undefined: 1, boolean: 1, number: 1, string: 1 };
        a.b('extenders', a.Aa);
        a.zc = function(b, c, d) {
          this.$ = b;
          this.jb = c;
          this.Pc = d;
          this.T = !1;
          a.H(this, 'dispose', this.k);
        };
        a.zc.prototype.k = function() {
          this.T = !0;
          this.Pc();
        };
        a.K = function() {
          a.a.ab(this, D);
          D.ub(this);
        };
        var E = 'change',
          D = {
            ub: function(a) {
              a.F = { change: [] };
              a.Qb = 1;
            },
            Y: function(b, c, d) {
              var e = this;
              d = d || E;
              var f = new a.zc(e, c ? b.bind(c) : b, function() {
                a.a.Na(e.F[d], f);
                e.Ka && e.Ka(d);
              });
              e.ua && e.ua(d);
              e.F[d] || (e.F[d] = []);
              e.F[d].push(f);
              return f;
            },
            notifySubscribers: function(b, c) {
              c = c || E;
              c === E && this.Kb();
              if (this.Ra(c)) {
                var d = (c === E && this.Fc) || this.F[c].slice(0);
                try {
                  a.l.Xb();
                  for (var e = 0, f; (f = d[e]); ++e) f.T || f.jb(b);
                } finally {
                  a.l.end();
                }
              }
            },
            Pa: function() {
              return this.Qb;
            },
            Zc: function(a) {
              return this.Pa() !== a;
            },
            Kb: function() {
              ++this.Qb;
            },
            Wa: function(b) {
              var c = this,
                d = a.I(c),
                e,
                f,
                g,
                h;
              c.Ja || ((c.Ja = c.notifySubscribers), (c.notifySubscribers = U));
              var l = b(function() {
                c.Ha = !1;
                d && h === c && (h = c.Mb ? c.Mb() : c());
                var a = f || c.Ua(g, h);
                f = e = !1;
                a && c.Ja((g = h));
              });
              c.Pb = function(a) {
                c.Fc = c.F[E].slice(0);
                c.Ha = e = !0;
                h = a;
                l();
              };
              c.Ob = function(a) {
                e || ((g = a), c.Ja(a, 'beforeChange'));
              };
              c.Hc = function() {
                c.Ua(g, c.p(!0)) && (f = !0);
              };
            },
            Ra: function(a) {
              return this.F[a] && this.F[a].length;
            },
            Xc: function(b) {
              if (b) return (this.F[b] && this.F[b].length) || 0;
              var c = 0;
              a.a.D(this.F, function(a, b) {
                'dirty' !== a && (c += b.length);
              });
              return c;
            },
            Ua: function(a, c) {
              return !this.equalityComparer || !this.equalityComparer(a, c);
            },
            extend: function(b) {
              var c = this;
              b &&
                a.a.D(b, function(b, e) {
                  var f = a.Aa[b];
                  'function' == typeof f && (c = f(c, e) || c);
                });
              return c;
            },
          };
        a.H(D, 'subscribe', D.Y);
        a.H(D, 'extend', D.extend);
        a.H(D, 'getSubscriptionsCount', D.Xc);
        a.a.la && a.a.$a(D, Function.prototype);
        a.K.fn = D;
        a.lc = function(a) {
          return null != a && 'function' == typeof a.Y && 'function' == typeof a.notifySubscribers;
        };
        a.b('subscribable', a.K);
        a.b('isSubscribable', a.lc);
        a.xa = a.l = (function() {
          function b(a) {
            d.push(e);
            e = a;
          }
          function c() {
            e = d.pop();
          }
          var d = [],
            e,
            f = 0;
          return {
            Xb: b,
            end: c,
            sc: function(b) {
              if (e) {
                if (!a.lc(b)) throw Error('Only subscribable things can act as dependencies');
                e.jb.call(e.Lc, b, b.Gc || (b.Gc = ++f));
              }
            },
            w: function(a, d, e) {
              try {
                return b(), a.apply(d, e || []);
              } finally {
                c();
              }
            },
            Ca: function() {
              if (e) return e.m.Ca();
            },
            Va: function() {
              if (e) return e.Va;
            },
          };
        })();
        a.b('computedContext', a.xa);
        a.b('computedContext.getDependenciesCount', a.xa.Ca);
        a.b('computedContext.isInitial', a.xa.Va);
        a.b('ignoreDependencies', (a.wd = a.l.w));
        var F = a.a.bc('_latestValue');
        a.O = function(b) {
          function c() {
            if (0 < arguments.length)
              return c.Ua(c[F], arguments[0]) && (c.ia(), (c[F] = arguments[0]), c.ha()), this;
            a.l.sc(c);
            return c[F];
          }
          c[F] = b;
          a.a.la || a.a.extend(c, a.K.fn);
          a.K.fn.ub(c);
          a.a.ab(c, B);
          a.options.deferUpdates && a.Aa.deferred(c, !0);
          return c;
        };
        var B = {
          equalityComparer: J,
          p: function() {
            return this[F];
          },
          ha: function() {
            this.notifySubscribers(this[F]);
          },
          ia: function() {
            this.notifySubscribers(this[F], 'beforeChange');
          },
        };
        a.a.la && a.a.$a(B, a.K.fn);
        var I = (a.O.md = '__ko_proto__');
        B[I] = a.O;
        a.Qa = function(b, c) {
          return null === b || b === n || b[I] === n ? !1 : b[I] === c ? !0 : a.Qa(b[I], c);
        };
        a.I = function(b) {
          return a.Qa(b, a.O);
        };
        a.Da = function(b) {
          return ('function' == typeof b && b[I] === a.O) ||
            ('function' == typeof b && b[I] === a.B && b.$c)
            ? !0
            : !1;
        };
        a.b('observable', a.O);
        a.b('isObservable', a.I);
        a.b('isWriteableObservable', a.Da);
        a.b('isWritableObservable', a.Da);
        a.b('observable.fn', B);
        a.H(B, 'peek', B.p);
        a.H(B, 'valueHasMutated', B.ha);
        a.H(B, 'valueWillMutate', B.ia);
        a.ma = function(b) {
          b = b || [];
          if ('object' != typeof b || !('length' in b))
            throw Error(
              'The argument passed when initializing an observable array must be an array, or null, or undefined.',
            );
          b = a.O(b);
          a.a.ab(b, a.ma.fn);
          return b.extend({ trackArrayChanges: !0 });
        };
        a.ma.fn = {
          remove: function(b) {
            for (
              var c = this.p(),
                d = [],
                e =
                  'function' != typeof b || a.I(b)
                    ? function(a) {
                        return a === b;
                      }
                    : b,
                f = 0;
              f < c.length;
              f++
            ) {
              var g = c[f];
              e(g) && (0 === d.length && this.ia(), d.push(g), c.splice(f, 1), f--);
            }
            d.length && this.ha();
            return d;
          },
          removeAll: function(b) {
            if (b === n) {
              var c = this.p(),
                d = c.slice(0);
              this.ia();
              c.splice(0, c.length);
              this.ha();
              return d;
            }
            return b
              ? this.remove(function(c) {
                  return 0 <= a.a.o(b, c);
                })
              : [];
          },
          destroy: function(b) {
            var c = this.p(),
              d =
                'function' != typeof b || a.I(b)
                  ? function(a) {
                      return a === b;
                    }
                  : b;
            this.ia();
            for (var e = c.length - 1; 0 <= e; e--) d(c[e]) && (c[e]._destroy = !0);
            this.ha();
          },
          destroyAll: function(b) {
            return b === n
              ? this.destroy(function() {
                  return !0;
                })
              : b
              ? this.destroy(function(c) {
                  return 0 <= a.a.o(b, c);
                })
              : [];
          },
          indexOf: function(b) {
            var c = this();
            return a.a.o(c, b);
          },
          replace: function(a, c) {
            var d = this.indexOf(a);
            0 <= d && (this.ia(), (this.p()[d] = c), this.ha());
          },
        };
        a.a.la && a.a.$a(a.ma.fn, a.O.fn);
        a.a.r('pop push reverse shift sort splice unshift'.split(' '), function(b) {
          a.ma.fn[b] = function() {
            var a = this.p();
            this.ia();
            this.Yb(a, b, arguments);
            var d = a[b].apply(a, arguments);
            this.ha();
            return d === a ? this : d;
          };
        });
        a.a.r(['slice'], function(b) {
          a.ma.fn[b] = function() {
            var a = this();
            return a[b].apply(a, arguments);
          };
        });
        a.b('observableArray', a.ma);
        a.Aa.trackArrayChanges = function(b, c) {
          function d() {
            if (!e) {
              e = !0;
              l = b.notifySubscribers;
              b.notifySubscribers = function(a, b) {
                (b && b !== E) || ++h;
                return l.apply(this, arguments);
              };
              var c = [].concat(b.p() || []);
              f = null;
              g = b.Y(function(d) {
                d = [].concat(d || []);
                if (b.Ra('arrayChange')) {
                  var e;
                  if (!f || 1 < h) f = a.a.lb(c, d, b.kb);
                  e = f;
                }
                c = d;
                f = null;
                h = 0;
                e && e.length && b.notifySubscribers(e, 'arrayChange');
              });
            }
          }
          b.kb = {};
          c && 'object' == typeof c && a.a.extend(b.kb, c);
          b.kb.sparse = !0;
          if (!b.Yb) {
            var e = !1,
              f = null,
              g,
              h = 0,
              l,
              m = b.ua,
              k = b.Ka;
            b.ua = function(a) {
              m && m.call(b, a);
              'arrayChange' === a && d();
            };
            b.Ka = function(a) {
              k && k.call(b, a);
              'arrayChange' !== a ||
                b.Ra('arrayChange') ||
                (l && ((b.notifySubscribers = l), (l = n)), g.k(), (e = !1));
            };
            b.Yb = function(b, c, d) {
              function k(a, b, c) {
                return (m[m.length] = { status: a, value: b, index: c });
              }
              if (e && !h) {
                var m = [],
                  l = b.length,
                  g = d.length,
                  G = 0;
                switch (c) {
                  case 'push':
                    G = l;
                  case 'unshift':
                    for (c = 0; c < g; c++) k('added', d[c], G + c);
                    break;
                  case 'pop':
                    G = l - 1;
                  case 'shift':
                    l && k('deleted', b[G], G);
                    break;
                  case 'splice':
                    c = Math.min(Math.max(0, 0 > d[0] ? l + d[0] : d[0]), l);
                    for (
                      var l = 1 === g ? l : Math.min(c + (d[1] || 0), l),
                        g = c + g - 2,
                        G = Math.max(l, g),
                        n = [],
                        s = [],
                        w = 2;
                      c < G;
                      ++c, ++w
                    )
                      c < l && s.push(k('deleted', b[c], c)), c < g && n.push(k('added', d[w], c));
                    a.a.hc(s, n);
                    break;
                  default:
                    return;
                }
                f = m;
              }
            };
          }
        };
        var s = a.a.bc('_state');
        a.m = a.B = function(b, c, d) {
          function e() {
            if (0 < arguments.length) {
              if ('function' === typeof f) f.apply(g.sb, arguments);
              else
                throw Error(
                  "Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.",
                );
              return this;
            }
            a.l.sc(e);
            (g.V || (g.t && e.Sa())) && e.U();
            return g.M;
          }
          'object' === typeof b ? (d = b) : ((d = d || {}), b && (d.read = b));
          if ('function' != typeof d.read)
            throw Error('Pass a function that returns the value of the ko.computed');
          var f = d.write,
            g = {
              M: n,
              da: !0,
              V: !0,
              Ta: !1,
              Hb: !1,
              T: !1,
              Ya: !1,
              t: !1,
              od: d.read,
              sb: c || d.owner,
              i: d.disposeWhenNodeIsRemoved || d.i || null,
              ya: d.disposeWhen || d.ya,
              pb: null,
              s: {},
              L: 0,
              fc: null,
            };
          e[s] = g;
          e.$c = 'function' === typeof f;
          a.a.la || a.a.extend(e, a.K.fn);
          a.K.fn.ub(e);
          a.a.ab(e, z);
          d.pure
            ? ((g.Ya = !0), (g.t = !0), a.a.extend(e, Y))
            : d.deferEvaluation && a.a.extend(e, Z);
          a.options.deferUpdates && a.Aa.deferred(e, !0);
          g.i && ((g.Hb = !0), g.i.nodeType || (g.i = null));
          g.t || d.deferEvaluation || e.U();
          g.i &&
            e.ca() &&
            a.a.G.qa(
              g.i,
              (g.pb = function() {
                e.k();
              }),
            );
          return e;
        };
        var z = {
            equalityComparer: J,
            Ca: function() {
              return this[s].L;
            },
            Sb: function(a, c, d) {
              if (this[s].Ya && c === this)
                throw Error("A 'pure' computed must not be called recursively");
              this[s].s[a] = d;
              d.Ia = this[s].L++;
              d.pa = c.Pa();
            },
            Sa: function() {
              var a,
                c,
                d = this[s].s;
              for (a in d)
                if (d.hasOwnProperty(a) && ((c = d[a]), (this.oa && c.$.Ha) || c.$.Zc(c.pa)))
                  return !0;
            },
            gd: function() {
              this.oa && !this[s].Ta && this.oa(!1);
            },
            ca: function() {
              var a = this[s];
              return a.V || 0 < a.L;
            },
            qd: function() {
              this.Ha ? this[s].V && (this[s].da = !0) : this.ec();
            },
            yc: function(a) {
              if (a.gb && !this[s].i) {
                var c = a.Y(this.gd, this, 'dirty'),
                  d = a.Y(this.qd, this);
                return {
                  $: a,
                  k: function() {
                    c.k();
                    d.k();
                  },
                };
              }
              return a.Y(this.ec, this);
            },
            ec: function() {
              var b = this,
                c = b.throttleEvaluation;
              c && 0 <= c
                ? (clearTimeout(this[s].fc),
                  (this[s].fc = a.a.setTimeout(function() {
                    b.U(!0);
                  }, c)))
                : b.oa
                ? b.oa(!0)
                : b.U(!0);
            },
            U: function(b) {
              var c = this[s],
                d = c.ya,
                e = !1;
              if (!c.Ta && !c.T) {
                if ((c.i && !a.a.qb(c.i)) || (d && d())) {
                  if (!c.Hb) {
                    this.k();
                    return;
                  }
                } else c.Hb = !1;
                c.Ta = !0;
                try {
                  e = this.Vc(b);
                } finally {
                  c.Ta = !1;
                }
                c.L || this.k();
                return e;
              }
            },
            Vc: function(b) {
              var c = this[s],
                d = !1,
                e = c.Ya ? n : !c.L,
                f = { Mc: this, Oa: c.s, ob: c.L };
              a.l.Xb({ Lc: f, jb: W, m: this, Va: e });
              c.s = {};
              c.L = 0;
              f = this.Uc(c, f);
              this.Ua(c.M, f) &&
                (c.t || this.notifySubscribers(c.M, 'beforeChange'),
                (c.M = f),
                c.t ? this.Kb() : b && this.notifySubscribers(c.M),
                (d = !0));
              e && this.notifySubscribers(c.M, 'awake');
              return d;
            },
            Uc: function(b, c) {
              try {
                var d = b.od;
                return b.sb ? d.call(b.sb) : d();
              } finally {
                a.l.end(), c.ob && !b.t && a.a.D(c.Oa, V), (b.da = b.V = !1);
              }
            },
            p: function(a) {
              var c = this[s];
              ((c.V && (a || !c.L)) || (c.t && this.Sa())) && this.U();
              return c.M;
            },
            Wa: function(b) {
              a.K.fn.Wa.call(this, b);
              this.Mb = function() {
                this[s].da ? this.U() : (this[s].V = !1);
                return this[s].M;
              };
              this.oa = function(a) {
                this.Ob(this[s].M);
                this[s].V = !0;
                a && (this[s].da = !0);
                this.Pb(this);
              };
            },
            k: function() {
              var b = this[s];
              !b.t &&
                b.s &&
                a.a.D(b.s, function(a, b) {
                  b.k && b.k();
                });
              b.i && b.pb && a.a.G.tc(b.i, b.pb);
              b.s = null;
              b.L = 0;
              b.T = !0;
              b.da = !1;
              b.V = !1;
              b.t = !1;
              b.i = null;
            },
          },
          Y = {
            ua: function(b) {
              var c = this,
                d = c[s];
              if (!d.T && d.t && 'change' == b) {
                d.t = !1;
                if (d.da || c.Sa()) (d.s = null), (d.L = 0), c.U() && c.Kb();
                else {
                  var e = [];
                  a.a.D(d.s, function(a, b) {
                    e[b.Ia] = a;
                  });
                  a.a.r(e, function(a, b) {
                    var e = d.s[a],
                      l = c.yc(e.$);
                    l.Ia = b;
                    l.pa = e.pa;
                    d.s[a] = l;
                  });
                }
                d.T || c.notifySubscribers(d.M, 'awake');
              }
            },
            Ka: function(b) {
              var c = this[s];
              c.T ||
                'change' != b ||
                this.Ra('change') ||
                (a.a.D(c.s, function(a, b) {
                  b.k && ((c.s[a] = { $: b.$, Ia: b.Ia, pa: b.pa }), b.k());
                }),
                (c.t = !0),
                this.notifySubscribers(n, 'asleep'));
            },
            Pa: function() {
              var b = this[s];
              b.t && (b.da || this.Sa()) && this.U();
              return a.K.fn.Pa.call(this);
            },
          },
          Z = {
            ua: function(a) {
              ('change' != a && 'beforeChange' != a) || this.p();
            },
          };
        a.a.la && a.a.$a(z, a.K.fn);
        var P = a.O.md;
        a.m[P] = a.O;
        z[P] = a.m;
        a.bd = function(b) {
          return a.Qa(b, a.m);
        };
        a.cd = function(b) {
          return a.Qa(b, a.m) && b[s] && b[s].Ya;
        };
        a.b('computed', a.m);
        a.b('dependentObservable', a.m);
        a.b('isComputed', a.bd);
        a.b('isPureComputed', a.cd);
        a.b('computed.fn', z);
        a.H(z, 'peek', z.p);
        a.H(z, 'dispose', z.k);
        a.H(z, 'isActive', z.ca);
        a.H(z, 'getDependenciesCount', z.Ca);
        a.rc = function(b, c) {
          if ('function' === typeof b) return a.m(b, c, { pure: !0 });
          b = a.a.extend({}, b);
          b.pure = !0;
          return a.m(b, c);
        };
        a.b('pureComputed', a.rc);
        (function() {
          function b(a, f, g) {
            g = g || new d();
            a = f(a);
            if (
              'object' != typeof a ||
              null === a ||
              a === n ||
              a instanceof RegExp ||
              a instanceof Date ||
              a instanceof String ||
              a instanceof Number ||
              a instanceof Boolean
            )
              return a;
            var h = a instanceof Array ? [] : {};
            g.save(a, h);
            c(a, function(c) {
              var d = f(a[c]);
              switch (typeof d) {
                case 'boolean':
                case 'number':
                case 'string':
                case 'function':
                  h[c] = d;
                  break;
                case 'object':
                case 'undefined':
                  var k = g.get(d);
                  h[c] = k !== n ? k : b(d, f, g);
              }
            });
            return h;
          }
          function c(a, b) {
            if (a instanceof Array) {
              for (var c = 0; c < a.length; c++) b(c);
              'function' == typeof a.toJSON && b('toJSON');
            } else for (c in a) b(c);
          }
          function d() {
            this.keys = [];
            this.Lb = [];
          }
          a.Ac = function(c) {
            if (0 == arguments.length)
              throw Error('When calling ko.toJS, pass the object you want to convert.');
            return b(c, function(b) {
              for (var c = 0; a.I(b) && 10 > c; c++) b = b();
              return b;
            });
          };
          a.toJSON = function(b, c, d) {
            b = a.Ac(b);
            return a.a.Gb(b, c, d);
          };
          d.prototype = {
            save: function(b, c) {
              var d = a.a.o(this.keys, b);
              0 <= d ? (this.Lb[d] = c) : (this.keys.push(b), this.Lb.push(c));
            },
            get: function(b) {
              b = a.a.o(this.keys, b);
              return 0 <= b ? this.Lb[b] : n;
            },
          };
        })();
        a.b('toJS', a.Ac);
        a.b('toJSON', a.toJSON);
        (function() {
          a.j = {
            u: function(b) {
              switch (a.a.A(b)) {
                case 'option':
                  return !0 === b.__ko__hasDomDataOptionValue__
                    ? a.a.e.get(b, a.d.options.zb)
                    : 7 >= a.a.C
                    ? b.getAttributeNode('value') && b.getAttributeNode('value').specified
                      ? b.value
                      : b.text
                    : b.value;
                case 'select':
                  return 0 <= b.selectedIndex ? a.j.u(b.options[b.selectedIndex]) : n;
                default:
                  return b.value;
              }
            },
            ja: function(b, c, d) {
              switch (a.a.A(b)) {
                case 'option':
                  switch (typeof c) {
                    case 'string':
                      a.a.e.set(b, a.d.options.zb, n);
                      '__ko__hasDomDataOptionValue__' in b &&
                        delete b.__ko__hasDomDataOptionValue__;
                      b.value = c;
                      break;
                    default:
                      a.a.e.set(b, a.d.options.zb, c),
                        (b.__ko__hasDomDataOptionValue__ = !0),
                        (b.value = 'number' === typeof c ? c : '');
                  }
                  break;
                case 'select':
                  if ('' === c || null === c) c = n;
                  for (var e = -1, f = 0, g = b.options.length, h; f < g; ++f)
                    if (((h = a.j.u(b.options[f])), h == c || ('' == h && c === n))) {
                      e = f;
                      break;
                    }
                  if (d || 0 <= e || (c === n && 1 < b.size)) b.selectedIndex = e;
                  break;
                default:
                  if (null === c || c === n) c = '';
                  b.value = c;
              }
            },
          };
        })();
        a.b('selectExtensions', a.j);
        a.b('selectExtensions.readValue', a.j.u);
        a.b('selectExtensions.writeValue', a.j.ja);
        a.h = (function() {
          function b(b) {
            b = a.a.cb(b);
            123 === b.charCodeAt(0) && (b = b.slice(1, -1));
            var c = [],
              d = b.match(e),
              r,
              h = [],
              p = 0;
            if (d) {
              d.push(',');
              for (var A = 0, y; (y = d[A]); ++A) {
                var v = y.charCodeAt(0);
                if (44 === v) {
                  if (0 >= p) {
                    c.push(
                      r && h.length ? { key: r, value: h.join('') } : { unknown: r || h.join('') },
                    );
                    r = p = 0;
                    h = [];
                    continue;
                  }
                } else if (58 === v) {
                  if (!p && !r && 1 === h.length) {
                    r = h.pop();
                    continue;
                  }
                } else
                  47 === v && A && 1 < y.length
                    ? (v = d[A - 1].match(f)) &&
                      !g[v[0]] &&
                      ((b = b.substr(b.indexOf(y) + 1)),
                      (d = b.match(e)),
                      d.push(','),
                      (A = -1),
                      (y = '/'))
                    : 40 === v || 123 === v || 91 === v
                    ? ++p
                    : 41 === v || 125 === v || 93 === v
                    ? --p
                    : r || h.length || (34 !== v && 39 !== v) || (y = y.slice(1, -1));
                h.push(y);
              }
            }
            return c;
          }
          var c = ['true', 'false', 'null', 'undefined'],
            d = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i,
            e = RegExp(
              '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|/(?:[^/\\\\]|\\\\.)*/w*|[^\\s:,/][^,"\'{}()/:[\\]]*[^\\s,"\'{}()/:[\\]]|[^\\s]',
              'g',
            ),
            f = /[\])"'A-Za-z0-9_$]+$/,
            g = { in: 1, return: 1, typeof: 1 },
            h = {};
          return {
            va: [],
            ga: h,
            Ab: b,
            Xa: function(e, m) {
              function k(b, e) {
                var m;
                if (!A) {
                  var l = a.getBindingHandler(b);
                  if (l && l.preprocess && !(e = l.preprocess(e, b, k))) return;
                  if ((l = h[b]))
                    (m = e),
                      0 <= a.a.o(c, m)
                        ? (m = !1)
                        : ((l = m.match(d)),
                          (m = null === l ? !1 : l[1] ? 'Object(' + l[1] + ')' + l[2] : m)),
                      (l = m);
                  l && g.push("'" + b + "':function(_z){" + m + '=_z}');
                }
                p && (e = 'function(){return ' + e + ' }');
                f.push("'" + b + "':" + e);
              }
              m = m || {};
              var f = [],
                g = [],
                p = m.valueAccessors,
                A = m.bindingParams,
                y = 'string' === typeof e ? b(e) : e;
              a.a.r(y, function(a) {
                k(a.key || a.unknown, a.value);
              });
              g.length && k('_ko_property_writers', '{' + g.join(',') + ' }');
              return f.join(',');
            },
            fd: function(a, b) {
              for (var c = 0; c < a.length; c++) if (a[c].key == b) return !0;
              return !1;
            },
            Ga: function(b, c, d, e, f) {
              if (b && a.I(b)) !a.Da(b) || (f && b.p() === e) || b(e);
              else if ((b = c.get('_ko_property_writers')) && b[d]) b[d](e);
            },
          };
        })();
        a.b('expressionRewriting', a.h);
        a.b('expressionRewriting.bindingRewriteValidators', a.h.va);
        a.b('expressionRewriting.parseObjectLiteral', a.h.Ab);
        a.b('expressionRewriting.preProcessBindings', a.h.Xa);
        a.b('expressionRewriting._twoWayBindings', a.h.ga);
        a.b('jsonExpressionRewriting', a.h);
        a.b('jsonExpressionRewriting.insertPropertyAccessorsIntoJson', a.h.Xa);
        (function() {
          function b(a) {
            return 8 == a.nodeType && g.test(f ? a.text : a.nodeValue);
          }
          function c(a) {
            return 8 == a.nodeType && h.test(f ? a.text : a.nodeValue);
          }
          function d(a, d) {
            for (var e = a, f = 1, l = []; (e = e.nextSibling); ) {
              if (c(e) && (f--, 0 === f)) return l;
              l.push(e);
              b(e) && f++;
            }
            if (!d) throw Error('Cannot find closing comment tag to match: ' + a.nodeValue);
            return null;
          }
          function e(a, b) {
            var c = d(a, b);
            return c ? (0 < c.length ? c[c.length - 1].nextSibling : a.nextSibling) : null;
          }
          var f = t && '\x3c!--test--\x3e' === t.createComment('test').text,
            g = f ? /^\x3c!--\s*ko(?:\s+([\s\S]+))?\s*--\x3e$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/,
            h = f ? /^\x3c!--\s*\/ko\s*--\x3e$/ : /^\s*\/ko\s*$/,
            l = { ul: !0, ol: !0 };
          a.f = {
            aa: {},
            childNodes: function(a) {
              return b(a) ? d(a) : a.childNodes;
            },
            za: function(c) {
              if (b(c)) {
                c = a.f.childNodes(c);
                for (var d = 0, e = c.length; d < e; d++) a.removeNode(c[d]);
              } else a.a.rb(c);
            },
            fa: function(c, d) {
              if (b(c)) {
                a.f.za(c);
                for (var e = c.nextSibling, f = 0, l = d.length; f < l; f++)
                  e.parentNode.insertBefore(d[f], e);
              } else a.a.fa(c, d);
            },
            qc: function(a, c) {
              b(a)
                ? a.parentNode.insertBefore(c, a.nextSibling)
                : a.firstChild
                ? a.insertBefore(c, a.firstChild)
                : a.appendChild(c);
            },
            kc: function(c, d, e) {
              e
                ? b(c)
                  ? c.parentNode.insertBefore(d, e.nextSibling)
                  : e.nextSibling
                  ? c.insertBefore(d, e.nextSibling)
                  : c.appendChild(d)
                : a.f.qc(c, d);
            },
            firstChild: function(a) {
              return b(a)
                ? !a.nextSibling || c(a.nextSibling)
                  ? null
                  : a.nextSibling
                : a.firstChild;
            },
            nextSibling: function(a) {
              b(a) && (a = e(a));
              return a.nextSibling && c(a.nextSibling) ? null : a.nextSibling;
            },
            Yc: b,
            vd: function(a) {
              return (a = (f ? a.text : a.nodeValue).match(g)) ? a[1] : null;
            },
            oc: function(d) {
              if (l[a.a.A(d)]) {
                var k = d.firstChild;
                if (k) {
                  do
                    if (1 === k.nodeType) {
                      var f;
                      f = k.firstChild;
                      var g = null;
                      if (f) {
                        do
                          if (g) g.push(f);
                          else if (b(f)) {
                            var h = e(f, !0);
                            h ? (f = h) : (g = [f]);
                          } else c(f) && (g = [f]);
                        while ((f = f.nextSibling));
                      }
                      if ((f = g))
                        for (g = k.nextSibling, h = 0; h < f.length; h++)
                          g ? d.insertBefore(f[h], g) : d.appendChild(f[h]);
                    }
                  while ((k = k.nextSibling));
                }
              }
            },
          };
        })();
        a.b('virtualElements', a.f);
        a.b('virtualElements.allowedBindings', a.f.aa);
        a.b('virtualElements.emptyNode', a.f.za);
        a.b('virtualElements.insertAfter', a.f.kc);
        a.b('virtualElements.prepend', a.f.qc);
        a.b('virtualElements.setDomNodeChildren', a.f.fa);
        (function() {
          a.S = function() {
            this.Kc = {};
          };
          a.a.extend(a.S.prototype, {
            nodeHasBindings: function(b) {
              switch (b.nodeType) {
                case 1:
                  return null != b.getAttribute('data-bind') || a.g.getComponentNameForNode(b);
                case 8:
                  return a.f.Yc(b);
                default:
                  return !1;
              }
            },
            getBindings: function(b, c) {
              var d = this.getBindingsString(b, c),
                d = d ? this.parseBindingsString(d, c, b) : null;
              return a.g.Rb(d, b, c, !1);
            },
            getBindingAccessors: function(b, c) {
              var d = this.getBindingsString(b, c),
                d = d ? this.parseBindingsString(d, c, b, { valueAccessors: !0 }) : null;
              return a.g.Rb(d, b, c, !0);
            },
            getBindingsString: function(b) {
              switch (b.nodeType) {
                case 1:
                  return b.getAttribute('data-bind');
                case 8:
                  return a.f.vd(b);
                default:
                  return null;
              }
            },
            parseBindingsString: function(b, c, d, e) {
              try {
                var f = this.Kc,
                  g = b + ((e && e.valueAccessors) || ''),
                  h;
                if (!(h = f[g])) {
                  var l,
                    m = 'with($context){with($data||{}){return{' + a.h.Xa(b, e) + '}}}';
                  l = new Function('$context', '$element', m);
                  h = f[g] = l;
                }
                return h(c, d);
              } catch (k) {
                throw ((k.message =
                  'Unable to parse bindings.\nBindings value: ' + b + '\nMessage: ' + k.message),
                k);
              }
            },
          });
          a.S.instance = new a.S();
        })();
        a.b('bindingProvider', a.S);
        (function() {
          function b(a) {
            return function() {
              return a;
            };
          }
          function c(a) {
            return a();
          }
          function d(b) {
            return a.a.Ea(a.l.w(b), function(a, c) {
              return function() {
                return b()[c];
              };
            });
          }
          function e(c, e, k) {
            return 'function' === typeof c ? d(c.bind(null, e, k)) : a.a.Ea(c, b);
          }
          function f(a, b) {
            return d(this.getBindings.bind(this, a, b));
          }
          function g(b, c, d) {
            var e,
              k = a.f.firstChild(c),
              f = a.S.instance,
              m = f.preprocessNode;
            if (m) {
              for (; (e = k); ) (k = a.f.nextSibling(e)), m.call(f, e);
              k = a.f.firstChild(c);
            }
            for (; (e = k); ) (k = a.f.nextSibling(e)), h(b, e, d);
          }
          function h(b, c, d) {
            var e = !0,
              k = 1 === c.nodeType;
            k && a.f.oc(c);
            if ((k && d) || a.S.instance.nodeHasBindings(c))
              e = m(c, null, b, d).shouldBindDescendants;
            e && !r[a.a.A(c)] && g(b, c, !k);
          }
          function l(b) {
            var c = [],
              d = {},
              e = [];
            a.a.D(b, function X(k) {
              if (!d[k]) {
                var f = a.getBindingHandler(k);
                f &&
                  (f.after &&
                    (e.push(k),
                    a.a.r(f.after, function(c) {
                      if (b[c]) {
                        if (-1 !== a.a.o(e, c))
                          throw Error(
                            'Cannot combine the following bindings, because they have a cyclic dependency: ' +
                              e.join(', '),
                          );
                        X(c);
                      }
                    }),
                    e.length--),
                  c.push({ key: k, jc: f }));
                d[k] = !0;
              }
            });
            return c;
          }
          function m(b, d, e, k) {
            var m = a.a.e.get(b, q);
            if (!d) {
              if (m) throw Error('You cannot apply bindings multiple times to the same element.');
              a.a.e.set(b, q, !0);
            }
            !m && k && a.xc(b, e);
            var g;
            if (d && 'function' !== typeof d) g = d;
            else {
              var h = a.S.instance,
                r = h.getBindingAccessors || f,
                p = a.B(
                  function() {
                    (g = d ? d(e, b) : r.call(h, b, e)) && e.Q && e.Q();
                    return g;
                  },
                  null,
                  { i: b },
                );
              (g && p.ca()) || (p = null);
            }
            var s;
            if (g) {
              var t = p
                  ? function(a) {
                      return function() {
                        return c(p()[a]);
                      };
                    }
                  : function(a) {
                      return g[a];
                    },
                u = function() {
                  return a.a.Ea(p ? p() : g, c);
                };
              u.get = function(a) {
                return g[a] && c(t(a));
              };
              u.has = function(a) {
                return a in g;
              };
              k = l(g);
              a.a.r(k, function(c) {
                var d = c.jc.init,
                  k = c.jc.update,
                  f = c.key;
                if (8 === b.nodeType && !a.f.aa[f])
                  throw Error("The binding '" + f + "' cannot be used with virtual elements");
                try {
                  'function' == typeof d &&
                    a.l.w(function() {
                      var a = d(b, t(f), u, e.$data, e);
                      if (a && a.controlsDescendantBindings) {
                        if (s !== n)
                          throw Error(
                            'Multiple bindings (' +
                              s +
                              ' and ' +
                              f +
                              ') are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.',
                          );
                        s = f;
                      }
                    }),
                    'function' == typeof k &&
                      a.B(
                        function() {
                          k(b, t(f), u, e.$data, e);
                        },
                        null,
                        { i: b },
                      );
                } catch (m) {
                  throw ((m.message =
                    'Unable to process binding "' + f + ': ' + g[f] + '"\nMessage: ' + m.message),
                  m);
                }
              });
            }
            return { shouldBindDescendants: s === n };
          }
          function k(b) {
            return b && b instanceof a.R ? b : new a.R(b);
          }
          a.d = {};
          var r = { script: !0, textarea: !0, template: !0 };
          a.getBindingHandler = function(b) {
            return a.d[b];
          };
          a.R = function(b, c, d, e, k) {
            function f() {
              var k = g ? b() : b,
                m = a.a.c(k);
              c
                ? (c.Q && c.Q(), a.a.extend(l, c), (l.Q = r))
                : ((l.$parents = []), (l.$root = m), (l.ko = a));
              l.$rawData = k;
              l.$data = m;
              d && (l[d] = m);
              e && e(l, c, m);
              return l.$data;
            }
            function m() {
              return h && !a.a.Tb(h);
            }
            var l = this,
              g = 'function' == typeof b && !a.I(b),
              h,
              r;
            k && k.exportDependencies
              ? f()
              : ((r = a.B(f, null, { ya: m, i: !0 })),
                r.ca() &&
                  ((l.Q = r),
                  (r.equalityComparer = null),
                  (h = []),
                  (r.Dc = function(b) {
                    h.push(b);
                    a.a.G.qa(b, function(b) {
                      a.a.Na(h, b);
                      h.length || (r.k(), (l.Q = r = n));
                    });
                  })));
          };
          a.R.prototype.createChildContext = function(b, c, d, e) {
            return new a.R(
              b,
              this,
              c,
              function(a, b) {
                a.$parentContext = b;
                a.$parent = b.$data;
                a.$parents = (b.$parents || []).slice(0);
                a.$parents.unshift(a.$parent);
                d && d(a);
              },
              e,
            );
          };
          a.R.prototype.extend = function(b) {
            return new a.R(this.Q || this.$data, this, null, function(c, d) {
              c.$rawData = d.$rawData;
              a.a.extend(c, 'function' == typeof b ? b() : b);
            });
          };
          a.R.prototype.ac = function(a, b) {
            return this.createChildContext(a, b, null, { exportDependencies: !0 });
          };
          var q = a.a.e.J(),
            p = a.a.e.J();
          a.xc = function(b, c) {
            if (2 == arguments.length) a.a.e.set(b, p, c), c.Q && c.Q.Dc(b);
            else return a.a.e.get(b, p);
          };
          a.La = function(b, c, d) {
            1 === b.nodeType && a.f.oc(b);
            return m(b, c, k(d), !0);
          };
          a.Ic = function(b, c, d) {
            d = k(d);
            return a.La(b, e(c, d, b), d);
          };
          a.hb = function(a, b) {
            (1 !== b.nodeType && 8 !== b.nodeType) || g(k(a), b, !0);
          };
          a.Ub = function(a, b) {
            !u && x.jQuery && (u = x.jQuery);
            if (b && 1 !== b.nodeType && 8 !== b.nodeType)
              throw Error(
                'ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node',
              );
            b = b || x.document.body;
            h(k(a), b, !0);
          };
          a.nb = function(b) {
            switch (b.nodeType) {
              case 1:
              case 8:
                var c = a.xc(b);
                if (c) return c;
                if (b.parentNode) return a.nb(b.parentNode);
            }
            return n;
          };
          a.Oc = function(b) {
            return (b = a.nb(b)) ? b.$data : n;
          };
          a.b('bindingHandlers', a.d);
          a.b('applyBindings', a.Ub);
          a.b('applyBindingsToDescendants', a.hb);
          a.b('applyBindingAccessorsToNode', a.La);
          a.b('applyBindingsToNode', a.Ic);
          a.b('contextFor', a.nb);
          a.b('dataFor', a.Oc);
        })();
        (function(b) {
          function c(c, e) {
            var m = f.hasOwnProperty(c) ? f[c] : b,
              k;
            m
              ? m.Y(e)
              : ((m = f[c] = new a.K()),
                m.Y(e),
                d(c, function(b, d) {
                  var e = !(!d || !d.synchronous);
                  g[c] = { definition: b, dd: e };
                  delete f[c];
                  k || e
                    ? m.notifySubscribers(b)
                    : a.Z.Za(function() {
                        m.notifySubscribers(b);
                      });
                }),
                (k = !0));
          }
          function d(a, b) {
            e('getConfig', [a], function(c) {
              c
                ? e('loadComponent', [a, c], function(a) {
                    b(a, c);
                  })
                : b(null, null);
            });
          }
          function e(c, d, f, k) {
            k || (k = a.g.loaders.slice(0));
            var g = k.shift();
            if (g) {
              var q = g[c];
              if (q) {
                var p = !1;
                if (
                  q.apply(
                    g,
                    d.concat(function(a) {
                      p ? f(null) : null !== a ? f(a) : e(c, d, f, k);
                    }),
                  ) !== b &&
                  ((p = !0), !g.suppressLoaderExceptions)
                )
                  throw Error(
                    'Component loaders must supply values by invoking the callback, not by returning values synchronously.',
                  );
              } else e(c, d, f, k);
            } else f(null);
          }
          var f = {},
            g = {};
          a.g = {
            get: function(d, e) {
              var f = g.hasOwnProperty(d) ? g[d] : b;
              f
                ? f.dd
                  ? a.l.w(function() {
                      e(f.definition);
                    })
                  : a.Z.Za(function() {
                      e(f.definition);
                    })
                : c(d, e);
            },
            $b: function(a) {
              delete g[a];
            },
            Nb: e,
          };
          a.g.loaders = [];
          a.b('components', a.g);
          a.b('components.get', a.g.get);
          a.b('components.clearCachedDefinition', a.g.$b);
        })();
        (function() {
          function b(b, c, d, e) {
            function g() {
              0 === --y && e(h);
            }
            var h = {},
              y = 2,
              v = d.template;
            d = d.viewModel;
            v
              ? f(c, v, function(c) {
                  a.g.Nb('loadTemplate', [b, c], function(a) {
                    h.template = a;
                    g();
                  });
                })
              : g();
            d
              ? f(c, d, function(c) {
                  a.g.Nb('loadViewModel', [b, c], function(a) {
                    h[l] = a;
                    g();
                  });
                })
              : g();
          }
          function c(a, b, d) {
            if ('function' === typeof b)
              d(function(a) {
                return new b(a);
              });
            else if ('function' === typeof b[l]) d(b[l]);
            else if ('instance' in b) {
              var e = b.instance;
              d(function() {
                return e;
              });
            } else 'viewModel' in b ? c(a, b.viewModel, d) : a('Unknown viewModel value: ' + b);
          }
          function d(b) {
            switch (a.a.A(b)) {
              case 'script':
                return a.a.na(b.text);
              case 'textarea':
                return a.a.na(b.value);
              case 'template':
                if (e(b.content)) return a.a.wa(b.content.childNodes);
            }
            return a.a.wa(b.childNodes);
          }
          function e(a) {
            return x.DocumentFragment ? a instanceof DocumentFragment : a && 11 === a.nodeType;
          }
          function f(a, b, c) {
            'string' === typeof b.require
              ? O || x.require
                ? (O || x.require)([b.require], c)
                : a('Uses require, but no AMD loader is present')
              : c(b);
          }
          function g(a) {
            return function(b) {
              throw Error("Component '" + a + "': " + b);
            };
          }
          var h = {};
          a.g.register = function(b, c) {
            if (!c) throw Error('Invalid configuration for ' + b);
            if (a.g.wb(b)) throw Error('Component ' + b + ' is already registered');
            h[b] = c;
          };
          a.g.wb = function(a) {
            return h.hasOwnProperty(a);
          };
          a.g.ud = function(b) {
            delete h[b];
            a.g.$b(b);
          };
          a.g.cc = {
            getConfig: function(a, b) {
              b(h.hasOwnProperty(a) ? h[a] : null);
            },
            loadComponent: function(a, c, d) {
              var e = g(a);
              f(e, c, function(c) {
                b(a, e, c, d);
              });
            },
            loadTemplate: function(b, c, f) {
              b = g(b);
              if ('string' === typeof c) f(a.a.na(c));
              else if (c instanceof Array) f(c);
              else if (e(c)) f(a.a.W(c.childNodes));
              else if (c.element)
                if (
                  ((c = c.element),
                  x.HTMLElement ? c instanceof HTMLElement : c && c.tagName && 1 === c.nodeType)
                )
                  f(d(c));
                else if ('string' === typeof c) {
                  var l = t.getElementById(c);
                  l ? f(d(l)) : b('Cannot find element with ID ' + c);
                } else b('Unknown element type: ' + c);
              else b('Unknown template value: ' + c);
            },
            loadViewModel: function(a, b, d) {
              c(g(a), b, d);
            },
          };
          var l = 'createViewModel';
          a.b('components.register', a.g.register);
          a.b('components.isRegistered', a.g.wb);
          a.b('components.unregister', a.g.ud);
          a.b('components.defaultLoader', a.g.cc);
          a.g.loaders.push(a.g.cc);
          a.g.Ec = h;
        })();
        (function() {
          function b(b, e) {
            var f = b.getAttribute('params');
            if (f) {
              var f = c.parseBindingsString(f, e, b, { valueAccessors: !0, bindingParams: !0 }),
                f = a.a.Ea(f, function(c) {
                  return a.m(c, null, { i: b });
                }),
                g = a.a.Ea(f, function(c) {
                  var e = c.p();
                  return c.ca()
                    ? a.m({
                        read: function() {
                          return a.a.c(c());
                        },
                        write:
                          a.Da(e) &&
                          function(a) {
                            c()(a);
                          },
                        i: b,
                      })
                    : e;
                });
              g.hasOwnProperty('$raw') || (g.$raw = f);
              return g;
            }
            return { $raw: {} };
          }
          a.g.getComponentNameForNode = function(b) {
            var c = a.a.A(b);
            if (
              a.g.wb(c) &&
              (-1 != c.indexOf('-') ||
                '[object HTMLUnknownElement]' == '' + b ||
                (8 >= a.a.C && b.tagName === c))
            )
              return c;
          };
          a.g.Rb = function(c, e, f, g) {
            if (1 === e.nodeType) {
              var h = a.g.getComponentNameForNode(e);
              if (h) {
                c = c || {};
                if (c.component)
                  throw Error(
                    'Cannot use the "component" binding on a custom element matching a component',
                  );
                var l = { name: h, params: b(e, f) };
                c.component = g
                  ? function() {
                      return l;
                    }
                  : l;
              }
            }
            return c;
          };
          var c = new a.S();
          9 > a.a.C &&
            ((a.g.register = (function(a) {
              return function(b) {
                t.createElement(b);
                return a.apply(this, arguments);
              };
            })(a.g.register)),
            (t.createDocumentFragment = (function(b) {
              return function() {
                var c = b(),
                  f = a.g.Ec,
                  g;
                for (g in f) f.hasOwnProperty(g) && c.createElement(g);
                return c;
              };
            })(t.createDocumentFragment)));
        })();
        (function(b) {
          function c(b, c, d) {
            c = c.template;
            if (!c) throw Error("Component '" + b + "' has no template");
            b = a.a.wa(c);
            a.f.fa(d, b);
          }
          function d(a, b, c, d) {
            var e = a.createViewModel;
            return e ? e.call(a, d, { element: b, templateNodes: c }) : d;
          }
          var e = 0;
          a.d.component = {
            init: function(f, g, h, l, m) {
              function k() {
                var a = r && r.dispose;
                'function' === typeof a && a.call(r);
                q = r = null;
              }
              var r,
                q,
                p = a.a.W(a.f.childNodes(f));
              a.a.G.qa(f, k);
              a.m(
                function() {
                  var l = a.a.c(g()),
                    h,
                    v;
                  'string' === typeof l ? (h = l) : ((h = a.a.c(l.name)), (v = a.a.c(l.params)));
                  if (!h) throw Error('No component name specified');
                  var n = (q = ++e);
                  a.g.get(h, function(e) {
                    if (q === n) {
                      k();
                      if (!e) throw Error("Unknown component '" + h + "'");
                      c(h, e, f);
                      var l = d(e, f, p, v);
                      e = m.createChildContext(l, b, function(a) {
                        a.$component = l;
                        a.$componentTemplateNodes = p;
                      });
                      r = l;
                      a.hb(e, f);
                    }
                  });
                },
                null,
                { i: f },
              );
              return { controlsDescendantBindings: !0 };
            },
          };
          a.f.aa.component = !0;
        })();
        var Q = { class: 'className', for: 'htmlFor' };
        a.d.attr = {
          update: function(b, c) {
            var d = a.a.c(c()) || {};
            a.a.D(d, function(c, d) {
              d = a.a.c(d);
              var g = !1 === d || null === d || d === n;
              g && b.removeAttribute(c);
              8 >= a.a.C && c in Q
                ? ((c = Q[c]), g ? b.removeAttribute(c) : (b[c] = d))
                : g || b.setAttribute(c, d.toString());
              'name' === c && a.a.vc(b, g ? '' : d.toString());
            });
          },
        };
        (function() {
          a.d.checked = {
            after: ['value', 'attr'],
            init: function(b, c, d) {
              function e() {
                var e = b.checked,
                  f = p ? g() : e;
                if (!a.xa.Va() && (!l || e)) {
                  var h = a.l.w(c);
                  if (k) {
                    var m = r ? h.p() : h;
                    q !== f
                      ? (e && (a.a.ra(m, f, !0), a.a.ra(m, q, !1)), (q = f))
                      : a.a.ra(m, f, e);
                    r && a.Da(h) && h(m);
                  } else a.h.Ga(h, d, 'checked', f, !0);
                }
              }
              function f() {
                var d = a.a.c(c());
                b.checked = k ? 0 <= a.a.o(d, g()) : h ? d : g() === d;
              }
              var g = a.rc(function() {
                  return d.has('checkedValue')
                    ? a.a.c(d.get('checkedValue'))
                    : d.has('value')
                    ? a.a.c(d.get('value'))
                    : b.value;
                }),
                h = 'checkbox' == b.type,
                l = 'radio' == b.type;
              if (h || l) {
                var m = c(),
                  k = h && a.a.c(m) instanceof Array,
                  r = !(k && m.push && m.splice),
                  q = k ? g() : n,
                  p = l || k;
                l &&
                  !b.name &&
                  a.d.uniqueName.init(b, function() {
                    return !0;
                  });
                a.m(e, null, { i: b });
                a.a.q(b, 'click', e);
                a.m(f, null, { i: b });
                m = n;
              }
            },
          };
          a.h.ga.checked = !0;
          a.d.checkedValue = {
            update: function(b, c) {
              b.value = a.a.c(c());
            },
          };
        })();
        a.d.css = {
          update: function(b, c) {
            var d = a.a.c(c());
            null !== d && 'object' == typeof d
              ? a.a.D(d, function(c, d) {
                  d = a.a.c(d);
                  a.a.fb(b, c, d);
                })
              : ((d = a.a.cb(String(d || ''))),
                a.a.fb(b, b.__ko__cssValue, !1),
                (b.__ko__cssValue = d),
                a.a.fb(b, d, !0));
          },
        };
        a.d.enable = {
          update: function(b, c) {
            var d = a.a.c(c());
            d && b.disabled ? b.removeAttribute('disabled') : d || b.disabled || (b.disabled = !0);
          },
        };
        a.d.disable = {
          update: function(b, c) {
            a.d.enable.update(b, function() {
              return !a.a.c(c());
            });
          },
        };
        a.d.event = {
          init: function(b, c, d, e, f) {
            var g = c() || {};
            a.a.D(g, function(g) {
              'string' == typeof g &&
                a.a.q(b, g, function(b) {
                  var m,
                    k = c()[g];
                  if (k) {
                    try {
                      var r = a.a.W(arguments);
                      e = f.$data;
                      r.unshift(e);
                      m = k.apply(e, r);
                    } finally {
                      !0 !== m && (b.preventDefault ? b.preventDefault() : (b.returnValue = !1));
                    }
                    !1 === d.get(g + 'Bubble') &&
                      ((b.cancelBubble = !0), b.stopPropagation && b.stopPropagation());
                  }
                });
            });
          },
        };
        a.d.foreach = {
          mc: function(b) {
            return function() {
              var c = b(),
                d = a.a.Bb(c);
              if (!d || 'number' == typeof d.length) return { foreach: c, templateEngine: a.X.vb };
              a.a.c(c);
              return {
                foreach: d.data,
                as: d.as,
                includeDestroyed: d.includeDestroyed,
                afterAdd: d.afterAdd,
                beforeRemove: d.beforeRemove,
                afterRender: d.afterRender,
                beforeMove: d.beforeMove,
                afterMove: d.afterMove,
                templateEngine: a.X.vb,
              };
            };
          },
          init: function(b, c) {
            return a.d.template.init(b, a.d.foreach.mc(c));
          },
          update: function(b, c, d, e, f) {
            return a.d.template.update(b, a.d.foreach.mc(c), d, e, f);
          },
        };
        a.h.va.foreach = !1;
        a.f.aa.foreach = !0;
        a.d.hasfocus = {
          init: function(b, c, d) {
            function e(e) {
              b.__ko_hasfocusUpdating = !0;
              var f = b.ownerDocument;
              if ('activeElement' in f) {
                var g;
                try {
                  g = f.activeElement;
                } catch (k) {
                  g = f.body;
                }
                e = g === b;
              }
              f = c();
              a.h.Ga(f, d, 'hasfocus', e, !0);
              b.__ko_hasfocusLastValue = e;
              b.__ko_hasfocusUpdating = !1;
            }
            var f = e.bind(null, !0),
              g = e.bind(null, !1);
            a.a.q(b, 'focus', f);
            a.a.q(b, 'focusin', f);
            a.a.q(b, 'blur', g);
            a.a.q(b, 'focusout', g);
          },
          update: function(b, c) {
            var d = !!a.a.c(c());
            b.__ko_hasfocusUpdating ||
              b.__ko_hasfocusLastValue === d ||
              (d ? b.focus() : b.blur(),
              !d && b.__ko_hasfocusLastValue && b.ownerDocument.body.focus(),
              a.l.w(a.a.Fa, null, [b, d ? 'focusin' : 'focusout']));
          },
        };
        a.h.ga.hasfocus = !0;
        a.d.hasFocus = a.d.hasfocus;
        a.h.ga.hasFocus = !0;
        a.d.html = {
          init: function() {
            return { controlsDescendantBindings: !0 };
          },
          update: function(b, c) {
            a.a.Eb(b, c());
          },
        };
        K('if');
        K('ifnot', !1, !0);
        K('with', !0, !1, function(a, c) {
          return a.ac(c);
        });
        var L = {};
        a.d.options = {
          init: function(b) {
            if ('select' !== a.a.A(b))
              throw Error('options binding applies only to SELECT elements');
            for (; 0 < b.length; ) b.remove(0);
            return { controlsDescendantBindings: !0 };
          },
          update: function(b, c, d) {
            function e() {
              return a.a.Ma(b.options, function(a) {
                return a.selected;
              });
            }
            function f(a, b, c) {
              var d = typeof b;
              return 'function' == d ? b(a) : 'string' == d ? a[b] : c;
            }
            function g(c, e) {
              if (A && k) a.j.ja(b, a.a.c(d.get('value')), !0);
              else if (p.length) {
                var f = 0 <= a.a.o(p, a.j.u(e[0]));
                a.a.wc(e[0], f);
                A && !f && a.l.w(a.a.Fa, null, [b, 'change']);
              }
            }
            var h = b.multiple,
              l = 0 != b.length && h ? b.scrollTop : null,
              m = a.a.c(c()),
              k = d.get('valueAllowUnset') && d.has('value'),
              r = d.get('optionsIncludeDestroyed');
            c = {};
            var q,
              p = [];
            k ||
              (h
                ? (p = a.a.ib(e(), a.j.u))
                : 0 <= b.selectedIndex && p.push(a.j.u(b.options[b.selectedIndex])));
            m &&
              ('undefined' == typeof m.length && (m = [m]),
              (q = a.a.Ma(m, function(b) {
                return r || b === n || null === b || !a.a.c(b._destroy);
              })),
              d.has('optionsCaption') &&
                ((m = a.a.c(d.get('optionsCaption'))), null !== m && m !== n && q.unshift(L)));
            var A = !1;
            c.beforeRemove = function(a) {
              b.removeChild(a);
            };
            m = g;
            d.has('optionsAfterRender') &&
              'function' == typeof d.get('optionsAfterRender') &&
              (m = function(b, c) {
                g(0, c);
                a.l.w(d.get('optionsAfterRender'), null, [c[0], b !== L ? b : n]);
              });
            a.a.Db(
              b,
              q,
              function(c, e, g) {
                g.length && ((p = !k && g[0].selected ? [a.j.u(g[0])] : []), (A = !0));
                e = b.ownerDocument.createElement('option');
                c === L
                  ? (a.a.bb(e, d.get('optionsCaption')), a.j.ja(e, n))
                  : ((g = f(c, d.get('optionsValue'), c)),
                    a.j.ja(e, a.a.c(g)),
                    (c = f(c, d.get('optionsText'), g)),
                    a.a.bb(e, c));
                return [e];
              },
              c,
              m,
            );
            a.l.w(function() {
              k
                ? a.j.ja(b, a.a.c(d.get('value')), !0)
                : (h
                    ? p.length && e().length < p.length
                    : p.length && 0 <= b.selectedIndex
                    ? a.j.u(b.options[b.selectedIndex]) !== p[0]
                    : p.length || 0 <= b.selectedIndex) && a.a.Fa(b, 'change');
            });
            a.a.Sc(b);
            l && 20 < Math.abs(l - b.scrollTop) && (b.scrollTop = l);
          },
        };
        a.d.options.zb = a.a.e.J();
        a.d.selectedOptions = {
          after: ['options', 'foreach'],
          init: function(b, c, d) {
            a.a.q(b, 'change', function() {
              var e = c(),
                f = [];
              a.a.r(b.getElementsByTagName('option'), function(b) {
                b.selected && f.push(a.j.u(b));
              });
              a.h.Ga(e, d, 'selectedOptions', f);
            });
          },
          update: function(b, c) {
            if ('select' != a.a.A(b)) throw Error('values binding applies only to SELECT elements');
            var d = a.a.c(c()),
              e = b.scrollTop;
            d &&
              'number' == typeof d.length &&
              a.a.r(b.getElementsByTagName('option'), function(b) {
                var c = 0 <= a.a.o(d, a.j.u(b));
                b.selected != c && a.a.wc(b, c);
              });
            b.scrollTop = e;
          },
        };
        a.h.ga.selectedOptions = !0;
        a.d.style = {
          update: function(b, c) {
            var d = a.a.c(c() || {});
            a.a.D(d, function(c, d) {
              d = a.a.c(d);
              if (null === d || d === n || !1 === d) d = '';
              b.style[c] = d;
            });
          },
        };
        a.d.submit = {
          init: function(b, c, d, e, f) {
            if ('function' != typeof c())
              throw Error('The value for a submit binding must be a function');
            a.a.q(b, 'submit', function(a) {
              var d,
                e = c();
              try {
                d = e.call(f.$data, b);
              } finally {
                !0 !== d && (a.preventDefault ? a.preventDefault() : (a.returnValue = !1));
              }
            });
          },
        };
        a.d.text = {
          init: function() {
            return { controlsDescendantBindings: !0 };
          },
          update: function(b, c) {
            a.a.bb(b, c());
          },
        };
        a.f.aa.text = !0;
        (function() {
          if (x && x.navigator)
            var b = function(a) {
                if (a) return parseFloat(a[1]);
              },
              c = x.opera && x.opera.version && parseInt(x.opera.version()),
              d = x.navigator.userAgent,
              e = b(d.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),
              f = b(d.match(/Firefox\/([^ ]*)/));
          if (10 > a.a.C)
            var g = a.a.e.J(),
              h = a.a.e.J(),
              l = function(b) {
                var c = this.activeElement;
                (c = c && a.a.e.get(c, h)) && c(b);
              },
              m = function(b, c) {
                var d = b.ownerDocument;
                a.a.e.get(d, g) || (a.a.e.set(d, g, !0), a.a.q(d, 'selectionchange', l));
                a.a.e.set(b, h, c);
              };
          a.d.textInput = {
            init: function(b, d, g) {
              function l(c, d) {
                a.a.q(b, c, d);
              }
              function h() {
                var c = a.a.c(d());
                if (null === c || c === n) c = '';
                u !== n && c === u
                  ? a.a.setTimeout(h, 4)
                  : b.value !== c && ((s = c), (b.value = c));
              }
              function y() {
                t || ((u = b.value), (t = a.a.setTimeout(v, 4)));
              }
              function v() {
                clearTimeout(t);
                u = t = n;
                var c = b.value;
                s !== c && ((s = c), a.h.Ga(d(), g, 'textInput', c));
              }
              var s = b.value,
                t,
                u,
                x = 9 == a.a.C ? y : v;
              10 > a.a.C
                ? (l('propertychange', function(a) {
                    'value' === a.propertyName && x(a);
                  }),
                  8 == a.a.C && (l('keyup', v), l('keydown', v)),
                  8 <= a.a.C && (m(b, x), l('dragend', y)))
                : (l('input', v),
                  5 > e && 'textarea' === a.a.A(b)
                    ? (l('keydown', y), l('paste', y), l('cut', y))
                    : 11 > c
                    ? l('keydown', y)
                    : 4 > f && (l('DOMAutoComplete', v), l('dragdrop', v), l('drop', v)));
              l('change', v);
              a.m(h, null, { i: b });
            },
          };
          a.h.ga.textInput = !0;
          a.d.textinput = {
            preprocess: function(a, b, c) {
              c('textInput', a);
            },
          };
        })();
        a.d.uniqueName = {
          init: function(b, c) {
            if (c()) {
              var d = 'ko_unique_' + ++a.d.uniqueName.Nc;
              a.a.vc(b, d);
            }
          },
        };
        a.d.uniqueName.Nc = 0;
        a.d.value = {
          after: ['options', 'foreach'],
          init: function(b, c, d) {
            if ('input' != b.tagName.toLowerCase() || ('checkbox' != b.type && 'radio' != b.type)) {
              var e = ['change'],
                f = d.get('valueUpdate'),
                g = !1,
                h = null;
              f && ('string' == typeof f && (f = [f]), a.a.ta(e, f), (e = a.a.Wb(e)));
              var l = function() {
                h = null;
                g = !1;
                var e = c(),
                  f = a.j.u(b);
                a.h.Ga(e, d, 'value', f);
              };
              !a.a.C ||
                'input' != b.tagName.toLowerCase() ||
                'text' != b.type ||
                'off' == b.autocomplete ||
                (b.form && 'off' == b.form.autocomplete) ||
                -1 != a.a.o(e, 'propertychange') ||
                (a.a.q(b, 'propertychange', function() {
                  g = !0;
                }),
                a.a.q(b, 'focus', function() {
                  g = !1;
                }),
                a.a.q(b, 'blur', function() {
                  g && l();
                }));
              a.a.r(e, function(c) {
                var d = l;
                a.a.sd(c, 'after') &&
                  ((d = function() {
                    h = a.j.u(b);
                    a.a.setTimeout(l, 0);
                  }),
                  (c = c.substring(5)));
                a.a.q(b, c, d);
              });
              var m = function() {
                var e = a.a.c(c()),
                  f = a.j.u(b);
                if (null !== h && e === h) a.a.setTimeout(m, 0);
                else if (e !== f)
                  if ('select' === a.a.A(b)) {
                    var g = d.get('valueAllowUnset'),
                      f = function() {
                        a.j.ja(b, e, g);
                      };
                    f();
                    g || e === a.j.u(b) ? a.a.setTimeout(f, 0) : a.l.w(a.a.Fa, null, [b, 'change']);
                  } else a.j.ja(b, e);
              };
              a.m(m, null, { i: b });
            } else a.La(b, { checkedValue: c });
          },
          update: function() {},
        };
        a.h.ga.value = !0;
        a.d.visible = {
          update: function(b, c) {
            var d = a.a.c(c()),
              e = 'none' != b.style.display;
            d && !e ? (b.style.display = '') : !d && e && (b.style.display = 'none');
          },
        };
        (function(b) {
          a.d[b] = {
            init: function(c, d, e, f, g) {
              return a.d.event.init.call(
                this,
                c,
                function() {
                  var a = {};
                  a[b] = d();
                  return a;
                },
                e,
                f,
                g,
              );
            },
          };
        })('click');
        a.P = function() {};
        a.P.prototype.renderTemplateSource = function() {
          throw Error('Override renderTemplateSource');
        };
        a.P.prototype.createJavaScriptEvaluatorBlock = function() {
          throw Error('Override createJavaScriptEvaluatorBlock');
        };
        a.P.prototype.makeTemplateSource = function(b, c) {
          if ('string' == typeof b) {
            c = c || t;
            var d = c.getElementById(b);
            if (!d) throw Error('Cannot find template with ID ' + b);
            return new a.v.n(d);
          }
          if (1 == b.nodeType || 8 == b.nodeType) return new a.v.sa(b);
          throw Error('Unknown template type: ' + b);
        };
        a.P.prototype.renderTemplate = function(a, c, d, e) {
          a = this.makeTemplateSource(a, e);
          return this.renderTemplateSource(a, c, d, e);
        };
        a.P.prototype.isTemplateRewritten = function(a, c) {
          return !1 === this.allowTemplateRewriting
            ? !0
            : this.makeTemplateSource(a, c).data('isRewritten');
        };
        a.P.prototype.rewriteTemplate = function(a, c, d) {
          a = this.makeTemplateSource(a, d);
          c = c(a.text());
          a.text(c);
          a.data('isRewritten', !0);
        };
        a.b('templateEngine', a.P);
        a.Ib = (function() {
          function b(b, c, d, h) {
            b = a.h.Ab(b);
            for (var l = a.h.va, m = 0; m < b.length; m++) {
              var k = b[m].key;
              if (l.hasOwnProperty(k)) {
                var r = l[k];
                if ('function' === typeof r) {
                  if ((k = r(b[m].value))) throw Error(k);
                } else if (!r)
                  throw Error(
                    "This template engine does not support the '" +
                      k +
                      "' binding within its templates",
                  );
              }
            }
            d =
              'ko.__tr_ambtns(function($context,$element){return(function(){return{ ' +
              a.h.Xa(b, { valueAccessors: !0 }) +
              " } })()},'" +
              d.toLowerCase() +
              "')";
            return h.createJavaScriptEvaluatorBlock(d) + c;
          }
          var c = /(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'|[^>]*))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi,
            d = /\x3c!--\s*ko\b\s*([\s\S]*?)\s*--\x3e/g;
          return {
            Tc: function(b, c, d) {
              c.isTemplateRewritten(b, d) ||
                c.rewriteTemplate(
                  b,
                  function(b) {
                    return a.Ib.jd(b, c);
                  },
                  d,
                );
            },
            jd: function(a, f) {
              return a
                .replace(c, function(a, c, d, e, k) {
                  return b(k, c, d, f);
                })
                .replace(d, function(a, c) {
                  return b(c, '\x3c!-- ko --\x3e', '#comment', f);
                });
            },
            Jc: function(b, c) {
              return a.N.yb(function(d, h) {
                var l = d.nextSibling;
                l && l.nodeName.toLowerCase() === c && a.La(l, b, h);
              });
            },
          };
        })();
        a.b('__tr_ambtns', a.Ib.Jc);
        (function() {
          a.v = {};
          a.v.n = function(b) {
            if ((this.n = b)) {
              var c = a.a.A(b);
              this.eb =
                'script' === c
                  ? 1
                  : 'textarea' === c
                  ? 2
                  : 'template' == c && b.content && 11 === b.content.nodeType
                  ? 3
                  : 4;
            }
          };
          a.v.n.prototype.text = function() {
            var b = 1 === this.eb ? 'text' : 2 === this.eb ? 'value' : 'innerHTML';
            if (0 == arguments.length) return this.n[b];
            var c = arguments[0];
            'innerHTML' === b ? a.a.Eb(this.n, c) : (this.n[b] = c);
          };
          var b = a.a.e.J() + '_';
          a.v.n.prototype.data = function(c) {
            if (1 === arguments.length) return a.a.e.get(this.n, b + c);
            a.a.e.set(this.n, b + c, arguments[1]);
          };
          var c = a.a.e.J();
          a.v.n.prototype.nodes = function() {
            var b = this.n;
            if (0 == arguments.length)
              return (
                (a.a.e.get(b, c) || {}).mb || (3 === this.eb ? b.content : 4 === this.eb ? b : n)
              );
            a.a.e.set(b, c, { mb: arguments[0] });
          };
          a.v.sa = function(a) {
            this.n = a;
          };
          a.v.sa.prototype = new a.v.n();
          a.v.sa.prototype.text = function() {
            if (0 == arguments.length) {
              var b = a.a.e.get(this.n, c) || {};
              b.Jb === n && b.mb && (b.Jb = b.mb.innerHTML);
              return b.Jb;
            }
            a.a.e.set(this.n, c, { Jb: arguments[0] });
          };
          a.b('templateSources', a.v);
          a.b('templateSources.domElement', a.v.n);
          a.b('templateSources.anonymousTemplate', a.v.sa);
        })();
        (function() {
          function b(b, c, d) {
            var e;
            for (c = a.f.nextSibling(c); b && (e = b) !== c; ) (b = a.f.nextSibling(e)), d(e, b);
          }
          function c(c, d) {
            if (c.length) {
              var e = c[0],
                f = c[c.length - 1],
                g = e.parentNode,
                h = a.S.instance,
                n = h.preprocessNode;
              if (n) {
                b(e, f, function(a, b) {
                  var c = a.previousSibling,
                    d = n.call(h, a);
                  d && (a === e && (e = d[0] || b), a === f && (f = d[d.length - 1] || c));
                });
                c.length = 0;
                if (!e) return;
                e === f ? c.push(e) : (c.push(e, f), a.a.Ba(c, g));
              }
              b(e, f, function(b) {
                (1 !== b.nodeType && 8 !== b.nodeType) || a.Ub(d, b);
              });
              b(e, f, function(b) {
                (1 !== b.nodeType && 8 !== b.nodeType) || a.N.Cc(b, [d]);
              });
              a.a.Ba(c, g);
            }
          }
          function d(a) {
            return a.nodeType ? a : 0 < a.length ? a[0] : null;
          }
          function e(b, e, f, h, q) {
            q = q || {};
            var p = ((b && d(b)) || f || {}).ownerDocument,
              n = q.templateEngine || g;
            a.Ib.Tc(f, n, p);
            f = n.renderTemplate(f, h, q, p);
            if ('number' != typeof f.length || (0 < f.length && 'number' != typeof f[0].nodeType))
              throw Error('Template engine must return an array of DOM nodes');
            p = !1;
            switch (e) {
              case 'replaceChildren':
                a.f.fa(b, f);
                p = !0;
                break;
              case 'replaceNode':
                a.a.uc(b, f);
                p = !0;
                break;
              case 'ignoreTargetNode':
                break;
              default:
                throw Error('Unknown renderMode: ' + e);
            }
            p && (c(f, h), q.afterRender && a.l.w(q.afterRender, null, [f, h.$data]));
            return f;
          }
          function f(b, c, d) {
            return a.I(b) ? b() : 'function' === typeof b ? b(c, d) : b;
          }
          var g;
          a.Fb = function(b) {
            if (b != n && !(b instanceof a.P))
              throw Error('templateEngine must inherit from ko.templateEngine');
            g = b;
          };
          a.Cb = function(b, c, k, h, q) {
            k = k || {};
            if ((k.templateEngine || g) == n)
              throw Error('Set a template engine before calling renderTemplate');
            q = q || 'replaceChildren';
            if (h) {
              var p = d(h);
              return a.B(
                function() {
                  var g =
                      c && c instanceof a.R
                        ? c
                        : new a.R(c, null, null, null, { exportDependencies: !0 }),
                    n = f(b, g.$data, g),
                    g = e(h, q, n, g, k);
                  'replaceNode' == q && ((h = g), (p = d(h)));
                },
                null,
                {
                  ya: function() {
                    return !p || !a.a.qb(p);
                  },
                  i: p && 'replaceNode' == q ? p.parentNode : p,
                },
              );
            }
            return a.N.yb(function(d) {
              a.Cb(b, c, k, d, 'replaceNode');
            });
          };
          a.pd = function(b, d, g, h, q) {
            function p(a, b) {
              c(b, t);
              g.afterRender && g.afterRender(b, a);
              t = null;
            }
            function s(a, c) {
              t = q.createChildContext(a, g.as, function(a) {
                a.$index = c;
              });
              var d = f(b, a, t);
              return e(null, 'ignoreTargetNode', d, t, g);
            }
            var t;
            return a.B(
              function() {
                var b = a.a.c(d) || [];
                'undefined' == typeof b.length && (b = [b]);
                b = a.a.Ma(b, function(b) {
                  return g.includeDestroyed || b === n || null === b || !a.a.c(b._destroy);
                });
                a.l.w(a.a.Db, null, [h, b, s, g, p]);
              },
              null,
              { i: h },
            );
          };
          var h = a.a.e.J();
          a.d.template = {
            init: function(b, c) {
              var d = a.a.c(c());
              if ('string' == typeof d || d.name) a.f.za(b);
              else {
                if ('nodes' in d) {
                  if (((d = d.nodes || []), a.I(d)))
                    throw Error('The "nodes" option must be a plain, non-observable array.');
                } else d = a.f.childNodes(b);
                d = a.a.nc(d);
                new a.v.sa(b).nodes(d);
              }
              return { controlsDescendantBindings: !0 };
            },
            update: function(b, c, d, e, f) {
              var g = c();
              c = a.a.c(g);
              d = !0;
              e = null;
              'string' == typeof c
                ? (c = {})
                : ((g = c.name),
                  'if' in c && (d = a.a.c(c['if'])),
                  d && 'ifnot' in c && (d = !a.a.c(c.ifnot)));
              'foreach' in c
                ? (e = a.pd(g || b, (d && c.foreach) || [], c, b, f))
                : d
                ? ((f = 'data' in c ? f.ac(c.data, c.as) : f), (e = a.Cb(g || b, f, c, b)))
                : a.f.za(b);
              f = e;
              (c = a.a.e.get(b, h)) && 'function' == typeof c.k && c.k();
              a.a.e.set(b, h, f && f.ca() ? f : n);
            },
          };
          a.h.va.template = function(b) {
            b = a.h.Ab(b);
            return (1 == b.length && b[0].unknown) || a.h.fd(b, 'name')
              ? null
              : 'This template engine does not support anonymous templates nested within its templates';
          };
          a.f.aa.template = !0;
        })();
        a.b('setTemplateEngine', a.Fb);
        a.b('renderTemplate', a.Cb);
        a.a.hc = function(a, c, d) {
          if (a.length && c.length) {
            var e, f, g, h, l;
            for (e = f = 0; (!d || e < d) && (h = a[f]); ++f) {
              for (g = 0; (l = c[g]); ++g)
                if (h.value === l.value) {
                  h.moved = l.index;
                  l.moved = h.index;
                  c.splice(g, 1);
                  e = g = 0;
                  break;
                }
              e += g;
            }
          }
        };
        a.a.lb = (function() {
          function b(b, d, e, f, g) {
            var h = Math.min,
              l = Math.max,
              m = [],
              k,
              n = b.length,
              q,
              p = d.length,
              s = p - n || 1,
              t = n + p + 1,
              v,
              u,
              x;
            for (k = 0; k <= n; k++)
              for (u = v, m.push((v = [])), x = h(p, k + s), q = l(0, k - 1); q <= x; q++)
                v[q] = q
                  ? k
                    ? b[k - 1] === d[q - 1]
                      ? u[q - 1]
                      : h(u[q] || t, v[q - 1] || t) + 1
                    : q + 1
                  : k + 1;
            h = [];
            l = [];
            s = [];
            k = n;
            for (q = p; k || q; )
              (p = m[k][q] - 1),
                q && p === m[k][q - 1]
                  ? l.push((h[h.length] = { status: e, value: d[--q], index: q }))
                  : k && p === m[k - 1][q]
                  ? s.push((h[h.length] = { status: f, value: b[--k], index: k }))
                  : (--q, --k, g.sparse || h.push({ status: 'retained', value: d[q] }));
            a.a.hc(s, l, !g.dontLimitMoves && 10 * n);
            return h.reverse();
          }
          return function(a, d, e) {
            e = 'boolean' === typeof e ? { dontLimitMoves: e } : e || {};
            a = a || [];
            d = d || [];
            return a.length < d.length
              ? b(a, d, 'added', 'deleted', e)
              : b(d, a, 'deleted', 'added', e);
          };
        })();
        a.b('utils.compareArrays', a.a.lb);
        (function() {
          function b(b, c, d, h, l) {
            var m = [],
              k = a.B(
                function() {
                  var k = c(d, l, a.a.Ba(m, b)) || [];
                  0 < m.length && (a.a.uc(m, k), h && a.l.w(h, null, [d, k, l]));
                  m.length = 0;
                  a.a.ta(m, k);
                },
                null,
                {
                  i: b,
                  ya: function() {
                    return !a.a.Tb(m);
                  },
                },
              );
            return { ea: m, B: k.ca() ? k : n };
          }
          var c = a.a.e.J(),
            d = a.a.e.J();
          a.a.Db = function(e, f, g, h, l) {
            function m(b, c) {
              w = q[c];
              u !== c && (D[b] = w);
              w.tb(u++);
              a.a.Ba(w.ea, e);
              t.push(w);
              z.push(w);
            }
            function k(b, c) {
              if (b)
                for (var d = 0, e = c.length; d < e; d++)
                  c[d] &&
                    a.a.r(c[d].ea, function(a) {
                      b(a, d, c[d].ka);
                    });
            }
            f = f || [];
            h = h || {};
            var r = a.a.e.get(e, c) === n,
              q = a.a.e.get(e, c) || [],
              p = a.a.ib(q, function(a) {
                return a.ka;
              }),
              s = a.a.lb(p, f, h.dontLimitMoves),
              t = [],
              v = 0,
              u = 0,
              x = [],
              z = [];
            f = [];
            for (var D = [], p = [], w, C = 0, B, E; (B = s[C]); C++)
              switch (((E = B.moved), B.status)) {
                case 'deleted':
                  E === n &&
                    ((w = q[v]),
                    w.B && (w.B.k(), (w.B = n)),
                    a.a.Ba(w.ea, e).length &&
                      (h.beforeRemove &&
                        (t.push(w), z.push(w), w.ka === d ? (w = null) : (f[C] = w)),
                      w && x.push.apply(x, w.ea)));
                  v++;
                  break;
                case 'retained':
                  m(C, v++);
                  break;
                case 'added':
                  E !== n
                    ? m(C, E)
                    : ((w = { ka: B.value, tb: a.O(u++) }), t.push(w), z.push(w), r || (p[C] = w));
              }
            a.a.e.set(e, c, t);
            k(h.beforeMove, D);
            a.a.r(x, h.beforeRemove ? a.ba : a.removeNode);
            for (var C = 0, r = a.f.firstChild(e), F; (w = z[C]); C++) {
              w.ea || a.a.extend(w, b(e, g, w.ka, l, w.tb));
              for (v = 0; (s = w.ea[v]); r = s.nextSibling, F = s, v++) s !== r && a.f.kc(e, s, F);
              !w.ad && l && (l(w.ka, w.ea, w.tb), (w.ad = !0));
            }
            k(h.beforeRemove, f);
            for (C = 0; C < f.length; ++C) f[C] && (f[C].ka = d);
            k(h.afterMove, D);
            k(h.afterAdd, p);
          };
        })();
        a.b('utils.setDomNodeChildrenFromArrayMapping', a.a.Db);
        a.X = function() {
          this.allowTemplateRewriting = !1;
        };
        a.X.prototype = new a.P();
        a.X.prototype.renderTemplateSource = function(b, c, d, e) {
          if ((c = (9 > a.a.C ? 0 : b.nodes) ? b.nodes() : null))
            return a.a.W(c.cloneNode(!0).childNodes);
          b = b.text();
          return a.a.na(b, e);
        };
        a.X.vb = new a.X();
        a.Fb(a.X.vb);
        a.b('nativeTemplateEngine', a.X);
        (function() {
          a.xb = function() {
            var a = (this.ed = (function() {
              if (!u || !u.tmpl) return 0;
              try {
                if (0 <= u.tmpl.tag.tmpl.open.toString().indexOf('__')) return 2;
              } catch (a) {}
              return 1;
            })());
            this.renderTemplateSource = function(b, e, f, g) {
              g = g || t;
              f = f || {};
              if (2 > a)
                throw Error(
                  'Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.',
                );
              var h = b.data('precompiled');
              h ||
                ((h = b.text() || ''),
                (h = u.template(null, '{{ko_with $item.koBindingContext}}' + h + '{{/ko_with}}')),
                b.data('precompiled', h));
              b = [e.$data];
              e = u.extend({ koBindingContext: e }, f.templateOptions);
              e = u.tmpl(h, b, e);
              e.appendTo(g.createElement('div'));
              u.fragments = {};
              return e;
            };
            this.createJavaScriptEvaluatorBlock = function(a) {
              return '{{ko_code ((function() { return ' + a + ' })()) }}';
            };
            this.addTemplate = function(a, b) {
              t.write("<script type='text/html' id='" + a + "'>" + b + '\x3c/script>');
            };
            0 < a &&
              ((u.tmpl.tag.ko_code = { open: "__.push($1 || '');" }),
              (u.tmpl.tag.ko_with = { open: 'with($1) {', close: '} ' }));
          };
          a.xb.prototype = new a.P();
          var b = new a.xb();
          0 < b.ed && a.Fb(b);
          a.b('jqueryTmplTemplateEngine', a.xb);
        })();
      });
    })();
  })();

  /*! WeakMap shim
   * (The MIT License)
   *
   * Copyright (c) 2012 Brandon Benvie <http://bbenvie.com>
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
   * associated documentation files (the 'Software'), to deal in the Software without restriction,
   * including without limitation the rights to use, copy, modify, merge, publish, distribute,
   * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included with all copies or
   * substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
   * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY  CLAIM,
   * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
   */
  // Original WeakMap implementation by Gozala @ https://gist.github.com/1269991
  // Updated and bugfixed by Raynos @ https://gist.github.com/1638059
  // Expanded by Benvie @ https://github.com/Benvie/harmony-collections
  // This is the version used by knockout-es5. Modified by Steve Sanderson as follows:
  // [1] Deleted weakmap.min.js (it's not useful as it would be out of sync with weakmap.js now I'm editing it)
  // [2] Since UglifyJS strips inline function names (and you can't disable that without disabling name mangling
  //     entirely), insert code that re-adds function names
  void (function(a, b, c) {
    function d(a, b, c) {
      return (
        'function' == typeof b && ((c = b), (b = e(c).replace(/_$/, ''))),
        j(a, b, { configurable: !0, writable: !0, value: c })
      );
    }
    function e(a) {
      return 'function' != typeof a
        ? ''
        : '_name' in a
        ? a._name
        : 'name' in a
        ? a.name
        : k.call(a).match(n)[1];
    }
    function f(a, b) {
      // Undo the name-stripping that UglifyJS does
      return (b._name = a), b;
    }
    function g(a) {
      function b(b, e) {
        return (
          e || 2 === arguments.length
            ? d.set(b, e)
            : ((e = d.get(b)), e === c && ((e = a(b)), d.set(b, e))),
          e
        );
      }
      var d = new p();
      return a || (a = q), b;
    }
    var h = Object.getOwnPropertyNames,
      i = 'object' == typeof window ? Object.getOwnPropertyNames(window) : [],
      j = Object.defineProperty,
      k = Function.prototype.toString,
      l = Object.create,
      m = Object.prototype.hasOwnProperty,
      n = /^\n?function\s?(\w*)?_?\(/,
      o = (function() {
        function a() {
          var a = g(),
            c = {};
          this.unlock = function(d) {
            var e = n(d);
            if (m.call(e, a)) return e[a](c);
            var f = l(null, b);
            return (
              j(e, a, {
                value: function(a) {
                  if (a === c) return f;
                },
              }),
              f
            );
          };
        }
        var b = { value: { writable: !0, value: c } },
          e = l(null),
          g = function() {
            var a = Math.random()
              .toString(36)
              .slice(2);
            return a in e ? g() : (e[a] = a);
          },
          k = g(),
          n = function(a) {
            if (m.call(a, k)) return a[k];
            if (!Object.isExtensible(a)) throw new TypeError('Object must be extensible');
            var b = l(null);
            return j(a, k, { value: b }), b;
          };
        // common per-object storage area made visible by patching getOwnPropertyNames'
        return (
          d(
            Object,
            f('getOwnPropertyNames', function(a) {
              // gh-43
              var b,
                c = Object(a);
              // Fixes for debuggers:
              // 1) Some objects lack .toString(), calling it on them make Chrome
              // debugger fail when inspecting variables.
              // 2) Window.prototype methods and properties are private in IE11 and
              // throw 'Invalid calling object'.
              if (c !== Window.prototype && 'toString' in c && '[object Window]' === c.toString())
                try {
                  b = h(a);
                } catch (a) {
                  b = i;
                }
              else b = h(a);
              return m.call(a, k) && b.splice(b.indexOf(k), 1), b;
            }),
          ),
          d(
            a.prototype,
            f('get', function(a) {
              return this.unlock(a).value;
            }),
          ),
          d(
            a.prototype,
            f('set', function(a, b) {
              this.unlock(a).value = b;
            }),
          ),
          a
        );
      })(),
      p = (function(g) {
        function h(b) {
          return this === a || null == this || this === h.prototype
            ? new h(b)
            : (p(this, new o()), void r(this, b));
        }
        function i(a) {
          n(a);
          var d = q(this).get(a);
          return d === b ? c : d;
        }
        function j(a, d) {
          n(a),
            // store a token for explicit undefined so that "has" works correctly
            q(this).set(a, d === c ? b : d);
        }
        function k(a) {
          return n(a), q(this).get(a) !== c;
        }
        function l(a) {
          n(a);
          var b = q(this),
            d = b.get(a) !== c;
          return b.set(a, c), d;
        }
        function m() {
          return q(this), '[object WeakMap]';
        }
        var n = function(a) {
            if (null == a || ('object' != typeof a && 'function' != typeof a))
              throw new TypeError('Invalid WeakMap key');
          },
          p = function(a, b) {
            var c = g.unlock(a);
            if (c.value) throw new TypeError('Object is already a WeakMap');
            c.value = b;
          },
          q = function(a) {
            var b = g.unlock(a).value;
            if (!b) throw new TypeError('WeakMap is not generic');
            return b;
          },
          r = function(a, b) {
            null !== b &&
              'object' == typeof b &&
              'function' == typeof b.forEach &&
              b.forEach(function(c, d) {
                c instanceof Array && 2 === c.length && j.call(a, b[d][0], b[d][1]);
              });
          };
        // Undo the function-name stripping that UglifyJS does
        (i._name = 'get'), (j._name = 'set'), (k._name = 'has'), (m._name = 'toString');
        var s = ('' + Object).split('Object'),
          t = f('toString', function() {
            return s[0] + e(this) + s[1];
          });
        d(t, t);
        var u =
          { __proto__: [] } instanceof Array
            ? function(a) {
                a.__proto__ = t;
              }
            : function(a) {
                d(a, t);
              };
        return (
          u(h),
          [m, i, j, k, l].forEach(function(a) {
            d(h.prototype, a), u(a);
          }),
          h
        );
      })(new o()),
      q = Object.create
        ? function() {
            return Object.create(null);
          }
        : function() {
            return {};
          };
    'undefined' != typeof module
      ? (module.exports = p)
      : 'undefined' != typeof exports
      ? (exports.WeakMap = p)
      : 'WeakMap' in a || (a.WeakMap = p),
      (p.createStorage = g),
      a.WeakMap && (a.WeakMap.createStorage = g);
  })(
    (function() {
      return this;
    })(),
  ),
    /*!
     * Knockout ES5 plugin - https://github.com/SteveSanderson/knockout-es5
     * Copyright (c) Steve Sanderson
     * MIT license
     */ (function(a, b) {
      'use strict';
      // Model tracking
      // --------------
      //
      // This is the central feature of Knockout-ES5. We augment model objects by converting properties
      // into ES5 getter/setter pairs that read/write an underlying Knockout observable. This means you can
      // use plain JavaScript syntax to read/write the property while still getting the full benefits of
      // Knockout's automatic dependency detection and notification triggering.
      //
      // For comparison, here's Knockout ES3-compatible syntax:
      //
      //     var firstNameLength = myModel.user().firstName().length; // Read
      //     myModel.user().firstName('Bert'); // Write
      //
      // ... versus Knockout-ES5 syntax:
      //
      //     var firstNameLength = myModel.user.firstName.length; // Read
      //     myModel.user.firstName = 'Bert'; // Write
      // `ko.track(model)` converts each property on the given model object into a getter/setter pair that
      // wraps a Knockout observable. Optionally specify an array of property names to wrap; otherwise we
      // wrap all properties. If any of the properties are already observables, we replace them with
      // ES5 getter/setter pairs that wrap your original observable instances. In the case of readonly
      // ko.computed properties, we simply do not define a setter (so attempted writes will be ignored,
      // which is how ES5 readonly properties normally behave).
      //
      // By design, this does *not* recursively walk child object properties, because making literally
      // everything everywhere independently observable is usually unhelpful. When you do want to track
      // child object properties independently, define your own class for those child objects and put
      // a separate ko.track call into its constructor --- this gives you far more control.
      /**
       * @param {object} obj
       * @param {object|array.<string>} propertyNamesOrSettings
       * @param {boolean} propertyNamesOrSettings.deep Use deep track.
       * @param {array.<string>} propertyNamesOrSettings.fields Array of property names to wrap.
       * todo: @param {array.<string>} propertyNamesOrSettings.exclude Array of exclude property names to wrap.
       * todo: @param {function(string, *):boolean} propertyNamesOrSettings.filter Function to filter property
       *   names to wrap. A function that takes ... params
       * @return {object}
       */
      function c(a, b) {
        if (!a || 'object' != typeof a)
          throw new Error('When calling ko.track, you must pass an object as the first parameter.');
        var c;
        // defaults
        return (
          i(b)
            ? ((b.deep = b.deep || !1),
              (b.fields = b.fields || Object.getOwnPropertyNames(a)),
              (b.lazy = b.lazy || !1),
              h(a, b.fields, b))
            : ((c = b || Object.getOwnPropertyNames(a)), h(a, c, {})),
          a
        );
      }
      function d(a) {
        return a.name
          ? a.name
          : (a
              .toString()
              .trim()
              .match(A) || [])[1];
      }
      function e(a) {
        return a && 'object' == typeof a && 'Object' === d(a.constructor);
      }
      function f(a, c, d) {
        var e = w.isObservable(a),
          f = !e && Array.isArray(a),
          g = e ? a : f ? w.observableArray(a) : w.observable(a);
        // add check in case the object is already an observable array
        return (
          (d[c] = function() {
            return g;
          }),
          (f || (e && 'push' in g)) && m(w, g),
          { configurable: !0, enumerable: !0, get: g, set: w.isWriteableObservable(g) ? g : b }
        );
      }
      function g(a, b, c) {
        function d(a, b) {
          return e
            ? b
              ? e(a)
              : e
            : Array.isArray(a)
            ? ((e = w.observableArray(a)), m(w, e), e)
            : (e = w.observable(a));
        }
        if (w.isObservable(a))
          // no need to be lazy if we already have an observable
          return f(a, b, c);
        var e;
        return (
          (c[b] = function() {
            return d(a);
          }),
          {
            configurable: !0,
            enumerable: !0,
            get: function() {
              return d(a)();
            },
            set: function(a) {
              d(a, !0);
            },
          }
        );
      }
      function h(a, b, c) {
        if (b.length) {
          var d = j(a, !0),
            i = {};
          b.forEach(function(b) {
            // Skip properties that are already tracked
            if (!(b in d) && Object.getOwnPropertyDescriptor(a, b).configurable !== !1) {
              // Skip properties where descriptor can't be redefined
              var j = a[b];
              (i[b] = (c.lazy ? g : f)(j, b, d)), c.deep && e(j) && h(j, Object.keys(j), c);
            }
          }),
            Object.defineProperties(a, i);
        }
      }
      function i(a) {
        return !!a && 'object' == typeof a && a.constructor === Object;
      }
      // Gets or creates the hidden internal key-value collection of observables corresponding to
      // properties on the model object.
      function j(a, b) {
        y || (y = x());
        var c = y.get(a);
        return !c && b && ((c = {}), y.set(a, c)), c;
      }
      // Removes the internal references to observables mapped to the specified properties
      // or the entire object reference if no properties are passed in. This allows the
      // observables to be replaced and tracked again.
      function k(a, b) {
        if (y)
          if (1 === arguments.length) y.delete(a);
          else {
            var c = j(a, !1);
            c &&
              b.forEach(function(a) {
                delete c[a];
              });
          }
      }
      // Computed properties
      // -------------------
      //
      // The preceding code is already sufficient to upgrade ko.computed model properties to ES5
      // getter/setter pairs (or in the case of readonly ko.computed properties, just a getter).
      // These then behave like a regular property with a getter function, except they are smarter:
      // your evaluator is only invoked when one of its dependencies changes. The result is cached
      // and used for all evaluations until the next time a dependency changes).
      //
      // However, instead of forcing developers to declare a ko.computed property explicitly, it's
      // nice to offer a utility function that declares a computed getter directly.
      // Implements `ko.defineProperty`
      function l(a, b, d) {
        var e = this,
          f = { owner: a, deferEvaluation: !0 };
        if ('function' == typeof d) f.read = d;
        else {
          if ('value' in d)
            throw new Error(
              'For ko.defineProperty, you must not specify a "value" for the property. You must provide a "get" function.',
            );
          if ('function' != typeof d.get)
            throw new Error(
              'For ko.defineProperty, the third parameter must be either an evaluator function, or an options object containing a function called "get".',
            );
          (f.read = d.get), (f.write = d.set);
        }
        return (a[b] = e.computed(f)), c.call(e, a, [b]), a;
      }
      // Array handling
      // --------------
      //
      // Arrays are special, because unlike other property types, they have standard mutator functions
      // (`push`/`pop`/`splice`/etc.) and it's desirable to trigger a change notification whenever one of
      // those mutator functions is invoked.
      //
      // Traditionally, Knockout handles this by putting special versions of `push`/`pop`/etc. on observable
      // arrays that mutate the underlying array and then trigger a notification. That approach doesn't
      // work for Knockout-ES5 because properties now return the underlying arrays, so the mutator runs
      // in the context of the underlying array, not any particular observable:
      //
      //     // Operates on the underlying array value
      //     myModel.someCollection.push('New value');
      //
      // To solve this, Knockout-ES5 detects array values, and modifies them as follows:
      //  1. Associates a hidden subscribable with each array instance that it encounters
      //  2. Intercepts standard mutators (`push`/`pop`/etc.) and makes them trigger the subscribable
      // Then, for model properties whose values are arrays, the property's underlying observable
      // subscribes to the array subscribable, so it can trigger a change notification after mutation.
      // Given an observable that underlies a model property, watch for any array value that might
      // be assigned as the property value, and hook into its change events
      function m(a, b) {
        var c = null;
        a.computed(function() {
          // Unsubscribe to any earlier array instance
          c && (c.dispose(), (c = null));
          // Subscribe to the new array instance
          var d = b();
          d instanceof Array && (c = n(a, b, d));
        });
      }
      // Listens for array mutations, and when they happen, cause the observable to fire notifications.
      // This is used to make model properties of type array fire notifications when the array changes.
      // Returns a subscribable that can later be disposed.
      function n(a, b, c) {
        var d = o(a, c);
        return d.subscribe(b);
      }
      // Gets or creates a subscribable that fires after each array mutation
      function o(a, b) {
        z || (z = x());
        var c = z.get(b);
        if (!c) {
          (c = new a.subscribable()), z.set(b, c);
          var d = {};
          p(b, c, d), q(a, b, c, d);
        }
        return c;
      }
      // After each array mutation, fires a notification on the given subscribable
      function p(a, b, c) {
        ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'].forEach(function(d) {
          var e = a[d];
          a[d] = function() {
            var a = e.apply(this, arguments);
            return c.pause !== !0 && b.notifySubscribers(this), a;
          };
        });
      }
      // Adds Knockout's additional array mutation functions to the array
      function q(a, b, c, d) {
        ['remove', 'removeAll', 'destroy', 'destroyAll', 'replace'].forEach(function(e) {
          // Make it a non-enumerable property for consistency with standard Array functions
          Object.defineProperty(b, e, {
            enumerable: !1,
            value: function() {
              var f;
              // These additional array mutators are built using the underlying push/pop/etc.
              // mutators, which are wrapped to trigger notifications. But we don't want to
              // trigger multiple notifications, so pause the push/pop/etc. wrappers and
              // delivery only one notification at the end of the process.
              d.pause = !0;
              try {
                // Creates a temporary observableArray that can perform the operation.
                f = a.observableArray.fn[e].apply(a.observableArray(b), arguments);
              } finally {
                d.pause = !1;
              }
              return c.notifySubscribers(b), f;
            },
          });
        });
      }
      // Static utility functions
      // ------------------------
      //
      // Since Knockout-ES5 sets up properties that return values, not observables, you can't
      // trivially subscribe to the underlying observables (e.g., `someProperty.subscribe(...)`),
      // or tell them that object values have mutated, etc. To handle this, we set up some
      // extra utility functions that can return or work with the underlying observables.
      // Returns the underlying observable associated with a model property (or `null` if the
      // model or property doesn't exist, or isn't associated with an observable). This means
      // you can subscribe to the property, e.g.:
      //
      //     ko.getObservable(model, 'propertyName')
      //       .subscribe(function(newValue) { ... });
      function r(a, b) {
        if (!a || 'object' != typeof a) return null;
        var c = j(a, !1);
        if (c && b in c) return c[b]();
        var d = a[b];
        return w.isObservable(d) ? d : null;
      }
      // Returns a boolean indicating whether the property on the object has an underlying
      // observables. This does the check in a way not to create an observable if the
      // object was created with lazily created observables
      function s(a, b) {
        if (!a || 'object' != typeof a) return !1;
        var c = j(a, !1);
        return !!c && b in c;
      }
      // Causes a property's associated observable to fire a change notification. Useful when
      // the property value is a complex object and you've modified a child property.
      function t(a, b) {
        var c = r(a, b);
        c && c.valueHasMutated();
      }
      // Module initialisation
      // ---------------------
      //
      // When this script is first evaluated, it works out what kind of module loading scenario
      // it is in (Node.js or a browser `<script>` tag), stashes a reference to its dependencies
      // (currently that's just the WeakMap shim), and then finally attaches itself to whichever
      // instance of Knockout.js it can find.
      // Extends a Knockout instance with Knockout-ES5 functionality
      function u(a) {
        (a.track = c),
          (a.untrack = k),
          (a.getObservable = r),
          (a.valueHasMutated = t),
          (a.defineProperty = l),
          // todo: test it, maybe added it to ko. directly
          (a.es5 = {
            getAllObservablesForObject: j,
            notifyWhenPresentOrFutureArrayValuesMutate: m,
            isTracked: s,
          });
      }
      // Determines which module loading scenario we're in, grabs dependencies, and attaches to KO
      function v() {
        if ('object' == typeof exports && 'object' == typeof module) {
          // Node.js case - load KO and WeakMap modules synchronously
          w = require('knockout');
          var b = a.WeakMap || require('../lib/weakmap');
          u(w),
            (x = function() {
              return new b();
            }),
            (module.exports = w);
        } else
          'function' == typeof define && define.amd
            ? define('KnockoutES5', ['knockout'], function(b) {
                return (
                  (w = b),
                  u(b),
                  (x = function() {
                    return new a.WeakMap();
                  }),
                  b
                );
              })
            : 'ko' in a &&
              // Non-module case - attach to the global instance, and assume a global WeakMap constructor
              ((w = a.ko),
              u(a.ko),
              (x = function() {
                return new a.WeakMap();
              }));
      }
      var w,
        x,
        y,
        z,
        A = /^function\s*([^\s(]+)/;
      v();
    })('undefined' != typeof window ? window : 'undefined' != typeof global ? global : this);
  /*! markdown-it-sanitizer 0.4.3 https://github.com/svbergerem/markdown-it-sanitizer @license MIT */
  !(function(e) {
    if ('object' == typeof exports && 'undefined' != typeof module) module.exports = e();
    else if ('function' == typeof define && define.amd) define('markdown-it-sanitizer', [], e);
    else {
      var t;
      (t =
        'undefined' != typeof window
          ? window
          : 'undefined' != typeof global
          ? global
          : 'undefined' != typeof self
          ? self
          : this),
        (t.markdownitSanitizer = e());
    }
  })(function() {
    return (function e(t, n, r) {
      function o(l, f) {
        if (!n[l]) {
          if (!t[l]) {
            var a = 'function' == typeof require && require;
            if (!f && a) return a(l, !0);
            if (i) return i(l, !0);
            var s = new Error("Cannot find module '" + l + "'");
            throw ((s.code = 'MODULE_NOT_FOUND'), s);
          }
          var c = (n[l] = { exports: {} });
          t[l][0].call(
            c.exports,
            function(e) {
              var n = t[l][1][e];
              return o(n ? n : e);
            },
            c,
            c.exports,
            e,
            t,
            n,
            r,
          );
        }
        return n[l].exports;
      }
      for (var i = 'function' == typeof require && require, l = 0; l < r.length; l++) o(r[l]);
      return o;
    })(
      {
        1: [
          function(e, t, n) {
            'use strict';
            t.exports = function(e, t) {
              function n(e) {
                var t = l.match(e);
                return t && 1 === t.length && 0 === t[0].index && t[0].lastIndex === e.length
                  ? t[0].url
                  : null;
              }
              function r(e) {
                return (e = e.replace(/<[^<>]*>?/gi, function(e) {
                  var t, r, o, i, l, a;
                  return /(^<->|^<-\s|^<3\s)/.test(e)
                    ? e
                    : ((t = e.match(u)),
                      t &&
                      ((r = t[1]),
                      (o = n(r.match(/src="([^"<>]*)"/i)[1])),
                      (i = r.match(/alt="([^"<>]*)"/i)),
                      (i = i && 'undefined' != typeof i[1] ? i[1] : ''),
                      (l = r.match(/title="([^"<>]*)"/i)),
                      (l = l && 'undefined' != typeof l[1] ? l[1] : ''),
                      o && p.test(o))
                        ? '' !== y
                          ? '<img src="' +
                            o +
                            '" alt="' +
                            i +
                            '" title="' +
                            l +
                            '" class="' +
                            y +
                            '">'
                          : '<img src="' + o + '" alt="' + i + '" title="' + l + '">'
                        : ((a = v.indexOf('a')),
                          (t = e.match(s)),
                          t &&
                          ((r = t[1]),
                          (o = n(r.match(/href="([^"<>]*)"/i)[1])),
                          (l = r.match(/title="([^"<>]*)"/i)),
                          (l = l && 'undefined' != typeof l[1] ? l[1] : ''),
                          o && h.test(o))
                            ? ((k = !0),
                              (b[a] += 1),
                              '<a href="' + o + '" title="' + l + '" target="_blank">')
                            : (t = /<\/a>/i.test(e))
                            ? ((k = !0), (b[a] -= 1), b[a] < 0 && (x[a] = !0), '</a>')
                            : (t = e.match(/<(br|hr)\s?\/?>/i))
                            ? '<' + t[1].toLowerCase() + '>'
                            : ((t = e.match(
                                /<(\/?)(b|blockquote|code|em|h[1-6]|li|ol(?: start="\d+")?|p|pre|s|sub|sup|strong|ul)>/i,
                              )),
                              t && !/<\/ol start="\d+"/i.test(e)
                                ? ((k = !0),
                                  (a = v.indexOf(t[2].toLowerCase().split(' ')[0])),
                                  '/' === t[1] ? (b[a] -= 1) : (b[a] += 1),
                                  b[a] < 0 && (x[a] = !0),
                                  '<' + t[1] + t[2].toLowerCase() + '>')
                                : g === !0
                                ? ''
                                : f(e))));
                }));
              }
              function o(e) {
                var t, n, o;
                for (d = 0; d < v.length; d++) b[d] = 0;
                for (d = 0; d < v.length; d++) x[d] = !1;
                for (k = !1, n = 0; n < e.tokens.length; n++)
                  if (
                    ('html_block' === e.tokens[n].type &&
                      (e.tokens[n].content = r(e.tokens[n].content)),
                    'inline' === e.tokens[n].type)
                  )
                    for (o = e.tokens[n].children, t = 0; t < o.length; t++)
                      'html_inline' === o[t].type && (o[t].content = r(o[t].content));
              }
              function i(e) {
                function t(e, t) {
                  var n, r;
                  return (
                    (n =
                      'a' === t
                        ? RegExp('<a href="[^"<>]*" title="[^"<>]*" target="_blank">', 'g')
                        : 'ol' === t
                        ? /<ol(?: start="\d+")?>/g
                        : RegExp('<' + t + '>', 'g')),
                    (r = RegExp('</' + t + '>', 'g')),
                    m === !0
                      ? ((e = e.replace(n, '')), (e = e.replace(r, '')))
                      : ((e = e.replace(n, function(e) {
                          return f(e);
                        })),
                        (e = e.replace(r, function(e) {
                          return f(e);
                        }))),
                    e
                  );
                }
                function n(e) {
                  var n;
                  for (n = 0; n < v.length; n++) x[n] === !0 && (e = t(e, v[n]));
                  return e;
                }
                if (k !== !1) {
                  var r, o;
                  for (d = 0; d < v.length; d++) 0 !== b[d] && (x[d] = !0);
                  for (r = 0; r < e.tokens.length; r++)
                    if ('html_block' !== e.tokens[r].type) {
                      if ('inline' === e.tokens[r].type)
                        for (o = e.tokens[r].children, d = 0; d < o.length; d++)
                          'html_inline' === o[d].type && (o[d].content = n(o[d].content));
                    } else e.tokens[r].content = n(e.tokens[r].content);
                }
              }
              var l = e.linkify,
                f = e.utils.escapeHtml,
                a = '<a\\s([^<>]*href="[^"<>]*"[^<>]*)\\s?>',
                s = RegExp(a, 'i'),
                c = '<img\\s([^<>]*src="[^"<>]*"[^<>]*)\\s?\\/?>',
                u = RegExp(c, 'i'),
                p = /^(?:https?:)?\/\//i,
                h = /^(?:https?:\/\/|ftp:\/\/|\/\/|mailto:|xmpp:)/i;
              t = t ? t : {};
              var d,
                g = 'undefined' != typeof t.removeUnknown && t.removeUnknown,
                m = 'undefined' != typeof t.removeUnbalanced && t.removeUnbalanced,
                y = 'undefined' != typeof t.imageClass ? t.imageClass : '',
                k = !1,
                v = [
                  'a',
                  'b',
                  'blockquote',
                  'code',
                  'em',
                  'h1',
                  'h2',
                  'h3',
                  'h4',
                  'h5',
                  'h6',
                  'li',
                  'ol',
                  'p',
                  'pre',
                  's',
                  'sub',
                  'sup',
                  'strong',
                  'ul',
                ],
                b = new Array(v.length),
                x = new Array(v.length);
              for (d = 0; d < v.length; d++) b[d] = 0;
              for (d = 0; d < v.length; d++) x[d] = !1;
              e.core.ruler.after('linkify', 'sanitize_inline', o),
                e.core.ruler.after('sanitize_inline', 'sanitize_balance', i);
            };
          },
          {},
        ],
      },
      {},
      [1],
    )(1);
  });

  /*! markdown-it 7.0.1 https://github.com//markdown-it/markdown-it @license MIT */
  !(function(e) {
    if ('object' == typeof exports && 'undefined' != typeof module) module.exports = e();
    else if ('function' == typeof define && define.amd) define('markdown-it', [], e);
    else {
      var r;
      (r =
        'undefined' != typeof window
          ? window
          : 'undefined' != typeof global
          ? global
          : 'undefined' != typeof self
          ? self
          : this),
        (r.markdownit = e());
    }
  })(function() {
    var e;
    return (function e(r, t, n) {
      function s(i, a) {
        if (!t[i]) {
          if (!r[i]) {
            var c = 'function' == typeof require && require;
            if (!a && c) return c(i, !0);
            if (o) return o(i, !0);
            var l = new Error("Cannot find module '" + i + "'");
            throw ((l.code = 'MODULE_NOT_FOUND'), l);
          }
          var u = (t[i] = { exports: {} });
          r[i][0].call(
            u.exports,
            function(e) {
              var t = r[i][1][e];
              return s(t ? t : e);
            },
            u,
            u.exports,
            e,
            r,
            t,
            n,
          );
        }
        return t[i].exports;
      }
      for (var o = 'function' == typeof require && require, i = 0; i < n.length; i++) s(n[i]);
      return s;
    })(
      {
        1: [
          function(e, r, t) {
            'use strict';
            r.exports = e('entities/maps/entities.json');
          },
          { 'entities/maps/entities.json': 52 },
        ],
        2: [
          function(e, r, t) {
            'use strict';
            r.exports = [
              'address',
              'article',
              'aside',
              'base',
              'basefont',
              'blockquote',
              'body',
              'caption',
              'center',
              'col',
              'colgroup',
              'dd',
              'details',
              'dialog',
              'dir',
              'div',
              'dl',
              'dt',
              'fieldset',
              'figcaption',
              'figure',
              'footer',
              'form',
              'frame',
              'frameset',
              'h1',
              'head',
              'header',
              'hr',
              'html',
              'iframe',
              'legend',
              'li',
              'link',
              'main',
              'menu',
              'menuitem',
              'meta',
              'nav',
              'noframes',
              'ol',
              'optgroup',
              'option',
              'p',
              'param',
              'pre',
              'section',
              'source',
              'title',
              'summary',
              'table',
              'tbody',
              'td',
              'tfoot',
              'th',
              'thead',
              'title',
              'tr',
              'track',
              'ul',
            ];
          },
          {},
        ],
        3: [
          function(e, r, t) {
            'use strict';
            var n = '[a-zA-Z_:][a-zA-Z0-9:._-]*',
              s = '[^"\'=<>`\\x00-\\x20]+',
              o = "'[^']*'",
              i = '"[^"]*"',
              a = '(?:' + s + '|' + o + '|' + i + ')',
              c = '(?:\\s+' + n + '(?:\\s*=\\s*' + a + ')?)',
              l = '<[A-Za-z][A-Za-z0-9\\-]*' + c + '*\\s*\\/?>',
              u = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>',
              p = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->',
              h = '<[?].*?[?]>',
              f = '<![A-Z]+\\s+[^>]*>',
              d = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>',
              m = new RegExp('^(?:' + l + '|' + u + '|' + p + '|' + h + '|' + f + '|' + d + ')'),
              _ = new RegExp('^(?:' + l + '|' + u + ')');
            (r.exports.HTML_TAG_RE = m), (r.exports.HTML_OPEN_CLOSE_TAG_RE = _);
          },
          {},
        ],
        4: [
          function(e, r, t) {
            'use strict';
            function n(e) {
              return Object.prototype.toString.call(e);
            }
            function s(e) {
              return '[object String]' === n(e);
            }
            function o(e, r) {
              return y.call(e, r);
            }
            function i(e) {
              var r = Array.prototype.slice.call(arguments, 1);
              return (
                r.forEach(function(r) {
                  if (r) {
                    if ('object' != typeof r) throw new TypeError(r + 'must be object');
                    Object.keys(r).forEach(function(t) {
                      e[t] = r[t];
                    });
                  }
                }),
                e
              );
            }
            function a(e, r, t) {
              return [].concat(e.slice(0, r), t, e.slice(r + 1));
            }
            function c(e) {
              return (
                !(e >= 55296 && e <= 57343) &&
                !(e >= 64976 && e <= 65007) &&
                65535 !== (65535 & e) &&
                65534 !== (65535 & e) &&
                !(e >= 0 && e <= 8) &&
                11 !== e &&
                !(e >= 14 && e <= 31) &&
                !(e >= 127 && e <= 159) &&
                !(e > 1114111)
              );
            }
            function l(e) {
              if (e > 65535) {
                e -= 65536;
                var r = 55296 + (e >> 10),
                  t = 56320 + (1023 & e);
                return String.fromCharCode(r, t);
              }
              return String.fromCharCode(e);
            }
            function u(e, r) {
              var t = 0;
              return o(D, r)
                ? D[r]
                : 35 === r.charCodeAt(0) &&
                  w.test(r) &&
                  ((t =
                    'x' === r[1].toLowerCase()
                      ? parseInt(r.slice(2), 16)
                      : parseInt(r.slice(1), 10)),
                  c(t))
                ? l(t)
                : e;
            }
            function p(e) {
              return e.indexOf('\\') < 0 ? e : e.replace(x, '$1');
            }
            function h(e) {
              return e.indexOf('\\') < 0 && e.indexOf('&') < 0
                ? e
                : e.replace(A, function(e, r, t) {
                    return r ? r : u(e, t);
                  });
            }
            function f(e) {
              return S[e];
            }
            function d(e) {
              return q.test(e) ? e.replace(E, f) : e;
            }
            function m(e) {
              return e.replace(F, '\\$&');
            }
            function _(e) {
              switch (e) {
                case 9:
                case 32:
                  return !0;
              }
              return !1;
            }
            function g(e) {
              if (e >= 8192 && e <= 8202) return !0;
              switch (e) {
                case 9:
                case 10:
                case 11:
                case 12:
                case 13:
                case 32:
                case 160:
                case 5760:
                case 8239:
                case 8287:
                case 12288:
                  return !0;
              }
              return !1;
            }
            function k(e) {
              return z.test(e);
            }
            function b(e) {
              switch (e) {
                case 33:
                case 34:
                case 35:
                case 36:
                case 37:
                case 38:
                case 39:
                case 40:
                case 41:
                case 42:
                case 43:
                case 44:
                case 45:
                case 46:
                case 47:
                case 58:
                case 59:
                case 60:
                case 61:
                case 62:
                case 63:
                case 64:
                case 91:
                case 92:
                case 93:
                case 94:
                case 95:
                case 96:
                case 123:
                case 124:
                case 125:
                case 126:
                  return !0;
                default:
                  return !1;
              }
            }
            function v(e) {
              return e
                .trim()
                .replace(/\s+/g, ' ')
                .toUpperCase();
            }
            var y = Object.prototype.hasOwnProperty,
              x = /\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g,
              C = /&([a-z#][a-z0-9]{1,31});/gi,
              A = new RegExp(x.source + '|' + C.source, 'gi'),
              w = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i,
              D = e('./entities'),
              q = /[&<>"]/,
              E = /[&<>"]/g,
              S = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' },
              F = /[.?*+^$[\]\\(){}|-]/g,
              z = e('uc.micro/categories/P/regex');
            (t.lib = {}),
              (t.lib.mdurl = e('mdurl')),
              (t.lib.ucmicro = e('uc.micro')),
              (t.assign = i),
              (t.isString = s),
              (t.has = o),
              (t.unescapeMd = p),
              (t.unescapeAll = h),
              (t.isValidEntityCode = c),
              (t.fromCodePoint = l),
              (t.escapeHtml = d),
              (t.arrayReplaceAt = a),
              (t.isSpace = _),
              (t.isWhiteSpace = g),
              (t.isMdAsciiPunct = b),
              (t.isPunctChar = k),
              (t.escapeRE = m),
              (t.normalizeReference = v);
          },
          { './entities': 1, mdurl: 58, 'uc.micro': 65, 'uc.micro/categories/P/regex': 63 },
        ],
        5: [
          function(e, r, t) {
            'use strict';
            (t.parseLinkLabel = e('./parse_link_label')),
              (t.parseLinkDestination = e('./parse_link_destination')),
              (t.parseLinkTitle = e('./parse_link_title'));
          },
          { './parse_link_destination': 6, './parse_link_label': 7, './parse_link_title': 8 },
        ],
        6: [
          function(e, r, t) {
            'use strict';
            var n = e('../common/utils').isSpace,
              s = e('../common/utils').unescapeAll;
            r.exports = function(e, r, t) {
              var o,
                i,
                a = 0,
                c = r,
                l = { ok: !1, pos: 0, lines: 0, str: '' };
              if (60 === e.charCodeAt(r)) {
                for (r++; r < t; ) {
                  if (((o = e.charCodeAt(r)), 10 === o || n(o))) return l;
                  if (62 === o)
                    return (l.pos = r + 1), (l.str = s(e.slice(c + 1, r))), (l.ok = !0), l;
                  92 === o && r + 1 < t ? (r += 2) : r++;
                }
                return l;
              }
              for (i = 0; r < t && ((o = e.charCodeAt(r)), 32 !== o) && !(o < 32 || 127 === o); )
                if (92 === o && r + 1 < t) r += 2;
                else {
                  if (40 === o && (i++, i > 1)) break;
                  if (41 === o && (i--, i < 0)) break;
                  r++;
                }
              return c === r
                ? l
                : ((l.str = s(e.slice(c, r))), (l.lines = a), (l.pos = r), (l.ok = !0), l);
            };
          },
          { '../common/utils': 4 },
        ],
        7: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e, r, t) {
              var n,
                s,
                o,
                i,
                a = -1,
                c = e.posMax,
                l = e.pos;
              for (e.pos = r + 1, n = 1; e.pos < c; ) {
                if (((o = e.src.charCodeAt(e.pos)), 93 === o && (n--, 0 === n))) {
                  s = !0;
                  break;
                }
                if (((i = e.pos), e.md.inline.skipToken(e), 91 === o))
                  if (i === e.pos - 1) n++;
                  else if (t) return (e.pos = l), -1;
              }
              return s && (a = e.pos), (e.pos = l), a;
            };
          },
          {},
        ],
        8: [
          function(e, r, t) {
            'use strict';
            var n = e('../common/utils').unescapeAll;
            r.exports = function(e, r, t) {
              var s,
                o,
                i = 0,
                a = r,
                c = { ok: !1, pos: 0, lines: 0, str: '' };
              if (r >= t) return c;
              if (((o = e.charCodeAt(r)), 34 !== o && 39 !== o && 40 !== o)) return c;
              for (r++, 40 === o && (o = 41); r < t; ) {
                if (((s = e.charCodeAt(r)), s === o))
                  return (
                    (c.pos = r + 1), (c.lines = i), (c.str = n(e.slice(a + 1, r))), (c.ok = !0), c
                  );
                10 === s ? i++ : 92 === s && r + 1 < t && (r++, 10 === e.charCodeAt(r) && i++), r++;
              }
              return c;
            };
          },
          { '../common/utils': 4 },
        ],
        9: [
          function(e, r, t) {
            'use strict';
            function n(e) {
              var r = e.trim().toLowerCase();
              return !g.test(r) || !!k.test(r);
            }
            function s(e) {
              var r = d.parse(e, !0);
              if (r.hostname && (!r.protocol || b.indexOf(r.protocol) >= 0))
                try {
                  r.hostname = m.toASCII(r.hostname);
                } catch (e) {}
              return d.encode(d.format(r));
            }
            function o(e) {
              var r = d.parse(e, !0);
              if (r.hostname && (!r.protocol || b.indexOf(r.protocol) >= 0))
                try {
                  r.hostname = m.toUnicode(r.hostname);
                } catch (e) {}
              return d.decode(d.format(r));
            }
            function i(e, r) {
              return this instanceof i
                ? (r || a.isString(e) || ((r = e || {}), (e = 'default')),
                  (this.inline = new h()),
                  (this.block = new p()),
                  (this.core = new u()),
                  (this.renderer = new l()),
                  (this.linkify = new f()),
                  (this.validateLink = n),
                  (this.normalizeLink = s),
                  (this.normalizeLinkText = o),
                  (this.utils = a),
                  (this.helpers = c),
                  (this.options = {}),
                  this.configure(e),
                  void (r && this.set(r)))
                : new i(e, r);
            }
            var a = e('./common/utils'),
              c = e('./helpers'),
              l = e('./renderer'),
              u = e('./parser_core'),
              p = e('./parser_block'),
              h = e('./parser_inline'),
              f = e('linkify-it'),
              d = e('mdurl'),
              m = e('punycode'),
              _ = {
                default: e('./presets/default'),
                zero: e('./presets/zero'),
                commonmark: e('./presets/commonmark'),
              },
              g = /^(vbscript|javascript|file|data):/,
              k = /^data:image\/(gif|png|jpeg|webp);/,
              b = ['http:', 'https:', 'mailto:'];
            (i.prototype.set = function(e) {
              return a.assign(this.options, e), this;
            }),
              (i.prototype.configure = function(e) {
                var r,
                  t = this;
                if (a.isString(e) && ((r = e), (e = _[r]), !e))
                  throw new Error('Wrong `markdown-it` preset "' + r + '", check name');
                if (!e) throw new Error("Wrong `markdown-it` preset, can't be empty");
                return (
                  e.options && t.set(e.options),
                  e.components &&
                    Object.keys(e.components).forEach(function(r) {
                      e.components[r].rules && t[r].ruler.enableOnly(e.components[r].rules),
                        e.components[r].rules2 && t[r].ruler2.enableOnly(e.components[r].rules2);
                    }),
                  this
                );
              }),
              (i.prototype.enable = function(e, r) {
                var t = [];
                Array.isArray(e) || (e = [e]),
                  ['core', 'block', 'inline'].forEach(function(r) {
                    t = t.concat(this[r].ruler.enable(e, !0));
                  }, this),
                  (t = t.concat(this.inline.ruler2.enable(e, !0)));
                var n = e.filter(function(e) {
                  return t.indexOf(e) < 0;
                });
                if (n.length && !r)
                  throw new Error('MarkdownIt. Failed to enable unknown rule(s): ' + n);
                return this;
              }),
              (i.prototype.disable = function(e, r) {
                var t = [];
                Array.isArray(e) || (e = [e]),
                  ['core', 'block', 'inline'].forEach(function(r) {
                    t = t.concat(this[r].ruler.disable(e, !0));
                  }, this),
                  (t = t.concat(this.inline.ruler2.disable(e, !0)));
                var n = e.filter(function(e) {
                  return t.indexOf(e) < 0;
                });
                if (n.length && !r)
                  throw new Error('MarkdownIt. Failed to disable unknown rule(s): ' + n);
                return this;
              }),
              (i.prototype.use = function(e) {
                var r = [this].concat(Array.prototype.slice.call(arguments, 1));
                return e.apply(e, r), this;
              }),
              (i.prototype.parse = function(e, r) {
                var t = new this.core.State(e, this, r);
                return this.core.process(t), t.tokens;
              }),
              (i.prototype.render = function(e, r) {
                return (r = r || {}), this.renderer.render(this.parse(e, r), this.options, r);
              }),
              (i.prototype.parseInline = function(e, r) {
                var t = new this.core.State(e, this, r);
                return (t.inlineMode = !0), this.core.process(t), t.tokens;
              }),
              (i.prototype.renderInline = function(e, r) {
                return (r = r || {}), this.renderer.render(this.parseInline(e, r), this.options, r);
              }),
              (r.exports = i);
          },
          {
            './common/utils': 4,
            './helpers': 5,
            './parser_block': 10,
            './parser_core': 11,
            './parser_inline': 12,
            './presets/commonmark': 13,
            './presets/default': 14,
            './presets/zero': 15,
            './renderer': 16,
            'linkify-it': 53,
            mdurl: 58,
            punycode: 60,
          },
        ],
        10: [
          function(e, r, t) {
            'use strict';
            function n() {
              this.ruler = new s();
              for (var e = 0; e < o.length; e++)
                this.ruler.push(o[e][0], o[e][1], { alt: (o[e][2] || []).slice() });
            }
            var s = e('./ruler'),
              o = [
                ['table', e('./rules_block/table'), ['paragraph', 'reference']],
                ['code', e('./rules_block/code')],
                [
                  'fence',
                  e('./rules_block/fence'),
                  ['paragraph', 'reference', 'blockquote', 'list'],
                ],
                ['blockquote', e('./rules_block/blockquote'), ['paragraph', 'reference', 'list']],
                ['hr', e('./rules_block/hr'), ['paragraph', 'reference', 'blockquote', 'list']],
                ['list', e('./rules_block/list'), ['paragraph', 'reference', 'blockquote']],
                ['reference', e('./rules_block/reference')],
                ['heading', e('./rules_block/heading'), ['paragraph', 'reference', 'blockquote']],
                ['lheading', e('./rules_block/lheading')],
                [
                  'html_block',
                  e('./rules_block/html_block'),
                  ['paragraph', 'reference', 'blockquote'],
                ],
                ['paragraph', e('./rules_block/paragraph')],
              ];
            (n.prototype.tokenize = function(e, r, t) {
              for (
                var n,
                  s,
                  o = this.ruler.getRules(''),
                  i = o.length,
                  a = r,
                  c = !1,
                  l = e.md.options.maxNesting;
                a < t &&
                ((e.line = a = e.skipEmptyLines(a)), !(a >= t)) &&
                !(e.sCount[a] < e.blkIndent);

              ) {
                if (e.level >= l) {
                  e.line = t;
                  break;
                }
                for (s = 0; s < i && !(n = o[s](e, a, t, !1)); s++);
                if (
                  ((e.tight = !c),
                  e.isEmpty(e.line - 1) && (c = !0),
                  (a = e.line),
                  a < t && e.isEmpty(a))
                ) {
                  if (((c = !0), a++, a < t && 'list' === e.parentType && e.isEmpty(a))) break;
                  e.line = a;
                }
              }
            }),
              (n.prototype.parse = function(e, r, t, n) {
                var s;
                e && ((s = new this.State(e, r, t, n)), this.tokenize(s, s.line, s.lineMax));
              }),
              (n.prototype.State = e('./rules_block/state_block')),
              (r.exports = n);
          },
          {
            './ruler': 17,
            './rules_block/blockquote': 18,
            './rules_block/code': 19,
            './rules_block/fence': 20,
            './rules_block/heading': 21,
            './rules_block/hr': 22,
            './rules_block/html_block': 23,
            './rules_block/lheading': 24,
            './rules_block/list': 25,
            './rules_block/paragraph': 26,
            './rules_block/reference': 27,
            './rules_block/state_block': 28,
            './rules_block/table': 29,
          },
        ],
        11: [
          function(e, r, t) {
            'use strict';
            function n() {
              this.ruler = new s();
              for (var e = 0; e < o.length; e++) this.ruler.push(o[e][0], o[e][1]);
            }
            var s = e('./ruler'),
              o = [
                ['normalize', e('./rules_core/normalize')],
                ['block', e('./rules_core/block')],
                ['inline', e('./rules_core/inline')],
                ['linkify', e('./rules_core/linkify')],
                ['replacements', e('./rules_core/replacements')],
                ['smartquotes', e('./rules_core/smartquotes')],
              ];
            (n.prototype.process = function(e) {
              var r, t, n;
              for (n = this.ruler.getRules(''), r = 0, t = n.length; r < t; r++) n[r](e);
            }),
              (n.prototype.State = e('./rules_core/state_core')),
              (r.exports = n);
          },
          {
            './ruler': 17,
            './rules_core/block': 30,
            './rules_core/inline': 31,
            './rules_core/linkify': 32,
            './rules_core/normalize': 33,
            './rules_core/replacements': 34,
            './rules_core/smartquotes': 35,
            './rules_core/state_core': 36,
          },
        ],
        12: [
          function(e, r, t) {
            'use strict';
            function n() {
              var e;
              for (this.ruler = new s(), e = 0; e < o.length; e++)
                this.ruler.push(o[e][0], o[e][1]);
              for (this.ruler2 = new s(), e = 0; e < i.length; e++)
                this.ruler2.push(i[e][0], i[e][1]);
            }
            var s = e('./ruler'),
              o = [
                ['text', e('./rules_inline/text')],
                ['newline', e('./rules_inline/newline')],
                ['escape', e('./rules_inline/escape')],
                ['backticks', e('./rules_inline/backticks')],
                ['strikethrough', e('./rules_inline/strikethrough').tokenize],
                ['emphasis', e('./rules_inline/emphasis').tokenize],
                ['link', e('./rules_inline/link')],
                ['image', e('./rules_inline/image')],
                ['autolink', e('./rules_inline/autolink')],
                ['html_inline', e('./rules_inline/html_inline')],
                ['entity', e('./rules_inline/entity')],
              ],
              i = [
                ['balance_pairs', e('./rules_inline/balance_pairs')],
                ['strikethrough', e('./rules_inline/strikethrough').postProcess],
                ['emphasis', e('./rules_inline/emphasis').postProcess],
                ['text_collapse', e('./rules_inline/text_collapse')],
              ];
            (n.prototype.skipToken = function(e) {
              var r,
                t,
                n = e.pos,
                s = this.ruler.getRules(''),
                o = s.length,
                i = e.md.options.maxNesting,
                a = e.cache;
              if ('undefined' != typeof a[n]) return void (e.pos = a[n]);
              if (e.level < i)
                for (t = 0; t < o && (e.level++, (r = s[t](e, !0)), e.level--, !r); t++);
              else e.pos = e.posMax;
              r || e.pos++, (a[n] = e.pos);
            }),
              (n.prototype.tokenize = function(e) {
                for (
                  var r,
                    t,
                    n = this.ruler.getRules(''),
                    s = n.length,
                    o = e.posMax,
                    i = e.md.options.maxNesting;
                  e.pos < o;

                ) {
                  if (e.level < i) for (t = 0; t < s && !(r = n[t](e, !1)); t++);
                  if (r) {
                    if (e.pos >= o) break;
                  } else e.pending += e.src[e.pos++];
                }
                e.pending && e.pushPending();
              }),
              (n.prototype.parse = function(e, r, t, n) {
                var s,
                  o,
                  i,
                  a = new this.State(e, r, t, n);
                for (
                  this.tokenize(a), o = this.ruler2.getRules(''), i = o.length, s = 0;
                  s < i;
                  s++
                )
                  o[s](a);
              }),
              (n.prototype.State = e('./rules_inline/state_inline')),
              (r.exports = n);
          },
          {
            './ruler': 17,
            './rules_inline/autolink': 37,
            './rules_inline/backticks': 38,
            './rules_inline/balance_pairs': 39,
            './rules_inline/emphasis': 40,
            './rules_inline/entity': 41,
            './rules_inline/escape': 42,
            './rules_inline/html_inline': 43,
            './rules_inline/image': 44,
            './rules_inline/link': 45,
            './rules_inline/newline': 46,
            './rules_inline/state_inline': 47,
            './rules_inline/strikethrough': 48,
            './rules_inline/text': 49,
            './rules_inline/text_collapse': 50,
          },
        ],
        13: [
          function(e, r, t) {
            'use strict';
            r.exports = {
              options: {
                html: !0,
                xhtmlOut: !0,
                breaks: !1,
                langPrefix: 'language-',
                linkify: !1,
                typographer: !1,
                quotes: '\u201c\u201d\u2018\u2019',
                highlight: null,
                maxNesting: 20,
              },
              components: {
                core: { rules: ['normalize', 'block', 'inline'] },
                block: {
                  rules: [
                    'blockquote',
                    'code',
                    'fence',
                    'heading',
                    'hr',
                    'html_block',
                    'lheading',
                    'list',
                    'reference',
                    'paragraph',
                  ],
                },
                inline: {
                  rules: [
                    'autolink',
                    'backticks',
                    'emphasis',
                    'entity',
                    'escape',
                    'html_inline',
                    'image',
                    'link',
                    'newline',
                    'text',
                  ],
                  rules2: ['balance_pairs', 'emphasis', 'text_collapse'],
                },
              },
            };
          },
          {},
        ],
        14: [
          function(e, r, t) {
            'use strict';
            r.exports = {
              options: {
                html: !1,
                xhtmlOut: !1,
                breaks: !1,
                langPrefix: 'language-',
                linkify: !1,
                typographer: !1,
                quotes: '\u201c\u201d\u2018\u2019',
                highlight: null,
                maxNesting: 100,
              },
              components: { core: {}, block: {}, inline: {} },
            };
          },
          {},
        ],
        15: [
          function(e, r, t) {
            'use strict';
            r.exports = {
              options: {
                html: !1,
                xhtmlOut: !1,
                breaks: !1,
                langPrefix: 'language-',
                linkify: !1,
                typographer: !1,
                quotes: '\u201c\u201d\u2018\u2019',
                highlight: null,
                maxNesting: 20,
              },
              components: {
                core: { rules: ['normalize', 'block', 'inline'] },
                block: { rules: ['paragraph'] },
                inline: { rules: ['text'], rules2: ['balance_pairs', 'text_collapse'] },
              },
            };
          },
          {},
        ],
        16: [
          function(e, r, t) {
            'use strict';
            function n() {
              this.rules = s({}, a);
            }
            var s = e('./common/utils').assign,
              o = e('./common/utils').unescapeAll,
              i = e('./common/utils').escapeHtml,
              a = {};
            (a.code_inline = function(e, r, t, n, s) {
              var o = e[r];
              return '<code' + s.renderAttrs(o) + '>' + i(e[r].content) + '</code>';
            }),
              (a.code_block = function(e, r, t, n, s) {
                var o = e[r];
                return '<pre' + s.renderAttrs(o) + '><code>' + i(e[r].content) + '</code></pre>\n';
              }),
              (a.fence = function(e, r, t, n, s) {
                var a,
                  c,
                  l,
                  u,
                  p = e[r],
                  h = p.info ? o(p.info).trim() : '',
                  f = '';
                return (
                  h && (f = h.split(/\s+/g)[0]),
                  (a = t.highlight ? t.highlight(p.content, f) || i(p.content) : i(p.content)),
                  0 === a.indexOf('<pre')
                    ? a + '\n'
                    : h
                    ? ((c = p.attrIndex('class')),
                      (l = p.attrs ? p.attrs.slice() : []),
                      c < 0
                        ? l.push(['class', t.langPrefix + f])
                        : (l[c][1] += ' ' + t.langPrefix + f),
                      (u = { attrs: l }),
                      '<pre><code' + s.renderAttrs(u) + '>' + a + '</code></pre>\n')
                    : '<pre><code' + s.renderAttrs(p) + '>' + a + '</code></pre>\n'
                );
              }),
              (a.image = function(e, r, t, n, s) {
                var o = e[r];
                return (
                  (o.attrs[o.attrIndex('alt')][1] = s.renderInlineAsText(o.children, t, n)),
                  s.renderToken(e, r, t)
                );
              }),
              (a.hardbreak = function(e, r, t) {
                return t.xhtmlOut ? '<br />\n' : '<br>\n';
              }),
              (a.softbreak = function(e, r, t) {
                return t.breaks ? (t.xhtmlOut ? '<br />\n' : '<br>\n') : '\n';
              }),
              (a.text = function(e, r) {
                return i(e[r].content);
              }),
              (a.html_block = function(e, r) {
                return e[r].content;
              }),
              (a.html_inline = function(e, r) {
                return e[r].content;
              }),
              (n.prototype.renderAttrs = function(e) {
                var r, t, n;
                if (!e.attrs) return '';
                for (n = '', r = 0, t = e.attrs.length; r < t; r++)
                  n += ' ' + i(e.attrs[r][0]) + '="' + i(e.attrs[r][1]) + '"';
                return n;
              }),
              (n.prototype.renderToken = function(e, r, t) {
                var n,
                  s = '',
                  o = !1,
                  i = e[r];
                return i.hidden
                  ? ''
                  : (i.block && i.nesting !== -1 && r && e[r - 1].hidden && (s += '\n'),
                    (s += (i.nesting === -1 ? '</' : '<') + i.tag),
                    (s += this.renderAttrs(i)),
                    0 === i.nesting && t.xhtmlOut && (s += ' /'),
                    i.block &&
                      ((o = !0),
                      1 === i.nesting &&
                        r + 1 < e.length &&
                        ((n = e[r + 1]),
                        'inline' === n.type || n.hidden
                          ? (o = !1)
                          : n.nesting === -1 && n.tag === i.tag && (o = !1))),
                    (s += o ? '>\n' : '>'));
              }),
              (n.prototype.renderInline = function(e, r, t) {
                for (var n, s = '', o = this.rules, i = 0, a = e.length; i < a; i++)
                  (n = e[i].type),
                    (s +=
                      'undefined' != typeof o[n]
                        ? o[n](e, i, r, t, this)
                        : this.renderToken(e, i, r));
                return s;
              }),
              (n.prototype.renderInlineAsText = function(e, r, t) {
                for (var n = '', s = 0, o = e.length; s < o; s++)
                  'text' === e[s].type
                    ? (n += e[s].content)
                    : 'image' === e[s].type && (n += this.renderInlineAsText(e[s].children, r, t));
                return n;
              }),
              (n.prototype.render = function(e, r, t) {
                var n,
                  s,
                  o,
                  i = '',
                  a = this.rules;
                for (n = 0, s = e.length; n < s; n++)
                  (o = e[n].type),
                    (i +=
                      'inline' === o
                        ? this.renderInline(e[n].children, r, t)
                        : 'undefined' != typeof a[o]
                        ? a[e[n].type](e, n, r, t, this)
                        : this.renderToken(e, n, r, t));
                return i;
              }),
              (r.exports = n);
          },
          { './common/utils': 4 },
        ],
        17: [
          function(e, r, t) {
            'use strict';
            function n() {
              (this.__rules__ = []), (this.__cache__ = null);
            }
            (n.prototype.__find__ = function(e) {
              for (var r = 0; r < this.__rules__.length; r++)
                if (this.__rules__[r].name === e) return r;
              return -1;
            }),
              (n.prototype.__compile__ = function() {
                var e = this,
                  r = [''];
                e.__rules__.forEach(function(e) {
                  e.enabled &&
                    e.alt.forEach(function(e) {
                      r.indexOf(e) < 0 && r.push(e);
                    });
                }),
                  (e.__cache__ = {}),
                  r.forEach(function(r) {
                    (e.__cache__[r] = []),
                      e.__rules__.forEach(function(t) {
                        t.enabled && ((r && t.alt.indexOf(r) < 0) || e.__cache__[r].push(t.fn));
                      });
                  });
              }),
              (n.prototype.at = function(e, r, t) {
                var n = this.__find__(e),
                  s = t || {};
                if (n === -1) throw new Error('Parser rule not found: ' + e);
                (this.__rules__[n].fn = r),
                  (this.__rules__[n].alt = s.alt || []),
                  (this.__cache__ = null);
              }),
              (n.prototype.before = function(e, r, t, n) {
                var s = this.__find__(e),
                  o = n || {};
                if (s === -1) throw new Error('Parser rule not found: ' + e);
                this.__rules__.splice(s, 0, { name: r, enabled: !0, fn: t, alt: o.alt || [] }),
                  (this.__cache__ = null);
              }),
              (n.prototype.after = function(e, r, t, n) {
                var s = this.__find__(e),
                  o = n || {};
                if (s === -1) throw new Error('Parser rule not found: ' + e);
                this.__rules__.splice(s + 1, 0, { name: r, enabled: !0, fn: t, alt: o.alt || [] }),
                  (this.__cache__ = null);
              }),
              (n.prototype.push = function(e, r, t) {
                var n = t || {};
                this.__rules__.push({ name: e, enabled: !0, fn: r, alt: n.alt || [] }),
                  (this.__cache__ = null);
              }),
              (n.prototype.enable = function(e, r) {
                Array.isArray(e) || (e = [e]);
                var t = [];
                return (
                  e.forEach(function(e) {
                    var n = this.__find__(e);
                    if (n < 0) {
                      if (r) return;
                      throw new Error('Rules manager: invalid rule name ' + e);
                    }
                    (this.__rules__[n].enabled = !0), t.push(e);
                  }, this),
                  (this.__cache__ = null),
                  t
                );
              }),
              (n.prototype.enableOnly = function(e, r) {
                Array.isArray(e) || (e = [e]),
                  this.__rules__.forEach(function(e) {
                    e.enabled = !1;
                  }),
                  this.enable(e, r);
              }),
              (n.prototype.disable = function(e, r) {
                Array.isArray(e) || (e = [e]);
                var t = [];
                return (
                  e.forEach(function(e) {
                    var n = this.__find__(e);
                    if (n < 0) {
                      if (r) return;
                      throw new Error('Rules manager: invalid rule name ' + e);
                    }
                    (this.__rules__[n].enabled = !1), t.push(e);
                  }, this),
                  (this.__cache__ = null),
                  t
                );
              }),
              (n.prototype.getRules = function(e) {
                return null === this.__cache__ && this.__compile__(), this.__cache__[e] || [];
              }),
              (r.exports = n);
          },
          {},
        ],
        18: [
          function(e, r, t) {
            'use strict';
            var n = e('../common/utils').isSpace;
            r.exports = function(e, r, t, s) {
              var o,
                i,
                a,
                c,
                l,
                u,
                p,
                h,
                f,
                d,
                m,
                _,
                g,
                k,
                b,
                v,
                y = e.bMarks[r] + e.tShift[r],
                x = e.eMarks[r];
              if (62 !== e.src.charCodeAt(y++)) return !1;
              if (s) return !0;
              for (
                32 === e.src.charCodeAt(y) && y++,
                  u = e.blkIndent,
                  e.blkIndent = 0,
                  f = d = e.sCount[r] + y - (e.bMarks[r] + e.tShift[r]),
                  l = [e.bMarks[r]],
                  e.bMarks[r] = y;
                y < x && ((m = e.src.charCodeAt(y)), n(m));

              )
                9 === m ? (d += 4 - (d % 4)) : d++, y++;
              for (
                i = y >= x,
                  c = [e.sCount[r]],
                  e.sCount[r] = d - f,
                  a = [e.tShift[r]],
                  e.tShift[r] = y - e.bMarks[r],
                  _ = e.md.block.ruler.getRules('blockquote'),
                  o = r + 1;
                o < t &&
                !(e.sCount[o] < u) &&
                ((y = e.bMarks[o] + e.tShift[o]), (x = e.eMarks[o]), !(y >= x));
                o++
              )
                if (62 !== e.src.charCodeAt(y++)) {
                  if (i) break;
                  for (v = !1, k = 0, b = _.length; k < b; k++)
                    if (_[k](e, o, t, !0)) {
                      v = !0;
                      break;
                    }
                  if (v) break;
                  l.push(e.bMarks[o]), a.push(e.tShift[o]), c.push(e.sCount[o]), (e.sCount[o] = -1);
                } else {
                  for (
                    32 === e.src.charCodeAt(y) && y++,
                      f = d = e.sCount[o] + y - (e.bMarks[o] + e.tShift[o]),
                      l.push(e.bMarks[o]),
                      e.bMarks[o] = y;
                    y < x && ((m = e.src.charCodeAt(y)), n(m));

                  )
                    9 === m ? (d += 4 - (d % 4)) : d++, y++;
                  (i = y >= x),
                    c.push(e.sCount[o]),
                    (e.sCount[o] = d - f),
                    a.push(e.tShift[o]),
                    (e.tShift[o] = y - e.bMarks[o]);
                }
              for (
                p = e.parentType,
                  e.parentType = 'blockquote',
                  g = e.push('blockquote_open', 'blockquote', 1),
                  g.markup = '>',
                  g.map = h = [r, 0],
                  e.md.block.tokenize(e, r, o),
                  g = e.push('blockquote_close', 'blockquote', -1),
                  g.markup = '>',
                  e.parentType = p,
                  h[1] = e.line,
                  k = 0;
                k < a.length;
                k++
              )
                (e.bMarks[k + r] = l[k]), (e.tShift[k + r] = a[k]), (e.sCount[k + r] = c[k]);
              return (e.blkIndent = u), !0;
            };
          },
          { '../common/utils': 4 },
        ],
        19: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e, r, t) {
              var n,
                s,
                o,
                i = 0;
              if (e.sCount[r] - e.blkIndent < 4) return !1;
              for (s = n = r + 1; n < t; )
                if (e.isEmpty(n)) {
                  if ((i++, i >= 2 && 'list' === e.parentType)) break;
                  n++;
                } else {
                  if (((i = 0), !(e.sCount[n] - e.blkIndent >= 4))) break;
                  n++, (s = n);
                }
              return (
                (e.line = s),
                (o = e.push('code_block', 'code', 0)),
                (o.content = e.getLines(r, s, 4 + e.blkIndent, !0)),
                (o.map = [r, e.line]),
                !0
              );
            };
          },
          {},
        ],
        20: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e, r, t, n) {
              var s,
                o,
                i,
                a,
                c,
                l,
                u,
                p = !1,
                h = e.bMarks[r] + e.tShift[r],
                f = e.eMarks[r];
              if (h + 3 > f) return !1;
              if (((s = e.src.charCodeAt(h)), 126 !== s && 96 !== s)) return !1;
              if (((c = h), (h = e.skipChars(h, s)), (o = h - c), o < 3)) return !1;
              if (((u = e.src.slice(c, h)), (i = e.src.slice(h, f)), i.indexOf('`') >= 0))
                return !1;
              if (n) return !0;
              for (
                a = r;
                (a++, !(a >= t)) &&
                ((h = c = e.bMarks[a] + e.tShift[a]),
                (f = e.eMarks[a]),
                !(h < f && e.sCount[a] < e.blkIndent));

              )
                if (
                  e.src.charCodeAt(h) === s &&
                  !(
                    e.sCount[a] - e.blkIndent >= 4 ||
                    ((h = e.skipChars(h, s)), h - c < o || ((h = e.skipSpaces(h)), h < f))
                  )
                ) {
                  p = !0;
                  break;
                }
              return (
                (o = e.sCount[r]),
                (e.line = a + (p ? 1 : 0)),
                (l = e.push('fence', 'code', 0)),
                (l.info = i),
                (l.content = e.getLines(r + 1, a, o, !0)),
                (l.markup = u),
                (l.map = [r, e.line]),
                !0
              );
            };
          },
          {},
        ],
        21: [
          function(e, r, t) {
            'use strict';
            var n = e('../common/utils').isSpace;
            r.exports = function(e, r, t, s) {
              var o,
                i,
                a,
                c,
                l = e.bMarks[r] + e.tShift[r],
                u = e.eMarks[r];
              if (((o = e.src.charCodeAt(l)), 35 !== o || l >= u)) return !1;
              for (i = 1, o = e.src.charCodeAt(++l); 35 === o && l < u && i <= 6; )
                i++, (o = e.src.charCodeAt(++l));
              return (
                !(i > 6 || (l < u && 32 !== o)) &&
                (!!s ||
                  ((u = e.skipSpacesBack(u, l)),
                  (a = e.skipCharsBack(u, 35, l)),
                  a > l && n(e.src.charCodeAt(a - 1)) && (u = a),
                  (e.line = r + 1),
                  (c = e.push('heading_open', 'h' + String(i), 1)),
                  (c.markup = '########'.slice(0, i)),
                  (c.map = [r, e.line]),
                  (c = e.push('inline', '', 0)),
                  (c.content = e.src.slice(l, u).trim()),
                  (c.map = [r, e.line]),
                  (c.children = []),
                  (c = e.push('heading_close', 'h' + String(i), -1)),
                  (c.markup = '########'.slice(0, i)),
                  !0))
              );
            };
          },
          { '../common/utils': 4 },
        ],
        22: [
          function(e, r, t) {
            'use strict';
            var n = e('../common/utils').isSpace;
            r.exports = function(e, r, t, s) {
              var o,
                i,
                a,
                c,
                l = e.bMarks[r] + e.tShift[r],
                u = e.eMarks[r];
              if (((o = e.src.charCodeAt(l++)), 42 !== o && 45 !== o && 95 !== o)) return !1;
              for (i = 1; l < u; ) {
                if (((a = e.src.charCodeAt(l++)), a !== o && !n(a))) return !1;
                a === o && i++;
              }
              return (
                !(i < 3) &&
                (!!s ||
                  ((e.line = r + 1),
                  (c = e.push('hr', 'hr', 0)),
                  (c.map = [r, e.line]),
                  (c.markup = Array(i + 1).join(String.fromCharCode(o))),
                  !0))
              );
            };
          },
          { '../common/utils': 4 },
        ],
        23: [
          function(e, r, t) {
            'use strict';
            var n = e('../common/html_blocks'),
              s = e('../common/html_re').HTML_OPEN_CLOSE_TAG_RE,
              o = [
                [/^<(script|pre|style)(?=(\s|>|$))/i, /<\/(script|pre|style)>/i, !0],
                [/^<!--/, /-->/, !0],
                [/^<\?/, /\?>/, !0],
                [/^<![A-Z]/, />/, !0],
                [/^<!\[CDATA\[/, /\]\]>/, !0],
                [new RegExp('^</?(' + n.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, !0],
                [new RegExp(s.source + '\\s*$'), /^$/, !1],
              ];
            r.exports = function(e, r, t, n) {
              var s,
                i,
                a,
                c,
                l = e.bMarks[r] + e.tShift[r],
                u = e.eMarks[r];
              if (!e.md.options.html) return !1;
              if (60 !== e.src.charCodeAt(l)) return !1;
              for (c = e.src.slice(l, u), s = 0; s < o.length && !o[s][0].test(c); s++);
              if (s === o.length) return !1;
              if (n) return o[s][2];
              if (((i = r + 1), !o[s][1].test(c)))
                for (; i < t && !(e.sCount[i] < e.blkIndent); i++)
                  if (
                    ((l = e.bMarks[i] + e.tShift[i]),
                    (u = e.eMarks[i]),
                    (c = e.src.slice(l, u)),
                    o[s][1].test(c))
                  ) {
                    0 !== c.length && i++;
                    break;
                  }
              return (
                (e.line = i),
                (a = e.push('html_block', '', 0)),
                (a.map = [r, i]),
                (a.content = e.getLines(r, i, e.blkIndent, !0)),
                !0
              );
            };
          },
          { '../common/html_blocks': 2, '../common/html_re': 3 },
        ],
        24: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e, r, t) {
              for (
                var n,
                  s,
                  o,
                  i,
                  a,
                  c,
                  l,
                  u,
                  p,
                  h = r + 1,
                  f = e.md.block.ruler.getRules('paragraph');
                h < t && !e.isEmpty(h);
                h++
              )
                if (!(e.sCount[h] - e.blkIndent > 3)) {
                  if (
                    e.sCount[h] >= e.blkIndent &&
                    ((c = e.bMarks[h] + e.tShift[h]),
                    (l = e.eMarks[h]),
                    c < l &&
                      ((p = e.src.charCodeAt(c)),
                      (45 === p || 61 === p) &&
                        ((c = e.skipChars(c, p)), (c = e.skipSpaces(c)), c >= l)))
                  ) {
                    u = 61 === p ? 1 : 2;
                    break;
                  }
                  if (!(e.sCount[h] < 0)) {
                    for (s = !1, o = 0, i = f.length; o < i; o++)
                      if (f[o](e, h, t, !0)) {
                        s = !0;
                        break;
                      }
                    if (s) break;
                  }
                }
              return (
                !!u &&
                ((n = e.getLines(r, h, e.blkIndent, !1).trim()),
                (e.line = h + 1),
                (a = e.push('heading_open', 'h' + String(u), 1)),
                (a.markup = String.fromCharCode(p)),
                (a.map = [r, e.line]),
                (a = e.push('inline', '', 0)),
                (a.content = n),
                (a.map = [r, e.line - 1]),
                (a.children = []),
                (a = e.push('heading_close', 'h' + String(u), -1)),
                (a.markup = String.fromCharCode(p)),
                !0)
              );
            };
          },
          {},
        ],
        25: [
          function(e, r, t) {
            'use strict';
            function n(e, r) {
              var t, n, s, o;
              return (
                (n = e.bMarks[r] + e.tShift[r]),
                (s = e.eMarks[r]),
                (t = e.src.charCodeAt(n++)),
                42 !== t && 45 !== t && 43 !== t
                  ? -1
                  : n < s && ((o = e.src.charCodeAt(n)), !i(o))
                  ? -1
                  : n
              );
            }
            function s(e, r) {
              var t,
                n = e.bMarks[r] + e.tShift[r],
                s = n,
                o = e.eMarks[r];
              if (s + 1 >= o) return -1;
              if (((t = e.src.charCodeAt(s++)), t < 48 || t > 57)) return -1;
              for (;;) {
                if (s >= o) return -1;
                t = e.src.charCodeAt(s++);
                {
                  if (!(t >= 48 && t <= 57)) {
                    if (41 === t || 46 === t) break;
                    return -1;
                  }
                  if (s - n >= 10) return -1;
                }
              }
              return s < o && ((t = e.src.charCodeAt(s)), !i(t)) ? -1 : s;
            }
            function o(e, r) {
              var t,
                n,
                s = e.level + 2;
              for (t = r + 2, n = e.tokens.length - 2; t < n; t++)
                e.tokens[t].level === s &&
                  'paragraph_open' === e.tokens[t].type &&
                  ((e.tokens[t + 2].hidden = !0), (e.tokens[t].hidden = !0), (t += 2));
            }
            var i = e('../common/utils').isSpace;
            r.exports = function(e, r, t, a) {
              var c,
                l,
                u,
                p,
                h,
                f,
                d,
                m,
                _,
                g,
                k,
                b,
                v,
                y,
                x,
                C,
                A,
                w,
                D,
                q,
                E,
                S,
                F,
                z,
                L,
                T,
                R,
                M,
                I = !0;
              if ((k = s(e, r)) >= 0) w = !0;
              else {
                if (!((k = n(e, r)) >= 0)) return !1;
                w = !1;
              }
              if (((A = e.src.charCodeAt(k - 1)), a)) return !0;
              for (
                q = e.tokens.length,
                  w
                    ? ((g = e.bMarks[r] + e.tShift[r]),
                      (C = Number(e.src.substr(g, k - g - 1))),
                      (L = e.push('ordered_list_open', 'ol', 1)),
                      1 !== C && (L.attrs = [['start', C]]))
                    : (L = e.push('bullet_list_open', 'ul', 1)),
                  L.map = S = [r, 0],
                  L.markup = String.fromCharCode(A),
                  c = r,
                  E = !1,
                  z = e.md.block.ruler.getRules('list');
                c < t;

              ) {
                for (
                  v = k, y = e.eMarks[c], l = u = e.sCount[c] + k - (e.bMarks[r] + e.tShift[r]);
                  v < y && ((b = e.src.charCodeAt(v)), i(b));

                )
                  9 === b ? (u += 4 - (u % 4)) : u++, v++;
                if (
                  ((D = v),
                  (x = D >= y ? 1 : u - l),
                  x > 4 && (x = 1),
                  (p = l + x),
                  (L = e.push('list_item_open', 'li', 1)),
                  (L.markup = String.fromCharCode(A)),
                  (L.map = F = [r, 0]),
                  (f = e.blkIndent),
                  (m = e.tight),
                  (h = e.tShift[r]),
                  (d = e.sCount[r]),
                  (_ = e.parentType),
                  (e.blkIndent = p),
                  (e.tight = !0),
                  (e.parentType = 'list'),
                  (e.tShift[r] = D - e.bMarks[r]),
                  (e.sCount[r] = u),
                  D >= y && e.isEmpty(r + 1)
                    ? (e.line = Math.min(e.line + 2, t))
                    : e.md.block.tokenize(e, r, t, !0),
                  (e.tight && !E) || (I = !1),
                  (E = e.line - r > 1 && e.isEmpty(e.line - 1)),
                  (e.blkIndent = f),
                  (e.tShift[r] = h),
                  (e.sCount[r] = d),
                  (e.tight = m),
                  (e.parentType = _),
                  (L = e.push('list_item_close', 'li', -1)),
                  (L.markup = String.fromCharCode(A)),
                  (c = r = e.line),
                  (F[1] = c),
                  (D = e.bMarks[r]),
                  c >= t)
                )
                  break;
                if (e.isEmpty(c)) break;
                if (e.sCount[c] < e.blkIndent) break;
                for (M = !1, T = 0, R = z.length; T < R; T++)
                  if (z[T](e, c, t, !0)) {
                    M = !0;
                    break;
                  }
                if (M) break;
                if (w) {
                  if (((k = s(e, c)), k < 0)) break;
                } else if (((k = n(e, c)), k < 0)) break;
                if (A !== e.src.charCodeAt(k - 1)) break;
              }
              return (
                (L = w
                  ? e.push('ordered_list_close', 'ol', -1)
                  : e.push('bullet_list_close', 'ul', -1)),
                (L.markup = String.fromCharCode(A)),
                (S[1] = c),
                (e.line = c),
                I && o(e, q),
                !0
              );
            };
          },
          { '../common/utils': 4 },
        ],
        26: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e, r) {
              for (
                var t,
                  n,
                  s,
                  o,
                  i,
                  a = r + 1,
                  c = e.md.block.ruler.getRules('paragraph'),
                  l = e.lineMax;
                a < l && !e.isEmpty(a);
                a++
              )
                if (!(e.sCount[a] - e.blkIndent > 3 || e.sCount[a] < 0)) {
                  for (n = !1, s = 0, o = c.length; s < o; s++)
                    if (c[s](e, a, l, !0)) {
                      n = !0;
                      break;
                    }
                  if (n) break;
                }
              return (
                (t = e.getLines(r, a, e.blkIndent, !1).trim()),
                (e.line = a),
                (i = e.push('paragraph_open', 'p', 1)),
                (i.map = [r, e.line]),
                (i = e.push('inline', '', 0)),
                (i.content = t),
                (i.map = [r, e.line]),
                (i.children = []),
                (i = e.push('paragraph_close', 'p', -1)),
                !0
              );
            };
          },
          {},
        ],
        27: [
          function(e, r, t) {
            'use strict';
            var n = e('../helpers/parse_link_destination'),
              s = e('../helpers/parse_link_title'),
              o = e('../common/utils').normalizeReference,
              i = e('../common/utils').isSpace;
            r.exports = function(e, r, t, a) {
              var c,
                l,
                u,
                p,
                h,
                f,
                d,
                m,
                _,
                g,
                k,
                b,
                v,
                y,
                x,
                C = 0,
                A = e.bMarks[r] + e.tShift[r],
                w = e.eMarks[r],
                D = r + 1;
              if (91 !== e.src.charCodeAt(A)) return !1;
              for (; ++A < w; )
                if (93 === e.src.charCodeAt(A) && 92 !== e.src.charCodeAt(A - 1)) {
                  if (A + 1 === w) return !1;
                  if (58 !== e.src.charCodeAt(A + 1)) return !1;
                  break;
                }
              for (
                p = e.lineMax, y = e.md.block.ruler.getRules('reference');
                D < p && !e.isEmpty(D);
                D++
              )
                if (!(e.sCount[D] - e.blkIndent > 3 || e.sCount[D] < 0)) {
                  for (v = !1, f = 0, d = y.length; f < d; f++)
                    if (y[f](e, D, p, !0)) {
                      v = !0;
                      break;
                    }
                  if (v) break;
                }
              for (b = e.getLines(r, D, e.blkIndent, !1).trim(), w = b.length, A = 1; A < w; A++) {
                if (((c = b.charCodeAt(A)), 91 === c)) return !1;
                if (93 === c) {
                  _ = A;
                  break;
                }
                10 === c ? C++ : 92 === c && (A++, A < w && 10 === b.charCodeAt(A) && C++);
              }
              if (_ < 0 || 58 !== b.charCodeAt(_ + 1)) return !1;
              for (A = _ + 2; A < w; A++)
                if (((c = b.charCodeAt(A)), 10 === c)) C++;
                else if (!i(c)) break;
              if (((g = n(b, A, w)), !g.ok)) return !1;
              if (((h = e.md.normalizeLink(g.str)), !e.md.validateLink(h))) return !1;
              for (A = g.pos, C += g.lines, l = A, u = C, k = A; A < w; A++)
                if (((c = b.charCodeAt(A)), 10 === c)) C++;
                else if (!i(c)) break;
              for (
                g = s(b, A, w),
                  A < w && k !== A && g.ok
                    ? ((x = g.str), (A = g.pos), (C += g.lines))
                    : ((x = ''), (A = l), (C = u));
                A < w && ((c = b.charCodeAt(A)), i(c));

              )
                A++;
              if (A < w && 10 !== b.charCodeAt(A) && x)
                for (x = '', A = l, C = u; A < w && ((c = b.charCodeAt(A)), i(c)); ) A++;
              return (
                !(A < w && 10 !== b.charCodeAt(A)) &&
                !!(m = o(b.slice(1, _))) &&
                (!!a ||
                  ('undefined' == typeof e.env.references && (e.env.references = {}),
                  'undefined' == typeof e.env.references[m] &&
                    (e.env.references[m] = { title: x, href: h }),
                  (e.line = r + C + 1),
                  !0))
              );
            };
          },
          {
            '../common/utils': 4,
            '../helpers/parse_link_destination': 6,
            '../helpers/parse_link_title': 8,
          },
        ],
        28: [
          function(e, r, t) {
            'use strict';
            function n(e, r, t, n) {
              var s, i, a, c, l, u, p, h;
              for (
                this.src = e,
                  this.md = r,
                  this.env = t,
                  this.tokens = n,
                  this.bMarks = [],
                  this.eMarks = [],
                  this.tShift = [],
                  this.sCount = [],
                  this.blkIndent = 0,
                  this.line = 0,
                  this.lineMax = 0,
                  this.tight = !1,
                  this.parentType = 'root',
                  this.ddIndent = -1,
                  this.level = 0,
                  this.result = '',
                  i = this.src,
                  h = !1,
                  a = c = u = p = 0,
                  l = i.length;
                c < l;
                c++
              ) {
                if (((s = i.charCodeAt(c)), !h)) {
                  if (o(s)) {
                    u++, 9 === s ? (p += 4 - (p % 4)) : p++;
                    continue;
                  }
                  h = !0;
                }
                (10 !== s && c !== l - 1) ||
                  (10 !== s && c++,
                  this.bMarks.push(a),
                  this.eMarks.push(c),
                  this.tShift.push(u),
                  this.sCount.push(p),
                  (h = !1),
                  (u = 0),
                  (p = 0),
                  (a = c + 1));
              }
              this.bMarks.push(i.length),
                this.eMarks.push(i.length),
                this.tShift.push(0),
                this.sCount.push(0),
                (this.lineMax = this.bMarks.length - 1);
            }
            var s = e('../token'),
              o = e('../common/utils').isSpace;
            (n.prototype.push = function(e, r, t) {
              var n = new s(e, r, t);
              return (
                (n.block = !0),
                t < 0 && this.level--,
                (n.level = this.level),
                t > 0 && this.level++,
                this.tokens.push(n),
                n
              );
            }),
              (n.prototype.isEmpty = function(e) {
                return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
              }),
              (n.prototype.skipEmptyLines = function(e) {
                for (
                  var r = this.lineMax;
                  e < r && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]);
                  e++
                );
                return e;
              }),
              (n.prototype.skipSpaces = function(e) {
                for (
                  var r, t = this.src.length;
                  e < t && ((r = this.src.charCodeAt(e)), o(r));
                  e++
                );
                return e;
              }),
              (n.prototype.skipSpacesBack = function(e, r) {
                if (e <= r) return e;
                for (; e > r; ) if (!o(this.src.charCodeAt(--e))) return e + 1;
                return e;
              }),
              (n.prototype.skipChars = function(e, r) {
                for (var t = this.src.length; e < t && this.src.charCodeAt(e) === r; e++);
                return e;
              }),
              (n.prototype.skipCharsBack = function(e, r, t) {
                if (e <= t) return e;
                for (; e > t; ) if (r !== this.src.charCodeAt(--e)) return e + 1;
                return e;
              }),
              (n.prototype.getLines = function(e, r, t, n) {
                var s,
                  i,
                  a,
                  c,
                  l,
                  u,
                  p,
                  h = e;
                if (e >= r) return '';
                for (u = new Array(r - e), s = 0; h < r; h++, s++) {
                  for (
                    i = 0,
                      p = c = this.bMarks[h],
                      l = h + 1 < r || n ? this.eMarks[h] + 1 : this.eMarks[h];
                    c < l && i < t;

                  ) {
                    if (((a = this.src.charCodeAt(c)), o(a))) 9 === a ? (i += 4 - (i % 4)) : i++;
                    else {
                      if (!(c - p < this.tShift[h])) break;
                      i++;
                    }
                    c++;
                  }
                  u[s] = this.src.slice(c, l);
                }
                return u.join('');
              }),
              (n.prototype.Token = s),
              (r.exports = n);
          },
          { '../common/utils': 4, '../token': 51 },
        ],
        29: [
          function(e, r, t) {
            'use strict';
            function n(e, r) {
              var t = e.bMarks[r] + e.blkIndent,
                n = e.eMarks[r];
              return e.src.substr(t, n - t);
            }
            function s(e) {
              var r,
                t = [],
                n = 0,
                s = e.length,
                o = 0,
                i = 0,
                a = !1,
                c = 0;
              for (r = e.charCodeAt(n); n < s; )
                96 === r && o % 2 === 0
                  ? ((a = !a), (c = n))
                  : 124 !== r || o % 2 !== 0 || a
                  ? 92 === r
                    ? o++
                    : (o = 0)
                  : (t.push(e.substring(i, n)), (i = n + 1)),
                  n++,
                  n === s && a && ((a = !1), (n = c + 1)),
                  (r = e.charCodeAt(n));
              return t.push(e.substring(i)), t;
            }
            r.exports = function(e, r, t, o) {
              var i, a, c, l, u, p, h, f, d, m, _, g;
              if (r + 2 > t) return !1;
              if (((u = r + 1), e.sCount[u] < e.blkIndent)) return !1;
              if (((c = e.bMarks[u] + e.tShift[u]), c >= e.eMarks[u])) return !1;
              if (((i = e.src.charCodeAt(c)), 124 !== i && 45 !== i && 58 !== i)) return !1;
              if (((a = n(e, r + 1)), !/^[-:| ]+$/.test(a))) return !1;
              for (p = a.split('|'), d = [], l = 0; l < p.length; l++) {
                if (((m = p[l].trim()), !m)) {
                  if (0 === l || l === p.length - 1) continue;
                  return !1;
                }
                if (!/^:?-+:?$/.test(m)) return !1;
                58 === m.charCodeAt(m.length - 1)
                  ? d.push(58 === m.charCodeAt(0) ? 'center' : 'right')
                  : 58 === m.charCodeAt(0)
                  ? d.push('left')
                  : d.push('');
              }
              if (((a = n(e, r).trim()), a.indexOf('|') === -1)) return !1;
              if (((p = s(a.replace(/^\||\|$/g, ''))), (h = p.length), h > d.length)) return !1;
              if (o) return !0;
              for (
                f = e.push('table_open', 'table', 1),
                  f.map = _ = [r, 0],
                  f = e.push('thead_open', 'thead', 1),
                  f.map = [r, r + 1],
                  f = e.push('tr_open', 'tr', 1),
                  f.map = [r, r + 1],
                  l = 0;
                l < p.length;
                l++
              )
                (f = e.push('th_open', 'th', 1)),
                  (f.map = [r, r + 1]),
                  d[l] && (f.attrs = [['style', 'text-align:' + d[l]]]),
                  (f = e.push('inline', '', 0)),
                  (f.content = p[l].trim()),
                  (f.map = [r, r + 1]),
                  (f.children = []),
                  (f = e.push('th_close', 'th', -1));
              for (
                f = e.push('tr_close', 'tr', -1),
                  f = e.push('thead_close', 'thead', -1),
                  f = e.push('tbody_open', 'tbody', 1),
                  f.map = g = [r + 2, 0],
                  u = r + 2;
                u < t && !(e.sCount[u] < e.blkIndent) && ((a = n(e, u)), a.indexOf('|') !== -1);
                u++
              ) {
                for (
                  p = s(a.replace(/^\||\|\s*$/g, '')), f = e.push('tr_open', 'tr', 1), l = 0;
                  l < h;
                  l++
                )
                  (f = e.push('td_open', 'td', 1)),
                    d[l] && (f.attrs = [['style', 'text-align:' + d[l]]]),
                    (f = e.push('inline', '', 0)),
                    (f.content = p[l] ? p[l].trim() : ''),
                    (f.children = []),
                    (f = e.push('td_close', 'td', -1));
                f = e.push('tr_close', 'tr', -1);
              }
              return (
                (f = e.push('tbody_close', 'tbody', -1)),
                (f = e.push('table_close', 'table', -1)),
                (_[1] = g[1] = u),
                (e.line = u),
                !0
              );
            };
          },
          {},
        ],
        30: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e) {
              var r;
              e.inlineMode
                ? ((r = new e.Token('inline', '', 0)),
                  (r.content = e.src),
                  (r.map = [0, 1]),
                  (r.children = []),
                  e.tokens.push(r))
                : e.md.block.parse(e.src, e.md, e.env, e.tokens);
            };
          },
          {},
        ],
        31: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e) {
              var r,
                t,
                n,
                s = e.tokens;
              for (t = 0, n = s.length; t < n; t++)
                (r = s[t]),
                  'inline' === r.type && e.md.inline.parse(r.content, e.md, e.env, r.children);
            };
          },
          {},
        ],
        32: [
          function(e, r, t) {
            'use strict';
            function n(e) {
              return /^<a[>\s]/i.test(e);
            }
            function s(e) {
              return /^<\/a\s*>/i.test(e);
            }
            var o = e('../common/utils').arrayReplaceAt;
            r.exports = function(e) {
              var r,
                t,
                i,
                a,
                c,
                l,
                u,
                p,
                h,
                f,
                d,
                m,
                _,
                g,
                k,
                b,
                v,
                y = e.tokens;
              if (e.md.options.linkify)
                for (t = 0, i = y.length; t < i; t++)
                  if ('inline' === y[t].type && e.md.linkify.pretest(y[t].content))
                    for (a = y[t].children, _ = 0, r = a.length - 1; r >= 0; r--)
                      if (((l = a[r]), 'link_close' !== l.type)) {
                        if (
                          ('html_inline' === l.type &&
                            (n(l.content) && _ > 0 && _--, s(l.content) && _++),
                          !(_ > 0) && 'text' === l.type && e.md.linkify.test(l.content))
                        ) {
                          for (
                            h = l.content,
                              v = e.md.linkify.match(h),
                              u = [],
                              m = l.level,
                              d = 0,
                              p = 0;
                            p < v.length;
                            p++
                          )
                            (g = v[p].url),
                              (k = e.md.normalizeLink(g)),
                              e.md.validateLink(k) &&
                                ((b = v[p].text),
                                (b = v[p].schema
                                  ? 'mailto:' !== v[p].schema || /^mailto:/i.test(b)
                                    ? e.md.normalizeLinkText(b)
                                    : e.md.normalizeLinkText('mailto:' + b).replace(/^mailto:/, '')
                                  : e.md
                                      .normalizeLinkText('http://' + b)
                                      .replace(/^http:\/\//, '')),
                                (f = v[p].index),
                                f > d &&
                                  ((c = new e.Token('text', '', 0)),
                                  (c.content = h.slice(d, f)),
                                  (c.level = m),
                                  u.push(c)),
                                (c = new e.Token('link_open', 'a', 1)),
                                (c.attrs = [['href', k]]),
                                (c.level = m++),
                                (c.markup = 'linkify'),
                                (c.info = 'auto'),
                                u.push(c),
                                (c = new e.Token('text', '', 0)),
                                (c.content = b),
                                (c.level = m),
                                u.push(c),
                                (c = new e.Token('link_close', 'a', -1)),
                                (c.level = --m),
                                (c.markup = 'linkify'),
                                (c.info = 'auto'),
                                u.push(c),
                                (d = v[p].lastIndex));
                          d < h.length &&
                            ((c = new e.Token('text', '', 0)),
                            (c.content = h.slice(d)),
                            (c.level = m),
                            u.push(c)),
                            (y[t].children = a = o(a, r, u));
                        }
                      } else for (r--; a[r].level !== l.level && 'link_open' !== a[r].type; ) r--;
            };
          },
          { '../common/utils': 4 },
        ],
        33: [
          function(e, r, t) {
            'use strict';
            var n = /\r[\n\u0085]?|[\u2424\u2028\u0085]/g,
              s = /\u0000/g;
            r.exports = function(e) {
              var r;
              (r = e.src.replace(n, '\n')), (r = r.replace(s, '\ufffd')), (e.src = r);
            };
          },
          {},
        ],
        34: [
          function(e, r, t) {
            'use strict';
            function n(e, r) {
              return l[r.toLowerCase()];
            }
            function s(e) {
              var r,
                t,
                s = 0;
              for (r = e.length - 1; r >= 0; r--)
                (t = e[r]),
                  'text' !== t.type || s || (t.content = t.content.replace(c, n)),
                  'link_open' === t.type && 'auto' === t.info && s--,
                  'link_close' === t.type && 'auto' === t.info && s++;
            }
            function o(e) {
              var r,
                t,
                n = 0;
              for (r = e.length - 1; r >= 0; r--)
                (t = e[r]),
                  'text' !== t.type ||
                    n ||
                    (i.test(t.content) &&
                      (t.content = t.content
                        .replace(/\+-/g, '\xb1')
                        .replace(/\.{2,}/g, '\u2026')
                        .replace(/([?!])\u2026/g, '$1..')
                        .replace(/([?!]){4,}/g, '$1$1$1')
                        .replace(/,{2,}/g, ',')
                        .replace(/(^|[^-])---([^-]|$)/gm, '$1\u2014$2')
                        .replace(/(^|\s)--(\s|$)/gm, '$1\u2013$2')
                        .replace(/(^|[^-\s])--([^-\s]|$)/gm, '$1\u2013$2'))),
                  'link_open' === t.type && 'auto' === t.info && n--,
                  'link_close' === t.type && 'auto' === t.info && n++;
            }
            var i = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/,
              a = /\((c|tm|r|p)\)/i,
              c = /\((c|tm|r|p)\)/gi,
              l = { c: '\xa9', r: '\xae', p: '\xa7', tm: '\u2122' };
            r.exports = function(e) {
              var r;
              if (e.md.options.typographer)
                for (r = e.tokens.length - 1; r >= 0; r--)
                  'inline' === e.tokens[r].type &&
                    (a.test(e.tokens[r].content) && s(e.tokens[r].children),
                    i.test(e.tokens[r].content) && o(e.tokens[r].children));
            };
          },
          {},
        ],
        35: [
          function(e, r, t) {
            'use strict';
            function n(e, r, t) {
              return e.substr(0, r) + t + e.substr(r + 1);
            }
            function s(e, r) {
              var t, s, c, p, h, f, d, m, _, g, k, b, v, y, x, C, A, w, D, q, E;
              for (D = [], t = 0; t < e.length; t++) {
                for (s = e[t], d = e[t].level, A = D.length - 1; A >= 0 && !(D[A].level <= d); A--);
                if (((D.length = A + 1), 'text' === s.type)) {
                  (c = s.content), (h = 0), (f = c.length);
                  e: for (; h < f && ((l.lastIndex = h), (p = l.exec(c))); ) {
                    if (
                      ((x = C = !0),
                      (h = p.index + 1),
                      (w = "'" === p[0]),
                      (_ = 32),
                      p.index - 1 >= 0)
                    )
                      _ = c.charCodeAt(p.index - 1);
                    else
                      for (A = t - 1; A >= 0; A--)
                        if ('text' === e[A].type) {
                          _ = e[A].content.charCodeAt(e[A].content.length - 1);
                          break;
                        }
                    if (((g = 32), h < f)) g = c.charCodeAt(h);
                    else
                      for (A = t + 1; A < e.length; A++)
                        if ('text' === e[A].type) {
                          g = e[A].content.charCodeAt(0);
                          break;
                        }
                    if (
                      ((k = a(_) || i(String.fromCharCode(_))),
                      (b = a(g) || i(String.fromCharCode(g))),
                      (v = o(_)),
                      (y = o(g)),
                      y ? (x = !1) : b && (v || k || (x = !1)),
                      v ? (C = !1) : k && (y || b || (C = !1)),
                      34 === g && '"' === p[0] && _ >= 48 && _ <= 57 && (C = x = !1),
                      x && C && ((x = !1), (C = b)),
                      x || C)
                    ) {
                      if (C)
                        for (A = D.length - 1; A >= 0 && ((m = D[A]), !(D[A].level < d)); A--)
                          if (m.single === w && D[A].level === d) {
                            (m = D[A]),
                              w
                                ? ((q = r.md.options.quotes[2]), (E = r.md.options.quotes[3]))
                                : ((q = r.md.options.quotes[0]), (E = r.md.options.quotes[1])),
                              (s.content = n(s.content, p.index, E)),
                              (e[m.token].content = n(e[m.token].content, m.pos, q)),
                              (h += E.length - 1),
                              m.token === t && (h += q.length - 1),
                              (c = s.content),
                              (f = c.length),
                              (D.length = A);
                            continue e;
                          }
                      x
                        ? D.push({ token: t, pos: p.index, single: w, level: d })
                        : C && w && (s.content = n(s.content, p.index, u));
                    } else w && (s.content = n(s.content, p.index, u));
                  }
                }
              }
            }
            var o = e('../common/utils').isWhiteSpace,
              i = e('../common/utils').isPunctChar,
              a = e('../common/utils').isMdAsciiPunct,
              c = /['"]/,
              l = /['"]/g,
              u = '\u2019';
            r.exports = function(e) {
              var r;
              if (e.md.options.typographer)
                for (r = e.tokens.length - 1; r >= 0; r--)
                  'inline' === e.tokens[r].type &&
                    c.test(e.tokens[r].content) &&
                    s(e.tokens[r].children, e);
            };
          },
          { '../common/utils': 4 },
        ],
        36: [
          function(e, r, t) {
            'use strict';
            function n(e, r, t) {
              (this.src = e),
                (this.env = t),
                (this.tokens = []),
                (this.inlineMode = !1),
                (this.md = r);
            }
            var s = e('../token');
            (n.prototype.Token = s), (r.exports = n);
          },
          { '../token': 51 },
        ],
        37: [
          function(e, r, t) {
            'use strict';
            var n = /^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/,
              s = /^<([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)>/;
            r.exports = function(e, r) {
              var t,
                o,
                i,
                a,
                c,
                l,
                u = e.pos;
              return (
                60 === e.src.charCodeAt(u) &&
                ((t = e.src.slice(u)),
                !(t.indexOf('>') < 0) &&
                  (s.test(t)
                    ? ((o = t.match(s)),
                      (a = o[0].slice(1, -1)),
                      (c = e.md.normalizeLink(a)),
                      !!e.md.validateLink(c) &&
                        (r ||
                          ((l = e.push('link_open', 'a', 1)),
                          (l.attrs = [['href', c]]),
                          (l.markup = 'autolink'),
                          (l.info = 'auto'),
                          (l = e.push('text', '', 0)),
                          (l.content = e.md.normalizeLinkText(a)),
                          (l = e.push('link_close', 'a', -1)),
                          (l.markup = 'autolink'),
                          (l.info = 'auto')),
                        (e.pos += o[0].length),
                        !0))
                    : !!n.test(t) &&
                      ((i = t.match(n)),
                      (a = i[0].slice(1, -1)),
                      (c = e.md.normalizeLink('mailto:' + a)),
                      !!e.md.validateLink(c) &&
                        (r ||
                          ((l = e.push('link_open', 'a', 1)),
                          (l.attrs = [['href', c]]),
                          (l.markup = 'autolink'),
                          (l.info = 'auto'),
                          (l = e.push('text', '', 0)),
                          (l.content = e.md.normalizeLinkText(a)),
                          (l = e.push('link_close', 'a', -1)),
                          (l.markup = 'autolink'),
                          (l.info = 'auto')),
                        (e.pos += i[0].length),
                        !0))))
              );
            };
          },
          {},
        ],
        38: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e, r) {
              var t,
                n,
                s,
                o,
                i,
                a,
                c = e.pos,
                l = e.src.charCodeAt(c);
              if (96 !== l) return !1;
              for (t = c, c++, n = e.posMax; c < n && 96 === e.src.charCodeAt(c); ) c++;
              for (s = e.src.slice(t, c), o = i = c; (o = e.src.indexOf('`', i)) !== -1; ) {
                for (i = o + 1; i < n && 96 === e.src.charCodeAt(i); ) i++;
                if (i - o === s.length)
                  return (
                    r ||
                      ((a = e.push('code_inline', 'code', 0)),
                      (a.markup = s),
                      (a.content = e.src
                        .slice(c, o)
                        .replace(/[ \n]+/g, ' ')
                        .trim())),
                    (e.pos = i),
                    !0
                  );
              }
              return r || (e.pending += s), (e.pos += s.length), !0;
            };
          },
          {},
        ],
        39: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e) {
              var r,
                t,
                n,
                s,
                o = e.delimiters,
                i = e.delimiters.length;
              for (r = 0; r < i; r++)
                if (((n = o[r]), n.close))
                  for (t = r - n.jump - 1; t >= 0; ) {
                    if (
                      ((s = o[t]),
                      s.open && s.marker === n.marker && s.end < 0 && s.level === n.level)
                    ) {
                      (n.jump = r - t), (n.open = !1), (s.end = r), (s.jump = 0);
                      break;
                    }
                    t -= s.jump + 1;
                  }
            };
          },
          {},
        ],
        40: [
          function(e, r, t) {
            'use strict';
            (r.exports.tokenize = function(e, r) {
              var t,
                n,
                s,
                o = e.pos,
                i = e.src.charCodeAt(o);
              if (r) return !1;
              if (95 !== i && 42 !== i) return !1;
              for (n = e.scanDelims(e.pos, 42 === i), t = 0; t < n.length; t++)
                (s = e.push('text', '', 0)),
                  (s.content = String.fromCharCode(i)),
                  e.delimiters.push({
                    marker: i,
                    jump: t,
                    token: e.tokens.length - 1,
                    level: e.level,
                    end: -1,
                    open: n.can_open,
                    close: n.can_close,
                  });
              return (e.pos += n.length), !0;
            }),
              (r.exports.postProcess = function(e) {
                var r,
                  t,
                  n,
                  s,
                  o,
                  i,
                  a = e.delimiters,
                  c = e.delimiters.length;
                for (r = 0; r < c; r++)
                  (t = a[r]),
                    (95 !== t.marker && 42 !== t.marker) ||
                      (t.end !== -1 &&
                        ((n = a[t.end]),
                        (i =
                          r + 1 < c &&
                          a[r + 1].end === t.end - 1 &&
                          a[r + 1].token === t.token + 1 &&
                          a[t.end - 1].token === n.token - 1 &&
                          a[r + 1].marker === t.marker),
                        (o = String.fromCharCode(t.marker)),
                        (s = e.tokens[t.token]),
                        (s.type = i ? 'strong_open' : 'em_open'),
                        (s.tag = i ? 'strong' : 'em'),
                        (s.nesting = 1),
                        (s.markup = i ? o + o : o),
                        (s.content = ''),
                        (s = e.tokens[n.token]),
                        (s.type = i ? 'strong_close' : 'em_close'),
                        (s.tag = i ? 'strong' : 'em'),
                        (s.nesting = -1),
                        (s.markup = i ? o + o : o),
                        (s.content = ''),
                        i &&
                          ((e.tokens[a[r + 1].token].content = ''),
                          (e.tokens[a[t.end - 1].token].content = ''),
                          r++)));
              });
          },
          {},
        ],
        41: [
          function(e, r, t) {
            'use strict';
            var n = e('../common/entities'),
              s = e('../common/utils').has,
              o = e('../common/utils').isValidEntityCode,
              i = e('../common/utils').fromCodePoint,
              a = /^&#((?:x[a-f0-9]{1,8}|[0-9]{1,8}));/i,
              c = /^&([a-z][a-z0-9]{1,31});/i;
            r.exports = function(e, r) {
              var t,
                l,
                u,
                p = e.pos,
                h = e.posMax;
              if (38 !== e.src.charCodeAt(p)) return !1;
              if (p + 1 < h)
                if (((t = e.src.charCodeAt(p + 1)), 35 === t)) {
                  if ((u = e.src.slice(p).match(a)))
                    return (
                      r ||
                        ((l =
                          'x' === u[1][0].toLowerCase()
                            ? parseInt(u[1].slice(1), 16)
                            : parseInt(u[1], 10)),
                        (e.pending += i(o(l) ? l : 65533))),
                      (e.pos += u[0].length),
                      !0
                    );
                } else if (((u = e.src.slice(p).match(c)), u && s(n, u[1])))
                  return r || (e.pending += n[u[1]]), (e.pos += u[0].length), !0;
              return r || (e.pending += '&'), e.pos++, !0;
            };
          },
          { '../common/entities': 1, '../common/utils': 4 },
        ],
        42: [
          function(e, r, t) {
            'use strict';
            for (var n = e('../common/utils').isSpace, s = [], o = 0; o < 256; o++) s.push(0);
            '\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'.split('').forEach(function(e) {
              s[e.charCodeAt(0)] = 1;
            }),
              (r.exports = function(e, r) {
                var t,
                  o = e.pos,
                  i = e.posMax;
                if (92 !== e.src.charCodeAt(o)) return !1;
                if ((o++, o < i)) {
                  if (((t = e.src.charCodeAt(o)), t < 256 && 0 !== s[t]))
                    return r || (e.pending += e.src[o]), (e.pos += 2), !0;
                  if (10 === t) {
                    for (
                      r || e.push('hardbreak', 'br', 0), o++;
                      o < i && ((t = e.src.charCodeAt(o)), n(t));

                    )
                      o++;
                    return (e.pos = o), !0;
                  }
                }
                return r || (e.pending += '\\'), e.pos++, !0;
              });
          },
          { '../common/utils': 4 },
        ],
        43: [
          function(e, r, t) {
            'use strict';
            function n(e) {
              var r = 32 | e;
              return r >= 97 && r <= 122;
            }
            var s = e('../common/html_re').HTML_TAG_RE;
            r.exports = function(e, r) {
              var t,
                o,
                i,
                a,
                c = e.pos;
              return (
                !!e.md.options.html &&
                ((i = e.posMax),
                !(60 !== e.src.charCodeAt(c) || c + 2 >= i) &&
                  ((t = e.src.charCodeAt(c + 1)),
                  !(33 !== t && 63 !== t && 47 !== t && !n(t)) &&
                    !!(o = e.src.slice(c).match(s)) &&
                    (r ||
                      ((a = e.push('html_inline', '', 0)),
                      (a.content = e.src.slice(c, c + o[0].length))),
                    (e.pos += o[0].length),
                    !0)))
              );
            };
          },
          { '../common/html_re': 3 },
        ],
        44: [
          function(e, r, t) {
            'use strict';
            var n = e('../helpers/parse_link_label'),
              s = e('../helpers/parse_link_destination'),
              o = e('../helpers/parse_link_title'),
              i = e('../common/utils').normalizeReference,
              a = e('../common/utils').isSpace;
            r.exports = function(e, r) {
              var t,
                c,
                l,
                u,
                p,
                h,
                f,
                d,
                m,
                _,
                g,
                k,
                b,
                v = '',
                y = e.pos,
                x = e.posMax;
              if (33 !== e.src.charCodeAt(e.pos)) return !1;
              if (91 !== e.src.charCodeAt(e.pos + 1)) return !1;
              if (((h = e.pos + 2), (p = n(e, e.pos + 1, !1)), p < 0)) return !1;
              if (((f = p + 1), f < x && 40 === e.src.charCodeAt(f))) {
                for (f++; f < x && ((c = e.src.charCodeAt(f)), a(c) || 10 === c); f++);
                if (f >= x) return !1;
                for (
                  b = f,
                    m = s(e.src, f, e.posMax),
                    m.ok &&
                      ((v = e.md.normalizeLink(m.str)),
                      e.md.validateLink(v) ? (f = m.pos) : (v = '')),
                    b = f;
                  f < x && ((c = e.src.charCodeAt(f)), a(c) || 10 === c);
                  f++
                );
                if (((m = o(e.src, f, e.posMax)), f < x && b !== f && m.ok))
                  for (
                    _ = m.str, f = m.pos;
                    f < x && ((c = e.src.charCodeAt(f)), a(c) || 10 === c);
                    f++
                  );
                else _ = '';
                if (f >= x || 41 !== e.src.charCodeAt(f)) return (e.pos = y), !1;
                f++;
              } else {
                if ('undefined' == typeof e.env.references) return !1;
                if (
                  (f < x && 91 === e.src.charCodeAt(f)
                    ? ((b = f + 1), (f = n(e, f)), f >= 0 ? (u = e.src.slice(b, f++)) : (f = p + 1))
                    : (f = p + 1),
                  u || (u = e.src.slice(h, p)),
                  (d = e.env.references[i(u)]),
                  !d)
                )
                  return (e.pos = y), !1;
                (v = d.href), (_ = d.title);
              }
              return (
                r ||
                  ((l = e.src.slice(h, p)),
                  e.md.inline.parse(l, e.md, e.env, (k = [])),
                  (g = e.push('image', 'img', 0)),
                  (g.attrs = t = [
                    ['src', v],
                    ['alt', ''],
                  ]),
                  (g.children = k),
                  (g.content = l),
                  _ && t.push(['title', _])),
                (e.pos = f),
                (e.posMax = x),
                !0
              );
            };
          },
          {
            '../common/utils': 4,
            '../helpers/parse_link_destination': 6,
            '../helpers/parse_link_label': 7,
            '../helpers/parse_link_title': 8,
          },
        ],
        45: [
          function(e, r, t) {
            'use strict';
            var n = e('../helpers/parse_link_label'),
              s = e('../helpers/parse_link_destination'),
              o = e('../helpers/parse_link_title'),
              i = e('../common/utils').normalizeReference,
              a = e('../common/utils').isSpace;
            r.exports = function(e, r) {
              var t,
                c,
                l,
                u,
                p,
                h,
                f,
                d,
                m,
                _,
                g = '',
                k = e.pos,
                b = e.posMax,
                v = e.pos;
              if (91 !== e.src.charCodeAt(e.pos)) return !1;
              if (((p = e.pos + 1), (u = n(e, e.pos, !0)), u < 0)) return !1;
              if (((h = u + 1), h < b && 40 === e.src.charCodeAt(h))) {
                for (h++; h < b && ((c = e.src.charCodeAt(h)), a(c) || 10 === c); h++);
                if (h >= b) return !1;
                for (
                  v = h,
                    f = s(e.src, h, e.posMax),
                    f.ok &&
                      ((g = e.md.normalizeLink(f.str)),
                      e.md.validateLink(g) ? (h = f.pos) : (g = '')),
                    v = h;
                  h < b && ((c = e.src.charCodeAt(h)), a(c) || 10 === c);
                  h++
                );
                if (((f = o(e.src, h, e.posMax)), h < b && v !== h && f.ok))
                  for (
                    m = f.str, h = f.pos;
                    h < b && ((c = e.src.charCodeAt(h)), a(c) || 10 === c);
                    h++
                  );
                else m = '';
                if (h >= b || 41 !== e.src.charCodeAt(h)) return (e.pos = k), !1;
                h++;
              } else {
                if ('undefined' == typeof e.env.references) return !1;
                if (
                  (h < b && 91 === e.src.charCodeAt(h)
                    ? ((v = h + 1), (h = n(e, h)), h >= 0 ? (l = e.src.slice(v, h++)) : (h = u + 1))
                    : (h = u + 1),
                  l || (l = e.src.slice(p, u)),
                  (d = e.env.references[i(l)]),
                  !d)
                )
                  return (e.pos = k), !1;
                (g = d.href), (m = d.title);
              }
              return (
                r ||
                  ((e.pos = p),
                  (e.posMax = u),
                  (_ = e.push('link_open', 'a', 1)),
                  (_.attrs = t = [['href', g]]),
                  m && t.push(['title', m]),
                  e.md.inline.tokenize(e),
                  (_ = e.push('link_close', 'a', -1))),
                (e.pos = h),
                (e.posMax = b),
                !0
              );
            };
          },
          {
            '../common/utils': 4,
            '../helpers/parse_link_destination': 6,
            '../helpers/parse_link_label': 7,
            '../helpers/parse_link_title': 8,
          },
        ],
        46: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e, r) {
              var t,
                n,
                s = e.pos;
              if (10 !== e.src.charCodeAt(s)) return !1;
              for (
                t = e.pending.length - 1,
                  n = e.posMax,
                  r ||
                    (t >= 0 && 32 === e.pending.charCodeAt(t)
                      ? t >= 1 && 32 === e.pending.charCodeAt(t - 1)
                        ? ((e.pending = e.pending.replace(/ +$/, '')), e.push('hardbreak', 'br', 0))
                        : ((e.pending = e.pending.slice(0, -1)), e.push('softbreak', 'br', 0))
                      : e.push('softbreak', 'br', 0)),
                  s++;
                s < n && 32 === e.src.charCodeAt(s);

              )
                s++;
              return (e.pos = s), !0;
            };
          },
          {},
        ],
        47: [
          function(e, r, t) {
            'use strict';
            function n(e, r, t, n) {
              (this.src = e),
                (this.env = t),
                (this.md = r),
                (this.tokens = n),
                (this.pos = 0),
                (this.posMax = this.src.length),
                (this.level = 0),
                (this.pending = ''),
                (this.pendingLevel = 0),
                (this.cache = {}),
                (this.delimiters = []);
            }
            var s = e('../token'),
              o = e('../common/utils').isWhiteSpace,
              i = e('../common/utils').isPunctChar,
              a = e('../common/utils').isMdAsciiPunct;
            (n.prototype.pushPending = function() {
              var e = new s('text', '', 0);
              return (
                (e.content = this.pending),
                (e.level = this.pendingLevel),
                this.tokens.push(e),
                (this.pending = ''),
                e
              );
            }),
              (n.prototype.push = function(e, r, t) {
                this.pending && this.pushPending();
                var n = new s(e, r, t);
                return (
                  t < 0 && this.level--,
                  (n.level = this.level),
                  t > 0 && this.level++,
                  (this.pendingLevel = this.level),
                  this.tokens.push(n),
                  n
                );
              }),
              (n.prototype.scanDelims = function(e, r) {
                var t,
                  n,
                  s,
                  c,
                  l,
                  u,
                  p,
                  h,
                  f,
                  d = e,
                  m = !0,
                  _ = !0,
                  g = this.posMax,
                  k = this.src.charCodeAt(e);
                for (
                  t = e > 0 ? this.src.charCodeAt(e - 1) : 32;
                  d < g && this.src.charCodeAt(d) === k;

                )
                  d++;
                return (
                  (s = d - e),
                  (n = d < g ? this.src.charCodeAt(d) : 32),
                  (p = a(t) || i(String.fromCharCode(t))),
                  (f = a(n) || i(String.fromCharCode(n))),
                  (u = o(t)),
                  (h = o(n)),
                  h ? (m = !1) : f && (u || p || (m = !1)),
                  u ? (_ = !1) : p && (h || f || (_ = !1)),
                  r ? ((c = m), (l = _)) : ((c = m && (!_ || p)), (l = _ && (!m || f))),
                  { can_open: c, can_close: l, length: s }
                );
              }),
              (n.prototype.Token = s),
              (r.exports = n);
          },
          { '../common/utils': 4, '../token': 51 },
        ],
        48: [
          function(e, r, t) {
            'use strict';
            (r.exports.tokenize = function(e, r) {
              var t,
                n,
                s,
                o,
                i,
                a = e.pos,
                c = e.src.charCodeAt(a);
              if (r) return !1;
              if (126 !== c) return !1;
              if (
                ((n = e.scanDelims(e.pos, !0)), (o = n.length), (i = String.fromCharCode(c)), o < 2)
              )
                return !1;
              for (
                o % 2 && ((s = e.push('text', '', 0)), (s.content = i), o--), t = 0;
                t < o;
                t += 2
              )
                (s = e.push('text', '', 0)),
                  (s.content = i + i),
                  e.delimiters.push({
                    marker: c,
                    jump: t,
                    token: e.tokens.length - 1,
                    level: e.level,
                    end: -1,
                    open: n.can_open,
                    close: n.can_close,
                  });
              return (e.pos += n.length), !0;
            }),
              (r.exports.postProcess = function(e) {
                var r,
                  t,
                  n,
                  s,
                  o,
                  i = [],
                  a = e.delimiters,
                  c = e.delimiters.length;
                for (r = 0; r < c; r++)
                  (n = a[r]),
                    126 === n.marker &&
                      n.end !== -1 &&
                      ((s = a[n.end]),
                      (o = e.tokens[n.token]),
                      (o.type = 's_open'),
                      (o.tag = 's'),
                      (o.nesting = 1),
                      (o.markup = '~~'),
                      (o.content = ''),
                      (o = e.tokens[s.token]),
                      (o.type = 's_close'),
                      (o.tag = 's'),
                      (o.nesting = -1),
                      (o.markup = '~~'),
                      (o.content = ''),
                      'text' === e.tokens[s.token - 1].type &&
                        '~' === e.tokens[s.token - 1].content &&
                        i.push(s.token - 1));
                for (; i.length; ) {
                  for (
                    r = i.pop(), t = r + 1;
                    t < e.tokens.length && 's_close' === e.tokens[t].type;

                  )
                    t++;
                  t--,
                    r !== t && ((o = e.tokens[t]), (e.tokens[t] = e.tokens[r]), (e.tokens[r] = o));
                }
              });
          },
          {},
        ],
        49: [
          function(e, r, t) {
            'use strict';
            function n(e) {
              switch (e) {
                case 10:
                case 33:
                case 35:
                case 36:
                case 37:
                case 38:
                case 42:
                case 43:
                case 45:
                case 58:
                case 60:
                case 61:
                case 62:
                case 64:
                case 91:
                case 92:
                case 93:
                case 94:
                case 95:
                case 96:
                case 123:
                case 125:
                case 126:
                  return !0;
                default:
                  return !1;
              }
            }
            r.exports = function(e, r) {
              for (var t = e.pos; t < e.posMax && !n(e.src.charCodeAt(t)); ) t++;
              return t !== e.pos && (r || (e.pending += e.src.slice(e.pos, t)), (e.pos = t), !0);
            };
          },
          {},
        ],
        50: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e) {
              var r,
                t,
                n = 0,
                s = e.tokens,
                o = e.tokens.length;
              for (r = t = 0; r < o; r++)
                (n += s[r].nesting),
                  (s[r].level = n),
                  'text' === s[r].type && r + 1 < o && 'text' === s[r + 1].type
                    ? (s[r + 1].content = s[r].content + s[r + 1].content)
                    : (r !== t && (s[t] = s[r]), t++);
              r !== t && (s.length = t);
            };
          },
          {},
        ],
        51: [
          function(e, r, t) {
            'use strict';
            function n(e, r, t) {
              (this.type = e),
                (this.tag = r),
                (this.attrs = null),
                (this.map = null),
                (this.nesting = t),
                (this.level = 0),
                (this.children = null),
                (this.content = ''),
                (this.markup = ''),
                (this.info = ''),
                (this.meta = null),
                (this.block = !1),
                (this.hidden = !1);
            }
            (n.prototype.attrIndex = function(e) {
              var r, t, n;
              if (!this.attrs) return -1;
              for (r = this.attrs, t = 0, n = r.length; t < n; t++) if (r[t][0] === e) return t;
              return -1;
            }),
              (n.prototype.attrPush = function(e) {
                this.attrs ? this.attrs.push(e) : (this.attrs = [e]);
              }),
              (n.prototype.attrSet = function(e, r) {
                var t = this.attrIndex(e),
                  n = [e, r];
                t < 0 ? this.attrPush(n) : (this.attrs[t] = n);
              }),
              (n.prototype.attrGet = function(e) {
                var r = this.attrIndex(e),
                  t = null;
                return r >= 0 && (t = this.attrs[r][1]), t;
              }),
              (n.prototype.attrJoin = function(e, r) {
                var t = this.attrIndex(e);
                t < 0 ? this.attrPush([e, r]) : (this.attrs[t][1] = this.attrs[t][1] + ' ' + r);
              }),
              (r.exports = n);
          },
          {},
        ],
        52: [
          function(e, r, t) {
            r.exports = {
              Aacute: '\xc1',
              aacute: '\xe1',
              Abreve: '\u0102',
              abreve: '\u0103',
              ac: '\u223e',
              acd: '\u223f',
              acE: '\u223e\u0333',
              Acirc: '\xc2',
              acirc: '\xe2',
              acute: '\xb4',
              Acy: '\u0410',
              acy: '\u0430',
              AElig: '\xc6',
              aelig: '\xe6',
              af: '\u2061',
              Afr: '\ud835\udd04',
              afr: '\ud835\udd1e',
              Agrave: '\xc0',
              agrave: '\xe0',
              alefsym: '\u2135',
              aleph: '\u2135',
              Alpha: '\u0391',
              alpha: '\u03b1',
              Amacr: '\u0100',
              amacr: '\u0101',
              amalg: '\u2a3f',
              amp: '&',
              AMP: '&',
              andand: '\u2a55',
              And: '\u2a53',
              and: '\u2227',
              andd: '\u2a5c',
              andslope: '\u2a58',
              andv: '\u2a5a',
              ang: '\u2220',
              ange: '\u29a4',
              angle: '\u2220',
              angmsdaa: '\u29a8',
              angmsdab: '\u29a9',
              angmsdac: '\u29aa',
              angmsdad: '\u29ab',
              angmsdae: '\u29ac',
              angmsdaf: '\u29ad',
              angmsdag: '\u29ae',
              angmsdah: '\u29af',
              angmsd: '\u2221',
              angrt: '\u221f',
              angrtvb: '\u22be',
              angrtvbd: '\u299d',
              angsph: '\u2222',
              angst: '\xc5',
              angzarr: '\u237c',
              Aogon: '\u0104',
              aogon: '\u0105',
              Aopf: '\ud835\udd38',
              aopf: '\ud835\udd52',
              apacir: '\u2a6f',
              ap: '\u2248',
              apE: '\u2a70',
              ape: '\u224a',
              apid: '\u224b',
              apos: "'",
              ApplyFunction: '\u2061',
              approx: '\u2248',
              approxeq: '\u224a',
              Aring: '\xc5',
              aring: '\xe5',
              Ascr: '\ud835\udc9c',
              ascr: '\ud835\udcb6',
              Assign: '\u2254',
              ast: '*',
              asymp: '\u2248',
              asympeq: '\u224d',
              Atilde: '\xc3',
              atilde: '\xe3',
              Auml: '\xc4',
              auml: '\xe4',
              awconint: '\u2233',
              awint: '\u2a11',
              backcong: '\u224c',
              backepsilon: '\u03f6',
              backprime: '\u2035',
              backsim: '\u223d',
              backsimeq: '\u22cd',
              Backslash: '\u2216',
              Barv: '\u2ae7',
              barvee: '\u22bd',
              barwed: '\u2305',
              Barwed: '\u2306',
              barwedge: '\u2305',
              bbrk: '\u23b5',
              bbrktbrk: '\u23b6',
              bcong: '\u224c',
              Bcy: '\u0411',
              bcy: '\u0431',
              bdquo: '\u201e',
              becaus: '\u2235',
              because: '\u2235',
              Because: '\u2235',
              bemptyv: '\u29b0',
              bepsi: '\u03f6',
              bernou: '\u212c',
              Bernoullis: '\u212c',
              Beta: '\u0392',
              beta: '\u03b2',
              beth: '\u2136',
              between: '\u226c',
              Bfr: '\ud835\udd05',
              bfr: '\ud835\udd1f',
              bigcap: '\u22c2',
              bigcirc: '\u25ef',
              bigcup: '\u22c3',
              bigodot: '\u2a00',
              bigoplus: '\u2a01',
              bigotimes: '\u2a02',
              bigsqcup: '\u2a06',
              bigstar: '\u2605',
              bigtriangledown: '\u25bd',
              bigtriangleup: '\u25b3',
              biguplus: '\u2a04',
              bigvee: '\u22c1',
              bigwedge: '\u22c0',
              bkarow: '\u290d',
              blacklozenge: '\u29eb',
              blacksquare: '\u25aa',
              blacktriangle: '\u25b4',
              blacktriangledown: '\u25be',
              blacktriangleleft: '\u25c2',
              blacktriangleright: '\u25b8',
              blank: '\u2423',
              blk12: '\u2592',
              blk14: '\u2591',
              blk34: '\u2593',
              block: '\u2588',
              bne: '=\u20e5',
              bnequiv: '\u2261\u20e5',
              bNot: '\u2aed',
              bnot: '\u2310',
              Bopf: '\ud835\udd39',
              bopf: '\ud835\udd53',
              bot: '\u22a5',
              bottom: '\u22a5',
              bowtie: '\u22c8',
              boxbox: '\u29c9',
              boxdl: '\u2510',
              boxdL: '\u2555',
              boxDl: '\u2556',
              boxDL: '\u2557',
              boxdr: '\u250c',
              boxdR: '\u2552',
              boxDr: '\u2553',
              boxDR: '\u2554',
              boxh: '\u2500',
              boxH: '\u2550',
              boxhd: '\u252c',
              boxHd: '\u2564',
              boxhD: '\u2565',
              boxHD: '\u2566',
              boxhu: '\u2534',
              boxHu: '\u2567',
              boxhU: '\u2568',
              boxHU: '\u2569',
              boxminus: '\u229f',
              boxplus: '\u229e',
              boxtimes: '\u22a0',
              boxul: '\u2518',
              boxuL: '\u255b',
              boxUl: '\u255c',
              boxUL: '\u255d',
              boxur: '\u2514',
              boxuR: '\u2558',
              boxUr: '\u2559',
              boxUR: '\u255a',
              boxv: '\u2502',
              boxV: '\u2551',
              boxvh: '\u253c',
              boxvH: '\u256a',
              boxVh: '\u256b',
              boxVH: '\u256c',
              boxvl: '\u2524',
              boxvL: '\u2561',
              boxVl: '\u2562',
              boxVL: '\u2563',
              boxvr: '\u251c',
              boxvR: '\u255e',
              boxVr: '\u255f',
              boxVR: '\u2560',
              bprime: '\u2035',
              breve: '\u02d8',
              Breve: '\u02d8',
              brvbar: '\xa6',
              bscr: '\ud835\udcb7',
              Bscr: '\u212c',
              bsemi: '\u204f',
              bsim: '\u223d',
              bsime: '\u22cd',
              bsolb: '\u29c5',
              bsol: '\\',
              bsolhsub: '\u27c8',
              bull: '\u2022',
              bullet: '\u2022',
              bump: '\u224e',
              bumpE: '\u2aae',
              bumpe: '\u224f',
              Bumpeq: '\u224e',
              bumpeq: '\u224f',
              Cacute: '\u0106',
              cacute: '\u0107',
              capand: '\u2a44',
              capbrcup: '\u2a49',
              capcap: '\u2a4b',
              cap: '\u2229',
              Cap: '\u22d2',
              capcup: '\u2a47',
              capdot: '\u2a40',
              CapitalDifferentialD: '\u2145',
              caps: '\u2229\ufe00',
              caret: '\u2041',
              caron: '\u02c7',
              Cayleys: '\u212d',
              ccaps: '\u2a4d',
              Ccaron: '\u010c',
              ccaron: '\u010d',
              Ccedil: '\xc7',
              ccedil: '\xe7',
              Ccirc: '\u0108',
              ccirc: '\u0109',
              Cconint: '\u2230',
              ccups: '\u2a4c',
              ccupssm: '\u2a50',
              Cdot: '\u010a',
              cdot: '\u010b',
              cedil: '\xb8',
              Cedilla: '\xb8',
              cemptyv: '\u29b2',
              cent: '\xa2',
              centerdot: '\xb7',
              CenterDot: '\xb7',
              cfr: '\ud835\udd20',
              Cfr: '\u212d',
              CHcy: '\u0427',
              chcy: '\u0447',
              check: '\u2713',
              checkmark: '\u2713',
              Chi: '\u03a7',
              chi: '\u03c7',
              circ: '\u02c6',
              circeq: '\u2257',
              circlearrowleft: '\u21ba',
              circlearrowright: '\u21bb',
              circledast: '\u229b',
              circledcirc: '\u229a',
              circleddash: '\u229d',
              CircleDot: '\u2299',
              circledR: '\xae',
              circledS: '\u24c8',
              CircleMinus: '\u2296',
              CirclePlus: '\u2295',
              CircleTimes: '\u2297',
              cir: '\u25cb',
              cirE: '\u29c3',
              cire: '\u2257',
              cirfnint: '\u2a10',
              cirmid: '\u2aef',
              cirscir: '\u29c2',
              ClockwiseContourIntegral: '\u2232',
              CloseCurlyDoubleQuote: '\u201d',
              CloseCurlyQuote: '\u2019',
              clubs: '\u2663',
              clubsuit: '\u2663',
              colon: ':',
              Colon: '\u2237',
              Colone: '\u2a74',
              colone: '\u2254',
              coloneq: '\u2254',
              comma: ',',
              commat: '@',
              comp: '\u2201',
              compfn: '\u2218',
              complement: '\u2201',
              complexes: '\u2102',
              cong: '\u2245',
              congdot: '\u2a6d',
              Congruent: '\u2261',
              conint: '\u222e',
              Conint: '\u222f',
              ContourIntegral: '\u222e',
              copf: '\ud835\udd54',
              Copf: '\u2102',
              coprod: '\u2210',
              Coproduct: '\u2210',
              copy: '\xa9',
              COPY: '\xa9',
              copysr: '\u2117',
              CounterClockwiseContourIntegral: '\u2233',
              crarr: '\u21b5',
              cross: '\u2717',
              Cross: '\u2a2f',
              Cscr: '\ud835\udc9e',
              cscr: '\ud835\udcb8',
              csub: '\u2acf',
              csube: '\u2ad1',
              csup: '\u2ad0',
              csupe: '\u2ad2',
              ctdot: '\u22ef',
              cudarrl: '\u2938',
              cudarrr: '\u2935',
              cuepr: '\u22de',
              cuesc: '\u22df',
              cularr: '\u21b6',
              cularrp: '\u293d',
              cupbrcap: '\u2a48',
              cupcap: '\u2a46',
              CupCap: '\u224d',
              cup: '\u222a',
              Cup: '\u22d3',
              cupcup: '\u2a4a',
              cupdot: '\u228d',
              cupor: '\u2a45',
              cups: '\u222a\ufe00',
              curarr: '\u21b7',
              curarrm: '\u293c',
              curlyeqprec: '\u22de',
              curlyeqsucc: '\u22df',
              curlyvee: '\u22ce',
              curlywedge: '\u22cf',
              curren: '\xa4',
              curvearrowleft: '\u21b6',
              curvearrowright: '\u21b7',
              cuvee: '\u22ce',
              cuwed: '\u22cf',
              cwconint: '\u2232',
              cwint: '\u2231',
              cylcty: '\u232d',
              dagger: '\u2020',
              Dagger: '\u2021',
              daleth: '\u2138',
              darr: '\u2193',
              Darr: '\u21a1',
              dArr: '\u21d3',
              dash: '\u2010',
              Dashv: '\u2ae4',
              dashv: '\u22a3',
              dbkarow: '\u290f',
              dblac: '\u02dd',
              Dcaron: '\u010e',
              dcaron: '\u010f',
              Dcy: '\u0414',
              dcy: '\u0434',
              ddagger: '\u2021',
              ddarr: '\u21ca',
              DD: '\u2145',
              dd: '\u2146',
              DDotrahd: '\u2911',
              ddotseq: '\u2a77',
              deg: '\xb0',
              Del: '\u2207',
              Delta: '\u0394',
              delta: '\u03b4',
              demptyv: '\u29b1',
              dfisht: '\u297f',
              Dfr: '\ud835\udd07',
              dfr: '\ud835\udd21',
              dHar: '\u2965',
              dharl: '\u21c3',
              dharr: '\u21c2',
              DiacriticalAcute: '\xb4',
              DiacriticalDot: '\u02d9',
              DiacriticalDoubleAcute: '\u02dd',
              DiacriticalGrave: '`',
              DiacriticalTilde: '\u02dc',
              diam: '\u22c4',
              diamond: '\u22c4',
              Diamond: '\u22c4',
              diamondsuit: '\u2666',
              diams: '\u2666',
              die: '\xa8',
              DifferentialD: '\u2146',
              digamma: '\u03dd',
              disin: '\u22f2',
              div: '\xf7',
              divide: '\xf7',
              divideontimes: '\u22c7',
              divonx: '\u22c7',
              DJcy: '\u0402',
              djcy: '\u0452',
              dlcorn: '\u231e',
              dlcrop: '\u230d',
              dollar: '$',
              Dopf: '\ud835\udd3b',
              dopf: '\ud835\udd55',
              Dot: '\xa8',
              dot: '\u02d9',
              DotDot: '\u20dc',
              doteq: '\u2250',
              doteqdot: '\u2251',
              DotEqual: '\u2250',
              dotminus: '\u2238',
              dotplus: '\u2214',
              dotsquare: '\u22a1',
              doublebarwedge: '\u2306',
              DoubleContourIntegral: '\u222f',
              DoubleDot: '\xa8',
              DoubleDownArrow: '\u21d3',
              DoubleLeftArrow: '\u21d0',
              DoubleLeftRightArrow: '\u21d4',
              DoubleLeftTee: '\u2ae4',
              DoubleLongLeftArrow: '\u27f8',
              DoubleLongLeftRightArrow: '\u27fa',
              DoubleLongRightArrow: '\u27f9',
              DoubleRightArrow: '\u21d2',
              DoubleRightTee: '\u22a8',
              DoubleUpArrow: '\u21d1',
              DoubleUpDownArrow: '\u21d5',
              DoubleVerticalBar: '\u2225',
              DownArrowBar: '\u2913',
              downarrow: '\u2193',
              DownArrow: '\u2193',
              Downarrow: '\u21d3',
              DownArrowUpArrow: '\u21f5',
              DownBreve: '\u0311',
              downdownarrows: '\u21ca',
              downharpoonleft: '\u21c3',
              downharpoonright: '\u21c2',
              DownLeftRightVector: '\u2950',
              DownLeftTeeVector: '\u295e',
              DownLeftVectorBar: '\u2956',
              DownLeftVector: '\u21bd',
              DownRightTeeVector: '\u295f',
              DownRightVectorBar: '\u2957',
              DownRightVector: '\u21c1',
              DownTeeArrow: '\u21a7',
              DownTee: '\u22a4',
              drbkarow: '\u2910',
              drcorn: '\u231f',
              drcrop: '\u230c',
              Dscr: '\ud835\udc9f',
              dscr: '\ud835\udcb9',
              DScy: '\u0405',
              dscy: '\u0455',
              dsol: '\u29f6',
              Dstrok: '\u0110',
              dstrok: '\u0111',
              dtdot: '\u22f1',
              dtri: '\u25bf',
              dtrif: '\u25be',
              duarr: '\u21f5',
              duhar: '\u296f',
              dwangle: '\u29a6',
              DZcy: '\u040f',
              dzcy: '\u045f',
              dzigrarr: '\u27ff',
              Eacute: '\xc9',
              eacute: '\xe9',
              easter: '\u2a6e',
              Ecaron: '\u011a',
              ecaron: '\u011b',
              Ecirc: '\xca',
              ecirc: '\xea',
              ecir: '\u2256',
              ecolon: '\u2255',
              Ecy: '\u042d',
              ecy: '\u044d',
              eDDot: '\u2a77',
              Edot: '\u0116',
              edot: '\u0117',
              eDot: '\u2251',
              ee: '\u2147',
              efDot: '\u2252',
              Efr: '\ud835\udd08',
              efr: '\ud835\udd22',
              eg: '\u2a9a',
              Egrave: '\xc8',
              egrave: '\xe8',
              egs: '\u2a96',
              egsdot: '\u2a98',
              el: '\u2a99',
              Element: '\u2208',
              elinters: '\u23e7',
              ell: '\u2113',
              els: '\u2a95',
              elsdot: '\u2a97',
              Emacr: '\u0112',
              emacr: '\u0113',
              empty: '\u2205',
              emptyset: '\u2205',
              EmptySmallSquare: '\u25fb',
              emptyv: '\u2205',
              EmptyVerySmallSquare: '\u25ab',
              emsp13: '\u2004',
              emsp14: '\u2005',
              emsp: '\u2003',
              ENG: '\u014a',
              eng: '\u014b',
              ensp: '\u2002',
              Eogon: '\u0118',
              eogon: '\u0119',
              Eopf: '\ud835\udd3c',
              eopf: '\ud835\udd56',
              epar: '\u22d5',
              eparsl: '\u29e3',
              eplus: '\u2a71',
              epsi: '\u03b5',
              Epsilon: '\u0395',
              epsilon: '\u03b5',
              epsiv: '\u03f5',
              eqcirc: '\u2256',
              eqcolon: '\u2255',
              eqsim: '\u2242',
              eqslantgtr: '\u2a96',
              eqslantless: '\u2a95',
              Equal: '\u2a75',
              equals: '=',
              EqualTilde: '\u2242',
              equest: '\u225f',
              Equilibrium: '\u21cc',
              equiv: '\u2261',
              equivDD: '\u2a78',
              eqvparsl: '\u29e5',
              erarr: '\u2971',
              erDot: '\u2253',
              escr: '\u212f',
              Escr: '\u2130',
              esdot: '\u2250',
              Esim: '\u2a73',
              esim: '\u2242',
              Eta: '\u0397',
              eta: '\u03b7',
              ETH: '\xd0',
              eth: '\xf0',
              Euml: '\xcb',
              euml: '\xeb',
              euro: '\u20ac',
              excl: '!',
              exist: '\u2203',
              Exists: '\u2203',
              expectation: '\u2130',
              exponentiale: '\u2147',
              ExponentialE: '\u2147',
              fallingdotseq: '\u2252',
              Fcy: '\u0424',
              fcy: '\u0444',
              female: '\u2640',
              ffilig: '\ufb03',
              fflig: '\ufb00',
              ffllig: '\ufb04',
              Ffr: '\ud835\udd09',
              ffr: '\ud835\udd23',
              filig: '\ufb01',
              FilledSmallSquare: '\u25fc',
              FilledVerySmallSquare: '\u25aa',
              fjlig: 'fj',
              flat: '\u266d',
              fllig: '\ufb02',
              fltns: '\u25b1',
              fnof: '\u0192',
              Fopf: '\ud835\udd3d',
              fopf: '\ud835\udd57',
              forall: '\u2200',
              ForAll: '\u2200',
              fork: '\u22d4',
              forkv: '\u2ad9',
              Fouriertrf: '\u2131',
              fpartint: '\u2a0d',
              frac12: '\xbd',
              frac13: '\u2153',
              frac14: '\xbc',
              frac15: '\u2155',
              frac16: '\u2159',
              frac18: '\u215b',
              frac23: '\u2154',
              frac25: '\u2156',
              frac34: '\xbe',
              frac35: '\u2157',
              frac38: '\u215c',
              frac45: '\u2158',
              frac56: '\u215a',
              frac58: '\u215d',
              frac78: '\u215e',
              frasl: '\u2044',
              frown: '\u2322',
              fscr: '\ud835\udcbb',
              Fscr: '\u2131',
              gacute: '\u01f5',
              Gamma: '\u0393',
              gamma: '\u03b3',
              Gammad: '\u03dc',
              gammad: '\u03dd',
              gap: '\u2a86',
              Gbreve: '\u011e',
              gbreve: '\u011f',
              Gcedil: '\u0122',
              Gcirc: '\u011c',
              gcirc: '\u011d',
              Gcy: '\u0413',
              gcy: '\u0433',
              Gdot: '\u0120',
              gdot: '\u0121',
              ge: '\u2265',
              gE: '\u2267',
              gEl: '\u2a8c',
              gel: '\u22db',
              geq: '\u2265',
              geqq: '\u2267',
              geqslant: '\u2a7e',
              gescc: '\u2aa9',
              ges: '\u2a7e',
              gesdot: '\u2a80',
              gesdoto: '\u2a82',
              gesdotol: '\u2a84',
              gesl: '\u22db\ufe00',
              gesles: '\u2a94',
              Gfr: '\ud835\udd0a',
              gfr: '\ud835\udd24',
              gg: '\u226b',
              Gg: '\u22d9',
              ggg: '\u22d9',
              gimel: '\u2137',
              GJcy: '\u0403',
              gjcy: '\u0453',
              gla: '\u2aa5',
              gl: '\u2277',
              glE: '\u2a92',
              glj: '\u2aa4',
              gnap: '\u2a8a',
              gnapprox: '\u2a8a',
              gne: '\u2a88',
              gnE: '\u2269',
              gneq: '\u2a88',
              gneqq: '\u2269',
              gnsim: '\u22e7',
              Gopf: '\ud835\udd3e',
              gopf: '\ud835\udd58',
              grave: '`',
              GreaterEqual: '\u2265',
              GreaterEqualLess: '\u22db',
              GreaterFullEqual: '\u2267',
              GreaterGreater: '\u2aa2',
              GreaterLess: '\u2277',
              GreaterSlantEqual: '\u2a7e',
              GreaterTilde: '\u2273',
              Gscr: '\ud835\udca2',
              gscr: '\u210a',
              gsim: '\u2273',
              gsime: '\u2a8e',
              gsiml: '\u2a90',
              gtcc: '\u2aa7',
              gtcir: '\u2a7a',
              gt: '>',
              GT: '>',
              Gt: '\u226b',
              gtdot: '\u22d7',
              gtlPar: '\u2995',
              gtquest: '\u2a7c',
              gtrapprox: '\u2a86',
              gtrarr: '\u2978',
              gtrdot: '\u22d7',
              gtreqless: '\u22db',
              gtreqqless: '\u2a8c',
              gtrless: '\u2277',
              gtrsim: '\u2273',
              gvertneqq: '\u2269\ufe00',
              gvnE: '\u2269\ufe00',
              Hacek: '\u02c7',
              hairsp: '\u200a',
              half: '\xbd',
              hamilt: '\u210b',
              HARDcy: '\u042a',
              hardcy: '\u044a',
              harrcir: '\u2948',
              harr: '\u2194',
              hArr: '\u21d4',
              harrw: '\u21ad',
              Hat: '^',
              hbar: '\u210f',
              Hcirc: '\u0124',
              hcirc: '\u0125',
              hearts: '\u2665',
              heartsuit: '\u2665',
              hellip: '\u2026',
              hercon: '\u22b9',
              hfr: '\ud835\udd25',
              Hfr: '\u210c',
              HilbertSpace: '\u210b',
              hksearow: '\u2925',
              hkswarow: '\u2926',
              hoarr: '\u21ff',
              homtht: '\u223b',
              hookleftarrow: '\u21a9',
              hookrightarrow: '\u21aa',
              hopf: '\ud835\udd59',
              Hopf: '\u210d',
              horbar: '\u2015',
              HorizontalLine: '\u2500',
              hscr: '\ud835\udcbd',
              Hscr: '\u210b',
              hslash: '\u210f',
              Hstrok: '\u0126',
              hstrok: '\u0127',
              HumpDownHump: '\u224e',
              HumpEqual: '\u224f',
              hybull: '\u2043',
              hyphen: '\u2010',
              Iacute: '\xcd',
              iacute: '\xed',
              ic: '\u2063',
              Icirc: '\xce',
              icirc: '\xee',
              Icy: '\u0418',
              icy: '\u0438',
              Idot: '\u0130',
              IEcy: '\u0415',
              iecy: '\u0435',
              iexcl: '\xa1',
              iff: '\u21d4',
              ifr: '\ud835\udd26',
              Ifr: '\u2111',
              Igrave: '\xcc',
              igrave: '\xec',
              ii: '\u2148',
              iiiint: '\u2a0c',
              iiint: '\u222d',
              iinfin: '\u29dc',
              iiota: '\u2129',
              IJlig: '\u0132',
              ijlig: '\u0133',
              Imacr: '\u012a',
              imacr: '\u012b',
              image: '\u2111',
              ImaginaryI: '\u2148',
              imagline: '\u2110',
              imagpart: '\u2111',
              imath: '\u0131',
              Im: '\u2111',
              imof: '\u22b7',
              imped: '\u01b5',
              Implies: '\u21d2',
              incare: '\u2105',
              in: '\u2208',
              infin: '\u221e',
              infintie: '\u29dd',
              inodot: '\u0131',
              intcal: '\u22ba',
              int: '\u222b',
              Int: '\u222c',
              integers: '\u2124',
              Integral: '\u222b',
              intercal: '\u22ba',
              Intersection: '\u22c2',
              intlarhk: '\u2a17',
              intprod: '\u2a3c',
              InvisibleComma: '\u2063',
              InvisibleTimes: '\u2062',
              IOcy: '\u0401',
              iocy: '\u0451',
              Iogon: '\u012e',
              iogon: '\u012f',
              Iopf: '\ud835\udd40',
              iopf: '\ud835\udd5a',
              Iota: '\u0399',
              iota: '\u03b9',
              iprod: '\u2a3c',
              iquest: '\xbf',
              iscr: '\ud835\udcbe',
              Iscr: '\u2110',
              isin: '\u2208',
              isindot: '\u22f5',
              isinE: '\u22f9',
              isins: '\u22f4',
              isinsv: '\u22f3',
              isinv: '\u2208',
              it: '\u2062',
              Itilde: '\u0128',
              itilde: '\u0129',
              Iukcy: '\u0406',
              iukcy: '\u0456',
              Iuml: '\xcf',
              iuml: '\xef',
              Jcirc: '\u0134',
              jcirc: '\u0135',
              Jcy: '\u0419',
              jcy: '\u0439',
              Jfr: '\ud835\udd0d',
              jfr: '\ud835\udd27',
              jmath: '\u0237',
              Jopf: '\ud835\udd41',
              jopf: '\ud835\udd5b',
              Jscr: '\ud835\udca5',
              jscr: '\ud835\udcbf',
              Jsercy: '\u0408',
              jsercy: '\u0458',
              Jukcy: '\u0404',
              jukcy: '\u0454',
              Kappa: '\u039a',
              kappa: '\u03ba',
              kappav: '\u03f0',
              Kcedil: '\u0136',
              kcedil: '\u0137',
              Kcy: '\u041a',
              kcy: '\u043a',
              Kfr: '\ud835\udd0e',
              kfr: '\ud835\udd28',
              kgreen: '\u0138',
              KHcy: '\u0425',
              khcy: '\u0445',
              KJcy: '\u040c',
              kjcy: '\u045c',
              Kopf: '\ud835\udd42',
              kopf: '\ud835\udd5c',
              Kscr: '\ud835\udca6',
              kscr: '\ud835\udcc0',
              lAarr: '\u21da',
              Lacute: '\u0139',
              lacute: '\u013a',
              laemptyv: '\u29b4',
              lagran: '\u2112',
              Lambda: '\u039b',
              lambda: '\u03bb',
              lang: '\u27e8',
              Lang: '\u27ea',
              langd: '\u2991',
              langle: '\u27e8',
              lap: '\u2a85',
              Laplacetrf: '\u2112',
              laquo: '\xab',
              larrb: '\u21e4',
              larrbfs: '\u291f',
              larr: '\u2190',
              Larr: '\u219e',
              lArr: '\u21d0',
              larrfs: '\u291d',
              larrhk: '\u21a9',
              larrlp: '\u21ab',
              larrpl: '\u2939',
              larrsim: '\u2973',
              larrtl: '\u21a2',
              latail: '\u2919',
              lAtail: '\u291b',
              lat: '\u2aab',
              late: '\u2aad',
              lates: '\u2aad\ufe00',
              lbarr: '\u290c',
              lBarr: '\u290e',
              lbbrk: '\u2772',
              lbrace: '{',
              lbrack: '[',
              lbrke: '\u298b',
              lbrksld: '\u298f',
              lbrkslu: '\u298d',
              Lcaron: '\u013d',
              lcaron: '\u013e',
              Lcedil: '\u013b',
              lcedil: '\u013c',
              lceil: '\u2308',
              lcub: '{',
              Lcy: '\u041b',
              lcy: '\u043b',
              ldca: '\u2936',
              ldquo: '\u201c',
              ldquor: '\u201e',
              ldrdhar: '\u2967',
              ldrushar: '\u294b',
              ldsh: '\u21b2',
              le: '\u2264',
              lE: '\u2266',
              LeftAngleBracket: '\u27e8',
              LeftArrowBar: '\u21e4',
              leftarrow: '\u2190',
              LeftArrow: '\u2190',
              Leftarrow: '\u21d0',
              LeftArrowRightArrow: '\u21c6',
              leftarrowtail: '\u21a2',
              LeftCeiling: '\u2308',
              LeftDoubleBracket: '\u27e6',
              LeftDownTeeVector: '\u2961',
              LeftDownVectorBar: '\u2959',
              LeftDownVector: '\u21c3',
              LeftFloor: '\u230a',
              leftharpoondown: '\u21bd',
              leftharpoonup: '\u21bc',
              leftleftarrows: '\u21c7',
              leftrightarrow: '\u2194',
              LeftRightArrow: '\u2194',
              Leftrightarrow: '\u21d4',
              leftrightarrows: '\u21c6',
              leftrightharpoons: '\u21cb',
              leftrightsquigarrow: '\u21ad',
              LeftRightVector: '\u294e',
              LeftTeeArrow: '\u21a4',
              LeftTee: '\u22a3',
              LeftTeeVector: '\u295a',
              leftthreetimes: '\u22cb',
              LeftTriangleBar: '\u29cf',
              LeftTriangle: '\u22b2',
              LeftTriangleEqual: '\u22b4',
              LeftUpDownVector: '\u2951',
              LeftUpTeeVector: '\u2960',
              LeftUpVectorBar: '\u2958',
              LeftUpVector: '\u21bf',
              LeftVectorBar: '\u2952',
              LeftVector: '\u21bc',
              lEg: '\u2a8b',
              leg: '\u22da',
              leq: '\u2264',
              leqq: '\u2266',
              leqslant: '\u2a7d',
              lescc: '\u2aa8',
              les: '\u2a7d',
              lesdot: '\u2a7f',
              lesdoto: '\u2a81',
              lesdotor: '\u2a83',
              lesg: '\u22da\ufe00',
              lesges: '\u2a93',
              lessapprox: '\u2a85',
              lessdot: '\u22d6',
              lesseqgtr: '\u22da',
              lesseqqgtr: '\u2a8b',
              LessEqualGreater: '\u22da',
              LessFullEqual: '\u2266',
              LessGreater: '\u2276',
              lessgtr: '\u2276',
              LessLess: '\u2aa1',
              lesssim: '\u2272',
              LessSlantEqual: '\u2a7d',
              LessTilde: '\u2272',
              lfisht: '\u297c',
              lfloor: '\u230a',
              Lfr: '\ud835\udd0f',
              lfr: '\ud835\udd29',
              lg: '\u2276',
              lgE: '\u2a91',
              lHar: '\u2962',
              lhard: '\u21bd',
              lharu: '\u21bc',
              lharul: '\u296a',
              lhblk: '\u2584',
              LJcy: '\u0409',
              ljcy: '\u0459',
              llarr: '\u21c7',
              ll: '\u226a',
              Ll: '\u22d8',
              llcorner: '\u231e',
              Lleftarrow: '\u21da',
              llhard: '\u296b',
              lltri: '\u25fa',
              Lmidot: '\u013f',
              lmidot: '\u0140',
              lmoustache: '\u23b0',
              lmoust: '\u23b0',
              lnap: '\u2a89',
              lnapprox: '\u2a89',
              lne: '\u2a87',
              lnE: '\u2268',
              lneq: '\u2a87',
              lneqq: '\u2268',
              lnsim: '\u22e6',
              loang: '\u27ec',
              loarr: '\u21fd',
              lobrk: '\u27e6',
              longleftarrow: '\u27f5',
              LongLeftArrow: '\u27f5',
              Longleftarrow: '\u27f8',
              longleftrightarrow: '\u27f7',
              LongLeftRightArrow: '\u27f7',
              Longleftrightarrow: '\u27fa',
              longmapsto: '\u27fc',
              longrightarrow: '\u27f6',
              LongRightArrow: '\u27f6',
              Longrightarrow: '\u27f9',
              looparrowleft: '\u21ab',
              looparrowright: '\u21ac',
              lopar: '\u2985',
              Lopf: '\ud835\udd43',
              lopf: '\ud835\udd5d',
              loplus: '\u2a2d',
              lotimes: '\u2a34',
              lowast: '\u2217',
              lowbar: '_',
              LowerLeftArrow: '\u2199',
              LowerRightArrow: '\u2198',
              loz: '\u25ca',
              lozenge: '\u25ca',
              lozf: '\u29eb',
              lpar: '(',
              lparlt: '\u2993',
              lrarr: '\u21c6',
              lrcorner: '\u231f',
              lrhar: '\u21cb',
              lrhard: '\u296d',
              lrm: '\u200e',
              lrtri: '\u22bf',
              lsaquo: '\u2039',
              lscr: '\ud835\udcc1',
              Lscr: '\u2112',
              lsh: '\u21b0',
              Lsh: '\u21b0',
              lsim: '\u2272',
              lsime: '\u2a8d',
              lsimg: '\u2a8f',
              lsqb: '[',
              lsquo: '\u2018',
              lsquor: '\u201a',
              Lstrok: '\u0141',
              lstrok: '\u0142',
              ltcc: '\u2aa6',
              ltcir: '\u2a79',
              lt: '<',
              LT: '<',
              Lt: '\u226a',
              ltdot: '\u22d6',
              lthree: '\u22cb',
              ltimes: '\u22c9',
              ltlarr: '\u2976',
              ltquest: '\u2a7b',
              ltri: '\u25c3',
              ltrie: '\u22b4',
              ltrif: '\u25c2',
              ltrPar: '\u2996',
              lurdshar: '\u294a',
              luruhar: '\u2966',
              lvertneqq: '\u2268\ufe00',
              lvnE: '\u2268\ufe00',
              macr: '\xaf',
              male: '\u2642',
              malt: '\u2720',
              maltese: '\u2720',
              Map: '\u2905',
              map: '\u21a6',
              mapsto: '\u21a6',
              mapstodown: '\u21a7',
              mapstoleft: '\u21a4',
              mapstoup: '\u21a5',
              marker: '\u25ae',
              mcomma: '\u2a29',
              Mcy: '\u041c',
              mcy: '\u043c',
              mdash: '\u2014',
              mDDot: '\u223a',
              measuredangle: '\u2221',
              MediumSpace: '\u205f',
              Mellintrf: '\u2133',
              Mfr: '\ud835\udd10',
              mfr: '\ud835\udd2a',
              mho: '\u2127',
              micro: '\xb5',
              midast: '*',
              midcir: '\u2af0',
              mid: '\u2223',
              middot: '\xb7',
              minusb: '\u229f',
              minus: '\u2212',
              minusd: '\u2238',
              minusdu: '\u2a2a',
              MinusPlus: '\u2213',
              mlcp: '\u2adb',
              mldr: '\u2026',
              mnplus: '\u2213',
              models: '\u22a7',
              Mopf: '\ud835\udd44',
              mopf: '\ud835\udd5e',
              mp: '\u2213',
              mscr: '\ud835\udcc2',
              Mscr: '\u2133',
              mstpos: '\u223e',
              Mu: '\u039c',
              mu: '\u03bc',
              multimap: '\u22b8',
              mumap: '\u22b8',
              nabla: '\u2207',
              Nacute: '\u0143',
              nacute: '\u0144',
              nang: '\u2220\u20d2',
              nap: '\u2249',
              napE: '\u2a70\u0338',
              napid: '\u224b\u0338',
              napos: '\u0149',
              napprox: '\u2249',
              natural: '\u266e',
              naturals: '\u2115',
              natur: '\u266e',
              nbsp: '\xa0',
              nbump: '\u224e\u0338',
              nbumpe: '\u224f\u0338',
              ncap: '\u2a43',
              Ncaron: '\u0147',
              ncaron: '\u0148',
              Ncedil: '\u0145',
              ncedil: '\u0146',
              ncong: '\u2247',
              ncongdot: '\u2a6d\u0338',
              ncup: '\u2a42',
              Ncy: '\u041d',
              ncy: '\u043d',
              ndash: '\u2013',
              nearhk: '\u2924',
              nearr: '\u2197',
              neArr: '\u21d7',
              nearrow: '\u2197',
              ne: '\u2260',
              nedot: '\u2250\u0338',
              NegativeMediumSpace: '\u200b',
              NegativeThickSpace: '\u200b',
              NegativeThinSpace: '\u200b',
              NegativeVeryThinSpace: '\u200b',
              nequiv: '\u2262',
              nesear: '\u2928',
              nesim: '\u2242\u0338',
              NestedGreaterGreater: '\u226b',
              NestedLessLess: '\u226a',
              NewLine: '\n',
              nexist: '\u2204',
              nexists: '\u2204',
              Nfr: '\ud835\udd11',
              nfr: '\ud835\udd2b',
              ngE: '\u2267\u0338',
              nge: '\u2271',
              ngeq: '\u2271',
              ngeqq: '\u2267\u0338',
              ngeqslant: '\u2a7e\u0338',
              nges: '\u2a7e\u0338',
              nGg: '\u22d9\u0338',
              ngsim: '\u2275',
              nGt: '\u226b\u20d2',
              ngt: '\u226f',
              ngtr: '\u226f',
              nGtv: '\u226b\u0338',
              nharr: '\u21ae',
              nhArr: '\u21ce',
              nhpar: '\u2af2',
              ni: '\u220b',
              nis: '\u22fc',
              nisd: '\u22fa',
              niv: '\u220b',
              NJcy: '\u040a',
              njcy: '\u045a',
              nlarr: '\u219a',
              nlArr: '\u21cd',
              nldr: '\u2025',
              nlE: '\u2266\u0338',
              nle: '\u2270',
              nleftarrow: '\u219a',
              nLeftarrow: '\u21cd',
              nleftrightarrow: '\u21ae',
              nLeftrightarrow: '\u21ce',
              nleq: '\u2270',
              nleqq: '\u2266\u0338',
              nleqslant: '\u2a7d\u0338',
              nles: '\u2a7d\u0338',
              nless: '\u226e',
              nLl: '\u22d8\u0338',
              nlsim: '\u2274',
              nLt: '\u226a\u20d2',
              nlt: '\u226e',
              nltri: '\u22ea',
              nltrie: '\u22ec',
              nLtv: '\u226a\u0338',
              nmid: '\u2224',
              NoBreak: '\u2060',
              NonBreakingSpace: '\xa0',
              nopf: '\ud835\udd5f',
              Nopf: '\u2115',
              Not: '\u2aec',
              not: '\xac',
              NotCongruent: '\u2262',
              NotCupCap: '\u226d',
              NotDoubleVerticalBar: '\u2226',
              NotElement: '\u2209',
              NotEqual: '\u2260',
              NotEqualTilde: '\u2242\u0338',
              NotExists: '\u2204',
              NotGreater: '\u226f',
              NotGreaterEqual: '\u2271',
              NotGreaterFullEqual: '\u2267\u0338',
              NotGreaterGreater: '\u226b\u0338',
              NotGreaterLess: '\u2279',
              NotGreaterSlantEqual: '\u2a7e\u0338',
              NotGreaterTilde: '\u2275',
              NotHumpDownHump: '\u224e\u0338',
              NotHumpEqual: '\u224f\u0338',
              notin: '\u2209',
              notindot: '\u22f5\u0338',
              notinE: '\u22f9\u0338',
              notinva: '\u2209',
              notinvb: '\u22f7',
              notinvc: '\u22f6',
              NotLeftTriangleBar: '\u29cf\u0338',
              NotLeftTriangle: '\u22ea',
              NotLeftTriangleEqual: '\u22ec',
              NotLess: '\u226e',
              NotLessEqual: '\u2270',
              NotLessGreater: '\u2278',
              NotLessLess: '\u226a\u0338',
              NotLessSlantEqual: '\u2a7d\u0338',
              NotLessTilde: '\u2274',
              NotNestedGreaterGreater: '\u2aa2\u0338',
              NotNestedLessLess: '\u2aa1\u0338',
              notni: '\u220c',
              notniva: '\u220c',
              notnivb: '\u22fe',
              notnivc: '\u22fd',
              NotPrecedes: '\u2280',
              NotPrecedesEqual: '\u2aaf\u0338',
              NotPrecedesSlantEqual: '\u22e0',
              NotReverseElement: '\u220c',
              NotRightTriangleBar: '\u29d0\u0338',
              NotRightTriangle: '\u22eb',
              NotRightTriangleEqual: '\u22ed',
              NotSquareSubset: '\u228f\u0338',
              NotSquareSubsetEqual: '\u22e2',
              NotSquareSuperset: '\u2290\u0338',
              NotSquareSupersetEqual: '\u22e3',
              NotSubset: '\u2282\u20d2',
              NotSubsetEqual: '\u2288',
              NotSucceeds: '\u2281',
              NotSucceedsEqual: '\u2ab0\u0338',
              NotSucceedsSlantEqual: '\u22e1',
              NotSucceedsTilde: '\u227f\u0338',
              NotSuperset: '\u2283\u20d2',
              NotSupersetEqual: '\u2289',
              NotTilde: '\u2241',
              NotTildeEqual: '\u2244',
              NotTildeFullEqual: '\u2247',
              NotTildeTilde: '\u2249',
              NotVerticalBar: '\u2224',
              nparallel: '\u2226',
              npar: '\u2226',
              nparsl: '\u2afd\u20e5',
              npart: '\u2202\u0338',
              npolint: '\u2a14',
              npr: '\u2280',
              nprcue: '\u22e0',
              nprec: '\u2280',
              npreceq: '\u2aaf\u0338',
              npre: '\u2aaf\u0338',
              nrarrc: '\u2933\u0338',
              nrarr: '\u219b',
              nrArr: '\u21cf',
              nrarrw: '\u219d\u0338',
              nrightarrow: '\u219b',
              nRightarrow: '\u21cf',
              nrtri: '\u22eb',
              nrtrie: '\u22ed',
              nsc: '\u2281',
              nsccue: '\u22e1',
              nsce: '\u2ab0\u0338',
              Nscr: '\ud835\udca9',
              nscr: '\ud835\udcc3',
              nshortmid: '\u2224',
              nshortparallel: '\u2226',
              nsim: '\u2241',
              nsime: '\u2244',
              nsimeq: '\u2244',
              nsmid: '\u2224',
              nspar: '\u2226',
              nsqsube: '\u22e2',
              nsqsupe: '\u22e3',
              nsub: '\u2284',
              nsubE: '\u2ac5\u0338',
              nsube: '\u2288',
              nsubset: '\u2282\u20d2',
              nsubseteq: '\u2288',
              nsubseteqq: '\u2ac5\u0338',
              nsucc: '\u2281',
              nsucceq: '\u2ab0\u0338',
              nsup: '\u2285',
              nsupE: '\u2ac6\u0338',
              nsupe: '\u2289',
              nsupset: '\u2283\u20d2',
              nsupseteq: '\u2289',
              nsupseteqq: '\u2ac6\u0338',
              ntgl: '\u2279',
              Ntilde: '\xd1',
              ntilde: '\xf1',
              ntlg: '\u2278',
              ntriangleleft: '\u22ea',
              ntrianglelefteq: '\u22ec',
              ntriangleright: '\u22eb',
              ntrianglerighteq: '\u22ed',
              Nu: '\u039d',
              nu: '\u03bd',
              num: '#',
              numero: '\u2116',
              numsp: '\u2007',
              nvap: '\u224d\u20d2',
              nvdash: '\u22ac',
              nvDash: '\u22ad',
              nVdash: '\u22ae',
              nVDash: '\u22af',
              nvge: '\u2265\u20d2',
              nvgt: '>\u20d2',
              nvHarr: '\u2904',
              nvinfin: '\u29de',
              nvlArr: '\u2902',
              nvle: '\u2264\u20d2',
              nvlt: '<\u20d2',
              nvltrie: '\u22b4\u20d2',
              nvrArr: '\u2903',
              nvrtrie: '\u22b5\u20d2',
              nvsim: '\u223c\u20d2',
              nwarhk: '\u2923',
              nwarr: '\u2196',
              nwArr: '\u21d6',
              nwarrow: '\u2196',
              nwnear: '\u2927',
              Oacute: '\xd3',
              oacute: '\xf3',
              oast: '\u229b',
              Ocirc: '\xd4',
              ocirc: '\xf4',
              ocir: '\u229a',
              Ocy: '\u041e',
              ocy: '\u043e',
              odash: '\u229d',
              Odblac: '\u0150',
              odblac: '\u0151',
              odiv: '\u2a38',
              odot: '\u2299',
              odsold: '\u29bc',
              OElig: '\u0152',
              oelig: '\u0153',
              ofcir: '\u29bf',
              Ofr: '\ud835\udd12',
              ofr: '\ud835\udd2c',
              ogon: '\u02db',
              Ograve: '\xd2',
              ograve: '\xf2',
              ogt: '\u29c1',
              ohbar: '\u29b5',
              ohm: '\u03a9',
              oint: '\u222e',
              olarr: '\u21ba',
              olcir: '\u29be',
              olcross: '\u29bb',
              oline: '\u203e',
              olt: '\u29c0',
              Omacr: '\u014c',
              omacr: '\u014d',
              Omega: '\u03a9',
              omega: '\u03c9',
              Omicron: '\u039f',
              omicron: '\u03bf',
              omid: '\u29b6',
              ominus: '\u2296',
              Oopf: '\ud835\udd46',
              oopf: '\ud835\udd60',
              opar: '\u29b7',
              OpenCurlyDoubleQuote: '\u201c',
              OpenCurlyQuote: '\u2018',
              operp: '\u29b9',
              oplus: '\u2295',
              orarr: '\u21bb',
              Or: '\u2a54',
              or: '\u2228',
              ord: '\u2a5d',
              order: '\u2134',
              orderof: '\u2134',
              ordf: '\xaa',
              ordm: '\xba',
              origof: '\u22b6',
              oror: '\u2a56',
              orslope: '\u2a57',
              orv: '\u2a5b',
              oS: '\u24c8',
              Oscr: '\ud835\udcaa',
              oscr: '\u2134',
              Oslash: '\xd8',
              oslash: '\xf8',
              osol: '\u2298',
              Otilde: '\xd5',
              otilde: '\xf5',
              otimesas: '\u2a36',
              Otimes: '\u2a37',
              otimes: '\u2297',
              Ouml: '\xd6',
              ouml: '\xf6',
              ovbar: '\u233d',
              OverBar: '\u203e',
              OverBrace: '\u23de',
              OverBracket: '\u23b4',
              OverParenthesis: '\u23dc',
              para: '\xb6',
              parallel: '\u2225',
              par: '\u2225',
              parsim: '\u2af3',
              parsl: '\u2afd',
              part: '\u2202',
              PartialD: '\u2202',
              Pcy: '\u041f',
              pcy: '\u043f',
              percnt: '%',
              period: '.',
              permil: '\u2030',
              perp: '\u22a5',
              pertenk: '\u2031',
              Pfr: '\ud835\udd13',
              pfr: '\ud835\udd2d',
              Phi: '\u03a6',
              phi: '\u03c6',
              phiv: '\u03d5',
              phmmat: '\u2133',
              phone: '\u260e',
              Pi: '\u03a0',
              pi: '\u03c0',
              pitchfork: '\u22d4',
              piv: '\u03d6',
              planck: '\u210f',
              planckh: '\u210e',
              plankv: '\u210f',
              plusacir: '\u2a23',
              plusb: '\u229e',
              pluscir: '\u2a22',
              plus: '+',
              plusdo: '\u2214',
              plusdu: '\u2a25',
              pluse: '\u2a72',
              PlusMinus: '\xb1',
              plusmn: '\xb1',
              plussim: '\u2a26',
              plustwo: '\u2a27',
              pm: '\xb1',
              Poincareplane: '\u210c',
              pointint: '\u2a15',
              popf: '\ud835\udd61',
              Popf: '\u2119',
              pound: '\xa3',
              prap: '\u2ab7',
              Pr: '\u2abb',
              pr: '\u227a',
              prcue: '\u227c',
              precapprox: '\u2ab7',
              prec: '\u227a',
              preccurlyeq: '\u227c',
              Precedes: '\u227a',
              PrecedesEqual: '\u2aaf',
              PrecedesSlantEqual: '\u227c',
              PrecedesTilde: '\u227e',
              preceq: '\u2aaf',
              precnapprox: '\u2ab9',
              precneqq: '\u2ab5',
              precnsim: '\u22e8',
              pre: '\u2aaf',
              prE: '\u2ab3',
              precsim: '\u227e',
              prime: '\u2032',
              Prime: '\u2033',
              primes: '\u2119',
              prnap: '\u2ab9',
              prnE: '\u2ab5',
              prnsim: '\u22e8',
              prod: '\u220f',
              Product: '\u220f',
              profalar: '\u232e',
              profline: '\u2312',
              profsurf: '\u2313',
              prop: '\u221d',
              Proportional: '\u221d',
              Proportion: '\u2237',
              propto: '\u221d',
              prsim: '\u227e',
              prurel: '\u22b0',
              Pscr: '\ud835\udcab',
              pscr: '\ud835\udcc5',
              Psi: '\u03a8',
              psi: '\u03c8',
              puncsp: '\u2008',
              Qfr: '\ud835\udd14',
              qfr: '\ud835\udd2e',
              qint: '\u2a0c',
              qopf: '\ud835\udd62',
              Qopf: '\u211a',
              qprime: '\u2057',
              Qscr: '\ud835\udcac',
              qscr: '\ud835\udcc6',
              quaternions: '\u210d',
              quatint: '\u2a16',
              quest: '?',
              questeq: '\u225f',
              quot: '"',
              QUOT: '"',
              rAarr: '\u21db',
              race: '\u223d\u0331',
              Racute: '\u0154',
              racute: '\u0155',
              radic: '\u221a',
              raemptyv: '\u29b3',
              rang: '\u27e9',
              Rang: '\u27eb',
              rangd: '\u2992',
              range: '\u29a5',
              rangle: '\u27e9',
              raquo: '\xbb',
              rarrap: '\u2975',
              rarrb: '\u21e5',
              rarrbfs: '\u2920',
              rarrc: '\u2933',
              rarr: '\u2192',
              Rarr: '\u21a0',
              rArr: '\u21d2',
              rarrfs: '\u291e',
              rarrhk: '\u21aa',
              rarrlp: '\u21ac',
              rarrpl: '\u2945',
              rarrsim: '\u2974',
              Rarrtl: '\u2916',
              rarrtl: '\u21a3',
              rarrw: '\u219d',
              ratail: '\u291a',
              rAtail: '\u291c',
              ratio: '\u2236',
              rationals: '\u211a',
              rbarr: '\u290d',
              rBarr: '\u290f',
              RBarr: '\u2910',
              rbbrk: '\u2773',
              rbrace: '}',
              rbrack: ']',
              rbrke: '\u298c',
              rbrksld: '\u298e',
              rbrkslu: '\u2990',
              Rcaron: '\u0158',
              rcaron: '\u0159',
              Rcedil: '\u0156',
              rcedil: '\u0157',
              rceil: '\u2309',
              rcub: '}',
              Rcy: '\u0420',
              rcy: '\u0440',
              rdca: '\u2937',
              rdldhar: '\u2969',
              rdquo: '\u201d',
              rdquor: '\u201d',
              rdsh: '\u21b3',
              real: '\u211c',
              realine: '\u211b',
              realpart: '\u211c',
              reals: '\u211d',
              Re: '\u211c',
              rect: '\u25ad',
              reg: '\xae',
              REG: '\xae',
              ReverseElement: '\u220b',
              ReverseEquilibrium: '\u21cb',
              ReverseUpEquilibrium: '\u296f',
              rfisht: '\u297d',
              rfloor: '\u230b',
              rfr: '\ud835\udd2f',
              Rfr: '\u211c',
              rHar: '\u2964',
              rhard: '\u21c1',
              rharu: '\u21c0',
              rharul: '\u296c',
              Rho: '\u03a1',
              rho: '\u03c1',
              rhov: '\u03f1',
              RightAngleBracket: '\u27e9',
              RightArrowBar: '\u21e5',
              rightarrow: '\u2192',
              RightArrow: '\u2192',
              Rightarrow: '\u21d2',
              RightArrowLeftArrow: '\u21c4',
              rightarrowtail: '\u21a3',
              RightCeiling: '\u2309',
              RightDoubleBracket: '\u27e7',
              RightDownTeeVector: '\u295d',
              RightDownVectorBar: '\u2955',
              RightDownVector: '\u21c2',
              RightFloor: '\u230b',
              rightharpoondown: '\u21c1',
              rightharpoonup: '\u21c0',
              rightleftarrows: '\u21c4',
              rightleftharpoons: '\u21cc',
              rightrightarrows: '\u21c9',
              rightsquigarrow: '\u219d',
              RightTeeArrow: '\u21a6',
              RightTee: '\u22a2',
              RightTeeVector: '\u295b',
              rightthreetimes: '\u22cc',
              RightTriangleBar: '\u29d0',
              RightTriangle: '\u22b3',
              RightTriangleEqual: '\u22b5',
              RightUpDownVector: '\u294f',
              RightUpTeeVector: '\u295c',
              RightUpVectorBar: '\u2954',
              RightUpVector: '\u21be',
              RightVectorBar: '\u2953',
              RightVector: '\u21c0',
              ring: '\u02da',
              risingdotseq: '\u2253',
              rlarr: '\u21c4',
              rlhar: '\u21cc',
              rlm: '\u200f',
              rmoustache: '\u23b1',
              rmoust: '\u23b1',
              rnmid: '\u2aee',
              roang: '\u27ed',
              roarr: '\u21fe',
              robrk: '\u27e7',
              ropar: '\u2986',
              ropf: '\ud835\udd63',
              Ropf: '\u211d',
              roplus: '\u2a2e',
              rotimes: '\u2a35',
              RoundImplies: '\u2970',
              rpar: ')',
              rpargt: '\u2994',
              rppolint: '\u2a12',
              rrarr: '\u21c9',
              Rrightarrow: '\u21db',
              rsaquo: '\u203a',
              rscr: '\ud835\udcc7',
              Rscr: '\u211b',
              rsh: '\u21b1',
              Rsh: '\u21b1',
              rsqb: ']',
              rsquo: '\u2019',
              rsquor: '\u2019',
              rthree: '\u22cc',
              rtimes: '\u22ca',
              rtri: '\u25b9',
              rtrie: '\u22b5',
              rtrif: '\u25b8',
              rtriltri: '\u29ce',
              RuleDelayed: '\u29f4',
              ruluhar: '\u2968',
              rx: '\u211e',
              Sacute: '\u015a',
              sacute: '\u015b',
              sbquo: '\u201a',
              scap: '\u2ab8',
              Scaron: '\u0160',
              scaron: '\u0161',
              Sc: '\u2abc',
              sc: '\u227b',
              sccue: '\u227d',
              sce: '\u2ab0',
              scE: '\u2ab4',
              Scedil: '\u015e',
              scedil: '\u015f',
              Scirc: '\u015c',
              scirc: '\u015d',
              scnap: '\u2aba',
              scnE: '\u2ab6',
              scnsim: '\u22e9',
              scpolint: '\u2a13',
              scsim: '\u227f',
              Scy: '\u0421',
              scy: '\u0441',
              sdotb: '\u22a1',
              sdot: '\u22c5',
              sdote: '\u2a66',
              searhk: '\u2925',
              searr: '\u2198',
              seArr: '\u21d8',
              searrow: '\u2198',
              sect: '\xa7',
              semi: ';',
              seswar: '\u2929',
              setminus: '\u2216',
              setmn: '\u2216',
              sext: '\u2736',
              Sfr: '\ud835\udd16',
              sfr: '\ud835\udd30',
              sfrown: '\u2322',
              sharp: '\u266f',
              SHCHcy: '\u0429',
              shchcy: '\u0449',
              SHcy: '\u0428',
              shcy: '\u0448',
              ShortDownArrow: '\u2193',
              ShortLeftArrow: '\u2190',
              shortmid: '\u2223',
              shortparallel: '\u2225',
              ShortRightArrow: '\u2192',
              ShortUpArrow: '\u2191',
              shy: '\xad',
              Sigma: '\u03a3',
              sigma: '\u03c3',
              sigmaf: '\u03c2',
              sigmav: '\u03c2',
              sim: '\u223c',
              simdot: '\u2a6a',
              sime: '\u2243',
              simeq: '\u2243',
              simg: '\u2a9e',
              simgE: '\u2aa0',
              siml: '\u2a9d',
              simlE: '\u2a9f',
              simne: '\u2246',
              simplus: '\u2a24',
              simrarr: '\u2972',
              slarr: '\u2190',
              SmallCircle: '\u2218',
              smallsetminus: '\u2216',
              smashp: '\u2a33',
              smeparsl: '\u29e4',
              smid: '\u2223',
              smile: '\u2323',
              smt: '\u2aaa',
              smte: '\u2aac',
              smtes: '\u2aac\ufe00',
              SOFTcy: '\u042c',
              softcy: '\u044c',
              solbar: '\u233f',
              solb: '\u29c4',
              sol: '/',
              Sopf: '\ud835\udd4a',
              sopf: '\ud835\udd64',
              spades: '\u2660',
              spadesuit: '\u2660',
              spar: '\u2225',
              sqcap: '\u2293',
              sqcaps: '\u2293\ufe00',
              sqcup: '\u2294',
              sqcups: '\u2294\ufe00',
              Sqrt: '\u221a',
              sqsub: '\u228f',
              sqsube: '\u2291',
              sqsubset: '\u228f',
              sqsubseteq: '\u2291',
              sqsup: '\u2290',
              sqsupe: '\u2292',
              sqsupset: '\u2290',
              sqsupseteq: '\u2292',
              square: '\u25a1',
              Square: '\u25a1',
              SquareIntersection: '\u2293',
              SquareSubset: '\u228f',
              SquareSubsetEqual: '\u2291',
              SquareSuperset: '\u2290',
              SquareSupersetEqual: '\u2292',
              SquareUnion: '\u2294',
              squarf: '\u25aa',
              squ: '\u25a1',
              squf: '\u25aa',
              srarr: '\u2192',
              Sscr: '\ud835\udcae',
              sscr: '\ud835\udcc8',
              ssetmn: '\u2216',
              ssmile: '\u2323',
              sstarf: '\u22c6',
              Star: '\u22c6',
              star: '\u2606',
              starf: '\u2605',
              straightepsilon: '\u03f5',
              straightphi: '\u03d5',
              strns: '\xaf',
              sub: '\u2282',
              Sub: '\u22d0',
              subdot: '\u2abd',
              subE: '\u2ac5',
              sube: '\u2286',
              subedot: '\u2ac3',
              submult: '\u2ac1',
              subnE: '\u2acb',
              subne: '\u228a',
              subplus: '\u2abf',
              subrarr: '\u2979',
              subset: '\u2282',
              Subset: '\u22d0',
              subseteq: '\u2286',
              subseteqq: '\u2ac5',
              SubsetEqual: '\u2286',
              subsetneq: '\u228a',
              subsetneqq: '\u2acb',
              subsim: '\u2ac7',
              subsub: '\u2ad5',
              subsup: '\u2ad3',
              succapprox: '\u2ab8',
              succ: '\u227b',
              succcurlyeq: '\u227d',
              Succeeds: '\u227b',
              SucceedsEqual: '\u2ab0',
              SucceedsSlantEqual: '\u227d',
              SucceedsTilde: '\u227f',
              succeq: '\u2ab0',
              succnapprox: '\u2aba',
              succneqq: '\u2ab6',
              succnsim: '\u22e9',
              succsim: '\u227f',
              SuchThat: '\u220b',
              sum: '\u2211',
              Sum: '\u2211',
              sung: '\u266a',
              sup1: '\xb9',
              sup2: '\xb2',
              sup3: '\xb3',
              sup: '\u2283',
              Sup: '\u22d1',
              supdot: '\u2abe',
              supdsub: '\u2ad8',
              supE: '\u2ac6',
              supe: '\u2287',
              supedot: '\u2ac4',
              Superset: '\u2283',
              SupersetEqual: '\u2287',
              suphsol: '\u27c9',
              suphsub: '\u2ad7',
              suplarr: '\u297b',
              supmult: '\u2ac2',
              supnE: '\u2acc',
              supne: '\u228b',
              supplus: '\u2ac0',
              supset: '\u2283',
              Supset: '\u22d1',
              supseteq: '\u2287',
              supseteqq: '\u2ac6',
              supsetneq: '\u228b',
              supsetneqq: '\u2acc',
              supsim: '\u2ac8',
              supsub: '\u2ad4',
              supsup: '\u2ad6',
              swarhk: '\u2926',
              swarr: '\u2199',
              swArr: '\u21d9',
              swarrow: '\u2199',
              swnwar: '\u292a',
              szlig: '\xdf',
              Tab: '\t',
              target: '\u2316',
              Tau: '\u03a4',
              tau: '\u03c4',
              tbrk: '\u23b4',
              Tcaron: '\u0164',
              tcaron: '\u0165',
              Tcedil: '\u0162',
              tcedil: '\u0163',
              Tcy: '\u0422',
              tcy: '\u0442',
              tdot: '\u20db',
              telrec: '\u2315',
              Tfr: '\ud835\udd17',
              tfr: '\ud835\udd31',
              there4: '\u2234',
              therefore: '\u2234',
              Therefore: '\u2234',
              Theta: '\u0398',
              theta: '\u03b8',
              thetasym: '\u03d1',
              thetav: '\u03d1',
              thickapprox: '\u2248',
              thicksim: '\u223c',
              ThickSpace: '\u205f\u200a',
              ThinSpace: '\u2009',
              thinsp: '\u2009',
              thkap: '\u2248',
              thksim: '\u223c',
              THORN: '\xde',
              thorn: '\xfe',
              tilde: '\u02dc',
              Tilde: '\u223c',
              TildeEqual: '\u2243',
              TildeFullEqual: '\u2245',
              TildeTilde: '\u2248',
              timesbar: '\u2a31',
              timesb: '\u22a0',
              times: '\xd7',
              timesd: '\u2a30',
              tint: '\u222d',
              toea: '\u2928',
              topbot: '\u2336',
              topcir: '\u2af1',
              top: '\u22a4',
              Topf: '\ud835\udd4b',
              topf: '\ud835\udd65',
              topfork: '\u2ada',
              tosa: '\u2929',
              tprime: '\u2034',
              trade: '\u2122',
              TRADE: '\u2122',
              triangle: '\u25b5',
              triangledown: '\u25bf',
              triangleleft: '\u25c3',
              trianglelefteq: '\u22b4',
              triangleq: '\u225c',
              triangleright: '\u25b9',
              trianglerighteq: '\u22b5',
              tridot: '\u25ec',
              trie: '\u225c',
              triminus: '\u2a3a',
              TripleDot: '\u20db',
              triplus: '\u2a39',
              trisb: '\u29cd',
              tritime: '\u2a3b',
              trpezium: '\u23e2',
              Tscr: '\ud835\udcaf',
              tscr: '\ud835\udcc9',
              TScy: '\u0426',
              tscy: '\u0446',
              TSHcy: '\u040b',
              tshcy: '\u045b',
              Tstrok: '\u0166',
              tstrok: '\u0167',
              twixt: '\u226c',
              twoheadleftarrow: '\u219e',
              twoheadrightarrow: '\u21a0',
              Uacute: '\xda',
              uacute: '\xfa',
              uarr: '\u2191',
              Uarr: '\u219f',
              uArr: '\u21d1',
              Uarrocir: '\u2949',
              Ubrcy: '\u040e',
              ubrcy: '\u045e',
              Ubreve: '\u016c',
              ubreve: '\u016d',
              Ucirc: '\xdb',
              ucirc: '\xfb',
              Ucy: '\u0423',
              ucy: '\u0443',
              udarr: '\u21c5',
              Udblac: '\u0170',
              udblac: '\u0171',
              udhar: '\u296e',
              ufisht: '\u297e',
              Ufr: '\ud835\udd18',
              ufr: '\ud835\udd32',
              Ugrave: '\xd9',
              ugrave: '\xf9',
              uHar: '\u2963',
              uharl: '\u21bf',
              uharr: '\u21be',
              uhblk: '\u2580',
              ulcorn: '\u231c',
              ulcorner: '\u231c',
              ulcrop: '\u230f',
              ultri: '\u25f8',
              Umacr: '\u016a',
              umacr: '\u016b',
              uml: '\xa8',
              UnderBar: '_',
              UnderBrace: '\u23df',
              UnderBracket: '\u23b5',
              UnderParenthesis: '\u23dd',
              Union: '\u22c3',
              UnionPlus: '\u228e',
              Uogon: '\u0172',
              uogon: '\u0173',
              Uopf: '\ud835\udd4c',
              uopf: '\ud835\udd66',
              UpArrowBar: '\u2912',
              uparrow: '\u2191',
              UpArrow: '\u2191',
              Uparrow: '\u21d1',
              UpArrowDownArrow: '\u21c5',
              updownarrow: '\u2195',
              UpDownArrow: '\u2195',
              Updownarrow: '\u21d5',
              UpEquilibrium: '\u296e',
              upharpoonleft: '\u21bf',
              upharpoonright: '\u21be',
              uplus: '\u228e',
              UpperLeftArrow: '\u2196',
              UpperRightArrow: '\u2197',
              upsi: '\u03c5',
              Upsi: '\u03d2',
              upsih: '\u03d2',
              Upsilon: '\u03a5',
              upsilon: '\u03c5',
              UpTeeArrow: '\u21a5',
              UpTee: '\u22a5',
              upuparrows: '\u21c8',
              urcorn: '\u231d',
              urcorner: '\u231d',
              urcrop: '\u230e',
              Uring: '\u016e',
              uring: '\u016f',
              urtri: '\u25f9',
              Uscr: '\ud835\udcb0',
              uscr: '\ud835\udcca',
              utdot: '\u22f0',
              Utilde: '\u0168',
              utilde: '\u0169',
              utri: '\u25b5',
              utrif: '\u25b4',
              uuarr: '\u21c8',
              Uuml: '\xdc',
              uuml: '\xfc',
              uwangle: '\u29a7',
              vangrt: '\u299c',
              varepsilon: '\u03f5',
              varkappa: '\u03f0',
              varnothing: '\u2205',
              varphi: '\u03d5',
              varpi: '\u03d6',
              varpropto: '\u221d',
              varr: '\u2195',
              vArr: '\u21d5',
              varrho: '\u03f1',
              varsigma: '\u03c2',
              varsubsetneq: '\u228a\ufe00',
              varsubsetneqq: '\u2acb\ufe00',
              varsupsetneq: '\u228b\ufe00',
              varsupsetneqq: '\u2acc\ufe00',
              vartheta: '\u03d1',
              vartriangleleft: '\u22b2',
              vartriangleright: '\u22b3',
              vBar: '\u2ae8',
              Vbar: '\u2aeb',
              vBarv: '\u2ae9',
              Vcy: '\u0412',
              vcy: '\u0432',
              vdash: '\u22a2',
              vDash: '\u22a8',
              Vdash: '\u22a9',
              VDash: '\u22ab',
              Vdashl: '\u2ae6',
              veebar: '\u22bb',
              vee: '\u2228',
              Vee: '\u22c1',
              veeeq: '\u225a',
              vellip: '\u22ee',
              verbar: '|',
              Verbar: '\u2016',
              vert: '|',
              Vert: '\u2016',
              VerticalBar: '\u2223',
              VerticalLine: '|',
              VerticalSeparator: '\u2758',
              VerticalTilde: '\u2240',
              VeryThinSpace: '\u200a',
              Vfr: '\ud835\udd19',
              vfr: '\ud835\udd33',
              vltri: '\u22b2',
              vnsub: '\u2282\u20d2',
              vnsup: '\u2283\u20d2',
              Vopf: '\ud835\udd4d',
              vopf: '\ud835\udd67',
              vprop: '\u221d',
              vrtri: '\u22b3',
              Vscr: '\ud835\udcb1',
              vscr: '\ud835\udccb',
              vsubnE: '\u2acb\ufe00',
              vsubne: '\u228a\ufe00',
              vsupnE: '\u2acc\ufe00',
              vsupne: '\u228b\ufe00',
              Vvdash: '\u22aa',
              vzigzag: '\u299a',
              Wcirc: '\u0174',
              wcirc: '\u0175',
              wedbar: '\u2a5f',
              wedge: '\u2227',
              Wedge: '\u22c0',
              wedgeq: '\u2259',
              weierp: '\u2118',
              Wfr: '\ud835\udd1a',
              wfr: '\ud835\udd34',
              Wopf: '\ud835\udd4e',
              wopf: '\ud835\udd68',
              wp: '\u2118',
              wr: '\u2240',
              wreath: '\u2240',
              Wscr: '\ud835\udcb2',
              wscr: '\ud835\udccc',
              xcap: '\u22c2',
              xcirc: '\u25ef',
              xcup: '\u22c3',
              xdtri: '\u25bd',
              Xfr: '\ud835\udd1b',
              xfr: '\ud835\udd35',
              xharr: '\u27f7',
              xhArr: '\u27fa',
              Xi: '\u039e',
              xi: '\u03be',
              xlarr: '\u27f5',
              xlArr: '\u27f8',
              xmap: '\u27fc',
              xnis: '\u22fb',
              xodot: '\u2a00',
              Xopf: '\ud835\udd4f',
              xopf: '\ud835\udd69',
              xoplus: '\u2a01',
              xotime: '\u2a02',
              xrarr: '\u27f6',
              xrArr: '\u27f9',
              Xscr: '\ud835\udcb3',
              xscr: '\ud835\udccd',
              xsqcup: '\u2a06',
              xuplus: '\u2a04',
              xutri: '\u25b3',
              xvee: '\u22c1',
              xwedge: '\u22c0',
              Yacute: '\xdd',
              yacute: '\xfd',
              YAcy: '\u042f',
              yacy: '\u044f',
              Ycirc: '\u0176',
              ycirc: '\u0177',
              Ycy: '\u042b',
              ycy: '\u044b',
              yen: '\xa5',
              Yfr: '\ud835\udd1c',
              yfr: '\ud835\udd36',
              YIcy: '\u0407',
              yicy: '\u0457',
              Yopf: '\ud835\udd50',
              yopf: '\ud835\udd6a',
              Yscr: '\ud835\udcb4',
              yscr: '\ud835\udcce',
              YUcy: '\u042e',
              yucy: '\u044e',
              yuml: '\xff',
              Yuml: '\u0178',
              Zacute: '\u0179',
              zacute: '\u017a',
              Zcaron: '\u017d',
              zcaron: '\u017e',
              Zcy: '\u0417',
              zcy: '\u0437',
              Zdot: '\u017b',
              zdot: '\u017c',
              zeetrf: '\u2128',
              ZeroWidthSpace: '\u200b',
              Zeta: '\u0396',
              zeta: '\u03b6',
              zfr: '\ud835\udd37',
              Zfr: '\u2128',
              ZHcy: '\u0416',
              zhcy: '\u0436',
              zigrarr: '\u21dd',
              zopf: '\ud835\udd6b',
              Zopf: '\u2124',
              Zscr: '\ud835\udcb5',
              zscr: '\ud835\udccf',
              zwj: '\u200d',
              zwnj: '\u200c',
            };
          },
          {},
        ],
        53: [
          function(e, r, t) {
            'use strict';
            function n(e) {
              var r = Array.prototype.slice.call(arguments, 1);
              return (
                r.forEach(function(r) {
                  r &&
                    Object.keys(r).forEach(function(t) {
                      e[t] = r[t];
                    });
                }),
                e
              );
            }
            function s(e) {
              return Object.prototype.toString.call(e);
            }
            function o(e) {
              return '[object String]' === s(e);
            }
            function i(e) {
              return '[object Object]' === s(e);
            }
            function a(e) {
              return '[object RegExp]' === s(e);
            }
            function c(e) {
              return '[object Function]' === s(e);
            }
            function l(e) {
              return e.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
            }
            function u(e) {
              return Object.keys(e || {}).reduce(function(e, r) {
                return e || k.hasOwnProperty(r);
              }, !1);
            }
            function p(e) {
              (e.__index__ = -1), (e.__text_cache__ = '');
            }
            function h(e) {
              return function(r, t) {
                var n = r.slice(t);
                return e.test(n) ? n.match(e)[0].length : 0;
              };
            }
            function f() {
              return function(e, r) {
                r.normalize(e);
              };
            }
            function d(r) {
              function t(e) {
                return e.replace('%TLDS%', s.src_tlds);
              }
              function n(e, r) {
                throw new Error('(LinkifyIt) Invalid schema "' + e + '": ' + r);
              }
              var s = (r.re = e('./lib/re')(r.__opts__)),
                u = r.__tlds__.slice();
              r.onCompile(),
                r.__tlds_replaced__ || u.push(v),
                u.push(s.src_xn),
                (s.src_tlds = u.join('|')),
                (s.email_fuzzy = RegExp(t(s.tpl_email_fuzzy), 'i')),
                (s.link_fuzzy = RegExp(t(s.tpl_link_fuzzy), 'i')),
                (s.link_no_ip_fuzzy = RegExp(t(s.tpl_link_no_ip_fuzzy), 'i')),
                (s.host_fuzzy_test = RegExp(t(s.tpl_host_fuzzy_test), 'i'));
              var d = [];
              (r.__compiled__ = {}),
                Object.keys(r.__schemas__).forEach(function(e) {
                  var t = r.__schemas__[e];
                  if (null !== t) {
                    var s = { validate: null, link: null };
                    return (
                      (r.__compiled__[e] = s),
                      i(t)
                        ? (a(t.validate)
                            ? (s.validate = h(t.validate))
                            : c(t.validate)
                            ? (s.validate = t.validate)
                            : n(e, t),
                          void (c(t.normalize)
                            ? (s.normalize = t.normalize)
                            : t.normalize
                            ? n(e, t)
                            : (s.normalize = f())))
                        : o(t)
                        ? void d.push(e)
                        : void n(e, t)
                    );
                  }
                }),
                d.forEach(function(e) {
                  r.__compiled__[r.__schemas__[e]] &&
                    ((r.__compiled__[e].validate = r.__compiled__[r.__schemas__[e]].validate),
                    (r.__compiled__[e].normalize = r.__compiled__[r.__schemas__[e]].normalize));
                }),
                (r.__compiled__[''] = { validate: null, normalize: f() });
              var m = Object.keys(r.__compiled__)
                .filter(function(e) {
                  return e.length > 0 && r.__compiled__[e];
                })
                .map(l)
                .join('|');
              (r.re.schema_test = RegExp('(^|(?!_)(?:[><]|' + s.src_ZPCc + '))(' + m + ')', 'i')),
                (r.re.schema_search = RegExp(
                  '(^|(?!_)(?:[><]|' + s.src_ZPCc + '))(' + m + ')',
                  'ig',
                )),
                (r.re.pretest = RegExp(
                  '(' + r.re.schema_test.source + ')|(' + r.re.host_fuzzy_test.source + ')|@',
                  'i',
                )),
                p(r);
            }
            function m(e, r) {
              var t = e.__index__,
                n = e.__last_index__,
                s = e.__text_cache__.slice(t, n);
              (this.schema = e.__schema__.toLowerCase()),
                (this.index = t + r),
                (this.lastIndex = n + r),
                (this.raw = s),
                (this.text = s),
                (this.url = s);
            }
            function _(e, r) {
              var t = new m(e, r);
              return e.__compiled__[t.schema].normalize(t, e), t;
            }
            function g(e, r) {
              return this instanceof g
                ? (r || (u(e) && ((r = e), (e = {}))),
                  (this.__opts__ = n({}, k, r)),
                  (this.__index__ = -1),
                  (this.__last_index__ = -1),
                  (this.__schema__ = ''),
                  (this.__text_cache__ = ''),
                  (this.__schemas__ = n({}, b, e)),
                  (this.__compiled__ = {}),
                  (this.__tlds__ = y),
                  (this.__tlds_replaced__ = !1),
                  (this.re = {}),
                  void d(this))
                : new g(e, r);
            }
            var k = { fuzzyLink: !0, fuzzyEmail: !0, fuzzyIP: !1 },
              b = {
                'http:': {
                  validate: function(e, r, t) {
                    var n = e.slice(r);
                    return (
                      t.re.http ||
                        (t.re.http = new RegExp(
                          '^\\/\\/' + t.re.src_auth + t.re.src_host_port_strict + t.re.src_path,
                          'i',
                        )),
                      t.re.http.test(n) ? n.match(t.re.http)[0].length : 0
                    );
                  },
                },
                'https:': 'http:',
                'ftp:': 'http:',
                '//': {
                  validate: function(e, r, t) {
                    var n = e.slice(r);
                    return (
                      t.re.no_http ||
                        (t.re.no_http = new RegExp(
                          '^' +
                            t.re.src_auth +
                            '(?:localhost|(?:(?:' +
                            t.re.src_domain +
                            ')\\.)+' +
                            t.re.src_domain_root +
                            ')' +
                            t.re.src_port +
                            t.re.src_host_terminator +
                            t.re.src_path,
                          'i',
                        )),
                      t.re.no_http.test(n)
                        ? r >= 3 && ':' === e[r - 3]
                          ? 0
                          : r >= 3 && '/' === e[r - 3]
                          ? 0
                          : n.match(t.re.no_http)[0].length
                        : 0
                    );
                  },
                },
                'mailto:': {
                  validate: function(e, r, t) {
                    var n = e.slice(r);
                    return (
                      t.re.mailto ||
                        (t.re.mailto = new RegExp(
                          '^' + t.re.src_email_name + '@' + t.re.src_host_strict,
                          'i',
                        )),
                      t.re.mailto.test(n) ? n.match(t.re.mailto)[0].length : 0
                    );
                  },
                },
              },
              v =
                'a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]',
              y = 'biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444'.split(
                '|',
              );
            (g.prototype.add = function(e, r) {
              return (this.__schemas__[e] = r), d(this), this;
            }),
              (g.prototype.set = function(e) {
                return (this.__opts__ = n(this.__opts__, e)), this;
              }),
              (g.prototype.test = function(e) {
                if (((this.__text_cache__ = e), (this.__index__ = -1), !e.length)) return !1;
                var r, t, n, s, o, i, a, c, l;
                if (this.re.schema_test.test(e))
                  for (a = this.re.schema_search, a.lastIndex = 0; null !== (r = a.exec(e)); )
                    if ((s = this.testSchemaAt(e, r[2], a.lastIndex))) {
                      (this.__schema__ = r[2]),
                        (this.__index__ = r.index + r[1].length),
                        (this.__last_index__ = r.index + r[0].length + s);
                      break;
                    }
                return (
                  this.__opts__.fuzzyLink &&
                    this.__compiled__['http:'] &&
                    ((c = e.search(this.re.host_fuzzy_test)),
                    c >= 0 &&
                      (this.__index__ < 0 || c < this.__index__) &&
                      null !==
                        (t = e.match(
                          this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy,
                        )) &&
                      ((o = t.index + t[1].length),
                      (this.__index__ < 0 || o < this.__index__) &&
                        ((this.__schema__ = ''),
                        (this.__index__ = o),
                        (this.__last_index__ = t.index + t[0].length)))),
                  this.__opts__.fuzzyEmail &&
                    this.__compiled__['mailto:'] &&
                    ((l = e.indexOf('@')),
                    l >= 0 &&
                      null !== (n = e.match(this.re.email_fuzzy)) &&
                      ((o = n.index + n[1].length),
                      (i = n.index + n[0].length),
                      (this.__index__ < 0 ||
                        o < this.__index__ ||
                        (o === this.__index__ && i > this.__last_index__)) &&
                        ((this.__schema__ = 'mailto:'),
                        (this.__index__ = o),
                        (this.__last_index__ = i)))),
                  this.__index__ >= 0
                );
              }),
              (g.prototype.pretest = function(e) {
                return this.re.pretest.test(e);
              }),
              (g.prototype.testSchemaAt = function(e, r, t) {
                return this.__compiled__[r.toLowerCase()]
                  ? this.__compiled__[r.toLowerCase()].validate(e, t, this)
                  : 0;
              }),
              (g.prototype.match = function(e) {
                var r = 0,
                  t = [];
                this.__index__ >= 0 &&
                  this.__text_cache__ === e &&
                  (t.push(_(this, r)), (r = this.__last_index__));
                for (var n = r ? e.slice(r) : e; this.test(n); )
                  t.push(_(this, r)),
                    (n = n.slice(this.__last_index__)),
                    (r += this.__last_index__);
                return t.length ? t : null;
              }),
              (g.prototype.tlds = function(e, r) {
                return (
                  (e = Array.isArray(e) ? e : [e]),
                  r
                    ? ((this.__tlds__ = this.__tlds__
                        .concat(e)
                        .sort()
                        .filter(function(e, r, t) {
                          return e !== t[r - 1];
                        })
                        .reverse()),
                      d(this),
                      this)
                    : ((this.__tlds__ = e.slice()), (this.__tlds_replaced__ = !0), d(this), this)
                );
              }),
              (g.prototype.normalize = function(e) {
                e.schema || (e.url = 'http://' + e.url),
                  'mailto:' !== e.schema || /^mailto:/i.test(e.url) || (e.url = 'mailto:' + e.url);
              }),
              (g.prototype.onCompile = function() {}),
              (r.exports = g);
          },
          { './lib/re': 54 },
        ],
        54: [
          function(e, r, t) {
            'use strict';
            r.exports = function(r) {
              var t = {};
              return (
                (t.src_Any = e('uc.micro/properties/Any/regex').source),
                (t.src_Cc = e('uc.micro/categories/Cc/regex').source),
                (t.src_Z = e('uc.micro/categories/Z/regex').source),
                (t.src_P = e('uc.micro/categories/P/regex').source),
                (t.src_ZPCc = [t.src_Z, t.src_P, t.src_Cc].join('|')),
                (t.src_ZCc = [t.src_Z, t.src_Cc].join('|')),
                (t.src_pseudo_letter = '(?:(?!>|<|' + t.src_ZPCc + ')' + t.src_Any + ')'),
                (t.src_ip4 =
                  '(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'),
                (t.src_auth = '(?:(?:(?!' + t.src_ZCc + '|[@/]).)+@)?'),
                (t.src_port =
                  '(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?'),
                (t.src_host_terminator =
                  '(?=$|>|<|' + t.src_ZPCc + ')(?!-|_|:\\d|\\.-|\\.(?!$|' + t.src_ZPCc + '))'),
                (t.src_path =
                  '(?:[/?#](?:(?!' +
                  t.src_ZCc +
                  '|[()[\\]{}.,"\'?!\\-<>]).|\\[(?:(?!' +
                  t.src_ZCc +
                  '|\\]).)*\\]|\\((?:(?!' +
                  t.src_ZCc +
                  '|[)]).)*\\)|\\{(?:(?!' +
                  t.src_ZCc +
                  '|[}]).)*\\}|\\"(?:(?!' +
                  t.src_ZCc +
                  '|["]).)+\\"|\\\'(?:(?!' +
                  t.src_ZCc +
                  "|[']).)+\\'|\\'(?=" +
                  t.src_pseudo_letter +
                  '|[-]).|\\.{2,3}[a-zA-Z0-9%/]|\\.(?!' +
                  t.src_ZCc +
                  '|[.]).|' +
                  (r && r['---'] ? '\\-(?!--(?:[^-]|$))(?:-*)|' : '\\-+|') +
                  '\\,(?!' +
                  t.src_ZCc +
                  ').|\\!(?!' +
                  t.src_ZCc +
                  '|[!]).|\\?(?!' +
                  t.src_ZCc +
                  '|[?]).)+|\\/)?'),
                (t.src_email_name = '[\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]+'),
                (t.src_xn = 'xn--[a-z0-9\\-]{1,59}'),
                (t.src_domain_root = '(?:' + t.src_xn + '|' + t.src_pseudo_letter + '{1,63})'),
                (t.src_domain =
                  '(?:' +
                  t.src_xn +
                  '|(?:' +
                  t.src_pseudo_letter +
                  ')|(?:' +
                  t.src_pseudo_letter +
                  '(?:-(?!-)|' +
                  t.src_pseudo_letter +
                  '){0,61}' +
                  t.src_pseudo_letter +
                  '))'),
                (t.src_host = '(?:(?:(?:(?:' + t.src_domain + ')\\.)*' + t.src_domain_root + '))'),
                (t.tpl_host_fuzzy =
                  '(?:' + t.src_ip4 + '|(?:(?:(?:' + t.src_domain + ')\\.)+(?:%TLDS%)))'),
                (t.tpl_host_no_ip_fuzzy = '(?:(?:(?:' + t.src_domain + ')\\.)+(?:%TLDS%))'),
                (t.src_host_strict = t.src_host + t.src_host_terminator),
                (t.tpl_host_fuzzy_strict = t.tpl_host_fuzzy + t.src_host_terminator),
                (t.src_host_port_strict = t.src_host + t.src_port + t.src_host_terminator),
                (t.tpl_host_port_fuzzy_strict =
                  t.tpl_host_fuzzy + t.src_port + t.src_host_terminator),
                (t.tpl_host_port_no_ip_fuzzy_strict =
                  t.tpl_host_no_ip_fuzzy + t.src_port + t.src_host_terminator),
                (t.tpl_host_fuzzy_test =
                  'localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:' + t.src_ZPCc + '|>|$))'),
                (t.tpl_email_fuzzy =
                  '(^|<|>|\\(|' +
                  t.src_ZCc +
                  ')(' +
                  t.src_email_name +
                  '@' +
                  t.tpl_host_fuzzy_strict +
                  ')'),
                (t.tpl_link_fuzzy =
                  '(^|(?![.:/\\-_@])(?:[$+<=>^`|]|' +
                  t.src_ZPCc +
                  '))((?![$+<=>^`|])' +
                  t.tpl_host_port_fuzzy_strict +
                  t.src_path +
                  ')'),
                (t.tpl_link_no_ip_fuzzy =
                  '(^|(?![.:/\\-_@])(?:[$+<=>^`|]|' +
                  t.src_ZPCc +
                  '))((?![$+<=>^`|])' +
                  t.tpl_host_port_no_ip_fuzzy_strict +
                  t.src_path +
                  ')'),
                t
              );
            };
          },
          {
            'uc.micro/categories/Cc/regex': 61,
            'uc.micro/categories/P/regex': 63,
            'uc.micro/categories/Z/regex': 64,
            'uc.micro/properties/Any/regex': 66,
          },
        ],
        55: [
          function(e, r, t) {
            'use strict';
            function n(e) {
              var r,
                t,
                n = o[e];
              if (n) return n;
              for (n = o[e] = [], r = 0; r < 128; r++) (t = String.fromCharCode(r)), n.push(t);
              for (r = 0; r < e.length; r++)
                (t = e.charCodeAt(r)),
                  (n[t] = '%' + ('0' + t.toString(16).toUpperCase()).slice(-2));
              return n;
            }
            function s(e, r) {
              var t;
              return (
                'string' != typeof r && (r = s.defaultChars),
                (t = n(r)),
                e.replace(/(%[a-f0-9]{2})+/gi, function(e) {
                  var r,
                    n,
                    s,
                    o,
                    i,
                    a,
                    c,
                    l = '';
                  for (r = 0, n = e.length; r < n; r += 3)
                    (s = parseInt(e.slice(r + 1, r + 3), 16)),
                      s < 128
                        ? (l += t[s])
                        : 192 === (224 & s) &&
                          r + 3 < n &&
                          ((o = parseInt(e.slice(r + 4, r + 6), 16)), 128 === (192 & o))
                        ? ((c = ((s << 6) & 1984) | (63 & o)),
                          (l += c < 128 ? '\ufffd\ufffd' : String.fromCharCode(c)),
                          (r += 3))
                        : 224 === (240 & s) &&
                          r + 6 < n &&
                          ((o = parseInt(e.slice(r + 4, r + 6), 16)),
                          (i = parseInt(e.slice(r + 7, r + 9), 16)),
                          128 === (192 & o) && 128 === (192 & i))
                        ? ((c = ((s << 12) & 61440) | ((o << 6) & 4032) | (63 & i)),
                          (l +=
                            c < 2048 || (c >= 55296 && c <= 57343)
                              ? '\ufffd\ufffd\ufffd'
                              : String.fromCharCode(c)),
                          (r += 6))
                        : 240 === (248 & s) &&
                          r + 9 < n &&
                          ((o = parseInt(e.slice(r + 4, r + 6), 16)),
                          (i = parseInt(e.slice(r + 7, r + 9), 16)),
                          (a = parseInt(e.slice(r + 10, r + 12), 16)),
                          128 === (192 & o) && 128 === (192 & i) && 128 === (192 & a))
                        ? ((c =
                            ((s << 18) & 1835008) |
                            ((o << 12) & 258048) |
                            ((i << 6) & 4032) |
                            (63 & a)),
                          c < 65536 || c > 1114111
                            ? (l += '\ufffd\ufffd\ufffd\ufffd')
                            : ((c -= 65536),
                              (l += String.fromCharCode(55296 + (c >> 10), 56320 + (1023 & c)))),
                          (r += 9))
                        : (l += '\ufffd');
                  return l;
                })
              );
            }
            var o = {};
            (s.defaultChars = ';/?:@&=+$,#'), (s.componentChars = ''), (r.exports = s);
          },
          {},
        ],
        56: [
          function(e, r, t) {
            'use strict';
            function n(e) {
              var r,
                t,
                n = o[e];
              if (n) return n;
              for (n = o[e] = [], r = 0; r < 128; r++)
                (t = String.fromCharCode(r)),
                  /^[0-9a-z]$/i.test(t)
                    ? n.push(t)
                    : n.push('%' + ('0' + r.toString(16).toUpperCase()).slice(-2));
              for (r = 0; r < e.length; r++) n[e.charCodeAt(r)] = e[r];
              return n;
            }
            function s(e, r, t) {
              var o,
                i,
                a,
                c,
                l,
                u = '';
              for (
                'string' != typeof r && ((t = r), (r = s.defaultChars)),
                  'undefined' == typeof t && (t = !0),
                  l = n(r),
                  o = 0,
                  i = e.length;
                o < i;
                o++
              )
                if (
                  ((a = e.charCodeAt(o)),
                  t && 37 === a && o + 2 < i && /^[0-9a-f]{2}$/i.test(e.slice(o + 1, o + 3)))
                )
                  (u += e.slice(o, o + 3)), (o += 2);
                else if (a < 128) u += l[a];
                else if (a >= 55296 && a <= 57343) {
                  if (
                    a >= 55296 &&
                    a <= 56319 &&
                    o + 1 < i &&
                    ((c = e.charCodeAt(o + 1)), c >= 56320 && c <= 57343)
                  ) {
                    (u += encodeURIComponent(e[o] + e[o + 1])), o++;
                    continue;
                  }
                  u += '%EF%BF%BD';
                } else u += encodeURIComponent(e[o]);
              return u;
            }
            var o = {};
            (s.defaultChars = ";/?:@&=+$,-_.!~*'()#"),
              (s.componentChars = "-_.!~*'()"),
              (r.exports = s);
          },
          {},
        ],
        57: [
          function(e, r, t) {
            'use strict';
            r.exports = function(e) {
              var r = '';
              return (
                (r += e.protocol || ''),
                (r += e.slashes ? '//' : ''),
                (r += e.auth ? e.auth + '@' : ''),
                (r +=
                  e.hostname && e.hostname.indexOf(':') !== -1
                    ? '[' + e.hostname + ']'
                    : e.hostname || ''),
                (r += e.port ? ':' + e.port : ''),
                (r += e.pathname || ''),
                (r += e.search || ''),
                (r += e.hash || '')
              );
            };
          },
          {},
        ],
        58: [
          function(e, r, t) {
            'use strict';
            (r.exports.encode = e('./encode')),
              (r.exports.decode = e('./decode')),
              (r.exports.format = e('./format')),
              (r.exports.parse = e('./parse'));
          },
          { './decode': 55, './encode': 56, './format': 57, './parse': 59 },
        ],
        59: [
          function(e, r, t) {
            'use strict';
            function n() {
              (this.protocol = null),
                (this.slashes = null),
                (this.auth = null),
                (this.port = null),
                (this.hostname = null),
                (this.hash = null),
                (this.search = null),
                (this.pathname = null);
            }
            function s(e, r) {
              if (e && e instanceof n) return e;
              var t = new n();
              return t.parse(e, r), t;
            }
            var o = /^([a-z0-9.+-]+:)/i,
              i = /:[0-9]*$/,
              a = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
              c = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
              l = ['{', '}', '|', '\\', '^', '`'].concat(c),
              u = ["'"].concat(l),
              p = ['%', '/', '?', ';', '#'].concat(u),
              h = ['/', '?', '#'],
              f = 255,
              d = /^[+a-z0-9A-Z_-]{0,63}$/,
              m = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
              _ = { javascript: !0, 'javascript:': !0 },
              g = {
                http: !0,
                https: !0,
                ftp: !0,
                gopher: !0,
                file: !0,
                'http:': !0,
                'https:': !0,
                'ftp:': !0,
                'gopher:': !0,
                'file:': !0,
              };
            (n.prototype.parse = function(e, r) {
              var t,
                n,
                s,
                i,
                c,
                l = e;
              if (((l = l.trim()), !r && 1 === e.split('#').length)) {
                var u = a.exec(l);
                if (u) return (this.pathname = u[1]), u[2] && (this.search = u[2]), this;
              }
              var k = o.exec(l);
              if (
                (k &&
                  ((k = k[0]),
                  (s = k.toLowerCase()),
                  (this.protocol = k),
                  (l = l.substr(k.length))),
                (r || k || l.match(/^\/\/[^@\/]+@[^@\/]+/)) &&
                  ((c = '//' === l.substr(0, 2)),
                  !c || (k && _[k]) || ((l = l.substr(2)), (this.slashes = !0))),
                !_[k] && (c || (k && !g[k])))
              ) {
                var b = -1;
                for (t = 0; t < h.length; t++)
                  (i = l.indexOf(h[t])), i !== -1 && (b === -1 || i < b) && (b = i);
                var v, y;
                for (
                  y = b === -1 ? l.lastIndexOf('@') : l.lastIndexOf('@', b),
                    y !== -1 && ((v = l.slice(0, y)), (l = l.slice(y + 1)), (this.auth = v)),
                    b = -1,
                    t = 0;
                  t < p.length;
                  t++
                )
                  (i = l.indexOf(p[t])), i !== -1 && (b === -1 || i < b) && (b = i);
                b === -1 && (b = l.length), ':' === l[b - 1] && b--;
                var x = l.slice(0, b);
                (l = l.slice(b)), this.parseHost(x), (this.hostname = this.hostname || '');
                var C = '[' === this.hostname[0] && ']' === this.hostname[this.hostname.length - 1];
                if (!C) {
                  var A = this.hostname.split(/\./);
                  for (t = 0, n = A.length; t < n; t++) {
                    var w = A[t];
                    if (w && !w.match(d)) {
                      for (var D = '', q = 0, E = w.length; q < E; q++)
                        D += w.charCodeAt(q) > 127 ? 'x' : w[q];
                      if (!D.match(d)) {
                        var S = A.slice(0, t),
                          F = A.slice(t + 1),
                          z = w.match(m);
                        z && (S.push(z[1]), F.unshift(z[2])),
                          F.length && (l = F.join('.') + l),
                          (this.hostname = S.join('.'));
                        break;
                      }
                    }
                  }
                }
                this.hostname.length > f && (this.hostname = ''),
                  C && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
              }
              var L = l.indexOf('#');
              L !== -1 && ((this.hash = l.substr(L)), (l = l.slice(0, L)));
              var T = l.indexOf('?');
              return (
                T !== -1 && ((this.search = l.substr(T)), (l = l.slice(0, T))),
                l && (this.pathname = l),
                g[s] && this.hostname && !this.pathname && (this.pathname = ''),
                this
              );
            }),
              (n.prototype.parseHost = function(e) {
                var r = i.exec(e);
                r &&
                  ((r = r[0]),
                  ':' !== r && (this.port = r.substr(1)),
                  (e = e.substr(0, e.length - r.length))),
                  e && (this.hostname = e);
              }),
              (r.exports = s);
          },
          {},
        ],
        60: [
          function(r, t, n) {
            (function(r) {
              !(function(s) {
                function o(e) {
                  throw new RangeError(R[e]);
                }
                function i(e, r) {
                  for (var t = e.length, n = []; t--; ) n[t] = r(e[t]);
                  return n;
                }
                function a(e, r) {
                  var t = e.split('@'),
                    n = '';
                  t.length > 1 && ((n = t[0] + '@'), (e = t[1])), (e = e.replace(T, '.'));
                  var s = e.split('.'),
                    o = i(s, r).join('.');
                  return n + o;
                }
                function c(e) {
                  for (var r, t, n = [], s = 0, o = e.length; s < o; )
                    (r = e.charCodeAt(s++)),
                      r >= 55296 && r <= 56319 && s < o
                        ? ((t = e.charCodeAt(s++)),
                          56320 == (64512 & t)
                            ? n.push(((1023 & r) << 10) + (1023 & t) + 65536)
                            : (n.push(r), s--))
                        : n.push(r);
                  return n;
                }
                function l(e) {
                  return i(e, function(e) {
                    var r = '';
                    return (
                      e > 65535 &&
                        ((e -= 65536),
                        (r += B(((e >>> 10) & 1023) | 55296)),
                        (e = 56320 | (1023 & e))),
                      (r += B(e))
                    );
                  }).join('');
                }
                function u(e) {
                  return e - 48 < 10 ? e - 22 : e - 65 < 26 ? e - 65 : e - 97 < 26 ? e - 97 : C;
                }
                function p(e, r) {
                  return e + 22 + 75 * (e < 26) - ((0 != r) << 5);
                }
                function h(e, r, t) {
                  var n = 0;
                  for (e = t ? I(e / q) : e >> 1, e += I(e / r); e > (M * w) >> 1; n += C)
                    e = I(e / M);
                  return I(n + ((M + 1) * e) / (e + D));
                }
                function f(e) {
                  var r,
                    t,
                    n,
                    s,
                    i,
                    a,
                    c,
                    p,
                    f,
                    d,
                    m = [],
                    _ = e.length,
                    g = 0,
                    k = S,
                    b = E;
                  for (t = e.lastIndexOf(F), t < 0 && (t = 0), n = 0; n < t; ++n)
                    e.charCodeAt(n) >= 128 && o('not-basic'), m.push(e.charCodeAt(n));
                  for (s = t > 0 ? t + 1 : 0; s < _; ) {
                    for (
                      i = g, a = 1, c = C;
                      s >= _ && o('invalid-input'),
                        (p = u(e.charCodeAt(s++))),
                        (p >= C || p > I((x - g) / a)) && o('overflow'),
                        (g += p * a),
                        (f = c <= b ? A : c >= b + w ? w : c - b),
                        !(p < f);
                      c += C
                    )
                      (d = C - f), a > I(x / d) && o('overflow'), (a *= d);
                    (r = m.length + 1),
                      (b = h(g - i, r, 0 == i)),
                      I(g / r) > x - k && o('overflow'),
                      (k += I(g / r)),
                      (g %= r),
                      m.splice(g++, 0, k);
                  }
                  return l(m);
                }
                function d(e) {
                  var r,
                    t,
                    n,
                    s,
                    i,
                    a,
                    l,
                    u,
                    f,
                    d,
                    m,
                    _,
                    g,
                    k,
                    b,
                    v = [];
                  for (e = c(e), _ = e.length, r = S, t = 0, i = E, a = 0; a < _; ++a)
                    (m = e[a]), m < 128 && v.push(B(m));
                  for (n = s = v.length, s && v.push(F); n < _; ) {
                    for (l = x, a = 0; a < _; ++a) (m = e[a]), m >= r && m < l && (l = m);
                    for (
                      g = n + 1,
                        l - r > I((x - t) / g) && o('overflow'),
                        t += (l - r) * g,
                        r = l,
                        a = 0;
                      a < _;
                      ++a
                    )
                      if (((m = e[a]), m < r && ++t > x && o('overflow'), m == r)) {
                        for (
                          u = t, f = C;
                          (d = f <= i ? A : f >= i + w ? w : f - i), !(u < d);
                          f += C
                        )
                          (b = u - d), (k = C - d), v.push(B(p(d + (b % k), 0))), (u = I(b / k));
                        v.push(B(p(u, 0))), (i = h(t, g, n == s)), (t = 0), ++n;
                      }
                    ++t, ++r;
                  }
                  return v.join('');
                }
                function m(e) {
                  return a(e, function(e) {
                    return z.test(e) ? f(e.slice(4).toLowerCase()) : e;
                  });
                }
                function _(e) {
                  return a(e, function(e) {
                    return L.test(e) ? 'xn--' + d(e) : e;
                  });
                }
                var g = 'object' == typeof n && n && !n.nodeType && n,
                  k = 'object' == typeof t && t && !t.nodeType && t,
                  b = 'object' == typeof r && r;
                (b.global !== b && b.window !== b && b.self !== b) || (s = b);
                var v,
                  y,
                  x = 2147483647,
                  C = 36,
                  A = 1,
                  w = 26,
                  D = 38,
                  q = 700,
                  E = 72,
                  S = 128,
                  F = '-',
                  z = /^xn--/,
                  L = /[^\x20-\x7E]/,
                  T = /[\x2E\u3002\uFF0E\uFF61]/g,
                  R = {
                    overflow: 'Overflow: input needs wider integers to process',
                    'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
                    'invalid-input': 'Invalid input',
                  },
                  M = C - A,
                  I = Math.floor,
                  B = String.fromCharCode;
                if (
                  ((v = {
                    version: '1.4.1',
                    ucs2: { decode: c, encode: l },
                    decode: f,
                    encode: d,
                    toASCII: _,
                    toUnicode: m,
                  }),
                  'function' == typeof e && 'object' == typeof e.amd && e.amd)
                )
                  e('punycode', function() {
                    return v;
                  });
                else if (g && k)
                  if (t.exports == g) k.exports = v;
                  else for (y in v) v.hasOwnProperty(y) && (g[y] = v[y]);
                else s.punycode = v;
              })(this);
            }.call(
              this,
              'undefined' != typeof global
                ? global
                : 'undefined' != typeof self
                ? self
                : 'undefined' != typeof window
                ? window
                : {},
            ));
          },
          {},
        ],
        61: [
          function(e, r, t) {
            r.exports = /[\0-\x1F\x7F-\x9F]/;
          },
          {},
        ],
        62: [
          function(e, r, t) {
            r.exports = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804\uDCBD|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;
          },
          {},
        ],
        63: [
          function(e, r, t) {
            r.exports = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/;
          },
          {},
        ],
        64: [
          function(e, r, t) {
            r.exports = /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/;
          },
          {},
        ],
        65: [
          function(e, r, t) {
            (r.exports.Any = e('./properties/Any/regex')),
              (r.exports.Cc = e('./categories/Cc/regex')),
              (r.exports.Cf = e('./categories/Cf/regex')),
              (r.exports.P = e('./categories/P/regex')),
              (r.exports.Z = e('./categories/Z/regex'));
          },
          {
            './categories/Cc/regex': 61,
            './categories/Cf/regex': 62,
            './categories/P/regex': 63,
            './categories/Z/regex': 64,
            './properties/Any/regex': 66,
          },
        ],
        66: [
          function(e, r, t) {
            r.exports = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
          },
          {},
        ],
        67: [
          function(e, r, t) {
            'use strict';
            r.exports = e('./lib/');
          },
          { './lib/': 9 },
        ],
      },
      {},
      [67],
    )(67);
  });

  /*global require*/
  define('Core/KnockoutMarkdownBinding', [
    'markdown-it-sanitizer',
    'markdown-it',
  ], function(MarkdownItSanitizer, MarkdownIt) {
    'use strict';

    var htmlTagRegex = /<html(.|\s)*>(.|\s)*<\/html>/im;

    var md = new MarkdownIt({
      html: true,
      linkify: true,
    });

    md.use(MarkdownItSanitizer, {
      imageClass: '',
      removeUnbalanced: false,
      removeUnknown: false,
    });

    var KnockoutMarkdownBinding = {
      register: function(Knockout) {
        Knockout.bindingHandlers.markdown = {
          init: function() {
            // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
            return { controlsDescendantBindings: true };
          },
          update: function(element, valueAccessor) {
            // Remove existing children of this element.
            while (element.firstChild) {
              Knockout.removeNode(element.firstChild);
            }

            var rawText = Knockout.unwrap(valueAccessor());

            // If the text contains an <html> tag, don't try to interpret it as Markdown because
            // we'll probably break it in the process.
            var html;
            if (htmlTagRegex.test(rawText)) {
              html = rawText;
            } else {
              html = md.render(rawText);
            }

            var nodes = Knockout.utils.parseHtmlFragment(html, element);
            element.className = element.className + ' markdown';

            for (var i = 0; i < nodes.length; ++i) {
              var node = nodes[i];
              setAnchorTargets(node);
              element.appendChild(node);
            }
          },
        };
      },
    };

    function setAnchorTargets(element) {
      if (element instanceof HTMLAnchorElement) {
        element.target = '_blank';
      }

      if (element.childNodes && element.childNodes.length > 0) {
        for (var i = 0; i < element.childNodes.length; ++i) {
          setAnchorTargets(element.childNodes[i]);
        }
      }
    }

    return KnockoutMarkdownBinding;
  });

  /*! Hammer.JS - v2.0.7 - 2016-04-22
   * http://hammerjs.github.io/
   *
   * Copyright (c) 2016 Jorik Tangelder;
   * Licensed under the MIT license */
  !(function(a, b, c, d) {
    'use strict';
    function e(a, b, c) {
      return setTimeout(j(a, c), b);
    }
    function f(a, b, c) {
      return Array.isArray(a) ? (g(a, c[b], c), !0) : !1;
    }
    function g(a, b, c) {
      var e;
      if (a)
        if (a.forEach) a.forEach(b, c);
        else if (a.length !== d) for (e = 0; e < a.length; ) b.call(c, a[e], e, a), e++;
        else for (e in a) a.hasOwnProperty(e) && b.call(c, a[e], e, a);
    }
    function h(b, c, d) {
      var e = 'DEPRECATED METHOD: ' + c + '\n' + d + ' AT \n';
      return function() {
        var c = new Error('get-stack-trace'),
          d =
            c && c.stack
              ? c.stack
                  .replace(/^[^\(]+?[\n$]/gm, '')
                  .replace(/^\s+at\s+/gm, '')
                  .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
              : 'Unknown Stack Trace',
          f = a.console && (a.console.warn || a.console.log);
        return f && f.call(a.console, e, d), b.apply(this, arguments);
      };
    }
    function i(a, b, c) {
      var d,
        e = b.prototype;
      (d = a.prototype = Object.create(e)), (d.constructor = a), (d._super = e), c && la(d, c);
    }
    function j(a, b) {
      return function() {
        return a.apply(b, arguments);
      };
    }
    function k(a, b) {
      return typeof a == oa ? a.apply(b ? b[0] || d : d, b) : a;
    }
    function l(a, b) {
      return a === d ? b : a;
    }
    function m(a, b, c) {
      g(q(b), function(b) {
        a.addEventListener(b, c, !1);
      });
    }
    function n(a, b, c) {
      g(q(b), function(b) {
        a.removeEventListener(b, c, !1);
      });
    }
    function o(a, b) {
      for (; a; ) {
        if (a == b) return !0;
        a = a.parentNode;
      }
      return !1;
    }
    function p(a, b) {
      return a.indexOf(b) > -1;
    }
    function q(a) {
      return a.trim().split(/\s+/g);
    }
    function r(a, b, c) {
      if (a.indexOf && !c) return a.indexOf(b);
      for (var d = 0; d < a.length; ) {
        if ((c && a[d][c] == b) || (!c && a[d] === b)) return d;
        d++;
      }
      return -1;
    }
    function s(a) {
      return Array.prototype.slice.call(a, 0);
    }
    function t(a, b, c) {
      for (var d = [], e = [], f = 0; f < a.length; ) {
        var g = b ? a[f][b] : a[f];
        r(e, g) < 0 && d.push(a[f]), (e[f] = g), f++;
      }
      return (
        c &&
          (d = b
            ? d.sort(function(a, c) {
                return a[b] > c[b];
              })
            : d.sort()),
        d
      );
    }
    function u(a, b) {
      for (var c, e, f = b[0].toUpperCase() + b.slice(1), g = 0; g < ma.length; ) {
        if (((c = ma[g]), (e = c ? c + f : b), e in a)) return e;
        g++;
      }
      return d;
    }
    function v() {
      return ua++;
    }
    function w(b) {
      var c = b.ownerDocument || b;
      return c.defaultView || c.parentWindow || a;
    }
    function x(a, b) {
      var c = this;
      (this.manager = a),
        (this.callback = b),
        (this.element = a.element),
        (this.target = a.options.inputTarget),
        (this.domHandler = function(b) {
          k(a.options.enable, [a]) && c.handler(b);
        }),
        this.init();
    }
    function y(a) {
      var b,
        c = a.options.inputClass;
      return new (b = c ? c : xa ? M : ya ? P : wa ? R : L)(a, z);
    }
    function z(a, b, c) {
      var d = c.pointers.length,
        e = c.changedPointers.length,
        f = b & Ea && d - e === 0,
        g = b & (Ga | Ha) && d - e === 0;
      (c.isFirst = !!f),
        (c.isFinal = !!g),
        f && (a.session = {}),
        (c.eventType = b),
        A(a, c),
        a.emit('hammer.input', c),
        a.recognize(c),
        (a.session.prevInput = c);
    }
    function A(a, b) {
      var c = a.session,
        d = b.pointers,
        e = d.length;
      c.firstInput || (c.firstInput = D(b)),
        e > 1 && !c.firstMultiple ? (c.firstMultiple = D(b)) : 1 === e && (c.firstMultiple = !1);
      var f = c.firstInput,
        g = c.firstMultiple,
        h = g ? g.center : f.center,
        i = (b.center = E(d));
      (b.timeStamp = ra()),
        (b.deltaTime = b.timeStamp - f.timeStamp),
        (b.angle = I(h, i)),
        (b.distance = H(h, i)),
        B(c, b),
        (b.offsetDirection = G(b.deltaX, b.deltaY));
      var j = F(b.deltaTime, b.deltaX, b.deltaY);
      (b.overallVelocityX = j.x),
        (b.overallVelocityY = j.y),
        (b.overallVelocity = qa(j.x) > qa(j.y) ? j.x : j.y),
        (b.scale = g ? K(g.pointers, d) : 1),
        (b.rotation = g ? J(g.pointers, d) : 0),
        (b.maxPointers = c.prevInput
          ? b.pointers.length > c.prevInput.maxPointers
            ? b.pointers.length
            : c.prevInput.maxPointers
          : b.pointers.length),
        C(c, b);
      var k = a.element;
      o(b.srcEvent.target, k) && (k = b.srcEvent.target), (b.target = k);
    }
    function B(a, b) {
      var c = b.center,
        d = a.offsetDelta || {},
        e = a.prevDelta || {},
        f = a.prevInput || {};
      (b.eventType !== Ea && f.eventType !== Ga) ||
        ((e = a.prevDelta = { x: f.deltaX || 0, y: f.deltaY || 0 }),
        (d = a.offsetDelta = { x: c.x, y: c.y })),
        (b.deltaX = e.x + (c.x - d.x)),
        (b.deltaY = e.y + (c.y - d.y));
    }
    function C(a, b) {
      var c,
        e,
        f,
        g,
        h = a.lastInterval || b,
        i = b.timeStamp - h.timeStamp;
      if (b.eventType != Ha && (i > Da || h.velocity === d)) {
        var j = b.deltaX - h.deltaX,
          k = b.deltaY - h.deltaY,
          l = F(i, j, k);
        (e = l.x),
          (f = l.y),
          (c = qa(l.x) > qa(l.y) ? l.x : l.y),
          (g = G(j, k)),
          (a.lastInterval = b);
      } else (c = h.velocity), (e = h.velocityX), (f = h.velocityY), (g = h.direction);
      (b.velocity = c), (b.velocityX = e), (b.velocityY = f), (b.direction = g);
    }
    function D(a) {
      for (var b = [], c = 0; c < a.pointers.length; )
        (b[c] = { clientX: pa(a.pointers[c].clientX), clientY: pa(a.pointers[c].clientY) }), c++;
      return { timeStamp: ra(), pointers: b, center: E(b), deltaX: a.deltaX, deltaY: a.deltaY };
    }
    function E(a) {
      var b = a.length;
      if (1 === b) return { x: pa(a[0].clientX), y: pa(a[0].clientY) };
      for (var c = 0, d = 0, e = 0; b > e; ) (c += a[e].clientX), (d += a[e].clientY), e++;
      return { x: pa(c / b), y: pa(d / b) };
    }
    function F(a, b, c) {
      return { x: b / a || 0, y: c / a || 0 };
    }
    function G(a, b) {
      return a === b ? Ia : qa(a) >= qa(b) ? (0 > a ? Ja : Ka) : 0 > b ? La : Ma;
    }
    function H(a, b, c) {
      c || (c = Qa);
      var d = b[c[0]] - a[c[0]],
        e = b[c[1]] - a[c[1]];
      return Math.sqrt(d * d + e * e);
    }
    function I(a, b, c) {
      c || (c = Qa);
      var d = b[c[0]] - a[c[0]],
        e = b[c[1]] - a[c[1]];
      return (180 * Math.atan2(e, d)) / Math.PI;
    }
    function J(a, b) {
      return I(b[1], b[0], Ra) + I(a[1], a[0], Ra);
    }
    function K(a, b) {
      return H(b[0], b[1], Ra) / H(a[0], a[1], Ra);
    }
    function L() {
      (this.evEl = Ta), (this.evWin = Ua), (this.pressed = !1), x.apply(this, arguments);
    }
    function M() {
      (this.evEl = Xa),
        (this.evWin = Ya),
        x.apply(this, arguments),
        (this.store = this.manager.session.pointerEvents = []);
    }
    function N() {
      (this.evTarget = $a), (this.evWin = _a), (this.started = !1), x.apply(this, arguments);
    }
    function O(a, b) {
      var c = s(a.touches),
        d = s(a.changedTouches);
      return b & (Ga | Ha) && (c = t(c.concat(d), 'identifier', !0)), [c, d];
    }
    function P() {
      (this.evTarget = bb), (this.targetIds = {}), x.apply(this, arguments);
    }
    function Q(a, b) {
      var c = s(a.touches),
        d = this.targetIds;
      if (b & (Ea | Fa) && 1 === c.length) return (d[c[0].identifier] = !0), [c, c];
      var e,
        f,
        g = s(a.changedTouches),
        h = [],
        i = this.target;
      if (
        ((f = c.filter(function(a) {
          return o(a.target, i);
        })),
        b === Ea)
      )
        for (e = 0; e < f.length; ) (d[f[e].identifier] = !0), e++;
      for (e = 0; e < g.length; )
        d[g[e].identifier] && h.push(g[e]), b & (Ga | Ha) && delete d[g[e].identifier], e++;
      return h.length ? [t(f.concat(h), 'identifier', !0), h] : void 0;
    }
    function R() {
      x.apply(this, arguments);
      var a = j(this.handler, this);
      (this.touch = new P(this.manager, a)),
        (this.mouse = new L(this.manager, a)),
        (this.primaryTouch = null),
        (this.lastTouches = []);
    }
    function S(a, b) {
      a & Ea
        ? ((this.primaryTouch = b.changedPointers[0].identifier), T.call(this, b))
        : a & (Ga | Ha) && T.call(this, b);
    }
    function T(a) {
      var b = a.changedPointers[0];
      if (b.identifier === this.primaryTouch) {
        var c = { x: b.clientX, y: b.clientY };
        this.lastTouches.push(c);
        var d = this.lastTouches,
          e = function() {
            var a = d.indexOf(c);
            a > -1 && d.splice(a, 1);
          };
        setTimeout(e, cb);
      }
    }
    function U(a) {
      for (
        var b = a.srcEvent.clientX, c = a.srcEvent.clientY, d = 0;
        d < this.lastTouches.length;
        d++
      ) {
        var e = this.lastTouches[d],
          f = Math.abs(b - e.x),
          g = Math.abs(c - e.y);
        if (db >= f && db >= g) return !0;
      }
      return !1;
    }
    function V(a, b) {
      (this.manager = a), this.set(b);
    }
    function W(a) {
      if (p(a, jb)) return jb;
      var b = p(a, kb),
        c = p(a, lb);
      return b && c ? jb : b || c ? (b ? kb : lb) : p(a, ib) ? ib : hb;
    }
    function X() {
      if (!fb) return !1;
      var b = {},
        c = a.CSS && a.CSS.supports;
      return (
        ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(d) {
          b[d] = c ? a.CSS.supports('touch-action', d) : !0;
        }),
        b
      );
    }
    function Y(a) {
      (this.options = la({}, this.defaults, a || {})),
        (this.id = v()),
        (this.manager = null),
        (this.options.enable = l(this.options.enable, !0)),
        (this.state = nb),
        (this.simultaneous = {}),
        (this.requireFail = []);
    }
    function Z(a) {
      return a & sb ? 'cancel' : a & qb ? 'end' : a & pb ? 'move' : a & ob ? 'start' : '';
    }
    function $(a) {
      return a == Ma ? 'down' : a == La ? 'up' : a == Ja ? 'left' : a == Ka ? 'right' : '';
    }
    function _(a, b) {
      var c = b.manager;
      return c ? c.get(a) : a;
    }
    function aa() {
      Y.apply(this, arguments);
    }
    function ba() {
      aa.apply(this, arguments), (this.pX = null), (this.pY = null);
    }
    function ca() {
      aa.apply(this, arguments);
    }
    function da() {
      Y.apply(this, arguments), (this._timer = null), (this._input = null);
    }
    function ea() {
      aa.apply(this, arguments);
    }
    function fa() {
      aa.apply(this, arguments);
    }
    function ga() {
      Y.apply(this, arguments),
        (this.pTime = !1),
        (this.pCenter = !1),
        (this._timer = null),
        (this._input = null),
        (this.count = 0);
    }
    function ha(a, b) {
      return (b = b || {}), (b.recognizers = l(b.recognizers, ha.defaults.preset)), new ia(a, b);
    }
    function ia(a, b) {
      (this.options = la({}, ha.defaults, b || {})),
        (this.options.inputTarget = this.options.inputTarget || a),
        (this.handlers = {}),
        (this.session = {}),
        (this.recognizers = []),
        (this.oldCssProps = {}),
        (this.element = a),
        (this.input = y(this)),
        (this.touchAction = new V(this, this.options.touchAction)),
        ja(this, !0),
        g(
          this.options.recognizers,
          function(a) {
            var b = this.add(new a[0](a[1]));
            a[2] && b.recognizeWith(a[2]), a[3] && b.requireFailure(a[3]);
          },
          this,
        );
    }
    function ja(a, b) {
      var c = a.element;
      if (c.style) {
        var d;
        g(a.options.cssProps, function(e, f) {
          (d = u(c.style, f)),
            b
              ? ((a.oldCssProps[d] = c.style[d]), (c.style[d] = e))
              : (c.style[d] = a.oldCssProps[d] || '');
        }),
          b || (a.oldCssProps = {});
      }
    }
    function ka(a, c) {
      var d = b.createEvent('Event');
      d.initEvent(a, !0, !0), (d.gesture = c), c.target.dispatchEvent(d);
    }
    var la,
      ma = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'],
      na = b.createElement('div'),
      oa = 'function',
      pa = Math.round,
      qa = Math.abs,
      ra = Date.now;
    la =
      'function' != typeof Object.assign
        ? function(a) {
            if (a === d || null === a)
              throw new TypeError('Cannot convert undefined or null to object');
            for (var b = Object(a), c = 1; c < arguments.length; c++) {
              var e = arguments[c];
              if (e !== d && null !== e) for (var f in e) e.hasOwnProperty(f) && (b[f] = e[f]);
            }
            return b;
          }
        : Object.assign;
    var sa = h(
        function(a, b, c) {
          for (var e = Object.keys(b), f = 0; f < e.length; )
            (!c || (c && a[e[f]] === d)) && (a[e[f]] = b[e[f]]), f++;
          return a;
        },
        'extend',
        'Use `assign`.',
      ),
      ta = h(
        function(a, b) {
          return sa(a, b, !0);
        },
        'merge',
        'Use `assign`.',
      ),
      ua = 1,
      va = /mobile|tablet|ip(ad|hone|od)|android/i,
      wa = 'ontouchstart' in a,
      xa = u(a, 'PointerEvent') !== d,
      ya = wa && va.test(navigator.userAgent),
      za = 'touch',
      Aa = 'pen',
      Ba = 'mouse',
      Ca = 'kinect',
      Da = 25,
      Ea = 1,
      Fa = 2,
      Ga = 4,
      Ha = 8,
      Ia = 1,
      Ja = 2,
      Ka = 4,
      La = 8,
      Ma = 16,
      Na = Ja | Ka,
      Oa = La | Ma,
      Pa = Na | Oa,
      Qa = ['x', 'y'],
      Ra = ['clientX', 'clientY'];
    x.prototype = {
      handler: function() {},
      init: function() {
        this.evEl && m(this.element, this.evEl, this.domHandler),
          this.evTarget && m(this.target, this.evTarget, this.domHandler),
          this.evWin && m(w(this.element), this.evWin, this.domHandler);
      },
      destroy: function() {
        this.evEl && n(this.element, this.evEl, this.domHandler),
          this.evTarget && n(this.target, this.evTarget, this.domHandler),
          this.evWin && n(w(this.element), this.evWin, this.domHandler);
      },
    };
    var Sa = { mousedown: Ea, mousemove: Fa, mouseup: Ga },
      Ta = 'mousedown',
      Ua = 'mousemove mouseup';
    i(L, x, {
      handler: function(a) {
        var b = Sa[a.type];
        b & Ea && 0 === a.button && (this.pressed = !0),
          b & Fa && 1 !== a.which && (b = Ga),
          this.pressed &&
            (b & Ga && (this.pressed = !1),
            this.callback(this.manager, b, {
              pointers: [a],
              changedPointers: [a],
              pointerType: Ba,
              srcEvent: a,
            }));
      },
    });
    var Va = { pointerdown: Ea, pointermove: Fa, pointerup: Ga, pointercancel: Ha, pointerout: Ha },
      Wa = { 2: za, 3: Aa, 4: Ba, 5: Ca },
      Xa = 'pointerdown',
      Ya = 'pointermove pointerup pointercancel';
    a.MSPointerEvent &&
      !a.PointerEvent &&
      ((Xa = 'MSPointerDown'), (Ya = 'MSPointerMove MSPointerUp MSPointerCancel')),
      i(M, x, {
        handler: function(a) {
          var b = this.store,
            c = !1,
            d = a.type.toLowerCase().replace('ms', ''),
            e = Va[d],
            f = Wa[a.pointerType] || a.pointerType,
            g = f == za,
            h = r(b, a.pointerId, 'pointerId');
          e & Ea && (0 === a.button || g)
            ? 0 > h && (b.push(a), (h = b.length - 1))
            : e & (Ga | Ha) && (c = !0),
            0 > h ||
              ((b[h] = a),
              this.callback(this.manager, e, {
                pointers: b,
                changedPointers: [a],
                pointerType: f,
                srcEvent: a,
              }),
              c && b.splice(h, 1));
        },
      });
    var Za = { touchstart: Ea, touchmove: Fa, touchend: Ga, touchcancel: Ha },
      $a = 'touchstart',
      _a = 'touchstart touchmove touchend touchcancel';
    i(N, x, {
      handler: function(a) {
        var b = Za[a.type];
        if ((b === Ea && (this.started = !0), this.started)) {
          var c = O.call(this, a, b);
          b & (Ga | Ha) && c[0].length - c[1].length === 0 && (this.started = !1),
            this.callback(this.manager, b, {
              pointers: c[0],
              changedPointers: c[1],
              pointerType: za,
              srcEvent: a,
            });
        }
      },
    });
    var ab = { touchstart: Ea, touchmove: Fa, touchend: Ga, touchcancel: Ha },
      bb = 'touchstart touchmove touchend touchcancel';
    i(P, x, {
      handler: function(a) {
        var b = ab[a.type],
          c = Q.call(this, a, b);
        c &&
          this.callback(this.manager, b, {
            pointers: c[0],
            changedPointers: c[1],
            pointerType: za,
            srcEvent: a,
          });
      },
    });
    var cb = 2500,
      db = 25;
    i(R, x, {
      handler: function(a, b, c) {
        var d = c.pointerType == za,
          e = c.pointerType == Ba;
        if (!(e && c.sourceCapabilities && c.sourceCapabilities.firesTouchEvents)) {
          if (d) S.call(this, b, c);
          else if (e && U.call(this, c)) return;
          this.callback(a, b, c);
        }
      },
      destroy: function() {
        this.touch.destroy(), this.mouse.destroy();
      },
    });
    var eb = u(na.style, 'touchAction'),
      fb = eb !== d,
      gb = 'compute',
      hb = 'auto',
      ib = 'manipulation',
      jb = 'none',
      kb = 'pan-x',
      lb = 'pan-y',
      mb = X();
    V.prototype = {
      set: function(a) {
        a == gb && (a = this.compute()),
          fb && this.manager.element.style && mb[a] && (this.manager.element.style[eb] = a),
          (this.actions = a.toLowerCase().trim());
      },
      update: function() {
        this.set(this.manager.options.touchAction);
      },
      compute: function() {
        var a = [];
        return (
          g(this.manager.recognizers, function(b) {
            k(b.options.enable, [b]) && (a = a.concat(b.getTouchAction()));
          }),
          W(a.join(' '))
        );
      },
      preventDefaults: function(a) {
        var b = a.srcEvent,
          c = a.offsetDirection;
        if (this.manager.session.prevented) return void b.preventDefault();
        var d = this.actions,
          e = p(d, jb) && !mb[jb],
          f = p(d, lb) && !mb[lb],
          g = p(d, kb) && !mb[kb];
        if (e) {
          var h = 1 === a.pointers.length,
            i = a.distance < 2,
            j = a.deltaTime < 250;
          if (h && i && j) return;
        }
        return g && f ? void 0 : e || (f && c & Na) || (g && c & Oa) ? this.preventSrc(b) : void 0;
      },
      preventSrc: function(a) {
        (this.manager.session.prevented = !0), a.preventDefault();
      },
    };
    var nb = 1,
      ob = 2,
      pb = 4,
      qb = 8,
      rb = qb,
      sb = 16,
      tb = 32;
    (Y.prototype = {
      defaults: {},
      set: function(a) {
        return la(this.options, a), this.manager && this.manager.touchAction.update(), this;
      },
      recognizeWith: function(a) {
        if (f(a, 'recognizeWith', this)) return this;
        var b = this.simultaneous;
        return (a = _(a, this)), b[a.id] || ((b[a.id] = a), a.recognizeWith(this)), this;
      },
      dropRecognizeWith: function(a) {
        return f(a, 'dropRecognizeWith', this)
          ? this
          : ((a = _(a, this)), delete this.simultaneous[a.id], this);
      },
      requireFailure: function(a) {
        if (f(a, 'requireFailure', this)) return this;
        var b = this.requireFail;
        return (a = _(a, this)), -1 === r(b, a) && (b.push(a), a.requireFailure(this)), this;
      },
      dropRequireFailure: function(a) {
        if (f(a, 'dropRequireFailure', this)) return this;
        a = _(a, this);
        var b = r(this.requireFail, a);
        return b > -1 && this.requireFail.splice(b, 1), this;
      },
      hasRequireFailures: function() {
        return this.requireFail.length > 0;
      },
      canRecognizeWith: function(a) {
        return !!this.simultaneous[a.id];
      },
      emit: function(a) {
        function b(b) {
          c.manager.emit(b, a);
        }
        var c = this,
          d = this.state;
        qb > d && b(c.options.event + Z(d)),
          b(c.options.event),
          a.additionalEvent && b(a.additionalEvent),
          d >= qb && b(c.options.event + Z(d));
      },
      tryEmit: function(a) {
        return this.canEmit() ? this.emit(a) : void (this.state = tb);
      },
      canEmit: function() {
        for (var a = 0; a < this.requireFail.length; ) {
          if (!(this.requireFail[a].state & (tb | nb))) return !1;
          a++;
        }
        return !0;
      },
      recognize: function(a) {
        var b = la({}, a);
        return k(this.options.enable, [this, b])
          ? (this.state & (rb | sb | tb) && (this.state = nb),
            (this.state = this.process(b)),
            void (this.state & (ob | pb | qb | sb) && this.tryEmit(b)))
          : (this.reset(), void (this.state = tb));
      },
      process: function(a) {},
      getTouchAction: function() {},
      reset: function() {},
    }),
      i(aa, Y, {
        defaults: { pointers: 1 },
        attrTest: function(a) {
          var b = this.options.pointers;
          return 0 === b || a.pointers.length === b;
        },
        process: function(a) {
          var b = this.state,
            c = a.eventType,
            d = b & (ob | pb),
            e = this.attrTest(a);
          return d && (c & Ha || !e)
            ? b | sb
            : d || e
            ? c & Ga
              ? b | qb
              : b & ob
              ? b | pb
              : ob
            : tb;
        },
      }),
      i(ba, aa, {
        defaults: { event: 'pan', threshold: 10, pointers: 1, direction: Pa },
        getTouchAction: function() {
          var a = this.options.direction,
            b = [];
          return a & Na && b.push(lb), a & Oa && b.push(kb), b;
        },
        directionTest: function(a) {
          var b = this.options,
            c = !0,
            d = a.distance,
            e = a.direction,
            f = a.deltaX,
            g = a.deltaY;
          return (
            e & b.direction ||
              (b.direction & Na
                ? ((e = 0 === f ? Ia : 0 > f ? Ja : Ka),
                  (c = f != this.pX),
                  (d = Math.abs(a.deltaX)))
                : ((e = 0 === g ? Ia : 0 > g ? La : Ma),
                  (c = g != this.pY),
                  (d = Math.abs(a.deltaY)))),
            (a.direction = e),
            c && d > b.threshold && e & b.direction
          );
        },
        attrTest: function(a) {
          return (
            aa.prototype.attrTest.call(this, a) &&
            (this.state & ob || (!(this.state & ob) && this.directionTest(a)))
          );
        },
        emit: function(a) {
          (this.pX = a.deltaX), (this.pY = a.deltaY);
          var b = $(a.direction);
          b && (a.additionalEvent = this.options.event + b), this._super.emit.call(this, a);
        },
      }),
      i(ca, aa, {
        defaults: { event: 'pinch', threshold: 0, pointers: 2 },
        getTouchAction: function() {
          return [jb];
        },
        attrTest: function(a) {
          return (
            this._super.attrTest.call(this, a) &&
            (Math.abs(a.scale - 1) > this.options.threshold || this.state & ob)
          );
        },
        emit: function(a) {
          if (1 !== a.scale) {
            var b = a.scale < 1 ? 'in' : 'out';
            a.additionalEvent = this.options.event + b;
          }
          this._super.emit.call(this, a);
        },
      }),
      i(da, Y, {
        defaults: { event: 'press', pointers: 1, time: 251, threshold: 9 },
        getTouchAction: function() {
          return [hb];
        },
        process: function(a) {
          var b = this.options,
            c = a.pointers.length === b.pointers,
            d = a.distance < b.threshold,
            f = a.deltaTime > b.time;
          if (((this._input = a), !d || !c || (a.eventType & (Ga | Ha) && !f))) this.reset();
          else if (a.eventType & Ea)
            this.reset(),
              (this._timer = e(
                function() {
                  (this.state = rb), this.tryEmit();
                },
                b.time,
                this,
              ));
          else if (a.eventType & Ga) return rb;
          return tb;
        },
        reset: function() {
          clearTimeout(this._timer);
        },
        emit: function(a) {
          this.state === rb &&
            (a && a.eventType & Ga
              ? this.manager.emit(this.options.event + 'up', a)
              : ((this._input.timeStamp = ra()),
                this.manager.emit(this.options.event, this._input)));
        },
      }),
      i(ea, aa, {
        defaults: { event: 'rotate', threshold: 0, pointers: 2 },
        getTouchAction: function() {
          return [jb];
        },
        attrTest: function(a) {
          return (
            this._super.attrTest.call(this, a) &&
            (Math.abs(a.rotation) > this.options.threshold || this.state & ob)
          );
        },
      }),
      i(fa, aa, {
        defaults: { event: 'swipe', threshold: 10, velocity: 0.3, direction: Na | Oa, pointers: 1 },
        getTouchAction: function() {
          return ba.prototype.getTouchAction.call(this);
        },
        attrTest: function(a) {
          var b,
            c = this.options.direction;
          return (
            c & (Na | Oa)
              ? (b = a.overallVelocity)
              : c & Na
              ? (b = a.overallVelocityX)
              : c & Oa && (b = a.overallVelocityY),
            this._super.attrTest.call(this, a) &&
              c & a.offsetDirection &&
              a.distance > this.options.threshold &&
              a.maxPointers == this.options.pointers &&
              qa(b) > this.options.velocity &&
              a.eventType & Ga
          );
        },
        emit: function(a) {
          var b = $(a.offsetDirection);
          b && this.manager.emit(this.options.event + b, a),
            this.manager.emit(this.options.event, a);
        },
      }),
      i(ga, Y, {
        defaults: {
          event: 'tap',
          pointers: 1,
          taps: 1,
          interval: 300,
          time: 250,
          threshold: 9,
          posThreshold: 10,
        },
        getTouchAction: function() {
          return [ib];
        },
        process: function(a) {
          var b = this.options,
            c = a.pointers.length === b.pointers,
            d = a.distance < b.threshold,
            f = a.deltaTime < b.time;
          if ((this.reset(), a.eventType & Ea && 0 === this.count)) return this.failTimeout();
          if (d && f && c) {
            if (a.eventType != Ga) return this.failTimeout();
            var g = this.pTime ? a.timeStamp - this.pTime < b.interval : !0,
              h = !this.pCenter || H(this.pCenter, a.center) < b.posThreshold;
            (this.pTime = a.timeStamp),
              (this.pCenter = a.center),
              h && g ? (this.count += 1) : (this.count = 1),
              (this._input = a);
            var i = this.count % b.taps;
            if (0 === i)
              return this.hasRequireFailures()
                ? ((this._timer = e(
                    function() {
                      (this.state = rb), this.tryEmit();
                    },
                    b.interval,
                    this,
                  )),
                  ob)
                : rb;
          }
          return tb;
        },
        failTimeout: function() {
          return (
            (this._timer = e(
              function() {
                this.state = tb;
              },
              this.options.interval,
              this,
            )),
            tb
          );
        },
        reset: function() {
          clearTimeout(this._timer);
        },
        emit: function() {
          this.state == rb &&
            ((this._input.tapCount = this.count),
            this.manager.emit(this.options.event, this._input));
        },
      }),
      (ha.VERSION = '2.0.7'),
      (ha.defaults = {
        domEvents: !1,
        touchAction: gb,
        enable: !0,
        inputTarget: null,
        inputClass: null,
        preset: [
          [ea, { enable: !1 }],
          [ca, { enable: !1 }, ['rotate']],
          [fa, { direction: Na }],
          [ba, { direction: Na }, ['swipe']],
          [ga],
          [ga, { event: 'doubletap', taps: 2 }, ['tap']],
          [da],
        ],
        cssProps: {
          userSelect: 'none',
          touchSelect: 'none',
          touchCallout: 'none',
          contentZooming: 'none',
          userDrag: 'none',
          tapHighlightColor: 'rgba(0,0,0,0)',
        },
      });
    var ub = 1,
      vb = 2;
    (ia.prototype = {
      set: function(a) {
        return (
          la(this.options, a),
          a.touchAction && this.touchAction.update(),
          a.inputTarget &&
            (this.input.destroy(), (this.input.target = a.inputTarget), this.input.init()),
          this
        );
      },
      stop: function(a) {
        this.session.stopped = a ? vb : ub;
      },
      recognize: function(a) {
        var b = this.session;
        if (!b.stopped) {
          this.touchAction.preventDefaults(a);
          var c,
            d = this.recognizers,
            e = b.curRecognizer;
          (!e || (e && e.state & rb)) && (e = b.curRecognizer = null);
          for (var f = 0; f < d.length; )
            (c = d[f]),
              b.stopped === vb || (e && c != e && !c.canRecognizeWith(e))
                ? c.reset()
                : c.recognize(a),
              !e && c.state & (ob | pb | qb) && (e = b.curRecognizer = c),
              f++;
        }
      },
      get: function(a) {
        if (a instanceof Y) return a;
        for (var b = this.recognizers, c = 0; c < b.length; c++)
          if (b[c].options.event == a) return b[c];
        return null;
      },
      add: function(a) {
        if (f(a, 'add', this)) return this;
        var b = this.get(a.options.event);
        return (
          b && this.remove(b),
          this.recognizers.push(a),
          (a.manager = this),
          this.touchAction.update(),
          a
        );
      },
      remove: function(a) {
        if (f(a, 'remove', this)) return this;
        if ((a = this.get(a))) {
          var b = this.recognizers,
            c = r(b, a);
          -1 !== c && (b.splice(c, 1), this.touchAction.update());
        }
        return this;
      },
      on: function(a, b) {
        if (a !== d && b !== d) {
          var c = this.handlers;
          return (
            g(q(a), function(a) {
              (c[a] = c[a] || []), c[a].push(b);
            }),
            this
          );
        }
      },
      off: function(a, b) {
        if (a !== d) {
          var c = this.handlers;
          return (
            g(q(a), function(a) {
              b ? c[a] && c[a].splice(r(c[a], b), 1) : delete c[a];
            }),
            this
          );
        }
      },
      emit: function(a, b) {
        this.options.domEvents && ka(a, b);
        var c = this.handlers[a] && this.handlers[a].slice();
        if (c && c.length) {
          (b.type = a),
            (b.preventDefault = function() {
              b.srcEvent.preventDefault();
            });
          for (var d = 0; d < c.length; ) c[d](b), d++;
        }
      },
      destroy: function() {
        this.element && ja(this, !1),
          (this.handlers = {}),
          (this.session = {}),
          this.input.destroy(),
          (this.element = null);
      },
    }),
      la(ha, {
        INPUT_START: Ea,
        INPUT_MOVE: Fa,
        INPUT_END: Ga,
        INPUT_CANCEL: Ha,
        STATE_POSSIBLE: nb,
        STATE_BEGAN: ob,
        STATE_CHANGED: pb,
        STATE_ENDED: qb,
        STATE_RECOGNIZED: rb,
        STATE_CANCELLED: sb,
        STATE_FAILED: tb,
        DIRECTION_NONE: Ia,
        DIRECTION_LEFT: Ja,
        DIRECTION_RIGHT: Ka,
        DIRECTION_UP: La,
        DIRECTION_DOWN: Ma,
        DIRECTION_HORIZONTAL: Na,
        DIRECTION_VERTICAL: Oa,
        DIRECTION_ALL: Pa,
        Manager: ia,
        Input: x,
        TouchAction: V,
        TouchInput: P,
        MouseInput: L,
        PointerEventInput: M,
        TouchMouseInput: R,
        SingleTouchInput: N,
        Recognizer: Y,
        AttrRecognizer: aa,
        Tap: ga,
        Pan: ba,
        Swipe: fa,
        Pinch: ca,
        Rotate: ea,
        Press: da,
        on: m,
        off: n,
        each: g,
        merge: ta,
        extend: sa,
        assign: la,
        inherit: i,
        bindFn: j,
        prefixed: u,
      });
    var wb = 'undefined' != typeof a ? a : 'undefined' != typeof self ? self : {};
    (wb.Hammer = ha),
      'function' == typeof define && define.amd
        ? define('Hammer', [], function() {
            return ha;
          })
        : 'undefined' != typeof module && module.exports
        ? (module.exports = ha)
        : (a[c] = ha);
  })(window, document, 'Hammer');
  //# sourceMappingURL=hammer.min.js.map;
  /*global require*/
  define('Core/KnockoutHammerBinding', ['KnockoutES5', 'Hammer'], function(Knockout, Hammer) {
    'use strict';

    var KnockoutHammerBinding = {
      register: function(Knockout) {
        Knockout.bindingHandlers.swipeLeft = {
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var f = Knockout.unwrap(valueAccessor());
            new Hammer(element).on('swipeleft', function(e) {
              var viewModel = bindingContext.$data;
              f.apply(viewModel, arguments);
            });
          },
        };

        Knockout.bindingHandlers.swipeRight = {
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var f = Knockout.unwrap(valueAccessor());
            new Hammer(element).on('swiperight', function(e) {
              var viewModel = bindingContext.$data;
              f.apply(viewModel, arguments);
            });
          },
        };
      },
    };

    return KnockoutHammerBinding;
  });

  /*global require*/
  define('Core/registerKnockoutBindings', [
    'Cesium/Widgets/SvgPathBindingHandler',
    'KnockoutES5',
    'Core/KnockoutMarkdownBinding',
    'Core/KnockoutHammerBinding',
  ], function(SvgPathBindingHandler, Knockout, KnockoutMarkdownBinding, KnockoutHammerBinding) {
    'use strict';

    var registerKnockoutBindings = function() {
      SvgPathBindingHandler.register(Knockout);
      KnockoutMarkdownBinding.register(Knockout);
      KnockoutHammerBinding.register(Knockout);

      Knockout.bindingHandlers.embeddedComponent = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var component = Knockout.unwrap(valueAccessor());
          component.show(element);
          return { controlsDescendantBindings: true };
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {},
      };
    };

    return registerKnockoutBindings;
  });

  /*global define*/
  define('Core/createFragmentFromTemplate', [], function() {
    'use strict';

    var createFragmentFromTemplate = function(htmlString) {
      var holder = document.createElement('div');
      holder.innerHTML = htmlString;

      var fragment = document.createDocumentFragment();
      while (holder.firstChild) {
        fragment.appendChild(holder.firstChild);
      }

      return fragment;
    };

    return createFragmentFromTemplate;
  });

  /*global require*/
  define('Core/loadView', [
    'Cesium/Widgets/getElement',
    'KnockoutES5',
    'Core/createFragmentFromTemplate',
  ], function(getElement, Knockout, createFragmentFromTemplate) {
    'use strict';

    var loadView = function(htmlString, container, viewModel) {
      container = getElement(container);

      var fragment = createFragmentFromTemplate(htmlString);

      // Sadly, fragment.childNodes doesn't have a slice function.
      // This code could be replaced with Array.prototype.slice.call(fragment.childNodes)
      // but that seems slightly error prone.
      var nodes = [];

      var i;
      for (i = 0; i < fragment.childNodes.length; ++i) {
        nodes.push(fragment.childNodes[i]);
      }

      container.appendChild(fragment);

      for (i = 0; i < nodes.length; ++i) {
        var node = nodes[i];
        if (node.nodeType === 1 || node.nodeType === 8) {
          Knockout.applyBindings(viewModel, node);
        }
      }

      return nodes;
    };

    return loadView;
  });
  /*global define*/
  define('ViewModels/DistanceLegendViewModel', [
    'Cesium/Core/defined',
    'Cesium/Core/DeveloperError',
    'Cesium/Core/EllipsoidGeodesic',
    'Cesium/Core/Cartesian2',
    'Cesium/Core/getTimestamp',
    'Cesium/Core/EventHelper',
    'KnockoutES5',
    'Core/loadView',
  ], function(defined, DeveloperError, EllipsoidGeodesic, Cartesian2, getTimestamp, EventHelper, Knockout, loadView) {
    'use strict';

    var DistanceLegendViewModel = function(options) {
      if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
      }

      this.terria = options.terria;
      this._removeSubscription = undefined;
      this._lastLegendUpdate = undefined;
      this.eventHelper = new EventHelper();

      this.distanceLabel = undefined;
      this.barWidth = undefined;

      this.enableDistanceLegend = defined(options.enableDistanceLegend)
        ? options.enableDistanceLegend
        : true;

      Knockout.track(this, ['distanceLabel', 'barWidth']);

      this.eventHelper.add(
        this.terria.afterWidgetChanged,
        function() {
          if (defined(this._removeSubscription)) {
            this._removeSubscription();
            this._removeSubscription = undefined;
          }
        },
        this,
      );
      //        this.terria.beforeWidgetChanged.addEventListener(function () {
      //            if (defined(this._removeSubscription)) {
      //                this._removeSubscription();
      //                this._removeSubscription = undefined;
      //            }
      //        }, this);

      var that = this;

      function addUpdateSubscription() {
        if (defined(that.terria)) {
          var scene = that.terria.scene;
          that._removeSubscription = scene.postRender.addEventListener(function() {
            updateDistanceLegendCesium(this, scene);
          }, that);
        } else if (defined(that.terria.leaflet)) {
          var map = that.terria.leaflet.map;

          var potentialChangeCallback = function potentialChangeCallback() {
            updateDistanceLegendLeaflet(that, map);
          };

          that._removeSubscription = function() {
            map.off('zoomend', potentialChangeCallback);
            map.off('moveend', potentialChangeCallback);
          };

          map.on('zoomend', potentialChangeCallback);
          map.on('moveend', potentialChangeCallback);

          updateDistanceLegendLeaflet(that, map);
        }
      }

      addUpdateSubscription();
      this.eventHelper.add(
        this.terria.afterWidgetChanged,
        function() {
          addUpdateSubscription();
        },
        this,
      );
      //this.terria.afterWidgetChanged.addEventListener(function() {
      //    addUpdateSubscription();
      // }, this);
    };

    DistanceLegendViewModel.prototype.destroy = function() {
      this.eventHelper.removeAll();
    };

    DistanceLegendViewModel.prototype.show = function(container) {
      var testing;
      if (this.enableDistanceLegend) {
        testing =
          '<div class="distance-legend" data-bind="visible: distanceLabel && barWidth">' +
          '<div class="distance-legend-label" data-bind="text: distanceLabel"></div>' +
          '<div class="distance-legend-scale-bar" data-bind="style: { width: barWidth + \'px\', left: (5 + (125 - barWidth) / 2) + \'px\' }"></div>' +
          '</div>';
      } else {
        testing =
          '<div class="distance-legend"  style="display: none;" data-bind="visible: distanceLabel && barWidth">' +
          '<div class="distance-legend-label"  data-bind="text: distanceLabel"></div>' +
          '<div class="distance-legend-scale-bar"  data-bind="style: { width: barWidth + \'px\', left: (5 + (125 - barWidth) / 2) + \'px\' }"></div>' +
          '</div>';
      }
      loadView(testing, container, this);
      // loadView(distanceLegendTemplate, container, this);
      //loadView(require('fs').readFileSync(__dirname + '/../Views/DistanceLegend.html', 'utf8'), container, this);
    };

    DistanceLegendViewModel.create = function(options) {
      var result = new DistanceLegendViewModel(options);
      result.show(options.container);
      return result;
    };

    var geodesic = new EllipsoidGeodesic();

    var distances = [
      1,
      2,
      3,
      5,
      10,
      20,
      30,
      50,
      100,
      200,
      300,
      500,
      1000,
      2000,
      3000,
      5000,
      10000,
      20000,
      30000,
      50000,
      100000,
      200000,
      300000,
      500000,
      1000000,
      2000000,
      3000000,
      5000000,
      10000000,
      20000000,
      30000000,
      50000000,
    ];

    function updateDistanceLegendCesium(viewModel, scene) {
      if (!viewModel.enableDistanceLegend) {
        viewModel.barWidth = undefined;
        viewModel.distanceLabel = undefined;
        return;
      }
      var now = getTimestamp();
      if (now < viewModel._lastLegendUpdate + 250) {
        return;
      }

      viewModel._lastLegendUpdate = now;

      // Find the distance between two pixels at the bottom center of the screen.
      var width = scene.canvas.clientWidth;
      var height = scene.canvas.clientHeight;

      var left = scene.camera.getPickRay(new Cartesian2((width / 2) | 0, height - 1));
      var right = scene.camera.getPickRay(new Cartesian2((1 + width / 2) | 0, height - 1));

      var globe = scene.globe;
      var leftPosition = globe.pick(left, scene);
      var rightPosition = globe.pick(right, scene);

      if (!defined(leftPosition) || !defined(rightPosition)) {
        viewModel.barWidth = undefined;
        viewModel.distanceLabel = undefined;
        return;
      }

      var leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
      var rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);

      geodesic.setEndPoints(leftCartographic, rightCartographic);
      var pixelDistance = geodesic.surfaceDistance;

      // Find the first distance that makes the scale bar less than 100 pixels.
      var maxBarWidth = 100;
      var distance;
      for (var i = distances.length - 1; !defined(distance) && i >= 0; --i) {
        if (distances[i] / pixelDistance < maxBarWidth) {
          distance = distances[i];
        }
      }

      if (defined(distance)) {
        var label;
        if (distance >= 1000) {
          label = (distance / 1000).toString() + ' km';
        } else {
          label = distance.toString() + ' m';
        }

        viewModel.barWidth = (distance / pixelDistance) | 0;
        viewModel.distanceLabel = label;
      } else {
        viewModel.barWidth = undefined;
        viewModel.distanceLabel = undefined;
      }
    }

    function updateDistanceLegendLeaflet(viewModel, map) {
      var halfHeight = map.getSize().y / 2;
      var maxPixelWidth = 100;
      var maxMeters = map
        .containerPointToLatLng([0, halfHeight])
        .distanceTo(map.containerPointToLatLng([maxPixelWidth, halfHeight]));

      var meters = L.control.scale()._getRoundNum(maxMeters);
      var label = meters < 1000 ? meters + ' m' : meters / 1000 + ' km';

      viewModel.barWidth = (meters / maxMeters) * maxPixelWidth;
      viewModel.distanceLabel = label;
    }

    return DistanceLegendViewModel;
  });

  /*global require*/
  define('Core/Utils', [
    'Cesium/Core/defined',
    'Cesium/Core/Ray',
    'Cesium/Core/Cartesian3',
    'Cesium/Core/Cartographic',
    'Cesium/Core/ReferenceFrame',
    'Cesium/Scene/SceneMode',
  ], function(defined, Ray, Cartesian3, Cartographic, ReferenceFrame, SceneMode) {
    'use strict';

    var Utils = {};

    var unprojectedScratch = new Cartographic();
    var rayScratch = new Ray();

    /**
     * gets the focus point of the camera
     * @param {Viewer|Widget} terria The terria
     * @param {boolean} inWorldCoordinates true to get the focus in world coordinates, otherwise get it in projection-specific map coordinates, in meters.
     * @param {Cartesian3} [result] The object in which the result will be stored.
     * @return {Cartesian3} The modified result parameter, a new instance if none was provided or undefined if there is no focus point.
     */
    Utils.getCameraFocus = function(terria, inWorldCoordinates, result) {
      var scene = terria.scene;
      var camera = scene.camera;

      if (scene.mode == SceneMode.MORPHING) {
        return undefined;
      }

      if (!defined(result)) {
        result = new Cartesian3();
      }

      // TODO bug when tracking: if entity moves the current position should be used and not only the one when starting orbiting/rotating
      // TODO bug when tracking: reset should reset to default view of tracked entity

      if (defined(terria.trackedEntity)) {
        result = terria.trackedEntity.position.getValue(terria.clock.currentTime, result);
      } else {
        rayScratch.origin = camera.positionWC;
        rayScratch.direction = camera.directionWC;
        result = scene.globe.pick(rayScratch, scene, result);
      }

      if (!defined(result)) {
        return undefined;
      }

      if (scene.mode == SceneMode.SCENE2D || scene.mode == SceneMode.COLUMBUS_VIEW) {
        result = camera.worldToCameraCoordinatesPoint(result, result);

        if (inWorldCoordinates) {
          result = scene.globe.ellipsoid.cartographicToCartesian(
            scene.mapProjection.unproject(result, unprojectedScratch),
            result,
          );
        }
      } else {
        if (!inWorldCoordinates) {
          result = camera.worldToCameraCoordinatesPoint(result, result);
        }
      }

      return result;
    };

    return Utils;
  });

  /*global define*/
  define('ViewModels/NavigationViewModel', [
    'Cesium/Core/defined',
    'Cesium/Core/Math',
    'Cesium/Core/getTimestamp',
    'Cesium/Core/EventHelper',
    'Cesium/Core/Transforms',
    'Cesium/Scene/SceneMode',
    'Cesium/Core/Cartesian2',
    'Cesium/Core/Cartesian3',
    'Cesium/Core/Matrix4',
    'Cesium/Core/BoundingSphere',
    'Cesium/Core/HeadingPitchRange',
    'KnockoutES5',
    'Core/loadView',
    //'ViewModels/ResetViewNavigationControl',
    //'ViewModels/ZoomNavigationControl',
    //'SvgPaths/svgCompassOuterRing',
    //'SvgPaths/svgCompassGyro',
    //'SvgPaths/svgCompassRotationMarker',
    'Core/Utils',
  ], function(
    defined,
    CesiumMath,
    getTimestamp,
    EventHelper,
    Transforms,
    SceneMode,
    Cartesian2,
    Cartesian3,
    Matrix4,
    BoundingSphere,
    HeadingPitchRange,
    Knockout,
    loadView,
    //ResetViewNavigationControl,
    //ZoomNavigationControl,
    //svgCompassOuterRing,
    //svgCompassGyro,
    //svgCompassRotationMarker,
    Utils,
  ) {
    'use strict';

    var NavigationViewModel = function(options) {
      this.terria = options.terria;
      this.eventHelper = new EventHelper();
      this.enableZoomControls = defined(options.enableZoomControls)
        ? options.enableZoomControls
        : true;
      this.enableCompass = defined(options.enableCompass) ? options.enableCompass : true;

      // if (this.showZoomControls)
      //   {
      this.controls = options.controls;
      if (!defined(this.controls)) {
        this.controls = [
          //new ZoomNavigationControl(this.terria, true),
          //new ResetViewNavigationControl(this.terria),
          //new ZoomNavigationControl(this.terria, false)
        ];
      }
      //}

      //this.svgCompassOuterRing = svgCompassOuterRing;
      //this.svgCompassGyro = svgCompassGyro;
      //this.svgCompassRotationMarker = svgCompassRotationMarker;

      this.showCompass = defined(this.terria) && this.enableCompass;
      this.heading = this.showCompass ? this.terria.scene.camera.heading : 0.0;

      this.isOrbiting = false;
      this.orbitCursorAngle = 0;
      this.orbitCursorOpacity = 0.0;
      this.orbitLastTimestamp = 0;
      this.orbitFrame = undefined;
      this.orbitIsLook = false;
      this.orbitMouseMoveFunction = undefined;
      this.orbitMouseUpFunction = undefined;

      this.isRotating = false;
      this.rotateInitialCursorAngle = undefined;
      this.rotateFrame = undefined;
      this.rotateIsLook = false;
      this.rotateMouseMoveFunction = undefined;
      this.rotateMouseUpFunction = undefined;

      this._unsubcribeFromPostRender = undefined;

      Knockout.track(this, [
        'controls',
        'showCompass',
        'heading',
        'isOrbiting',
        'orbitCursorAngle',
        'isRotating',
      ]);

      var that = this;

      function widgetChange() {
        if (defined(that.terria)) {
          if (that._unsubcribeFromPostRender) {
            that._unsubcribeFromPostRender();
            that._unsubcribeFromPostRender = undefined;
          }

          that.showCompass = true && that.enableCompass;

          that._unsubcribeFromPostRender = that.terria.scene.postRender.addEventListener(
            function() {
              that.heading = that.terria.scene.camera.heading;
            },
          );
        } else {
          if (that._unsubcribeFromPostRender) {
            that._unsubcribeFromPostRender();
            that._unsubcribeFromPostRender = undefined;
          }
          that.showCompass = false;
        }
      }

      this.eventHelper.add(this.terria.afterWidgetChanged, widgetChange, this);
      //this.terria.afterWidgetChanged.addEventListener(widgetChange);

      widgetChange();
    };

    NavigationViewModel.prototype.destroy = function() {
      this.eventHelper.removeAll();

      //loadView(require('fs').readFileSync(baseURLEmpCesium + 'js-lib/terrajs/lib/Views/Navigation.html', 'utf8'), container, this);
    };

    NavigationViewModel.prototype.show = function(container) {
      var testing;
      if (this.enableZoomControls && this.enableCompass) {
        testing =
          '<div class="compass" title="按下鼠标左键并向四周拖拽不释放 可修改视图角度。双击:重置视图。" data-bind="visible: showCompass, event: { mousedown: handleMouseDown, dblclick: handleDoubleClick }">' +
          '<div class="compass-outer-ring-background"></div>' +
          " <div class=\"compass-rotation-marker\" data-bind=\"visible: isOrbiting, style: { transform: 'rotate(-' + orbitCursorAngle + 'rad)', '-webkit-transform': 'rotate(-' + orbitCursorAngle + 'rad)', opacity: orbitCursorOpacity } \"></div>" +
          " <div class=\"compass-outer-ring\" title=\"单击并拖拽旋转，修改视角方向。\" data-bind=\"style: { transform: 'rotate(-' + heading + 'rad)', '-webkit-transform': 'rotate(-' + heading + 'rad)' }, \"></div>" +
          ' <div class="compass-gyro-background"></div>' +
          ' <div class="compass-gyro" data-bind=" css: { \'compass-gyro-active\': isOrbiting }"></div>' +
          '</div>' +
          '<div class="navigation-controls">' +
          '<!-- ko foreach: controls -->' +
          "<div data-bind=\"click: activate, attr: { title: $data.name }, css: $root.isLastControl($data) ? 'navigation-control-last' : 'navigation-control' \">" +
          '   <!-- ko if: $data.hasText -->' +
          '   <div data-bind="text: $data.text, css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
          '   <!-- /ko -->' +
          '  <!-- ko ifnot: $data.hasText -->' +
          '  <div data-bind="  css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
          '  <!-- /ko -->' +
          ' </div>' +
          ' <!-- /ko -->' +
          '</div>';
      } else if (!this.enableZoomControls && this.enableCompass) {
        testing =
          '<div class="compass" title="按下鼠标左键并向四周拖拽不释放 可修改视图角度。双击:重置视图。" data-bind="visible: showCompass, event: { mousedown: handleMouseDown, dblclick: handleDoubleClick }">' +
          '<div class="compass-outer-ring-background"></div>' +
          " <div class=\"compass-rotation-marker\" data-bind=\"visible: isOrbiting, style: { transform: 'rotate(-' + orbitCursorAngle + 'rad)', '-webkit-transform': 'rotate(-' + orbitCursorAngle + 'rad)', opacity: orbitCursorOpacity }\"></div>" +
          " <div class=\"compass-outer-ring\" title=\"单击并拖拽旋转，修改视角方向。\" data-bind=\"style: { transform: 'rotate(-' + heading + 'rad)', '-webkit-transform': 'rotate(-' + heading + 'rad)' } \"></div>" +
          ' <div class="compass-gyro-background"></div>' +
          ' <div class="compass-gyro" data-bind=" css: { \'compass-gyro-active\': isOrbiting }"></div>' +
          '</div>' +
          '<div class="navigation-controls"  style="display: none;" >' +
          '<!-- ko foreach: controls -->' +
          "<div data-bind=\"click: activate, attr: { title: $data.name }, css: $root.isLastControl($data) ? 'navigation-control-last' : 'navigation-control' \">" +
          '   <!-- ko if: $data.hasText -->' +
          '   <div data-bind="text: $data.text, css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
          '   <!-- /ko -->' +
          '  <!-- ko ifnot: $data.hasText -->' +
          '  <div data-bind="  css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
          '  <!-- /ko -->' +
          ' </div>' +
          ' <!-- /ko -->' +
          '</div>';
      } else if (this.enableZoomControls && !this.enableCompass) {
        testing =
          '<div class="compass"  style="display: none;" title="按下鼠标左键并向四周拖拽不释放 可修改视图角度。双击:重置视图。" data-bind="visible: showCompass, event: { mousedown: handleMouseDown, dblclick: handleDoubleClick }">' +
          '<div class="compass-outer-ring-background"></div>' +
          " <div class=\"compass-rotation-marker\" data-bind=\"visible: isOrbiting, style: { transform: 'rotate(-' + orbitCursorAngle + 'rad)', '-webkit-transform': 'rotate(-' + orbitCursorAngle + 'rad)', opacity: orbitCursorOpacity } \"></div>" +
          " <div class=\"compass-outer-ring\" title=\"单击并拖拽旋转，修改视角方向。\" data-bind=\"style: { transform: 'rotate(-' + heading + 'rad)', '-webkit-transform': 'rotate(-' + heading + 'rad)' } \"></div>" +
          ' <div class="compass-gyro-background"></div>' +
          ' <div class="compass-gyro" data-bind=" css: { \'compass-gyro-active\': isOrbiting }"></div>' +
          '</div>' +
          '<div class="navigation-controls"    >' +
          '<!-- ko foreach: controls -->' +
          "<div data-bind=\"click: activate, attr: { title: $data.name }, css: $root.isLastControl($data) ? 'navigation-control-last' : 'navigation-control' \">" +
          '   <!-- ko if: $data.hasText -->' +
          '   <div data-bind="text: $data.text, css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
          '   <!-- /ko -->' +
          '  <!-- ko ifnot: $data.hasText -->' +
          '  <div data-bind="  css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
          '  <!-- /ko -->' +
          ' </div>' +
          ' <!-- /ko -->' +
          '</div>';
      } else if (!this.enableZoomControls && !this.enableCompass) {
        testing =
          '<div class="compass"  style="display: none;" title=按下鼠标左键并向四周拖拽不释放 可修改视图角度。双击:重置视图。" data-bind="visible: showCompass, event: { mousedown: handleMouseDown, dblclick: handleDoubleClick }">' +
          '<div class="compass-outer-ring-background"></div>' +
          " <div class=\"compass-rotation-marker\" data-bind=\"visible: isOrbiting, style: { transform: 'rotate(-' + orbitCursorAngle + 'rad)', '-webkit-transform': 'rotate(-' + orbitCursorAngle + 'rad)', opacity: orbitCursorOpacity } \"></div>" +
          " <div class=\"compass-outer-ring\" title=\"单击并拖拽旋转，修改视角方向。\" data-bind=\"style: { transform: 'rotate(-' + heading + 'rad)', '-webkit-transform': 'rotate(-' + heading + 'rad)' } \"></div>" +
          ' <div class="compass-gyro-background"></div>' +
          ' <div class="compass-gyro" data-bind="  css: { \'compass-gyro-active\': isOrbiting }"></div>' +
          '</div>' +
          '<div class="navigation-controls"   style="display: none;" >' +
          '<!-- ko foreach: controls -->' +
          "<div data-bind=\"click: activate, attr: { title: $data.name }, css: $root.isLastControl($data) ? 'navigation-control-last' : 'navigation-control' \">" +
          '   <!-- ko if: $data.hasText -->' +
          '   <div data-bind="text: $data.text, css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
          '   <!-- /ko -->' +
          '  <!-- ko ifnot: $data.hasText -->' +
          '  <div data-bind="  css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
          '  <!-- /ko -->' +
          ' </div>' +
          ' <!-- /ko -->' +
          '</div>';
      }
      loadView(testing, container, this);
      // loadView(navigatorTemplate, container, this);
      //loadView(require('fs').readFileSync(baseURLEmpCesium + 'js-lib/terrajs/lib/Views/Navigation.html', 'utf8'), container, this);
    };

    /**
     * Adds a control to this toolbar.
     * @param {NavControl} control The control to add.
     */
    NavigationViewModel.prototype.add = function(control) {
      this.controls.push(control);
    };

    /**
     * Removes a control from this toolbar.
     * @param {NavControl} control The control to remove.
     */
    NavigationViewModel.prototype.remove = function(control) {
      this.controls.remove(control);
    };

    /**
     * Checks if the control given is the last control in the control array.
     * @param {NavControl} control The control to remove.
     */
    NavigationViewModel.prototype.isLastControl = function(control) {
      return control === this.controls[this.controls.length - 1];
    };

    var vectorScratch = new Cartesian2();

    NavigationViewModel.prototype.handleMouseDown = function(viewModel, e) {
      var scene = this.terria.scene;
      if (scene.mode === SceneMode.MORPHING) {
        return true;
      }

      var compassElement = e.currentTarget;
      var compassRectangle = e.currentTarget.getBoundingClientRect();
      var maxDistance = compassRectangle.width / 2.0;
      var center = new Cartesian2(
        (compassRectangle.right - compassRectangle.left) / 2.0,
        (compassRectangle.bottom - compassRectangle.top) / 2.0,
      );
      var clickLocation = new Cartesian2(
        e.clientX - compassRectangle.left,
        e.clientY - compassRectangle.top,
      );
      var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
      var distanceFromCenter = Cartesian2.magnitude(vector);

      var distanceFraction = distanceFromCenter / maxDistance;

      var nominalTotalRadius = 145;
      var norminalGyroRadius = 50;

      if (distanceFraction < norminalGyroRadius / nominalTotalRadius) {
        orbit(this, compassElement, vector);
        //            return false;
      } else if (distanceFraction < 1.0) {
        rotate(this, compassElement, vector);
        //            return false;
      } else {
        return true;
      }
    };

    var oldTransformScratch = new Matrix4();
    var newTransformScratch = new Matrix4();
    var centerScratch = new Cartesian3();

    NavigationViewModel.prototype.handleDoubleClick = function(viewModel, e) {
      var scene = viewModel.terria.scene;
      var camera = scene.camera;

      var sscc = scene.screenSpaceCameraController;

      if (scene.mode == SceneMode.MORPHING || !sscc.enableInputs) {
        return true;
      }
      if (scene.mode == SceneMode.COLUMBUS_VIEW && !sscc.enableTranslate) {
        return;
      }
      if (scene.mode == SceneMode.SCENE3D || scene.mode == SceneMode.COLUMBUS_VIEW) {
        if (!sscc.enableLook) {
          return;
        }

        if (scene.mode == SceneMode.SCENE3D) {
          if (!sscc.enableRotate) {
            return;
          }
        }
      }

      var center = Utils.getCameraFocus(viewModel.terria, true, centerScratch);

      if (!defined(center)) {
        // Globe is barely visible, so reset to home view.

        // this.controls[1].resetView();//old
        // var cameraPosition = scene.globe.ellipsoid.cartographicToCartesian(camera.positionCartographic, new Cartesian3());

        // console.log("cameraPosition",mars3d.point.formatPositon(cameraPosition));
        // if(cameraPosition.z<1.0){
        //     this.flyHome(viewModel,{
        //         x:cameraPosition.x,
        //         y:cameraPosition.y,
        //         z:200,
        //     });
        //     return;
        // }
        this.flyHome(viewModel);
        return;
      }

      // 计算出经纬度，判断是否在地下
      // console.log("center",mars3d.point.formatPositon(center));

      var cameraPosition = scene.globe.ellipsoid.cartographicToCartesian(
        camera.positionCartographic,
        new Cartesian3(),
      );

      // console.log("cameraPosition",mars3d.point.formatPositon(cameraPosition));

      var cameraCoord = mars3d.point.formatPositon(cameraPosition);
      var rad = 0;
      if (cameraCoord.z < 3.0) {
        cameraCoord.z = 300;
        this.flyHome(viewModel, cameraCoord);
        return;
      }

      var surfaceNormal = scene.globe.ellipsoid.geodeticSurfaceNormal(center);

      var focusBoundingSphere = new BoundingSphere(center, 0);

      camera.flyToBoundingSphere(focusBoundingSphere, {
        offset: new HeadingPitchRange(
          0,
          // do not use camera.pitch since the pitch at the center/target is required
          CesiumMath.PI_OVER_TWO - Cartesian3.angleBetween(surfaceNormal, camera.directionWC),
          // distanceToBoundingSphere returns wrong values when in 2D or Columbus view so do not use
          // camera.distanceToBoundingSphere(focusBoundingSphere)
          // instead calculate distance manually
          Cartesian3.distance(cameraPosition, center),
        ),
        duration: 1.5,
      });
    };

    NavigationViewModel.prototype.flyHome = function(viewModel, options) {
      // var viewer = viewModel.terria;
      var scene = viewModel.terria.scene;
      var camera = scene.camera;
      options = options || {};
      var centeropt = {
        x: options.x || 114.14347633526161,
        y: options.y || 22.63403261589422,
        z: options.z || 93996.87093563561,
        heading: 360,
        pitch: -90,
        roll: 360,
      };
      var height = centeropt.z || 2500;
      camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(centeropt.x, centeropt.y, height), //经度、纬度、高度
        orientation: {
          heading: Cesium.Math.toRadians(centeropt.heading || 0), //绕垂直于地心的轴旋转
          pitch: Cesium.Math.toRadians(centeropt.pitch || -90), //绕纬度线旋转
          roll: Cesium.Math.toRadians(centeropt.roll || 0), //绕经度线旋转
        },
        duration: 4,
      });
    };

    NavigationViewModel.create = function(options) {
      //options.enableZoomControls = this.enableZoomControls;
      //options.enableCompass = this.enableCompass;
      var result = new NavigationViewModel(options);
      result.show(options.container);
      return result;
    };

    function orbit(viewModel, compassElement, cursorVector) {
      var scene = viewModel.terria.scene;

      var sscc = scene.screenSpaceCameraController;

      // do not orbit if it is disabled
      if (scene.mode == SceneMode.MORPHING || !sscc.enableInputs) {
        return;
      }

      switch (scene.mode) {
        case SceneMode.COLUMBUS_VIEW:
          if (sscc.enableLook) {
            break;
          }

          if (!sscc.enableTranslate || !sscc.enableTilt) {
            return;
          }
          break;
        case SceneMode.SCENE3D:
          if (sscc.enableLook) {
            break;
          }

          if (!sscc.enableTilt || !sscc.enableRotate) {
            return;
          }
          break;
        case SceneMode.SCENE2D:
          if (!sscc.enableTranslate) {
            return;
          }
          break;
      }

      // Remove existing event handlers, if any.
      document.removeEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
      document.removeEventListener('mouseup', viewModel.orbitMouseUpFunction, false);

      if (defined(viewModel.orbitTickFunction)) {
        viewModel.terria.clock.onTick.removeEventListener(viewModel.orbitTickFunction);
      }

      viewModel.orbitMouseMoveFunction = undefined;
      viewModel.orbitMouseUpFunction = undefined;
      viewModel.orbitTickFunction = undefined;

      viewModel.isOrbiting = true;
      viewModel.orbitLastTimestamp = getTimestamp();

      var camera = scene.camera;

      if (defined(viewModel.terria.trackedEntity)) {
        // when tracking an entity simply use that reference frame
        viewModel.orbitFrame = undefined;
        viewModel.orbitIsLook = false;
      } else {
        var center = Utils.getCameraFocus(viewModel.terria, true, centerScratch);

        if (!defined(center)) {
          viewModel.orbitFrame = Transforms.eastNorthUpToFixedFrame(
            camera.positionWC,
            scene.globe.ellipsoid,
            newTransformScratch,
          );
          viewModel.orbitIsLook = true;
        } else {
          viewModel.orbitFrame = Transforms.eastNorthUpToFixedFrame(
            center,
            scene.globe.ellipsoid,
            newTransformScratch,
          );
          viewModel.orbitIsLook = false;
        }
      }

      viewModel.orbitTickFunction = function(e) {
        var timestamp = getTimestamp();
        var deltaT = timestamp - viewModel.orbitLastTimestamp;
        var rate = ((viewModel.orbitCursorOpacity - 0.5) * 2.5) / 1000;
        var distance = deltaT * rate;

        var angle = viewModel.orbitCursorAngle + CesiumMath.PI_OVER_TWO;
        var x = Math.cos(angle) * distance;
        var y = Math.sin(angle) * distance;

        var oldTransform;

        if (defined(viewModel.orbitFrame)) {
          oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);

          camera.lookAtTransform(viewModel.orbitFrame);
        }

        // do not look up/down or rotate in 2D mode
        if (scene.mode == SceneMode.SCENE2D) {
          camera.move(
            new Cartesian3(x, y, 0),
            (Math.max(scene.canvas.clientWidth, scene.canvas.clientHeight) / 100) *
              camera.positionCartographic.height *
              distance,
          );
        } else {
          if (viewModel.orbitIsLook) {
            camera.look(Cartesian3.UNIT_Z, -x);
            camera.look(camera.right, -y);
          } else {
            camera.rotateLeft(x);
            camera.rotateUp(y);
          }
        }

        if (defined(viewModel.orbitFrame)) {
          camera.lookAtTransform(oldTransform);
        }

        // viewModel.terria.cesium.notifyRepaintRequired();

        viewModel.orbitLastTimestamp = timestamp;
      };

      function updateAngleAndOpacity(vector, compassWidth) {
        var angle = Math.atan2(-vector.y, vector.x);
        viewModel.orbitCursorAngle = CesiumMath.zeroToTwoPi(angle - CesiumMath.PI_OVER_TWO);

        var distance = Cartesian2.magnitude(vector);
        var maxDistance = compassWidth / 2.0;
        var distanceFraction = Math.min(distance / maxDistance, 1.0);
        var easedOpacity = 0.5 * distanceFraction * distanceFraction + 0.5;
        viewModel.orbitCursorOpacity = easedOpacity;

        //viewModel.terria.cesium.notifyRepaintRequired();
      }

      viewModel.orbitMouseMoveFunction = function(e) {
        var compassRectangle = compassElement.getBoundingClientRect();
        var center = new Cartesian2(
          (compassRectangle.right - compassRectangle.left) / 2.0,
          (compassRectangle.bottom - compassRectangle.top) / 2.0,
        );
        var clickLocation = new Cartesian2(
          e.clientX - compassRectangle.left,
          e.clientY - compassRectangle.top,
        );
        var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
        updateAngleAndOpacity(vector, compassRectangle.width);
      };

      viewModel.orbitMouseUpFunction = function(e) {
        // TODO: if mouse didn't move, reset view to looking down, north is up?

        viewModel.isOrbiting = false;
        document.removeEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
        document.removeEventListener('mouseup', viewModel.orbitMouseUpFunction, false);

        if (defined(viewModel.orbitTickFunction)) {
          viewModel.terria.clock.onTick.removeEventListener(viewModel.orbitTickFunction);
        }

        viewModel.orbitMouseMoveFunction = undefined;
        viewModel.orbitMouseUpFunction = undefined;
        viewModel.orbitTickFunction = undefined;
      };

      document.addEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
      document.addEventListener('mouseup', viewModel.orbitMouseUpFunction, false);
      viewModel.terria.clock.onTick.addEventListener(viewModel.orbitTickFunction);

      updateAngleAndOpacity(cursorVector, compassElement.getBoundingClientRect().width);
    }

    function rotate(viewModel, compassElement, cursorVector) {
      viewModel.terria.options.enableCompassOuterRing = defined(
        viewModel.terria.options.enableCompassOuterRing,
      )
        ? viewModel.terria.options.enableCompassOuterRing
        : true;
      if (viewModel.terria.options.enableCompassOuterRing) {
        var scene = viewModel.terria.scene;
        var camera = scene.camera;

        var sscc = scene.screenSpaceCameraController;
        // do not rotate in 2D mode or if rotating is disabled
        if (
          scene.mode == SceneMode.MORPHING ||
          scene.mode == SceneMode.SCENE2D ||
          !sscc.enableInputs
        ) {
          return;
        }
        if (
          !sscc.enableLook &&
          (scene.mode == SceneMode.COLUMBUS_VIEW ||
            (scene.mode == SceneMode.SCENE3D && !sscc.enableRotate))
        ) {
          return;
        }

        // Remove existing event handlers, if any.
        document.removeEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
        document.removeEventListener('mouseup', viewModel.rotateMouseUpFunction, false);

        viewModel.rotateMouseMoveFunction = undefined;
        viewModel.rotateMouseUpFunction = undefined;

        viewModel.isRotating = true;
        viewModel.rotateInitialCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

        if (defined(viewModel.terria.trackedEntity)) {
          // when tracking an entity simply use that reference frame
          viewModel.rotateFrame = undefined;
          viewModel.rotateIsLook = false;
        } else {
          var viewCenter = Utils.getCameraFocus(viewModel.terria, true, centerScratch);

          if (
            !defined(viewCenter) ||
            (scene.mode == SceneMode.COLUMBUS_VIEW && !sscc.enableLook && !sscc.enableTranslate)
          ) {
            viewModel.rotateFrame = Transforms.eastNorthUpToFixedFrame(
              camera.positionWC,
              scene.globe.ellipsoid,
              newTransformScratch,
            );
            viewModel.rotateIsLook = true;
          } else {
            viewModel.rotateFrame = Transforms.eastNorthUpToFixedFrame(
              viewCenter,
              scene.globe.ellipsoid,
              newTransformScratch,
            );
            viewModel.rotateIsLook = false;
          }
        }

        var oldTransform;
        if (defined(viewModel.rotateFrame)) {
          oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
          camera.lookAtTransform(viewModel.rotateFrame);
        }

        viewModel.rotateInitialCameraAngle = -camera.heading;

        if (defined(viewModel.rotateFrame)) {
          camera.lookAtTransform(oldTransform);
        }

        viewModel.rotateMouseMoveFunction = function(e) {
          var compassRectangle = compassElement.getBoundingClientRect();
          var center = new Cartesian2(
            (compassRectangle.right - compassRectangle.left) / 2.0,
            (compassRectangle.bottom - compassRectangle.top) / 2.0,
          );
          var clickLocation = new Cartesian2(
            e.clientX - compassRectangle.left,
            e.clientY - compassRectangle.top,
          );
          var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
          var angle = Math.atan2(-vector.y, vector.x);

          var angleDifference = angle - viewModel.rotateInitialCursorAngle;
          var newCameraAngle = CesiumMath.zeroToTwoPi(
            viewModel.rotateInitialCameraAngle - angleDifference,
          );

          var camera = viewModel.terria.scene.camera;

          var oldTransform;
          if (defined(viewModel.rotateFrame)) {
            oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
            camera.lookAtTransform(viewModel.rotateFrame);
          }

          var currentCameraAngle = -camera.heading;
          camera.rotateRight(newCameraAngle - currentCameraAngle);

          if (defined(viewModel.rotateFrame)) {
            camera.lookAtTransform(oldTransform);
          }

          // viewModel.terria.cesium.notifyRepaintRequired();
        };

        viewModel.rotateMouseUpFunction = function(e) {
          viewModel.isRotating = false;
          document.removeEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
          document.removeEventListener('mouseup', viewModel.rotateMouseUpFunction, false);

          viewModel.rotateMouseMoveFunction = undefined;
          viewModel.rotateMouseUpFunction = undefined;
        };

        document.addEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
        document.addEventListener('mouseup', viewModel.rotateMouseUpFunction, false);
      }
    }
    return NavigationViewModel;
  });

  /*global define*/
  define('CesiumNavigation', [
    'Cesium/Core/defined',
    'Cesium/Core/defineProperties',
    //    'Cesium/Core/defaultValue',
    'Cesium/Core/Event',
    'KnockoutES5',
    'Core/registerKnockoutBindings',
    'ViewModels/DistanceLegendViewModel',
    'ViewModels/NavigationViewModel',
  ], function(
    defined,
    defineProperties,
    //    defaultValue,
    CesiumEvent,
    Knockout,
    registerKnockoutBindings,
    DistanceLegendViewModel,
    NavigationViewModel,
  ) {
    'use strict';

    /**
     * @alias CesiumNavigation
     * @constructor
     *
     * @param {Viewer|CesiumWidget} viewerCesiumWidget The Viewer or CesiumWidget instance
     */
    var CesiumNavigation = function(viewerCesiumWidget) {
      initialize.apply(this, arguments);

      this._onDestroyListeners = [];
    };

    CesiumNavigation.prototype.distanceLegendViewModel = undefined;
    CesiumNavigation.prototype.navigationViewModel = undefined;
    CesiumNavigation.prototype.navigationDiv = undefined;
    CesiumNavigation.prototype.distanceLegendDiv = undefined;
    CesiumNavigation.prototype.terria = undefined;
    CesiumNavigation.prototype.container = undefined;
    CesiumNavigation.prototype._onDestroyListeners = undefined;

    CesiumNavigation.prototype.destroy = function() {
      if (defined(this.navigationViewModel)) {
        this.navigationViewModel.destroy();
      }
      if (defined(this.distanceLegendViewModel)) {
        this.distanceLegendViewModel.destroy();
      }

      if (defined(this.navigationDiv)) {
        this.navigationDiv.parentNode.removeChild(this.navigationDiv);
      }
      delete this.navigationDiv;

      if (defined(this.distanceLegendDiv)) {
        this.distanceLegendDiv.parentNode.removeChild(this.distanceLegendDiv);
      }
      delete this.distanceLegendDiv;

      if (defined(this.container)) {
        this.container.parentNode.removeChild(this.container);
      }
      delete this.container;

      for (var i = 0; i < this._onDestroyListeners.length; i++) {
        this._onDestroyListeners[i]();
      }
    };

    CesiumNavigation.prototype.addOnDestroyListener = function(callback) {
      if (typeof callback === 'function') {
        this._onDestroyListeners.push(callback);
      }
    };

    /**
     * @param {Viewer|CesiumWidget} viewerCesiumWidget The Viewer or CesiumWidget instance
     * @param options
     */
    function initialize(viewerCesiumWidget, options) {
      if (!defined(viewerCesiumWidget)) {
        throw new DeveloperError('CesiumWidget or Viewer is required.');
      }

      //        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

      var cesiumWidget = defined(viewerCesiumWidget.cesiumWidget)
        ? viewerCesiumWidget.cesiumWidget
        : viewerCesiumWidget;

      var container = document.createElement('div');
      container.className = 'cesium-widget-cesiumNavigationContainer';
      cesiumWidget.container.appendChild(container);

      this.terria = viewerCesiumWidget;
      this.terria.options = defined(options) ? options : {};
      this.terria.afterWidgetChanged = new CesiumEvent();
      this.terria.beforeWidgetChanged = new CesiumEvent();
      this.container = container;

      //this.navigationDiv.setAttribute("id", "navigationDiv");

      // Register custom Knockout.js bindings.  If you're not using the TerriaJS user interface, you can remove this.
      registerKnockoutBindings();

      if (
        !defined(this.terria.options.enableDistanceLegend) ||
        this.terria.options.enableDistanceLegend
      ) {
        this.distanceLegendDiv = document.createElement('div');
        container.appendChild(this.distanceLegendDiv);
        this.distanceLegendDiv.setAttribute('id', 'distanceLegendDiv');
        this.distanceLegendViewModel = DistanceLegendViewModel.create({
          container: this.distanceLegendDiv,
          terria: this.terria,
          mapElement: container,
          enableDistanceLegend: true,
        });
      }

      if (
        (!defined(this.terria.options.enableZoomControls) ||
          this.terria.options.enableZoomControls) &&
        (!defined(this.terria.options.enableCompass) || this.terria.options.enableCompass)
      ) {
        this.navigationDiv = document.createElement('div');
        this.navigationDiv.setAttribute('id', 'navigationDiv');
        container.appendChild(this.navigationDiv);
        // Create the navigation controls.
        this.navigationViewModel = NavigationViewModel.create({
          container: this.navigationDiv,
          terria: this.terria,
          enableZoomControls: true,
          enableCompass: true,
        });
      } else if (
        defined(this.terria.options.enableZoomControls) &&
        !this.terria.options.enableZoomControls &&
        (!defined(this.terria.options.enableCompass) || this.terria.options.enableCompass)
      ) {
        this.navigationDiv = document.createElement('div');
        this.navigationDiv.setAttribute('id', 'navigationDiv');
        container.appendChild(this.navigationDiv);
        // Create the navigation controls.
        this.navigationViewModel = NavigationViewModel.create({
          container: this.navigationDiv,
          terria: this.terria,
          enableZoomControls: false,
          enableCompass: true,
        });
      } else if (
        (!defined(this.terria.options.enableZoomControls) ||
          this.terria.options.enableZoomControls) &&
        defined(this.terria.options.enableCompass) &&
        !this.terria.options.enableCompass
      ) {
        this.navigationDiv = document.createElement('div');
        this.navigationDiv.setAttribute('id', 'navigationDiv');
        container.appendChild(this.navigationDiv);
        // Create the navigation controls.
        this.navigationViewModel = NavigationViewModel.create({
          container: this.navigationDiv,
          terria: this.terria,
          enableZoomControls: true,
          enableCompass: false,
        });
      } else if (
        defined(this.terria.options.enableZoomControls) &&
        !this.terria.options.enableZoomControls &&
        defined(this.terria.options.enableCompass) &&
        !this.terria.options.enableCompass
      ) {
        //this.navigationDiv.setAttribute("id", "navigationDiv");
        // container.appendChild(this.navigationDiv);
        // Create the navigation controls.
        //            this.navigationViewModel = NavigationViewModel.create({
        //                container: this.navigationDiv,
        //                terria: this.terria,
        //                enableZoomControls: false,
        //                enableCompass: false
        //            });
      }
    }

    return CesiumNavigation;
  });
  /**
   * Created by Larcius on 18.02.16.
   */
  /*global define*/
  define('viewerCesiumNavigationMixin', [
    'Cesium/Core/defined',
    'Cesium/Core/defineProperties',
    'Cesium/Core/DeveloperError',
    'CesiumNavigation',
    //'dummy/require-less/less/dummy'
  ], function(defined, defineProperties, DeveloperError, CesiumNavigation) {
    'use strict';

    /**
     * A mixin which adds the Compass/Navigation widget to the Viewer widget.
     * Rather than being called directly, this function is normally passed as
     * a parameter to {@link Viewer#extend}, as shown in the example below.
     * @exports viewerCesiumNavigationMixin
     *
     * @param {Viewer} viewer The viewer instance.
     * @param {{}} options The options.
     *
     * @exception {DeveloperError} viewer is required.
     *
     * @demo {@link http://localhost:8080/index.html|run local server with examples}
     *
     * @example
     * var viewer = new Cesium.Viewer('cesiumContainer');
     * viewer.extend(viewerCesiumNavigationMixin);
     */
    function viewerCesiumNavigationMixin(viewer, options) {
      if (!defined(viewer)) {
        throw new DeveloperError('viewer is required.');
      }

      var cesiumNavigation = init(viewer, options);

      cesiumNavigation.addOnDestroyListener(
        (function(viewer) {
          return function() {
            delete viewer.cesiumNavigation;
          };
        })(viewer),
      );

      Object.defineProperties(viewer, {
        cesiumNavigation: {
          configurable: true,
          get: function() {
            return viewer.cesiumWidget.cesiumNavigation;
          },
        },
      });
    }

    /**
     *
     * @param {CesiumWidget} cesiumWidget The cesium widget instance.
     * @param {{}} options The options.
     */
    viewerCesiumNavigationMixin.mixinWidget = function(cesiumWidget, options) {
      return init.apply(undefined, arguments);
    };

    /**
     * @param {Viewer|CesiumWidget} viewerCesiumWidget The Viewer or CesiumWidget instance
     * @param {{}} options the options
     */
    var init = function(viewerCesiumWidget, options) {
      var cesiumNavigation = new CesiumNavigation(viewerCesiumWidget, options);

      var cesiumWidget = defined(viewerCesiumWidget.cesiumWidget)
        ? viewerCesiumWidget.cesiumWidget
        : viewerCesiumWidget;

      Object.defineProperties(cesiumWidget, {
        cesiumNavigation: {
          configurable: true,
          get: function() {
            return cesiumNavigation;
          },
        },
      });

      cesiumNavigation.addOnDestroyListener(
        (function(cesiumWidget) {
          return function() {
            delete cesiumWidget.cesiumNavigation;
          };
        })(cesiumWidget),
      );

      return cesiumNavigation;
    };

    return viewerCesiumNavigationMixin;
  });

  // actual code -->

  /*global define,require,self,Cesium*/

  define('Cesium/Core/defined', function() {
    return Cesium['defined'];
  });
  define('Cesium/Core/defineProperties', function() {
    return Cesium['defineProperties'];
  });
  define('Cesium/Core/defaultValue', function() {
    return Cesium['defaultValue'];
  });
  define('Cesium/Core/Event', function() {
    return Cesium['Event'];
  });
  define('Cesium/Widgets/getElement', function() {
    return Cesium['getElement'];
  });
  define('Cesium/Widgets/SvgPathBindingHandler', function() {
    return Cesium['SvgPathBindingHandler'];
  });
  define('Cesium/Core/Ray', function() {
    return Cesium['Ray'];
  });
  define('Cesium/Core/Cartesian3', function() {
    return Cesium['Cartesian3'];
  });
  define('Cesium/Core/Cartographic', function() {
    return Cesium['Cartographic'];
  });
  define('Cesium/Core/ReferenceFrame', function() {
    return Cesium['ReferenceFrame'];
  });
  define('Cesium/Scene/SceneMode', function() {
    return Cesium['SceneMode'];
  });
  define('Cesium/Core/DeveloperError', function() {
    return Cesium['DeveloperError'];
  });
  define('Cesium/Core/EllipsoidGeodesic', function() {
    return Cesium['EllipsoidGeodesic'];
  });
  define('Cesium/Core/Cartesian2', function() {
    return Cesium['Cartesian2'];
  });
  define('Cesium/Core/getTimestamp', function() {
    return Cesium['getTimestamp'];
  });
  define('Cesium/Core/EventHelper', function() {
    return Cesium['EventHelper'];
  });
  define('Cesium/Core/Math', function() {
    return Cesium['Math'];
  });
  define('Cesium/Core/Transforms', function() {
    return Cesium['Transforms'];
  });
  define('Cesium/Core/Matrix4', function() {
    return Cesium['Matrix4'];
  });
  define('Cesium/Core/BoundingSphere', function() {
    return Cesium['BoundingSphere'];
  });
  define('Cesium/Core/HeadingPitchRange', function() {
    return Cesium['HeadingPitchRange'];
  });
  define('Cesium/Scene/Camera', function() {
    return Cesium['Camera'];
  });
  define('Cesium/Core/Rectangle', function() {
    return Cesium['Rectangle'];
  });
  define('Cesium/Core/IntersectionTests', function() {
    return Cesium['IntersectionTests'];
  });

  return require('viewerCesiumNavigationMixin');
});
