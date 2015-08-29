

var Core, checkType;

checkType = function(type, val, name) {
  if (typeof val !== type) {
    return name + " has to be a " + type;
  }
};

Core = (function() {
  function Core(Sandbox1) {
    var err;
    this.Sandbox = Sandbox1;
    if (this.Sandbox != null) {
      err = checkType('function', this.Sandbox, 'Sandbox');
    }
    if (err) {
      throw new Error(err);
    }
    this._modules = {};
    this._plugins = [];
    this._instances = {};
    this._sandboxes = {};
    this._running = {};
    this._mediator = new Mediator(this);
    this.Mediator = Mediator;
    if (this.Sandbox == null) {
      this.Sandbox = function(core, instanceId, options1, moduleId1) {
        this.instanceId = instanceId;
        this.options = options1 != null ? options1 : {};
        this.moduleId = moduleId1;
        core._mediator.installTo(this);
        return this;
      };
    }
  }

  Core.prototype.log = {
    error: function() {},
    log: function() {},
    info: function() {},
    warn: function() {},
    enable: function() {}
  };

  Core.prototype.register = function(id, creator, options) {
    var err;
    if (options == null) {
      options = {};
    }
    err = checkType("string", id, "module ID") || checkType("function", creator, "creator") || checkType("object", options, "option parameter");
    if (err) {
      this.log.error("could not register module '" + id + "': " + err);
      return this;
    }
    if (id in this._modules) {
      this.log.warn("module " + id + " was already registered");
      return this;
    }
    this._modules[id] = {
      creator: creator,
      options: options,
      id: id
    };
    return this;
  };

  Core.prototype.start = function(moduleId, opt, cb) {
    var e, id, initInst;
    if (opt == null) {
      opt = {};
    }
    if (cb == null) {
      cb = function() {};
    }
    if (arguments.length === 0) {
      return this._startAll();
    }
    if (moduleId instanceof Array) {
      return this._startAll(moduleId, opt);
    }
    if (typeof moduleId === "function") {
      return this._startAll(null, moduleId);
    }
    if (typeof opt === "function") {
      cb = opt;
      opt = {};
    }
    e = checkType("string", moduleId, "module ID") || checkType("object", opt, "second parameter") || (!this._modules[moduleId] ? "module doesn't exist" : void 0);
    if (e) {
      return this._startFail(e, cb);
    }
    id = opt.instanceId || moduleId;
    if (this._running[id] === true) {
      return this._startFail(new Error("module was already started"), cb);
    }
    initInst = (function(_this) {
      return function(err, instance, opt) {
        if (err) {
          return _this._startFail(err, cb);
        }
        try {
          if (util.hasArgument(instance.init, 2)) {
            return instance.init(opt, function(err) {
              if (!err) {
                _this._running[id] = true;
              }
              return cb(err);
            });
          } else {
            instance.init(opt);
            _this._running[id] = true;
            return cb();
          }
        } catch (_error) {
          e = _error;
          return _this._startFail(e, cb);
        }
      };
    })(this);
    return this.boot((function(_this) {
      return function(err) {
        if (err) {
          return _this._startFail(err, cb);
        }
        return _this._createInstance(moduleId, opt, initInst);
      };
    })(this));
  };

  Core.prototype._startFail = function(e, cb) {
    this.log.error(e);
    cb(new Error("could not start module: " + e.message));
    return this;
  };

  Core.prototype._createInstance = function(moduleId, o, cb) {
    var Sandbox, iOpts, id, j, key, len, module, obj, opt, ref, sb, val;
    id = o.instanceId || moduleId;
    opt = o.options;
    module = this._modules[moduleId];
    if (this._instances[id]) {
      return cb(this._instances[id]);
    }
    iOpts = {};
    ref = [module.options, opt];
    for (j = 0, len = ref.length; j < len; j++) {
      obj = ref[j];
      if (obj) {
        for (key in obj) {
          val = obj[key];
          if (iOpts[key] == null) {
            iOpts[key] = val;
          }
        }
      }
    }
    Sandbox = typeof o.sandbox === 'function' ? o.sandbox : this.Sandbox;
    sb = new Sandbox(this, id, iOpts, moduleId);
    return this._runSandboxPlugins('init', sb, (function(_this) {
      return function(err) {
        var instance;
        instance = new module.creator(sb);
        if (typeof instance.init !== "function") {
          return cb(new Error("module has no 'init' method"));
        }
        _this._instances[id] = instance;
        _this._sandboxes[id] = sb;
        return cb(null, instance, iOpts);
      };
    })(this));
  };

  Core.prototype._runSandboxPlugins = function(ev, sb, cb) {
    var p, tasks;
    tasks = (function() {
      var j, len, ref, ref1, results;
      ref = this._plugins;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        p = ref[j];
        if (typeof ((ref1 = p.plugin) != null ? ref1[ev] : void 0) === "function") {
          results.push((function(p) {
            var fn;
            fn = p.plugin[ev];
            return function(next) {
              if (util.hasArgument(fn, 3)) {
                return fn(sb, p.options, next);
              } else {
                fn(sb, p.options);
                return next();
              }
            };
          })(p));
        }
      }
      return results;
    }).call(this);
    return util.runSeries(tasks, cb, true);
  };

  Core.prototype._startAll = function(mods, cb) {
    var done, m, startAction;
    if (mods == null) {
      mods = (function() {
        var results;
        results = [];
        for (m in this._modules) {
          results.push(m);
        }
        return results;
      }).call(this);
    }
    startAction = (function(_this) {
      return function(m, next) {
        return _this.start(m, _this._modules[m].options, next);
      };
    })(this);
    done = function(err) {
      var e, i, j, k, len, mdls, modErrors, x;
      if ((err != null ? err.length : void 0) > 0) {
        modErrors = {};
        for (i = j = 0, len = err.length; j < len; i = ++j) {
          x = err[i];
          if (x != null) {
            modErrors[mods[i]] = x;
          }
        }
        mdls = (function() {
          var results;
          results = [];
          for (k in modErrors) {
            results.push("'" + k + "'");
          }
          return results;
        })();
        e = new Error("errors occurred in the following modules: " + mdls);
        e.moduleErrors = modErrors;
      }
      return typeof cb === "function" ? cb(e) : void 0;
    };
    util.doForAll(mods, startAction, done, true);
    return this;
  };

  Core.prototype.stop = function(id, cb) {
    var instance, x;
    if (cb == null) {
      cb = function() {};
    }
    if (arguments.length === 0 || typeof id === "function") {
      util.doForAll((function() {
        var results;
        results = [];
        for (x in this._instances) {
          results.push(x);
        }
        return results;
      }).call(this), ((function(_this) {
        return function() {
          return _this.stop.apply(_this, arguments);
        };
      })(this)), id, true);
    } else if (instance = this._instances[id]) {
      delete this._instances[id];
      this._mediator.off(instance);
      this._runSandboxPlugins('destroy', this._sandboxes[id], (function(_this) {
        return function(err) {
          if (util.hasArgument(instance.destroy)) {
            return instance.destroy(function(err2) {
              delete _this._running[id];
              return cb(err || err2);
            });
          } else {
            if (typeof instance.destroy === "function") {
              instance.destroy();
            }
            delete _this._running[id];
            return cb(err);
          }
        };
      })(this));
    }
    return this;
  };

  Core.prototype.use = function(plugin, opt) {
    var j, len, p;
    if (plugin instanceof Array) {
      for (j = 0, len = plugin.length; j < len; j++) {
        p = plugin[j];
        switch (typeof p) {
          case "function":
            this.use(p);
            break;
          case "object":
            this.use(p.plugin, p.options);
        }
      }
    } else {
      if (typeof plugin !== "function") {
        return this;
      }
      this._plugins.push({
        creator: plugin,
        options: opt
      });
    }
    return this;
  };

  Core.prototype.boot = function(cb) {
    var core, p, tasks;
    core = this;
    tasks = (function() {
      var j, len, ref, results;
      ref = this._plugins;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        p = ref[j];
        if (p.booted !== true) {
          results.push((function(p) {
            if (util.hasArgument(p.creator, 3)) {
              return function(next) {
                var plugin;
                return plugin = p.creator(core, p.options, function(err) {
                  if (!err) {
                    p.booted = true;
                    p.plugin = plugin;
                  }
                  return next();
                });
              };
            } else {
              return function(next) {
                p.plugin = p.creator(core, p.options);
                p.booted = true;
                return next();
              };
            }
          })(p));
        }
      }
      return results;
    }).call(this);
    util.runSeries(tasks, cb, true);
    return this;
  };

  return Core;

})();

// ---
// generated by coffee-script 1.9.2