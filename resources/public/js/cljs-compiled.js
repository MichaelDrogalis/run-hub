var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__109554 = x == null ? null : x;
  if(p[goog.typeOf(x__109554)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__109555__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__109555 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__109555__delegate.call(this, array, i, idxs)
    };
    G__109555.cljs$lang$maxFixedArity = 2;
    G__109555.cljs$lang$applyTo = function(arglist__109556) {
      var array = cljs.core.first(arglist__109556);
      var i = cljs.core.first(cljs.core.next(arglist__109556));
      var idxs = cljs.core.rest(cljs.core.next(arglist__109556));
      return G__109555__delegate(array, i, idxs)
    };
    G__109555.cljs$lang$arity$variadic = G__109555__delegate;
    return G__109555
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____109641 = this$;
      if(and__3822__auto____109641) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____109641
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____109642 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109643 = cljs.core._invoke[goog.typeOf(x__2363__auto____109642)];
        if(or__3824__auto____109643) {
          return or__3824__auto____109643
        }else {
          var or__3824__auto____109644 = cljs.core._invoke["_"];
          if(or__3824__auto____109644) {
            return or__3824__auto____109644
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____109645 = this$;
      if(and__3822__auto____109645) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____109645
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____109646 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109647 = cljs.core._invoke[goog.typeOf(x__2363__auto____109646)];
        if(or__3824__auto____109647) {
          return or__3824__auto____109647
        }else {
          var or__3824__auto____109648 = cljs.core._invoke["_"];
          if(or__3824__auto____109648) {
            return or__3824__auto____109648
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____109649 = this$;
      if(and__3822__auto____109649) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____109649
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____109650 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109651 = cljs.core._invoke[goog.typeOf(x__2363__auto____109650)];
        if(or__3824__auto____109651) {
          return or__3824__auto____109651
        }else {
          var or__3824__auto____109652 = cljs.core._invoke["_"];
          if(or__3824__auto____109652) {
            return or__3824__auto____109652
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____109653 = this$;
      if(and__3822__auto____109653) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____109653
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____109654 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109655 = cljs.core._invoke[goog.typeOf(x__2363__auto____109654)];
        if(or__3824__auto____109655) {
          return or__3824__auto____109655
        }else {
          var or__3824__auto____109656 = cljs.core._invoke["_"];
          if(or__3824__auto____109656) {
            return or__3824__auto____109656
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____109657 = this$;
      if(and__3822__auto____109657) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____109657
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____109658 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109659 = cljs.core._invoke[goog.typeOf(x__2363__auto____109658)];
        if(or__3824__auto____109659) {
          return or__3824__auto____109659
        }else {
          var or__3824__auto____109660 = cljs.core._invoke["_"];
          if(or__3824__auto____109660) {
            return or__3824__auto____109660
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____109661 = this$;
      if(and__3822__auto____109661) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____109661
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____109662 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109663 = cljs.core._invoke[goog.typeOf(x__2363__auto____109662)];
        if(or__3824__auto____109663) {
          return or__3824__auto____109663
        }else {
          var or__3824__auto____109664 = cljs.core._invoke["_"];
          if(or__3824__auto____109664) {
            return or__3824__auto____109664
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____109665 = this$;
      if(and__3822__auto____109665) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____109665
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____109666 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109667 = cljs.core._invoke[goog.typeOf(x__2363__auto____109666)];
        if(or__3824__auto____109667) {
          return or__3824__auto____109667
        }else {
          var or__3824__auto____109668 = cljs.core._invoke["_"];
          if(or__3824__auto____109668) {
            return or__3824__auto____109668
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____109669 = this$;
      if(and__3822__auto____109669) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____109669
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____109670 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109671 = cljs.core._invoke[goog.typeOf(x__2363__auto____109670)];
        if(or__3824__auto____109671) {
          return or__3824__auto____109671
        }else {
          var or__3824__auto____109672 = cljs.core._invoke["_"];
          if(or__3824__auto____109672) {
            return or__3824__auto____109672
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____109673 = this$;
      if(and__3822__auto____109673) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____109673
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____109674 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109675 = cljs.core._invoke[goog.typeOf(x__2363__auto____109674)];
        if(or__3824__auto____109675) {
          return or__3824__auto____109675
        }else {
          var or__3824__auto____109676 = cljs.core._invoke["_"];
          if(or__3824__auto____109676) {
            return or__3824__auto____109676
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____109677 = this$;
      if(and__3822__auto____109677) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____109677
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____109678 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109679 = cljs.core._invoke[goog.typeOf(x__2363__auto____109678)];
        if(or__3824__auto____109679) {
          return or__3824__auto____109679
        }else {
          var or__3824__auto____109680 = cljs.core._invoke["_"];
          if(or__3824__auto____109680) {
            return or__3824__auto____109680
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____109681 = this$;
      if(and__3822__auto____109681) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____109681
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____109682 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109683 = cljs.core._invoke[goog.typeOf(x__2363__auto____109682)];
        if(or__3824__auto____109683) {
          return or__3824__auto____109683
        }else {
          var or__3824__auto____109684 = cljs.core._invoke["_"];
          if(or__3824__auto____109684) {
            return or__3824__auto____109684
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____109685 = this$;
      if(and__3822__auto____109685) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____109685
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____109686 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109687 = cljs.core._invoke[goog.typeOf(x__2363__auto____109686)];
        if(or__3824__auto____109687) {
          return or__3824__auto____109687
        }else {
          var or__3824__auto____109688 = cljs.core._invoke["_"];
          if(or__3824__auto____109688) {
            return or__3824__auto____109688
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____109689 = this$;
      if(and__3822__auto____109689) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____109689
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____109690 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109691 = cljs.core._invoke[goog.typeOf(x__2363__auto____109690)];
        if(or__3824__auto____109691) {
          return or__3824__auto____109691
        }else {
          var or__3824__auto____109692 = cljs.core._invoke["_"];
          if(or__3824__auto____109692) {
            return or__3824__auto____109692
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____109693 = this$;
      if(and__3822__auto____109693) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____109693
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____109694 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109695 = cljs.core._invoke[goog.typeOf(x__2363__auto____109694)];
        if(or__3824__auto____109695) {
          return or__3824__auto____109695
        }else {
          var or__3824__auto____109696 = cljs.core._invoke["_"];
          if(or__3824__auto____109696) {
            return or__3824__auto____109696
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____109697 = this$;
      if(and__3822__auto____109697) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____109697
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____109698 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109699 = cljs.core._invoke[goog.typeOf(x__2363__auto____109698)];
        if(or__3824__auto____109699) {
          return or__3824__auto____109699
        }else {
          var or__3824__auto____109700 = cljs.core._invoke["_"];
          if(or__3824__auto____109700) {
            return or__3824__auto____109700
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____109701 = this$;
      if(and__3822__auto____109701) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____109701
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____109702 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109703 = cljs.core._invoke[goog.typeOf(x__2363__auto____109702)];
        if(or__3824__auto____109703) {
          return or__3824__auto____109703
        }else {
          var or__3824__auto____109704 = cljs.core._invoke["_"];
          if(or__3824__auto____109704) {
            return or__3824__auto____109704
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____109705 = this$;
      if(and__3822__auto____109705) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____109705
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____109706 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109707 = cljs.core._invoke[goog.typeOf(x__2363__auto____109706)];
        if(or__3824__auto____109707) {
          return or__3824__auto____109707
        }else {
          var or__3824__auto____109708 = cljs.core._invoke["_"];
          if(or__3824__auto____109708) {
            return or__3824__auto____109708
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____109709 = this$;
      if(and__3822__auto____109709) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____109709
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____109710 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109711 = cljs.core._invoke[goog.typeOf(x__2363__auto____109710)];
        if(or__3824__auto____109711) {
          return or__3824__auto____109711
        }else {
          var or__3824__auto____109712 = cljs.core._invoke["_"];
          if(or__3824__auto____109712) {
            return or__3824__auto____109712
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____109713 = this$;
      if(and__3822__auto____109713) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____109713
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____109714 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109715 = cljs.core._invoke[goog.typeOf(x__2363__auto____109714)];
        if(or__3824__auto____109715) {
          return or__3824__auto____109715
        }else {
          var or__3824__auto____109716 = cljs.core._invoke["_"];
          if(or__3824__auto____109716) {
            return or__3824__auto____109716
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____109717 = this$;
      if(and__3822__auto____109717) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____109717
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____109718 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109719 = cljs.core._invoke[goog.typeOf(x__2363__auto____109718)];
        if(or__3824__auto____109719) {
          return or__3824__auto____109719
        }else {
          var or__3824__auto____109720 = cljs.core._invoke["_"];
          if(or__3824__auto____109720) {
            return or__3824__auto____109720
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____109721 = this$;
      if(and__3822__auto____109721) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____109721
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____109722 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____109723 = cljs.core._invoke[goog.typeOf(x__2363__auto____109722)];
        if(or__3824__auto____109723) {
          return or__3824__auto____109723
        }else {
          var or__3824__auto____109724 = cljs.core._invoke["_"];
          if(or__3824__auto____109724) {
            return or__3824__auto____109724
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____109729 = coll;
    if(and__3822__auto____109729) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____109729
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____109730 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109731 = cljs.core._count[goog.typeOf(x__2363__auto____109730)];
      if(or__3824__auto____109731) {
        return or__3824__auto____109731
      }else {
        var or__3824__auto____109732 = cljs.core._count["_"];
        if(or__3824__auto____109732) {
          return or__3824__auto____109732
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____109737 = coll;
    if(and__3822__auto____109737) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____109737
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____109738 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109739 = cljs.core._empty[goog.typeOf(x__2363__auto____109738)];
      if(or__3824__auto____109739) {
        return or__3824__auto____109739
      }else {
        var or__3824__auto____109740 = cljs.core._empty["_"];
        if(or__3824__auto____109740) {
          return or__3824__auto____109740
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____109745 = coll;
    if(and__3822__auto____109745) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____109745
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____109746 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109747 = cljs.core._conj[goog.typeOf(x__2363__auto____109746)];
      if(or__3824__auto____109747) {
        return or__3824__auto____109747
      }else {
        var or__3824__auto____109748 = cljs.core._conj["_"];
        if(or__3824__auto____109748) {
          return or__3824__auto____109748
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____109757 = coll;
      if(and__3822__auto____109757) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____109757
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____109758 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____109759 = cljs.core._nth[goog.typeOf(x__2363__auto____109758)];
        if(or__3824__auto____109759) {
          return or__3824__auto____109759
        }else {
          var or__3824__auto____109760 = cljs.core._nth["_"];
          if(or__3824__auto____109760) {
            return or__3824__auto____109760
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____109761 = coll;
      if(and__3822__auto____109761) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____109761
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____109762 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____109763 = cljs.core._nth[goog.typeOf(x__2363__auto____109762)];
        if(or__3824__auto____109763) {
          return or__3824__auto____109763
        }else {
          var or__3824__auto____109764 = cljs.core._nth["_"];
          if(or__3824__auto____109764) {
            return or__3824__auto____109764
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____109769 = coll;
    if(and__3822__auto____109769) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____109769
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____109770 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109771 = cljs.core._first[goog.typeOf(x__2363__auto____109770)];
      if(or__3824__auto____109771) {
        return or__3824__auto____109771
      }else {
        var or__3824__auto____109772 = cljs.core._first["_"];
        if(or__3824__auto____109772) {
          return or__3824__auto____109772
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____109777 = coll;
    if(and__3822__auto____109777) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____109777
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____109778 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109779 = cljs.core._rest[goog.typeOf(x__2363__auto____109778)];
      if(or__3824__auto____109779) {
        return or__3824__auto____109779
      }else {
        var or__3824__auto____109780 = cljs.core._rest["_"];
        if(or__3824__auto____109780) {
          return or__3824__auto____109780
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____109785 = coll;
    if(and__3822__auto____109785) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____109785
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____109786 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109787 = cljs.core._next[goog.typeOf(x__2363__auto____109786)];
      if(or__3824__auto____109787) {
        return or__3824__auto____109787
      }else {
        var or__3824__auto____109788 = cljs.core._next["_"];
        if(or__3824__auto____109788) {
          return or__3824__auto____109788
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____109797 = o;
      if(and__3822__auto____109797) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____109797
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____109798 = o == null ? null : o;
      return function() {
        var or__3824__auto____109799 = cljs.core._lookup[goog.typeOf(x__2363__auto____109798)];
        if(or__3824__auto____109799) {
          return or__3824__auto____109799
        }else {
          var or__3824__auto____109800 = cljs.core._lookup["_"];
          if(or__3824__auto____109800) {
            return or__3824__auto____109800
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____109801 = o;
      if(and__3822__auto____109801) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____109801
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____109802 = o == null ? null : o;
      return function() {
        var or__3824__auto____109803 = cljs.core._lookup[goog.typeOf(x__2363__auto____109802)];
        if(or__3824__auto____109803) {
          return or__3824__auto____109803
        }else {
          var or__3824__auto____109804 = cljs.core._lookup["_"];
          if(or__3824__auto____109804) {
            return or__3824__auto____109804
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____109809 = coll;
    if(and__3822__auto____109809) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____109809
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____109810 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109811 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____109810)];
      if(or__3824__auto____109811) {
        return or__3824__auto____109811
      }else {
        var or__3824__auto____109812 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____109812) {
          return or__3824__auto____109812
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____109817 = coll;
    if(and__3822__auto____109817) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____109817
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____109818 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109819 = cljs.core._assoc[goog.typeOf(x__2363__auto____109818)];
      if(or__3824__auto____109819) {
        return or__3824__auto____109819
      }else {
        var or__3824__auto____109820 = cljs.core._assoc["_"];
        if(or__3824__auto____109820) {
          return or__3824__auto____109820
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____109825 = coll;
    if(and__3822__auto____109825) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____109825
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____109826 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109827 = cljs.core._dissoc[goog.typeOf(x__2363__auto____109826)];
      if(or__3824__auto____109827) {
        return or__3824__auto____109827
      }else {
        var or__3824__auto____109828 = cljs.core._dissoc["_"];
        if(or__3824__auto____109828) {
          return or__3824__auto____109828
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____109833 = coll;
    if(and__3822__auto____109833) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____109833
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____109834 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109835 = cljs.core._key[goog.typeOf(x__2363__auto____109834)];
      if(or__3824__auto____109835) {
        return or__3824__auto____109835
      }else {
        var or__3824__auto____109836 = cljs.core._key["_"];
        if(or__3824__auto____109836) {
          return or__3824__auto____109836
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____109841 = coll;
    if(and__3822__auto____109841) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____109841
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____109842 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109843 = cljs.core._val[goog.typeOf(x__2363__auto____109842)];
      if(or__3824__auto____109843) {
        return or__3824__auto____109843
      }else {
        var or__3824__auto____109844 = cljs.core._val["_"];
        if(or__3824__auto____109844) {
          return or__3824__auto____109844
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____109849 = coll;
    if(and__3822__auto____109849) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____109849
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____109850 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109851 = cljs.core._disjoin[goog.typeOf(x__2363__auto____109850)];
      if(or__3824__auto____109851) {
        return or__3824__auto____109851
      }else {
        var or__3824__auto____109852 = cljs.core._disjoin["_"];
        if(or__3824__auto____109852) {
          return or__3824__auto____109852
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____109857 = coll;
    if(and__3822__auto____109857) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____109857
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____109858 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109859 = cljs.core._peek[goog.typeOf(x__2363__auto____109858)];
      if(or__3824__auto____109859) {
        return or__3824__auto____109859
      }else {
        var or__3824__auto____109860 = cljs.core._peek["_"];
        if(or__3824__auto____109860) {
          return or__3824__auto____109860
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____109865 = coll;
    if(and__3822__auto____109865) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____109865
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____109866 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109867 = cljs.core._pop[goog.typeOf(x__2363__auto____109866)];
      if(or__3824__auto____109867) {
        return or__3824__auto____109867
      }else {
        var or__3824__auto____109868 = cljs.core._pop["_"];
        if(or__3824__auto____109868) {
          return or__3824__auto____109868
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____109873 = coll;
    if(and__3822__auto____109873) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____109873
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____109874 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109875 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____109874)];
      if(or__3824__auto____109875) {
        return or__3824__auto____109875
      }else {
        var or__3824__auto____109876 = cljs.core._assoc_n["_"];
        if(or__3824__auto____109876) {
          return or__3824__auto____109876
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____109881 = o;
    if(and__3822__auto____109881) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____109881
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____109882 = o == null ? null : o;
    return function() {
      var or__3824__auto____109883 = cljs.core._deref[goog.typeOf(x__2363__auto____109882)];
      if(or__3824__auto____109883) {
        return or__3824__auto____109883
      }else {
        var or__3824__auto____109884 = cljs.core._deref["_"];
        if(or__3824__auto____109884) {
          return or__3824__auto____109884
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____109889 = o;
    if(and__3822__auto____109889) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____109889
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____109890 = o == null ? null : o;
    return function() {
      var or__3824__auto____109891 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____109890)];
      if(or__3824__auto____109891) {
        return or__3824__auto____109891
      }else {
        var or__3824__auto____109892 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____109892) {
          return or__3824__auto____109892
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____109897 = o;
    if(and__3822__auto____109897) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____109897
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____109898 = o == null ? null : o;
    return function() {
      var or__3824__auto____109899 = cljs.core._meta[goog.typeOf(x__2363__auto____109898)];
      if(or__3824__auto____109899) {
        return or__3824__auto____109899
      }else {
        var or__3824__auto____109900 = cljs.core._meta["_"];
        if(or__3824__auto____109900) {
          return or__3824__auto____109900
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____109905 = o;
    if(and__3822__auto____109905) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____109905
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____109906 = o == null ? null : o;
    return function() {
      var or__3824__auto____109907 = cljs.core._with_meta[goog.typeOf(x__2363__auto____109906)];
      if(or__3824__auto____109907) {
        return or__3824__auto____109907
      }else {
        var or__3824__auto____109908 = cljs.core._with_meta["_"];
        if(or__3824__auto____109908) {
          return or__3824__auto____109908
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____109917 = coll;
      if(and__3822__auto____109917) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____109917
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____109918 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____109919 = cljs.core._reduce[goog.typeOf(x__2363__auto____109918)];
        if(or__3824__auto____109919) {
          return or__3824__auto____109919
        }else {
          var or__3824__auto____109920 = cljs.core._reduce["_"];
          if(or__3824__auto____109920) {
            return or__3824__auto____109920
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____109921 = coll;
      if(and__3822__auto____109921) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____109921
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____109922 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____109923 = cljs.core._reduce[goog.typeOf(x__2363__auto____109922)];
        if(or__3824__auto____109923) {
          return or__3824__auto____109923
        }else {
          var or__3824__auto____109924 = cljs.core._reduce["_"];
          if(or__3824__auto____109924) {
            return or__3824__auto____109924
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____109929 = coll;
    if(and__3822__auto____109929) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____109929
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____109930 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109931 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____109930)];
      if(or__3824__auto____109931) {
        return or__3824__auto____109931
      }else {
        var or__3824__auto____109932 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____109932) {
          return or__3824__auto____109932
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____109937 = o;
    if(and__3822__auto____109937) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____109937
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____109938 = o == null ? null : o;
    return function() {
      var or__3824__auto____109939 = cljs.core._equiv[goog.typeOf(x__2363__auto____109938)];
      if(or__3824__auto____109939) {
        return or__3824__auto____109939
      }else {
        var or__3824__auto____109940 = cljs.core._equiv["_"];
        if(or__3824__auto____109940) {
          return or__3824__auto____109940
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____109945 = o;
    if(and__3822__auto____109945) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____109945
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____109946 = o == null ? null : o;
    return function() {
      var or__3824__auto____109947 = cljs.core._hash[goog.typeOf(x__2363__auto____109946)];
      if(or__3824__auto____109947) {
        return or__3824__auto____109947
      }else {
        var or__3824__auto____109948 = cljs.core._hash["_"];
        if(or__3824__auto____109948) {
          return or__3824__auto____109948
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____109953 = o;
    if(and__3822__auto____109953) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____109953
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____109954 = o == null ? null : o;
    return function() {
      var or__3824__auto____109955 = cljs.core._seq[goog.typeOf(x__2363__auto____109954)];
      if(or__3824__auto____109955) {
        return or__3824__auto____109955
      }else {
        var or__3824__auto____109956 = cljs.core._seq["_"];
        if(or__3824__auto____109956) {
          return or__3824__auto____109956
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____109961 = coll;
    if(and__3822__auto____109961) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____109961
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____109962 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109963 = cljs.core._rseq[goog.typeOf(x__2363__auto____109962)];
      if(or__3824__auto____109963) {
        return or__3824__auto____109963
      }else {
        var or__3824__auto____109964 = cljs.core._rseq["_"];
        if(or__3824__auto____109964) {
          return or__3824__auto____109964
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____109969 = coll;
    if(and__3822__auto____109969) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____109969
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____109970 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109971 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____109970)];
      if(or__3824__auto____109971) {
        return or__3824__auto____109971
      }else {
        var or__3824__auto____109972 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____109972) {
          return or__3824__auto____109972
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____109977 = coll;
    if(and__3822__auto____109977) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____109977
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____109978 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109979 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____109978)];
      if(or__3824__auto____109979) {
        return or__3824__auto____109979
      }else {
        var or__3824__auto____109980 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____109980) {
          return or__3824__auto____109980
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____109985 = coll;
    if(and__3822__auto____109985) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____109985
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____109986 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109987 = cljs.core._entry_key[goog.typeOf(x__2363__auto____109986)];
      if(or__3824__auto____109987) {
        return or__3824__auto____109987
      }else {
        var or__3824__auto____109988 = cljs.core._entry_key["_"];
        if(or__3824__auto____109988) {
          return or__3824__auto____109988
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____109993 = coll;
    if(and__3822__auto____109993) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____109993
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____109994 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____109995 = cljs.core._comparator[goog.typeOf(x__2363__auto____109994)];
      if(or__3824__auto____109995) {
        return or__3824__auto____109995
      }else {
        var or__3824__auto____109996 = cljs.core._comparator["_"];
        if(or__3824__auto____109996) {
          return or__3824__auto____109996
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____110001 = o;
    if(and__3822__auto____110001) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____110001
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____110002 = o == null ? null : o;
    return function() {
      var or__3824__auto____110003 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____110002)];
      if(or__3824__auto____110003) {
        return or__3824__auto____110003
      }else {
        var or__3824__auto____110004 = cljs.core._pr_seq["_"];
        if(or__3824__auto____110004) {
          return or__3824__auto____110004
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____110009 = d;
    if(and__3822__auto____110009) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____110009
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____110010 = d == null ? null : d;
    return function() {
      var or__3824__auto____110011 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____110010)];
      if(or__3824__auto____110011) {
        return or__3824__auto____110011
      }else {
        var or__3824__auto____110012 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____110012) {
          return or__3824__auto____110012
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____110017 = this$;
    if(and__3822__auto____110017) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____110017
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____110018 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____110019 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____110018)];
      if(or__3824__auto____110019) {
        return or__3824__auto____110019
      }else {
        var or__3824__auto____110020 = cljs.core._notify_watches["_"];
        if(or__3824__auto____110020) {
          return or__3824__auto____110020
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____110025 = this$;
    if(and__3822__auto____110025) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____110025
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____110026 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____110027 = cljs.core._add_watch[goog.typeOf(x__2363__auto____110026)];
      if(or__3824__auto____110027) {
        return or__3824__auto____110027
      }else {
        var or__3824__auto____110028 = cljs.core._add_watch["_"];
        if(or__3824__auto____110028) {
          return or__3824__auto____110028
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____110033 = this$;
    if(and__3822__auto____110033) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____110033
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____110034 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____110035 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____110034)];
      if(or__3824__auto____110035) {
        return or__3824__auto____110035
      }else {
        var or__3824__auto____110036 = cljs.core._remove_watch["_"];
        if(or__3824__auto____110036) {
          return or__3824__auto____110036
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____110041 = coll;
    if(and__3822__auto____110041) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____110041
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____110042 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____110043 = cljs.core._as_transient[goog.typeOf(x__2363__auto____110042)];
      if(or__3824__auto____110043) {
        return or__3824__auto____110043
      }else {
        var or__3824__auto____110044 = cljs.core._as_transient["_"];
        if(or__3824__auto____110044) {
          return or__3824__auto____110044
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____110049 = tcoll;
    if(and__3822__auto____110049) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____110049
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____110050 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____110051 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____110050)];
      if(or__3824__auto____110051) {
        return or__3824__auto____110051
      }else {
        var or__3824__auto____110052 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____110052) {
          return or__3824__auto____110052
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____110057 = tcoll;
    if(and__3822__auto____110057) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____110057
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____110058 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____110059 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____110058)];
      if(or__3824__auto____110059) {
        return or__3824__auto____110059
      }else {
        var or__3824__auto____110060 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____110060) {
          return or__3824__auto____110060
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____110065 = tcoll;
    if(and__3822__auto____110065) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____110065
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____110066 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____110067 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____110066)];
      if(or__3824__auto____110067) {
        return or__3824__auto____110067
      }else {
        var or__3824__auto____110068 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____110068) {
          return or__3824__auto____110068
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____110073 = tcoll;
    if(and__3822__auto____110073) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____110073
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____110074 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____110075 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____110074)];
      if(or__3824__auto____110075) {
        return or__3824__auto____110075
      }else {
        var or__3824__auto____110076 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____110076) {
          return or__3824__auto____110076
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____110081 = tcoll;
    if(and__3822__auto____110081) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____110081
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____110082 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____110083 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____110082)];
      if(or__3824__auto____110083) {
        return or__3824__auto____110083
      }else {
        var or__3824__auto____110084 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____110084) {
          return or__3824__auto____110084
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____110089 = tcoll;
    if(and__3822__auto____110089) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____110089
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____110090 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____110091 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____110090)];
      if(or__3824__auto____110091) {
        return or__3824__auto____110091
      }else {
        var or__3824__auto____110092 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____110092) {
          return or__3824__auto____110092
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____110097 = tcoll;
    if(and__3822__auto____110097) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____110097
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____110098 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____110099 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____110098)];
      if(or__3824__auto____110099) {
        return or__3824__auto____110099
      }else {
        var or__3824__auto____110100 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____110100) {
          return or__3824__auto____110100
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____110105 = x;
    if(and__3822__auto____110105) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____110105
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____110106 = x == null ? null : x;
    return function() {
      var or__3824__auto____110107 = cljs.core._compare[goog.typeOf(x__2363__auto____110106)];
      if(or__3824__auto____110107) {
        return or__3824__auto____110107
      }else {
        var or__3824__auto____110108 = cljs.core._compare["_"];
        if(or__3824__auto____110108) {
          return or__3824__auto____110108
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____110113 = coll;
    if(and__3822__auto____110113) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____110113
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____110114 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____110115 = cljs.core._drop_first[goog.typeOf(x__2363__auto____110114)];
      if(or__3824__auto____110115) {
        return or__3824__auto____110115
      }else {
        var or__3824__auto____110116 = cljs.core._drop_first["_"];
        if(or__3824__auto____110116) {
          return or__3824__auto____110116
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____110121 = coll;
    if(and__3822__auto____110121) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____110121
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____110122 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____110123 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____110122)];
      if(or__3824__auto____110123) {
        return or__3824__auto____110123
      }else {
        var or__3824__auto____110124 = cljs.core._chunked_first["_"];
        if(or__3824__auto____110124) {
          return or__3824__auto____110124
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____110129 = coll;
    if(and__3822__auto____110129) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____110129
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____110130 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____110131 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____110130)];
      if(or__3824__auto____110131) {
        return or__3824__auto____110131
      }else {
        var or__3824__auto____110132 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____110132) {
          return or__3824__auto____110132
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____110137 = coll;
    if(and__3822__auto____110137) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____110137
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____110138 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____110139 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____110138)];
      if(or__3824__auto____110139) {
        return or__3824__auto____110139
      }else {
        var or__3824__auto____110140 = cljs.core._chunked_next["_"];
        if(or__3824__auto____110140) {
          return or__3824__auto____110140
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____110142 = x === y;
    if(or__3824__auto____110142) {
      return or__3824__auto____110142
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__110143__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__110144 = y;
            var G__110145 = cljs.core.first.call(null, more);
            var G__110146 = cljs.core.next.call(null, more);
            x = G__110144;
            y = G__110145;
            more = G__110146;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__110143 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110143__delegate.call(this, x, y, more)
    };
    G__110143.cljs$lang$maxFixedArity = 2;
    G__110143.cljs$lang$applyTo = function(arglist__110147) {
      var x = cljs.core.first(arglist__110147);
      var y = cljs.core.first(cljs.core.next(arglist__110147));
      var more = cljs.core.rest(cljs.core.next(arglist__110147));
      return G__110143__delegate(x, y, more)
    };
    G__110143.cljs$lang$arity$variadic = G__110143__delegate;
    return G__110143
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__110148 = null;
  var G__110148__2 = function(o, k) {
    return null
  };
  var G__110148__3 = function(o, k, not_found) {
    return not_found
  };
  G__110148 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__110148__2.call(this, o, k);
      case 3:
        return G__110148__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110148
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__110149 = null;
  var G__110149__2 = function(_, f) {
    return f.call(null)
  };
  var G__110149__3 = function(_, f, start) {
    return start
  };
  G__110149 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__110149__2.call(this, _, f);
      case 3:
        return G__110149__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110149
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__110150 = null;
  var G__110150__2 = function(_, n) {
    return null
  };
  var G__110150__3 = function(_, n, not_found) {
    return not_found
  };
  G__110150 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__110150__2.call(this, _, n);
      case 3:
        return G__110150__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110150
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____110151 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____110151) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____110151
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__110164 = cljs.core._count.call(null, cicoll);
    if(cnt__110164 === 0) {
      return f.call(null)
    }else {
      var val__110165 = cljs.core._nth.call(null, cicoll, 0);
      var n__110166 = 1;
      while(true) {
        if(n__110166 < cnt__110164) {
          var nval__110167 = f.call(null, val__110165, cljs.core._nth.call(null, cicoll, n__110166));
          if(cljs.core.reduced_QMARK_.call(null, nval__110167)) {
            return cljs.core.deref.call(null, nval__110167)
          }else {
            var G__110176 = nval__110167;
            var G__110177 = n__110166 + 1;
            val__110165 = G__110176;
            n__110166 = G__110177;
            continue
          }
        }else {
          return val__110165
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__110168 = cljs.core._count.call(null, cicoll);
    var val__110169 = val;
    var n__110170 = 0;
    while(true) {
      if(n__110170 < cnt__110168) {
        var nval__110171 = f.call(null, val__110169, cljs.core._nth.call(null, cicoll, n__110170));
        if(cljs.core.reduced_QMARK_.call(null, nval__110171)) {
          return cljs.core.deref.call(null, nval__110171)
        }else {
          var G__110178 = nval__110171;
          var G__110179 = n__110170 + 1;
          val__110169 = G__110178;
          n__110170 = G__110179;
          continue
        }
      }else {
        return val__110169
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__110172 = cljs.core._count.call(null, cicoll);
    var val__110173 = val;
    var n__110174 = idx;
    while(true) {
      if(n__110174 < cnt__110172) {
        var nval__110175 = f.call(null, val__110173, cljs.core._nth.call(null, cicoll, n__110174));
        if(cljs.core.reduced_QMARK_.call(null, nval__110175)) {
          return cljs.core.deref.call(null, nval__110175)
        }else {
          var G__110180 = nval__110175;
          var G__110181 = n__110174 + 1;
          val__110173 = G__110180;
          n__110174 = G__110181;
          continue
        }
      }else {
        return val__110173
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__110194 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__110195 = arr[0];
      var n__110196 = 1;
      while(true) {
        if(n__110196 < cnt__110194) {
          var nval__110197 = f.call(null, val__110195, arr[n__110196]);
          if(cljs.core.reduced_QMARK_.call(null, nval__110197)) {
            return cljs.core.deref.call(null, nval__110197)
          }else {
            var G__110206 = nval__110197;
            var G__110207 = n__110196 + 1;
            val__110195 = G__110206;
            n__110196 = G__110207;
            continue
          }
        }else {
          return val__110195
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__110198 = arr.length;
    var val__110199 = val;
    var n__110200 = 0;
    while(true) {
      if(n__110200 < cnt__110198) {
        var nval__110201 = f.call(null, val__110199, arr[n__110200]);
        if(cljs.core.reduced_QMARK_.call(null, nval__110201)) {
          return cljs.core.deref.call(null, nval__110201)
        }else {
          var G__110208 = nval__110201;
          var G__110209 = n__110200 + 1;
          val__110199 = G__110208;
          n__110200 = G__110209;
          continue
        }
      }else {
        return val__110199
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__110202 = arr.length;
    var val__110203 = val;
    var n__110204 = idx;
    while(true) {
      if(n__110204 < cnt__110202) {
        var nval__110205 = f.call(null, val__110203, arr[n__110204]);
        if(cljs.core.reduced_QMARK_.call(null, nval__110205)) {
          return cljs.core.deref.call(null, nval__110205)
        }else {
          var G__110210 = nval__110205;
          var G__110211 = n__110204 + 1;
          val__110203 = G__110210;
          n__110204 = G__110211;
          continue
        }
      }else {
        return val__110203
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__110212 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__110213 = this;
  if(this__110213.i + 1 < this__110213.a.length) {
    return new cljs.core.IndexedSeq(this__110213.a, this__110213.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__110214 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__110215 = this;
  var c__110216 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__110216 > 0) {
    return new cljs.core.RSeq(coll, c__110216 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__110217 = this;
  var this__110218 = this;
  return cljs.core.pr_str.call(null, this__110218)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__110219 = this;
  if(cljs.core.counted_QMARK_.call(null, this__110219.a)) {
    return cljs.core.ci_reduce.call(null, this__110219.a, f, this__110219.a[this__110219.i], this__110219.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__110219.a[this__110219.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__110220 = this;
  if(cljs.core.counted_QMARK_.call(null, this__110220.a)) {
    return cljs.core.ci_reduce.call(null, this__110220.a, f, start, this__110220.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__110221 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__110222 = this;
  return this__110222.a.length - this__110222.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__110223 = this;
  return this__110223.a[this__110223.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__110224 = this;
  if(this__110224.i + 1 < this__110224.a.length) {
    return new cljs.core.IndexedSeq(this__110224.a, this__110224.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__110225 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__110226 = this;
  var i__110227 = n + this__110226.i;
  if(i__110227 < this__110226.a.length) {
    return this__110226.a[i__110227]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__110228 = this;
  var i__110229 = n + this__110228.i;
  if(i__110229 < this__110228.a.length) {
    return this__110228.a[i__110229]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__110230 = null;
  var G__110230__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__110230__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__110230 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__110230__2.call(this, array, f);
      case 3:
        return G__110230__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110230
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__110231 = null;
  var G__110231__2 = function(array, k) {
    return array[k]
  };
  var G__110231__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__110231 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__110231__2.call(this, array, k);
      case 3:
        return G__110231__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110231
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__110232 = null;
  var G__110232__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__110232__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__110232 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__110232__2.call(this, array, n);
      case 3:
        return G__110232__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110232
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__110233 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__110234 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__110235 = this;
  var this__110236 = this;
  return cljs.core.pr_str.call(null, this__110236)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__110237 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__110238 = this;
  return this__110238.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__110239 = this;
  return cljs.core._nth.call(null, this__110239.ci, this__110239.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__110240 = this;
  if(this__110240.i > 0) {
    return new cljs.core.RSeq(this__110240.ci, this__110240.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__110241 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__110242 = this;
  return new cljs.core.RSeq(this__110242.ci, this__110242.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__110243 = this;
  return this__110243.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__110247__110248 = coll;
      if(G__110247__110248) {
        if(function() {
          var or__3824__auto____110249 = G__110247__110248.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____110249) {
            return or__3824__auto____110249
          }else {
            return G__110247__110248.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__110247__110248.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__110247__110248)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__110247__110248)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__110254__110255 = coll;
      if(G__110254__110255) {
        if(function() {
          var or__3824__auto____110256 = G__110254__110255.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____110256) {
            return or__3824__auto____110256
          }else {
            return G__110254__110255.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__110254__110255.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__110254__110255)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__110254__110255)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__110257 = cljs.core.seq.call(null, coll);
      if(s__110257 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__110257)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__110262__110263 = coll;
      if(G__110262__110263) {
        if(function() {
          var or__3824__auto____110264 = G__110262__110263.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____110264) {
            return or__3824__auto____110264
          }else {
            return G__110262__110263.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__110262__110263.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__110262__110263)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__110262__110263)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__110265 = cljs.core.seq.call(null, coll);
      if(!(s__110265 == null)) {
        return cljs.core._rest.call(null, s__110265)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__110269__110270 = coll;
      if(G__110269__110270) {
        if(function() {
          var or__3824__auto____110271 = G__110269__110270.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____110271) {
            return or__3824__auto____110271
          }else {
            return G__110269__110270.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__110269__110270.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__110269__110270)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__110269__110270)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__110273 = cljs.core.next.call(null, s);
    if(!(sn__110273 == null)) {
      var G__110274 = sn__110273;
      s = G__110274;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__110275__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__110276 = conj.call(null, coll, x);
          var G__110277 = cljs.core.first.call(null, xs);
          var G__110278 = cljs.core.next.call(null, xs);
          coll = G__110276;
          x = G__110277;
          xs = G__110278;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__110275 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110275__delegate.call(this, coll, x, xs)
    };
    G__110275.cljs$lang$maxFixedArity = 2;
    G__110275.cljs$lang$applyTo = function(arglist__110279) {
      var coll = cljs.core.first(arglist__110279);
      var x = cljs.core.first(cljs.core.next(arglist__110279));
      var xs = cljs.core.rest(cljs.core.next(arglist__110279));
      return G__110275__delegate(coll, x, xs)
    };
    G__110275.cljs$lang$arity$variadic = G__110275__delegate;
    return G__110275
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__110282 = cljs.core.seq.call(null, coll);
  var acc__110283 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__110282)) {
      return acc__110283 + cljs.core._count.call(null, s__110282)
    }else {
      var G__110284 = cljs.core.next.call(null, s__110282);
      var G__110285 = acc__110283 + 1;
      s__110282 = G__110284;
      acc__110283 = G__110285;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__110292__110293 = coll;
        if(G__110292__110293) {
          if(function() {
            var or__3824__auto____110294 = G__110292__110293.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____110294) {
              return or__3824__auto____110294
            }else {
              return G__110292__110293.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__110292__110293.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__110292__110293)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__110292__110293)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__110295__110296 = coll;
        if(G__110295__110296) {
          if(function() {
            var or__3824__auto____110297 = G__110295__110296.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____110297) {
              return or__3824__auto____110297
            }else {
              return G__110295__110296.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__110295__110296.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__110295__110296)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__110295__110296)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__110300__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__110299 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__110301 = ret__110299;
          var G__110302 = cljs.core.first.call(null, kvs);
          var G__110303 = cljs.core.second.call(null, kvs);
          var G__110304 = cljs.core.nnext.call(null, kvs);
          coll = G__110301;
          k = G__110302;
          v = G__110303;
          kvs = G__110304;
          continue
        }else {
          return ret__110299
        }
        break
      }
    };
    var G__110300 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__110300__delegate.call(this, coll, k, v, kvs)
    };
    G__110300.cljs$lang$maxFixedArity = 3;
    G__110300.cljs$lang$applyTo = function(arglist__110305) {
      var coll = cljs.core.first(arglist__110305);
      var k = cljs.core.first(cljs.core.next(arglist__110305));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__110305)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__110305)));
      return G__110300__delegate(coll, k, v, kvs)
    };
    G__110300.cljs$lang$arity$variadic = G__110300__delegate;
    return G__110300
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__110308__delegate = function(coll, k, ks) {
      while(true) {
        var ret__110307 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__110309 = ret__110307;
          var G__110310 = cljs.core.first.call(null, ks);
          var G__110311 = cljs.core.next.call(null, ks);
          coll = G__110309;
          k = G__110310;
          ks = G__110311;
          continue
        }else {
          return ret__110307
        }
        break
      }
    };
    var G__110308 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110308__delegate.call(this, coll, k, ks)
    };
    G__110308.cljs$lang$maxFixedArity = 2;
    G__110308.cljs$lang$applyTo = function(arglist__110312) {
      var coll = cljs.core.first(arglist__110312);
      var k = cljs.core.first(cljs.core.next(arglist__110312));
      var ks = cljs.core.rest(cljs.core.next(arglist__110312));
      return G__110308__delegate(coll, k, ks)
    };
    G__110308.cljs$lang$arity$variadic = G__110308__delegate;
    return G__110308
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__110316__110317 = o;
    if(G__110316__110317) {
      if(function() {
        var or__3824__auto____110318 = G__110316__110317.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____110318) {
          return or__3824__auto____110318
        }else {
          return G__110316__110317.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__110316__110317.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__110316__110317)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__110316__110317)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__110321__delegate = function(coll, k, ks) {
      while(true) {
        var ret__110320 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__110322 = ret__110320;
          var G__110323 = cljs.core.first.call(null, ks);
          var G__110324 = cljs.core.next.call(null, ks);
          coll = G__110322;
          k = G__110323;
          ks = G__110324;
          continue
        }else {
          return ret__110320
        }
        break
      }
    };
    var G__110321 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110321__delegate.call(this, coll, k, ks)
    };
    G__110321.cljs$lang$maxFixedArity = 2;
    G__110321.cljs$lang$applyTo = function(arglist__110325) {
      var coll = cljs.core.first(arglist__110325);
      var k = cljs.core.first(cljs.core.next(arglist__110325));
      var ks = cljs.core.rest(cljs.core.next(arglist__110325));
      return G__110321__delegate(coll, k, ks)
    };
    G__110321.cljs$lang$arity$variadic = G__110321__delegate;
    return G__110321
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__110327 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__110327;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__110327
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__110329 = cljs.core.string_hash_cache[k];
  if(!(h__110329 == null)) {
    return h__110329
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____110331 = goog.isString(o);
      if(and__3822__auto____110331) {
        return check_cache
      }else {
        return and__3822__auto____110331
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__110335__110336 = x;
    if(G__110335__110336) {
      if(function() {
        var or__3824__auto____110337 = G__110335__110336.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____110337) {
          return or__3824__auto____110337
        }else {
          return G__110335__110336.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__110335__110336.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__110335__110336)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__110335__110336)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__110341__110342 = x;
    if(G__110341__110342) {
      if(function() {
        var or__3824__auto____110343 = G__110341__110342.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____110343) {
          return or__3824__auto____110343
        }else {
          return G__110341__110342.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__110341__110342.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__110341__110342)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__110341__110342)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__110347__110348 = x;
  if(G__110347__110348) {
    if(function() {
      var or__3824__auto____110349 = G__110347__110348.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____110349) {
        return or__3824__auto____110349
      }else {
        return G__110347__110348.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__110347__110348.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__110347__110348)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__110347__110348)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__110353__110354 = x;
  if(G__110353__110354) {
    if(function() {
      var or__3824__auto____110355 = G__110353__110354.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____110355) {
        return or__3824__auto____110355
      }else {
        return G__110353__110354.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__110353__110354.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__110353__110354)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__110353__110354)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__110359__110360 = x;
  if(G__110359__110360) {
    if(function() {
      var or__3824__auto____110361 = G__110359__110360.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____110361) {
        return or__3824__auto____110361
      }else {
        return G__110359__110360.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__110359__110360.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__110359__110360)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__110359__110360)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__110365__110366 = x;
  if(G__110365__110366) {
    if(function() {
      var or__3824__auto____110367 = G__110365__110366.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____110367) {
        return or__3824__auto____110367
      }else {
        return G__110365__110366.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__110365__110366.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__110365__110366)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__110365__110366)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__110371__110372 = x;
  if(G__110371__110372) {
    if(function() {
      var or__3824__auto____110373 = G__110371__110372.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____110373) {
        return or__3824__auto____110373
      }else {
        return G__110371__110372.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__110371__110372.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__110371__110372)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__110371__110372)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__110377__110378 = x;
    if(G__110377__110378) {
      if(function() {
        var or__3824__auto____110379 = G__110377__110378.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____110379) {
          return or__3824__auto____110379
        }else {
          return G__110377__110378.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__110377__110378.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__110377__110378)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__110377__110378)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__110383__110384 = x;
  if(G__110383__110384) {
    if(function() {
      var or__3824__auto____110385 = G__110383__110384.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____110385) {
        return or__3824__auto____110385
      }else {
        return G__110383__110384.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__110383__110384.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__110383__110384)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__110383__110384)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__110389__110390 = x;
  if(G__110389__110390) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____110391 = null;
      if(cljs.core.truth_(or__3824__auto____110391)) {
        return or__3824__auto____110391
      }else {
        return G__110389__110390.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__110389__110390.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__110389__110390)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__110389__110390)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__110392__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__110392 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__110392__delegate.call(this, keyvals)
    };
    G__110392.cljs$lang$maxFixedArity = 0;
    G__110392.cljs$lang$applyTo = function(arglist__110393) {
      var keyvals = cljs.core.seq(arglist__110393);
      return G__110392__delegate(keyvals)
    };
    G__110392.cljs$lang$arity$variadic = G__110392__delegate;
    return G__110392
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__110395 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__110395.push(key)
  });
  return keys__110395
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__110399 = i;
  var j__110400 = j;
  var len__110401 = len;
  while(true) {
    if(len__110401 === 0) {
      return to
    }else {
      to[j__110400] = from[i__110399];
      var G__110402 = i__110399 + 1;
      var G__110403 = j__110400 + 1;
      var G__110404 = len__110401 - 1;
      i__110399 = G__110402;
      j__110400 = G__110403;
      len__110401 = G__110404;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__110408 = i + (len - 1);
  var j__110409 = j + (len - 1);
  var len__110410 = len;
  while(true) {
    if(len__110410 === 0) {
      return to
    }else {
      to[j__110409] = from[i__110408];
      var G__110411 = i__110408 - 1;
      var G__110412 = j__110409 - 1;
      var G__110413 = len__110410 - 1;
      i__110408 = G__110411;
      j__110409 = G__110412;
      len__110410 = G__110413;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__110417__110418 = s;
    if(G__110417__110418) {
      if(function() {
        var or__3824__auto____110419 = G__110417__110418.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____110419) {
          return or__3824__auto____110419
        }else {
          return G__110417__110418.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__110417__110418.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__110417__110418)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__110417__110418)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__110423__110424 = s;
  if(G__110423__110424) {
    if(function() {
      var or__3824__auto____110425 = G__110423__110424.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____110425) {
        return or__3824__auto____110425
      }else {
        return G__110423__110424.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__110423__110424.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__110423__110424)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__110423__110424)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____110428 = goog.isString(x);
  if(and__3822__auto____110428) {
    return!function() {
      var or__3824__auto____110429 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____110429) {
        return or__3824__auto____110429
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____110428
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____110431 = goog.isString(x);
  if(and__3822__auto____110431) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____110431
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____110433 = goog.isString(x);
  if(and__3822__auto____110433) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____110433
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____110438 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____110438) {
    return or__3824__auto____110438
  }else {
    var G__110439__110440 = f;
    if(G__110439__110440) {
      if(function() {
        var or__3824__auto____110441 = G__110439__110440.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____110441) {
          return or__3824__auto____110441
        }else {
          return G__110439__110440.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__110439__110440.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__110439__110440)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__110439__110440)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____110443 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____110443) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____110443
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____110446 = coll;
    if(cljs.core.truth_(and__3822__auto____110446)) {
      var and__3822__auto____110447 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____110447) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____110447
      }
    }else {
      return and__3822__auto____110446
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__110456__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__110452 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__110453 = more;
        while(true) {
          var x__110454 = cljs.core.first.call(null, xs__110453);
          var etc__110455 = cljs.core.next.call(null, xs__110453);
          if(cljs.core.truth_(xs__110453)) {
            if(cljs.core.contains_QMARK_.call(null, s__110452, x__110454)) {
              return false
            }else {
              var G__110457 = cljs.core.conj.call(null, s__110452, x__110454);
              var G__110458 = etc__110455;
              s__110452 = G__110457;
              xs__110453 = G__110458;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__110456 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110456__delegate.call(this, x, y, more)
    };
    G__110456.cljs$lang$maxFixedArity = 2;
    G__110456.cljs$lang$applyTo = function(arglist__110459) {
      var x = cljs.core.first(arglist__110459);
      var y = cljs.core.first(cljs.core.next(arglist__110459));
      var more = cljs.core.rest(cljs.core.next(arglist__110459));
      return G__110456__delegate(x, y, more)
    };
    G__110456.cljs$lang$arity$variadic = G__110456__delegate;
    return G__110456
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__110463__110464 = x;
            if(G__110463__110464) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____110465 = null;
                if(cljs.core.truth_(or__3824__auto____110465)) {
                  return or__3824__auto____110465
                }else {
                  return G__110463__110464.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__110463__110464.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__110463__110464)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__110463__110464)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__110470 = cljs.core.count.call(null, xs);
    var yl__110471 = cljs.core.count.call(null, ys);
    if(xl__110470 < yl__110471) {
      return-1
    }else {
      if(xl__110470 > yl__110471) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__110470, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__110472 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____110473 = d__110472 === 0;
        if(and__3822__auto____110473) {
          return n + 1 < len
        }else {
          return and__3822__auto____110473
        }
      }()) {
        var G__110474 = xs;
        var G__110475 = ys;
        var G__110476 = len;
        var G__110477 = n + 1;
        xs = G__110474;
        ys = G__110475;
        len = G__110476;
        n = G__110477;
        continue
      }else {
        return d__110472
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__110479 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__110479)) {
        return r__110479
      }else {
        if(cljs.core.truth_(r__110479)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__110481 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__110481, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__110481)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____110487 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____110487) {
      var s__110488 = temp__3971__auto____110487;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__110488), cljs.core.next.call(null, s__110488))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__110489 = val;
    var coll__110490 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__110490) {
        var nval__110491 = f.call(null, val__110489, cljs.core.first.call(null, coll__110490));
        if(cljs.core.reduced_QMARK_.call(null, nval__110491)) {
          return cljs.core.deref.call(null, nval__110491)
        }else {
          var G__110492 = nval__110491;
          var G__110493 = cljs.core.next.call(null, coll__110490);
          val__110489 = G__110492;
          coll__110490 = G__110493;
          continue
        }
      }else {
        return val__110489
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__110495 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__110495);
  return cljs.core.vec.call(null, a__110495)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__110502__110503 = coll;
      if(G__110502__110503) {
        if(function() {
          var or__3824__auto____110504 = G__110502__110503.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____110504) {
            return or__3824__auto____110504
          }else {
            return G__110502__110503.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__110502__110503.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__110502__110503)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__110502__110503)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__110505__110506 = coll;
      if(G__110505__110506) {
        if(function() {
          var or__3824__auto____110507 = G__110505__110506.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____110507) {
            return or__3824__auto____110507
          }else {
            return G__110505__110506.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__110505__110506.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__110505__110506)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__110505__110506)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__110508 = this;
  return this__110508.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__110509__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__110509 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110509__delegate.call(this, x, y, more)
    };
    G__110509.cljs$lang$maxFixedArity = 2;
    G__110509.cljs$lang$applyTo = function(arglist__110510) {
      var x = cljs.core.first(arglist__110510);
      var y = cljs.core.first(cljs.core.next(arglist__110510));
      var more = cljs.core.rest(cljs.core.next(arglist__110510));
      return G__110509__delegate(x, y, more)
    };
    G__110509.cljs$lang$arity$variadic = G__110509__delegate;
    return G__110509
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__110511__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__110511 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110511__delegate.call(this, x, y, more)
    };
    G__110511.cljs$lang$maxFixedArity = 2;
    G__110511.cljs$lang$applyTo = function(arglist__110512) {
      var x = cljs.core.first(arglist__110512);
      var y = cljs.core.first(cljs.core.next(arglist__110512));
      var more = cljs.core.rest(cljs.core.next(arglist__110512));
      return G__110511__delegate(x, y, more)
    };
    G__110511.cljs$lang$arity$variadic = G__110511__delegate;
    return G__110511
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__110513__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__110513 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110513__delegate.call(this, x, y, more)
    };
    G__110513.cljs$lang$maxFixedArity = 2;
    G__110513.cljs$lang$applyTo = function(arglist__110514) {
      var x = cljs.core.first(arglist__110514);
      var y = cljs.core.first(cljs.core.next(arglist__110514));
      var more = cljs.core.rest(cljs.core.next(arglist__110514));
      return G__110513__delegate(x, y, more)
    };
    G__110513.cljs$lang$arity$variadic = G__110513__delegate;
    return G__110513
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__110515__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__110515 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110515__delegate.call(this, x, y, more)
    };
    G__110515.cljs$lang$maxFixedArity = 2;
    G__110515.cljs$lang$applyTo = function(arglist__110516) {
      var x = cljs.core.first(arglist__110516);
      var y = cljs.core.first(cljs.core.next(arglist__110516));
      var more = cljs.core.rest(cljs.core.next(arglist__110516));
      return G__110515__delegate(x, y, more)
    };
    G__110515.cljs$lang$arity$variadic = G__110515__delegate;
    return G__110515
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__110517__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__110518 = y;
            var G__110519 = cljs.core.first.call(null, more);
            var G__110520 = cljs.core.next.call(null, more);
            x = G__110518;
            y = G__110519;
            more = G__110520;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__110517 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110517__delegate.call(this, x, y, more)
    };
    G__110517.cljs$lang$maxFixedArity = 2;
    G__110517.cljs$lang$applyTo = function(arglist__110521) {
      var x = cljs.core.first(arglist__110521);
      var y = cljs.core.first(cljs.core.next(arglist__110521));
      var more = cljs.core.rest(cljs.core.next(arglist__110521));
      return G__110517__delegate(x, y, more)
    };
    G__110517.cljs$lang$arity$variadic = G__110517__delegate;
    return G__110517
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__110522__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__110523 = y;
            var G__110524 = cljs.core.first.call(null, more);
            var G__110525 = cljs.core.next.call(null, more);
            x = G__110523;
            y = G__110524;
            more = G__110525;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__110522 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110522__delegate.call(this, x, y, more)
    };
    G__110522.cljs$lang$maxFixedArity = 2;
    G__110522.cljs$lang$applyTo = function(arglist__110526) {
      var x = cljs.core.first(arglist__110526);
      var y = cljs.core.first(cljs.core.next(arglist__110526));
      var more = cljs.core.rest(cljs.core.next(arglist__110526));
      return G__110522__delegate(x, y, more)
    };
    G__110522.cljs$lang$arity$variadic = G__110522__delegate;
    return G__110522
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__110527__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__110528 = y;
            var G__110529 = cljs.core.first.call(null, more);
            var G__110530 = cljs.core.next.call(null, more);
            x = G__110528;
            y = G__110529;
            more = G__110530;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__110527 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110527__delegate.call(this, x, y, more)
    };
    G__110527.cljs$lang$maxFixedArity = 2;
    G__110527.cljs$lang$applyTo = function(arglist__110531) {
      var x = cljs.core.first(arglist__110531);
      var y = cljs.core.first(cljs.core.next(arglist__110531));
      var more = cljs.core.rest(cljs.core.next(arglist__110531));
      return G__110527__delegate(x, y, more)
    };
    G__110527.cljs$lang$arity$variadic = G__110527__delegate;
    return G__110527
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__110532__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__110533 = y;
            var G__110534 = cljs.core.first.call(null, more);
            var G__110535 = cljs.core.next.call(null, more);
            x = G__110533;
            y = G__110534;
            more = G__110535;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__110532 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110532__delegate.call(this, x, y, more)
    };
    G__110532.cljs$lang$maxFixedArity = 2;
    G__110532.cljs$lang$applyTo = function(arglist__110536) {
      var x = cljs.core.first(arglist__110536);
      var y = cljs.core.first(cljs.core.next(arglist__110536));
      var more = cljs.core.rest(cljs.core.next(arglist__110536));
      return G__110532__delegate(x, y, more)
    };
    G__110532.cljs$lang$arity$variadic = G__110532__delegate;
    return G__110532
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__110537__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__110537 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110537__delegate.call(this, x, y, more)
    };
    G__110537.cljs$lang$maxFixedArity = 2;
    G__110537.cljs$lang$applyTo = function(arglist__110538) {
      var x = cljs.core.first(arglist__110538);
      var y = cljs.core.first(cljs.core.next(arglist__110538));
      var more = cljs.core.rest(cljs.core.next(arglist__110538));
      return G__110537__delegate(x, y, more)
    };
    G__110537.cljs$lang$arity$variadic = G__110537__delegate;
    return G__110537
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__110539__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__110539 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110539__delegate.call(this, x, y, more)
    };
    G__110539.cljs$lang$maxFixedArity = 2;
    G__110539.cljs$lang$applyTo = function(arglist__110540) {
      var x = cljs.core.first(arglist__110540);
      var y = cljs.core.first(cljs.core.next(arglist__110540));
      var more = cljs.core.rest(cljs.core.next(arglist__110540));
      return G__110539__delegate(x, y, more)
    };
    G__110539.cljs$lang$arity$variadic = G__110539__delegate;
    return G__110539
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__110542 = n % d;
  return cljs.core.fix.call(null, (n - rem__110542) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__110544 = cljs.core.quot.call(null, n, d);
  return n - d * q__110544
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__110547 = v - (v >> 1 & 1431655765);
  var v__110548 = (v__110547 & 858993459) + (v__110547 >> 2 & 858993459);
  return(v__110548 + (v__110548 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__110549__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__110550 = y;
            var G__110551 = cljs.core.first.call(null, more);
            var G__110552 = cljs.core.next.call(null, more);
            x = G__110550;
            y = G__110551;
            more = G__110552;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__110549 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110549__delegate.call(this, x, y, more)
    };
    G__110549.cljs$lang$maxFixedArity = 2;
    G__110549.cljs$lang$applyTo = function(arglist__110553) {
      var x = cljs.core.first(arglist__110553);
      var y = cljs.core.first(cljs.core.next(arglist__110553));
      var more = cljs.core.rest(cljs.core.next(arglist__110553));
      return G__110549__delegate(x, y, more)
    };
    G__110549.cljs$lang$arity$variadic = G__110549__delegate;
    return G__110549
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__110557 = n;
  var xs__110558 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____110559 = xs__110558;
      if(and__3822__auto____110559) {
        return n__110557 > 0
      }else {
        return and__3822__auto____110559
      }
    }())) {
      var G__110560 = n__110557 - 1;
      var G__110561 = cljs.core.next.call(null, xs__110558);
      n__110557 = G__110560;
      xs__110558 = G__110561;
      continue
    }else {
      return xs__110558
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__110562__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__110563 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__110564 = cljs.core.next.call(null, more);
            sb = G__110563;
            more = G__110564;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__110562 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__110562__delegate.call(this, x, ys)
    };
    G__110562.cljs$lang$maxFixedArity = 1;
    G__110562.cljs$lang$applyTo = function(arglist__110565) {
      var x = cljs.core.first(arglist__110565);
      var ys = cljs.core.rest(arglist__110565);
      return G__110562__delegate(x, ys)
    };
    G__110562.cljs$lang$arity$variadic = G__110562__delegate;
    return G__110562
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__110566__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__110567 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__110568 = cljs.core.next.call(null, more);
            sb = G__110567;
            more = G__110568;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__110566 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__110566__delegate.call(this, x, ys)
    };
    G__110566.cljs$lang$maxFixedArity = 1;
    G__110566.cljs$lang$applyTo = function(arglist__110569) {
      var x = cljs.core.first(arglist__110569);
      var ys = cljs.core.rest(arglist__110569);
      return G__110566__delegate(x, ys)
    };
    G__110566.cljs$lang$arity$variadic = G__110566__delegate;
    return G__110566
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__110570) {
    var fmt = cljs.core.first(arglist__110570);
    var args = cljs.core.rest(arglist__110570);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__110573 = cljs.core.seq.call(null, x);
    var ys__110574 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__110573 == null) {
        return ys__110574 == null
      }else {
        if(ys__110574 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__110573), cljs.core.first.call(null, ys__110574))) {
            var G__110575 = cljs.core.next.call(null, xs__110573);
            var G__110576 = cljs.core.next.call(null, ys__110574);
            xs__110573 = G__110575;
            ys__110574 = G__110576;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__110577_SHARP_, p2__110578_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__110577_SHARP_, cljs.core.hash.call(null, p2__110578_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__110582 = 0;
  var s__110583 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__110583) {
      var e__110584 = cljs.core.first.call(null, s__110583);
      var G__110585 = (h__110582 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__110584)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__110584)))) % 4503599627370496;
      var G__110586 = cljs.core.next.call(null, s__110583);
      h__110582 = G__110585;
      s__110583 = G__110586;
      continue
    }else {
      return h__110582
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__110590 = 0;
  var s__110591 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__110591) {
      var e__110592 = cljs.core.first.call(null, s__110591);
      var G__110593 = (h__110590 + cljs.core.hash.call(null, e__110592)) % 4503599627370496;
      var G__110594 = cljs.core.next.call(null, s__110591);
      h__110590 = G__110593;
      s__110591 = G__110594;
      continue
    }else {
      return h__110590
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__110615__110616 = cljs.core.seq.call(null, fn_map);
  if(G__110615__110616) {
    var G__110618__110620 = cljs.core.first.call(null, G__110615__110616);
    var vec__110619__110621 = G__110618__110620;
    var key_name__110622 = cljs.core.nth.call(null, vec__110619__110621, 0, null);
    var f__110623 = cljs.core.nth.call(null, vec__110619__110621, 1, null);
    var G__110615__110624 = G__110615__110616;
    var G__110618__110625 = G__110618__110620;
    var G__110615__110626 = G__110615__110624;
    while(true) {
      var vec__110627__110628 = G__110618__110625;
      var key_name__110629 = cljs.core.nth.call(null, vec__110627__110628, 0, null);
      var f__110630 = cljs.core.nth.call(null, vec__110627__110628, 1, null);
      var G__110615__110631 = G__110615__110626;
      var str_name__110632 = cljs.core.name.call(null, key_name__110629);
      obj[str_name__110632] = f__110630;
      var temp__3974__auto____110633 = cljs.core.next.call(null, G__110615__110631);
      if(temp__3974__auto____110633) {
        var G__110615__110634 = temp__3974__auto____110633;
        var G__110635 = cljs.core.first.call(null, G__110615__110634);
        var G__110636 = G__110615__110634;
        G__110618__110625 = G__110635;
        G__110615__110626 = G__110636;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__110637 = this;
  var h__2192__auto____110638 = this__110637.__hash;
  if(!(h__2192__auto____110638 == null)) {
    return h__2192__auto____110638
  }else {
    var h__2192__auto____110639 = cljs.core.hash_coll.call(null, coll);
    this__110637.__hash = h__2192__auto____110639;
    return h__2192__auto____110639
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__110640 = this;
  if(this__110640.count === 1) {
    return null
  }else {
    return this__110640.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__110641 = this;
  return new cljs.core.List(this__110641.meta, o, coll, this__110641.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__110642 = this;
  var this__110643 = this;
  return cljs.core.pr_str.call(null, this__110643)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__110644 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__110645 = this;
  return this__110645.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__110646 = this;
  return this__110646.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__110647 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__110648 = this;
  return this__110648.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__110649 = this;
  if(this__110649.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__110649.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__110650 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__110651 = this;
  return new cljs.core.List(meta, this__110651.first, this__110651.rest, this__110651.count, this__110651.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__110652 = this;
  return this__110652.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__110653 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__110654 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__110655 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__110656 = this;
  return new cljs.core.List(this__110656.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__110657 = this;
  var this__110658 = this;
  return cljs.core.pr_str.call(null, this__110658)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__110659 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__110660 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__110661 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__110662 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__110663 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__110664 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__110665 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__110666 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__110667 = this;
  return this__110667.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__110668 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__110672__110673 = coll;
  if(G__110672__110673) {
    if(function() {
      var or__3824__auto____110674 = G__110672__110673.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____110674) {
        return or__3824__auto____110674
      }else {
        return G__110672__110673.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__110672__110673.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__110672__110673)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__110672__110673)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__110675__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__110675 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__110675__delegate.call(this, x, y, z, items)
    };
    G__110675.cljs$lang$maxFixedArity = 3;
    G__110675.cljs$lang$applyTo = function(arglist__110676) {
      var x = cljs.core.first(arglist__110676);
      var y = cljs.core.first(cljs.core.next(arglist__110676));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__110676)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__110676)));
      return G__110675__delegate(x, y, z, items)
    };
    G__110675.cljs$lang$arity$variadic = G__110675__delegate;
    return G__110675
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__110677 = this;
  var h__2192__auto____110678 = this__110677.__hash;
  if(!(h__2192__auto____110678 == null)) {
    return h__2192__auto____110678
  }else {
    var h__2192__auto____110679 = cljs.core.hash_coll.call(null, coll);
    this__110677.__hash = h__2192__auto____110679;
    return h__2192__auto____110679
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__110680 = this;
  if(this__110680.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__110680.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__110681 = this;
  return new cljs.core.Cons(null, o, coll, this__110681.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__110682 = this;
  var this__110683 = this;
  return cljs.core.pr_str.call(null, this__110683)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__110684 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__110685 = this;
  return this__110685.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__110686 = this;
  if(this__110686.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__110686.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__110687 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__110688 = this;
  return new cljs.core.Cons(meta, this__110688.first, this__110688.rest, this__110688.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__110689 = this;
  return this__110689.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__110690 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__110690.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____110695 = coll == null;
    if(or__3824__auto____110695) {
      return or__3824__auto____110695
    }else {
      var G__110696__110697 = coll;
      if(G__110696__110697) {
        if(function() {
          var or__3824__auto____110698 = G__110696__110697.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____110698) {
            return or__3824__auto____110698
          }else {
            return G__110696__110697.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__110696__110697.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__110696__110697)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__110696__110697)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__110702__110703 = x;
  if(G__110702__110703) {
    if(function() {
      var or__3824__auto____110704 = G__110702__110703.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____110704) {
        return or__3824__auto____110704
      }else {
        return G__110702__110703.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__110702__110703.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__110702__110703)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__110702__110703)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__110705 = null;
  var G__110705__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__110705__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__110705 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__110705__2.call(this, string, f);
      case 3:
        return G__110705__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110705
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__110706 = null;
  var G__110706__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__110706__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__110706 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__110706__2.call(this, string, k);
      case 3:
        return G__110706__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110706
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__110707 = null;
  var G__110707__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__110707__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__110707 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__110707__2.call(this, string, n);
      case 3:
        return G__110707__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110707
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__110719 = null;
  var G__110719__2 = function(this_sym110710, coll) {
    var this__110712 = this;
    var this_sym110710__110713 = this;
    var ___110714 = this_sym110710__110713;
    if(coll == null) {
      return null
    }else {
      var strobj__110715 = coll.strobj;
      if(strobj__110715 == null) {
        return cljs.core._lookup.call(null, coll, this__110712.k, null)
      }else {
        return strobj__110715[this__110712.k]
      }
    }
  };
  var G__110719__3 = function(this_sym110711, coll, not_found) {
    var this__110712 = this;
    var this_sym110711__110716 = this;
    var ___110717 = this_sym110711__110716;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__110712.k, not_found)
    }
  };
  G__110719 = function(this_sym110711, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__110719__2.call(this, this_sym110711, coll);
      case 3:
        return G__110719__3.call(this, this_sym110711, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110719
}();
cljs.core.Keyword.prototype.apply = function(this_sym110708, args110709) {
  var this__110718 = this;
  return this_sym110708.call.apply(this_sym110708, [this_sym110708].concat(args110709.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__110728 = null;
  var G__110728__2 = function(this_sym110722, coll) {
    var this_sym110722__110724 = this;
    var this__110725 = this_sym110722__110724;
    return cljs.core._lookup.call(null, coll, this__110725.toString(), null)
  };
  var G__110728__3 = function(this_sym110723, coll, not_found) {
    var this_sym110723__110726 = this;
    var this__110727 = this_sym110723__110726;
    return cljs.core._lookup.call(null, coll, this__110727.toString(), not_found)
  };
  G__110728 = function(this_sym110723, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__110728__2.call(this, this_sym110723, coll);
      case 3:
        return G__110728__3.call(this, this_sym110723, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__110728
}();
String.prototype.apply = function(this_sym110720, args110721) {
  return this_sym110720.call.apply(this_sym110720, [this_sym110720].concat(args110721.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__110730 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__110730
  }else {
    lazy_seq.x = x__110730.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__110731 = this;
  var h__2192__auto____110732 = this__110731.__hash;
  if(!(h__2192__auto____110732 == null)) {
    return h__2192__auto____110732
  }else {
    var h__2192__auto____110733 = cljs.core.hash_coll.call(null, coll);
    this__110731.__hash = h__2192__auto____110733;
    return h__2192__auto____110733
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__110734 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__110735 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__110736 = this;
  var this__110737 = this;
  return cljs.core.pr_str.call(null, this__110737)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__110738 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__110739 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__110740 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__110741 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__110742 = this;
  return new cljs.core.LazySeq(meta, this__110742.realized, this__110742.x, this__110742.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__110743 = this;
  return this__110743.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__110744 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__110744.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__110745 = this;
  return this__110745.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__110746 = this;
  var ___110747 = this;
  this__110746.buf[this__110746.end] = o;
  return this__110746.end = this__110746.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__110748 = this;
  var ___110749 = this;
  var ret__110750 = new cljs.core.ArrayChunk(this__110748.buf, 0, this__110748.end);
  this__110748.buf = null;
  return ret__110750
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__110751 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__110751.arr[this__110751.off], this__110751.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__110752 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__110752.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__110753 = this;
  if(this__110753.off === this__110753.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__110753.arr, this__110753.off + 1, this__110753.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__110754 = this;
  return this__110754.arr[this__110754.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__110755 = this;
  if(function() {
    var and__3822__auto____110756 = i >= 0;
    if(and__3822__auto____110756) {
      return i < this__110755.end - this__110755.off
    }else {
      return and__3822__auto____110756
    }
  }()) {
    return this__110755.arr[this__110755.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__110757 = this;
  return this__110757.end - this__110757.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__110758 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__110759 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__110760 = this;
  return cljs.core._nth.call(null, this__110760.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__110761 = this;
  if(cljs.core._count.call(null, this__110761.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__110761.chunk), this__110761.more, this__110761.meta)
  }else {
    if(this__110761.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__110761.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__110762 = this;
  if(this__110762.more == null) {
    return null
  }else {
    return this__110762.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__110763 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__110764 = this;
  return new cljs.core.ChunkedCons(this__110764.chunk, this__110764.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__110765 = this;
  return this__110765.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__110766 = this;
  return this__110766.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__110767 = this;
  if(this__110767.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__110767.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__110771__110772 = s;
    if(G__110771__110772) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____110773 = null;
        if(cljs.core.truth_(or__3824__auto____110773)) {
          return or__3824__auto____110773
        }else {
          return G__110771__110772.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__110771__110772.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__110771__110772)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__110771__110772)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__110776 = [];
  var s__110777 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__110777)) {
      ary__110776.push(cljs.core.first.call(null, s__110777));
      var G__110778 = cljs.core.next.call(null, s__110777);
      s__110777 = G__110778;
      continue
    }else {
      return ary__110776
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__110782 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__110783 = 0;
  var xs__110784 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__110784) {
      ret__110782[i__110783] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__110784));
      var G__110785 = i__110783 + 1;
      var G__110786 = cljs.core.next.call(null, xs__110784);
      i__110783 = G__110785;
      xs__110784 = G__110786;
      continue
    }else {
    }
    break
  }
  return ret__110782
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__110794 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__110795 = cljs.core.seq.call(null, init_val_or_seq);
      var i__110796 = 0;
      var s__110797 = s__110795;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____110798 = s__110797;
          if(and__3822__auto____110798) {
            return i__110796 < size
          }else {
            return and__3822__auto____110798
          }
        }())) {
          a__110794[i__110796] = cljs.core.first.call(null, s__110797);
          var G__110801 = i__110796 + 1;
          var G__110802 = cljs.core.next.call(null, s__110797);
          i__110796 = G__110801;
          s__110797 = G__110802;
          continue
        }else {
          return a__110794
        }
        break
      }
    }else {
      var n__2527__auto____110799 = size;
      var i__110800 = 0;
      while(true) {
        if(i__110800 < n__2527__auto____110799) {
          a__110794[i__110800] = init_val_or_seq;
          var G__110803 = i__110800 + 1;
          i__110800 = G__110803;
          continue
        }else {
        }
        break
      }
      return a__110794
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__110811 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__110812 = cljs.core.seq.call(null, init_val_or_seq);
      var i__110813 = 0;
      var s__110814 = s__110812;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____110815 = s__110814;
          if(and__3822__auto____110815) {
            return i__110813 < size
          }else {
            return and__3822__auto____110815
          }
        }())) {
          a__110811[i__110813] = cljs.core.first.call(null, s__110814);
          var G__110818 = i__110813 + 1;
          var G__110819 = cljs.core.next.call(null, s__110814);
          i__110813 = G__110818;
          s__110814 = G__110819;
          continue
        }else {
          return a__110811
        }
        break
      }
    }else {
      var n__2527__auto____110816 = size;
      var i__110817 = 0;
      while(true) {
        if(i__110817 < n__2527__auto____110816) {
          a__110811[i__110817] = init_val_or_seq;
          var G__110820 = i__110817 + 1;
          i__110817 = G__110820;
          continue
        }else {
        }
        break
      }
      return a__110811
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__110828 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__110829 = cljs.core.seq.call(null, init_val_or_seq);
      var i__110830 = 0;
      var s__110831 = s__110829;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____110832 = s__110831;
          if(and__3822__auto____110832) {
            return i__110830 < size
          }else {
            return and__3822__auto____110832
          }
        }())) {
          a__110828[i__110830] = cljs.core.first.call(null, s__110831);
          var G__110835 = i__110830 + 1;
          var G__110836 = cljs.core.next.call(null, s__110831);
          i__110830 = G__110835;
          s__110831 = G__110836;
          continue
        }else {
          return a__110828
        }
        break
      }
    }else {
      var n__2527__auto____110833 = size;
      var i__110834 = 0;
      while(true) {
        if(i__110834 < n__2527__auto____110833) {
          a__110828[i__110834] = init_val_or_seq;
          var G__110837 = i__110834 + 1;
          i__110834 = G__110837;
          continue
        }else {
        }
        break
      }
      return a__110828
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__110842 = s;
    var i__110843 = n;
    var sum__110844 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____110845 = i__110843 > 0;
        if(and__3822__auto____110845) {
          return cljs.core.seq.call(null, s__110842)
        }else {
          return and__3822__auto____110845
        }
      }())) {
        var G__110846 = cljs.core.next.call(null, s__110842);
        var G__110847 = i__110843 - 1;
        var G__110848 = sum__110844 + 1;
        s__110842 = G__110846;
        i__110843 = G__110847;
        sum__110844 = G__110848;
        continue
      }else {
        return sum__110844
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__110853 = cljs.core.seq.call(null, x);
      if(s__110853) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__110853)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__110853), concat.call(null, cljs.core.chunk_rest.call(null, s__110853), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__110853), concat.call(null, cljs.core.rest.call(null, s__110853), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__110857__delegate = function(x, y, zs) {
      var cat__110856 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__110855 = cljs.core.seq.call(null, xys);
          if(xys__110855) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__110855)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__110855), cat.call(null, cljs.core.chunk_rest.call(null, xys__110855), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__110855), cat.call(null, cljs.core.rest.call(null, xys__110855), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__110856.call(null, concat.call(null, x, y), zs)
    };
    var G__110857 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110857__delegate.call(this, x, y, zs)
    };
    G__110857.cljs$lang$maxFixedArity = 2;
    G__110857.cljs$lang$applyTo = function(arglist__110858) {
      var x = cljs.core.first(arglist__110858);
      var y = cljs.core.first(cljs.core.next(arglist__110858));
      var zs = cljs.core.rest(cljs.core.next(arglist__110858));
      return G__110857__delegate(x, y, zs)
    };
    G__110857.cljs$lang$arity$variadic = G__110857__delegate;
    return G__110857
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__110859__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__110859 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__110859__delegate.call(this, a, b, c, d, more)
    };
    G__110859.cljs$lang$maxFixedArity = 4;
    G__110859.cljs$lang$applyTo = function(arglist__110860) {
      var a = cljs.core.first(arglist__110860);
      var b = cljs.core.first(cljs.core.next(arglist__110860));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__110860)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__110860))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__110860))));
      return G__110859__delegate(a, b, c, d, more)
    };
    G__110859.cljs$lang$arity$variadic = G__110859__delegate;
    return G__110859
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__110902 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__110903 = cljs.core._first.call(null, args__110902);
    var args__110904 = cljs.core._rest.call(null, args__110902);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__110903)
      }else {
        return f.call(null, a__110903)
      }
    }else {
      var b__110905 = cljs.core._first.call(null, args__110904);
      var args__110906 = cljs.core._rest.call(null, args__110904);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__110903, b__110905)
        }else {
          return f.call(null, a__110903, b__110905)
        }
      }else {
        var c__110907 = cljs.core._first.call(null, args__110906);
        var args__110908 = cljs.core._rest.call(null, args__110906);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__110903, b__110905, c__110907)
          }else {
            return f.call(null, a__110903, b__110905, c__110907)
          }
        }else {
          var d__110909 = cljs.core._first.call(null, args__110908);
          var args__110910 = cljs.core._rest.call(null, args__110908);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__110903, b__110905, c__110907, d__110909)
            }else {
              return f.call(null, a__110903, b__110905, c__110907, d__110909)
            }
          }else {
            var e__110911 = cljs.core._first.call(null, args__110910);
            var args__110912 = cljs.core._rest.call(null, args__110910);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__110903, b__110905, c__110907, d__110909, e__110911)
              }else {
                return f.call(null, a__110903, b__110905, c__110907, d__110909, e__110911)
              }
            }else {
              var f__110913 = cljs.core._first.call(null, args__110912);
              var args__110914 = cljs.core._rest.call(null, args__110912);
              if(argc === 6) {
                if(f__110913.cljs$lang$arity$6) {
                  return f__110913.cljs$lang$arity$6(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913)
                }else {
                  return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913)
                }
              }else {
                var g__110915 = cljs.core._first.call(null, args__110914);
                var args__110916 = cljs.core._rest.call(null, args__110914);
                if(argc === 7) {
                  if(f__110913.cljs$lang$arity$7) {
                    return f__110913.cljs$lang$arity$7(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915)
                  }else {
                    return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915)
                  }
                }else {
                  var h__110917 = cljs.core._first.call(null, args__110916);
                  var args__110918 = cljs.core._rest.call(null, args__110916);
                  if(argc === 8) {
                    if(f__110913.cljs$lang$arity$8) {
                      return f__110913.cljs$lang$arity$8(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917)
                    }else {
                      return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917)
                    }
                  }else {
                    var i__110919 = cljs.core._first.call(null, args__110918);
                    var args__110920 = cljs.core._rest.call(null, args__110918);
                    if(argc === 9) {
                      if(f__110913.cljs$lang$arity$9) {
                        return f__110913.cljs$lang$arity$9(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919)
                      }else {
                        return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919)
                      }
                    }else {
                      var j__110921 = cljs.core._first.call(null, args__110920);
                      var args__110922 = cljs.core._rest.call(null, args__110920);
                      if(argc === 10) {
                        if(f__110913.cljs$lang$arity$10) {
                          return f__110913.cljs$lang$arity$10(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921)
                        }else {
                          return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921)
                        }
                      }else {
                        var k__110923 = cljs.core._first.call(null, args__110922);
                        var args__110924 = cljs.core._rest.call(null, args__110922);
                        if(argc === 11) {
                          if(f__110913.cljs$lang$arity$11) {
                            return f__110913.cljs$lang$arity$11(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923)
                          }else {
                            return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923)
                          }
                        }else {
                          var l__110925 = cljs.core._first.call(null, args__110924);
                          var args__110926 = cljs.core._rest.call(null, args__110924);
                          if(argc === 12) {
                            if(f__110913.cljs$lang$arity$12) {
                              return f__110913.cljs$lang$arity$12(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925)
                            }else {
                              return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925)
                            }
                          }else {
                            var m__110927 = cljs.core._first.call(null, args__110926);
                            var args__110928 = cljs.core._rest.call(null, args__110926);
                            if(argc === 13) {
                              if(f__110913.cljs$lang$arity$13) {
                                return f__110913.cljs$lang$arity$13(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927)
                              }else {
                                return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927)
                              }
                            }else {
                              var n__110929 = cljs.core._first.call(null, args__110928);
                              var args__110930 = cljs.core._rest.call(null, args__110928);
                              if(argc === 14) {
                                if(f__110913.cljs$lang$arity$14) {
                                  return f__110913.cljs$lang$arity$14(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929)
                                }else {
                                  return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929)
                                }
                              }else {
                                var o__110931 = cljs.core._first.call(null, args__110930);
                                var args__110932 = cljs.core._rest.call(null, args__110930);
                                if(argc === 15) {
                                  if(f__110913.cljs$lang$arity$15) {
                                    return f__110913.cljs$lang$arity$15(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931)
                                  }else {
                                    return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931)
                                  }
                                }else {
                                  var p__110933 = cljs.core._first.call(null, args__110932);
                                  var args__110934 = cljs.core._rest.call(null, args__110932);
                                  if(argc === 16) {
                                    if(f__110913.cljs$lang$arity$16) {
                                      return f__110913.cljs$lang$arity$16(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933)
                                    }else {
                                      return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933)
                                    }
                                  }else {
                                    var q__110935 = cljs.core._first.call(null, args__110934);
                                    var args__110936 = cljs.core._rest.call(null, args__110934);
                                    if(argc === 17) {
                                      if(f__110913.cljs$lang$arity$17) {
                                        return f__110913.cljs$lang$arity$17(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933, q__110935)
                                      }else {
                                        return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933, q__110935)
                                      }
                                    }else {
                                      var r__110937 = cljs.core._first.call(null, args__110936);
                                      var args__110938 = cljs.core._rest.call(null, args__110936);
                                      if(argc === 18) {
                                        if(f__110913.cljs$lang$arity$18) {
                                          return f__110913.cljs$lang$arity$18(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933, q__110935, r__110937)
                                        }else {
                                          return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933, q__110935, r__110937)
                                        }
                                      }else {
                                        var s__110939 = cljs.core._first.call(null, args__110938);
                                        var args__110940 = cljs.core._rest.call(null, args__110938);
                                        if(argc === 19) {
                                          if(f__110913.cljs$lang$arity$19) {
                                            return f__110913.cljs$lang$arity$19(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933, q__110935, r__110937, s__110939)
                                          }else {
                                            return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933, q__110935, r__110937, s__110939)
                                          }
                                        }else {
                                          var t__110941 = cljs.core._first.call(null, args__110940);
                                          var args__110942 = cljs.core._rest.call(null, args__110940);
                                          if(argc === 20) {
                                            if(f__110913.cljs$lang$arity$20) {
                                              return f__110913.cljs$lang$arity$20(a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933, q__110935, r__110937, s__110939, t__110941)
                                            }else {
                                              return f__110913.call(null, a__110903, b__110905, c__110907, d__110909, e__110911, f__110913, g__110915, h__110917, i__110919, j__110921, k__110923, l__110925, m__110927, n__110929, o__110931, p__110933, q__110935, r__110937, s__110939, t__110941)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__110957 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__110958 = cljs.core.bounded_count.call(null, args, fixed_arity__110957 + 1);
      if(bc__110958 <= fixed_arity__110957) {
        return cljs.core.apply_to.call(null, f, bc__110958, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__110959 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__110960 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__110961 = cljs.core.bounded_count.call(null, arglist__110959, fixed_arity__110960 + 1);
      if(bc__110961 <= fixed_arity__110960) {
        return cljs.core.apply_to.call(null, f, bc__110961, arglist__110959)
      }else {
        return f.cljs$lang$applyTo(arglist__110959)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__110959))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__110962 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__110963 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__110964 = cljs.core.bounded_count.call(null, arglist__110962, fixed_arity__110963 + 1);
      if(bc__110964 <= fixed_arity__110963) {
        return cljs.core.apply_to.call(null, f, bc__110964, arglist__110962)
      }else {
        return f.cljs$lang$applyTo(arglist__110962)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__110962))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__110965 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__110966 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__110967 = cljs.core.bounded_count.call(null, arglist__110965, fixed_arity__110966 + 1);
      if(bc__110967 <= fixed_arity__110966) {
        return cljs.core.apply_to.call(null, f, bc__110967, arglist__110965)
      }else {
        return f.cljs$lang$applyTo(arglist__110965)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__110965))
    }
  };
  var apply__6 = function() {
    var G__110971__delegate = function(f, a, b, c, d, args) {
      var arglist__110968 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__110969 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__110970 = cljs.core.bounded_count.call(null, arglist__110968, fixed_arity__110969 + 1);
        if(bc__110970 <= fixed_arity__110969) {
          return cljs.core.apply_to.call(null, f, bc__110970, arglist__110968)
        }else {
          return f.cljs$lang$applyTo(arglist__110968)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__110968))
      }
    };
    var G__110971 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__110971__delegate.call(this, f, a, b, c, d, args)
    };
    G__110971.cljs$lang$maxFixedArity = 5;
    G__110971.cljs$lang$applyTo = function(arglist__110972) {
      var f = cljs.core.first(arglist__110972);
      var a = cljs.core.first(cljs.core.next(arglist__110972));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__110972)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__110972))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__110972)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__110972)))));
      return G__110971__delegate(f, a, b, c, d, args)
    };
    G__110971.cljs$lang$arity$variadic = G__110971__delegate;
    return G__110971
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__110973) {
    var obj = cljs.core.first(arglist__110973);
    var f = cljs.core.first(cljs.core.next(arglist__110973));
    var args = cljs.core.rest(cljs.core.next(arglist__110973));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__110974__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__110974 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__110974__delegate.call(this, x, y, more)
    };
    G__110974.cljs$lang$maxFixedArity = 2;
    G__110974.cljs$lang$applyTo = function(arglist__110975) {
      var x = cljs.core.first(arglist__110975);
      var y = cljs.core.first(cljs.core.next(arglist__110975));
      var more = cljs.core.rest(cljs.core.next(arglist__110975));
      return G__110974__delegate(x, y, more)
    };
    G__110974.cljs$lang$arity$variadic = G__110974__delegate;
    return G__110974
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__110976 = pred;
        var G__110977 = cljs.core.next.call(null, coll);
        pred = G__110976;
        coll = G__110977;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____110979 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____110979)) {
        return or__3824__auto____110979
      }else {
        var G__110980 = pred;
        var G__110981 = cljs.core.next.call(null, coll);
        pred = G__110980;
        coll = G__110981;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__110982 = null;
    var G__110982__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__110982__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__110982__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__110982__3 = function() {
      var G__110983__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__110983 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__110983__delegate.call(this, x, y, zs)
      };
      G__110983.cljs$lang$maxFixedArity = 2;
      G__110983.cljs$lang$applyTo = function(arglist__110984) {
        var x = cljs.core.first(arglist__110984);
        var y = cljs.core.first(cljs.core.next(arglist__110984));
        var zs = cljs.core.rest(cljs.core.next(arglist__110984));
        return G__110983__delegate(x, y, zs)
      };
      G__110983.cljs$lang$arity$variadic = G__110983__delegate;
      return G__110983
    }();
    G__110982 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__110982__0.call(this);
        case 1:
          return G__110982__1.call(this, x);
        case 2:
          return G__110982__2.call(this, x, y);
        default:
          return G__110982__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__110982.cljs$lang$maxFixedArity = 2;
    G__110982.cljs$lang$applyTo = G__110982__3.cljs$lang$applyTo;
    return G__110982
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__110985__delegate = function(args) {
      return x
    };
    var G__110985 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__110985__delegate.call(this, args)
    };
    G__110985.cljs$lang$maxFixedArity = 0;
    G__110985.cljs$lang$applyTo = function(arglist__110986) {
      var args = cljs.core.seq(arglist__110986);
      return G__110985__delegate(args)
    };
    G__110985.cljs$lang$arity$variadic = G__110985__delegate;
    return G__110985
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__110993 = null;
      var G__110993__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__110993__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__110993__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__110993__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__110993__4 = function() {
        var G__110994__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__110994 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__110994__delegate.call(this, x, y, z, args)
        };
        G__110994.cljs$lang$maxFixedArity = 3;
        G__110994.cljs$lang$applyTo = function(arglist__110995) {
          var x = cljs.core.first(arglist__110995);
          var y = cljs.core.first(cljs.core.next(arglist__110995));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__110995)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__110995)));
          return G__110994__delegate(x, y, z, args)
        };
        G__110994.cljs$lang$arity$variadic = G__110994__delegate;
        return G__110994
      }();
      G__110993 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__110993__0.call(this);
          case 1:
            return G__110993__1.call(this, x);
          case 2:
            return G__110993__2.call(this, x, y);
          case 3:
            return G__110993__3.call(this, x, y, z);
          default:
            return G__110993__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__110993.cljs$lang$maxFixedArity = 3;
      G__110993.cljs$lang$applyTo = G__110993__4.cljs$lang$applyTo;
      return G__110993
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__110996 = null;
      var G__110996__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__110996__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__110996__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__110996__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__110996__4 = function() {
        var G__110997__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__110997 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__110997__delegate.call(this, x, y, z, args)
        };
        G__110997.cljs$lang$maxFixedArity = 3;
        G__110997.cljs$lang$applyTo = function(arglist__110998) {
          var x = cljs.core.first(arglist__110998);
          var y = cljs.core.first(cljs.core.next(arglist__110998));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__110998)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__110998)));
          return G__110997__delegate(x, y, z, args)
        };
        G__110997.cljs$lang$arity$variadic = G__110997__delegate;
        return G__110997
      }();
      G__110996 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__110996__0.call(this);
          case 1:
            return G__110996__1.call(this, x);
          case 2:
            return G__110996__2.call(this, x, y);
          case 3:
            return G__110996__3.call(this, x, y, z);
          default:
            return G__110996__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__110996.cljs$lang$maxFixedArity = 3;
      G__110996.cljs$lang$applyTo = G__110996__4.cljs$lang$applyTo;
      return G__110996
    }()
  };
  var comp__4 = function() {
    var G__110999__delegate = function(f1, f2, f3, fs) {
      var fs__110990 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__111000__delegate = function(args) {
          var ret__110991 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__110990), args);
          var fs__110992 = cljs.core.next.call(null, fs__110990);
          while(true) {
            if(fs__110992) {
              var G__111001 = cljs.core.first.call(null, fs__110992).call(null, ret__110991);
              var G__111002 = cljs.core.next.call(null, fs__110992);
              ret__110991 = G__111001;
              fs__110992 = G__111002;
              continue
            }else {
              return ret__110991
            }
            break
          }
        };
        var G__111000 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__111000__delegate.call(this, args)
        };
        G__111000.cljs$lang$maxFixedArity = 0;
        G__111000.cljs$lang$applyTo = function(arglist__111003) {
          var args = cljs.core.seq(arglist__111003);
          return G__111000__delegate(args)
        };
        G__111000.cljs$lang$arity$variadic = G__111000__delegate;
        return G__111000
      }()
    };
    var G__110999 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__110999__delegate.call(this, f1, f2, f3, fs)
    };
    G__110999.cljs$lang$maxFixedArity = 3;
    G__110999.cljs$lang$applyTo = function(arglist__111004) {
      var f1 = cljs.core.first(arglist__111004);
      var f2 = cljs.core.first(cljs.core.next(arglist__111004));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111004)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111004)));
      return G__110999__delegate(f1, f2, f3, fs)
    };
    G__110999.cljs$lang$arity$variadic = G__110999__delegate;
    return G__110999
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__111005__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__111005 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__111005__delegate.call(this, args)
      };
      G__111005.cljs$lang$maxFixedArity = 0;
      G__111005.cljs$lang$applyTo = function(arglist__111006) {
        var args = cljs.core.seq(arglist__111006);
        return G__111005__delegate(args)
      };
      G__111005.cljs$lang$arity$variadic = G__111005__delegate;
      return G__111005
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__111007__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__111007 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__111007__delegate.call(this, args)
      };
      G__111007.cljs$lang$maxFixedArity = 0;
      G__111007.cljs$lang$applyTo = function(arglist__111008) {
        var args = cljs.core.seq(arglist__111008);
        return G__111007__delegate(args)
      };
      G__111007.cljs$lang$arity$variadic = G__111007__delegate;
      return G__111007
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__111009__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__111009 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__111009__delegate.call(this, args)
      };
      G__111009.cljs$lang$maxFixedArity = 0;
      G__111009.cljs$lang$applyTo = function(arglist__111010) {
        var args = cljs.core.seq(arglist__111010);
        return G__111009__delegate(args)
      };
      G__111009.cljs$lang$arity$variadic = G__111009__delegate;
      return G__111009
    }()
  };
  var partial__5 = function() {
    var G__111011__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__111012__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__111012 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__111012__delegate.call(this, args)
        };
        G__111012.cljs$lang$maxFixedArity = 0;
        G__111012.cljs$lang$applyTo = function(arglist__111013) {
          var args = cljs.core.seq(arglist__111013);
          return G__111012__delegate(args)
        };
        G__111012.cljs$lang$arity$variadic = G__111012__delegate;
        return G__111012
      }()
    };
    var G__111011 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__111011__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__111011.cljs$lang$maxFixedArity = 4;
    G__111011.cljs$lang$applyTo = function(arglist__111014) {
      var f = cljs.core.first(arglist__111014);
      var arg1 = cljs.core.first(cljs.core.next(arglist__111014));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111014)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__111014))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__111014))));
      return G__111011__delegate(f, arg1, arg2, arg3, more)
    };
    G__111011.cljs$lang$arity$variadic = G__111011__delegate;
    return G__111011
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__111015 = null;
      var G__111015__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__111015__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__111015__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__111015__4 = function() {
        var G__111016__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__111016 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111016__delegate.call(this, a, b, c, ds)
        };
        G__111016.cljs$lang$maxFixedArity = 3;
        G__111016.cljs$lang$applyTo = function(arglist__111017) {
          var a = cljs.core.first(arglist__111017);
          var b = cljs.core.first(cljs.core.next(arglist__111017));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111017)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111017)));
          return G__111016__delegate(a, b, c, ds)
        };
        G__111016.cljs$lang$arity$variadic = G__111016__delegate;
        return G__111016
      }();
      G__111015 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__111015__1.call(this, a);
          case 2:
            return G__111015__2.call(this, a, b);
          case 3:
            return G__111015__3.call(this, a, b, c);
          default:
            return G__111015__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__111015.cljs$lang$maxFixedArity = 3;
      G__111015.cljs$lang$applyTo = G__111015__4.cljs$lang$applyTo;
      return G__111015
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__111018 = null;
      var G__111018__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__111018__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__111018__4 = function() {
        var G__111019__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__111019 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111019__delegate.call(this, a, b, c, ds)
        };
        G__111019.cljs$lang$maxFixedArity = 3;
        G__111019.cljs$lang$applyTo = function(arglist__111020) {
          var a = cljs.core.first(arglist__111020);
          var b = cljs.core.first(cljs.core.next(arglist__111020));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111020)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111020)));
          return G__111019__delegate(a, b, c, ds)
        };
        G__111019.cljs$lang$arity$variadic = G__111019__delegate;
        return G__111019
      }();
      G__111018 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__111018__2.call(this, a, b);
          case 3:
            return G__111018__3.call(this, a, b, c);
          default:
            return G__111018__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__111018.cljs$lang$maxFixedArity = 3;
      G__111018.cljs$lang$applyTo = G__111018__4.cljs$lang$applyTo;
      return G__111018
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__111021 = null;
      var G__111021__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__111021__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__111021__4 = function() {
        var G__111022__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__111022 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111022__delegate.call(this, a, b, c, ds)
        };
        G__111022.cljs$lang$maxFixedArity = 3;
        G__111022.cljs$lang$applyTo = function(arglist__111023) {
          var a = cljs.core.first(arglist__111023);
          var b = cljs.core.first(cljs.core.next(arglist__111023));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111023)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111023)));
          return G__111022__delegate(a, b, c, ds)
        };
        G__111022.cljs$lang$arity$variadic = G__111022__delegate;
        return G__111022
      }();
      G__111021 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__111021__2.call(this, a, b);
          case 3:
            return G__111021__3.call(this, a, b, c);
          default:
            return G__111021__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__111021.cljs$lang$maxFixedArity = 3;
      G__111021.cljs$lang$applyTo = G__111021__4.cljs$lang$applyTo;
      return G__111021
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__111039 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____111047 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____111047) {
        var s__111048 = temp__3974__auto____111047;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__111048)) {
          var c__111049 = cljs.core.chunk_first.call(null, s__111048);
          var size__111050 = cljs.core.count.call(null, c__111049);
          var b__111051 = cljs.core.chunk_buffer.call(null, size__111050);
          var n__2527__auto____111052 = size__111050;
          var i__111053 = 0;
          while(true) {
            if(i__111053 < n__2527__auto____111052) {
              cljs.core.chunk_append.call(null, b__111051, f.call(null, idx + i__111053, cljs.core._nth.call(null, c__111049, i__111053)));
              var G__111054 = i__111053 + 1;
              i__111053 = G__111054;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__111051), mapi.call(null, idx + size__111050, cljs.core.chunk_rest.call(null, s__111048)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__111048)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__111048)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__111039.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____111064 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____111064) {
      var s__111065 = temp__3974__auto____111064;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__111065)) {
        var c__111066 = cljs.core.chunk_first.call(null, s__111065);
        var size__111067 = cljs.core.count.call(null, c__111066);
        var b__111068 = cljs.core.chunk_buffer.call(null, size__111067);
        var n__2527__auto____111069 = size__111067;
        var i__111070 = 0;
        while(true) {
          if(i__111070 < n__2527__auto____111069) {
            var x__111071 = f.call(null, cljs.core._nth.call(null, c__111066, i__111070));
            if(x__111071 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__111068, x__111071)
            }
            var G__111073 = i__111070 + 1;
            i__111070 = G__111073;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__111068), keep.call(null, f, cljs.core.chunk_rest.call(null, s__111065)))
      }else {
        var x__111072 = f.call(null, cljs.core.first.call(null, s__111065));
        if(x__111072 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__111065))
        }else {
          return cljs.core.cons.call(null, x__111072, keep.call(null, f, cljs.core.rest.call(null, s__111065)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__111099 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____111109 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____111109) {
        var s__111110 = temp__3974__auto____111109;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__111110)) {
          var c__111111 = cljs.core.chunk_first.call(null, s__111110);
          var size__111112 = cljs.core.count.call(null, c__111111);
          var b__111113 = cljs.core.chunk_buffer.call(null, size__111112);
          var n__2527__auto____111114 = size__111112;
          var i__111115 = 0;
          while(true) {
            if(i__111115 < n__2527__auto____111114) {
              var x__111116 = f.call(null, idx + i__111115, cljs.core._nth.call(null, c__111111, i__111115));
              if(x__111116 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__111113, x__111116)
              }
              var G__111118 = i__111115 + 1;
              i__111115 = G__111118;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__111113), keepi.call(null, idx + size__111112, cljs.core.chunk_rest.call(null, s__111110)))
        }else {
          var x__111117 = f.call(null, idx, cljs.core.first.call(null, s__111110));
          if(x__111117 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__111110))
          }else {
            return cljs.core.cons.call(null, x__111117, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__111110)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__111099.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____111204 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____111204)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____111204
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____111205 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____111205)) {
            var and__3822__auto____111206 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____111206)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____111206
            }
          }else {
            return and__3822__auto____111205
          }
        }())
      };
      var ep1__4 = function() {
        var G__111275__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____111207 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____111207)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____111207
            }
          }())
        };
        var G__111275 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111275__delegate.call(this, x, y, z, args)
        };
        G__111275.cljs$lang$maxFixedArity = 3;
        G__111275.cljs$lang$applyTo = function(arglist__111276) {
          var x = cljs.core.first(arglist__111276);
          var y = cljs.core.first(cljs.core.next(arglist__111276));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111276)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111276)));
          return G__111275__delegate(x, y, z, args)
        };
        G__111275.cljs$lang$arity$variadic = G__111275__delegate;
        return G__111275
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____111219 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____111219)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____111219
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____111220 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____111220)) {
            var and__3822__auto____111221 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____111221)) {
              var and__3822__auto____111222 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____111222)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____111222
              }
            }else {
              return and__3822__auto____111221
            }
          }else {
            return and__3822__auto____111220
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____111223 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____111223)) {
            var and__3822__auto____111224 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____111224)) {
              var and__3822__auto____111225 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____111225)) {
                var and__3822__auto____111226 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____111226)) {
                  var and__3822__auto____111227 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____111227)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____111227
                  }
                }else {
                  return and__3822__auto____111226
                }
              }else {
                return and__3822__auto____111225
              }
            }else {
              return and__3822__auto____111224
            }
          }else {
            return and__3822__auto____111223
          }
        }())
      };
      var ep2__4 = function() {
        var G__111277__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____111228 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____111228)) {
              return cljs.core.every_QMARK_.call(null, function(p1__111074_SHARP_) {
                var and__3822__auto____111229 = p1.call(null, p1__111074_SHARP_);
                if(cljs.core.truth_(and__3822__auto____111229)) {
                  return p2.call(null, p1__111074_SHARP_)
                }else {
                  return and__3822__auto____111229
                }
              }, args)
            }else {
              return and__3822__auto____111228
            }
          }())
        };
        var G__111277 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111277__delegate.call(this, x, y, z, args)
        };
        G__111277.cljs$lang$maxFixedArity = 3;
        G__111277.cljs$lang$applyTo = function(arglist__111278) {
          var x = cljs.core.first(arglist__111278);
          var y = cljs.core.first(cljs.core.next(arglist__111278));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111278)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111278)));
          return G__111277__delegate(x, y, z, args)
        };
        G__111277.cljs$lang$arity$variadic = G__111277__delegate;
        return G__111277
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____111248 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____111248)) {
            var and__3822__auto____111249 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____111249)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____111249
            }
          }else {
            return and__3822__auto____111248
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____111250 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____111250)) {
            var and__3822__auto____111251 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____111251)) {
              var and__3822__auto____111252 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____111252)) {
                var and__3822__auto____111253 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____111253)) {
                  var and__3822__auto____111254 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____111254)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____111254
                  }
                }else {
                  return and__3822__auto____111253
                }
              }else {
                return and__3822__auto____111252
              }
            }else {
              return and__3822__auto____111251
            }
          }else {
            return and__3822__auto____111250
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____111255 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____111255)) {
            var and__3822__auto____111256 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____111256)) {
              var and__3822__auto____111257 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____111257)) {
                var and__3822__auto____111258 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____111258)) {
                  var and__3822__auto____111259 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____111259)) {
                    var and__3822__auto____111260 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____111260)) {
                      var and__3822__auto____111261 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____111261)) {
                        var and__3822__auto____111262 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____111262)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____111262
                        }
                      }else {
                        return and__3822__auto____111261
                      }
                    }else {
                      return and__3822__auto____111260
                    }
                  }else {
                    return and__3822__auto____111259
                  }
                }else {
                  return and__3822__auto____111258
                }
              }else {
                return and__3822__auto____111257
              }
            }else {
              return and__3822__auto____111256
            }
          }else {
            return and__3822__auto____111255
          }
        }())
      };
      var ep3__4 = function() {
        var G__111279__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____111263 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____111263)) {
              return cljs.core.every_QMARK_.call(null, function(p1__111075_SHARP_) {
                var and__3822__auto____111264 = p1.call(null, p1__111075_SHARP_);
                if(cljs.core.truth_(and__3822__auto____111264)) {
                  var and__3822__auto____111265 = p2.call(null, p1__111075_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____111265)) {
                    return p3.call(null, p1__111075_SHARP_)
                  }else {
                    return and__3822__auto____111265
                  }
                }else {
                  return and__3822__auto____111264
                }
              }, args)
            }else {
              return and__3822__auto____111263
            }
          }())
        };
        var G__111279 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111279__delegate.call(this, x, y, z, args)
        };
        G__111279.cljs$lang$maxFixedArity = 3;
        G__111279.cljs$lang$applyTo = function(arglist__111280) {
          var x = cljs.core.first(arglist__111280);
          var y = cljs.core.first(cljs.core.next(arglist__111280));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111280)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111280)));
          return G__111279__delegate(x, y, z, args)
        };
        G__111279.cljs$lang$arity$variadic = G__111279__delegate;
        return G__111279
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__111281__delegate = function(p1, p2, p3, ps) {
      var ps__111266 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__111076_SHARP_) {
            return p1__111076_SHARP_.call(null, x)
          }, ps__111266)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__111077_SHARP_) {
            var and__3822__auto____111271 = p1__111077_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____111271)) {
              return p1__111077_SHARP_.call(null, y)
            }else {
              return and__3822__auto____111271
            }
          }, ps__111266)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__111078_SHARP_) {
            var and__3822__auto____111272 = p1__111078_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____111272)) {
              var and__3822__auto____111273 = p1__111078_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____111273)) {
                return p1__111078_SHARP_.call(null, z)
              }else {
                return and__3822__auto____111273
              }
            }else {
              return and__3822__auto____111272
            }
          }, ps__111266)
        };
        var epn__4 = function() {
          var G__111282__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____111274 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____111274)) {
                return cljs.core.every_QMARK_.call(null, function(p1__111079_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__111079_SHARP_, args)
                }, ps__111266)
              }else {
                return and__3822__auto____111274
              }
            }())
          };
          var G__111282 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__111282__delegate.call(this, x, y, z, args)
          };
          G__111282.cljs$lang$maxFixedArity = 3;
          G__111282.cljs$lang$applyTo = function(arglist__111283) {
            var x = cljs.core.first(arglist__111283);
            var y = cljs.core.first(cljs.core.next(arglist__111283));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111283)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111283)));
            return G__111282__delegate(x, y, z, args)
          };
          G__111282.cljs$lang$arity$variadic = G__111282__delegate;
          return G__111282
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__111281 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__111281__delegate.call(this, p1, p2, p3, ps)
    };
    G__111281.cljs$lang$maxFixedArity = 3;
    G__111281.cljs$lang$applyTo = function(arglist__111284) {
      var p1 = cljs.core.first(arglist__111284);
      var p2 = cljs.core.first(cljs.core.next(arglist__111284));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111284)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111284)));
      return G__111281__delegate(p1, p2, p3, ps)
    };
    G__111281.cljs$lang$arity$variadic = G__111281__delegate;
    return G__111281
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____111365 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____111365)) {
          return or__3824__auto____111365
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____111366 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____111366)) {
          return or__3824__auto____111366
        }else {
          var or__3824__auto____111367 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____111367)) {
            return or__3824__auto____111367
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__111436__delegate = function(x, y, z, args) {
          var or__3824__auto____111368 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____111368)) {
            return or__3824__auto____111368
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__111436 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111436__delegate.call(this, x, y, z, args)
        };
        G__111436.cljs$lang$maxFixedArity = 3;
        G__111436.cljs$lang$applyTo = function(arglist__111437) {
          var x = cljs.core.first(arglist__111437);
          var y = cljs.core.first(cljs.core.next(arglist__111437));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111437)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111437)));
          return G__111436__delegate(x, y, z, args)
        };
        G__111436.cljs$lang$arity$variadic = G__111436__delegate;
        return G__111436
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____111380 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____111380)) {
          return or__3824__auto____111380
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____111381 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____111381)) {
          return or__3824__auto____111381
        }else {
          var or__3824__auto____111382 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____111382)) {
            return or__3824__auto____111382
          }else {
            var or__3824__auto____111383 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____111383)) {
              return or__3824__auto____111383
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____111384 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____111384)) {
          return or__3824__auto____111384
        }else {
          var or__3824__auto____111385 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____111385)) {
            return or__3824__auto____111385
          }else {
            var or__3824__auto____111386 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____111386)) {
              return or__3824__auto____111386
            }else {
              var or__3824__auto____111387 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____111387)) {
                return or__3824__auto____111387
              }else {
                var or__3824__auto____111388 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____111388)) {
                  return or__3824__auto____111388
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__111438__delegate = function(x, y, z, args) {
          var or__3824__auto____111389 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____111389)) {
            return or__3824__auto____111389
          }else {
            return cljs.core.some.call(null, function(p1__111119_SHARP_) {
              var or__3824__auto____111390 = p1.call(null, p1__111119_SHARP_);
              if(cljs.core.truth_(or__3824__auto____111390)) {
                return or__3824__auto____111390
              }else {
                return p2.call(null, p1__111119_SHARP_)
              }
            }, args)
          }
        };
        var G__111438 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111438__delegate.call(this, x, y, z, args)
        };
        G__111438.cljs$lang$maxFixedArity = 3;
        G__111438.cljs$lang$applyTo = function(arglist__111439) {
          var x = cljs.core.first(arglist__111439);
          var y = cljs.core.first(cljs.core.next(arglist__111439));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111439)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111439)));
          return G__111438__delegate(x, y, z, args)
        };
        G__111438.cljs$lang$arity$variadic = G__111438__delegate;
        return G__111438
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____111409 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____111409)) {
          return or__3824__auto____111409
        }else {
          var or__3824__auto____111410 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____111410)) {
            return or__3824__auto____111410
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____111411 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____111411)) {
          return or__3824__auto____111411
        }else {
          var or__3824__auto____111412 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____111412)) {
            return or__3824__auto____111412
          }else {
            var or__3824__auto____111413 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____111413)) {
              return or__3824__auto____111413
            }else {
              var or__3824__auto____111414 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____111414)) {
                return or__3824__auto____111414
              }else {
                var or__3824__auto____111415 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____111415)) {
                  return or__3824__auto____111415
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____111416 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____111416)) {
          return or__3824__auto____111416
        }else {
          var or__3824__auto____111417 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____111417)) {
            return or__3824__auto____111417
          }else {
            var or__3824__auto____111418 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____111418)) {
              return or__3824__auto____111418
            }else {
              var or__3824__auto____111419 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____111419)) {
                return or__3824__auto____111419
              }else {
                var or__3824__auto____111420 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____111420)) {
                  return or__3824__auto____111420
                }else {
                  var or__3824__auto____111421 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____111421)) {
                    return or__3824__auto____111421
                  }else {
                    var or__3824__auto____111422 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____111422)) {
                      return or__3824__auto____111422
                    }else {
                      var or__3824__auto____111423 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____111423)) {
                        return or__3824__auto____111423
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__111440__delegate = function(x, y, z, args) {
          var or__3824__auto____111424 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____111424)) {
            return or__3824__auto____111424
          }else {
            return cljs.core.some.call(null, function(p1__111120_SHARP_) {
              var or__3824__auto____111425 = p1.call(null, p1__111120_SHARP_);
              if(cljs.core.truth_(or__3824__auto____111425)) {
                return or__3824__auto____111425
              }else {
                var or__3824__auto____111426 = p2.call(null, p1__111120_SHARP_);
                if(cljs.core.truth_(or__3824__auto____111426)) {
                  return or__3824__auto____111426
                }else {
                  return p3.call(null, p1__111120_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__111440 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__111440__delegate.call(this, x, y, z, args)
        };
        G__111440.cljs$lang$maxFixedArity = 3;
        G__111440.cljs$lang$applyTo = function(arglist__111441) {
          var x = cljs.core.first(arglist__111441);
          var y = cljs.core.first(cljs.core.next(arglist__111441));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111441)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111441)));
          return G__111440__delegate(x, y, z, args)
        };
        G__111440.cljs$lang$arity$variadic = G__111440__delegate;
        return G__111440
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__111442__delegate = function(p1, p2, p3, ps) {
      var ps__111427 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__111121_SHARP_) {
            return p1__111121_SHARP_.call(null, x)
          }, ps__111427)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__111122_SHARP_) {
            var or__3824__auto____111432 = p1__111122_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____111432)) {
              return or__3824__auto____111432
            }else {
              return p1__111122_SHARP_.call(null, y)
            }
          }, ps__111427)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__111123_SHARP_) {
            var or__3824__auto____111433 = p1__111123_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____111433)) {
              return or__3824__auto____111433
            }else {
              var or__3824__auto____111434 = p1__111123_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____111434)) {
                return or__3824__auto____111434
              }else {
                return p1__111123_SHARP_.call(null, z)
              }
            }
          }, ps__111427)
        };
        var spn__4 = function() {
          var G__111443__delegate = function(x, y, z, args) {
            var or__3824__auto____111435 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____111435)) {
              return or__3824__auto____111435
            }else {
              return cljs.core.some.call(null, function(p1__111124_SHARP_) {
                return cljs.core.some.call(null, p1__111124_SHARP_, args)
              }, ps__111427)
            }
          };
          var G__111443 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__111443__delegate.call(this, x, y, z, args)
          };
          G__111443.cljs$lang$maxFixedArity = 3;
          G__111443.cljs$lang$applyTo = function(arglist__111444) {
            var x = cljs.core.first(arglist__111444);
            var y = cljs.core.first(cljs.core.next(arglist__111444));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111444)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111444)));
            return G__111443__delegate(x, y, z, args)
          };
          G__111443.cljs$lang$arity$variadic = G__111443__delegate;
          return G__111443
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__111442 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__111442__delegate.call(this, p1, p2, p3, ps)
    };
    G__111442.cljs$lang$maxFixedArity = 3;
    G__111442.cljs$lang$applyTo = function(arglist__111445) {
      var p1 = cljs.core.first(arglist__111445);
      var p2 = cljs.core.first(cljs.core.next(arglist__111445));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111445)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111445)));
      return G__111442__delegate(p1, p2, p3, ps)
    };
    G__111442.cljs$lang$arity$variadic = G__111442__delegate;
    return G__111442
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____111464 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____111464) {
        var s__111465 = temp__3974__auto____111464;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__111465)) {
          var c__111466 = cljs.core.chunk_first.call(null, s__111465);
          var size__111467 = cljs.core.count.call(null, c__111466);
          var b__111468 = cljs.core.chunk_buffer.call(null, size__111467);
          var n__2527__auto____111469 = size__111467;
          var i__111470 = 0;
          while(true) {
            if(i__111470 < n__2527__auto____111469) {
              cljs.core.chunk_append.call(null, b__111468, f.call(null, cljs.core._nth.call(null, c__111466, i__111470)));
              var G__111482 = i__111470 + 1;
              i__111470 = G__111482;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__111468), map.call(null, f, cljs.core.chunk_rest.call(null, s__111465)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__111465)), map.call(null, f, cljs.core.rest.call(null, s__111465)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__111471 = cljs.core.seq.call(null, c1);
      var s2__111472 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____111473 = s1__111471;
        if(and__3822__auto____111473) {
          return s2__111472
        }else {
          return and__3822__auto____111473
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__111471), cljs.core.first.call(null, s2__111472)), map.call(null, f, cljs.core.rest.call(null, s1__111471), cljs.core.rest.call(null, s2__111472)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__111474 = cljs.core.seq.call(null, c1);
      var s2__111475 = cljs.core.seq.call(null, c2);
      var s3__111476 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____111477 = s1__111474;
        if(and__3822__auto____111477) {
          var and__3822__auto____111478 = s2__111475;
          if(and__3822__auto____111478) {
            return s3__111476
          }else {
            return and__3822__auto____111478
          }
        }else {
          return and__3822__auto____111477
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__111474), cljs.core.first.call(null, s2__111475), cljs.core.first.call(null, s3__111476)), map.call(null, f, cljs.core.rest.call(null, s1__111474), cljs.core.rest.call(null, s2__111475), cljs.core.rest.call(null, s3__111476)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__111483__delegate = function(f, c1, c2, c3, colls) {
      var step__111481 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__111480 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__111480)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__111480), step.call(null, map.call(null, cljs.core.rest, ss__111480)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__111285_SHARP_) {
        return cljs.core.apply.call(null, f, p1__111285_SHARP_)
      }, step__111481.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__111483 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__111483__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__111483.cljs$lang$maxFixedArity = 4;
    G__111483.cljs$lang$applyTo = function(arglist__111484) {
      var f = cljs.core.first(arglist__111484);
      var c1 = cljs.core.first(cljs.core.next(arglist__111484));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111484)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__111484))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__111484))));
      return G__111483__delegate(f, c1, c2, c3, colls)
    };
    G__111483.cljs$lang$arity$variadic = G__111483__delegate;
    return G__111483
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____111487 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____111487) {
        var s__111488 = temp__3974__auto____111487;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__111488), take.call(null, n - 1, cljs.core.rest.call(null, s__111488)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__111494 = function(n, coll) {
    while(true) {
      var s__111492 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____111493 = n > 0;
        if(and__3822__auto____111493) {
          return s__111492
        }else {
          return and__3822__auto____111493
        }
      }())) {
        var G__111495 = n - 1;
        var G__111496 = cljs.core.rest.call(null, s__111492);
        n = G__111495;
        coll = G__111496;
        continue
      }else {
        return s__111492
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__111494.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__111499 = cljs.core.seq.call(null, coll);
  var lead__111500 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__111500) {
      var G__111501 = cljs.core.next.call(null, s__111499);
      var G__111502 = cljs.core.next.call(null, lead__111500);
      s__111499 = G__111501;
      lead__111500 = G__111502;
      continue
    }else {
      return s__111499
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__111508 = function(pred, coll) {
    while(true) {
      var s__111506 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____111507 = s__111506;
        if(and__3822__auto____111507) {
          return pred.call(null, cljs.core.first.call(null, s__111506))
        }else {
          return and__3822__auto____111507
        }
      }())) {
        var G__111509 = pred;
        var G__111510 = cljs.core.rest.call(null, s__111506);
        pred = G__111509;
        coll = G__111510;
        continue
      }else {
        return s__111506
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__111508.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____111513 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____111513) {
      var s__111514 = temp__3974__auto____111513;
      return cljs.core.concat.call(null, s__111514, cycle.call(null, s__111514))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__111519 = cljs.core.seq.call(null, c1);
      var s2__111520 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____111521 = s1__111519;
        if(and__3822__auto____111521) {
          return s2__111520
        }else {
          return and__3822__auto____111521
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__111519), cljs.core.cons.call(null, cljs.core.first.call(null, s2__111520), interleave.call(null, cljs.core.rest.call(null, s1__111519), cljs.core.rest.call(null, s2__111520))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__111523__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__111522 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__111522)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__111522), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__111522)))
        }else {
          return null
        }
      }, null)
    };
    var G__111523 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__111523__delegate.call(this, c1, c2, colls)
    };
    G__111523.cljs$lang$maxFixedArity = 2;
    G__111523.cljs$lang$applyTo = function(arglist__111524) {
      var c1 = cljs.core.first(arglist__111524);
      var c2 = cljs.core.first(cljs.core.next(arglist__111524));
      var colls = cljs.core.rest(cljs.core.next(arglist__111524));
      return G__111523__delegate(c1, c2, colls)
    };
    G__111523.cljs$lang$arity$variadic = G__111523__delegate;
    return G__111523
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__111534 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____111532 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____111532) {
        var coll__111533 = temp__3971__auto____111532;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__111533), cat.call(null, cljs.core.rest.call(null, coll__111533), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__111534.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__111535__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__111535 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__111535__delegate.call(this, f, coll, colls)
    };
    G__111535.cljs$lang$maxFixedArity = 2;
    G__111535.cljs$lang$applyTo = function(arglist__111536) {
      var f = cljs.core.first(arglist__111536);
      var coll = cljs.core.first(cljs.core.next(arglist__111536));
      var colls = cljs.core.rest(cljs.core.next(arglist__111536));
      return G__111535__delegate(f, coll, colls)
    };
    G__111535.cljs$lang$arity$variadic = G__111535__delegate;
    return G__111535
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____111546 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____111546) {
      var s__111547 = temp__3974__auto____111546;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__111547)) {
        var c__111548 = cljs.core.chunk_first.call(null, s__111547);
        var size__111549 = cljs.core.count.call(null, c__111548);
        var b__111550 = cljs.core.chunk_buffer.call(null, size__111549);
        var n__2527__auto____111551 = size__111549;
        var i__111552 = 0;
        while(true) {
          if(i__111552 < n__2527__auto____111551) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__111548, i__111552)))) {
              cljs.core.chunk_append.call(null, b__111550, cljs.core._nth.call(null, c__111548, i__111552))
            }else {
            }
            var G__111555 = i__111552 + 1;
            i__111552 = G__111555;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__111550), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__111547)))
      }else {
        var f__111553 = cljs.core.first.call(null, s__111547);
        var r__111554 = cljs.core.rest.call(null, s__111547);
        if(cljs.core.truth_(pred.call(null, f__111553))) {
          return cljs.core.cons.call(null, f__111553, filter.call(null, pred, r__111554))
        }else {
          return filter.call(null, pred, r__111554)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__111558 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__111558.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__111556_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__111556_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__111562__111563 = to;
    if(G__111562__111563) {
      if(function() {
        var or__3824__auto____111564 = G__111562__111563.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____111564) {
          return or__3824__auto____111564
        }else {
          return G__111562__111563.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__111562__111563.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__111562__111563)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__111562__111563)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__111565__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__111565 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__111565__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__111565.cljs$lang$maxFixedArity = 4;
    G__111565.cljs$lang$applyTo = function(arglist__111566) {
      var f = cljs.core.first(arglist__111566);
      var c1 = cljs.core.first(cljs.core.next(arglist__111566));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111566)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__111566))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__111566))));
      return G__111565__delegate(f, c1, c2, c3, colls)
    };
    G__111565.cljs$lang$arity$variadic = G__111565__delegate;
    return G__111565
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____111573 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____111573) {
        var s__111574 = temp__3974__auto____111573;
        var p__111575 = cljs.core.take.call(null, n, s__111574);
        if(n === cljs.core.count.call(null, p__111575)) {
          return cljs.core.cons.call(null, p__111575, partition.call(null, n, step, cljs.core.drop.call(null, step, s__111574)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____111576 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____111576) {
        var s__111577 = temp__3974__auto____111576;
        var p__111578 = cljs.core.take.call(null, n, s__111577);
        if(n === cljs.core.count.call(null, p__111578)) {
          return cljs.core.cons.call(null, p__111578, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__111577)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__111578, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__111583 = cljs.core.lookup_sentinel;
    var m__111584 = m;
    var ks__111585 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__111585) {
        var m__111586 = cljs.core._lookup.call(null, m__111584, cljs.core.first.call(null, ks__111585), sentinel__111583);
        if(sentinel__111583 === m__111586) {
          return not_found
        }else {
          var G__111587 = sentinel__111583;
          var G__111588 = m__111586;
          var G__111589 = cljs.core.next.call(null, ks__111585);
          sentinel__111583 = G__111587;
          m__111584 = G__111588;
          ks__111585 = G__111589;
          continue
        }
      }else {
        return m__111584
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__111590, v) {
  var vec__111595__111596 = p__111590;
  var k__111597 = cljs.core.nth.call(null, vec__111595__111596, 0, null);
  var ks__111598 = cljs.core.nthnext.call(null, vec__111595__111596, 1);
  if(cljs.core.truth_(ks__111598)) {
    return cljs.core.assoc.call(null, m, k__111597, assoc_in.call(null, cljs.core._lookup.call(null, m, k__111597, null), ks__111598, v))
  }else {
    return cljs.core.assoc.call(null, m, k__111597, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__111599, f, args) {
    var vec__111604__111605 = p__111599;
    var k__111606 = cljs.core.nth.call(null, vec__111604__111605, 0, null);
    var ks__111607 = cljs.core.nthnext.call(null, vec__111604__111605, 1);
    if(cljs.core.truth_(ks__111607)) {
      return cljs.core.assoc.call(null, m, k__111606, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__111606, null), ks__111607, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__111606, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__111606, null), args))
    }
  };
  var update_in = function(m, p__111599, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__111599, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__111608) {
    var m = cljs.core.first(arglist__111608);
    var p__111599 = cljs.core.first(cljs.core.next(arglist__111608));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__111608)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__111608)));
    return update_in__delegate(m, p__111599, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__111611 = this;
  var h__2192__auto____111612 = this__111611.__hash;
  if(!(h__2192__auto____111612 == null)) {
    return h__2192__auto____111612
  }else {
    var h__2192__auto____111613 = cljs.core.hash_coll.call(null, coll);
    this__111611.__hash = h__2192__auto____111613;
    return h__2192__auto____111613
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__111614 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__111615 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__111616 = this;
  var new_array__111617 = this__111616.array.slice();
  new_array__111617[k] = v;
  return new cljs.core.Vector(this__111616.meta, new_array__111617, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__111648 = null;
  var G__111648__2 = function(this_sym111618, k) {
    var this__111620 = this;
    var this_sym111618__111621 = this;
    var coll__111622 = this_sym111618__111621;
    return coll__111622.cljs$core$ILookup$_lookup$arity$2(coll__111622, k)
  };
  var G__111648__3 = function(this_sym111619, k, not_found) {
    var this__111620 = this;
    var this_sym111619__111623 = this;
    var coll__111624 = this_sym111619__111623;
    return coll__111624.cljs$core$ILookup$_lookup$arity$3(coll__111624, k, not_found)
  };
  G__111648 = function(this_sym111619, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__111648__2.call(this, this_sym111619, k);
      case 3:
        return G__111648__3.call(this, this_sym111619, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__111648
}();
cljs.core.Vector.prototype.apply = function(this_sym111609, args111610) {
  var this__111625 = this;
  return this_sym111609.call.apply(this_sym111609, [this_sym111609].concat(args111610.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__111626 = this;
  var new_array__111627 = this__111626.array.slice();
  new_array__111627.push(o);
  return new cljs.core.Vector(this__111626.meta, new_array__111627, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__111628 = this;
  var this__111629 = this;
  return cljs.core.pr_str.call(null, this__111629)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__111630 = this;
  return cljs.core.ci_reduce.call(null, this__111630.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__111631 = this;
  return cljs.core.ci_reduce.call(null, this__111631.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__111632 = this;
  if(this__111632.array.length > 0) {
    var vector_seq__111633 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__111632.array.length) {
          return cljs.core.cons.call(null, this__111632.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__111633.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__111634 = this;
  return this__111634.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__111635 = this;
  var count__111636 = this__111635.array.length;
  if(count__111636 > 0) {
    return this__111635.array[count__111636 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__111637 = this;
  if(this__111637.array.length > 0) {
    var new_array__111638 = this__111637.array.slice();
    new_array__111638.pop();
    return new cljs.core.Vector(this__111637.meta, new_array__111638, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__111639 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__111640 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__111641 = this;
  return new cljs.core.Vector(meta, this__111641.array, this__111641.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__111642 = this;
  return this__111642.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__111643 = this;
  if(function() {
    var and__3822__auto____111644 = 0 <= n;
    if(and__3822__auto____111644) {
      return n < this__111643.array.length
    }else {
      return and__3822__auto____111644
    }
  }()) {
    return this__111643.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__111645 = this;
  if(function() {
    var and__3822__auto____111646 = 0 <= n;
    if(and__3822__auto____111646) {
      return n < this__111645.array.length
    }else {
      return and__3822__auto____111646
    }
  }()) {
    return this__111645.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__111647 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__111647.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__111650 = pv.cnt;
  if(cnt__111650 < 32) {
    return 0
  }else {
    return cnt__111650 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__111656 = level;
  var ret__111657 = node;
  while(true) {
    if(ll__111656 === 0) {
      return ret__111657
    }else {
      var embed__111658 = ret__111657;
      var r__111659 = cljs.core.pv_fresh_node.call(null, edit);
      var ___111660 = cljs.core.pv_aset.call(null, r__111659, 0, embed__111658);
      var G__111661 = ll__111656 - 5;
      var G__111662 = r__111659;
      ll__111656 = G__111661;
      ret__111657 = G__111662;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__111668 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__111669 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__111668, subidx__111669, tailnode);
    return ret__111668
  }else {
    var child__111670 = cljs.core.pv_aget.call(null, parent, subidx__111669);
    if(!(child__111670 == null)) {
      var node_to_insert__111671 = push_tail.call(null, pv, level - 5, child__111670, tailnode);
      cljs.core.pv_aset.call(null, ret__111668, subidx__111669, node_to_insert__111671);
      return ret__111668
    }else {
      var node_to_insert__111672 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__111668, subidx__111669, node_to_insert__111672);
      return ret__111668
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____111676 = 0 <= i;
    if(and__3822__auto____111676) {
      return i < pv.cnt
    }else {
      return and__3822__auto____111676
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__111677 = pv.root;
      var level__111678 = pv.shift;
      while(true) {
        if(level__111678 > 0) {
          var G__111679 = cljs.core.pv_aget.call(null, node__111677, i >>> level__111678 & 31);
          var G__111680 = level__111678 - 5;
          node__111677 = G__111679;
          level__111678 = G__111680;
          continue
        }else {
          return node__111677.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__111683 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__111683, i & 31, val);
    return ret__111683
  }else {
    var subidx__111684 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__111683, subidx__111684, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__111684), i, val));
    return ret__111683
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__111690 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__111691 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__111690));
    if(function() {
      var and__3822__auto____111692 = new_child__111691 == null;
      if(and__3822__auto____111692) {
        return subidx__111690 === 0
      }else {
        return and__3822__auto____111692
      }
    }()) {
      return null
    }else {
      var ret__111693 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__111693, subidx__111690, new_child__111691);
      return ret__111693
    }
  }else {
    if(subidx__111690 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__111694 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__111694, subidx__111690, null);
        return ret__111694
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__111697 = this;
  return new cljs.core.TransientVector(this__111697.cnt, this__111697.shift, cljs.core.tv_editable_root.call(null, this__111697.root), cljs.core.tv_editable_tail.call(null, this__111697.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__111698 = this;
  var h__2192__auto____111699 = this__111698.__hash;
  if(!(h__2192__auto____111699 == null)) {
    return h__2192__auto____111699
  }else {
    var h__2192__auto____111700 = cljs.core.hash_coll.call(null, coll);
    this__111698.__hash = h__2192__auto____111700;
    return h__2192__auto____111700
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__111701 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__111702 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__111703 = this;
  if(function() {
    var and__3822__auto____111704 = 0 <= k;
    if(and__3822__auto____111704) {
      return k < this__111703.cnt
    }else {
      return and__3822__auto____111704
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__111705 = this__111703.tail.slice();
      new_tail__111705[k & 31] = v;
      return new cljs.core.PersistentVector(this__111703.meta, this__111703.cnt, this__111703.shift, this__111703.root, new_tail__111705, null)
    }else {
      return new cljs.core.PersistentVector(this__111703.meta, this__111703.cnt, this__111703.shift, cljs.core.do_assoc.call(null, coll, this__111703.shift, this__111703.root, k, v), this__111703.tail, null)
    }
  }else {
    if(k === this__111703.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__111703.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__111753 = null;
  var G__111753__2 = function(this_sym111706, k) {
    var this__111708 = this;
    var this_sym111706__111709 = this;
    var coll__111710 = this_sym111706__111709;
    return coll__111710.cljs$core$ILookup$_lookup$arity$2(coll__111710, k)
  };
  var G__111753__3 = function(this_sym111707, k, not_found) {
    var this__111708 = this;
    var this_sym111707__111711 = this;
    var coll__111712 = this_sym111707__111711;
    return coll__111712.cljs$core$ILookup$_lookup$arity$3(coll__111712, k, not_found)
  };
  G__111753 = function(this_sym111707, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__111753__2.call(this, this_sym111707, k);
      case 3:
        return G__111753__3.call(this, this_sym111707, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__111753
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym111695, args111696) {
  var this__111713 = this;
  return this_sym111695.call.apply(this_sym111695, [this_sym111695].concat(args111696.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__111714 = this;
  var step_init__111715 = [0, init];
  var i__111716 = 0;
  while(true) {
    if(i__111716 < this__111714.cnt) {
      var arr__111717 = cljs.core.array_for.call(null, v, i__111716);
      var len__111718 = arr__111717.length;
      var init__111722 = function() {
        var j__111719 = 0;
        var init__111720 = step_init__111715[1];
        while(true) {
          if(j__111719 < len__111718) {
            var init__111721 = f.call(null, init__111720, j__111719 + i__111716, arr__111717[j__111719]);
            if(cljs.core.reduced_QMARK_.call(null, init__111721)) {
              return init__111721
            }else {
              var G__111754 = j__111719 + 1;
              var G__111755 = init__111721;
              j__111719 = G__111754;
              init__111720 = G__111755;
              continue
            }
          }else {
            step_init__111715[0] = len__111718;
            step_init__111715[1] = init__111720;
            return init__111720
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__111722)) {
        return cljs.core.deref.call(null, init__111722)
      }else {
        var G__111756 = i__111716 + step_init__111715[0];
        i__111716 = G__111756;
        continue
      }
    }else {
      return step_init__111715[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__111723 = this;
  if(this__111723.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__111724 = this__111723.tail.slice();
    new_tail__111724.push(o);
    return new cljs.core.PersistentVector(this__111723.meta, this__111723.cnt + 1, this__111723.shift, this__111723.root, new_tail__111724, null)
  }else {
    var root_overflow_QMARK___111725 = this__111723.cnt >>> 5 > 1 << this__111723.shift;
    var new_shift__111726 = root_overflow_QMARK___111725 ? this__111723.shift + 5 : this__111723.shift;
    var new_root__111728 = root_overflow_QMARK___111725 ? function() {
      var n_r__111727 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__111727, 0, this__111723.root);
      cljs.core.pv_aset.call(null, n_r__111727, 1, cljs.core.new_path.call(null, null, this__111723.shift, new cljs.core.VectorNode(null, this__111723.tail)));
      return n_r__111727
    }() : cljs.core.push_tail.call(null, coll, this__111723.shift, this__111723.root, new cljs.core.VectorNode(null, this__111723.tail));
    return new cljs.core.PersistentVector(this__111723.meta, this__111723.cnt + 1, new_shift__111726, new_root__111728, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__111729 = this;
  if(this__111729.cnt > 0) {
    return new cljs.core.RSeq(coll, this__111729.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__111730 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__111731 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__111732 = this;
  var this__111733 = this;
  return cljs.core.pr_str.call(null, this__111733)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__111734 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__111735 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__111736 = this;
  if(this__111736.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__111737 = this;
  return this__111737.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__111738 = this;
  if(this__111738.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__111738.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__111739 = this;
  if(this__111739.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__111739.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__111739.meta)
    }else {
      if(1 < this__111739.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__111739.meta, this__111739.cnt - 1, this__111739.shift, this__111739.root, this__111739.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__111740 = cljs.core.array_for.call(null, coll, this__111739.cnt - 2);
          var nr__111741 = cljs.core.pop_tail.call(null, coll, this__111739.shift, this__111739.root);
          var new_root__111742 = nr__111741 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__111741;
          var cnt_1__111743 = this__111739.cnt - 1;
          if(function() {
            var and__3822__auto____111744 = 5 < this__111739.shift;
            if(and__3822__auto____111744) {
              return cljs.core.pv_aget.call(null, new_root__111742, 1) == null
            }else {
              return and__3822__auto____111744
            }
          }()) {
            return new cljs.core.PersistentVector(this__111739.meta, cnt_1__111743, this__111739.shift - 5, cljs.core.pv_aget.call(null, new_root__111742, 0), new_tail__111740, null)
          }else {
            return new cljs.core.PersistentVector(this__111739.meta, cnt_1__111743, this__111739.shift, new_root__111742, new_tail__111740, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__111745 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__111746 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__111747 = this;
  return new cljs.core.PersistentVector(meta, this__111747.cnt, this__111747.shift, this__111747.root, this__111747.tail, this__111747.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__111748 = this;
  return this__111748.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__111749 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__111750 = this;
  if(function() {
    var and__3822__auto____111751 = 0 <= n;
    if(and__3822__auto____111751) {
      return n < this__111750.cnt
    }else {
      return and__3822__auto____111751
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__111752 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__111752.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__111757 = xs.length;
  var xs__111758 = no_clone === true ? xs : xs.slice();
  if(l__111757 < 32) {
    return new cljs.core.PersistentVector(null, l__111757, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__111758, null)
  }else {
    var node__111759 = xs__111758.slice(0, 32);
    var v__111760 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__111759, null);
    var i__111761 = 32;
    var out__111762 = cljs.core._as_transient.call(null, v__111760);
    while(true) {
      if(i__111761 < l__111757) {
        var G__111763 = i__111761 + 1;
        var G__111764 = cljs.core.conj_BANG_.call(null, out__111762, xs__111758[i__111761]);
        i__111761 = G__111763;
        out__111762 = G__111764;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__111762)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__111765) {
    var args = cljs.core.seq(arglist__111765);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__111766 = this;
  if(this__111766.off + 1 < this__111766.node.length) {
    var s__111767 = cljs.core.chunked_seq.call(null, this__111766.vec, this__111766.node, this__111766.i, this__111766.off + 1);
    if(s__111767 == null) {
      return null
    }else {
      return s__111767
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__111768 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__111769 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__111770 = this;
  return this__111770.node[this__111770.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__111771 = this;
  if(this__111771.off + 1 < this__111771.node.length) {
    var s__111772 = cljs.core.chunked_seq.call(null, this__111771.vec, this__111771.node, this__111771.i, this__111771.off + 1);
    if(s__111772 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__111772
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__111773 = this;
  var l__111774 = this__111773.node.length;
  var s__111775 = this__111773.i + l__111774 < cljs.core._count.call(null, this__111773.vec) ? cljs.core.chunked_seq.call(null, this__111773.vec, this__111773.i + l__111774, 0) : null;
  if(s__111775 == null) {
    return null
  }else {
    return s__111775
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__111776 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__111777 = this;
  return cljs.core.chunked_seq.call(null, this__111777.vec, this__111777.node, this__111777.i, this__111777.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__111778 = this;
  return this__111778.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__111779 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__111779.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__111780 = this;
  return cljs.core.array_chunk.call(null, this__111780.node, this__111780.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__111781 = this;
  var l__111782 = this__111781.node.length;
  var s__111783 = this__111781.i + l__111782 < cljs.core._count.call(null, this__111781.vec) ? cljs.core.chunked_seq.call(null, this__111781.vec, this__111781.i + l__111782, 0) : null;
  if(s__111783 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__111783
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__111786 = this;
  var h__2192__auto____111787 = this__111786.__hash;
  if(!(h__2192__auto____111787 == null)) {
    return h__2192__auto____111787
  }else {
    var h__2192__auto____111788 = cljs.core.hash_coll.call(null, coll);
    this__111786.__hash = h__2192__auto____111788;
    return h__2192__auto____111788
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__111789 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__111790 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__111791 = this;
  var v_pos__111792 = this__111791.start + key;
  return new cljs.core.Subvec(this__111791.meta, cljs.core._assoc.call(null, this__111791.v, v_pos__111792, val), this__111791.start, this__111791.end > v_pos__111792 + 1 ? this__111791.end : v_pos__111792 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__111818 = null;
  var G__111818__2 = function(this_sym111793, k) {
    var this__111795 = this;
    var this_sym111793__111796 = this;
    var coll__111797 = this_sym111793__111796;
    return coll__111797.cljs$core$ILookup$_lookup$arity$2(coll__111797, k)
  };
  var G__111818__3 = function(this_sym111794, k, not_found) {
    var this__111795 = this;
    var this_sym111794__111798 = this;
    var coll__111799 = this_sym111794__111798;
    return coll__111799.cljs$core$ILookup$_lookup$arity$3(coll__111799, k, not_found)
  };
  G__111818 = function(this_sym111794, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__111818__2.call(this, this_sym111794, k);
      case 3:
        return G__111818__3.call(this, this_sym111794, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__111818
}();
cljs.core.Subvec.prototype.apply = function(this_sym111784, args111785) {
  var this__111800 = this;
  return this_sym111784.call.apply(this_sym111784, [this_sym111784].concat(args111785.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__111801 = this;
  return new cljs.core.Subvec(this__111801.meta, cljs.core._assoc_n.call(null, this__111801.v, this__111801.end, o), this__111801.start, this__111801.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__111802 = this;
  var this__111803 = this;
  return cljs.core.pr_str.call(null, this__111803)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__111804 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__111805 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__111806 = this;
  var subvec_seq__111807 = function subvec_seq(i) {
    if(i === this__111806.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__111806.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__111807.call(null, this__111806.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__111808 = this;
  return this__111808.end - this__111808.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__111809 = this;
  return cljs.core._nth.call(null, this__111809.v, this__111809.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__111810 = this;
  if(this__111810.start === this__111810.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__111810.meta, this__111810.v, this__111810.start, this__111810.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__111811 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__111812 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__111813 = this;
  return new cljs.core.Subvec(meta, this__111813.v, this__111813.start, this__111813.end, this__111813.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__111814 = this;
  return this__111814.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__111815 = this;
  return cljs.core._nth.call(null, this__111815.v, this__111815.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__111816 = this;
  return cljs.core._nth.call(null, this__111816.v, this__111816.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__111817 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__111817.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__111820 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__111820, 0, tl.length);
  return ret__111820
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__111824 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__111825 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__111824, subidx__111825, level === 5 ? tail_node : function() {
    var child__111826 = cljs.core.pv_aget.call(null, ret__111824, subidx__111825);
    if(!(child__111826 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__111826, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__111824
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__111831 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__111832 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__111833 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__111831, subidx__111832));
    if(function() {
      var and__3822__auto____111834 = new_child__111833 == null;
      if(and__3822__auto____111834) {
        return subidx__111832 === 0
      }else {
        return and__3822__auto____111834
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__111831, subidx__111832, new_child__111833);
      return node__111831
    }
  }else {
    if(subidx__111832 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__111831, subidx__111832, null);
        return node__111831
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____111839 = 0 <= i;
    if(and__3822__auto____111839) {
      return i < tv.cnt
    }else {
      return and__3822__auto____111839
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__111840 = tv.root;
      var node__111841 = root__111840;
      var level__111842 = tv.shift;
      while(true) {
        if(level__111842 > 0) {
          var G__111843 = cljs.core.tv_ensure_editable.call(null, root__111840.edit, cljs.core.pv_aget.call(null, node__111841, i >>> level__111842 & 31));
          var G__111844 = level__111842 - 5;
          node__111841 = G__111843;
          level__111842 = G__111844;
          continue
        }else {
          return node__111841.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__111884 = null;
  var G__111884__2 = function(this_sym111847, k) {
    var this__111849 = this;
    var this_sym111847__111850 = this;
    var coll__111851 = this_sym111847__111850;
    return coll__111851.cljs$core$ILookup$_lookup$arity$2(coll__111851, k)
  };
  var G__111884__3 = function(this_sym111848, k, not_found) {
    var this__111849 = this;
    var this_sym111848__111852 = this;
    var coll__111853 = this_sym111848__111852;
    return coll__111853.cljs$core$ILookup$_lookup$arity$3(coll__111853, k, not_found)
  };
  G__111884 = function(this_sym111848, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__111884__2.call(this, this_sym111848, k);
      case 3:
        return G__111884__3.call(this, this_sym111848, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__111884
}();
cljs.core.TransientVector.prototype.apply = function(this_sym111845, args111846) {
  var this__111854 = this;
  return this_sym111845.call.apply(this_sym111845, [this_sym111845].concat(args111846.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__111855 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__111856 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__111857 = this;
  if(this__111857.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__111858 = this;
  if(function() {
    var and__3822__auto____111859 = 0 <= n;
    if(and__3822__auto____111859) {
      return n < this__111858.cnt
    }else {
      return and__3822__auto____111859
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__111860 = this;
  if(this__111860.root.edit) {
    return this__111860.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__111861 = this;
  if(this__111861.root.edit) {
    if(function() {
      var and__3822__auto____111862 = 0 <= n;
      if(and__3822__auto____111862) {
        return n < this__111861.cnt
      }else {
        return and__3822__auto____111862
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__111861.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__111867 = function go(level, node) {
          var node__111865 = cljs.core.tv_ensure_editable.call(null, this__111861.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__111865, n & 31, val);
            return node__111865
          }else {
            var subidx__111866 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__111865, subidx__111866, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__111865, subidx__111866)));
            return node__111865
          }
        }.call(null, this__111861.shift, this__111861.root);
        this__111861.root = new_root__111867;
        return tcoll
      }
    }else {
      if(n === this__111861.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__111861.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__111868 = this;
  if(this__111868.root.edit) {
    if(this__111868.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__111868.cnt) {
        this__111868.cnt = 0;
        return tcoll
      }else {
        if((this__111868.cnt - 1 & 31) > 0) {
          this__111868.cnt = this__111868.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__111869 = cljs.core.editable_array_for.call(null, tcoll, this__111868.cnt - 2);
            var new_root__111871 = function() {
              var nr__111870 = cljs.core.tv_pop_tail.call(null, tcoll, this__111868.shift, this__111868.root);
              if(!(nr__111870 == null)) {
                return nr__111870
              }else {
                return new cljs.core.VectorNode(this__111868.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____111872 = 5 < this__111868.shift;
              if(and__3822__auto____111872) {
                return cljs.core.pv_aget.call(null, new_root__111871, 1) == null
              }else {
                return and__3822__auto____111872
              }
            }()) {
              var new_root__111873 = cljs.core.tv_ensure_editable.call(null, this__111868.root.edit, cljs.core.pv_aget.call(null, new_root__111871, 0));
              this__111868.root = new_root__111873;
              this__111868.shift = this__111868.shift - 5;
              this__111868.cnt = this__111868.cnt - 1;
              this__111868.tail = new_tail__111869;
              return tcoll
            }else {
              this__111868.root = new_root__111871;
              this__111868.cnt = this__111868.cnt - 1;
              this__111868.tail = new_tail__111869;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__111874 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__111875 = this;
  if(this__111875.root.edit) {
    if(this__111875.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__111875.tail[this__111875.cnt & 31] = o;
      this__111875.cnt = this__111875.cnt + 1;
      return tcoll
    }else {
      var tail_node__111876 = new cljs.core.VectorNode(this__111875.root.edit, this__111875.tail);
      var new_tail__111877 = cljs.core.make_array.call(null, 32);
      new_tail__111877[0] = o;
      this__111875.tail = new_tail__111877;
      if(this__111875.cnt >>> 5 > 1 << this__111875.shift) {
        var new_root_array__111878 = cljs.core.make_array.call(null, 32);
        var new_shift__111879 = this__111875.shift + 5;
        new_root_array__111878[0] = this__111875.root;
        new_root_array__111878[1] = cljs.core.new_path.call(null, this__111875.root.edit, this__111875.shift, tail_node__111876);
        this__111875.root = new cljs.core.VectorNode(this__111875.root.edit, new_root_array__111878);
        this__111875.shift = new_shift__111879;
        this__111875.cnt = this__111875.cnt + 1;
        return tcoll
      }else {
        var new_root__111880 = cljs.core.tv_push_tail.call(null, tcoll, this__111875.shift, this__111875.root, tail_node__111876);
        this__111875.root = new_root__111880;
        this__111875.cnt = this__111875.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__111881 = this;
  if(this__111881.root.edit) {
    this__111881.root.edit = null;
    var len__111882 = this__111881.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__111883 = cljs.core.make_array.call(null, len__111882);
    cljs.core.array_copy.call(null, this__111881.tail, 0, trimmed_tail__111883, 0, len__111882);
    return new cljs.core.PersistentVector(null, this__111881.cnt, this__111881.shift, this__111881.root, trimmed_tail__111883, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__111885 = this;
  var h__2192__auto____111886 = this__111885.__hash;
  if(!(h__2192__auto____111886 == null)) {
    return h__2192__auto____111886
  }else {
    var h__2192__auto____111887 = cljs.core.hash_coll.call(null, coll);
    this__111885.__hash = h__2192__auto____111887;
    return h__2192__auto____111887
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__111888 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__111889 = this;
  var this__111890 = this;
  return cljs.core.pr_str.call(null, this__111890)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__111891 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__111892 = this;
  return cljs.core._first.call(null, this__111892.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__111893 = this;
  var temp__3971__auto____111894 = cljs.core.next.call(null, this__111893.front);
  if(temp__3971__auto____111894) {
    var f1__111895 = temp__3971__auto____111894;
    return new cljs.core.PersistentQueueSeq(this__111893.meta, f1__111895, this__111893.rear, null)
  }else {
    if(this__111893.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__111893.meta, this__111893.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__111896 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__111897 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__111897.front, this__111897.rear, this__111897.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__111898 = this;
  return this__111898.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__111899 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__111899.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__111900 = this;
  var h__2192__auto____111901 = this__111900.__hash;
  if(!(h__2192__auto____111901 == null)) {
    return h__2192__auto____111901
  }else {
    var h__2192__auto____111902 = cljs.core.hash_coll.call(null, coll);
    this__111900.__hash = h__2192__auto____111902;
    return h__2192__auto____111902
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__111903 = this;
  if(cljs.core.truth_(this__111903.front)) {
    return new cljs.core.PersistentQueue(this__111903.meta, this__111903.count + 1, this__111903.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____111904 = this__111903.rear;
      if(cljs.core.truth_(or__3824__auto____111904)) {
        return or__3824__auto____111904
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__111903.meta, this__111903.count + 1, cljs.core.conj.call(null, this__111903.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__111905 = this;
  var this__111906 = this;
  return cljs.core.pr_str.call(null, this__111906)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__111907 = this;
  var rear__111908 = cljs.core.seq.call(null, this__111907.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____111909 = this__111907.front;
    if(cljs.core.truth_(or__3824__auto____111909)) {
      return or__3824__auto____111909
    }else {
      return rear__111908
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__111907.front, cljs.core.seq.call(null, rear__111908), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__111910 = this;
  return this__111910.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__111911 = this;
  return cljs.core._first.call(null, this__111911.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__111912 = this;
  if(cljs.core.truth_(this__111912.front)) {
    var temp__3971__auto____111913 = cljs.core.next.call(null, this__111912.front);
    if(temp__3971__auto____111913) {
      var f1__111914 = temp__3971__auto____111913;
      return new cljs.core.PersistentQueue(this__111912.meta, this__111912.count - 1, f1__111914, this__111912.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__111912.meta, this__111912.count - 1, cljs.core.seq.call(null, this__111912.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__111915 = this;
  return cljs.core.first.call(null, this__111915.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__111916 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__111917 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__111918 = this;
  return new cljs.core.PersistentQueue(meta, this__111918.count, this__111918.front, this__111918.rear, this__111918.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__111919 = this;
  return this__111919.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__111920 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__111921 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__111924 = array.length;
  var i__111925 = 0;
  while(true) {
    if(i__111925 < len__111924) {
      if(k === array[i__111925]) {
        return i__111925
      }else {
        var G__111926 = i__111925 + incr;
        i__111925 = G__111926;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__111929 = cljs.core.hash.call(null, a);
  var b__111930 = cljs.core.hash.call(null, b);
  if(a__111929 < b__111930) {
    return-1
  }else {
    if(a__111929 > b__111930) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__111938 = m.keys;
  var len__111939 = ks__111938.length;
  var so__111940 = m.strobj;
  var out__111941 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__111942 = 0;
  var out__111943 = cljs.core.transient$.call(null, out__111941);
  while(true) {
    if(i__111942 < len__111939) {
      var k__111944 = ks__111938[i__111942];
      var G__111945 = i__111942 + 1;
      var G__111946 = cljs.core.assoc_BANG_.call(null, out__111943, k__111944, so__111940[k__111944]);
      i__111942 = G__111945;
      out__111943 = G__111946;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__111943, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__111952 = {};
  var l__111953 = ks.length;
  var i__111954 = 0;
  while(true) {
    if(i__111954 < l__111953) {
      var k__111955 = ks[i__111954];
      new_obj__111952[k__111955] = obj[k__111955];
      var G__111956 = i__111954 + 1;
      i__111954 = G__111956;
      continue
    }else {
    }
    break
  }
  return new_obj__111952
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__111959 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__111960 = this;
  var h__2192__auto____111961 = this__111960.__hash;
  if(!(h__2192__auto____111961 == null)) {
    return h__2192__auto____111961
  }else {
    var h__2192__auto____111962 = cljs.core.hash_imap.call(null, coll);
    this__111960.__hash = h__2192__auto____111962;
    return h__2192__auto____111962
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__111963 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__111964 = this;
  if(function() {
    var and__3822__auto____111965 = goog.isString(k);
    if(and__3822__auto____111965) {
      return!(cljs.core.scan_array.call(null, 1, k, this__111964.keys) == null)
    }else {
      return and__3822__auto____111965
    }
  }()) {
    return this__111964.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__111966 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____111967 = this__111966.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____111967) {
        return or__3824__auto____111967
      }else {
        return this__111966.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__111966.keys) == null)) {
        var new_strobj__111968 = cljs.core.obj_clone.call(null, this__111966.strobj, this__111966.keys);
        new_strobj__111968[k] = v;
        return new cljs.core.ObjMap(this__111966.meta, this__111966.keys, new_strobj__111968, this__111966.update_count + 1, null)
      }else {
        var new_strobj__111969 = cljs.core.obj_clone.call(null, this__111966.strobj, this__111966.keys);
        var new_keys__111970 = this__111966.keys.slice();
        new_strobj__111969[k] = v;
        new_keys__111970.push(k);
        return new cljs.core.ObjMap(this__111966.meta, new_keys__111970, new_strobj__111969, this__111966.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__111971 = this;
  if(function() {
    var and__3822__auto____111972 = goog.isString(k);
    if(and__3822__auto____111972) {
      return!(cljs.core.scan_array.call(null, 1, k, this__111971.keys) == null)
    }else {
      return and__3822__auto____111972
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__111994 = null;
  var G__111994__2 = function(this_sym111973, k) {
    var this__111975 = this;
    var this_sym111973__111976 = this;
    var coll__111977 = this_sym111973__111976;
    return coll__111977.cljs$core$ILookup$_lookup$arity$2(coll__111977, k)
  };
  var G__111994__3 = function(this_sym111974, k, not_found) {
    var this__111975 = this;
    var this_sym111974__111978 = this;
    var coll__111979 = this_sym111974__111978;
    return coll__111979.cljs$core$ILookup$_lookup$arity$3(coll__111979, k, not_found)
  };
  G__111994 = function(this_sym111974, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__111994__2.call(this, this_sym111974, k);
      case 3:
        return G__111994__3.call(this, this_sym111974, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__111994
}();
cljs.core.ObjMap.prototype.apply = function(this_sym111957, args111958) {
  var this__111980 = this;
  return this_sym111957.call.apply(this_sym111957, [this_sym111957].concat(args111958.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__111981 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__111982 = this;
  var this__111983 = this;
  return cljs.core.pr_str.call(null, this__111983)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__111984 = this;
  if(this__111984.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__111947_SHARP_) {
      return cljs.core.vector.call(null, p1__111947_SHARP_, this__111984.strobj[p1__111947_SHARP_])
    }, this__111984.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__111985 = this;
  return this__111985.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__111986 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__111987 = this;
  return new cljs.core.ObjMap(meta, this__111987.keys, this__111987.strobj, this__111987.update_count, this__111987.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__111988 = this;
  return this__111988.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__111989 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__111989.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__111990 = this;
  if(function() {
    var and__3822__auto____111991 = goog.isString(k);
    if(and__3822__auto____111991) {
      return!(cljs.core.scan_array.call(null, 1, k, this__111990.keys) == null)
    }else {
      return and__3822__auto____111991
    }
  }()) {
    var new_keys__111992 = this__111990.keys.slice();
    var new_strobj__111993 = cljs.core.obj_clone.call(null, this__111990.strobj, this__111990.keys);
    new_keys__111992.splice(cljs.core.scan_array.call(null, 1, k, new_keys__111992), 1);
    cljs.core.js_delete.call(null, new_strobj__111993, k);
    return new cljs.core.ObjMap(this__111990.meta, new_keys__111992, new_strobj__111993, this__111990.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__111998 = this;
  var h__2192__auto____111999 = this__111998.__hash;
  if(!(h__2192__auto____111999 == null)) {
    return h__2192__auto____111999
  }else {
    var h__2192__auto____112000 = cljs.core.hash_imap.call(null, coll);
    this__111998.__hash = h__2192__auto____112000;
    return h__2192__auto____112000
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__112001 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__112002 = this;
  var bucket__112003 = this__112002.hashobj[cljs.core.hash.call(null, k)];
  var i__112004 = cljs.core.truth_(bucket__112003) ? cljs.core.scan_array.call(null, 2, k, bucket__112003) : null;
  if(cljs.core.truth_(i__112004)) {
    return bucket__112003[i__112004 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__112005 = this;
  var h__112006 = cljs.core.hash.call(null, k);
  var bucket__112007 = this__112005.hashobj[h__112006];
  if(cljs.core.truth_(bucket__112007)) {
    var new_bucket__112008 = bucket__112007.slice();
    var new_hashobj__112009 = goog.object.clone(this__112005.hashobj);
    new_hashobj__112009[h__112006] = new_bucket__112008;
    var temp__3971__auto____112010 = cljs.core.scan_array.call(null, 2, k, new_bucket__112008);
    if(cljs.core.truth_(temp__3971__auto____112010)) {
      var i__112011 = temp__3971__auto____112010;
      new_bucket__112008[i__112011 + 1] = v;
      return new cljs.core.HashMap(this__112005.meta, this__112005.count, new_hashobj__112009, null)
    }else {
      new_bucket__112008.push(k, v);
      return new cljs.core.HashMap(this__112005.meta, this__112005.count + 1, new_hashobj__112009, null)
    }
  }else {
    var new_hashobj__112012 = goog.object.clone(this__112005.hashobj);
    new_hashobj__112012[h__112006] = [k, v];
    return new cljs.core.HashMap(this__112005.meta, this__112005.count + 1, new_hashobj__112012, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__112013 = this;
  var bucket__112014 = this__112013.hashobj[cljs.core.hash.call(null, k)];
  var i__112015 = cljs.core.truth_(bucket__112014) ? cljs.core.scan_array.call(null, 2, k, bucket__112014) : null;
  if(cljs.core.truth_(i__112015)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__112040 = null;
  var G__112040__2 = function(this_sym112016, k) {
    var this__112018 = this;
    var this_sym112016__112019 = this;
    var coll__112020 = this_sym112016__112019;
    return coll__112020.cljs$core$ILookup$_lookup$arity$2(coll__112020, k)
  };
  var G__112040__3 = function(this_sym112017, k, not_found) {
    var this__112018 = this;
    var this_sym112017__112021 = this;
    var coll__112022 = this_sym112017__112021;
    return coll__112022.cljs$core$ILookup$_lookup$arity$3(coll__112022, k, not_found)
  };
  G__112040 = function(this_sym112017, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112040__2.call(this, this_sym112017, k);
      case 3:
        return G__112040__3.call(this, this_sym112017, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112040
}();
cljs.core.HashMap.prototype.apply = function(this_sym111996, args111997) {
  var this__112023 = this;
  return this_sym111996.call.apply(this_sym111996, [this_sym111996].concat(args111997.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__112024 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__112025 = this;
  var this__112026 = this;
  return cljs.core.pr_str.call(null, this__112026)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__112027 = this;
  if(this__112027.count > 0) {
    var hashes__112028 = cljs.core.js_keys.call(null, this__112027.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__111995_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__112027.hashobj[p1__111995_SHARP_]))
    }, hashes__112028)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__112029 = this;
  return this__112029.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112030 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112031 = this;
  return new cljs.core.HashMap(meta, this__112031.count, this__112031.hashobj, this__112031.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112032 = this;
  return this__112032.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__112033 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__112033.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__112034 = this;
  var h__112035 = cljs.core.hash.call(null, k);
  var bucket__112036 = this__112034.hashobj[h__112035];
  var i__112037 = cljs.core.truth_(bucket__112036) ? cljs.core.scan_array.call(null, 2, k, bucket__112036) : null;
  if(cljs.core.not.call(null, i__112037)) {
    return coll
  }else {
    var new_hashobj__112038 = goog.object.clone(this__112034.hashobj);
    if(3 > bucket__112036.length) {
      cljs.core.js_delete.call(null, new_hashobj__112038, h__112035)
    }else {
      var new_bucket__112039 = bucket__112036.slice();
      new_bucket__112039.splice(i__112037, 2);
      new_hashobj__112038[h__112035] = new_bucket__112039
    }
    return new cljs.core.HashMap(this__112034.meta, this__112034.count - 1, new_hashobj__112038, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__112041 = ks.length;
  var i__112042 = 0;
  var out__112043 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__112042 < len__112041) {
      var G__112044 = i__112042 + 1;
      var G__112045 = cljs.core.assoc.call(null, out__112043, ks[i__112042], vs[i__112042]);
      i__112042 = G__112044;
      out__112043 = G__112045;
      continue
    }else {
      return out__112043
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__112049 = m.arr;
  var len__112050 = arr__112049.length;
  var i__112051 = 0;
  while(true) {
    if(len__112050 <= i__112051) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__112049[i__112051], k)) {
        return i__112051
      }else {
        if("\ufdd0'else") {
          var G__112052 = i__112051 + 2;
          i__112051 = G__112052;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__112055 = this;
  return new cljs.core.TransientArrayMap({}, this__112055.arr.length, this__112055.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112056 = this;
  var h__2192__auto____112057 = this__112056.__hash;
  if(!(h__2192__auto____112057 == null)) {
    return h__2192__auto____112057
  }else {
    var h__2192__auto____112058 = cljs.core.hash_imap.call(null, coll);
    this__112056.__hash = h__2192__auto____112058;
    return h__2192__auto____112058
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__112059 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__112060 = this;
  var idx__112061 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__112061 === -1) {
    return not_found
  }else {
    return this__112060.arr[idx__112061 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__112062 = this;
  var idx__112063 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__112063 === -1) {
    if(this__112062.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__112062.meta, this__112062.cnt + 1, function() {
        var G__112064__112065 = this__112062.arr.slice();
        G__112064__112065.push(k);
        G__112064__112065.push(v);
        return G__112064__112065
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__112062.arr[idx__112063 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__112062.meta, this__112062.cnt, function() {
          var G__112066__112067 = this__112062.arr.slice();
          G__112066__112067[idx__112063 + 1] = v;
          return G__112066__112067
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__112068 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__112100 = null;
  var G__112100__2 = function(this_sym112069, k) {
    var this__112071 = this;
    var this_sym112069__112072 = this;
    var coll__112073 = this_sym112069__112072;
    return coll__112073.cljs$core$ILookup$_lookup$arity$2(coll__112073, k)
  };
  var G__112100__3 = function(this_sym112070, k, not_found) {
    var this__112071 = this;
    var this_sym112070__112074 = this;
    var coll__112075 = this_sym112070__112074;
    return coll__112075.cljs$core$ILookup$_lookup$arity$3(coll__112075, k, not_found)
  };
  G__112100 = function(this_sym112070, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112100__2.call(this, this_sym112070, k);
      case 3:
        return G__112100__3.call(this, this_sym112070, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112100
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym112053, args112054) {
  var this__112076 = this;
  return this_sym112053.call.apply(this_sym112053, [this_sym112053].concat(args112054.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__112077 = this;
  var len__112078 = this__112077.arr.length;
  var i__112079 = 0;
  var init__112080 = init;
  while(true) {
    if(i__112079 < len__112078) {
      var init__112081 = f.call(null, init__112080, this__112077.arr[i__112079], this__112077.arr[i__112079 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__112081)) {
        return cljs.core.deref.call(null, init__112081)
      }else {
        var G__112101 = i__112079 + 2;
        var G__112102 = init__112081;
        i__112079 = G__112101;
        init__112080 = G__112102;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__112082 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__112083 = this;
  var this__112084 = this;
  return cljs.core.pr_str.call(null, this__112084)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__112085 = this;
  if(this__112085.cnt > 0) {
    var len__112086 = this__112085.arr.length;
    var array_map_seq__112087 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__112086) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__112085.arr[i], this__112085.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__112087.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__112088 = this;
  return this__112088.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112089 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112090 = this;
  return new cljs.core.PersistentArrayMap(meta, this__112090.cnt, this__112090.arr, this__112090.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112091 = this;
  return this__112091.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__112092 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__112092.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__112093 = this;
  var idx__112094 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__112094 >= 0) {
    var len__112095 = this__112093.arr.length;
    var new_len__112096 = len__112095 - 2;
    if(new_len__112096 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__112097 = cljs.core.make_array.call(null, new_len__112096);
      var s__112098 = 0;
      var d__112099 = 0;
      while(true) {
        if(s__112098 >= len__112095) {
          return new cljs.core.PersistentArrayMap(this__112093.meta, this__112093.cnt - 1, new_arr__112097, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__112093.arr[s__112098])) {
            var G__112103 = s__112098 + 2;
            var G__112104 = d__112099;
            s__112098 = G__112103;
            d__112099 = G__112104;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__112097[d__112099] = this__112093.arr[s__112098];
              new_arr__112097[d__112099 + 1] = this__112093.arr[s__112098 + 1];
              var G__112105 = s__112098 + 2;
              var G__112106 = d__112099 + 2;
              s__112098 = G__112105;
              d__112099 = G__112106;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__112107 = cljs.core.count.call(null, ks);
  var i__112108 = 0;
  var out__112109 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__112108 < len__112107) {
      var G__112110 = i__112108 + 1;
      var G__112111 = cljs.core.assoc_BANG_.call(null, out__112109, ks[i__112108], vs[i__112108]);
      i__112108 = G__112110;
      out__112109 = G__112111;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__112109)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__112112 = this;
  if(cljs.core.truth_(this__112112.editable_QMARK_)) {
    var idx__112113 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__112113 >= 0) {
      this__112112.arr[idx__112113] = this__112112.arr[this__112112.len - 2];
      this__112112.arr[idx__112113 + 1] = this__112112.arr[this__112112.len - 1];
      var G__112114__112115 = this__112112.arr;
      G__112114__112115.pop();
      G__112114__112115.pop();
      G__112114__112115;
      this__112112.len = this__112112.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__112116 = this;
  if(cljs.core.truth_(this__112116.editable_QMARK_)) {
    var idx__112117 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__112117 === -1) {
      if(this__112116.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__112116.len = this__112116.len + 2;
        this__112116.arr.push(key);
        this__112116.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__112116.len, this__112116.arr), key, val)
      }
    }else {
      if(val === this__112116.arr[idx__112117 + 1]) {
        return tcoll
      }else {
        this__112116.arr[idx__112117 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__112118 = this;
  if(cljs.core.truth_(this__112118.editable_QMARK_)) {
    if(function() {
      var G__112119__112120 = o;
      if(G__112119__112120) {
        if(function() {
          var or__3824__auto____112121 = G__112119__112120.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____112121) {
            return or__3824__auto____112121
          }else {
            return G__112119__112120.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__112119__112120.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__112119__112120)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__112119__112120)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__112122 = cljs.core.seq.call(null, o);
      var tcoll__112123 = tcoll;
      while(true) {
        var temp__3971__auto____112124 = cljs.core.first.call(null, es__112122);
        if(cljs.core.truth_(temp__3971__auto____112124)) {
          var e__112125 = temp__3971__auto____112124;
          var G__112131 = cljs.core.next.call(null, es__112122);
          var G__112132 = tcoll__112123.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__112123, cljs.core.key.call(null, e__112125), cljs.core.val.call(null, e__112125));
          es__112122 = G__112131;
          tcoll__112123 = G__112132;
          continue
        }else {
          return tcoll__112123
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__112126 = this;
  if(cljs.core.truth_(this__112126.editable_QMARK_)) {
    this__112126.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__112126.len, 2), this__112126.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__112127 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__112128 = this;
  if(cljs.core.truth_(this__112128.editable_QMARK_)) {
    var idx__112129 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__112129 === -1) {
      return not_found
    }else {
      return this__112128.arr[idx__112129 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__112130 = this;
  if(cljs.core.truth_(this__112130.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__112130.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__112135 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__112136 = 0;
  while(true) {
    if(i__112136 < len) {
      var G__112137 = cljs.core.assoc_BANG_.call(null, out__112135, arr[i__112136], arr[i__112136 + 1]);
      var G__112138 = i__112136 + 2;
      out__112135 = G__112137;
      i__112136 = G__112138;
      continue
    }else {
      return out__112135
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__112143__112144 = arr.slice();
    G__112143__112144[i] = a;
    return G__112143__112144
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__112145__112146 = arr.slice();
    G__112145__112146[i] = a;
    G__112145__112146[j] = b;
    return G__112145__112146
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__112148 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__112148, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__112148, 2 * i, new_arr__112148.length - 2 * i);
  return new_arr__112148
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__112151 = inode.ensure_editable(edit);
    editable__112151.arr[i] = a;
    return editable__112151
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__112152 = inode.ensure_editable(edit);
    editable__112152.arr[i] = a;
    editable__112152.arr[j] = b;
    return editable__112152
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__112159 = arr.length;
  var i__112160 = 0;
  var init__112161 = init;
  while(true) {
    if(i__112160 < len__112159) {
      var init__112164 = function() {
        var k__112162 = arr[i__112160];
        if(!(k__112162 == null)) {
          return f.call(null, init__112161, k__112162, arr[i__112160 + 1])
        }else {
          var node__112163 = arr[i__112160 + 1];
          if(!(node__112163 == null)) {
            return node__112163.kv_reduce(f, init__112161)
          }else {
            return init__112161
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__112164)) {
        return cljs.core.deref.call(null, init__112164)
      }else {
        var G__112165 = i__112160 + 2;
        var G__112166 = init__112164;
        i__112160 = G__112165;
        init__112161 = G__112166;
        continue
      }
    }else {
      return init__112161
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__112167 = this;
  var inode__112168 = this;
  if(this__112167.bitmap === bit) {
    return null
  }else {
    var editable__112169 = inode__112168.ensure_editable(e);
    var earr__112170 = editable__112169.arr;
    var len__112171 = earr__112170.length;
    editable__112169.bitmap = bit ^ editable__112169.bitmap;
    cljs.core.array_copy.call(null, earr__112170, 2 * (i + 1), earr__112170, 2 * i, len__112171 - 2 * (i + 1));
    earr__112170[len__112171 - 2] = null;
    earr__112170[len__112171 - 1] = null;
    return editable__112169
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__112172 = this;
  var inode__112173 = this;
  var bit__112174 = 1 << (hash >>> shift & 31);
  var idx__112175 = cljs.core.bitmap_indexed_node_index.call(null, this__112172.bitmap, bit__112174);
  if((this__112172.bitmap & bit__112174) === 0) {
    var n__112176 = cljs.core.bit_count.call(null, this__112172.bitmap);
    if(2 * n__112176 < this__112172.arr.length) {
      var editable__112177 = inode__112173.ensure_editable(edit);
      var earr__112178 = editable__112177.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__112178, 2 * idx__112175, earr__112178, 2 * (idx__112175 + 1), 2 * (n__112176 - idx__112175));
      earr__112178[2 * idx__112175] = key;
      earr__112178[2 * idx__112175 + 1] = val;
      editable__112177.bitmap = editable__112177.bitmap | bit__112174;
      return editable__112177
    }else {
      if(n__112176 >= 16) {
        var nodes__112179 = cljs.core.make_array.call(null, 32);
        var jdx__112180 = hash >>> shift & 31;
        nodes__112179[jdx__112180] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__112181 = 0;
        var j__112182 = 0;
        while(true) {
          if(i__112181 < 32) {
            if((this__112172.bitmap >>> i__112181 & 1) === 0) {
              var G__112235 = i__112181 + 1;
              var G__112236 = j__112182;
              i__112181 = G__112235;
              j__112182 = G__112236;
              continue
            }else {
              nodes__112179[i__112181] = !(this__112172.arr[j__112182] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__112172.arr[j__112182]), this__112172.arr[j__112182], this__112172.arr[j__112182 + 1], added_leaf_QMARK_) : this__112172.arr[j__112182 + 1];
              var G__112237 = i__112181 + 1;
              var G__112238 = j__112182 + 2;
              i__112181 = G__112237;
              j__112182 = G__112238;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__112176 + 1, nodes__112179)
      }else {
        if("\ufdd0'else") {
          var new_arr__112183 = cljs.core.make_array.call(null, 2 * (n__112176 + 4));
          cljs.core.array_copy.call(null, this__112172.arr, 0, new_arr__112183, 0, 2 * idx__112175);
          new_arr__112183[2 * idx__112175] = key;
          new_arr__112183[2 * idx__112175 + 1] = val;
          cljs.core.array_copy.call(null, this__112172.arr, 2 * idx__112175, new_arr__112183, 2 * (idx__112175 + 1), 2 * (n__112176 - idx__112175));
          added_leaf_QMARK_.val = true;
          var editable__112184 = inode__112173.ensure_editable(edit);
          editable__112184.arr = new_arr__112183;
          editable__112184.bitmap = editable__112184.bitmap | bit__112174;
          return editable__112184
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__112185 = this__112172.arr[2 * idx__112175];
    var val_or_node__112186 = this__112172.arr[2 * idx__112175 + 1];
    if(key_or_nil__112185 == null) {
      var n__112187 = val_or_node__112186.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__112187 === val_or_node__112186) {
        return inode__112173
      }else {
        return cljs.core.edit_and_set.call(null, inode__112173, edit, 2 * idx__112175 + 1, n__112187)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__112185)) {
        if(val === val_or_node__112186) {
          return inode__112173
        }else {
          return cljs.core.edit_and_set.call(null, inode__112173, edit, 2 * idx__112175 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__112173, edit, 2 * idx__112175, null, 2 * idx__112175 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__112185, val_or_node__112186, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__112188 = this;
  var inode__112189 = this;
  return cljs.core.create_inode_seq.call(null, this__112188.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__112190 = this;
  var inode__112191 = this;
  var bit__112192 = 1 << (hash >>> shift & 31);
  if((this__112190.bitmap & bit__112192) === 0) {
    return inode__112191
  }else {
    var idx__112193 = cljs.core.bitmap_indexed_node_index.call(null, this__112190.bitmap, bit__112192);
    var key_or_nil__112194 = this__112190.arr[2 * idx__112193];
    var val_or_node__112195 = this__112190.arr[2 * idx__112193 + 1];
    if(key_or_nil__112194 == null) {
      var n__112196 = val_or_node__112195.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__112196 === val_or_node__112195) {
        return inode__112191
      }else {
        if(!(n__112196 == null)) {
          return cljs.core.edit_and_set.call(null, inode__112191, edit, 2 * idx__112193 + 1, n__112196)
        }else {
          if(this__112190.bitmap === bit__112192) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__112191.edit_and_remove_pair(edit, bit__112192, idx__112193)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__112194)) {
        removed_leaf_QMARK_[0] = true;
        return inode__112191.edit_and_remove_pair(edit, bit__112192, idx__112193)
      }else {
        if("\ufdd0'else") {
          return inode__112191
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__112197 = this;
  var inode__112198 = this;
  if(e === this__112197.edit) {
    return inode__112198
  }else {
    var n__112199 = cljs.core.bit_count.call(null, this__112197.bitmap);
    var new_arr__112200 = cljs.core.make_array.call(null, n__112199 < 0 ? 4 : 2 * (n__112199 + 1));
    cljs.core.array_copy.call(null, this__112197.arr, 0, new_arr__112200, 0, 2 * n__112199);
    return new cljs.core.BitmapIndexedNode(e, this__112197.bitmap, new_arr__112200)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__112201 = this;
  var inode__112202 = this;
  return cljs.core.inode_kv_reduce.call(null, this__112201.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__112203 = this;
  var inode__112204 = this;
  var bit__112205 = 1 << (hash >>> shift & 31);
  if((this__112203.bitmap & bit__112205) === 0) {
    return not_found
  }else {
    var idx__112206 = cljs.core.bitmap_indexed_node_index.call(null, this__112203.bitmap, bit__112205);
    var key_or_nil__112207 = this__112203.arr[2 * idx__112206];
    var val_or_node__112208 = this__112203.arr[2 * idx__112206 + 1];
    if(key_or_nil__112207 == null) {
      return val_or_node__112208.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__112207)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__112207, val_or_node__112208], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__112209 = this;
  var inode__112210 = this;
  var bit__112211 = 1 << (hash >>> shift & 31);
  if((this__112209.bitmap & bit__112211) === 0) {
    return inode__112210
  }else {
    var idx__112212 = cljs.core.bitmap_indexed_node_index.call(null, this__112209.bitmap, bit__112211);
    var key_or_nil__112213 = this__112209.arr[2 * idx__112212];
    var val_or_node__112214 = this__112209.arr[2 * idx__112212 + 1];
    if(key_or_nil__112213 == null) {
      var n__112215 = val_or_node__112214.inode_without(shift + 5, hash, key);
      if(n__112215 === val_or_node__112214) {
        return inode__112210
      }else {
        if(!(n__112215 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__112209.bitmap, cljs.core.clone_and_set.call(null, this__112209.arr, 2 * idx__112212 + 1, n__112215))
        }else {
          if(this__112209.bitmap === bit__112211) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__112209.bitmap ^ bit__112211, cljs.core.remove_pair.call(null, this__112209.arr, idx__112212))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__112213)) {
        return new cljs.core.BitmapIndexedNode(null, this__112209.bitmap ^ bit__112211, cljs.core.remove_pair.call(null, this__112209.arr, idx__112212))
      }else {
        if("\ufdd0'else") {
          return inode__112210
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__112216 = this;
  var inode__112217 = this;
  var bit__112218 = 1 << (hash >>> shift & 31);
  var idx__112219 = cljs.core.bitmap_indexed_node_index.call(null, this__112216.bitmap, bit__112218);
  if((this__112216.bitmap & bit__112218) === 0) {
    var n__112220 = cljs.core.bit_count.call(null, this__112216.bitmap);
    if(n__112220 >= 16) {
      var nodes__112221 = cljs.core.make_array.call(null, 32);
      var jdx__112222 = hash >>> shift & 31;
      nodes__112221[jdx__112222] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__112223 = 0;
      var j__112224 = 0;
      while(true) {
        if(i__112223 < 32) {
          if((this__112216.bitmap >>> i__112223 & 1) === 0) {
            var G__112239 = i__112223 + 1;
            var G__112240 = j__112224;
            i__112223 = G__112239;
            j__112224 = G__112240;
            continue
          }else {
            nodes__112221[i__112223] = !(this__112216.arr[j__112224] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__112216.arr[j__112224]), this__112216.arr[j__112224], this__112216.arr[j__112224 + 1], added_leaf_QMARK_) : this__112216.arr[j__112224 + 1];
            var G__112241 = i__112223 + 1;
            var G__112242 = j__112224 + 2;
            i__112223 = G__112241;
            j__112224 = G__112242;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__112220 + 1, nodes__112221)
    }else {
      var new_arr__112225 = cljs.core.make_array.call(null, 2 * (n__112220 + 1));
      cljs.core.array_copy.call(null, this__112216.arr, 0, new_arr__112225, 0, 2 * idx__112219);
      new_arr__112225[2 * idx__112219] = key;
      new_arr__112225[2 * idx__112219 + 1] = val;
      cljs.core.array_copy.call(null, this__112216.arr, 2 * idx__112219, new_arr__112225, 2 * (idx__112219 + 1), 2 * (n__112220 - idx__112219));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__112216.bitmap | bit__112218, new_arr__112225)
    }
  }else {
    var key_or_nil__112226 = this__112216.arr[2 * idx__112219];
    var val_or_node__112227 = this__112216.arr[2 * idx__112219 + 1];
    if(key_or_nil__112226 == null) {
      var n__112228 = val_or_node__112227.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__112228 === val_or_node__112227) {
        return inode__112217
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__112216.bitmap, cljs.core.clone_and_set.call(null, this__112216.arr, 2 * idx__112219 + 1, n__112228))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__112226)) {
        if(val === val_or_node__112227) {
          return inode__112217
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__112216.bitmap, cljs.core.clone_and_set.call(null, this__112216.arr, 2 * idx__112219 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__112216.bitmap, cljs.core.clone_and_set.call(null, this__112216.arr, 2 * idx__112219, null, 2 * idx__112219 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__112226, val_or_node__112227, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__112229 = this;
  var inode__112230 = this;
  var bit__112231 = 1 << (hash >>> shift & 31);
  if((this__112229.bitmap & bit__112231) === 0) {
    return not_found
  }else {
    var idx__112232 = cljs.core.bitmap_indexed_node_index.call(null, this__112229.bitmap, bit__112231);
    var key_or_nil__112233 = this__112229.arr[2 * idx__112232];
    var val_or_node__112234 = this__112229.arr[2 * idx__112232 + 1];
    if(key_or_nil__112233 == null) {
      return val_or_node__112234.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__112233)) {
        return val_or_node__112234
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__112250 = array_node.arr;
  var len__112251 = 2 * (array_node.cnt - 1);
  var new_arr__112252 = cljs.core.make_array.call(null, len__112251);
  var i__112253 = 0;
  var j__112254 = 1;
  var bitmap__112255 = 0;
  while(true) {
    if(i__112253 < len__112251) {
      if(function() {
        var and__3822__auto____112256 = !(i__112253 === idx);
        if(and__3822__auto____112256) {
          return!(arr__112250[i__112253] == null)
        }else {
          return and__3822__auto____112256
        }
      }()) {
        new_arr__112252[j__112254] = arr__112250[i__112253];
        var G__112257 = i__112253 + 1;
        var G__112258 = j__112254 + 2;
        var G__112259 = bitmap__112255 | 1 << i__112253;
        i__112253 = G__112257;
        j__112254 = G__112258;
        bitmap__112255 = G__112259;
        continue
      }else {
        var G__112260 = i__112253 + 1;
        var G__112261 = j__112254;
        var G__112262 = bitmap__112255;
        i__112253 = G__112260;
        j__112254 = G__112261;
        bitmap__112255 = G__112262;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__112255, new_arr__112252)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__112263 = this;
  var inode__112264 = this;
  var idx__112265 = hash >>> shift & 31;
  var node__112266 = this__112263.arr[idx__112265];
  if(node__112266 == null) {
    var editable__112267 = cljs.core.edit_and_set.call(null, inode__112264, edit, idx__112265, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__112267.cnt = editable__112267.cnt + 1;
    return editable__112267
  }else {
    var n__112268 = node__112266.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__112268 === node__112266) {
      return inode__112264
    }else {
      return cljs.core.edit_and_set.call(null, inode__112264, edit, idx__112265, n__112268)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__112269 = this;
  var inode__112270 = this;
  return cljs.core.create_array_node_seq.call(null, this__112269.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__112271 = this;
  var inode__112272 = this;
  var idx__112273 = hash >>> shift & 31;
  var node__112274 = this__112271.arr[idx__112273];
  if(node__112274 == null) {
    return inode__112272
  }else {
    var n__112275 = node__112274.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__112275 === node__112274) {
      return inode__112272
    }else {
      if(n__112275 == null) {
        if(this__112271.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__112272, edit, idx__112273)
        }else {
          var editable__112276 = cljs.core.edit_and_set.call(null, inode__112272, edit, idx__112273, n__112275);
          editable__112276.cnt = editable__112276.cnt - 1;
          return editable__112276
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__112272, edit, idx__112273, n__112275)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__112277 = this;
  var inode__112278 = this;
  if(e === this__112277.edit) {
    return inode__112278
  }else {
    return new cljs.core.ArrayNode(e, this__112277.cnt, this__112277.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__112279 = this;
  var inode__112280 = this;
  var len__112281 = this__112279.arr.length;
  var i__112282 = 0;
  var init__112283 = init;
  while(true) {
    if(i__112282 < len__112281) {
      var node__112284 = this__112279.arr[i__112282];
      if(!(node__112284 == null)) {
        var init__112285 = node__112284.kv_reduce(f, init__112283);
        if(cljs.core.reduced_QMARK_.call(null, init__112285)) {
          return cljs.core.deref.call(null, init__112285)
        }else {
          var G__112304 = i__112282 + 1;
          var G__112305 = init__112285;
          i__112282 = G__112304;
          init__112283 = G__112305;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__112283
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__112286 = this;
  var inode__112287 = this;
  var idx__112288 = hash >>> shift & 31;
  var node__112289 = this__112286.arr[idx__112288];
  if(!(node__112289 == null)) {
    return node__112289.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__112290 = this;
  var inode__112291 = this;
  var idx__112292 = hash >>> shift & 31;
  var node__112293 = this__112290.arr[idx__112292];
  if(!(node__112293 == null)) {
    var n__112294 = node__112293.inode_without(shift + 5, hash, key);
    if(n__112294 === node__112293) {
      return inode__112291
    }else {
      if(n__112294 == null) {
        if(this__112290.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__112291, null, idx__112292)
        }else {
          return new cljs.core.ArrayNode(null, this__112290.cnt - 1, cljs.core.clone_and_set.call(null, this__112290.arr, idx__112292, n__112294))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__112290.cnt, cljs.core.clone_and_set.call(null, this__112290.arr, idx__112292, n__112294))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__112291
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__112295 = this;
  var inode__112296 = this;
  var idx__112297 = hash >>> shift & 31;
  var node__112298 = this__112295.arr[idx__112297];
  if(node__112298 == null) {
    return new cljs.core.ArrayNode(null, this__112295.cnt + 1, cljs.core.clone_and_set.call(null, this__112295.arr, idx__112297, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__112299 = node__112298.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__112299 === node__112298) {
      return inode__112296
    }else {
      return new cljs.core.ArrayNode(null, this__112295.cnt, cljs.core.clone_and_set.call(null, this__112295.arr, idx__112297, n__112299))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__112300 = this;
  var inode__112301 = this;
  var idx__112302 = hash >>> shift & 31;
  var node__112303 = this__112300.arr[idx__112302];
  if(!(node__112303 == null)) {
    return node__112303.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__112308 = 2 * cnt;
  var i__112309 = 0;
  while(true) {
    if(i__112309 < lim__112308) {
      if(cljs.core.key_test.call(null, key, arr[i__112309])) {
        return i__112309
      }else {
        var G__112310 = i__112309 + 2;
        i__112309 = G__112310;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__112311 = this;
  var inode__112312 = this;
  if(hash === this__112311.collision_hash) {
    var idx__112313 = cljs.core.hash_collision_node_find_index.call(null, this__112311.arr, this__112311.cnt, key);
    if(idx__112313 === -1) {
      if(this__112311.arr.length > 2 * this__112311.cnt) {
        var editable__112314 = cljs.core.edit_and_set.call(null, inode__112312, edit, 2 * this__112311.cnt, key, 2 * this__112311.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__112314.cnt = editable__112314.cnt + 1;
        return editable__112314
      }else {
        var len__112315 = this__112311.arr.length;
        var new_arr__112316 = cljs.core.make_array.call(null, len__112315 + 2);
        cljs.core.array_copy.call(null, this__112311.arr, 0, new_arr__112316, 0, len__112315);
        new_arr__112316[len__112315] = key;
        new_arr__112316[len__112315 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__112312.ensure_editable_array(edit, this__112311.cnt + 1, new_arr__112316)
      }
    }else {
      if(this__112311.arr[idx__112313 + 1] === val) {
        return inode__112312
      }else {
        return cljs.core.edit_and_set.call(null, inode__112312, edit, idx__112313 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__112311.collision_hash >>> shift & 31), [null, inode__112312, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__112317 = this;
  var inode__112318 = this;
  return cljs.core.create_inode_seq.call(null, this__112317.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__112319 = this;
  var inode__112320 = this;
  var idx__112321 = cljs.core.hash_collision_node_find_index.call(null, this__112319.arr, this__112319.cnt, key);
  if(idx__112321 === -1) {
    return inode__112320
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__112319.cnt === 1) {
      return null
    }else {
      var editable__112322 = inode__112320.ensure_editable(edit);
      var earr__112323 = editable__112322.arr;
      earr__112323[idx__112321] = earr__112323[2 * this__112319.cnt - 2];
      earr__112323[idx__112321 + 1] = earr__112323[2 * this__112319.cnt - 1];
      earr__112323[2 * this__112319.cnt - 1] = null;
      earr__112323[2 * this__112319.cnt - 2] = null;
      editable__112322.cnt = editable__112322.cnt - 1;
      return editable__112322
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__112324 = this;
  var inode__112325 = this;
  if(e === this__112324.edit) {
    return inode__112325
  }else {
    var new_arr__112326 = cljs.core.make_array.call(null, 2 * (this__112324.cnt + 1));
    cljs.core.array_copy.call(null, this__112324.arr, 0, new_arr__112326, 0, 2 * this__112324.cnt);
    return new cljs.core.HashCollisionNode(e, this__112324.collision_hash, this__112324.cnt, new_arr__112326)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__112327 = this;
  var inode__112328 = this;
  return cljs.core.inode_kv_reduce.call(null, this__112327.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__112329 = this;
  var inode__112330 = this;
  var idx__112331 = cljs.core.hash_collision_node_find_index.call(null, this__112329.arr, this__112329.cnt, key);
  if(idx__112331 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__112329.arr[idx__112331])) {
      return cljs.core.PersistentVector.fromArray([this__112329.arr[idx__112331], this__112329.arr[idx__112331 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__112332 = this;
  var inode__112333 = this;
  var idx__112334 = cljs.core.hash_collision_node_find_index.call(null, this__112332.arr, this__112332.cnt, key);
  if(idx__112334 === -1) {
    return inode__112333
  }else {
    if(this__112332.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__112332.collision_hash, this__112332.cnt - 1, cljs.core.remove_pair.call(null, this__112332.arr, cljs.core.quot.call(null, idx__112334, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__112335 = this;
  var inode__112336 = this;
  if(hash === this__112335.collision_hash) {
    var idx__112337 = cljs.core.hash_collision_node_find_index.call(null, this__112335.arr, this__112335.cnt, key);
    if(idx__112337 === -1) {
      var len__112338 = this__112335.arr.length;
      var new_arr__112339 = cljs.core.make_array.call(null, len__112338 + 2);
      cljs.core.array_copy.call(null, this__112335.arr, 0, new_arr__112339, 0, len__112338);
      new_arr__112339[len__112338] = key;
      new_arr__112339[len__112338 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__112335.collision_hash, this__112335.cnt + 1, new_arr__112339)
    }else {
      if(cljs.core._EQ_.call(null, this__112335.arr[idx__112337], val)) {
        return inode__112336
      }else {
        return new cljs.core.HashCollisionNode(null, this__112335.collision_hash, this__112335.cnt, cljs.core.clone_and_set.call(null, this__112335.arr, idx__112337 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__112335.collision_hash >>> shift & 31), [null, inode__112336])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__112340 = this;
  var inode__112341 = this;
  var idx__112342 = cljs.core.hash_collision_node_find_index.call(null, this__112340.arr, this__112340.cnt, key);
  if(idx__112342 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__112340.arr[idx__112342])) {
      return this__112340.arr[idx__112342 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__112343 = this;
  var inode__112344 = this;
  if(e === this__112343.edit) {
    this__112343.arr = array;
    this__112343.cnt = count;
    return inode__112344
  }else {
    return new cljs.core.HashCollisionNode(this__112343.edit, this__112343.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__112349 = cljs.core.hash.call(null, key1);
    if(key1hash__112349 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__112349, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___112350 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__112349, key1, val1, added_leaf_QMARK___112350).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___112350)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__112351 = cljs.core.hash.call(null, key1);
    if(key1hash__112351 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__112351, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___112352 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__112351, key1, val1, added_leaf_QMARK___112352).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___112352)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112353 = this;
  var h__2192__auto____112354 = this__112353.__hash;
  if(!(h__2192__auto____112354 == null)) {
    return h__2192__auto____112354
  }else {
    var h__2192__auto____112355 = cljs.core.hash_coll.call(null, coll);
    this__112353.__hash = h__2192__auto____112355;
    return h__2192__auto____112355
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__112356 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__112357 = this;
  var this__112358 = this;
  return cljs.core.pr_str.call(null, this__112358)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__112359 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__112360 = this;
  if(this__112360.s == null) {
    return cljs.core.PersistentVector.fromArray([this__112360.nodes[this__112360.i], this__112360.nodes[this__112360.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__112360.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__112361 = this;
  if(this__112361.s == null) {
    return cljs.core.create_inode_seq.call(null, this__112361.nodes, this__112361.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__112361.nodes, this__112361.i, cljs.core.next.call(null, this__112361.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112362 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112363 = this;
  return new cljs.core.NodeSeq(meta, this__112363.nodes, this__112363.i, this__112363.s, this__112363.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112364 = this;
  return this__112364.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__112365 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__112365.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__112372 = nodes.length;
      var j__112373 = i;
      while(true) {
        if(j__112373 < len__112372) {
          if(!(nodes[j__112373] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__112373, null, null)
          }else {
            var temp__3971__auto____112374 = nodes[j__112373 + 1];
            if(cljs.core.truth_(temp__3971__auto____112374)) {
              var node__112375 = temp__3971__auto____112374;
              var temp__3971__auto____112376 = node__112375.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____112376)) {
                var node_seq__112377 = temp__3971__auto____112376;
                return new cljs.core.NodeSeq(null, nodes, j__112373 + 2, node_seq__112377, null)
              }else {
                var G__112378 = j__112373 + 2;
                j__112373 = G__112378;
                continue
              }
            }else {
              var G__112379 = j__112373 + 2;
              j__112373 = G__112379;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112380 = this;
  var h__2192__auto____112381 = this__112380.__hash;
  if(!(h__2192__auto____112381 == null)) {
    return h__2192__auto____112381
  }else {
    var h__2192__auto____112382 = cljs.core.hash_coll.call(null, coll);
    this__112380.__hash = h__2192__auto____112382;
    return h__2192__auto____112382
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__112383 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__112384 = this;
  var this__112385 = this;
  return cljs.core.pr_str.call(null, this__112385)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__112386 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__112387 = this;
  return cljs.core.first.call(null, this__112387.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__112388 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__112388.nodes, this__112388.i, cljs.core.next.call(null, this__112388.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112389 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112390 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__112390.nodes, this__112390.i, this__112390.s, this__112390.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112391 = this;
  return this__112391.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__112392 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__112392.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__112399 = nodes.length;
      var j__112400 = i;
      while(true) {
        if(j__112400 < len__112399) {
          var temp__3971__auto____112401 = nodes[j__112400];
          if(cljs.core.truth_(temp__3971__auto____112401)) {
            var nj__112402 = temp__3971__auto____112401;
            var temp__3971__auto____112403 = nj__112402.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____112403)) {
              var ns__112404 = temp__3971__auto____112403;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__112400 + 1, ns__112404, null)
            }else {
              var G__112405 = j__112400 + 1;
              j__112400 = G__112405;
              continue
            }
          }else {
            var G__112406 = j__112400 + 1;
            j__112400 = G__112406;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__112409 = this;
  return new cljs.core.TransientHashMap({}, this__112409.root, this__112409.cnt, this__112409.has_nil_QMARK_, this__112409.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112410 = this;
  var h__2192__auto____112411 = this__112410.__hash;
  if(!(h__2192__auto____112411 == null)) {
    return h__2192__auto____112411
  }else {
    var h__2192__auto____112412 = cljs.core.hash_imap.call(null, coll);
    this__112410.__hash = h__2192__auto____112412;
    return h__2192__auto____112412
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__112413 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__112414 = this;
  if(k == null) {
    if(this__112414.has_nil_QMARK_) {
      return this__112414.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__112414.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__112414.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__112415 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____112416 = this__112415.has_nil_QMARK_;
      if(and__3822__auto____112416) {
        return v === this__112415.nil_val
      }else {
        return and__3822__auto____112416
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__112415.meta, this__112415.has_nil_QMARK_ ? this__112415.cnt : this__112415.cnt + 1, this__112415.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___112417 = new cljs.core.Box(false);
    var new_root__112418 = (this__112415.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__112415.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___112417);
    if(new_root__112418 === this__112415.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__112415.meta, added_leaf_QMARK___112417.val ? this__112415.cnt + 1 : this__112415.cnt, new_root__112418, this__112415.has_nil_QMARK_, this__112415.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__112419 = this;
  if(k == null) {
    return this__112419.has_nil_QMARK_
  }else {
    if(this__112419.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__112419.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__112442 = null;
  var G__112442__2 = function(this_sym112420, k) {
    var this__112422 = this;
    var this_sym112420__112423 = this;
    var coll__112424 = this_sym112420__112423;
    return coll__112424.cljs$core$ILookup$_lookup$arity$2(coll__112424, k)
  };
  var G__112442__3 = function(this_sym112421, k, not_found) {
    var this__112422 = this;
    var this_sym112421__112425 = this;
    var coll__112426 = this_sym112421__112425;
    return coll__112426.cljs$core$ILookup$_lookup$arity$3(coll__112426, k, not_found)
  };
  G__112442 = function(this_sym112421, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112442__2.call(this, this_sym112421, k);
      case 3:
        return G__112442__3.call(this, this_sym112421, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112442
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym112407, args112408) {
  var this__112427 = this;
  return this_sym112407.call.apply(this_sym112407, [this_sym112407].concat(args112408.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__112428 = this;
  var init__112429 = this__112428.has_nil_QMARK_ ? f.call(null, init, null, this__112428.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__112429)) {
    return cljs.core.deref.call(null, init__112429)
  }else {
    if(!(this__112428.root == null)) {
      return this__112428.root.kv_reduce(f, init__112429)
    }else {
      if("\ufdd0'else") {
        return init__112429
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__112430 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__112431 = this;
  var this__112432 = this;
  return cljs.core.pr_str.call(null, this__112432)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__112433 = this;
  if(this__112433.cnt > 0) {
    var s__112434 = !(this__112433.root == null) ? this__112433.root.inode_seq() : null;
    if(this__112433.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__112433.nil_val], true), s__112434)
    }else {
      return s__112434
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__112435 = this;
  return this__112435.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112436 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112437 = this;
  return new cljs.core.PersistentHashMap(meta, this__112437.cnt, this__112437.root, this__112437.has_nil_QMARK_, this__112437.nil_val, this__112437.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112438 = this;
  return this__112438.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__112439 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__112439.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__112440 = this;
  if(k == null) {
    if(this__112440.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__112440.meta, this__112440.cnt - 1, this__112440.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__112440.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__112441 = this__112440.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__112441 === this__112440.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__112440.meta, this__112440.cnt - 1, new_root__112441, this__112440.has_nil_QMARK_, this__112440.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__112443 = ks.length;
  var i__112444 = 0;
  var out__112445 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__112444 < len__112443) {
      var G__112446 = i__112444 + 1;
      var G__112447 = cljs.core.assoc_BANG_.call(null, out__112445, ks[i__112444], vs[i__112444]);
      i__112444 = G__112446;
      out__112445 = G__112447;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__112445)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__112448 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__112449 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__112450 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__112451 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__112452 = this;
  if(k == null) {
    if(this__112452.has_nil_QMARK_) {
      return this__112452.nil_val
    }else {
      return null
    }
  }else {
    if(this__112452.root == null) {
      return null
    }else {
      return this__112452.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__112453 = this;
  if(k == null) {
    if(this__112453.has_nil_QMARK_) {
      return this__112453.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__112453.root == null) {
      return not_found
    }else {
      return this__112453.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__112454 = this;
  if(this__112454.edit) {
    return this__112454.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__112455 = this;
  var tcoll__112456 = this;
  if(this__112455.edit) {
    if(function() {
      var G__112457__112458 = o;
      if(G__112457__112458) {
        if(function() {
          var or__3824__auto____112459 = G__112457__112458.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____112459) {
            return or__3824__auto____112459
          }else {
            return G__112457__112458.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__112457__112458.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__112457__112458)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__112457__112458)
      }
    }()) {
      return tcoll__112456.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__112460 = cljs.core.seq.call(null, o);
      var tcoll__112461 = tcoll__112456;
      while(true) {
        var temp__3971__auto____112462 = cljs.core.first.call(null, es__112460);
        if(cljs.core.truth_(temp__3971__auto____112462)) {
          var e__112463 = temp__3971__auto____112462;
          var G__112474 = cljs.core.next.call(null, es__112460);
          var G__112475 = tcoll__112461.assoc_BANG_(cljs.core.key.call(null, e__112463), cljs.core.val.call(null, e__112463));
          es__112460 = G__112474;
          tcoll__112461 = G__112475;
          continue
        }else {
          return tcoll__112461
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__112464 = this;
  var tcoll__112465 = this;
  if(this__112464.edit) {
    if(k == null) {
      if(this__112464.nil_val === v) {
      }else {
        this__112464.nil_val = v
      }
      if(this__112464.has_nil_QMARK_) {
      }else {
        this__112464.count = this__112464.count + 1;
        this__112464.has_nil_QMARK_ = true
      }
      return tcoll__112465
    }else {
      var added_leaf_QMARK___112466 = new cljs.core.Box(false);
      var node__112467 = (this__112464.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__112464.root).inode_assoc_BANG_(this__112464.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___112466);
      if(node__112467 === this__112464.root) {
      }else {
        this__112464.root = node__112467
      }
      if(added_leaf_QMARK___112466.val) {
        this__112464.count = this__112464.count + 1
      }else {
      }
      return tcoll__112465
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__112468 = this;
  var tcoll__112469 = this;
  if(this__112468.edit) {
    if(k == null) {
      if(this__112468.has_nil_QMARK_) {
        this__112468.has_nil_QMARK_ = false;
        this__112468.nil_val = null;
        this__112468.count = this__112468.count - 1;
        return tcoll__112469
      }else {
        return tcoll__112469
      }
    }else {
      if(this__112468.root == null) {
        return tcoll__112469
      }else {
        var removed_leaf_QMARK___112470 = new cljs.core.Box(false);
        var node__112471 = this__112468.root.inode_without_BANG_(this__112468.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___112470);
        if(node__112471 === this__112468.root) {
        }else {
          this__112468.root = node__112471
        }
        if(cljs.core.truth_(removed_leaf_QMARK___112470[0])) {
          this__112468.count = this__112468.count - 1
        }else {
        }
        return tcoll__112469
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__112472 = this;
  var tcoll__112473 = this;
  if(this__112472.edit) {
    this__112472.edit = null;
    return new cljs.core.PersistentHashMap(null, this__112472.count, this__112472.root, this__112472.has_nil_QMARK_, this__112472.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__112478 = node;
  var stack__112479 = stack;
  while(true) {
    if(!(t__112478 == null)) {
      var G__112480 = ascending_QMARK_ ? t__112478.left : t__112478.right;
      var G__112481 = cljs.core.conj.call(null, stack__112479, t__112478);
      t__112478 = G__112480;
      stack__112479 = G__112481;
      continue
    }else {
      return stack__112479
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112482 = this;
  var h__2192__auto____112483 = this__112482.__hash;
  if(!(h__2192__auto____112483 == null)) {
    return h__2192__auto____112483
  }else {
    var h__2192__auto____112484 = cljs.core.hash_coll.call(null, coll);
    this__112482.__hash = h__2192__auto____112484;
    return h__2192__auto____112484
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__112485 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__112486 = this;
  var this__112487 = this;
  return cljs.core.pr_str.call(null, this__112487)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__112488 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__112489 = this;
  if(this__112489.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__112489.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__112490 = this;
  return cljs.core.peek.call(null, this__112490.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__112491 = this;
  var t__112492 = cljs.core.first.call(null, this__112491.stack);
  var next_stack__112493 = cljs.core.tree_map_seq_push.call(null, this__112491.ascending_QMARK_ ? t__112492.right : t__112492.left, cljs.core.next.call(null, this__112491.stack), this__112491.ascending_QMARK_);
  if(!(next_stack__112493 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__112493, this__112491.ascending_QMARK_, this__112491.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112494 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112495 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__112495.stack, this__112495.ascending_QMARK_, this__112495.cnt, this__112495.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112496 = this;
  return this__112496.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____112498 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____112498) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____112498
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____112500 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____112500) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____112500
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__112504 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__112504)) {
    return cljs.core.deref.call(null, init__112504)
  }else {
    var init__112505 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__112504) : init__112504;
    if(cljs.core.reduced_QMARK_.call(null, init__112505)) {
      return cljs.core.deref.call(null, init__112505)
    }else {
      var init__112506 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__112505) : init__112505;
      if(cljs.core.reduced_QMARK_.call(null, init__112506)) {
        return cljs.core.deref.call(null, init__112506)
      }else {
        return init__112506
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112509 = this;
  var h__2192__auto____112510 = this__112509.__hash;
  if(!(h__2192__auto____112510 == null)) {
    return h__2192__auto____112510
  }else {
    var h__2192__auto____112511 = cljs.core.hash_coll.call(null, coll);
    this__112509.__hash = h__2192__auto____112511;
    return h__2192__auto____112511
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__112512 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__112513 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__112514 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__112514.key, this__112514.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__112562 = null;
  var G__112562__2 = function(this_sym112515, k) {
    var this__112517 = this;
    var this_sym112515__112518 = this;
    var node__112519 = this_sym112515__112518;
    return node__112519.cljs$core$ILookup$_lookup$arity$2(node__112519, k)
  };
  var G__112562__3 = function(this_sym112516, k, not_found) {
    var this__112517 = this;
    var this_sym112516__112520 = this;
    var node__112521 = this_sym112516__112520;
    return node__112521.cljs$core$ILookup$_lookup$arity$3(node__112521, k, not_found)
  };
  G__112562 = function(this_sym112516, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112562__2.call(this, this_sym112516, k);
      case 3:
        return G__112562__3.call(this, this_sym112516, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112562
}();
cljs.core.BlackNode.prototype.apply = function(this_sym112507, args112508) {
  var this__112522 = this;
  return this_sym112507.call.apply(this_sym112507, [this_sym112507].concat(args112508.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__112523 = this;
  return cljs.core.PersistentVector.fromArray([this__112523.key, this__112523.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__112524 = this;
  return this__112524.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__112525 = this;
  return this__112525.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__112526 = this;
  var node__112527 = this;
  return ins.balance_right(node__112527)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__112528 = this;
  var node__112529 = this;
  return new cljs.core.RedNode(this__112528.key, this__112528.val, this__112528.left, this__112528.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__112530 = this;
  var node__112531 = this;
  return cljs.core.balance_right_del.call(null, this__112530.key, this__112530.val, this__112530.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__112532 = this;
  var node__112533 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__112534 = this;
  var node__112535 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__112535, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__112536 = this;
  var node__112537 = this;
  return cljs.core.balance_left_del.call(null, this__112536.key, this__112536.val, del, this__112536.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__112538 = this;
  var node__112539 = this;
  return ins.balance_left(node__112539)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__112540 = this;
  var node__112541 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__112541, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__112563 = null;
  var G__112563__0 = function() {
    var this__112542 = this;
    var this__112544 = this;
    return cljs.core.pr_str.call(null, this__112544)
  };
  G__112563 = function() {
    switch(arguments.length) {
      case 0:
        return G__112563__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112563
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__112545 = this;
  var node__112546 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__112546, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__112547 = this;
  var node__112548 = this;
  return node__112548
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__112549 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__112550 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__112551 = this;
  return cljs.core.list.call(null, this__112551.key, this__112551.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__112552 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__112553 = this;
  return this__112553.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__112554 = this;
  return cljs.core.PersistentVector.fromArray([this__112554.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__112555 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__112555.key, this__112555.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112556 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__112557 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__112557.key, this__112557.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__112558 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__112559 = this;
  if(n === 0) {
    return this__112559.key
  }else {
    if(n === 1) {
      return this__112559.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__112560 = this;
  if(n === 0) {
    return this__112560.key
  }else {
    if(n === 1) {
      return this__112560.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__112561 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112566 = this;
  var h__2192__auto____112567 = this__112566.__hash;
  if(!(h__2192__auto____112567 == null)) {
    return h__2192__auto____112567
  }else {
    var h__2192__auto____112568 = cljs.core.hash_coll.call(null, coll);
    this__112566.__hash = h__2192__auto____112568;
    return h__2192__auto____112568
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__112569 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__112570 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__112571 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__112571.key, this__112571.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__112619 = null;
  var G__112619__2 = function(this_sym112572, k) {
    var this__112574 = this;
    var this_sym112572__112575 = this;
    var node__112576 = this_sym112572__112575;
    return node__112576.cljs$core$ILookup$_lookup$arity$2(node__112576, k)
  };
  var G__112619__3 = function(this_sym112573, k, not_found) {
    var this__112574 = this;
    var this_sym112573__112577 = this;
    var node__112578 = this_sym112573__112577;
    return node__112578.cljs$core$ILookup$_lookup$arity$3(node__112578, k, not_found)
  };
  G__112619 = function(this_sym112573, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112619__2.call(this, this_sym112573, k);
      case 3:
        return G__112619__3.call(this, this_sym112573, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112619
}();
cljs.core.RedNode.prototype.apply = function(this_sym112564, args112565) {
  var this__112579 = this;
  return this_sym112564.call.apply(this_sym112564, [this_sym112564].concat(args112565.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__112580 = this;
  return cljs.core.PersistentVector.fromArray([this__112580.key, this__112580.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__112581 = this;
  return this__112581.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__112582 = this;
  return this__112582.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__112583 = this;
  var node__112584 = this;
  return new cljs.core.RedNode(this__112583.key, this__112583.val, this__112583.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__112585 = this;
  var node__112586 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__112587 = this;
  var node__112588 = this;
  return new cljs.core.RedNode(this__112587.key, this__112587.val, this__112587.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__112589 = this;
  var node__112590 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__112591 = this;
  var node__112592 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__112592, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__112593 = this;
  var node__112594 = this;
  return new cljs.core.RedNode(this__112593.key, this__112593.val, del, this__112593.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__112595 = this;
  var node__112596 = this;
  return new cljs.core.RedNode(this__112595.key, this__112595.val, ins, this__112595.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__112597 = this;
  var node__112598 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__112597.left)) {
    return new cljs.core.RedNode(this__112597.key, this__112597.val, this__112597.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__112597.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__112597.right)) {
      return new cljs.core.RedNode(this__112597.right.key, this__112597.right.val, new cljs.core.BlackNode(this__112597.key, this__112597.val, this__112597.left, this__112597.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__112597.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__112598, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__112620 = null;
  var G__112620__0 = function() {
    var this__112599 = this;
    var this__112601 = this;
    return cljs.core.pr_str.call(null, this__112601)
  };
  G__112620 = function() {
    switch(arguments.length) {
      case 0:
        return G__112620__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112620
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__112602 = this;
  var node__112603 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__112602.right)) {
    return new cljs.core.RedNode(this__112602.key, this__112602.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__112602.left, null), this__112602.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__112602.left)) {
      return new cljs.core.RedNode(this__112602.left.key, this__112602.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__112602.left.left, null), new cljs.core.BlackNode(this__112602.key, this__112602.val, this__112602.left.right, this__112602.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__112603, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__112604 = this;
  var node__112605 = this;
  return new cljs.core.BlackNode(this__112604.key, this__112604.val, this__112604.left, this__112604.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__112606 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__112607 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__112608 = this;
  return cljs.core.list.call(null, this__112608.key, this__112608.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__112609 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__112610 = this;
  return this__112610.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__112611 = this;
  return cljs.core.PersistentVector.fromArray([this__112611.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__112612 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__112612.key, this__112612.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112613 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__112614 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__112614.key, this__112614.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__112615 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__112616 = this;
  if(n === 0) {
    return this__112616.key
  }else {
    if(n === 1) {
      return this__112616.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__112617 = this;
  if(n === 0) {
    return this__112617.key
  }else {
    if(n === 1) {
      return this__112617.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__112618 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__112624 = comp.call(null, k, tree.key);
    if(c__112624 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__112624 < 0) {
        var ins__112625 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__112625 == null)) {
          return tree.add_left(ins__112625)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__112626 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__112626 == null)) {
            return tree.add_right(ins__112626)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__112629 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__112629)) {
            return new cljs.core.RedNode(app__112629.key, app__112629.val, new cljs.core.RedNode(left.key, left.val, left.left, app__112629.left, null), new cljs.core.RedNode(right.key, right.val, app__112629.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__112629, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__112630 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__112630)) {
              return new cljs.core.RedNode(app__112630.key, app__112630.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__112630.left, null), new cljs.core.BlackNode(right.key, right.val, app__112630.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__112630, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__112636 = comp.call(null, k, tree.key);
    if(c__112636 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__112636 < 0) {
        var del__112637 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____112638 = !(del__112637 == null);
          if(or__3824__auto____112638) {
            return or__3824__auto____112638
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__112637, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__112637, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__112639 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____112640 = !(del__112639 == null);
            if(or__3824__auto____112640) {
              return or__3824__auto____112640
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__112639)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__112639, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__112643 = tree.key;
  var c__112644 = comp.call(null, k, tk__112643);
  if(c__112644 === 0) {
    return tree.replace(tk__112643, v, tree.left, tree.right)
  }else {
    if(c__112644 < 0) {
      return tree.replace(tk__112643, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__112643, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112647 = this;
  var h__2192__auto____112648 = this__112647.__hash;
  if(!(h__2192__auto____112648 == null)) {
    return h__2192__auto____112648
  }else {
    var h__2192__auto____112649 = cljs.core.hash_imap.call(null, coll);
    this__112647.__hash = h__2192__auto____112649;
    return h__2192__auto____112649
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__112650 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__112651 = this;
  var n__112652 = coll.entry_at(k);
  if(!(n__112652 == null)) {
    return n__112652.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__112653 = this;
  var found__112654 = [null];
  var t__112655 = cljs.core.tree_map_add.call(null, this__112653.comp, this__112653.tree, k, v, found__112654);
  if(t__112655 == null) {
    var found_node__112656 = cljs.core.nth.call(null, found__112654, 0);
    if(cljs.core._EQ_.call(null, v, found_node__112656.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__112653.comp, cljs.core.tree_map_replace.call(null, this__112653.comp, this__112653.tree, k, v), this__112653.cnt, this__112653.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__112653.comp, t__112655.blacken(), this__112653.cnt + 1, this__112653.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__112657 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__112691 = null;
  var G__112691__2 = function(this_sym112658, k) {
    var this__112660 = this;
    var this_sym112658__112661 = this;
    var coll__112662 = this_sym112658__112661;
    return coll__112662.cljs$core$ILookup$_lookup$arity$2(coll__112662, k)
  };
  var G__112691__3 = function(this_sym112659, k, not_found) {
    var this__112660 = this;
    var this_sym112659__112663 = this;
    var coll__112664 = this_sym112659__112663;
    return coll__112664.cljs$core$ILookup$_lookup$arity$3(coll__112664, k, not_found)
  };
  G__112691 = function(this_sym112659, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112691__2.call(this, this_sym112659, k);
      case 3:
        return G__112691__3.call(this, this_sym112659, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112691
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym112645, args112646) {
  var this__112665 = this;
  return this_sym112645.call.apply(this_sym112645, [this_sym112645].concat(args112646.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__112666 = this;
  if(!(this__112666.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__112666.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__112667 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__112668 = this;
  if(this__112668.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__112668.tree, false, this__112668.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__112669 = this;
  var this__112670 = this;
  return cljs.core.pr_str.call(null, this__112670)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__112671 = this;
  var coll__112672 = this;
  var t__112673 = this__112671.tree;
  while(true) {
    if(!(t__112673 == null)) {
      var c__112674 = this__112671.comp.call(null, k, t__112673.key);
      if(c__112674 === 0) {
        return t__112673
      }else {
        if(c__112674 < 0) {
          var G__112692 = t__112673.left;
          t__112673 = G__112692;
          continue
        }else {
          if("\ufdd0'else") {
            var G__112693 = t__112673.right;
            t__112673 = G__112693;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__112675 = this;
  if(this__112675.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__112675.tree, ascending_QMARK_, this__112675.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__112676 = this;
  if(this__112676.cnt > 0) {
    var stack__112677 = null;
    var t__112678 = this__112676.tree;
    while(true) {
      if(!(t__112678 == null)) {
        var c__112679 = this__112676.comp.call(null, k, t__112678.key);
        if(c__112679 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__112677, t__112678), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__112679 < 0) {
              var G__112694 = cljs.core.conj.call(null, stack__112677, t__112678);
              var G__112695 = t__112678.left;
              stack__112677 = G__112694;
              t__112678 = G__112695;
              continue
            }else {
              var G__112696 = stack__112677;
              var G__112697 = t__112678.right;
              stack__112677 = G__112696;
              t__112678 = G__112697;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__112679 > 0) {
                var G__112698 = cljs.core.conj.call(null, stack__112677, t__112678);
                var G__112699 = t__112678.right;
                stack__112677 = G__112698;
                t__112678 = G__112699;
                continue
              }else {
                var G__112700 = stack__112677;
                var G__112701 = t__112678.left;
                stack__112677 = G__112700;
                t__112678 = G__112701;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__112677 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__112677, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__112680 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__112681 = this;
  return this__112681.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__112682 = this;
  if(this__112682.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__112682.tree, true, this__112682.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__112683 = this;
  return this__112683.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112684 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112685 = this;
  return new cljs.core.PersistentTreeMap(this__112685.comp, this__112685.tree, this__112685.cnt, meta, this__112685.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112686 = this;
  return this__112686.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__112687 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__112687.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__112688 = this;
  var found__112689 = [null];
  var t__112690 = cljs.core.tree_map_remove.call(null, this__112688.comp, this__112688.tree, k, found__112689);
  if(t__112690 == null) {
    if(cljs.core.nth.call(null, found__112689, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__112688.comp, null, 0, this__112688.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__112688.comp, t__112690.blacken(), this__112688.cnt - 1, this__112688.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__112704 = cljs.core.seq.call(null, keyvals);
    var out__112705 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__112704) {
        var G__112706 = cljs.core.nnext.call(null, in__112704);
        var G__112707 = cljs.core.assoc_BANG_.call(null, out__112705, cljs.core.first.call(null, in__112704), cljs.core.second.call(null, in__112704));
        in__112704 = G__112706;
        out__112705 = G__112707;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__112705)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__112708) {
    var keyvals = cljs.core.seq(arglist__112708);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__112709) {
    var keyvals = cljs.core.seq(arglist__112709);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__112713 = [];
    var obj__112714 = {};
    var kvs__112715 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__112715) {
        ks__112713.push(cljs.core.first.call(null, kvs__112715));
        obj__112714[cljs.core.first.call(null, kvs__112715)] = cljs.core.second.call(null, kvs__112715);
        var G__112716 = cljs.core.nnext.call(null, kvs__112715);
        kvs__112715 = G__112716;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__112713, obj__112714)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__112717) {
    var keyvals = cljs.core.seq(arglist__112717);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__112720 = cljs.core.seq.call(null, keyvals);
    var out__112721 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__112720) {
        var G__112722 = cljs.core.nnext.call(null, in__112720);
        var G__112723 = cljs.core.assoc.call(null, out__112721, cljs.core.first.call(null, in__112720), cljs.core.second.call(null, in__112720));
        in__112720 = G__112722;
        out__112721 = G__112723;
        continue
      }else {
        return out__112721
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__112724) {
    var keyvals = cljs.core.seq(arglist__112724);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__112727 = cljs.core.seq.call(null, keyvals);
    var out__112728 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__112727) {
        var G__112729 = cljs.core.nnext.call(null, in__112727);
        var G__112730 = cljs.core.assoc.call(null, out__112728, cljs.core.first.call(null, in__112727), cljs.core.second.call(null, in__112727));
        in__112727 = G__112729;
        out__112728 = G__112730;
        continue
      }else {
        return out__112728
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__112731) {
    var comparator = cljs.core.first(arglist__112731);
    var keyvals = cljs.core.rest(arglist__112731);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__112732_SHARP_, p2__112733_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____112735 = p1__112732_SHARP_;
          if(cljs.core.truth_(or__3824__auto____112735)) {
            return or__3824__auto____112735
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__112733_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__112736) {
    var maps = cljs.core.seq(arglist__112736);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__112744 = function(m, e) {
        var k__112742 = cljs.core.first.call(null, e);
        var v__112743 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__112742)) {
          return cljs.core.assoc.call(null, m, k__112742, f.call(null, cljs.core._lookup.call(null, m, k__112742, null), v__112743))
        }else {
          return cljs.core.assoc.call(null, m, k__112742, v__112743)
        }
      };
      var merge2__112746 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__112744, function() {
          var or__3824__auto____112745 = m1;
          if(cljs.core.truth_(or__3824__auto____112745)) {
            return or__3824__auto____112745
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__112746, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__112747) {
    var f = cljs.core.first(arglist__112747);
    var maps = cljs.core.rest(arglist__112747);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__112752 = cljs.core.ObjMap.EMPTY;
  var keys__112753 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__112753) {
      var key__112754 = cljs.core.first.call(null, keys__112753);
      var entry__112755 = cljs.core._lookup.call(null, map, key__112754, "\ufdd0'cljs.core/not-found");
      var G__112756 = cljs.core.not_EQ_.call(null, entry__112755, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__112752, key__112754, entry__112755) : ret__112752;
      var G__112757 = cljs.core.next.call(null, keys__112753);
      ret__112752 = G__112756;
      keys__112753 = G__112757;
      continue
    }else {
      return ret__112752
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__112761 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__112761.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112762 = this;
  var h__2192__auto____112763 = this__112762.__hash;
  if(!(h__2192__auto____112763 == null)) {
    return h__2192__auto____112763
  }else {
    var h__2192__auto____112764 = cljs.core.hash_iset.call(null, coll);
    this__112762.__hash = h__2192__auto____112764;
    return h__2192__auto____112764
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__112765 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__112766 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__112766.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__112787 = null;
  var G__112787__2 = function(this_sym112767, k) {
    var this__112769 = this;
    var this_sym112767__112770 = this;
    var coll__112771 = this_sym112767__112770;
    return coll__112771.cljs$core$ILookup$_lookup$arity$2(coll__112771, k)
  };
  var G__112787__3 = function(this_sym112768, k, not_found) {
    var this__112769 = this;
    var this_sym112768__112772 = this;
    var coll__112773 = this_sym112768__112772;
    return coll__112773.cljs$core$ILookup$_lookup$arity$3(coll__112773, k, not_found)
  };
  G__112787 = function(this_sym112768, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112787__2.call(this, this_sym112768, k);
      case 3:
        return G__112787__3.call(this, this_sym112768, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112787
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym112759, args112760) {
  var this__112774 = this;
  return this_sym112759.call.apply(this_sym112759, [this_sym112759].concat(args112760.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__112775 = this;
  return new cljs.core.PersistentHashSet(this__112775.meta, cljs.core.assoc.call(null, this__112775.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__112776 = this;
  var this__112777 = this;
  return cljs.core.pr_str.call(null, this__112777)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__112778 = this;
  return cljs.core.keys.call(null, this__112778.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__112779 = this;
  return new cljs.core.PersistentHashSet(this__112779.meta, cljs.core.dissoc.call(null, this__112779.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__112780 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112781 = this;
  var and__3822__auto____112782 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____112782) {
    var and__3822__auto____112783 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____112783) {
      return cljs.core.every_QMARK_.call(null, function(p1__112758_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__112758_SHARP_)
      }, other)
    }else {
      return and__3822__auto____112783
    }
  }else {
    return and__3822__auto____112782
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112784 = this;
  return new cljs.core.PersistentHashSet(meta, this__112784.hash_map, this__112784.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112785 = this;
  return this__112785.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__112786 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__112786.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__112788 = cljs.core.count.call(null, items);
  var i__112789 = 0;
  var out__112790 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__112789 < len__112788) {
      var G__112791 = i__112789 + 1;
      var G__112792 = cljs.core.conj_BANG_.call(null, out__112790, items[i__112789]);
      i__112789 = G__112791;
      out__112790 = G__112792;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__112790)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__112810 = null;
  var G__112810__2 = function(this_sym112796, k) {
    var this__112798 = this;
    var this_sym112796__112799 = this;
    var tcoll__112800 = this_sym112796__112799;
    if(cljs.core._lookup.call(null, this__112798.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__112810__3 = function(this_sym112797, k, not_found) {
    var this__112798 = this;
    var this_sym112797__112801 = this;
    var tcoll__112802 = this_sym112797__112801;
    if(cljs.core._lookup.call(null, this__112798.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__112810 = function(this_sym112797, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112810__2.call(this, this_sym112797, k);
      case 3:
        return G__112810__3.call(this, this_sym112797, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112810
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym112794, args112795) {
  var this__112803 = this;
  return this_sym112794.call.apply(this_sym112794, [this_sym112794].concat(args112795.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__112804 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__112805 = this;
  if(cljs.core._lookup.call(null, this__112805.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__112806 = this;
  return cljs.core.count.call(null, this__112806.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__112807 = this;
  this__112807.transient_map = cljs.core.dissoc_BANG_.call(null, this__112807.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__112808 = this;
  this__112808.transient_map = cljs.core.assoc_BANG_.call(null, this__112808.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__112809 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__112809.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__112813 = this;
  var h__2192__auto____112814 = this__112813.__hash;
  if(!(h__2192__auto____112814 == null)) {
    return h__2192__auto____112814
  }else {
    var h__2192__auto____112815 = cljs.core.hash_iset.call(null, coll);
    this__112813.__hash = h__2192__auto____112815;
    return h__2192__auto____112815
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__112816 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__112817 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__112817.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__112843 = null;
  var G__112843__2 = function(this_sym112818, k) {
    var this__112820 = this;
    var this_sym112818__112821 = this;
    var coll__112822 = this_sym112818__112821;
    return coll__112822.cljs$core$ILookup$_lookup$arity$2(coll__112822, k)
  };
  var G__112843__3 = function(this_sym112819, k, not_found) {
    var this__112820 = this;
    var this_sym112819__112823 = this;
    var coll__112824 = this_sym112819__112823;
    return coll__112824.cljs$core$ILookup$_lookup$arity$3(coll__112824, k, not_found)
  };
  G__112843 = function(this_sym112819, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__112843__2.call(this, this_sym112819, k);
      case 3:
        return G__112843__3.call(this, this_sym112819, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__112843
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym112811, args112812) {
  var this__112825 = this;
  return this_sym112811.call.apply(this_sym112811, [this_sym112811].concat(args112812.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__112826 = this;
  return new cljs.core.PersistentTreeSet(this__112826.meta, cljs.core.assoc.call(null, this__112826.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__112827 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__112827.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__112828 = this;
  var this__112829 = this;
  return cljs.core.pr_str.call(null, this__112829)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__112830 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__112830.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__112831 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__112831.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__112832 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__112833 = this;
  return cljs.core._comparator.call(null, this__112833.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__112834 = this;
  return cljs.core.keys.call(null, this__112834.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__112835 = this;
  return new cljs.core.PersistentTreeSet(this__112835.meta, cljs.core.dissoc.call(null, this__112835.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__112836 = this;
  return cljs.core.count.call(null, this__112836.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__112837 = this;
  var and__3822__auto____112838 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____112838) {
    var and__3822__auto____112839 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____112839) {
      return cljs.core.every_QMARK_.call(null, function(p1__112793_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__112793_SHARP_)
      }, other)
    }else {
      return and__3822__auto____112839
    }
  }else {
    return and__3822__auto____112838
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__112840 = this;
  return new cljs.core.PersistentTreeSet(meta, this__112840.tree_map, this__112840.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__112841 = this;
  return this__112841.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__112842 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__112842.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__112848__delegate = function(keys) {
      var in__112846 = cljs.core.seq.call(null, keys);
      var out__112847 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__112846)) {
          var G__112849 = cljs.core.next.call(null, in__112846);
          var G__112850 = cljs.core.conj_BANG_.call(null, out__112847, cljs.core.first.call(null, in__112846));
          in__112846 = G__112849;
          out__112847 = G__112850;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__112847)
        }
        break
      }
    };
    var G__112848 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__112848__delegate.call(this, keys)
    };
    G__112848.cljs$lang$maxFixedArity = 0;
    G__112848.cljs$lang$applyTo = function(arglist__112851) {
      var keys = cljs.core.seq(arglist__112851);
      return G__112848__delegate(keys)
    };
    G__112848.cljs$lang$arity$variadic = G__112848__delegate;
    return G__112848
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__112852) {
    var keys = cljs.core.seq(arglist__112852);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__112854) {
    var comparator = cljs.core.first(arglist__112854);
    var keys = cljs.core.rest(arglist__112854);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__112860 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____112861 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____112861)) {
        var e__112862 = temp__3971__auto____112861;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__112862))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__112860, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__112853_SHARP_) {
      var temp__3971__auto____112863 = cljs.core.find.call(null, smap, p1__112853_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____112863)) {
        var e__112864 = temp__3971__auto____112863;
        return cljs.core.second.call(null, e__112864)
      }else {
        return p1__112853_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__112894 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__112887, seen) {
        while(true) {
          var vec__112888__112889 = p__112887;
          var f__112890 = cljs.core.nth.call(null, vec__112888__112889, 0, null);
          var xs__112891 = vec__112888__112889;
          var temp__3974__auto____112892 = cljs.core.seq.call(null, xs__112891);
          if(temp__3974__auto____112892) {
            var s__112893 = temp__3974__auto____112892;
            if(cljs.core.contains_QMARK_.call(null, seen, f__112890)) {
              var G__112895 = cljs.core.rest.call(null, s__112893);
              var G__112896 = seen;
              p__112887 = G__112895;
              seen = G__112896;
              continue
            }else {
              return cljs.core.cons.call(null, f__112890, step.call(null, cljs.core.rest.call(null, s__112893), cljs.core.conj.call(null, seen, f__112890)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__112894.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__112899 = cljs.core.PersistentVector.EMPTY;
  var s__112900 = s;
  while(true) {
    if(cljs.core.next.call(null, s__112900)) {
      var G__112901 = cljs.core.conj.call(null, ret__112899, cljs.core.first.call(null, s__112900));
      var G__112902 = cljs.core.next.call(null, s__112900);
      ret__112899 = G__112901;
      s__112900 = G__112902;
      continue
    }else {
      return cljs.core.seq.call(null, ret__112899)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____112905 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____112905) {
        return or__3824__auto____112905
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__112906 = x.lastIndexOf("/");
      if(i__112906 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__112906 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____112909 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____112909) {
      return or__3824__auto____112909
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__112910 = x.lastIndexOf("/");
    if(i__112910 > -1) {
      return cljs.core.subs.call(null, x, 2, i__112910)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__112917 = cljs.core.ObjMap.EMPTY;
  var ks__112918 = cljs.core.seq.call(null, keys);
  var vs__112919 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____112920 = ks__112918;
      if(and__3822__auto____112920) {
        return vs__112919
      }else {
        return and__3822__auto____112920
      }
    }()) {
      var G__112921 = cljs.core.assoc.call(null, map__112917, cljs.core.first.call(null, ks__112918), cljs.core.first.call(null, vs__112919));
      var G__112922 = cljs.core.next.call(null, ks__112918);
      var G__112923 = cljs.core.next.call(null, vs__112919);
      map__112917 = G__112921;
      ks__112918 = G__112922;
      vs__112919 = G__112923;
      continue
    }else {
      return map__112917
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__112926__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__112911_SHARP_, p2__112912_SHARP_) {
        return max_key.call(null, k, p1__112911_SHARP_, p2__112912_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__112926 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__112926__delegate.call(this, k, x, y, more)
    };
    G__112926.cljs$lang$maxFixedArity = 3;
    G__112926.cljs$lang$applyTo = function(arglist__112927) {
      var k = cljs.core.first(arglist__112927);
      var x = cljs.core.first(cljs.core.next(arglist__112927));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__112927)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__112927)));
      return G__112926__delegate(k, x, y, more)
    };
    G__112926.cljs$lang$arity$variadic = G__112926__delegate;
    return G__112926
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__112928__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__112924_SHARP_, p2__112925_SHARP_) {
        return min_key.call(null, k, p1__112924_SHARP_, p2__112925_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__112928 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__112928__delegate.call(this, k, x, y, more)
    };
    G__112928.cljs$lang$maxFixedArity = 3;
    G__112928.cljs$lang$applyTo = function(arglist__112929) {
      var k = cljs.core.first(arglist__112929);
      var x = cljs.core.first(cljs.core.next(arglist__112929));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__112929)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__112929)));
      return G__112928__delegate(k, x, y, more)
    };
    G__112928.cljs$lang$arity$variadic = G__112928__delegate;
    return G__112928
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____112932 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____112932) {
        var s__112933 = temp__3974__auto____112932;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__112933), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__112933)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____112936 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____112936) {
      var s__112937 = temp__3974__auto____112936;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__112937)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__112937), take_while.call(null, pred, cljs.core.rest.call(null, s__112937)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__112939 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__112939.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__112951 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____112952 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____112952)) {
        var vec__112953__112954 = temp__3974__auto____112952;
        var e__112955 = cljs.core.nth.call(null, vec__112953__112954, 0, null);
        var s__112956 = vec__112953__112954;
        if(cljs.core.truth_(include__112951.call(null, e__112955))) {
          return s__112956
        }else {
          return cljs.core.next.call(null, s__112956)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__112951, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____112957 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____112957)) {
      var vec__112958__112959 = temp__3974__auto____112957;
      var e__112960 = cljs.core.nth.call(null, vec__112958__112959, 0, null);
      var s__112961 = vec__112958__112959;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__112960)) ? s__112961 : cljs.core.next.call(null, s__112961))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__112973 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____112974 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____112974)) {
        var vec__112975__112976 = temp__3974__auto____112974;
        var e__112977 = cljs.core.nth.call(null, vec__112975__112976, 0, null);
        var s__112978 = vec__112975__112976;
        if(cljs.core.truth_(include__112973.call(null, e__112977))) {
          return s__112978
        }else {
          return cljs.core.next.call(null, s__112978)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__112973, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____112979 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____112979)) {
      var vec__112980__112981 = temp__3974__auto____112979;
      var e__112982 = cljs.core.nth.call(null, vec__112980__112981, 0, null);
      var s__112983 = vec__112980__112981;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__112982)) ? s__112983 : cljs.core.next.call(null, s__112983))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__112984 = this;
  var h__2192__auto____112985 = this__112984.__hash;
  if(!(h__2192__auto____112985 == null)) {
    return h__2192__auto____112985
  }else {
    var h__2192__auto____112986 = cljs.core.hash_coll.call(null, rng);
    this__112984.__hash = h__2192__auto____112986;
    return h__2192__auto____112986
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__112987 = this;
  if(this__112987.step > 0) {
    if(this__112987.start + this__112987.step < this__112987.end) {
      return new cljs.core.Range(this__112987.meta, this__112987.start + this__112987.step, this__112987.end, this__112987.step, null)
    }else {
      return null
    }
  }else {
    if(this__112987.start + this__112987.step > this__112987.end) {
      return new cljs.core.Range(this__112987.meta, this__112987.start + this__112987.step, this__112987.end, this__112987.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__112988 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__112989 = this;
  var this__112990 = this;
  return cljs.core.pr_str.call(null, this__112990)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__112991 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__112992 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__112993 = this;
  if(this__112993.step > 0) {
    if(this__112993.start < this__112993.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__112993.start > this__112993.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__112994 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__112994.end - this__112994.start) / this__112994.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__112995 = this;
  return this__112995.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__112996 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__112996.meta, this__112996.start + this__112996.step, this__112996.end, this__112996.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__112997 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__112998 = this;
  return new cljs.core.Range(meta, this__112998.start, this__112998.end, this__112998.step, this__112998.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__112999 = this;
  return this__112999.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__113000 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__113000.start + n * this__113000.step
  }else {
    if(function() {
      var and__3822__auto____113001 = this__113000.start > this__113000.end;
      if(and__3822__auto____113001) {
        return this__113000.step === 0
      }else {
        return and__3822__auto____113001
      }
    }()) {
      return this__113000.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__113002 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__113002.start + n * this__113002.step
  }else {
    if(function() {
      var and__3822__auto____113003 = this__113002.start > this__113002.end;
      if(and__3822__auto____113003) {
        return this__113002.step === 0
      }else {
        return and__3822__auto____113003
      }
    }()) {
      return this__113002.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__113004 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__113004.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____113007 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____113007) {
      var s__113008 = temp__3974__auto____113007;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__113008), take_nth.call(null, n, cljs.core.drop.call(null, n, s__113008)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____113015 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____113015) {
      var s__113016 = temp__3974__auto____113015;
      var fst__113017 = cljs.core.first.call(null, s__113016);
      var fv__113018 = f.call(null, fst__113017);
      var run__113019 = cljs.core.cons.call(null, fst__113017, cljs.core.take_while.call(null, function(p1__113009_SHARP_) {
        return cljs.core._EQ_.call(null, fv__113018, f.call(null, p1__113009_SHARP_))
      }, cljs.core.next.call(null, s__113016)));
      return cljs.core.cons.call(null, run__113019, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__113019), s__113016))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____113034 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____113034) {
        var s__113035 = temp__3971__auto____113034;
        return reductions.call(null, f, cljs.core.first.call(null, s__113035), cljs.core.rest.call(null, s__113035))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____113036 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____113036) {
        var s__113037 = temp__3974__auto____113036;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__113037)), cljs.core.rest.call(null, s__113037))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__113040 = null;
      var G__113040__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__113040__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__113040__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__113040__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__113040__4 = function() {
        var G__113041__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__113041 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__113041__delegate.call(this, x, y, z, args)
        };
        G__113041.cljs$lang$maxFixedArity = 3;
        G__113041.cljs$lang$applyTo = function(arglist__113042) {
          var x = cljs.core.first(arglist__113042);
          var y = cljs.core.first(cljs.core.next(arglist__113042));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__113042)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__113042)));
          return G__113041__delegate(x, y, z, args)
        };
        G__113041.cljs$lang$arity$variadic = G__113041__delegate;
        return G__113041
      }();
      G__113040 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__113040__0.call(this);
          case 1:
            return G__113040__1.call(this, x);
          case 2:
            return G__113040__2.call(this, x, y);
          case 3:
            return G__113040__3.call(this, x, y, z);
          default:
            return G__113040__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__113040.cljs$lang$maxFixedArity = 3;
      G__113040.cljs$lang$applyTo = G__113040__4.cljs$lang$applyTo;
      return G__113040
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__113043 = null;
      var G__113043__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__113043__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__113043__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__113043__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__113043__4 = function() {
        var G__113044__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__113044 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__113044__delegate.call(this, x, y, z, args)
        };
        G__113044.cljs$lang$maxFixedArity = 3;
        G__113044.cljs$lang$applyTo = function(arglist__113045) {
          var x = cljs.core.first(arglist__113045);
          var y = cljs.core.first(cljs.core.next(arglist__113045));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__113045)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__113045)));
          return G__113044__delegate(x, y, z, args)
        };
        G__113044.cljs$lang$arity$variadic = G__113044__delegate;
        return G__113044
      }();
      G__113043 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__113043__0.call(this);
          case 1:
            return G__113043__1.call(this, x);
          case 2:
            return G__113043__2.call(this, x, y);
          case 3:
            return G__113043__3.call(this, x, y, z);
          default:
            return G__113043__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__113043.cljs$lang$maxFixedArity = 3;
      G__113043.cljs$lang$applyTo = G__113043__4.cljs$lang$applyTo;
      return G__113043
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__113046 = null;
      var G__113046__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__113046__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__113046__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__113046__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__113046__4 = function() {
        var G__113047__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__113047 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__113047__delegate.call(this, x, y, z, args)
        };
        G__113047.cljs$lang$maxFixedArity = 3;
        G__113047.cljs$lang$applyTo = function(arglist__113048) {
          var x = cljs.core.first(arglist__113048);
          var y = cljs.core.first(cljs.core.next(arglist__113048));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__113048)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__113048)));
          return G__113047__delegate(x, y, z, args)
        };
        G__113047.cljs$lang$arity$variadic = G__113047__delegate;
        return G__113047
      }();
      G__113046 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__113046__0.call(this);
          case 1:
            return G__113046__1.call(this, x);
          case 2:
            return G__113046__2.call(this, x, y);
          case 3:
            return G__113046__3.call(this, x, y, z);
          default:
            return G__113046__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__113046.cljs$lang$maxFixedArity = 3;
      G__113046.cljs$lang$applyTo = G__113046__4.cljs$lang$applyTo;
      return G__113046
    }()
  };
  var juxt__4 = function() {
    var G__113049__delegate = function(f, g, h, fs) {
      var fs__113039 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__113050 = null;
        var G__113050__0 = function() {
          return cljs.core.reduce.call(null, function(p1__113020_SHARP_, p2__113021_SHARP_) {
            return cljs.core.conj.call(null, p1__113020_SHARP_, p2__113021_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__113039)
        };
        var G__113050__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__113022_SHARP_, p2__113023_SHARP_) {
            return cljs.core.conj.call(null, p1__113022_SHARP_, p2__113023_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__113039)
        };
        var G__113050__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__113024_SHARP_, p2__113025_SHARP_) {
            return cljs.core.conj.call(null, p1__113024_SHARP_, p2__113025_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__113039)
        };
        var G__113050__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__113026_SHARP_, p2__113027_SHARP_) {
            return cljs.core.conj.call(null, p1__113026_SHARP_, p2__113027_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__113039)
        };
        var G__113050__4 = function() {
          var G__113051__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__113028_SHARP_, p2__113029_SHARP_) {
              return cljs.core.conj.call(null, p1__113028_SHARP_, cljs.core.apply.call(null, p2__113029_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__113039)
          };
          var G__113051 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__113051__delegate.call(this, x, y, z, args)
          };
          G__113051.cljs$lang$maxFixedArity = 3;
          G__113051.cljs$lang$applyTo = function(arglist__113052) {
            var x = cljs.core.first(arglist__113052);
            var y = cljs.core.first(cljs.core.next(arglist__113052));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__113052)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__113052)));
            return G__113051__delegate(x, y, z, args)
          };
          G__113051.cljs$lang$arity$variadic = G__113051__delegate;
          return G__113051
        }();
        G__113050 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__113050__0.call(this);
            case 1:
              return G__113050__1.call(this, x);
            case 2:
              return G__113050__2.call(this, x, y);
            case 3:
              return G__113050__3.call(this, x, y, z);
            default:
              return G__113050__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__113050.cljs$lang$maxFixedArity = 3;
        G__113050.cljs$lang$applyTo = G__113050__4.cljs$lang$applyTo;
        return G__113050
      }()
    };
    var G__113049 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__113049__delegate.call(this, f, g, h, fs)
    };
    G__113049.cljs$lang$maxFixedArity = 3;
    G__113049.cljs$lang$applyTo = function(arglist__113053) {
      var f = cljs.core.first(arglist__113053);
      var g = cljs.core.first(cljs.core.next(arglist__113053));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__113053)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__113053)));
      return G__113049__delegate(f, g, h, fs)
    };
    G__113049.cljs$lang$arity$variadic = G__113049__delegate;
    return G__113049
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__113056 = cljs.core.next.call(null, coll);
        coll = G__113056;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____113055 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____113055) {
          return n > 0
        }else {
          return and__3822__auto____113055
        }
      }())) {
        var G__113057 = n - 1;
        var G__113058 = cljs.core.next.call(null, coll);
        n = G__113057;
        coll = G__113058;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__113060 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__113060), s)) {
    if(cljs.core.count.call(null, matches__113060) === 1) {
      return cljs.core.first.call(null, matches__113060)
    }else {
      return cljs.core.vec.call(null, matches__113060)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__113062 = re.exec(s);
  if(matches__113062 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__113062) === 1) {
      return cljs.core.first.call(null, matches__113062)
    }else {
      return cljs.core.vec.call(null, matches__113062)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__113067 = cljs.core.re_find.call(null, re, s);
  var match_idx__113068 = s.search(re);
  var match_str__113069 = cljs.core.coll_QMARK_.call(null, match_data__113067) ? cljs.core.first.call(null, match_data__113067) : match_data__113067;
  var post_match__113070 = cljs.core.subs.call(null, s, match_idx__113068 + cljs.core.count.call(null, match_str__113069));
  if(cljs.core.truth_(match_data__113067)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__113067, re_seq.call(null, re, post_match__113070))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__113077__113078 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___113079 = cljs.core.nth.call(null, vec__113077__113078, 0, null);
  var flags__113080 = cljs.core.nth.call(null, vec__113077__113078, 1, null);
  var pattern__113081 = cljs.core.nth.call(null, vec__113077__113078, 2, null);
  return new RegExp(pattern__113081, flags__113080)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__113071_SHARP_) {
    return print_one.call(null, p1__113071_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____113091 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____113091)) {
            var and__3822__auto____113095 = function() {
              var G__113092__113093 = obj;
              if(G__113092__113093) {
                if(function() {
                  var or__3824__auto____113094 = G__113092__113093.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____113094) {
                    return or__3824__auto____113094
                  }else {
                    return G__113092__113093.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__113092__113093.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__113092__113093)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__113092__113093)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____113095)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____113095
            }
          }else {
            return and__3822__auto____113091
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____113096 = !(obj == null);
          if(and__3822__auto____113096) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____113096
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__113097__113098 = obj;
          if(G__113097__113098) {
            if(function() {
              var or__3824__auto____113099 = G__113097__113098.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____113099) {
                return or__3824__auto____113099
              }else {
                return G__113097__113098.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__113097__113098.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__113097__113098)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__113097__113098)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__113119 = new goog.string.StringBuffer;
  var G__113120__113121 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__113120__113121) {
    var string__113122 = cljs.core.first.call(null, G__113120__113121);
    var G__113120__113123 = G__113120__113121;
    while(true) {
      sb__113119.append(string__113122);
      var temp__3974__auto____113124 = cljs.core.next.call(null, G__113120__113123);
      if(temp__3974__auto____113124) {
        var G__113120__113125 = temp__3974__auto____113124;
        var G__113138 = cljs.core.first.call(null, G__113120__113125);
        var G__113139 = G__113120__113125;
        string__113122 = G__113138;
        G__113120__113123 = G__113139;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__113126__113127 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__113126__113127) {
    var obj__113128 = cljs.core.first.call(null, G__113126__113127);
    var G__113126__113129 = G__113126__113127;
    while(true) {
      sb__113119.append(" ");
      var G__113130__113131 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__113128, opts));
      if(G__113130__113131) {
        var string__113132 = cljs.core.first.call(null, G__113130__113131);
        var G__113130__113133 = G__113130__113131;
        while(true) {
          sb__113119.append(string__113132);
          var temp__3974__auto____113134 = cljs.core.next.call(null, G__113130__113133);
          if(temp__3974__auto____113134) {
            var G__113130__113135 = temp__3974__auto____113134;
            var G__113140 = cljs.core.first.call(null, G__113130__113135);
            var G__113141 = G__113130__113135;
            string__113132 = G__113140;
            G__113130__113133 = G__113141;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____113136 = cljs.core.next.call(null, G__113126__113129);
      if(temp__3974__auto____113136) {
        var G__113126__113137 = temp__3974__auto____113136;
        var G__113142 = cljs.core.first.call(null, G__113126__113137);
        var G__113143 = G__113126__113137;
        obj__113128 = G__113142;
        G__113126__113129 = G__113143;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__113119
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__113145 = cljs.core.pr_sb.call(null, objs, opts);
  sb__113145.append("\n");
  return[cljs.core.str(sb__113145)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__113164__113165 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__113164__113165) {
    var string__113166 = cljs.core.first.call(null, G__113164__113165);
    var G__113164__113167 = G__113164__113165;
    while(true) {
      cljs.core.string_print.call(null, string__113166);
      var temp__3974__auto____113168 = cljs.core.next.call(null, G__113164__113167);
      if(temp__3974__auto____113168) {
        var G__113164__113169 = temp__3974__auto____113168;
        var G__113182 = cljs.core.first.call(null, G__113164__113169);
        var G__113183 = G__113164__113169;
        string__113166 = G__113182;
        G__113164__113167 = G__113183;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__113170__113171 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__113170__113171) {
    var obj__113172 = cljs.core.first.call(null, G__113170__113171);
    var G__113170__113173 = G__113170__113171;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__113174__113175 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__113172, opts));
      if(G__113174__113175) {
        var string__113176 = cljs.core.first.call(null, G__113174__113175);
        var G__113174__113177 = G__113174__113175;
        while(true) {
          cljs.core.string_print.call(null, string__113176);
          var temp__3974__auto____113178 = cljs.core.next.call(null, G__113174__113177);
          if(temp__3974__auto____113178) {
            var G__113174__113179 = temp__3974__auto____113178;
            var G__113184 = cljs.core.first.call(null, G__113174__113179);
            var G__113185 = G__113174__113179;
            string__113176 = G__113184;
            G__113174__113177 = G__113185;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____113180 = cljs.core.next.call(null, G__113170__113173);
      if(temp__3974__auto____113180) {
        var G__113170__113181 = temp__3974__auto____113180;
        var G__113186 = cljs.core.first.call(null, G__113170__113181);
        var G__113187 = G__113170__113181;
        obj__113172 = G__113186;
        G__113170__113173 = G__113187;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__113188) {
    var objs = cljs.core.seq(arglist__113188);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__113189) {
    var objs = cljs.core.seq(arglist__113189);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__113190) {
    var objs = cljs.core.seq(arglist__113190);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__113191) {
    var objs = cljs.core.seq(arglist__113191);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__113192) {
    var objs = cljs.core.seq(arglist__113192);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__113193) {
    var objs = cljs.core.seq(arglist__113193);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__113194) {
    var objs = cljs.core.seq(arglist__113194);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__113195) {
    var objs = cljs.core.seq(arglist__113195);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__113196) {
    var fmt = cljs.core.first(arglist__113196);
    var args = cljs.core.rest(arglist__113196);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__113197 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__113197, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__113198 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__113198, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__113199 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__113199, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____113200 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____113200)) {
        var nspc__113201 = temp__3974__auto____113200;
        return[cljs.core.str(nspc__113201), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____113202 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____113202)) {
          var nspc__113203 = temp__3974__auto____113202;
          return[cljs.core.str(nspc__113203), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__113204 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__113204, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__113206 = function(n, len) {
    var ns__113205 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__113205) < len) {
        var G__113208 = [cljs.core.str("0"), cljs.core.str(ns__113205)].join("");
        ns__113205 = G__113208;
        continue
      }else {
        return ns__113205
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__113206.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__113206.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__113206.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__113206.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__113206.call(null, 
  d.getUTCSeconds(), 2)), cljs.core.str("."), cljs.core.str(normalize__113206.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__113207 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__113207, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__113209 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__113210 = this;
  var G__113211__113212 = cljs.core.seq.call(null, this__113210.watches);
  if(G__113211__113212) {
    var G__113214__113216 = cljs.core.first.call(null, G__113211__113212);
    var vec__113215__113217 = G__113214__113216;
    var key__113218 = cljs.core.nth.call(null, vec__113215__113217, 0, null);
    var f__113219 = cljs.core.nth.call(null, vec__113215__113217, 1, null);
    var G__113211__113220 = G__113211__113212;
    var G__113214__113221 = G__113214__113216;
    var G__113211__113222 = G__113211__113220;
    while(true) {
      var vec__113223__113224 = G__113214__113221;
      var key__113225 = cljs.core.nth.call(null, vec__113223__113224, 0, null);
      var f__113226 = cljs.core.nth.call(null, vec__113223__113224, 1, null);
      var G__113211__113227 = G__113211__113222;
      f__113226.call(null, key__113225, this$, oldval, newval);
      var temp__3974__auto____113228 = cljs.core.next.call(null, G__113211__113227);
      if(temp__3974__auto____113228) {
        var G__113211__113229 = temp__3974__auto____113228;
        var G__113236 = cljs.core.first.call(null, G__113211__113229);
        var G__113237 = G__113211__113229;
        G__113214__113221 = G__113236;
        G__113211__113222 = G__113237;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__113230 = this;
  return this$.watches = cljs.core.assoc.call(null, this__113230.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__113231 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__113231.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__113232 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__113232.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__113233 = this;
  return this__113233.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__113234 = this;
  return this__113234.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__113235 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__113249__delegate = function(x, p__113238) {
      var map__113244__113245 = p__113238;
      var map__113244__113246 = cljs.core.seq_QMARK_.call(null, map__113244__113245) ? cljs.core.apply.call(null, cljs.core.hash_map, map__113244__113245) : map__113244__113245;
      var validator__113247 = cljs.core._lookup.call(null, map__113244__113246, "\ufdd0'validator", null);
      var meta__113248 = cljs.core._lookup.call(null, map__113244__113246, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__113248, validator__113247, null)
    };
    var G__113249 = function(x, var_args) {
      var p__113238 = null;
      if(goog.isDef(var_args)) {
        p__113238 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__113249__delegate.call(this, x, p__113238)
    };
    G__113249.cljs$lang$maxFixedArity = 1;
    G__113249.cljs$lang$applyTo = function(arglist__113250) {
      var x = cljs.core.first(arglist__113250);
      var p__113238 = cljs.core.rest(arglist__113250);
      return G__113249__delegate(x, p__113238)
    };
    G__113249.cljs$lang$arity$variadic = G__113249__delegate;
    return G__113249
  }();
  atom = function(x, var_args) {
    var p__113238 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____113254 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____113254)) {
    var validate__113255 = temp__3974__auto____113254;
    if(cljs.core.truth_(validate__113255.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__113256 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__113256, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__113257__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__113257 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__113257__delegate.call(this, a, f, x, y, z, more)
    };
    G__113257.cljs$lang$maxFixedArity = 5;
    G__113257.cljs$lang$applyTo = function(arglist__113258) {
      var a = cljs.core.first(arglist__113258);
      var f = cljs.core.first(cljs.core.next(arglist__113258));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__113258)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__113258))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__113258)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__113258)))));
      return G__113257__delegate(a, f, x, y, z, more)
    };
    G__113257.cljs$lang$arity$variadic = G__113257__delegate;
    return G__113257
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__113259) {
    var iref = cljs.core.first(arglist__113259);
    var f = cljs.core.first(cljs.core.next(arglist__113259));
    var args = cljs.core.rest(cljs.core.next(arglist__113259));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__113260 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__113260.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__113261 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__113261.state, function(p__113262) {
    var map__113263__113264 = p__113262;
    var map__113263__113265 = cljs.core.seq_QMARK_.call(null, map__113263__113264) ? cljs.core.apply.call(null, cljs.core.hash_map, map__113263__113264) : map__113263__113264;
    var curr_state__113266 = map__113263__113265;
    var done__113267 = cljs.core._lookup.call(null, map__113263__113265, "\ufdd0'done", null);
    if(cljs.core.truth_(done__113267)) {
      return curr_state__113266
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__113261.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__113288__113289 = options;
    var map__113288__113290 = cljs.core.seq_QMARK_.call(null, map__113288__113289) ? cljs.core.apply.call(null, cljs.core.hash_map, map__113288__113289) : map__113288__113289;
    var keywordize_keys__113291 = cljs.core._lookup.call(null, map__113288__113290, "\ufdd0'keywordize-keys", null);
    var keyfn__113292 = cljs.core.truth_(keywordize_keys__113291) ? cljs.core.keyword : cljs.core.str;
    var f__113307 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2462__auto____113306 = function iter__113300(s__113301) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__113301__113304 = s__113301;
                    while(true) {
                      if(cljs.core.seq.call(null, s__113301__113304)) {
                        var k__113305 = cljs.core.first.call(null, s__113301__113304);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__113292.call(null, k__113305), thisfn.call(null, x[k__113305])], true), iter__113300.call(null, cljs.core.rest.call(null, s__113301__113304)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____113306.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__113307.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__113308) {
    var x = cljs.core.first(arglist__113308);
    var options = cljs.core.rest(arglist__113308);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__113313 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__113317__delegate = function(args) {
      var temp__3971__auto____113314 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__113313), args, null);
      if(cljs.core.truth_(temp__3971__auto____113314)) {
        var v__113315 = temp__3971__auto____113314;
        return v__113315
      }else {
        var ret__113316 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__113313, cljs.core.assoc, args, ret__113316);
        return ret__113316
      }
    };
    var G__113317 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__113317__delegate.call(this, args)
    };
    G__113317.cljs$lang$maxFixedArity = 0;
    G__113317.cljs$lang$applyTo = function(arglist__113318) {
      var args = cljs.core.seq(arglist__113318);
      return G__113317__delegate(args)
    };
    G__113317.cljs$lang$arity$variadic = G__113317__delegate;
    return G__113317
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__113320 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__113320)) {
        var G__113321 = ret__113320;
        f = G__113321;
        continue
      }else {
        return ret__113320
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__113322__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__113322 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__113322__delegate.call(this, f, args)
    };
    G__113322.cljs$lang$maxFixedArity = 1;
    G__113322.cljs$lang$applyTo = function(arglist__113323) {
      var f = cljs.core.first(arglist__113323);
      var args = cljs.core.rest(arglist__113323);
      return G__113322__delegate(f, args)
    };
    G__113322.cljs$lang$arity$variadic = G__113322__delegate;
    return G__113322
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__113325 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__113325, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__113325, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____113334 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____113334) {
      return or__3824__auto____113334
    }else {
      var or__3824__auto____113335 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____113335) {
        return or__3824__auto____113335
      }else {
        var and__3822__auto____113336 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____113336) {
          var and__3822__auto____113337 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____113337) {
            var and__3822__auto____113338 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____113338) {
              var ret__113339 = true;
              var i__113340 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____113341 = cljs.core.not.call(null, ret__113339);
                  if(or__3824__auto____113341) {
                    return or__3824__auto____113341
                  }else {
                    return i__113340 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__113339
                }else {
                  var G__113342 = isa_QMARK_.call(null, h, child.call(null, i__113340), parent.call(null, i__113340));
                  var G__113343 = i__113340 + 1;
                  ret__113339 = G__113342;
                  i__113340 = G__113343;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____113338
            }
          }else {
            return and__3822__auto____113337
          }
        }else {
          return and__3822__auto____113336
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__113352 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__113353 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__113354 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__113355 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____113356 = cljs.core.contains_QMARK_.call(null, tp__113352.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__113354.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__113354.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__113352, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__113355.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__113353, parent, ta__113354), "\ufdd0'descendants":tf__113355.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__113354, tag, td__113353)})
    }();
    if(cljs.core.truth_(or__3824__auto____113356)) {
      return or__3824__auto____113356
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__113361 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__113362 = cljs.core.truth_(parentMap__113361.call(null, tag)) ? cljs.core.disj.call(null, parentMap__113361.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__113363 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__113362)) ? cljs.core.assoc.call(null, parentMap__113361, tag, childsParents__113362) : cljs.core.dissoc.call(null, parentMap__113361, tag);
    var deriv_seq__113364 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__113344_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__113344_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__113344_SHARP_), cljs.core.second.call(null, p1__113344_SHARP_)))
    }, cljs.core.seq.call(null, newParents__113363)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__113361.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__113345_SHARP_, p2__113346_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__113345_SHARP_, p2__113346_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__113364))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__113372 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____113374 = cljs.core.truth_(function() {
    var and__3822__auto____113373 = xprefs__113372;
    if(cljs.core.truth_(and__3822__auto____113373)) {
      return xprefs__113372.call(null, y)
    }else {
      return and__3822__auto____113373
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____113374)) {
    return or__3824__auto____113374
  }else {
    var or__3824__auto____113376 = function() {
      var ps__113375 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__113375) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__113375), prefer_table))) {
          }else {
          }
          var G__113379 = cljs.core.rest.call(null, ps__113375);
          ps__113375 = G__113379;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____113376)) {
      return or__3824__auto____113376
    }else {
      var or__3824__auto____113378 = function() {
        var ps__113377 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__113377) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__113377), y, prefer_table))) {
            }else {
            }
            var G__113380 = cljs.core.rest.call(null, ps__113377);
            ps__113377 = G__113380;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____113378)) {
        return or__3824__auto____113378
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____113382 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____113382)) {
    return or__3824__auto____113382
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__113400 = cljs.core.reduce.call(null, function(be, p__113392) {
    var vec__113393__113394 = p__113392;
    var k__113395 = cljs.core.nth.call(null, vec__113393__113394, 0, null);
    var ___113396 = cljs.core.nth.call(null, vec__113393__113394, 1, null);
    var e__113397 = vec__113393__113394;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__113395)) {
      var be2__113399 = cljs.core.truth_(function() {
        var or__3824__auto____113398 = be == null;
        if(or__3824__auto____113398) {
          return or__3824__auto____113398
        }else {
          return cljs.core.dominates.call(null, k__113395, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__113397 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__113399), k__113395, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__113395), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__113399)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__113399
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__113400)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__113400));
      return cljs.core.second.call(null, best_entry__113400)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____113405 = mf;
    if(and__3822__auto____113405) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____113405
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____113406 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____113407 = cljs.core._reset[goog.typeOf(x__2363__auto____113406)];
      if(or__3824__auto____113407) {
        return or__3824__auto____113407
      }else {
        var or__3824__auto____113408 = cljs.core._reset["_"];
        if(or__3824__auto____113408) {
          return or__3824__auto____113408
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____113413 = mf;
    if(and__3822__auto____113413) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____113413
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____113414 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____113415 = cljs.core._add_method[goog.typeOf(x__2363__auto____113414)];
      if(or__3824__auto____113415) {
        return or__3824__auto____113415
      }else {
        var or__3824__auto____113416 = cljs.core._add_method["_"];
        if(or__3824__auto____113416) {
          return or__3824__auto____113416
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____113421 = mf;
    if(and__3822__auto____113421) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____113421
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____113422 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____113423 = cljs.core._remove_method[goog.typeOf(x__2363__auto____113422)];
      if(or__3824__auto____113423) {
        return or__3824__auto____113423
      }else {
        var or__3824__auto____113424 = cljs.core._remove_method["_"];
        if(or__3824__auto____113424) {
          return or__3824__auto____113424
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____113429 = mf;
    if(and__3822__auto____113429) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____113429
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____113430 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____113431 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____113430)];
      if(or__3824__auto____113431) {
        return or__3824__auto____113431
      }else {
        var or__3824__auto____113432 = cljs.core._prefer_method["_"];
        if(or__3824__auto____113432) {
          return or__3824__auto____113432
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____113437 = mf;
    if(and__3822__auto____113437) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____113437
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____113438 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____113439 = cljs.core._get_method[goog.typeOf(x__2363__auto____113438)];
      if(or__3824__auto____113439) {
        return or__3824__auto____113439
      }else {
        var or__3824__auto____113440 = cljs.core._get_method["_"];
        if(or__3824__auto____113440) {
          return or__3824__auto____113440
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____113445 = mf;
    if(and__3822__auto____113445) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____113445
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____113446 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____113447 = cljs.core._methods[goog.typeOf(x__2363__auto____113446)];
      if(or__3824__auto____113447) {
        return or__3824__auto____113447
      }else {
        var or__3824__auto____113448 = cljs.core._methods["_"];
        if(or__3824__auto____113448) {
          return or__3824__auto____113448
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____113453 = mf;
    if(and__3822__auto____113453) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____113453
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____113454 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____113455 = cljs.core._prefers[goog.typeOf(x__2363__auto____113454)];
      if(or__3824__auto____113455) {
        return or__3824__auto____113455
      }else {
        var or__3824__auto____113456 = cljs.core._prefers["_"];
        if(or__3824__auto____113456) {
          return or__3824__auto____113456
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____113461 = mf;
    if(and__3822__auto____113461) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____113461
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____113462 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____113463 = cljs.core._dispatch[goog.typeOf(x__2363__auto____113462)];
      if(or__3824__auto____113463) {
        return or__3824__auto____113463
      }else {
        var or__3824__auto____113464 = cljs.core._dispatch["_"];
        if(or__3824__auto____113464) {
          return or__3824__auto____113464
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__113467 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__113468 = cljs.core._get_method.call(null, mf, dispatch_val__113467);
  if(cljs.core.truth_(target_fn__113468)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__113467)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__113468, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__113469 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__113470 = this;
  cljs.core.swap_BANG_.call(null, this__113470.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__113470.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__113470.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__113470.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__113471 = this;
  cljs.core.swap_BANG_.call(null, this__113471.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__113471.method_cache, this__113471.method_table, this__113471.cached_hierarchy, this__113471.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__113472 = this;
  cljs.core.swap_BANG_.call(null, this__113472.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__113472.method_cache, this__113472.method_table, this__113472.cached_hierarchy, this__113472.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__113473 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__113473.cached_hierarchy), cljs.core.deref.call(null, this__113473.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__113473.method_cache, this__113473.method_table, this__113473.cached_hierarchy, this__113473.hierarchy)
  }
  var temp__3971__auto____113474 = cljs.core.deref.call(null, this__113473.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____113474)) {
    var target_fn__113475 = temp__3971__auto____113474;
    return target_fn__113475
  }else {
    var temp__3971__auto____113476 = cljs.core.find_and_cache_best_method.call(null, this__113473.name, dispatch_val, this__113473.hierarchy, this__113473.method_table, this__113473.prefer_table, this__113473.method_cache, this__113473.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____113476)) {
      var target_fn__113477 = temp__3971__auto____113476;
      return target_fn__113477
    }else {
      return cljs.core.deref.call(null, this__113473.method_table).call(null, this__113473.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__113478 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__113478.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__113478.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__113478.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__113478.method_cache, this__113478.method_table, this__113478.cached_hierarchy, this__113478.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__113479 = this;
  return cljs.core.deref.call(null, this__113479.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__113480 = this;
  return cljs.core.deref.call(null, this__113480.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__113481 = this;
  return cljs.core.do_dispatch.call(null, mf, this__113481.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__113483__delegate = function(_, args) {
    var self__113482 = this;
    return cljs.core._dispatch.call(null, self__113482, args)
  };
  var G__113483 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__113483__delegate.call(this, _, args)
  };
  G__113483.cljs$lang$maxFixedArity = 1;
  G__113483.cljs$lang$applyTo = function(arglist__113484) {
    var _ = cljs.core.first(arglist__113484);
    var args = cljs.core.rest(arglist__113484);
    return G__113483__delegate(_, args)
  };
  G__113483.cljs$lang$arity$variadic = G__113483__delegate;
  return G__113483
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__113485 = this;
  return cljs.core._dispatch.call(null, self__113485, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__113486 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_113488, _) {
  var this__113487 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__113487.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__113489 = this;
  var and__3822__auto____113490 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____113490) {
    return this__113489.uuid === other.uuid
  }else {
    return and__3822__auto____113490
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__113491 = this;
  var this__113492 = this;
  return cljs.core.pr_str.call(null, this__113492)
};
cljs.core.UUID;
goog.provide("app");
goog.require("cljs.core");
app.jquery = $;
app.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__109548) {
          var vec__109549__109550 = p__109548;
          var k__109551 = cljs.core.nth.call(null, vec__109549__109550, 0, null);
          var v__109552 = cljs.core.nth.call(null, vec__109549__109550, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__109551), clj__GT_js.call(null, v__109552))
        }, cljs.core.ObjMap.EMPTY, x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
app.chart_options = app.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'chart", "\ufdd0'title", "\ufdd0'subtitle", "\ufdd0'xAxis", "\ufdd0'yAxis", "\ufdd0'legend", "\ufdd0'plotOptions", "\ufdd0'series"], {"\ufdd0'chart":cljs.core.ObjMap.fromObject(["\ufdd0'renderTo", "\ufdd0'type", "\ufdd0'zoomType"], {"\ufdd0'renderTo":"#mpw-graph", "\ufdd0'type":"scatter", "\ufdd0'zoomType":"xy"}), "\ufdd0'title":cljs.core.ObjMap.fromObject(["\ufdd0'text"], {"\ufdd0'text":"Height Versus Weight of 507 Individuals by Gender"}), 
"\ufdd0'subtitle":cljs.core.ObjMap.fromObject(["\ufdd0'text"], {"\ufdd0'text":"Source: Heinz  2003"}), "\ufdd0'xAxis":cljs.core.ObjMap.fromObject(["\ufdd0'title", "\ufdd0'startOnTick", "\ufdd0'endOnTick", "\ufdd0'showLastLabel"], {"\ufdd0'title":cljs.core.ObjMap.fromObject(["\ufdd0'enabled", "\ufdd0'text"], {"\ufdd0'enabled":true, "\ufdd0'text":"Height (cm)"}), "\ufdd0'startOnTick":true, "\ufdd0'endOnTick":true, "\ufdd0'showLastLabel":true}), "\ufdd0'yAxis":cljs.core.ObjMap.fromObject(["\ufdd0'title"], 
{"\ufdd0'title":cljs.core.ObjMap.fromObject(["\ufdd0'text"], {"\ufdd0'text":"Weight (kg)"})}), "\ufdd0'legend":cljs.core.ObjMap.fromObject(["\ufdd0'layout", "\ufdd0'align", "\ufdd0'verticalAlign", "\ufdd0'x", "\ufdd0'y", "\ufdd0'floating", "\ufdd0'backgroundColor", "\ufdd0'borderWidth"], {"\ufdd0'layout":"vertical", "\ufdd0'align":"left", "\ufdd0'verticalAlign":"top", "\ufdd0'x":100, "\ufdd0'y":70, "\ufdd0'floating":true, "\ufdd0'backgroundColor":"#FFFFFF", "\ufdd0'borderWidth":1}), "\ufdd0'plotOptions":cljs.core.ObjMap.fromObject(["\ufdd0'scatter"], 
{"\ufdd0'scatter":cljs.core.ObjMap.fromObject(["\ufdd0'marker", "\ufdd0'states"], {"\ufdd0'marker":cljs.core.ObjMap.fromObject(["\ufdd0'radius", "\ufdd0'states"], {"\ufdd0'radius":5, "\ufdd0'states":cljs.core.ObjMap.fromObject(["\ufdd0'hover"], {"\ufdd0'hover":cljs.core.ObjMap.fromObject(["\ufdd0'enabled", "\ufdd0'lineColor"], {"\ufdd0'enabled":true, "\ufdd0'lineColor":"rgb(100, 100, 100)"})})}), "\ufdd0'states":cljs.core.ObjMap.fromObject(["\ufdd0'hover"], {"\ufdd0'hover":cljs.core.ObjMap.fromObject(["\ufdd0'marker"], 
{"\ufdd0'marker":cljs.core.ObjMap.fromObject(["\ufdd0'enabled"], {"\ufdd0'enabled":false})})})})}), "\ufdd0'series":cljs.core.PersistentVector.fromArray([cljs.core.ObjMap.fromObject(["\ufdd0'name", "\ufdd0'color", "\ufdd0'data"], {"\ufdd0'name":"Female", "\ufdd0'color":"rgba(223, 83, 83, .5)", "\ufdd0'data":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([161.2, 51.6], true), cljs.core.PersistentVector.fromArray([167.5, 59], true), cljs.core.PersistentVector.fromArray([159.5, 
49.2], true), cljs.core.PersistentVector.fromArray([157, 63], true), cljs.core.PersistentVector.fromArray([155.8, 53.6], true), cljs.core.PersistentVector.fromArray([170, 59], true), cljs.core.PersistentVector.fromArray([159.1, 47.6], true), cljs.core.PersistentVector.fromArray([166, 69.8], true), cljs.core.PersistentVector.fromArray([176.2, 66.8], true), cljs.core.PersistentVector.fromArray([160.2, 75.2], true), cljs.core.PersistentVector.fromArray([172.5, 55.2], true), cljs.core.PersistentVector.fromArray([170.9, 
54.2], true), cljs.core.PersistentVector.fromArray([172.9, 62.5], true), cljs.core.PersistentVector.fromArray([153.4, 42], true), cljs.core.PersistentVector.fromArray([160, 50], true), cljs.core.PersistentVector.fromArray([147.2, 49.8], true), cljs.core.PersistentVector.fromArray([168.2, 49.2], true), cljs.core.PersistentVector.fromArray([175, 73.2], true), cljs.core.PersistentVector.fromArray([157, 47.8], true), cljs.core.PersistentVector.fromArray([167.6, 68.8], true), cljs.core.PersistentVector.fromArray([159.5, 
50.6], true), cljs.core.PersistentVector.fromArray([175, 82.5], true), cljs.core.PersistentVector.fromArray([166.8, 57.2], true), cljs.core.PersistentVector.fromArray([176.5, 87.8], true), cljs.core.PersistentVector.fromArray([170.2, 72.8], true), cljs.core.PersistentVector.fromArray([174, 54.5], true), cljs.core.PersistentVector.fromArray([173, 59.8], true), cljs.core.PersistentVector.fromArray([179.9, 67.3], true), cljs.core.PersistentVector.fromArray([170.5, 67.8], true), cljs.core.PersistentVector.fromArray([160, 
47], true), cljs.core.PersistentVector.fromArray([154.4, 46.2], true), cljs.core.PersistentVector.fromArray([162, 55], true), cljs.core.PersistentVector.fromArray([176.5, 83], true), cljs.core.PersistentVector.fromArray([160, 54.4], true), cljs.core.PersistentVector.fromArray([152, 45.8], true), cljs.core.PersistentVector.fromArray([162.1, 53.6], true), cljs.core.PersistentVector.fromArray([170, 73.2], true), cljs.core.PersistentVector.fromArray([160.2, 52.1], true), cljs.core.PersistentVector.fromArray([161.3, 
67.9], true), cljs.core.PersistentVector.fromArray([166.4, 56.6], true), cljs.core.PersistentVector.fromArray([168.9, 62.3], true), cljs.core.PersistentVector.fromArray([163.8, 58.5], true), cljs.core.PersistentVector.fromArray([167.6, 54.5], true), cljs.core.PersistentVector.fromArray([160, 50.2], true), cljs.core.PersistentVector.fromArray([161.3, 60.3], true), cljs.core.PersistentVector.fromArray([167.6, 58.3], true), cljs.core.PersistentVector.fromArray([165.1, 56.2], true), cljs.core.PersistentVector.fromArray([160, 
50.2], true), cljs.core.PersistentVector.fromArray([170, 72.9], true), cljs.core.PersistentVector.fromArray([157.5, 59.8], true), cljs.core.PersistentVector.fromArray([167.6, 61], true), cljs.core.PersistentVector.fromArray([160.7, 69.1], true), cljs.core.PersistentVector.fromArray([163.2, 55.9], true), cljs.core.PersistentVector.fromArray([152.4, 46.5], true), cljs.core.PersistentVector.fromArray([157.5, 54.3], true), cljs.core.PersistentVector.fromArray([168.3, 54.8], true), cljs.core.PersistentVector.fromArray([180.3, 
60.7], true), cljs.core.PersistentVector.fromArray([165.5, 60], true), cljs.core.PersistentVector.fromArray([165, 62], true), cljs.core.PersistentVector.fromArray([164.5, 60.3], true), cljs.core.PersistentVector.fromArray([156, 52.7], true), cljs.core.PersistentVector.fromArray([160, 74.3], true), cljs.core.PersistentVector.fromArray([163, 62], true), cljs.core.PersistentVector.fromArray([165.7, 73.1], true), cljs.core.PersistentVector.fromArray([161, 80], true), cljs.core.PersistentVector.fromArray([162, 
54.7], true), cljs.core.PersistentVector.fromArray([166, 53.2], true), cljs.core.PersistentVector.fromArray([174, 75.7], true), cljs.core.PersistentVector.fromArray([172.7, 61.1], true), cljs.core.PersistentVector.fromArray([167.6, 55.7], true), cljs.core.PersistentVector.fromArray([151.1, 48.7], true), cljs.core.PersistentVector.fromArray([164.5, 52.3], true), cljs.core.PersistentVector.fromArray([163.5, 50], true), cljs.core.PersistentVector.fromArray([152, 59.3], true), cljs.core.PersistentVector.fromArray([169, 
62.5], true), cljs.core.PersistentVector.fromArray([164, 55.7], true), cljs.core.PersistentVector.fromArray([161.2, 54.8], true), cljs.core.PersistentVector.fromArray([155, 45.9], true), cljs.core.PersistentVector.fromArray([170, 70.6], true), cljs.core.PersistentVector.fromArray([176.2, 67.2], true), cljs.core.PersistentVector.fromArray([170, 69.4], true), cljs.core.PersistentVector.fromArray([162.5, 58.2], true), cljs.core.PersistentVector.fromArray([170.3, 64.8], true), cljs.core.PersistentVector.fromArray([164.1, 
71.6], true), cljs.core.PersistentVector.fromArray([169.5, 52.8], true), cljs.core.PersistentVector.fromArray([163.2, 59.8], true), cljs.core.PersistentVector.fromArray([154.5, 49], true), cljs.core.PersistentVector.fromArray([159.8, 50], true), cljs.core.PersistentVector.fromArray([173.2, 69.2], true), cljs.core.PersistentVector.fromArray([170, 55.9], true), cljs.core.PersistentVector.fromArray([161.4, 63.4], true), cljs.core.PersistentVector.fromArray([169, 58.2], true), cljs.core.PersistentVector.fromArray([166.2, 
58.6], true), cljs.core.PersistentVector.fromArray([159.4, 45.7], true), cljs.core.PersistentVector.fromArray([162.5, 52.2], true), cljs.core.PersistentVector.fromArray([159, 48.6], true), cljs.core.PersistentVector.fromArray([162.8, 57.8], true), cljs.core.PersistentVector.fromArray([159, 55.6], true), cljs.core.PersistentVector.fromArray([179.8, 66.8], true), cljs.core.PersistentVector.fromArray([162.9, 59.4], true), cljs.core.PersistentVector.fromArray([161, 53.6], true), cljs.core.PersistentVector.fromArray([151.1, 
73.2], true), cljs.core.PersistentVector.fromArray([168.2, 53.4], true), cljs.core.PersistentVector.fromArray([168.9, 69], true), cljs.core.PersistentVector.fromArray([173.2, 58.4], true), cljs.core.PersistentVector.fromArray([171.8, 56.2], true), cljs.core.PersistentVector.fromArray([178, 70.6], true), cljs.core.PersistentVector.fromArray([164.3, 59.8], true), cljs.core.PersistentVector.fromArray([163, 72], true), cljs.core.PersistentVector.fromArray([168.5, 65.2], true), cljs.core.PersistentVector.fromArray([166.8, 
56.6], true), cljs.core.PersistentVector.fromArray([172.7, 105.2], true), cljs.core.PersistentVector.fromArray([163.5, 51.8], true), cljs.core.PersistentVector.fromArray([169.4, 63.4], true), cljs.core.PersistentVector.fromArray([167.8, 59], true), cljs.core.PersistentVector.fromArray([159.5, 47.6], true), cljs.core.PersistentVector.fromArray([167.6, 63], true), cljs.core.PersistentVector.fromArray([161.2, 55.2], true), cljs.core.PersistentVector.fromArray([160, 45], true), cljs.core.PersistentVector.fromArray([163.2, 
54], true), cljs.core.PersistentVector.fromArray([162.2, 50.2], true), cljs.core.PersistentVector.fromArray([161.3, 60.2], true), cljs.core.PersistentVector.fromArray([149.5, 44.8], true), cljs.core.PersistentVector.fromArray([157.5, 58.8], true), cljs.core.PersistentVector.fromArray([163.2, 56.4], true), cljs.core.PersistentVector.fromArray([172.7, 62], true), cljs.core.PersistentVector.fromArray([155, 49.2], true), cljs.core.PersistentVector.fromArray([156.5, 67.2], true), cljs.core.PersistentVector.fromArray([164, 
53.8], true), cljs.core.PersistentVector.fromArray([160.9, 54.4], true), cljs.core.PersistentVector.fromArray([162.8, 58], true), cljs.core.PersistentVector.fromArray([167, 59.8], true), cljs.core.PersistentVector.fromArray([160, 54.8], true), cljs.core.PersistentVector.fromArray([160, 43.2], true), cljs.core.PersistentVector.fromArray([168.9, 60.5], true), cljs.core.PersistentVector.fromArray([158.2, 46.4], true), cljs.core.PersistentVector.fromArray([156, 64.4], true), cljs.core.PersistentVector.fromArray([160, 
48.8], true), cljs.core.PersistentVector.fromArray([167.1, 62.2], true), cljs.core.PersistentVector.fromArray([158, 55.5], true), cljs.core.PersistentVector.fromArray([167.6, 57.8], true), cljs.core.PersistentVector.fromArray([156, 54.6], true), cljs.core.PersistentVector.fromArray([162.1, 59.2], true), cljs.core.PersistentVector.fromArray([173.4, 52.7], true), cljs.core.PersistentVector.fromArray([159.8, 53.2], true), cljs.core.PersistentVector.fromArray([170.5, 64.5], true), cljs.core.PersistentVector.fromArray([159.2, 
51.8], true), cljs.core.PersistentVector.fromArray([157.5, 56], true), cljs.core.PersistentVector.fromArray([161.3, 63.6], true), cljs.core.PersistentVector.fromArray([162.6, 63.2], true), cljs.core.PersistentVector.fromArray([160, 59.5], true), cljs.core.PersistentVector.fromArray([168.9, 56.8], true), cljs.core.PersistentVector.fromArray([165.1, 64.1], true), cljs.core.PersistentVector.fromArray([162.6, 50], true), cljs.core.PersistentVector.fromArray([165.1, 72.3], true), cljs.core.PersistentVector.fromArray([166.4, 
55], true), cljs.core.PersistentVector.fromArray([160, 55.9], true), cljs.core.PersistentVector.fromArray([152.4, 60.4], true), cljs.core.PersistentVector.fromArray([170.2, 69.1], true), cljs.core.PersistentVector.fromArray([162.6, 84.5], true), cljs.core.PersistentVector.fromArray([170.2, 55.9], true), cljs.core.PersistentVector.fromArray([158.8, 55.5], true), cljs.core.PersistentVector.fromArray([172.7, 69.5], true), cljs.core.PersistentVector.fromArray([167.6, 76.4], true), cljs.core.PersistentVector.fromArray([162.6, 
61.4], true), cljs.core.PersistentVector.fromArray([167.6, 65.9], true), cljs.core.PersistentVector.fromArray([156.2, 58.6], true), cljs.core.PersistentVector.fromArray([175.2, 66.8], true), cljs.core.PersistentVector.fromArray([172.1, 56.6], true), cljs.core.PersistentVector.fromArray([162.6, 58.6], true), cljs.core.PersistentVector.fromArray([160, 55.9], true), cljs.core.PersistentVector.fromArray([165.1, 59.1], true), cljs.core.PersistentVector.fromArray([182.9, 81.8], true), cljs.core.PersistentVector.fromArray([166.4, 
70.7], true), cljs.core.PersistentVector.fromArray([165.1, 56.8], true), cljs.core.PersistentVector.fromArray([177.8, 60], true), cljs.core.PersistentVector.fromArray([165.1, 58.2], true), cljs.core.PersistentVector.fromArray([175.3, 72.7], true), cljs.core.PersistentVector.fromArray([154.9, 54.1], true), cljs.core.PersistentVector.fromArray([158.8, 49.1], true), cljs.core.PersistentVector.fromArray([172.7, 75.9], true), cljs.core.PersistentVector.fromArray([168.9, 55], true), cljs.core.PersistentVector.fromArray([161.3, 
57.3], true), cljs.core.PersistentVector.fromArray([167.6, 55], true), cljs.core.PersistentVector.fromArray([165.1, 65.5], true), cljs.core.PersistentVector.fromArray([175.3, 65.5], true), cljs.core.PersistentVector.fromArray([157.5, 48.6], true), cljs.core.PersistentVector.fromArray([163.8, 58.6], true), cljs.core.PersistentVector.fromArray([167.6, 63.6], true), cljs.core.PersistentVector.fromArray([165.1, 55.2], true), cljs.core.PersistentVector.fromArray([165.1, 62.7], true), cljs.core.PersistentVector.fromArray([168.9, 
56.6], true), cljs.core.PersistentVector.fromArray([162.6, 53.9], true), cljs.core.PersistentVector.fromArray([164.5, 63.2], true), cljs.core.PersistentVector.fromArray([176.5, 73.6], true), cljs.core.PersistentVector.fromArray([168.9, 62], true), cljs.core.PersistentVector.fromArray([175.3, 63.6], true), cljs.core.PersistentVector.fromArray([159.4, 53.2], true), cljs.core.PersistentVector.fromArray([160, 53.4], true), cljs.core.PersistentVector.fromArray([170.2, 55], true), cljs.core.PersistentVector.fromArray([162.6, 
70.5], true), cljs.core.PersistentVector.fromArray([167.6, 54.5], true), cljs.core.PersistentVector.fromArray([162.6, 54.5], true), cljs.core.PersistentVector.fromArray([160.7, 55.9], true), cljs.core.PersistentVector.fromArray([160, 59], true), cljs.core.PersistentVector.fromArray([157.5, 63.6], true), cljs.core.PersistentVector.fromArray([162.6, 54.5], true), cljs.core.PersistentVector.fromArray([152.4, 47.3], true), cljs.core.PersistentVector.fromArray([170.2, 67.7], true), cljs.core.PersistentVector.fromArray([165.1, 
80.9], true), cljs.core.PersistentVector.fromArray([172.7, 70.5], true), cljs.core.PersistentVector.fromArray([165.1, 60.9], true), cljs.core.PersistentVector.fromArray([170.2, 63.6], true), cljs.core.PersistentVector.fromArray([170.2, 54.5], true), cljs.core.PersistentVector.fromArray([170.2, 59.1], true), cljs.core.PersistentVector.fromArray([161.3, 70.5], true), cljs.core.PersistentVector.fromArray([167.6, 52.7], true), cljs.core.PersistentVector.fromArray([167.6, 62.7], true), cljs.core.PersistentVector.fromArray([165.1, 
86.3], true), cljs.core.PersistentVector.fromArray([162.6, 66.4], true), cljs.core.PersistentVector.fromArray([152.4, 67.3], true), cljs.core.PersistentVector.fromArray([168.9, 63], true), cljs.core.PersistentVector.fromArray([170.2, 73.6], true), cljs.core.PersistentVector.fromArray([175.2, 62.3], true), cljs.core.PersistentVector.fromArray([175.2, 57.7], true), cljs.core.PersistentVector.fromArray([160, 55.4], true), cljs.core.PersistentVector.fromArray([165.1, 104.1], true), cljs.core.PersistentVector.fromArray([174, 
55.5], true), cljs.core.PersistentVector.fromArray([170.2, 77.3], true), cljs.core.PersistentVector.fromArray([160, 80.5], true), cljs.core.PersistentVector.fromArray([167.6, 64.5], true), cljs.core.PersistentVector.fromArray([167.6, 72.3], true), cljs.core.PersistentVector.fromArray([167.6, 61.4], true), cljs.core.PersistentVector.fromArray([154.9, 58.2], true), cljs.core.PersistentVector.fromArray([162.6, 81.8], true), cljs.core.PersistentVector.fromArray([175.3, 63.6], true), cljs.core.PersistentVector.fromArray([171.4, 
53.4], true), cljs.core.PersistentVector.fromArray([157.5, 54.5], true), cljs.core.PersistentVector.fromArray([165.1, 53.6], true), cljs.core.PersistentVector.fromArray([160, 60], true), cljs.core.PersistentVector.fromArray([174, 73.6], true), cljs.core.PersistentVector.fromArray([162.6, 61.4], true), cljs.core.PersistentVector.fromArray([174, 55.5], true), cljs.core.PersistentVector.fromArray([162.6, 63.6], true), cljs.core.PersistentVector.fromArray([161.3, 60.9], true), cljs.core.PersistentVector.fromArray([156.2, 
60], true), cljs.core.PersistentVector.fromArray([149.9, 46.8], true), cljs.core.PersistentVector.fromArray([169.5, 57.3], true), cljs.core.PersistentVector.fromArray([160, 64.1], true), cljs.core.PersistentVector.fromArray([175.3, 63.6], true), cljs.core.PersistentVector.fromArray([169.5, 67.3], true), cljs.core.PersistentVector.fromArray([160, 75.5], true), cljs.core.PersistentVector.fromArray([172.7, 68.2], true), cljs.core.PersistentVector.fromArray([162.6, 61.4], true), cljs.core.PersistentVector.fromArray([157.5, 
76.8], true), cljs.core.PersistentVector.fromArray([176.5, 71.8], true), cljs.core.PersistentVector.fromArray([164.4, 55.5], true), cljs.core.PersistentVector.fromArray([160.7, 48.6], true), cljs.core.PersistentVector.fromArray([174, 66.4], true), cljs.core.PersistentVector.fromArray([163.8, 67.3], true)], true)}), cljs.core.ObjMap.fromObject(["\ufdd0'name", "\ufdd0'color", "\ufdd0'data"], {"\ufdd0'name":"Male", "\ufdd0'color":"rgba(119, 152, 191, .5)", "\ufdd0'data":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([174, 
65.6], true), cljs.core.PersistentVector.fromArray([175.3, 71.8], true), cljs.core.PersistentVector.fromArray([193.5, 80.7], true), cljs.core.PersistentVector.fromArray([186.5, 72.6], true), cljs.core.PersistentVector.fromArray([187.2, 78.8], true), cljs.core.PersistentVector.fromArray([181.5, 74.8], true), cljs.core.PersistentVector.fromArray([184, 86.4], true), cljs.core.PersistentVector.fromArray([184.5, 78.4], true), cljs.core.PersistentVector.fromArray([175, 62], true), cljs.core.PersistentVector.fromArray([184, 
81.6], true), cljs.core.PersistentVector.fromArray([180, 76.6], true), cljs.core.PersistentVector.fromArray([177.8, 83.6], true), cljs.core.PersistentVector.fromArray([192, 90], true), cljs.core.PersistentVector.fromArray([176, 74.6], true), cljs.core.PersistentVector.fromArray([174, 71], true), cljs.core.PersistentVector.fromArray([184, 79.6], true), cljs.core.PersistentVector.fromArray([192.7, 93.8], true), cljs.core.PersistentVector.fromArray([171.5, 70], true), cljs.core.PersistentVector.fromArray([173, 
72.4], true), cljs.core.PersistentVector.fromArray([176, 85.9], true), cljs.core.PersistentVector.fromArray([176, 78.8], true), cljs.core.PersistentVector.fromArray([180.5, 77.8], true), cljs.core.PersistentVector.fromArray([172.7, 66.2], true), cljs.core.PersistentVector.fromArray([176, 86.4], true), cljs.core.PersistentVector.fromArray([173.5, 81.8], true), cljs.core.PersistentVector.fromArray([178, 89.6], true), cljs.core.PersistentVector.fromArray([180.3, 82.8], true), cljs.core.PersistentVector.fromArray([180.3, 
76.4], true), cljs.core.PersistentVector.fromArray([164.5, 63.2], true), cljs.core.PersistentVector.fromArray([173, 60.9], true), cljs.core.PersistentVector.fromArray([183.5, 74.8], true), cljs.core.PersistentVector.fromArray([175.5, 70], true), cljs.core.PersistentVector.fromArray([188, 72.4], true), cljs.core.PersistentVector.fromArray([189.2, 84.1], true), cljs.core.PersistentVector.fromArray([172.8, 69.1], true), cljs.core.PersistentVector.fromArray([170, 59.5], true), cljs.core.PersistentVector.fromArray([182, 
67.2], true), cljs.core.PersistentVector.fromArray([170, 61.3], true), cljs.core.PersistentVector.fromArray([177.8, 68.6], true), cljs.core.PersistentVector.fromArray([184.2, 80.1], true), cljs.core.PersistentVector.fromArray([186.7, 87.8], true), cljs.core.PersistentVector.fromArray([171.4, 84.7], true), cljs.core.PersistentVector.fromArray([172.7, 73.4], true), cljs.core.PersistentVector.fromArray([175.3, 72.1], true), cljs.core.PersistentVector.fromArray([180.3, 82.6], true), cljs.core.PersistentVector.fromArray([182.9, 
88.7], true), cljs.core.PersistentVector.fromArray([188, 84.1], true), cljs.core.PersistentVector.fromArray([177.2, 94.1], true), cljs.core.PersistentVector.fromArray([172.1, 74.9], true), cljs.core.PersistentVector.fromArray([167, 59.1], true), cljs.core.PersistentVector.fromArray([169.5, 75.6], true), cljs.core.PersistentVector.fromArray([174, 86.2], true), cljs.core.PersistentVector.fromArray([172.7, 75.3], true), cljs.core.PersistentVector.fromArray([182.2, 87.1], true), cljs.core.PersistentVector.fromArray([164.1, 
55.2], true), cljs.core.PersistentVector.fromArray([163, 57], true), cljs.core.PersistentVector.fromArray([171.5, 61.4], true), cljs.core.PersistentVector.fromArray([184.2, 76.8], true), cljs.core.PersistentVector.fromArray([174, 86.8], true), cljs.core.PersistentVector.fromArray([174, 72.2], true), cljs.core.PersistentVector.fromArray([177, 71.6], true), cljs.core.PersistentVector.fromArray([186, 84.8], true), cljs.core.PersistentVector.fromArray([167, 68.2], true), cljs.core.PersistentVector.fromArray([171.8, 
66.1], true), cljs.core.PersistentVector.fromArray([182, 72], true), cljs.core.PersistentVector.fromArray([167, 64.6], true), cljs.core.PersistentVector.fromArray([177.8, 74.8], true), cljs.core.PersistentVector.fromArray([164.5, 70], true), cljs.core.PersistentVector.fromArray([192, 101.6], true), cljs.core.PersistentVector.fromArray([175.5, 63.2], true), cljs.core.PersistentVector.fromArray([171.2, 79.1], true), cljs.core.PersistentVector.fromArray([181.6, 78.9], true), cljs.core.PersistentVector.fromArray([167.4, 
67.7], true), cljs.core.PersistentVector.fromArray([181.1, 66], true), cljs.core.PersistentVector.fromArray([177, 68.2], true), cljs.core.PersistentVector.fromArray([174.5, 63.9], true), cljs.core.PersistentVector.fromArray([177.5, 72], true), cljs.core.PersistentVector.fromArray([170.5, 56.8], true), cljs.core.PersistentVector.fromArray([182.4, 74.5], true), cljs.core.PersistentVector.fromArray([197.1, 90.9], true), cljs.core.PersistentVector.fromArray([180.1, 93], true), cljs.core.PersistentVector.fromArray([175.5, 
80.9], true), cljs.core.PersistentVector.fromArray([180.6, 72.7], true), cljs.core.PersistentVector.fromArray([184.4, 68], true), cljs.core.PersistentVector.fromArray([175.5, 70.9], true), cljs.core.PersistentVector.fromArray([180.6, 72.5], true), cljs.core.PersistentVector.fromArray([177, 72.5], true), cljs.core.PersistentVector.fromArray([177.1, 83.4], true), cljs.core.PersistentVector.fromArray([181.6, 75.5], true), cljs.core.PersistentVector.fromArray([176.5, 73], true), cljs.core.PersistentVector.fromArray([175, 
70.2], true), cljs.core.PersistentVector.fromArray([174, 73.4], true), cljs.core.PersistentVector.fromArray([165.1, 70.5], true), cljs.core.PersistentVector.fromArray([177, 68.9], true), cljs.core.PersistentVector.fromArray([192, 102.3], true), cljs.core.PersistentVector.fromArray([176.5, 68.4], true), cljs.core.PersistentVector.fromArray([169.4, 65.9], true), cljs.core.PersistentVector.fromArray([182.1, 75.7], true), cljs.core.PersistentVector.fromArray([179.8, 84.5], true), cljs.core.PersistentVector.fromArray([175.3, 
87.7], true), cljs.core.PersistentVector.fromArray([184.9, 86.4], true), cljs.core.PersistentVector.fromArray([177.3, 73.2], true), cljs.core.PersistentVector.fromArray([167.4, 53.9], true), cljs.core.PersistentVector.fromArray([178.1, 72], true), cljs.core.PersistentVector.fromArray([168.9, 55.5], true), cljs.core.PersistentVector.fromArray([157.2, 58.4], true), cljs.core.PersistentVector.fromArray([180.3, 83.2], true), cljs.core.PersistentVector.fromArray([170.2, 72.7], true), cljs.core.PersistentVector.fromArray([177.8, 
64.1], true), cljs.core.PersistentVector.fromArray([172.7, 72.3], true), cljs.core.PersistentVector.fromArray([165.1, 65], true), cljs.core.PersistentVector.fromArray([186.7, 86.4], true), cljs.core.PersistentVector.fromArray([165.1, 65], true), cljs.core.PersistentVector.fromArray([174, 88.6], true), cljs.core.PersistentVector.fromArray([175.3, 84.1], true), cljs.core.PersistentVector.fromArray([185.4, 66.8], true), cljs.core.PersistentVector.fromArray([177.8, 75.5], true), cljs.core.PersistentVector.fromArray([180.3, 
93.2], true), cljs.core.PersistentVector.fromArray([180.3, 82.7], true), cljs.core.PersistentVector.fromArray([177.8, 58], true), cljs.core.PersistentVector.fromArray([177.8, 79.5], true), cljs.core.PersistentVector.fromArray([177.8, 78.6], true), cljs.core.PersistentVector.fromArray([177.8, 71.8], true), cljs.core.PersistentVector.fromArray([177.8, 116.4], true), cljs.core.PersistentVector.fromArray([163.8, 72.2], true), cljs.core.PersistentVector.fromArray([188, 83.6], true), cljs.core.PersistentVector.fromArray([198.1, 
85.5], true), cljs.core.PersistentVector.fromArray([175.3, 90.9], true), cljs.core.PersistentVector.fromArray([166.4, 85.9], true), cljs.core.PersistentVector.fromArray([190.5, 89.1], true), cljs.core.PersistentVector.fromArray([166.4, 75], true), cljs.core.PersistentVector.fromArray([177.8, 77.7], true), cljs.core.PersistentVector.fromArray([179.7, 86.4], true), cljs.core.PersistentVector.fromArray([172.7, 90.9], true), cljs.core.PersistentVector.fromArray([190.5, 73.6], true), cljs.core.PersistentVector.fromArray([185.4, 
76.4], true), cljs.core.PersistentVector.fromArray([168.9, 69.1], true), cljs.core.PersistentVector.fromArray([167.6, 84.5], true), cljs.core.PersistentVector.fromArray([175.3, 64.5], true), cljs.core.PersistentVector.fromArray([170.2, 69.1], true), cljs.core.PersistentVector.fromArray([190.5, 108.6], true), cljs.core.PersistentVector.fromArray([177.8, 86.4], true), cljs.core.PersistentVector.fromArray([190.5, 80.9], true), cljs.core.PersistentVector.fromArray([177.8, 87.7], true), cljs.core.PersistentVector.fromArray([184.2, 
94.5], true), cljs.core.PersistentVector.fromArray([176.5, 80.2], true), cljs.core.PersistentVector.fromArray([177.8, 72], true), cljs.core.PersistentVector.fromArray([180.3, 71.4], true), cljs.core.PersistentVector.fromArray([171.4, 72.7], true), cljs.core.PersistentVector.fromArray([172.7, 84.1], true), cljs.core.PersistentVector.fromArray([172.7, 76.8], true), cljs.core.PersistentVector.fromArray([177.8, 63.6], true), cljs.core.PersistentVector.fromArray([177.8, 80.9], true), cljs.core.PersistentVector.fromArray([182.9, 
80.9], true), cljs.core.PersistentVector.fromArray([170.2, 85.5], true), cljs.core.PersistentVector.fromArray([167.6, 68.6], true), cljs.core.PersistentVector.fromArray([175.3, 67.7], true), cljs.core.PersistentVector.fromArray([165.1, 66.4], true), cljs.core.PersistentVector.fromArray([185.4, 102.3], true), cljs.core.PersistentVector.fromArray([181.6, 70.5], true), cljs.core.PersistentVector.fromArray([172.7, 95.9], true), cljs.core.PersistentVector.fromArray([190.5, 84.1], true), cljs.core.PersistentVector.fromArray([179.1, 
87.3], true), cljs.core.PersistentVector.fromArray([175.3, 71.8], true), cljs.core.PersistentVector.fromArray([170.2, 65.9], true), cljs.core.PersistentVector.fromArray([193, 95.9], true), cljs.core.PersistentVector.fromArray([171.4, 91.4], true), cljs.core.PersistentVector.fromArray([177.8, 81.8], true), cljs.core.PersistentVector.fromArray([177.8, 96.8], true), cljs.core.PersistentVector.fromArray([167.6, 69.1], true), cljs.core.PersistentVector.fromArray([167.6, 82.7], true), cljs.core.PersistentVector.fromArray([180.3, 
75.5], true), cljs.core.PersistentVector.fromArray([182.9, 79.5], true), cljs.core.PersistentVector.fromArray([176.5, 73.6], true), cljs.core.PersistentVector.fromArray([186.7, 91.8], true), cljs.core.PersistentVector.fromArray([188, 84.1], true), cljs.core.PersistentVector.fromArray([188, 85.9], true), cljs.core.PersistentVector.fromArray([177.8, 81.8], true), cljs.core.PersistentVector.fromArray([174, 82.5], true), cljs.core.PersistentVector.fromArray([177.8, 80.5], true), cljs.core.PersistentVector.fromArray([171.4, 
70], true), cljs.core.PersistentVector.fromArray([185.4, 81.8], true), cljs.core.PersistentVector.fromArray([185.4, 84.1], true), cljs.core.PersistentVector.fromArray([188, 90.5], true), cljs.core.PersistentVector.fromArray([188, 91.4], true), cljs.core.PersistentVector.fromArray([182.9, 89.1], true), cljs.core.PersistentVector.fromArray([176.5, 85], true), cljs.core.PersistentVector.fromArray([175.3, 69.1], true), cljs.core.PersistentVector.fromArray([175.3, 73.6], true), cljs.core.PersistentVector.fromArray([188, 
80.5], true), cljs.core.PersistentVector.fromArray([188, 82.7], true), cljs.core.PersistentVector.fromArray([175.3, 86.4], true), cljs.core.PersistentVector.fromArray([170.5, 67.7], true), cljs.core.PersistentVector.fromArray([179.1, 92.7], true), cljs.core.PersistentVector.fromArray([177.8, 93.6], true), cljs.core.PersistentVector.fromArray([175.3, 70.9], true), cljs.core.PersistentVector.fromArray([182.9, 75], true), cljs.core.PersistentVector.fromArray([170.8, 93.2], true), cljs.core.PersistentVector.fromArray([188, 
93.2], true), cljs.core.PersistentVector.fromArray([180.3, 77.7], true), cljs.core.PersistentVector.fromArray([177.8, 61.4], true), cljs.core.PersistentVector.fromArray([185.4, 94.1], true), cljs.core.PersistentVector.fromArray([168.9, 75], true), cljs.core.PersistentVector.fromArray([185.4, 83.6], true), cljs.core.PersistentVector.fromArray([180.3, 85.5], true), cljs.core.PersistentVector.fromArray([174, 73.9], true), cljs.core.PersistentVector.fromArray([167.6, 66.8], true), cljs.core.PersistentVector.fromArray([182.9, 
87.3], true), cljs.core.PersistentVector.fromArray([160, 72.3], true), cljs.core.PersistentVector.fromArray([180.3, 88.6], true), cljs.core.PersistentVector.fromArray([167.6, 75.5], true), cljs.core.PersistentVector.fromArray([186.7, 101.4], true), cljs.core.PersistentVector.fromArray([175.3, 91.1], true), cljs.core.PersistentVector.fromArray([175.3, 67.3], true), cljs.core.PersistentVector.fromArray([175.9, 77.7], true), cljs.core.PersistentVector.fromArray([175.3, 81.8], true), cljs.core.PersistentVector.fromArray([179.1, 
75.5], true), cljs.core.PersistentVector.fromArray([181.6, 84.5], true), cljs.core.PersistentVector.fromArray([177.8, 76.6], true), cljs.core.PersistentVector.fromArray([182.9, 85], true), cljs.core.PersistentVector.fromArray([177.8, 102.5], true), cljs.core.PersistentVector.fromArray([184.2, 77.3], true), cljs.core.PersistentVector.fromArray([179.1, 71.8], true), cljs.core.PersistentVector.fromArray([176.5, 87.9], true), cljs.core.PersistentVector.fromArray([188, 94.3], true), cljs.core.PersistentVector.fromArray([174, 
70.9], true), cljs.core.PersistentVector.fromArray([167.6, 64.5], true), cljs.core.PersistentVector.fromArray([170.2, 77.3], true), cljs.core.PersistentVector.fromArray([167.6, 72.3], true), cljs.core.PersistentVector.fromArray([188, 87.3], true), cljs.core.PersistentVector.fromArray([174, 80], true), cljs.core.PersistentVector.fromArray([176.5, 82.3], true), cljs.core.PersistentVector.fromArray([180.3, 73.6], true), cljs.core.PersistentVector.fromArray([167.6, 74.1], true), cljs.core.PersistentVector.fromArray([188, 
85.9], true), cljs.core.PersistentVector.fromArray([180.3, 73.2], true), cljs.core.PersistentVector.fromArray([167.6, 76.3], true), cljs.core.PersistentVector.fromArray([183, 65.9], true), cljs.core.PersistentVector.fromArray([183, 90.9], true), cljs.core.PersistentVector.fromArray([179.1, 89.1], true), cljs.core.PersistentVector.fromArray([170.2, 62.3], true), cljs.core.PersistentVector.fromArray([177.8, 82.7], true), cljs.core.PersistentVector.fromArray([179.1, 79.1], true), cljs.core.PersistentVector.fromArray([190.5, 
98.2], true), cljs.core.PersistentVector.fromArray([177.8, 84.1], true), cljs.core.PersistentVector.fromArray([180.3, 83.2], true), cljs.core.PersistentVector.fromArray([180.3, 83.2], true)], true)})], true)}));
app.jquery.call(null, function() {
  return new Highcharts.Chart(app.chart_options)
});
