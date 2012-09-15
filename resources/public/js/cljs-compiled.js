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
  var x__6155 = x == null ? null : x;
  if(p[goog.typeOf(x__6155)]) {
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
    var G__6156__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6156 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6156__delegate.call(this, array, i, idxs)
    };
    G__6156.cljs$lang$maxFixedArity = 2;
    G__6156.cljs$lang$applyTo = function(arglist__6157) {
      var array = cljs.core.first(arglist__6157);
      var i = cljs.core.first(cljs.core.next(arglist__6157));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6157));
      return G__6156__delegate(array, i, idxs)
    };
    G__6156.cljs$lang$arity$variadic = G__6156__delegate;
    return G__6156
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
      var and__3822__auto____6242 = this$;
      if(and__3822__auto____6242) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6242
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____6243 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6244 = cljs.core._invoke[goog.typeOf(x__2363__auto____6243)];
        if(or__3824__auto____6244) {
          return or__3824__auto____6244
        }else {
          var or__3824__auto____6245 = cljs.core._invoke["_"];
          if(or__3824__auto____6245) {
            return or__3824__auto____6245
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6246 = this$;
      if(and__3822__auto____6246) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6246
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____6247 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6248 = cljs.core._invoke[goog.typeOf(x__2363__auto____6247)];
        if(or__3824__auto____6248) {
          return or__3824__auto____6248
        }else {
          var or__3824__auto____6249 = cljs.core._invoke["_"];
          if(or__3824__auto____6249) {
            return or__3824__auto____6249
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6250 = this$;
      if(and__3822__auto____6250) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6250
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____6251 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6252 = cljs.core._invoke[goog.typeOf(x__2363__auto____6251)];
        if(or__3824__auto____6252) {
          return or__3824__auto____6252
        }else {
          var or__3824__auto____6253 = cljs.core._invoke["_"];
          if(or__3824__auto____6253) {
            return or__3824__auto____6253
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6254 = this$;
      if(and__3822__auto____6254) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6254
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____6255 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6256 = cljs.core._invoke[goog.typeOf(x__2363__auto____6255)];
        if(or__3824__auto____6256) {
          return or__3824__auto____6256
        }else {
          var or__3824__auto____6257 = cljs.core._invoke["_"];
          if(or__3824__auto____6257) {
            return or__3824__auto____6257
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6258 = this$;
      if(and__3822__auto____6258) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6258
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____6259 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6260 = cljs.core._invoke[goog.typeOf(x__2363__auto____6259)];
        if(or__3824__auto____6260) {
          return or__3824__auto____6260
        }else {
          var or__3824__auto____6261 = cljs.core._invoke["_"];
          if(or__3824__auto____6261) {
            return or__3824__auto____6261
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6262 = this$;
      if(and__3822__auto____6262) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6262
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____6263 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6264 = cljs.core._invoke[goog.typeOf(x__2363__auto____6263)];
        if(or__3824__auto____6264) {
          return or__3824__auto____6264
        }else {
          var or__3824__auto____6265 = cljs.core._invoke["_"];
          if(or__3824__auto____6265) {
            return or__3824__auto____6265
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6266 = this$;
      if(and__3822__auto____6266) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6266
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____6267 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6268 = cljs.core._invoke[goog.typeOf(x__2363__auto____6267)];
        if(or__3824__auto____6268) {
          return or__3824__auto____6268
        }else {
          var or__3824__auto____6269 = cljs.core._invoke["_"];
          if(or__3824__auto____6269) {
            return or__3824__auto____6269
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6270 = this$;
      if(and__3822__auto____6270) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6270
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____6271 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6272 = cljs.core._invoke[goog.typeOf(x__2363__auto____6271)];
        if(or__3824__auto____6272) {
          return or__3824__auto____6272
        }else {
          var or__3824__auto____6273 = cljs.core._invoke["_"];
          if(or__3824__auto____6273) {
            return or__3824__auto____6273
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6274 = this$;
      if(and__3822__auto____6274) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6274
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____6275 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6276 = cljs.core._invoke[goog.typeOf(x__2363__auto____6275)];
        if(or__3824__auto____6276) {
          return or__3824__auto____6276
        }else {
          var or__3824__auto____6277 = cljs.core._invoke["_"];
          if(or__3824__auto____6277) {
            return or__3824__auto____6277
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6278 = this$;
      if(and__3822__auto____6278) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6278
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____6279 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6280 = cljs.core._invoke[goog.typeOf(x__2363__auto____6279)];
        if(or__3824__auto____6280) {
          return or__3824__auto____6280
        }else {
          var or__3824__auto____6281 = cljs.core._invoke["_"];
          if(or__3824__auto____6281) {
            return or__3824__auto____6281
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6282 = this$;
      if(and__3822__auto____6282) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6282
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____6283 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6284 = cljs.core._invoke[goog.typeOf(x__2363__auto____6283)];
        if(or__3824__auto____6284) {
          return or__3824__auto____6284
        }else {
          var or__3824__auto____6285 = cljs.core._invoke["_"];
          if(or__3824__auto____6285) {
            return or__3824__auto____6285
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6286 = this$;
      if(and__3822__auto____6286) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6286
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____6287 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6288 = cljs.core._invoke[goog.typeOf(x__2363__auto____6287)];
        if(or__3824__auto____6288) {
          return or__3824__auto____6288
        }else {
          var or__3824__auto____6289 = cljs.core._invoke["_"];
          if(or__3824__auto____6289) {
            return or__3824__auto____6289
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6290 = this$;
      if(and__3822__auto____6290) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6290
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____6291 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6292 = cljs.core._invoke[goog.typeOf(x__2363__auto____6291)];
        if(or__3824__auto____6292) {
          return or__3824__auto____6292
        }else {
          var or__3824__auto____6293 = cljs.core._invoke["_"];
          if(or__3824__auto____6293) {
            return or__3824__auto____6293
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6294 = this$;
      if(and__3822__auto____6294) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6294
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____6295 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6296 = cljs.core._invoke[goog.typeOf(x__2363__auto____6295)];
        if(or__3824__auto____6296) {
          return or__3824__auto____6296
        }else {
          var or__3824__auto____6297 = cljs.core._invoke["_"];
          if(or__3824__auto____6297) {
            return or__3824__auto____6297
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6298 = this$;
      if(and__3822__auto____6298) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6298
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____6299 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6300 = cljs.core._invoke[goog.typeOf(x__2363__auto____6299)];
        if(or__3824__auto____6300) {
          return or__3824__auto____6300
        }else {
          var or__3824__auto____6301 = cljs.core._invoke["_"];
          if(or__3824__auto____6301) {
            return or__3824__auto____6301
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6302 = this$;
      if(and__3822__auto____6302) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6302
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____6303 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6304 = cljs.core._invoke[goog.typeOf(x__2363__auto____6303)];
        if(or__3824__auto____6304) {
          return or__3824__auto____6304
        }else {
          var or__3824__auto____6305 = cljs.core._invoke["_"];
          if(or__3824__auto____6305) {
            return or__3824__auto____6305
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6306 = this$;
      if(and__3822__auto____6306) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6306
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____6307 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6308 = cljs.core._invoke[goog.typeOf(x__2363__auto____6307)];
        if(or__3824__auto____6308) {
          return or__3824__auto____6308
        }else {
          var or__3824__auto____6309 = cljs.core._invoke["_"];
          if(or__3824__auto____6309) {
            return or__3824__auto____6309
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6310 = this$;
      if(and__3822__auto____6310) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6310
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____6311 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6312 = cljs.core._invoke[goog.typeOf(x__2363__auto____6311)];
        if(or__3824__auto____6312) {
          return or__3824__auto____6312
        }else {
          var or__3824__auto____6313 = cljs.core._invoke["_"];
          if(or__3824__auto____6313) {
            return or__3824__auto____6313
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6314 = this$;
      if(and__3822__auto____6314) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6314
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____6315 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6316 = cljs.core._invoke[goog.typeOf(x__2363__auto____6315)];
        if(or__3824__auto____6316) {
          return or__3824__auto____6316
        }else {
          var or__3824__auto____6317 = cljs.core._invoke["_"];
          if(or__3824__auto____6317) {
            return or__3824__auto____6317
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6318 = this$;
      if(and__3822__auto____6318) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6318
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____6319 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6320 = cljs.core._invoke[goog.typeOf(x__2363__auto____6319)];
        if(or__3824__auto____6320) {
          return or__3824__auto____6320
        }else {
          var or__3824__auto____6321 = cljs.core._invoke["_"];
          if(or__3824__auto____6321) {
            return or__3824__auto____6321
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6322 = this$;
      if(and__3822__auto____6322) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6322
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____6323 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6324 = cljs.core._invoke[goog.typeOf(x__2363__auto____6323)];
        if(or__3824__auto____6324) {
          return or__3824__auto____6324
        }else {
          var or__3824__auto____6325 = cljs.core._invoke["_"];
          if(or__3824__auto____6325) {
            return or__3824__auto____6325
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
    var and__3822__auto____6330 = coll;
    if(and__3822__auto____6330) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6330
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____6331 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6332 = cljs.core._count[goog.typeOf(x__2363__auto____6331)];
      if(or__3824__auto____6332) {
        return or__3824__auto____6332
      }else {
        var or__3824__auto____6333 = cljs.core._count["_"];
        if(or__3824__auto____6333) {
          return or__3824__auto____6333
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
    var and__3822__auto____6338 = coll;
    if(and__3822__auto____6338) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6338
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____6339 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6340 = cljs.core._empty[goog.typeOf(x__2363__auto____6339)];
      if(or__3824__auto____6340) {
        return or__3824__auto____6340
      }else {
        var or__3824__auto____6341 = cljs.core._empty["_"];
        if(or__3824__auto____6341) {
          return or__3824__auto____6341
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
    var and__3822__auto____6346 = coll;
    if(and__3822__auto____6346) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6346
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____6347 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6348 = cljs.core._conj[goog.typeOf(x__2363__auto____6347)];
      if(or__3824__auto____6348) {
        return or__3824__auto____6348
      }else {
        var or__3824__auto____6349 = cljs.core._conj["_"];
        if(or__3824__auto____6349) {
          return or__3824__auto____6349
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
      var and__3822__auto____6358 = coll;
      if(and__3822__auto____6358) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6358
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____6359 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6360 = cljs.core._nth[goog.typeOf(x__2363__auto____6359)];
        if(or__3824__auto____6360) {
          return or__3824__auto____6360
        }else {
          var or__3824__auto____6361 = cljs.core._nth["_"];
          if(or__3824__auto____6361) {
            return or__3824__auto____6361
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6362 = coll;
      if(and__3822__auto____6362) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6362
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____6363 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6364 = cljs.core._nth[goog.typeOf(x__2363__auto____6363)];
        if(or__3824__auto____6364) {
          return or__3824__auto____6364
        }else {
          var or__3824__auto____6365 = cljs.core._nth["_"];
          if(or__3824__auto____6365) {
            return or__3824__auto____6365
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
    var and__3822__auto____6370 = coll;
    if(and__3822__auto____6370) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6370
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____6371 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6372 = cljs.core._first[goog.typeOf(x__2363__auto____6371)];
      if(or__3824__auto____6372) {
        return or__3824__auto____6372
      }else {
        var or__3824__auto____6373 = cljs.core._first["_"];
        if(or__3824__auto____6373) {
          return or__3824__auto____6373
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6378 = coll;
    if(and__3822__auto____6378) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6378
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____6379 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6380 = cljs.core._rest[goog.typeOf(x__2363__auto____6379)];
      if(or__3824__auto____6380) {
        return or__3824__auto____6380
      }else {
        var or__3824__auto____6381 = cljs.core._rest["_"];
        if(or__3824__auto____6381) {
          return or__3824__auto____6381
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
    var and__3822__auto____6386 = coll;
    if(and__3822__auto____6386) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6386
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____6387 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6388 = cljs.core._next[goog.typeOf(x__2363__auto____6387)];
      if(or__3824__auto____6388) {
        return or__3824__auto____6388
      }else {
        var or__3824__auto____6389 = cljs.core._next["_"];
        if(or__3824__auto____6389) {
          return or__3824__auto____6389
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
      var and__3822__auto____6398 = o;
      if(and__3822__auto____6398) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6398
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____6399 = o == null ? null : o;
      return function() {
        var or__3824__auto____6400 = cljs.core._lookup[goog.typeOf(x__2363__auto____6399)];
        if(or__3824__auto____6400) {
          return or__3824__auto____6400
        }else {
          var or__3824__auto____6401 = cljs.core._lookup["_"];
          if(or__3824__auto____6401) {
            return or__3824__auto____6401
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6402 = o;
      if(and__3822__auto____6402) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6402
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____6403 = o == null ? null : o;
      return function() {
        var or__3824__auto____6404 = cljs.core._lookup[goog.typeOf(x__2363__auto____6403)];
        if(or__3824__auto____6404) {
          return or__3824__auto____6404
        }else {
          var or__3824__auto____6405 = cljs.core._lookup["_"];
          if(or__3824__auto____6405) {
            return or__3824__auto____6405
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
    var and__3822__auto____6410 = coll;
    if(and__3822__auto____6410) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6410
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____6411 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6412 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____6411)];
      if(or__3824__auto____6412) {
        return or__3824__auto____6412
      }else {
        var or__3824__auto____6413 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6413) {
          return or__3824__auto____6413
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6418 = coll;
    if(and__3822__auto____6418) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6418
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____6419 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6420 = cljs.core._assoc[goog.typeOf(x__2363__auto____6419)];
      if(or__3824__auto____6420) {
        return or__3824__auto____6420
      }else {
        var or__3824__auto____6421 = cljs.core._assoc["_"];
        if(or__3824__auto____6421) {
          return or__3824__auto____6421
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
    var and__3822__auto____6426 = coll;
    if(and__3822__auto____6426) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6426
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____6427 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6428 = cljs.core._dissoc[goog.typeOf(x__2363__auto____6427)];
      if(or__3824__auto____6428) {
        return or__3824__auto____6428
      }else {
        var or__3824__auto____6429 = cljs.core._dissoc["_"];
        if(or__3824__auto____6429) {
          return or__3824__auto____6429
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
    var and__3822__auto____6434 = coll;
    if(and__3822__auto____6434) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6434
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____6435 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6436 = cljs.core._key[goog.typeOf(x__2363__auto____6435)];
      if(or__3824__auto____6436) {
        return or__3824__auto____6436
      }else {
        var or__3824__auto____6437 = cljs.core._key["_"];
        if(or__3824__auto____6437) {
          return or__3824__auto____6437
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6442 = coll;
    if(and__3822__auto____6442) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6442
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____6443 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6444 = cljs.core._val[goog.typeOf(x__2363__auto____6443)];
      if(or__3824__auto____6444) {
        return or__3824__auto____6444
      }else {
        var or__3824__auto____6445 = cljs.core._val["_"];
        if(or__3824__auto____6445) {
          return or__3824__auto____6445
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
    var and__3822__auto____6450 = coll;
    if(and__3822__auto____6450) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6450
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____6451 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6452 = cljs.core._disjoin[goog.typeOf(x__2363__auto____6451)];
      if(or__3824__auto____6452) {
        return or__3824__auto____6452
      }else {
        var or__3824__auto____6453 = cljs.core._disjoin["_"];
        if(or__3824__auto____6453) {
          return or__3824__auto____6453
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
    var and__3822__auto____6458 = coll;
    if(and__3822__auto____6458) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6458
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____6459 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6460 = cljs.core._peek[goog.typeOf(x__2363__auto____6459)];
      if(or__3824__auto____6460) {
        return or__3824__auto____6460
      }else {
        var or__3824__auto____6461 = cljs.core._peek["_"];
        if(or__3824__auto____6461) {
          return or__3824__auto____6461
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6466 = coll;
    if(and__3822__auto____6466) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6466
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____6467 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6468 = cljs.core._pop[goog.typeOf(x__2363__auto____6467)];
      if(or__3824__auto____6468) {
        return or__3824__auto____6468
      }else {
        var or__3824__auto____6469 = cljs.core._pop["_"];
        if(or__3824__auto____6469) {
          return or__3824__auto____6469
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
    var and__3822__auto____6474 = coll;
    if(and__3822__auto____6474) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6474
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____6475 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6476 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____6475)];
      if(or__3824__auto____6476) {
        return or__3824__auto____6476
      }else {
        var or__3824__auto____6477 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6477) {
          return or__3824__auto____6477
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
    var and__3822__auto____6482 = o;
    if(and__3822__auto____6482) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6482
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____6483 = o == null ? null : o;
    return function() {
      var or__3824__auto____6484 = cljs.core._deref[goog.typeOf(x__2363__auto____6483)];
      if(or__3824__auto____6484) {
        return or__3824__auto____6484
      }else {
        var or__3824__auto____6485 = cljs.core._deref["_"];
        if(or__3824__auto____6485) {
          return or__3824__auto____6485
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
    var and__3822__auto____6490 = o;
    if(and__3822__auto____6490) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6490
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____6491 = o == null ? null : o;
    return function() {
      var or__3824__auto____6492 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____6491)];
      if(or__3824__auto____6492) {
        return or__3824__auto____6492
      }else {
        var or__3824__auto____6493 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6493) {
          return or__3824__auto____6493
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
    var and__3822__auto____6498 = o;
    if(and__3822__auto____6498) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6498
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____6499 = o == null ? null : o;
    return function() {
      var or__3824__auto____6500 = cljs.core._meta[goog.typeOf(x__2363__auto____6499)];
      if(or__3824__auto____6500) {
        return or__3824__auto____6500
      }else {
        var or__3824__auto____6501 = cljs.core._meta["_"];
        if(or__3824__auto____6501) {
          return or__3824__auto____6501
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
    var and__3822__auto____6506 = o;
    if(and__3822__auto____6506) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6506
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____6507 = o == null ? null : o;
    return function() {
      var or__3824__auto____6508 = cljs.core._with_meta[goog.typeOf(x__2363__auto____6507)];
      if(or__3824__auto____6508) {
        return or__3824__auto____6508
      }else {
        var or__3824__auto____6509 = cljs.core._with_meta["_"];
        if(or__3824__auto____6509) {
          return or__3824__auto____6509
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
      var and__3822__auto____6518 = coll;
      if(and__3822__auto____6518) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6518
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____6519 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6520 = cljs.core._reduce[goog.typeOf(x__2363__auto____6519)];
        if(or__3824__auto____6520) {
          return or__3824__auto____6520
        }else {
          var or__3824__auto____6521 = cljs.core._reduce["_"];
          if(or__3824__auto____6521) {
            return or__3824__auto____6521
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6522 = coll;
      if(and__3822__auto____6522) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6522
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____6523 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6524 = cljs.core._reduce[goog.typeOf(x__2363__auto____6523)];
        if(or__3824__auto____6524) {
          return or__3824__auto____6524
        }else {
          var or__3824__auto____6525 = cljs.core._reduce["_"];
          if(or__3824__auto____6525) {
            return or__3824__auto____6525
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
    var and__3822__auto____6530 = coll;
    if(and__3822__auto____6530) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6530
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____6531 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6532 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____6531)];
      if(or__3824__auto____6532) {
        return or__3824__auto____6532
      }else {
        var or__3824__auto____6533 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6533) {
          return or__3824__auto____6533
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
    var and__3822__auto____6538 = o;
    if(and__3822__auto____6538) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6538
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____6539 = o == null ? null : o;
    return function() {
      var or__3824__auto____6540 = cljs.core._equiv[goog.typeOf(x__2363__auto____6539)];
      if(or__3824__auto____6540) {
        return or__3824__auto____6540
      }else {
        var or__3824__auto____6541 = cljs.core._equiv["_"];
        if(or__3824__auto____6541) {
          return or__3824__auto____6541
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
    var and__3822__auto____6546 = o;
    if(and__3822__auto____6546) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6546
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____6547 = o == null ? null : o;
    return function() {
      var or__3824__auto____6548 = cljs.core._hash[goog.typeOf(x__2363__auto____6547)];
      if(or__3824__auto____6548) {
        return or__3824__auto____6548
      }else {
        var or__3824__auto____6549 = cljs.core._hash["_"];
        if(or__3824__auto____6549) {
          return or__3824__auto____6549
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
    var and__3822__auto____6554 = o;
    if(and__3822__auto____6554) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6554
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____6555 = o == null ? null : o;
    return function() {
      var or__3824__auto____6556 = cljs.core._seq[goog.typeOf(x__2363__auto____6555)];
      if(or__3824__auto____6556) {
        return or__3824__auto____6556
      }else {
        var or__3824__auto____6557 = cljs.core._seq["_"];
        if(or__3824__auto____6557) {
          return or__3824__auto____6557
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
    var and__3822__auto____6562 = coll;
    if(and__3822__auto____6562) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6562
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____6563 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6564 = cljs.core._rseq[goog.typeOf(x__2363__auto____6563)];
      if(or__3824__auto____6564) {
        return or__3824__auto____6564
      }else {
        var or__3824__auto____6565 = cljs.core._rseq["_"];
        if(or__3824__auto____6565) {
          return or__3824__auto____6565
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
    var and__3822__auto____6570 = coll;
    if(and__3822__auto____6570) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6570
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____6571 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6572 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____6571)];
      if(or__3824__auto____6572) {
        return or__3824__auto____6572
      }else {
        var or__3824__auto____6573 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6573) {
          return or__3824__auto____6573
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6578 = coll;
    if(and__3822__auto____6578) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6578
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____6579 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6580 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____6579)];
      if(or__3824__auto____6580) {
        return or__3824__auto____6580
      }else {
        var or__3824__auto____6581 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6581) {
          return or__3824__auto____6581
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6586 = coll;
    if(and__3822__auto____6586) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6586
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____6587 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6588 = cljs.core._entry_key[goog.typeOf(x__2363__auto____6587)];
      if(or__3824__auto____6588) {
        return or__3824__auto____6588
      }else {
        var or__3824__auto____6589 = cljs.core._entry_key["_"];
        if(or__3824__auto____6589) {
          return or__3824__auto____6589
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6594 = coll;
    if(and__3822__auto____6594) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6594
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____6595 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6596 = cljs.core._comparator[goog.typeOf(x__2363__auto____6595)];
      if(or__3824__auto____6596) {
        return or__3824__auto____6596
      }else {
        var or__3824__auto____6597 = cljs.core._comparator["_"];
        if(or__3824__auto____6597) {
          return or__3824__auto____6597
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
    var and__3822__auto____6602 = o;
    if(and__3822__auto____6602) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6602
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____6603 = o == null ? null : o;
    return function() {
      var or__3824__auto____6604 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____6603)];
      if(or__3824__auto____6604) {
        return or__3824__auto____6604
      }else {
        var or__3824__auto____6605 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6605) {
          return or__3824__auto____6605
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
    var and__3822__auto____6610 = d;
    if(and__3822__auto____6610) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6610
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____6611 = d == null ? null : d;
    return function() {
      var or__3824__auto____6612 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____6611)];
      if(or__3824__auto____6612) {
        return or__3824__auto____6612
      }else {
        var or__3824__auto____6613 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6613) {
          return or__3824__auto____6613
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
    var and__3822__auto____6618 = this$;
    if(and__3822__auto____6618) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6618
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____6619 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6620 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____6619)];
      if(or__3824__auto____6620) {
        return or__3824__auto____6620
      }else {
        var or__3824__auto____6621 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6621) {
          return or__3824__auto____6621
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6626 = this$;
    if(and__3822__auto____6626) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6626
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____6627 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6628 = cljs.core._add_watch[goog.typeOf(x__2363__auto____6627)];
      if(or__3824__auto____6628) {
        return or__3824__auto____6628
      }else {
        var or__3824__auto____6629 = cljs.core._add_watch["_"];
        if(or__3824__auto____6629) {
          return or__3824__auto____6629
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6634 = this$;
    if(and__3822__auto____6634) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6634
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____6635 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6636 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____6635)];
      if(or__3824__auto____6636) {
        return or__3824__auto____6636
      }else {
        var or__3824__auto____6637 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6637) {
          return or__3824__auto____6637
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
    var and__3822__auto____6642 = coll;
    if(and__3822__auto____6642) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6642
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____6643 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6644 = cljs.core._as_transient[goog.typeOf(x__2363__auto____6643)];
      if(or__3824__auto____6644) {
        return or__3824__auto____6644
      }else {
        var or__3824__auto____6645 = cljs.core._as_transient["_"];
        if(or__3824__auto____6645) {
          return or__3824__auto____6645
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
    var and__3822__auto____6650 = tcoll;
    if(and__3822__auto____6650) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6650
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____6651 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6652 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____6651)];
      if(or__3824__auto____6652) {
        return or__3824__auto____6652
      }else {
        var or__3824__auto____6653 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6653) {
          return or__3824__auto____6653
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6658 = tcoll;
    if(and__3822__auto____6658) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6658
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6659 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6660 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____6659)];
      if(or__3824__auto____6660) {
        return or__3824__auto____6660
      }else {
        var or__3824__auto____6661 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6661) {
          return or__3824__auto____6661
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
    var and__3822__auto____6666 = tcoll;
    if(and__3822__auto____6666) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6666
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____6667 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6668 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____6667)];
      if(or__3824__auto____6668) {
        return or__3824__auto____6668
      }else {
        var or__3824__auto____6669 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6669) {
          return or__3824__auto____6669
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
    var and__3822__auto____6674 = tcoll;
    if(and__3822__auto____6674) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6674
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____6675 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6676 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____6675)];
      if(or__3824__auto____6676) {
        return or__3824__auto____6676
      }else {
        var or__3824__auto____6677 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6677) {
          return or__3824__auto____6677
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
    var and__3822__auto____6682 = tcoll;
    if(and__3822__auto____6682) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6682
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____6683 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6684 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____6683)];
      if(or__3824__auto____6684) {
        return or__3824__auto____6684
      }else {
        var or__3824__auto____6685 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6685) {
          return or__3824__auto____6685
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6690 = tcoll;
    if(and__3822__auto____6690) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6690
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6691 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6692 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____6691)];
      if(or__3824__auto____6692) {
        return or__3824__auto____6692
      }else {
        var or__3824__auto____6693 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6693) {
          return or__3824__auto____6693
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
    var and__3822__auto____6698 = tcoll;
    if(and__3822__auto____6698) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6698
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____6699 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6700 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____6699)];
      if(or__3824__auto____6700) {
        return or__3824__auto____6700
      }else {
        var or__3824__auto____6701 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6701) {
          return or__3824__auto____6701
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
    var and__3822__auto____6706 = x;
    if(and__3822__auto____6706) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6706
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____6707 = x == null ? null : x;
    return function() {
      var or__3824__auto____6708 = cljs.core._compare[goog.typeOf(x__2363__auto____6707)];
      if(or__3824__auto____6708) {
        return or__3824__auto____6708
      }else {
        var or__3824__auto____6709 = cljs.core._compare["_"];
        if(or__3824__auto____6709) {
          return or__3824__auto____6709
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
    var and__3822__auto____6714 = coll;
    if(and__3822__auto____6714) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6714
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____6715 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6716 = cljs.core._drop_first[goog.typeOf(x__2363__auto____6715)];
      if(or__3824__auto____6716) {
        return or__3824__auto____6716
      }else {
        var or__3824__auto____6717 = cljs.core._drop_first["_"];
        if(or__3824__auto____6717) {
          return or__3824__auto____6717
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
    var and__3822__auto____6722 = coll;
    if(and__3822__auto____6722) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6722
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____6723 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6724 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____6723)];
      if(or__3824__auto____6724) {
        return or__3824__auto____6724
      }else {
        var or__3824__auto____6725 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6725) {
          return or__3824__auto____6725
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6730 = coll;
    if(and__3822__auto____6730) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6730
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____6731 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6732 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____6731)];
      if(or__3824__auto____6732) {
        return or__3824__auto____6732
      }else {
        var or__3824__auto____6733 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6733) {
          return or__3824__auto____6733
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
    var and__3822__auto____6738 = coll;
    if(and__3822__auto____6738) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6738
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____6739 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6740 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____6739)];
      if(or__3824__auto____6740) {
        return or__3824__auto____6740
      }else {
        var or__3824__auto____6741 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6741) {
          return or__3824__auto____6741
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
    var or__3824__auto____6743 = x === y;
    if(or__3824__auto____6743) {
      return or__3824__auto____6743
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6744__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6745 = y;
            var G__6746 = cljs.core.first.call(null, more);
            var G__6747 = cljs.core.next.call(null, more);
            x = G__6745;
            y = G__6746;
            more = G__6747;
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
    var G__6744 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6744__delegate.call(this, x, y, more)
    };
    G__6744.cljs$lang$maxFixedArity = 2;
    G__6744.cljs$lang$applyTo = function(arglist__6748) {
      var x = cljs.core.first(arglist__6748);
      var y = cljs.core.first(cljs.core.next(arglist__6748));
      var more = cljs.core.rest(cljs.core.next(arglist__6748));
      return G__6744__delegate(x, y, more)
    };
    G__6744.cljs$lang$arity$variadic = G__6744__delegate;
    return G__6744
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
  var G__6749 = null;
  var G__6749__2 = function(o, k) {
    return null
  };
  var G__6749__3 = function(o, k, not_found) {
    return not_found
  };
  G__6749 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6749__2.call(this, o, k);
      case 3:
        return G__6749__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6749
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
  var G__6750 = null;
  var G__6750__2 = function(_, f) {
    return f.call(null)
  };
  var G__6750__3 = function(_, f, start) {
    return start
  };
  G__6750 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6750__2.call(this, _, f);
      case 3:
        return G__6750__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6750
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
  var G__6751 = null;
  var G__6751__2 = function(_, n) {
    return null
  };
  var G__6751__3 = function(_, n, not_found) {
    return not_found
  };
  G__6751 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6751__2.call(this, _, n);
      case 3:
        return G__6751__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6751
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
  var and__3822__auto____6752 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6752) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6752
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
    var cnt__6765 = cljs.core._count.call(null, cicoll);
    if(cnt__6765 === 0) {
      return f.call(null)
    }else {
      var val__6766 = cljs.core._nth.call(null, cicoll, 0);
      var n__6767 = 1;
      while(true) {
        if(n__6767 < cnt__6765) {
          var nval__6768 = f.call(null, val__6766, cljs.core._nth.call(null, cicoll, n__6767));
          if(cljs.core.reduced_QMARK_.call(null, nval__6768)) {
            return cljs.core.deref.call(null, nval__6768)
          }else {
            var G__6777 = nval__6768;
            var G__6778 = n__6767 + 1;
            val__6766 = G__6777;
            n__6767 = G__6778;
            continue
          }
        }else {
          return val__6766
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6769 = cljs.core._count.call(null, cicoll);
    var val__6770 = val;
    var n__6771 = 0;
    while(true) {
      if(n__6771 < cnt__6769) {
        var nval__6772 = f.call(null, val__6770, cljs.core._nth.call(null, cicoll, n__6771));
        if(cljs.core.reduced_QMARK_.call(null, nval__6772)) {
          return cljs.core.deref.call(null, nval__6772)
        }else {
          var G__6779 = nval__6772;
          var G__6780 = n__6771 + 1;
          val__6770 = G__6779;
          n__6771 = G__6780;
          continue
        }
      }else {
        return val__6770
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6773 = cljs.core._count.call(null, cicoll);
    var val__6774 = val;
    var n__6775 = idx;
    while(true) {
      if(n__6775 < cnt__6773) {
        var nval__6776 = f.call(null, val__6774, cljs.core._nth.call(null, cicoll, n__6775));
        if(cljs.core.reduced_QMARK_.call(null, nval__6776)) {
          return cljs.core.deref.call(null, nval__6776)
        }else {
          var G__6781 = nval__6776;
          var G__6782 = n__6775 + 1;
          val__6774 = G__6781;
          n__6775 = G__6782;
          continue
        }
      }else {
        return val__6774
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
    var cnt__6795 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6796 = arr[0];
      var n__6797 = 1;
      while(true) {
        if(n__6797 < cnt__6795) {
          var nval__6798 = f.call(null, val__6796, arr[n__6797]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6798)) {
            return cljs.core.deref.call(null, nval__6798)
          }else {
            var G__6807 = nval__6798;
            var G__6808 = n__6797 + 1;
            val__6796 = G__6807;
            n__6797 = G__6808;
            continue
          }
        }else {
          return val__6796
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6799 = arr.length;
    var val__6800 = val;
    var n__6801 = 0;
    while(true) {
      if(n__6801 < cnt__6799) {
        var nval__6802 = f.call(null, val__6800, arr[n__6801]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6802)) {
          return cljs.core.deref.call(null, nval__6802)
        }else {
          var G__6809 = nval__6802;
          var G__6810 = n__6801 + 1;
          val__6800 = G__6809;
          n__6801 = G__6810;
          continue
        }
      }else {
        return val__6800
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6803 = arr.length;
    var val__6804 = val;
    var n__6805 = idx;
    while(true) {
      if(n__6805 < cnt__6803) {
        var nval__6806 = f.call(null, val__6804, arr[n__6805]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6806)) {
          return cljs.core.deref.call(null, nval__6806)
        }else {
          var G__6811 = nval__6806;
          var G__6812 = n__6805 + 1;
          val__6804 = G__6811;
          n__6805 = G__6812;
          continue
        }
      }else {
        return val__6804
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
  var this__6813 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6814 = this;
  if(this__6814.i + 1 < this__6814.a.length) {
    return new cljs.core.IndexedSeq(this__6814.a, this__6814.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6815 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6816 = this;
  var c__6817 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6817 > 0) {
    return new cljs.core.RSeq(coll, c__6817 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6818 = this;
  var this__6819 = this;
  return cljs.core.pr_str.call(null, this__6819)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6820 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6820.a)) {
    return cljs.core.ci_reduce.call(null, this__6820.a, f, this__6820.a[this__6820.i], this__6820.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6820.a[this__6820.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6821 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6821.a)) {
    return cljs.core.ci_reduce.call(null, this__6821.a, f, start, this__6821.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6822 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6823 = this;
  return this__6823.a.length - this__6823.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6824 = this;
  return this__6824.a[this__6824.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6825 = this;
  if(this__6825.i + 1 < this__6825.a.length) {
    return new cljs.core.IndexedSeq(this__6825.a, this__6825.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6826 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6827 = this;
  var i__6828 = n + this__6827.i;
  if(i__6828 < this__6827.a.length) {
    return this__6827.a[i__6828]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6829 = this;
  var i__6830 = n + this__6829.i;
  if(i__6830 < this__6829.a.length) {
    return this__6829.a[i__6830]
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
  var G__6831 = null;
  var G__6831__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6831__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6831 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6831__2.call(this, array, f);
      case 3:
        return G__6831__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6831
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6832 = null;
  var G__6832__2 = function(array, k) {
    return array[k]
  };
  var G__6832__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6832 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6832__2.call(this, array, k);
      case 3:
        return G__6832__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6832
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6833 = null;
  var G__6833__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6833__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6833 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6833__2.call(this, array, n);
      case 3:
        return G__6833__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6833
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
  var this__6834 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6835 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6836 = this;
  var this__6837 = this;
  return cljs.core.pr_str.call(null, this__6837)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6838 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6839 = this;
  return this__6839.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6840 = this;
  return cljs.core._nth.call(null, this__6840.ci, this__6840.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6841 = this;
  if(this__6841.i > 0) {
    return new cljs.core.RSeq(this__6841.ci, this__6841.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6842 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6843 = this;
  return new cljs.core.RSeq(this__6843.ci, this__6843.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6844 = this;
  return this__6844.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6848__6849 = coll;
      if(G__6848__6849) {
        if(function() {
          var or__3824__auto____6850 = G__6848__6849.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6850) {
            return or__3824__auto____6850
          }else {
            return G__6848__6849.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6848__6849.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6848__6849)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6848__6849)
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
      var G__6855__6856 = coll;
      if(G__6855__6856) {
        if(function() {
          var or__3824__auto____6857 = G__6855__6856.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6857) {
            return or__3824__auto____6857
          }else {
            return G__6855__6856.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6855__6856.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6855__6856)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6855__6856)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6858 = cljs.core.seq.call(null, coll);
      if(s__6858 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6858)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6863__6864 = coll;
      if(G__6863__6864) {
        if(function() {
          var or__3824__auto____6865 = G__6863__6864.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6865) {
            return or__3824__auto____6865
          }else {
            return G__6863__6864.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6863__6864.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6863__6864)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6863__6864)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6866 = cljs.core.seq.call(null, coll);
      if(!(s__6866 == null)) {
        return cljs.core._rest.call(null, s__6866)
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
      var G__6870__6871 = coll;
      if(G__6870__6871) {
        if(function() {
          var or__3824__auto____6872 = G__6870__6871.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6872) {
            return or__3824__auto____6872
          }else {
            return G__6870__6871.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6870__6871.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6870__6871)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6870__6871)
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
    var sn__6874 = cljs.core.next.call(null, s);
    if(!(sn__6874 == null)) {
      var G__6875 = sn__6874;
      s = G__6875;
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
    var G__6876__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6877 = conj.call(null, coll, x);
          var G__6878 = cljs.core.first.call(null, xs);
          var G__6879 = cljs.core.next.call(null, xs);
          coll = G__6877;
          x = G__6878;
          xs = G__6879;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6876 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6876__delegate.call(this, coll, x, xs)
    };
    G__6876.cljs$lang$maxFixedArity = 2;
    G__6876.cljs$lang$applyTo = function(arglist__6880) {
      var coll = cljs.core.first(arglist__6880);
      var x = cljs.core.first(cljs.core.next(arglist__6880));
      var xs = cljs.core.rest(cljs.core.next(arglist__6880));
      return G__6876__delegate(coll, x, xs)
    };
    G__6876.cljs$lang$arity$variadic = G__6876__delegate;
    return G__6876
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
  var s__6883 = cljs.core.seq.call(null, coll);
  var acc__6884 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6883)) {
      return acc__6884 + cljs.core._count.call(null, s__6883)
    }else {
      var G__6885 = cljs.core.next.call(null, s__6883);
      var G__6886 = acc__6884 + 1;
      s__6883 = G__6885;
      acc__6884 = G__6886;
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
        var G__6893__6894 = coll;
        if(G__6893__6894) {
          if(function() {
            var or__3824__auto____6895 = G__6893__6894.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6895) {
              return or__3824__auto____6895
            }else {
              return G__6893__6894.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6893__6894.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6893__6894)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6893__6894)
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
        var G__6896__6897 = coll;
        if(G__6896__6897) {
          if(function() {
            var or__3824__auto____6898 = G__6896__6897.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6898) {
              return or__3824__auto____6898
            }else {
              return G__6896__6897.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6896__6897.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6896__6897)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6896__6897)
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
    var G__6901__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6900 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6902 = ret__6900;
          var G__6903 = cljs.core.first.call(null, kvs);
          var G__6904 = cljs.core.second.call(null, kvs);
          var G__6905 = cljs.core.nnext.call(null, kvs);
          coll = G__6902;
          k = G__6903;
          v = G__6904;
          kvs = G__6905;
          continue
        }else {
          return ret__6900
        }
        break
      }
    };
    var G__6901 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6901__delegate.call(this, coll, k, v, kvs)
    };
    G__6901.cljs$lang$maxFixedArity = 3;
    G__6901.cljs$lang$applyTo = function(arglist__6906) {
      var coll = cljs.core.first(arglist__6906);
      var k = cljs.core.first(cljs.core.next(arglist__6906));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6906)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6906)));
      return G__6901__delegate(coll, k, v, kvs)
    };
    G__6901.cljs$lang$arity$variadic = G__6901__delegate;
    return G__6901
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
    var G__6909__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6908 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6910 = ret__6908;
          var G__6911 = cljs.core.first.call(null, ks);
          var G__6912 = cljs.core.next.call(null, ks);
          coll = G__6910;
          k = G__6911;
          ks = G__6912;
          continue
        }else {
          return ret__6908
        }
        break
      }
    };
    var G__6909 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6909__delegate.call(this, coll, k, ks)
    };
    G__6909.cljs$lang$maxFixedArity = 2;
    G__6909.cljs$lang$applyTo = function(arglist__6913) {
      var coll = cljs.core.first(arglist__6913);
      var k = cljs.core.first(cljs.core.next(arglist__6913));
      var ks = cljs.core.rest(cljs.core.next(arglist__6913));
      return G__6909__delegate(coll, k, ks)
    };
    G__6909.cljs$lang$arity$variadic = G__6909__delegate;
    return G__6909
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
    var G__6917__6918 = o;
    if(G__6917__6918) {
      if(function() {
        var or__3824__auto____6919 = G__6917__6918.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6919) {
          return or__3824__auto____6919
        }else {
          return G__6917__6918.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6917__6918.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6917__6918)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6917__6918)
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
    var G__6922__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6921 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6923 = ret__6921;
          var G__6924 = cljs.core.first.call(null, ks);
          var G__6925 = cljs.core.next.call(null, ks);
          coll = G__6923;
          k = G__6924;
          ks = G__6925;
          continue
        }else {
          return ret__6921
        }
        break
      }
    };
    var G__6922 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6922__delegate.call(this, coll, k, ks)
    };
    G__6922.cljs$lang$maxFixedArity = 2;
    G__6922.cljs$lang$applyTo = function(arglist__6926) {
      var coll = cljs.core.first(arglist__6926);
      var k = cljs.core.first(cljs.core.next(arglist__6926));
      var ks = cljs.core.rest(cljs.core.next(arglist__6926));
      return G__6922__delegate(coll, k, ks)
    };
    G__6922.cljs$lang$arity$variadic = G__6922__delegate;
    return G__6922
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
  var h__6928 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6928;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6928
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6930 = cljs.core.string_hash_cache[k];
  if(!(h__6930 == null)) {
    return h__6930
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
      var and__3822__auto____6932 = goog.isString(o);
      if(and__3822__auto____6932) {
        return check_cache
      }else {
        return and__3822__auto____6932
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
    var G__6936__6937 = x;
    if(G__6936__6937) {
      if(function() {
        var or__3824__auto____6938 = G__6936__6937.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6938) {
          return or__3824__auto____6938
        }else {
          return G__6936__6937.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6936__6937.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6936__6937)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6936__6937)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6942__6943 = x;
    if(G__6942__6943) {
      if(function() {
        var or__3824__auto____6944 = G__6942__6943.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6944) {
          return or__3824__auto____6944
        }else {
          return G__6942__6943.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6942__6943.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6942__6943)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6942__6943)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6948__6949 = x;
  if(G__6948__6949) {
    if(function() {
      var or__3824__auto____6950 = G__6948__6949.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6950) {
        return or__3824__auto____6950
      }else {
        return G__6948__6949.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6948__6949.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6948__6949)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6948__6949)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6954__6955 = x;
  if(G__6954__6955) {
    if(function() {
      var or__3824__auto____6956 = G__6954__6955.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6956) {
        return or__3824__auto____6956
      }else {
        return G__6954__6955.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6954__6955.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6954__6955)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6954__6955)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6960__6961 = x;
  if(G__6960__6961) {
    if(function() {
      var or__3824__auto____6962 = G__6960__6961.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6962) {
        return or__3824__auto____6962
      }else {
        return G__6960__6961.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6960__6961.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6960__6961)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6960__6961)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6966__6967 = x;
  if(G__6966__6967) {
    if(function() {
      var or__3824__auto____6968 = G__6966__6967.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6968) {
        return or__3824__auto____6968
      }else {
        return G__6966__6967.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6966__6967.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6966__6967)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6966__6967)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6972__6973 = x;
  if(G__6972__6973) {
    if(function() {
      var or__3824__auto____6974 = G__6972__6973.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6974) {
        return or__3824__auto____6974
      }else {
        return G__6972__6973.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6972__6973.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6972__6973)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6972__6973)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6978__6979 = x;
    if(G__6978__6979) {
      if(function() {
        var or__3824__auto____6980 = G__6978__6979.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6980) {
          return or__3824__auto____6980
        }else {
          return G__6978__6979.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6978__6979.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6978__6979)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6978__6979)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6984__6985 = x;
  if(G__6984__6985) {
    if(function() {
      var or__3824__auto____6986 = G__6984__6985.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6986) {
        return or__3824__auto____6986
      }else {
        return G__6984__6985.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6984__6985.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6984__6985)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6984__6985)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6990__6991 = x;
  if(G__6990__6991) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6992 = null;
      if(cljs.core.truth_(or__3824__auto____6992)) {
        return or__3824__auto____6992
      }else {
        return G__6990__6991.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6990__6991.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6990__6991)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6990__6991)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6993__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6993 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6993__delegate.call(this, keyvals)
    };
    G__6993.cljs$lang$maxFixedArity = 0;
    G__6993.cljs$lang$applyTo = function(arglist__6994) {
      var keyvals = cljs.core.seq(arglist__6994);
      return G__6993__delegate(keyvals)
    };
    G__6993.cljs$lang$arity$variadic = G__6993__delegate;
    return G__6993
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
  var keys__6996 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6996.push(key)
  });
  return keys__6996
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7000 = i;
  var j__7001 = j;
  var len__7002 = len;
  while(true) {
    if(len__7002 === 0) {
      return to
    }else {
      to[j__7001] = from[i__7000];
      var G__7003 = i__7000 + 1;
      var G__7004 = j__7001 + 1;
      var G__7005 = len__7002 - 1;
      i__7000 = G__7003;
      j__7001 = G__7004;
      len__7002 = G__7005;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7009 = i + (len - 1);
  var j__7010 = j + (len - 1);
  var len__7011 = len;
  while(true) {
    if(len__7011 === 0) {
      return to
    }else {
      to[j__7010] = from[i__7009];
      var G__7012 = i__7009 - 1;
      var G__7013 = j__7010 - 1;
      var G__7014 = len__7011 - 1;
      i__7009 = G__7012;
      j__7010 = G__7013;
      len__7011 = G__7014;
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
    var G__7018__7019 = s;
    if(G__7018__7019) {
      if(function() {
        var or__3824__auto____7020 = G__7018__7019.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7020) {
          return or__3824__auto____7020
        }else {
          return G__7018__7019.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7018__7019.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7018__7019)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7018__7019)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7024__7025 = s;
  if(G__7024__7025) {
    if(function() {
      var or__3824__auto____7026 = G__7024__7025.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7026) {
        return or__3824__auto____7026
      }else {
        return G__7024__7025.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7024__7025.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7024__7025)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7024__7025)
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
  var and__3822__auto____7029 = goog.isString(x);
  if(and__3822__auto____7029) {
    return!function() {
      var or__3824__auto____7030 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7030) {
        return or__3824__auto____7030
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7029
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7032 = goog.isString(x);
  if(and__3822__auto____7032) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7032
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7034 = goog.isString(x);
  if(and__3822__auto____7034) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7034
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7039 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7039) {
    return or__3824__auto____7039
  }else {
    var G__7040__7041 = f;
    if(G__7040__7041) {
      if(function() {
        var or__3824__auto____7042 = G__7040__7041.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7042) {
          return or__3824__auto____7042
        }else {
          return G__7040__7041.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7040__7041.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7040__7041)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7040__7041)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7044 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7044) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7044
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
    var and__3822__auto____7047 = coll;
    if(cljs.core.truth_(and__3822__auto____7047)) {
      var and__3822__auto____7048 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7048) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7048
      }
    }else {
      return and__3822__auto____7047
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
    var G__7057__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7053 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7054 = more;
        while(true) {
          var x__7055 = cljs.core.first.call(null, xs__7054);
          var etc__7056 = cljs.core.next.call(null, xs__7054);
          if(cljs.core.truth_(xs__7054)) {
            if(cljs.core.contains_QMARK_.call(null, s__7053, x__7055)) {
              return false
            }else {
              var G__7058 = cljs.core.conj.call(null, s__7053, x__7055);
              var G__7059 = etc__7056;
              s__7053 = G__7058;
              xs__7054 = G__7059;
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
    var G__7057 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7057__delegate.call(this, x, y, more)
    };
    G__7057.cljs$lang$maxFixedArity = 2;
    G__7057.cljs$lang$applyTo = function(arglist__7060) {
      var x = cljs.core.first(arglist__7060);
      var y = cljs.core.first(cljs.core.next(arglist__7060));
      var more = cljs.core.rest(cljs.core.next(arglist__7060));
      return G__7057__delegate(x, y, more)
    };
    G__7057.cljs$lang$arity$variadic = G__7057__delegate;
    return G__7057
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
            var G__7064__7065 = x;
            if(G__7064__7065) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7066 = null;
                if(cljs.core.truth_(or__3824__auto____7066)) {
                  return or__3824__auto____7066
                }else {
                  return G__7064__7065.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7064__7065.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7064__7065)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7064__7065)
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
    var xl__7071 = cljs.core.count.call(null, xs);
    var yl__7072 = cljs.core.count.call(null, ys);
    if(xl__7071 < yl__7072) {
      return-1
    }else {
      if(xl__7071 > yl__7072) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7071, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7073 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7074 = d__7073 === 0;
        if(and__3822__auto____7074) {
          return n + 1 < len
        }else {
          return and__3822__auto____7074
        }
      }()) {
        var G__7075 = xs;
        var G__7076 = ys;
        var G__7077 = len;
        var G__7078 = n + 1;
        xs = G__7075;
        ys = G__7076;
        len = G__7077;
        n = G__7078;
        continue
      }else {
        return d__7073
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
      var r__7080 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7080)) {
        return r__7080
      }else {
        if(cljs.core.truth_(r__7080)) {
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
      var a__7082 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7082, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7082)
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
    var temp__3971__auto____7088 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7088) {
      var s__7089 = temp__3971__auto____7088;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7089), cljs.core.next.call(null, s__7089))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7090 = val;
    var coll__7091 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7091) {
        var nval__7092 = f.call(null, val__7090, cljs.core.first.call(null, coll__7091));
        if(cljs.core.reduced_QMARK_.call(null, nval__7092)) {
          return cljs.core.deref.call(null, nval__7092)
        }else {
          var G__7093 = nval__7092;
          var G__7094 = cljs.core.next.call(null, coll__7091);
          val__7090 = G__7093;
          coll__7091 = G__7094;
          continue
        }
      }else {
        return val__7090
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
  var a__7096 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7096);
  return cljs.core.vec.call(null, a__7096)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7103__7104 = coll;
      if(G__7103__7104) {
        if(function() {
          var or__3824__auto____7105 = G__7103__7104.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7105) {
            return or__3824__auto____7105
          }else {
            return G__7103__7104.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7103__7104.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7103__7104)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7103__7104)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7106__7107 = coll;
      if(G__7106__7107) {
        if(function() {
          var or__3824__auto____7108 = G__7106__7107.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7108) {
            return or__3824__auto____7108
          }else {
            return G__7106__7107.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7106__7107.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7106__7107)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7106__7107)
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
  var this__7109 = this;
  return this__7109.val
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
    var G__7110__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7110 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7110__delegate.call(this, x, y, more)
    };
    G__7110.cljs$lang$maxFixedArity = 2;
    G__7110.cljs$lang$applyTo = function(arglist__7111) {
      var x = cljs.core.first(arglist__7111);
      var y = cljs.core.first(cljs.core.next(arglist__7111));
      var more = cljs.core.rest(cljs.core.next(arglist__7111));
      return G__7110__delegate(x, y, more)
    };
    G__7110.cljs$lang$arity$variadic = G__7110__delegate;
    return G__7110
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
    var G__7112__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7112 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7112__delegate.call(this, x, y, more)
    };
    G__7112.cljs$lang$maxFixedArity = 2;
    G__7112.cljs$lang$applyTo = function(arglist__7113) {
      var x = cljs.core.first(arglist__7113);
      var y = cljs.core.first(cljs.core.next(arglist__7113));
      var more = cljs.core.rest(cljs.core.next(arglist__7113));
      return G__7112__delegate(x, y, more)
    };
    G__7112.cljs$lang$arity$variadic = G__7112__delegate;
    return G__7112
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
    var G__7114__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7114 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7114__delegate.call(this, x, y, more)
    };
    G__7114.cljs$lang$maxFixedArity = 2;
    G__7114.cljs$lang$applyTo = function(arglist__7115) {
      var x = cljs.core.first(arglist__7115);
      var y = cljs.core.first(cljs.core.next(arglist__7115));
      var more = cljs.core.rest(cljs.core.next(arglist__7115));
      return G__7114__delegate(x, y, more)
    };
    G__7114.cljs$lang$arity$variadic = G__7114__delegate;
    return G__7114
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
    var G__7116__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7116 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7116__delegate.call(this, x, y, more)
    };
    G__7116.cljs$lang$maxFixedArity = 2;
    G__7116.cljs$lang$applyTo = function(arglist__7117) {
      var x = cljs.core.first(arglist__7117);
      var y = cljs.core.first(cljs.core.next(arglist__7117));
      var more = cljs.core.rest(cljs.core.next(arglist__7117));
      return G__7116__delegate(x, y, more)
    };
    G__7116.cljs$lang$arity$variadic = G__7116__delegate;
    return G__7116
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
    var G__7118__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7119 = y;
            var G__7120 = cljs.core.first.call(null, more);
            var G__7121 = cljs.core.next.call(null, more);
            x = G__7119;
            y = G__7120;
            more = G__7121;
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
    var G__7118 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7118__delegate.call(this, x, y, more)
    };
    G__7118.cljs$lang$maxFixedArity = 2;
    G__7118.cljs$lang$applyTo = function(arglist__7122) {
      var x = cljs.core.first(arglist__7122);
      var y = cljs.core.first(cljs.core.next(arglist__7122));
      var more = cljs.core.rest(cljs.core.next(arglist__7122));
      return G__7118__delegate(x, y, more)
    };
    G__7118.cljs$lang$arity$variadic = G__7118__delegate;
    return G__7118
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
    var G__7123__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7124 = y;
            var G__7125 = cljs.core.first.call(null, more);
            var G__7126 = cljs.core.next.call(null, more);
            x = G__7124;
            y = G__7125;
            more = G__7126;
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
    var G__7123 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7123__delegate.call(this, x, y, more)
    };
    G__7123.cljs$lang$maxFixedArity = 2;
    G__7123.cljs$lang$applyTo = function(arglist__7127) {
      var x = cljs.core.first(arglist__7127);
      var y = cljs.core.first(cljs.core.next(arglist__7127));
      var more = cljs.core.rest(cljs.core.next(arglist__7127));
      return G__7123__delegate(x, y, more)
    };
    G__7123.cljs$lang$arity$variadic = G__7123__delegate;
    return G__7123
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
    var G__7128__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7129 = y;
            var G__7130 = cljs.core.first.call(null, more);
            var G__7131 = cljs.core.next.call(null, more);
            x = G__7129;
            y = G__7130;
            more = G__7131;
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
    var G__7128 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7128__delegate.call(this, x, y, more)
    };
    G__7128.cljs$lang$maxFixedArity = 2;
    G__7128.cljs$lang$applyTo = function(arglist__7132) {
      var x = cljs.core.first(arglist__7132);
      var y = cljs.core.first(cljs.core.next(arglist__7132));
      var more = cljs.core.rest(cljs.core.next(arglist__7132));
      return G__7128__delegate(x, y, more)
    };
    G__7128.cljs$lang$arity$variadic = G__7128__delegate;
    return G__7128
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
    var G__7133__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7134 = y;
            var G__7135 = cljs.core.first.call(null, more);
            var G__7136 = cljs.core.next.call(null, more);
            x = G__7134;
            y = G__7135;
            more = G__7136;
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
    var G__7133 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7133__delegate.call(this, x, y, more)
    };
    G__7133.cljs$lang$maxFixedArity = 2;
    G__7133.cljs$lang$applyTo = function(arglist__7137) {
      var x = cljs.core.first(arglist__7137);
      var y = cljs.core.first(cljs.core.next(arglist__7137));
      var more = cljs.core.rest(cljs.core.next(arglist__7137));
      return G__7133__delegate(x, y, more)
    };
    G__7133.cljs$lang$arity$variadic = G__7133__delegate;
    return G__7133
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
    var G__7138__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7138 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7138__delegate.call(this, x, y, more)
    };
    G__7138.cljs$lang$maxFixedArity = 2;
    G__7138.cljs$lang$applyTo = function(arglist__7139) {
      var x = cljs.core.first(arglist__7139);
      var y = cljs.core.first(cljs.core.next(arglist__7139));
      var more = cljs.core.rest(cljs.core.next(arglist__7139));
      return G__7138__delegate(x, y, more)
    };
    G__7138.cljs$lang$arity$variadic = G__7138__delegate;
    return G__7138
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
    var G__7140__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7140 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7140__delegate.call(this, x, y, more)
    };
    G__7140.cljs$lang$maxFixedArity = 2;
    G__7140.cljs$lang$applyTo = function(arglist__7141) {
      var x = cljs.core.first(arglist__7141);
      var y = cljs.core.first(cljs.core.next(arglist__7141));
      var more = cljs.core.rest(cljs.core.next(arglist__7141));
      return G__7140__delegate(x, y, more)
    };
    G__7140.cljs$lang$arity$variadic = G__7140__delegate;
    return G__7140
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
  var rem__7143 = n % d;
  return cljs.core.fix.call(null, (n - rem__7143) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7145 = cljs.core.quot.call(null, n, d);
  return n - d * q__7145
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
  var v__7148 = v - (v >> 1 & 1431655765);
  var v__7149 = (v__7148 & 858993459) + (v__7148 >> 2 & 858993459);
  return(v__7149 + (v__7149 >> 4) & 252645135) * 16843009 >> 24
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
    var G__7150__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7151 = y;
            var G__7152 = cljs.core.first.call(null, more);
            var G__7153 = cljs.core.next.call(null, more);
            x = G__7151;
            y = G__7152;
            more = G__7153;
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
    var G__7150 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7150__delegate.call(this, x, y, more)
    };
    G__7150.cljs$lang$maxFixedArity = 2;
    G__7150.cljs$lang$applyTo = function(arglist__7154) {
      var x = cljs.core.first(arglist__7154);
      var y = cljs.core.first(cljs.core.next(arglist__7154));
      var more = cljs.core.rest(cljs.core.next(arglist__7154));
      return G__7150__delegate(x, y, more)
    };
    G__7150.cljs$lang$arity$variadic = G__7150__delegate;
    return G__7150
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
  var n__7158 = n;
  var xs__7159 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7160 = xs__7159;
      if(and__3822__auto____7160) {
        return n__7158 > 0
      }else {
        return and__3822__auto____7160
      }
    }())) {
      var G__7161 = n__7158 - 1;
      var G__7162 = cljs.core.next.call(null, xs__7159);
      n__7158 = G__7161;
      xs__7159 = G__7162;
      continue
    }else {
      return xs__7159
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
    var G__7163__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7164 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7165 = cljs.core.next.call(null, more);
            sb = G__7164;
            more = G__7165;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7163 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7163__delegate.call(this, x, ys)
    };
    G__7163.cljs$lang$maxFixedArity = 1;
    G__7163.cljs$lang$applyTo = function(arglist__7166) {
      var x = cljs.core.first(arglist__7166);
      var ys = cljs.core.rest(arglist__7166);
      return G__7163__delegate(x, ys)
    };
    G__7163.cljs$lang$arity$variadic = G__7163__delegate;
    return G__7163
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
    var G__7167__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7168 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7169 = cljs.core.next.call(null, more);
            sb = G__7168;
            more = G__7169;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7167 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7167__delegate.call(this, x, ys)
    };
    G__7167.cljs$lang$maxFixedArity = 1;
    G__7167.cljs$lang$applyTo = function(arglist__7170) {
      var x = cljs.core.first(arglist__7170);
      var ys = cljs.core.rest(arglist__7170);
      return G__7167__delegate(x, ys)
    };
    G__7167.cljs$lang$arity$variadic = G__7167__delegate;
    return G__7167
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
  format.cljs$lang$applyTo = function(arglist__7171) {
    var fmt = cljs.core.first(arglist__7171);
    var args = cljs.core.rest(arglist__7171);
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
    var xs__7174 = cljs.core.seq.call(null, x);
    var ys__7175 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7174 == null) {
        return ys__7175 == null
      }else {
        if(ys__7175 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7174), cljs.core.first.call(null, ys__7175))) {
            var G__7176 = cljs.core.next.call(null, xs__7174);
            var G__7177 = cljs.core.next.call(null, ys__7175);
            xs__7174 = G__7176;
            ys__7175 = G__7177;
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
  return cljs.core.reduce.call(null, function(p1__7178_SHARP_, p2__7179_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7178_SHARP_, cljs.core.hash.call(null, p2__7179_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7183 = 0;
  var s__7184 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7184) {
      var e__7185 = cljs.core.first.call(null, s__7184);
      var G__7186 = (h__7183 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7185)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7185)))) % 4503599627370496;
      var G__7187 = cljs.core.next.call(null, s__7184);
      h__7183 = G__7186;
      s__7184 = G__7187;
      continue
    }else {
      return h__7183
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7191 = 0;
  var s__7192 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7192) {
      var e__7193 = cljs.core.first.call(null, s__7192);
      var G__7194 = (h__7191 + cljs.core.hash.call(null, e__7193)) % 4503599627370496;
      var G__7195 = cljs.core.next.call(null, s__7192);
      h__7191 = G__7194;
      s__7192 = G__7195;
      continue
    }else {
      return h__7191
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7216__7217 = cljs.core.seq.call(null, fn_map);
  if(G__7216__7217) {
    var G__7219__7221 = cljs.core.first.call(null, G__7216__7217);
    var vec__7220__7222 = G__7219__7221;
    var key_name__7223 = cljs.core.nth.call(null, vec__7220__7222, 0, null);
    var f__7224 = cljs.core.nth.call(null, vec__7220__7222, 1, null);
    var G__7216__7225 = G__7216__7217;
    var G__7219__7226 = G__7219__7221;
    var G__7216__7227 = G__7216__7225;
    while(true) {
      var vec__7228__7229 = G__7219__7226;
      var key_name__7230 = cljs.core.nth.call(null, vec__7228__7229, 0, null);
      var f__7231 = cljs.core.nth.call(null, vec__7228__7229, 1, null);
      var G__7216__7232 = G__7216__7227;
      var str_name__7233 = cljs.core.name.call(null, key_name__7230);
      obj[str_name__7233] = f__7231;
      var temp__3974__auto____7234 = cljs.core.next.call(null, G__7216__7232);
      if(temp__3974__auto____7234) {
        var G__7216__7235 = temp__3974__auto____7234;
        var G__7236 = cljs.core.first.call(null, G__7216__7235);
        var G__7237 = G__7216__7235;
        G__7219__7226 = G__7236;
        G__7216__7227 = G__7237;
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
  var this__7238 = this;
  var h__2192__auto____7239 = this__7238.__hash;
  if(!(h__2192__auto____7239 == null)) {
    return h__2192__auto____7239
  }else {
    var h__2192__auto____7240 = cljs.core.hash_coll.call(null, coll);
    this__7238.__hash = h__2192__auto____7240;
    return h__2192__auto____7240
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7241 = this;
  if(this__7241.count === 1) {
    return null
  }else {
    return this__7241.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7242 = this;
  return new cljs.core.List(this__7242.meta, o, coll, this__7242.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7243 = this;
  var this__7244 = this;
  return cljs.core.pr_str.call(null, this__7244)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7245 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7246 = this;
  return this__7246.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7247 = this;
  return this__7247.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7248 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7249 = this;
  return this__7249.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7250 = this;
  if(this__7250.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7250.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7251 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7252 = this;
  return new cljs.core.List(meta, this__7252.first, this__7252.rest, this__7252.count, this__7252.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7253 = this;
  return this__7253.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7254 = this;
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
  var this__7255 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7256 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7257 = this;
  return new cljs.core.List(this__7257.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7258 = this;
  var this__7259 = this;
  return cljs.core.pr_str.call(null, this__7259)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7260 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7261 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7262 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7263 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7264 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7265 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7266 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7267 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7268 = this;
  return this__7268.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7269 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7273__7274 = coll;
  if(G__7273__7274) {
    if(function() {
      var or__3824__auto____7275 = G__7273__7274.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7275) {
        return or__3824__auto____7275
      }else {
        return G__7273__7274.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7273__7274.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7273__7274)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7273__7274)
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
    var G__7276__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7276 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7276__delegate.call(this, x, y, z, items)
    };
    G__7276.cljs$lang$maxFixedArity = 3;
    G__7276.cljs$lang$applyTo = function(arglist__7277) {
      var x = cljs.core.first(arglist__7277);
      var y = cljs.core.first(cljs.core.next(arglist__7277));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7277)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7277)));
      return G__7276__delegate(x, y, z, items)
    };
    G__7276.cljs$lang$arity$variadic = G__7276__delegate;
    return G__7276
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
  var this__7278 = this;
  var h__2192__auto____7279 = this__7278.__hash;
  if(!(h__2192__auto____7279 == null)) {
    return h__2192__auto____7279
  }else {
    var h__2192__auto____7280 = cljs.core.hash_coll.call(null, coll);
    this__7278.__hash = h__2192__auto____7280;
    return h__2192__auto____7280
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7281 = this;
  if(this__7281.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7281.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7282 = this;
  return new cljs.core.Cons(null, o, coll, this__7282.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7283 = this;
  var this__7284 = this;
  return cljs.core.pr_str.call(null, this__7284)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7285 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7286 = this;
  return this__7286.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7287 = this;
  if(this__7287.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7287.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7288 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7289 = this;
  return new cljs.core.Cons(meta, this__7289.first, this__7289.rest, this__7289.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7290 = this;
  return this__7290.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7291 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7291.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7296 = coll == null;
    if(or__3824__auto____7296) {
      return or__3824__auto____7296
    }else {
      var G__7297__7298 = coll;
      if(G__7297__7298) {
        if(function() {
          var or__3824__auto____7299 = G__7297__7298.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7299) {
            return or__3824__auto____7299
          }else {
            return G__7297__7298.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7297__7298.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7297__7298)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7297__7298)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7303__7304 = x;
  if(G__7303__7304) {
    if(function() {
      var or__3824__auto____7305 = G__7303__7304.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7305) {
        return or__3824__auto____7305
      }else {
        return G__7303__7304.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7303__7304.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7303__7304)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7303__7304)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7306 = null;
  var G__7306__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7306__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7306 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7306__2.call(this, string, f);
      case 3:
        return G__7306__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7306
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7307 = null;
  var G__7307__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7307__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7307 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7307__2.call(this, string, k);
      case 3:
        return G__7307__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7307
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7308 = null;
  var G__7308__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7308__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7308 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7308__2.call(this, string, n);
      case 3:
        return G__7308__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7308
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
  var G__7320 = null;
  var G__7320__2 = function(this_sym7311, coll) {
    var this__7313 = this;
    var this_sym7311__7314 = this;
    var ___7315 = this_sym7311__7314;
    if(coll == null) {
      return null
    }else {
      var strobj__7316 = coll.strobj;
      if(strobj__7316 == null) {
        return cljs.core._lookup.call(null, coll, this__7313.k, null)
      }else {
        return strobj__7316[this__7313.k]
      }
    }
  };
  var G__7320__3 = function(this_sym7312, coll, not_found) {
    var this__7313 = this;
    var this_sym7312__7317 = this;
    var ___7318 = this_sym7312__7317;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7313.k, not_found)
    }
  };
  G__7320 = function(this_sym7312, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7320__2.call(this, this_sym7312, coll);
      case 3:
        return G__7320__3.call(this, this_sym7312, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7320
}();
cljs.core.Keyword.prototype.apply = function(this_sym7309, args7310) {
  var this__7319 = this;
  return this_sym7309.call.apply(this_sym7309, [this_sym7309].concat(args7310.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7329 = null;
  var G__7329__2 = function(this_sym7323, coll) {
    var this_sym7323__7325 = this;
    var this__7326 = this_sym7323__7325;
    return cljs.core._lookup.call(null, coll, this__7326.toString(), null)
  };
  var G__7329__3 = function(this_sym7324, coll, not_found) {
    var this_sym7324__7327 = this;
    var this__7328 = this_sym7324__7327;
    return cljs.core._lookup.call(null, coll, this__7328.toString(), not_found)
  };
  G__7329 = function(this_sym7324, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7329__2.call(this, this_sym7324, coll);
      case 3:
        return G__7329__3.call(this, this_sym7324, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7329
}();
String.prototype.apply = function(this_sym7321, args7322) {
  return this_sym7321.call.apply(this_sym7321, [this_sym7321].concat(args7322.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7331 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7331
  }else {
    lazy_seq.x = x__7331.call(null);
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
  var this__7332 = this;
  var h__2192__auto____7333 = this__7332.__hash;
  if(!(h__2192__auto____7333 == null)) {
    return h__2192__auto____7333
  }else {
    var h__2192__auto____7334 = cljs.core.hash_coll.call(null, coll);
    this__7332.__hash = h__2192__auto____7334;
    return h__2192__auto____7334
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7335 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7336 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7337 = this;
  var this__7338 = this;
  return cljs.core.pr_str.call(null, this__7338)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7339 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7340 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7341 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7342 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7343 = this;
  return new cljs.core.LazySeq(meta, this__7343.realized, this__7343.x, this__7343.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7344 = this;
  return this__7344.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7345 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7345.meta)
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
  var this__7346 = this;
  return this__7346.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7347 = this;
  var ___7348 = this;
  this__7347.buf[this__7347.end] = o;
  return this__7347.end = this__7347.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7349 = this;
  var ___7350 = this;
  var ret__7351 = new cljs.core.ArrayChunk(this__7349.buf, 0, this__7349.end);
  this__7349.buf = null;
  return ret__7351
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
  var this__7352 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7352.arr[this__7352.off], this__7352.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7353 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7353.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7354 = this;
  if(this__7354.off === this__7354.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7354.arr, this__7354.off + 1, this__7354.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7355 = this;
  return this__7355.arr[this__7355.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7356 = this;
  if(function() {
    var and__3822__auto____7357 = i >= 0;
    if(and__3822__auto____7357) {
      return i < this__7356.end - this__7356.off
    }else {
      return and__3822__auto____7357
    }
  }()) {
    return this__7356.arr[this__7356.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7358 = this;
  return this__7358.end - this__7358.off
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
  var this__7359 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7360 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7361 = this;
  return cljs.core._nth.call(null, this__7361.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7362 = this;
  if(cljs.core._count.call(null, this__7362.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7362.chunk), this__7362.more, this__7362.meta)
  }else {
    if(this__7362.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7362.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7363 = this;
  if(this__7363.more == null) {
    return null
  }else {
    return this__7363.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7364 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7365 = this;
  return new cljs.core.ChunkedCons(this__7365.chunk, this__7365.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7366 = this;
  return this__7366.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7367 = this;
  return this__7367.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7368 = this;
  if(this__7368.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7368.more
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
    var G__7372__7373 = s;
    if(G__7372__7373) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7374 = null;
        if(cljs.core.truth_(or__3824__auto____7374)) {
          return or__3824__auto____7374
        }else {
          return G__7372__7373.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7372__7373.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7372__7373)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7372__7373)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7377 = [];
  var s__7378 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7378)) {
      ary__7377.push(cljs.core.first.call(null, s__7378));
      var G__7379 = cljs.core.next.call(null, s__7378);
      s__7378 = G__7379;
      continue
    }else {
      return ary__7377
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7383 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7384 = 0;
  var xs__7385 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7385) {
      ret__7383[i__7384] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7385));
      var G__7386 = i__7384 + 1;
      var G__7387 = cljs.core.next.call(null, xs__7385);
      i__7384 = G__7386;
      xs__7385 = G__7387;
      continue
    }else {
    }
    break
  }
  return ret__7383
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
    var a__7395 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7396 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7397 = 0;
      var s__7398 = s__7396;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7399 = s__7398;
          if(and__3822__auto____7399) {
            return i__7397 < size
          }else {
            return and__3822__auto____7399
          }
        }())) {
          a__7395[i__7397] = cljs.core.first.call(null, s__7398);
          var G__7402 = i__7397 + 1;
          var G__7403 = cljs.core.next.call(null, s__7398);
          i__7397 = G__7402;
          s__7398 = G__7403;
          continue
        }else {
          return a__7395
        }
        break
      }
    }else {
      var n__2527__auto____7400 = size;
      var i__7401 = 0;
      while(true) {
        if(i__7401 < n__2527__auto____7400) {
          a__7395[i__7401] = init_val_or_seq;
          var G__7404 = i__7401 + 1;
          i__7401 = G__7404;
          continue
        }else {
        }
        break
      }
      return a__7395
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
    var a__7412 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7413 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7414 = 0;
      var s__7415 = s__7413;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7416 = s__7415;
          if(and__3822__auto____7416) {
            return i__7414 < size
          }else {
            return and__3822__auto____7416
          }
        }())) {
          a__7412[i__7414] = cljs.core.first.call(null, s__7415);
          var G__7419 = i__7414 + 1;
          var G__7420 = cljs.core.next.call(null, s__7415);
          i__7414 = G__7419;
          s__7415 = G__7420;
          continue
        }else {
          return a__7412
        }
        break
      }
    }else {
      var n__2527__auto____7417 = size;
      var i__7418 = 0;
      while(true) {
        if(i__7418 < n__2527__auto____7417) {
          a__7412[i__7418] = init_val_or_seq;
          var G__7421 = i__7418 + 1;
          i__7418 = G__7421;
          continue
        }else {
        }
        break
      }
      return a__7412
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
    var a__7429 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7430 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7431 = 0;
      var s__7432 = s__7430;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7433 = s__7432;
          if(and__3822__auto____7433) {
            return i__7431 < size
          }else {
            return and__3822__auto____7433
          }
        }())) {
          a__7429[i__7431] = cljs.core.first.call(null, s__7432);
          var G__7436 = i__7431 + 1;
          var G__7437 = cljs.core.next.call(null, s__7432);
          i__7431 = G__7436;
          s__7432 = G__7437;
          continue
        }else {
          return a__7429
        }
        break
      }
    }else {
      var n__2527__auto____7434 = size;
      var i__7435 = 0;
      while(true) {
        if(i__7435 < n__2527__auto____7434) {
          a__7429[i__7435] = init_val_or_seq;
          var G__7438 = i__7435 + 1;
          i__7435 = G__7438;
          continue
        }else {
        }
        break
      }
      return a__7429
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
    var s__7443 = s;
    var i__7444 = n;
    var sum__7445 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7446 = i__7444 > 0;
        if(and__3822__auto____7446) {
          return cljs.core.seq.call(null, s__7443)
        }else {
          return and__3822__auto____7446
        }
      }())) {
        var G__7447 = cljs.core.next.call(null, s__7443);
        var G__7448 = i__7444 - 1;
        var G__7449 = sum__7445 + 1;
        s__7443 = G__7447;
        i__7444 = G__7448;
        sum__7445 = G__7449;
        continue
      }else {
        return sum__7445
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
      var s__7454 = cljs.core.seq.call(null, x);
      if(s__7454) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7454)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7454), concat.call(null, cljs.core.chunk_rest.call(null, s__7454), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7454), concat.call(null, cljs.core.rest.call(null, s__7454), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7458__delegate = function(x, y, zs) {
      var cat__7457 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7456 = cljs.core.seq.call(null, xys);
          if(xys__7456) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7456)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7456), cat.call(null, cljs.core.chunk_rest.call(null, xys__7456), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7456), cat.call(null, cljs.core.rest.call(null, xys__7456), zs))
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
      return cat__7457.call(null, concat.call(null, x, y), zs)
    };
    var G__7458 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7458__delegate.call(this, x, y, zs)
    };
    G__7458.cljs$lang$maxFixedArity = 2;
    G__7458.cljs$lang$applyTo = function(arglist__7459) {
      var x = cljs.core.first(arglist__7459);
      var y = cljs.core.first(cljs.core.next(arglist__7459));
      var zs = cljs.core.rest(cljs.core.next(arglist__7459));
      return G__7458__delegate(x, y, zs)
    };
    G__7458.cljs$lang$arity$variadic = G__7458__delegate;
    return G__7458
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
    var G__7460__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7460 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7460__delegate.call(this, a, b, c, d, more)
    };
    G__7460.cljs$lang$maxFixedArity = 4;
    G__7460.cljs$lang$applyTo = function(arglist__7461) {
      var a = cljs.core.first(arglist__7461);
      var b = cljs.core.first(cljs.core.next(arglist__7461));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7461)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7461))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7461))));
      return G__7460__delegate(a, b, c, d, more)
    };
    G__7460.cljs$lang$arity$variadic = G__7460__delegate;
    return G__7460
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
  var args__7503 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7504 = cljs.core._first.call(null, args__7503);
    var args__7505 = cljs.core._rest.call(null, args__7503);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7504)
      }else {
        return f.call(null, a__7504)
      }
    }else {
      var b__7506 = cljs.core._first.call(null, args__7505);
      var args__7507 = cljs.core._rest.call(null, args__7505);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7504, b__7506)
        }else {
          return f.call(null, a__7504, b__7506)
        }
      }else {
        var c__7508 = cljs.core._first.call(null, args__7507);
        var args__7509 = cljs.core._rest.call(null, args__7507);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7504, b__7506, c__7508)
          }else {
            return f.call(null, a__7504, b__7506, c__7508)
          }
        }else {
          var d__7510 = cljs.core._first.call(null, args__7509);
          var args__7511 = cljs.core._rest.call(null, args__7509);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7504, b__7506, c__7508, d__7510)
            }else {
              return f.call(null, a__7504, b__7506, c__7508, d__7510)
            }
          }else {
            var e__7512 = cljs.core._first.call(null, args__7511);
            var args__7513 = cljs.core._rest.call(null, args__7511);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7504, b__7506, c__7508, d__7510, e__7512)
              }else {
                return f.call(null, a__7504, b__7506, c__7508, d__7510, e__7512)
              }
            }else {
              var f__7514 = cljs.core._first.call(null, args__7513);
              var args__7515 = cljs.core._rest.call(null, args__7513);
              if(argc === 6) {
                if(f__7514.cljs$lang$arity$6) {
                  return f__7514.cljs$lang$arity$6(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514)
                }else {
                  return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514)
                }
              }else {
                var g__7516 = cljs.core._first.call(null, args__7515);
                var args__7517 = cljs.core._rest.call(null, args__7515);
                if(argc === 7) {
                  if(f__7514.cljs$lang$arity$7) {
                    return f__7514.cljs$lang$arity$7(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516)
                  }else {
                    return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516)
                  }
                }else {
                  var h__7518 = cljs.core._first.call(null, args__7517);
                  var args__7519 = cljs.core._rest.call(null, args__7517);
                  if(argc === 8) {
                    if(f__7514.cljs$lang$arity$8) {
                      return f__7514.cljs$lang$arity$8(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518)
                    }else {
                      return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518)
                    }
                  }else {
                    var i__7520 = cljs.core._first.call(null, args__7519);
                    var args__7521 = cljs.core._rest.call(null, args__7519);
                    if(argc === 9) {
                      if(f__7514.cljs$lang$arity$9) {
                        return f__7514.cljs$lang$arity$9(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520)
                      }else {
                        return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520)
                      }
                    }else {
                      var j__7522 = cljs.core._first.call(null, args__7521);
                      var args__7523 = cljs.core._rest.call(null, args__7521);
                      if(argc === 10) {
                        if(f__7514.cljs$lang$arity$10) {
                          return f__7514.cljs$lang$arity$10(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522)
                        }else {
                          return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522)
                        }
                      }else {
                        var k__7524 = cljs.core._first.call(null, args__7523);
                        var args__7525 = cljs.core._rest.call(null, args__7523);
                        if(argc === 11) {
                          if(f__7514.cljs$lang$arity$11) {
                            return f__7514.cljs$lang$arity$11(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524)
                          }else {
                            return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524)
                          }
                        }else {
                          var l__7526 = cljs.core._first.call(null, args__7525);
                          var args__7527 = cljs.core._rest.call(null, args__7525);
                          if(argc === 12) {
                            if(f__7514.cljs$lang$arity$12) {
                              return f__7514.cljs$lang$arity$12(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526)
                            }else {
                              return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526)
                            }
                          }else {
                            var m__7528 = cljs.core._first.call(null, args__7527);
                            var args__7529 = cljs.core._rest.call(null, args__7527);
                            if(argc === 13) {
                              if(f__7514.cljs$lang$arity$13) {
                                return f__7514.cljs$lang$arity$13(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528)
                              }else {
                                return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528)
                              }
                            }else {
                              var n__7530 = cljs.core._first.call(null, args__7529);
                              var args__7531 = cljs.core._rest.call(null, args__7529);
                              if(argc === 14) {
                                if(f__7514.cljs$lang$arity$14) {
                                  return f__7514.cljs$lang$arity$14(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530)
                                }else {
                                  return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530)
                                }
                              }else {
                                var o__7532 = cljs.core._first.call(null, args__7531);
                                var args__7533 = cljs.core._rest.call(null, args__7531);
                                if(argc === 15) {
                                  if(f__7514.cljs$lang$arity$15) {
                                    return f__7514.cljs$lang$arity$15(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532)
                                  }else {
                                    return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532)
                                  }
                                }else {
                                  var p__7534 = cljs.core._first.call(null, args__7533);
                                  var args__7535 = cljs.core._rest.call(null, args__7533);
                                  if(argc === 16) {
                                    if(f__7514.cljs$lang$arity$16) {
                                      return f__7514.cljs$lang$arity$16(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534)
                                    }else {
                                      return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534)
                                    }
                                  }else {
                                    var q__7536 = cljs.core._first.call(null, args__7535);
                                    var args__7537 = cljs.core._rest.call(null, args__7535);
                                    if(argc === 17) {
                                      if(f__7514.cljs$lang$arity$17) {
                                        return f__7514.cljs$lang$arity$17(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534, q__7536)
                                      }else {
                                        return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534, q__7536)
                                      }
                                    }else {
                                      var r__7538 = cljs.core._first.call(null, args__7537);
                                      var args__7539 = cljs.core._rest.call(null, args__7537);
                                      if(argc === 18) {
                                        if(f__7514.cljs$lang$arity$18) {
                                          return f__7514.cljs$lang$arity$18(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534, q__7536, r__7538)
                                        }else {
                                          return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534, q__7536, r__7538)
                                        }
                                      }else {
                                        var s__7540 = cljs.core._first.call(null, args__7539);
                                        var args__7541 = cljs.core._rest.call(null, args__7539);
                                        if(argc === 19) {
                                          if(f__7514.cljs$lang$arity$19) {
                                            return f__7514.cljs$lang$arity$19(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534, q__7536, r__7538, s__7540)
                                          }else {
                                            return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534, q__7536, r__7538, s__7540)
                                          }
                                        }else {
                                          var t__7542 = cljs.core._first.call(null, args__7541);
                                          var args__7543 = cljs.core._rest.call(null, args__7541);
                                          if(argc === 20) {
                                            if(f__7514.cljs$lang$arity$20) {
                                              return f__7514.cljs$lang$arity$20(a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534, q__7536, r__7538, s__7540, t__7542)
                                            }else {
                                              return f__7514.call(null, a__7504, b__7506, c__7508, d__7510, e__7512, f__7514, g__7516, h__7518, i__7520, j__7522, k__7524, l__7526, m__7528, n__7530, o__7532, p__7534, q__7536, r__7538, s__7540, t__7542)
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
    var fixed_arity__7558 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7559 = cljs.core.bounded_count.call(null, args, fixed_arity__7558 + 1);
      if(bc__7559 <= fixed_arity__7558) {
        return cljs.core.apply_to.call(null, f, bc__7559, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7560 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7561 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7562 = cljs.core.bounded_count.call(null, arglist__7560, fixed_arity__7561 + 1);
      if(bc__7562 <= fixed_arity__7561) {
        return cljs.core.apply_to.call(null, f, bc__7562, arglist__7560)
      }else {
        return f.cljs$lang$applyTo(arglist__7560)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7560))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7563 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7564 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7565 = cljs.core.bounded_count.call(null, arglist__7563, fixed_arity__7564 + 1);
      if(bc__7565 <= fixed_arity__7564) {
        return cljs.core.apply_to.call(null, f, bc__7565, arglist__7563)
      }else {
        return f.cljs$lang$applyTo(arglist__7563)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7563))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7566 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7567 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7568 = cljs.core.bounded_count.call(null, arglist__7566, fixed_arity__7567 + 1);
      if(bc__7568 <= fixed_arity__7567) {
        return cljs.core.apply_to.call(null, f, bc__7568, arglist__7566)
      }else {
        return f.cljs$lang$applyTo(arglist__7566)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7566))
    }
  };
  var apply__6 = function() {
    var G__7572__delegate = function(f, a, b, c, d, args) {
      var arglist__7569 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7570 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7571 = cljs.core.bounded_count.call(null, arglist__7569, fixed_arity__7570 + 1);
        if(bc__7571 <= fixed_arity__7570) {
          return cljs.core.apply_to.call(null, f, bc__7571, arglist__7569)
        }else {
          return f.cljs$lang$applyTo(arglist__7569)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7569))
      }
    };
    var G__7572 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7572__delegate.call(this, f, a, b, c, d, args)
    };
    G__7572.cljs$lang$maxFixedArity = 5;
    G__7572.cljs$lang$applyTo = function(arglist__7573) {
      var f = cljs.core.first(arglist__7573);
      var a = cljs.core.first(cljs.core.next(arglist__7573));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7573)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7573))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7573)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7573)))));
      return G__7572__delegate(f, a, b, c, d, args)
    };
    G__7572.cljs$lang$arity$variadic = G__7572__delegate;
    return G__7572
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
  vary_meta.cljs$lang$applyTo = function(arglist__7574) {
    var obj = cljs.core.first(arglist__7574);
    var f = cljs.core.first(cljs.core.next(arglist__7574));
    var args = cljs.core.rest(cljs.core.next(arglist__7574));
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
    var G__7575__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7575 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7575__delegate.call(this, x, y, more)
    };
    G__7575.cljs$lang$maxFixedArity = 2;
    G__7575.cljs$lang$applyTo = function(arglist__7576) {
      var x = cljs.core.first(arglist__7576);
      var y = cljs.core.first(cljs.core.next(arglist__7576));
      var more = cljs.core.rest(cljs.core.next(arglist__7576));
      return G__7575__delegate(x, y, more)
    };
    G__7575.cljs$lang$arity$variadic = G__7575__delegate;
    return G__7575
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
        var G__7577 = pred;
        var G__7578 = cljs.core.next.call(null, coll);
        pred = G__7577;
        coll = G__7578;
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
      var or__3824__auto____7580 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7580)) {
        return or__3824__auto____7580
      }else {
        var G__7581 = pred;
        var G__7582 = cljs.core.next.call(null, coll);
        pred = G__7581;
        coll = G__7582;
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
    var G__7583 = null;
    var G__7583__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7583__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7583__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7583__3 = function() {
      var G__7584__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7584 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7584__delegate.call(this, x, y, zs)
      };
      G__7584.cljs$lang$maxFixedArity = 2;
      G__7584.cljs$lang$applyTo = function(arglist__7585) {
        var x = cljs.core.first(arglist__7585);
        var y = cljs.core.first(cljs.core.next(arglist__7585));
        var zs = cljs.core.rest(cljs.core.next(arglist__7585));
        return G__7584__delegate(x, y, zs)
      };
      G__7584.cljs$lang$arity$variadic = G__7584__delegate;
      return G__7584
    }();
    G__7583 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7583__0.call(this);
        case 1:
          return G__7583__1.call(this, x);
        case 2:
          return G__7583__2.call(this, x, y);
        default:
          return G__7583__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7583.cljs$lang$maxFixedArity = 2;
    G__7583.cljs$lang$applyTo = G__7583__3.cljs$lang$applyTo;
    return G__7583
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7586__delegate = function(args) {
      return x
    };
    var G__7586 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7586__delegate.call(this, args)
    };
    G__7586.cljs$lang$maxFixedArity = 0;
    G__7586.cljs$lang$applyTo = function(arglist__7587) {
      var args = cljs.core.seq(arglist__7587);
      return G__7586__delegate(args)
    };
    G__7586.cljs$lang$arity$variadic = G__7586__delegate;
    return G__7586
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
      var G__7594 = null;
      var G__7594__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7594__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7594__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7594__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7594__4 = function() {
        var G__7595__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7595 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7595__delegate.call(this, x, y, z, args)
        };
        G__7595.cljs$lang$maxFixedArity = 3;
        G__7595.cljs$lang$applyTo = function(arglist__7596) {
          var x = cljs.core.first(arglist__7596);
          var y = cljs.core.first(cljs.core.next(arglist__7596));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7596)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7596)));
          return G__7595__delegate(x, y, z, args)
        };
        G__7595.cljs$lang$arity$variadic = G__7595__delegate;
        return G__7595
      }();
      G__7594 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7594__0.call(this);
          case 1:
            return G__7594__1.call(this, x);
          case 2:
            return G__7594__2.call(this, x, y);
          case 3:
            return G__7594__3.call(this, x, y, z);
          default:
            return G__7594__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7594.cljs$lang$maxFixedArity = 3;
      G__7594.cljs$lang$applyTo = G__7594__4.cljs$lang$applyTo;
      return G__7594
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7597 = null;
      var G__7597__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7597__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7597__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7597__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7597__4 = function() {
        var G__7598__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7598 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7598__delegate.call(this, x, y, z, args)
        };
        G__7598.cljs$lang$maxFixedArity = 3;
        G__7598.cljs$lang$applyTo = function(arglist__7599) {
          var x = cljs.core.first(arglist__7599);
          var y = cljs.core.first(cljs.core.next(arglist__7599));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7599)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7599)));
          return G__7598__delegate(x, y, z, args)
        };
        G__7598.cljs$lang$arity$variadic = G__7598__delegate;
        return G__7598
      }();
      G__7597 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7597__0.call(this);
          case 1:
            return G__7597__1.call(this, x);
          case 2:
            return G__7597__2.call(this, x, y);
          case 3:
            return G__7597__3.call(this, x, y, z);
          default:
            return G__7597__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7597.cljs$lang$maxFixedArity = 3;
      G__7597.cljs$lang$applyTo = G__7597__4.cljs$lang$applyTo;
      return G__7597
    }()
  };
  var comp__4 = function() {
    var G__7600__delegate = function(f1, f2, f3, fs) {
      var fs__7591 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7601__delegate = function(args) {
          var ret__7592 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7591), args);
          var fs__7593 = cljs.core.next.call(null, fs__7591);
          while(true) {
            if(fs__7593) {
              var G__7602 = cljs.core.first.call(null, fs__7593).call(null, ret__7592);
              var G__7603 = cljs.core.next.call(null, fs__7593);
              ret__7592 = G__7602;
              fs__7593 = G__7603;
              continue
            }else {
              return ret__7592
            }
            break
          }
        };
        var G__7601 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7601__delegate.call(this, args)
        };
        G__7601.cljs$lang$maxFixedArity = 0;
        G__7601.cljs$lang$applyTo = function(arglist__7604) {
          var args = cljs.core.seq(arglist__7604);
          return G__7601__delegate(args)
        };
        G__7601.cljs$lang$arity$variadic = G__7601__delegate;
        return G__7601
      }()
    };
    var G__7600 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7600__delegate.call(this, f1, f2, f3, fs)
    };
    G__7600.cljs$lang$maxFixedArity = 3;
    G__7600.cljs$lang$applyTo = function(arglist__7605) {
      var f1 = cljs.core.first(arglist__7605);
      var f2 = cljs.core.first(cljs.core.next(arglist__7605));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7605)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7605)));
      return G__7600__delegate(f1, f2, f3, fs)
    };
    G__7600.cljs$lang$arity$variadic = G__7600__delegate;
    return G__7600
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
      var G__7606__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7606 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7606__delegate.call(this, args)
      };
      G__7606.cljs$lang$maxFixedArity = 0;
      G__7606.cljs$lang$applyTo = function(arglist__7607) {
        var args = cljs.core.seq(arglist__7607);
        return G__7606__delegate(args)
      };
      G__7606.cljs$lang$arity$variadic = G__7606__delegate;
      return G__7606
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7608__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7608 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7608__delegate.call(this, args)
      };
      G__7608.cljs$lang$maxFixedArity = 0;
      G__7608.cljs$lang$applyTo = function(arglist__7609) {
        var args = cljs.core.seq(arglist__7609);
        return G__7608__delegate(args)
      };
      G__7608.cljs$lang$arity$variadic = G__7608__delegate;
      return G__7608
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7610__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7610 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7610__delegate.call(this, args)
      };
      G__7610.cljs$lang$maxFixedArity = 0;
      G__7610.cljs$lang$applyTo = function(arglist__7611) {
        var args = cljs.core.seq(arglist__7611);
        return G__7610__delegate(args)
      };
      G__7610.cljs$lang$arity$variadic = G__7610__delegate;
      return G__7610
    }()
  };
  var partial__5 = function() {
    var G__7612__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7613__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7613 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7613__delegate.call(this, args)
        };
        G__7613.cljs$lang$maxFixedArity = 0;
        G__7613.cljs$lang$applyTo = function(arglist__7614) {
          var args = cljs.core.seq(arglist__7614);
          return G__7613__delegate(args)
        };
        G__7613.cljs$lang$arity$variadic = G__7613__delegate;
        return G__7613
      }()
    };
    var G__7612 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7612__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7612.cljs$lang$maxFixedArity = 4;
    G__7612.cljs$lang$applyTo = function(arglist__7615) {
      var f = cljs.core.first(arglist__7615);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7615));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7615)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7615))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7615))));
      return G__7612__delegate(f, arg1, arg2, arg3, more)
    };
    G__7612.cljs$lang$arity$variadic = G__7612__delegate;
    return G__7612
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
      var G__7616 = null;
      var G__7616__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7616__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7616__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7616__4 = function() {
        var G__7617__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7617 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7617__delegate.call(this, a, b, c, ds)
        };
        G__7617.cljs$lang$maxFixedArity = 3;
        G__7617.cljs$lang$applyTo = function(arglist__7618) {
          var a = cljs.core.first(arglist__7618);
          var b = cljs.core.first(cljs.core.next(arglist__7618));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7618)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7618)));
          return G__7617__delegate(a, b, c, ds)
        };
        G__7617.cljs$lang$arity$variadic = G__7617__delegate;
        return G__7617
      }();
      G__7616 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7616__1.call(this, a);
          case 2:
            return G__7616__2.call(this, a, b);
          case 3:
            return G__7616__3.call(this, a, b, c);
          default:
            return G__7616__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7616.cljs$lang$maxFixedArity = 3;
      G__7616.cljs$lang$applyTo = G__7616__4.cljs$lang$applyTo;
      return G__7616
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7619 = null;
      var G__7619__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7619__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7619__4 = function() {
        var G__7620__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7620 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7620__delegate.call(this, a, b, c, ds)
        };
        G__7620.cljs$lang$maxFixedArity = 3;
        G__7620.cljs$lang$applyTo = function(arglist__7621) {
          var a = cljs.core.first(arglist__7621);
          var b = cljs.core.first(cljs.core.next(arglist__7621));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7621)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7621)));
          return G__7620__delegate(a, b, c, ds)
        };
        G__7620.cljs$lang$arity$variadic = G__7620__delegate;
        return G__7620
      }();
      G__7619 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7619__2.call(this, a, b);
          case 3:
            return G__7619__3.call(this, a, b, c);
          default:
            return G__7619__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7619.cljs$lang$maxFixedArity = 3;
      G__7619.cljs$lang$applyTo = G__7619__4.cljs$lang$applyTo;
      return G__7619
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7622 = null;
      var G__7622__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7622__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7622__4 = function() {
        var G__7623__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7623 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7623__delegate.call(this, a, b, c, ds)
        };
        G__7623.cljs$lang$maxFixedArity = 3;
        G__7623.cljs$lang$applyTo = function(arglist__7624) {
          var a = cljs.core.first(arglist__7624);
          var b = cljs.core.first(cljs.core.next(arglist__7624));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7624)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7624)));
          return G__7623__delegate(a, b, c, ds)
        };
        G__7623.cljs$lang$arity$variadic = G__7623__delegate;
        return G__7623
      }();
      G__7622 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7622__2.call(this, a, b);
          case 3:
            return G__7622__3.call(this, a, b, c);
          default:
            return G__7622__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7622.cljs$lang$maxFixedArity = 3;
      G__7622.cljs$lang$applyTo = G__7622__4.cljs$lang$applyTo;
      return G__7622
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
  var mapi__7640 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7648 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7648) {
        var s__7649 = temp__3974__auto____7648;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7649)) {
          var c__7650 = cljs.core.chunk_first.call(null, s__7649);
          var size__7651 = cljs.core.count.call(null, c__7650);
          var b__7652 = cljs.core.chunk_buffer.call(null, size__7651);
          var n__2527__auto____7653 = size__7651;
          var i__7654 = 0;
          while(true) {
            if(i__7654 < n__2527__auto____7653) {
              cljs.core.chunk_append.call(null, b__7652, f.call(null, idx + i__7654, cljs.core._nth.call(null, c__7650, i__7654)));
              var G__7655 = i__7654 + 1;
              i__7654 = G__7655;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7652), mapi.call(null, idx + size__7651, cljs.core.chunk_rest.call(null, s__7649)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7649)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7649)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7640.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7665 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7665) {
      var s__7666 = temp__3974__auto____7665;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7666)) {
        var c__7667 = cljs.core.chunk_first.call(null, s__7666);
        var size__7668 = cljs.core.count.call(null, c__7667);
        var b__7669 = cljs.core.chunk_buffer.call(null, size__7668);
        var n__2527__auto____7670 = size__7668;
        var i__7671 = 0;
        while(true) {
          if(i__7671 < n__2527__auto____7670) {
            var x__7672 = f.call(null, cljs.core._nth.call(null, c__7667, i__7671));
            if(x__7672 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7669, x__7672)
            }
            var G__7674 = i__7671 + 1;
            i__7671 = G__7674;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7669), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7666)))
      }else {
        var x__7673 = f.call(null, cljs.core.first.call(null, s__7666));
        if(x__7673 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7666))
        }else {
          return cljs.core.cons.call(null, x__7673, keep.call(null, f, cljs.core.rest.call(null, s__7666)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7700 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7710 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7710) {
        var s__7711 = temp__3974__auto____7710;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7711)) {
          var c__7712 = cljs.core.chunk_first.call(null, s__7711);
          var size__7713 = cljs.core.count.call(null, c__7712);
          var b__7714 = cljs.core.chunk_buffer.call(null, size__7713);
          var n__2527__auto____7715 = size__7713;
          var i__7716 = 0;
          while(true) {
            if(i__7716 < n__2527__auto____7715) {
              var x__7717 = f.call(null, idx + i__7716, cljs.core._nth.call(null, c__7712, i__7716));
              if(x__7717 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7714, x__7717)
              }
              var G__7719 = i__7716 + 1;
              i__7716 = G__7719;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7714), keepi.call(null, idx + size__7713, cljs.core.chunk_rest.call(null, s__7711)))
        }else {
          var x__7718 = f.call(null, idx, cljs.core.first.call(null, s__7711));
          if(x__7718 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7711))
          }else {
            return cljs.core.cons.call(null, x__7718, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7711)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7700.call(null, 0, coll)
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
          var and__3822__auto____7805 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7805)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7805
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7806 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7806)) {
            var and__3822__auto____7807 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7807)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7807
            }
          }else {
            return and__3822__auto____7806
          }
        }())
      };
      var ep1__4 = function() {
        var G__7876__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7808 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7808)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7808
            }
          }())
        };
        var G__7876 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7876__delegate.call(this, x, y, z, args)
        };
        G__7876.cljs$lang$maxFixedArity = 3;
        G__7876.cljs$lang$applyTo = function(arglist__7877) {
          var x = cljs.core.first(arglist__7877);
          var y = cljs.core.first(cljs.core.next(arglist__7877));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7877)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7877)));
          return G__7876__delegate(x, y, z, args)
        };
        G__7876.cljs$lang$arity$variadic = G__7876__delegate;
        return G__7876
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
          var and__3822__auto____7820 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7820)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7820
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7821 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7821)) {
            var and__3822__auto____7822 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7822)) {
              var and__3822__auto____7823 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7823)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7823
              }
            }else {
              return and__3822__auto____7822
            }
          }else {
            return and__3822__auto____7821
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7824 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7824)) {
            var and__3822__auto____7825 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7825)) {
              var and__3822__auto____7826 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7826)) {
                var and__3822__auto____7827 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7827)) {
                  var and__3822__auto____7828 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7828)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7828
                  }
                }else {
                  return and__3822__auto____7827
                }
              }else {
                return and__3822__auto____7826
              }
            }else {
              return and__3822__auto____7825
            }
          }else {
            return and__3822__auto____7824
          }
        }())
      };
      var ep2__4 = function() {
        var G__7878__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7829 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7829)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7675_SHARP_) {
                var and__3822__auto____7830 = p1.call(null, p1__7675_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7830)) {
                  return p2.call(null, p1__7675_SHARP_)
                }else {
                  return and__3822__auto____7830
                }
              }, args)
            }else {
              return and__3822__auto____7829
            }
          }())
        };
        var G__7878 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7878__delegate.call(this, x, y, z, args)
        };
        G__7878.cljs$lang$maxFixedArity = 3;
        G__7878.cljs$lang$applyTo = function(arglist__7879) {
          var x = cljs.core.first(arglist__7879);
          var y = cljs.core.first(cljs.core.next(arglist__7879));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7879)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7879)));
          return G__7878__delegate(x, y, z, args)
        };
        G__7878.cljs$lang$arity$variadic = G__7878__delegate;
        return G__7878
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
          var and__3822__auto____7849 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7849)) {
            var and__3822__auto____7850 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7850)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7850
            }
          }else {
            return and__3822__auto____7849
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7851 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7851)) {
            var and__3822__auto____7852 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7852)) {
              var and__3822__auto____7853 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7853)) {
                var and__3822__auto____7854 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7854)) {
                  var and__3822__auto____7855 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7855)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7855
                  }
                }else {
                  return and__3822__auto____7854
                }
              }else {
                return and__3822__auto____7853
              }
            }else {
              return and__3822__auto____7852
            }
          }else {
            return and__3822__auto____7851
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7856 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7856)) {
            var and__3822__auto____7857 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7857)) {
              var and__3822__auto____7858 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7858)) {
                var and__3822__auto____7859 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7859)) {
                  var and__3822__auto____7860 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7860)) {
                    var and__3822__auto____7861 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7861)) {
                      var and__3822__auto____7862 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7862)) {
                        var and__3822__auto____7863 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7863)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7863
                        }
                      }else {
                        return and__3822__auto____7862
                      }
                    }else {
                      return and__3822__auto____7861
                    }
                  }else {
                    return and__3822__auto____7860
                  }
                }else {
                  return and__3822__auto____7859
                }
              }else {
                return and__3822__auto____7858
              }
            }else {
              return and__3822__auto____7857
            }
          }else {
            return and__3822__auto____7856
          }
        }())
      };
      var ep3__4 = function() {
        var G__7880__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7864 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7864)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7676_SHARP_) {
                var and__3822__auto____7865 = p1.call(null, p1__7676_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7865)) {
                  var and__3822__auto____7866 = p2.call(null, p1__7676_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7866)) {
                    return p3.call(null, p1__7676_SHARP_)
                  }else {
                    return and__3822__auto____7866
                  }
                }else {
                  return and__3822__auto____7865
                }
              }, args)
            }else {
              return and__3822__auto____7864
            }
          }())
        };
        var G__7880 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7880__delegate.call(this, x, y, z, args)
        };
        G__7880.cljs$lang$maxFixedArity = 3;
        G__7880.cljs$lang$applyTo = function(arglist__7881) {
          var x = cljs.core.first(arglist__7881);
          var y = cljs.core.first(cljs.core.next(arglist__7881));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7881)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7881)));
          return G__7880__delegate(x, y, z, args)
        };
        G__7880.cljs$lang$arity$variadic = G__7880__delegate;
        return G__7880
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
    var G__7882__delegate = function(p1, p2, p3, ps) {
      var ps__7867 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7677_SHARP_) {
            return p1__7677_SHARP_.call(null, x)
          }, ps__7867)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7678_SHARP_) {
            var and__3822__auto____7872 = p1__7678_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7872)) {
              return p1__7678_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7872
            }
          }, ps__7867)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7679_SHARP_) {
            var and__3822__auto____7873 = p1__7679_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7873)) {
              var and__3822__auto____7874 = p1__7679_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7874)) {
                return p1__7679_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7874
              }
            }else {
              return and__3822__auto____7873
            }
          }, ps__7867)
        };
        var epn__4 = function() {
          var G__7883__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7875 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7875)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7680_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7680_SHARP_, args)
                }, ps__7867)
              }else {
                return and__3822__auto____7875
              }
            }())
          };
          var G__7883 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7883__delegate.call(this, x, y, z, args)
          };
          G__7883.cljs$lang$maxFixedArity = 3;
          G__7883.cljs$lang$applyTo = function(arglist__7884) {
            var x = cljs.core.first(arglist__7884);
            var y = cljs.core.first(cljs.core.next(arglist__7884));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7884)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7884)));
            return G__7883__delegate(x, y, z, args)
          };
          G__7883.cljs$lang$arity$variadic = G__7883__delegate;
          return G__7883
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
    var G__7882 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7882__delegate.call(this, p1, p2, p3, ps)
    };
    G__7882.cljs$lang$maxFixedArity = 3;
    G__7882.cljs$lang$applyTo = function(arglist__7885) {
      var p1 = cljs.core.first(arglist__7885);
      var p2 = cljs.core.first(cljs.core.next(arglist__7885));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7885)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7885)));
      return G__7882__delegate(p1, p2, p3, ps)
    };
    G__7882.cljs$lang$arity$variadic = G__7882__delegate;
    return G__7882
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
        var or__3824__auto____7966 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7966)) {
          return or__3824__auto____7966
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7967 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7967)) {
          return or__3824__auto____7967
        }else {
          var or__3824__auto____7968 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7968)) {
            return or__3824__auto____7968
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8037__delegate = function(x, y, z, args) {
          var or__3824__auto____7969 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7969)) {
            return or__3824__auto____7969
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8037 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8037__delegate.call(this, x, y, z, args)
        };
        G__8037.cljs$lang$maxFixedArity = 3;
        G__8037.cljs$lang$applyTo = function(arglist__8038) {
          var x = cljs.core.first(arglist__8038);
          var y = cljs.core.first(cljs.core.next(arglist__8038));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8038)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8038)));
          return G__8037__delegate(x, y, z, args)
        };
        G__8037.cljs$lang$arity$variadic = G__8037__delegate;
        return G__8037
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
        var or__3824__auto____7981 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7981)) {
          return or__3824__auto____7981
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7982 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7982)) {
          return or__3824__auto____7982
        }else {
          var or__3824__auto____7983 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7983)) {
            return or__3824__auto____7983
          }else {
            var or__3824__auto____7984 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7984)) {
              return or__3824__auto____7984
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7985 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7985)) {
          return or__3824__auto____7985
        }else {
          var or__3824__auto____7986 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7986)) {
            return or__3824__auto____7986
          }else {
            var or__3824__auto____7987 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7987)) {
              return or__3824__auto____7987
            }else {
              var or__3824__auto____7988 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7988)) {
                return or__3824__auto____7988
              }else {
                var or__3824__auto____7989 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7989)) {
                  return or__3824__auto____7989
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8039__delegate = function(x, y, z, args) {
          var or__3824__auto____7990 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7990)) {
            return or__3824__auto____7990
          }else {
            return cljs.core.some.call(null, function(p1__7720_SHARP_) {
              var or__3824__auto____7991 = p1.call(null, p1__7720_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7991)) {
                return or__3824__auto____7991
              }else {
                return p2.call(null, p1__7720_SHARP_)
              }
            }, args)
          }
        };
        var G__8039 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8039__delegate.call(this, x, y, z, args)
        };
        G__8039.cljs$lang$maxFixedArity = 3;
        G__8039.cljs$lang$applyTo = function(arglist__8040) {
          var x = cljs.core.first(arglist__8040);
          var y = cljs.core.first(cljs.core.next(arglist__8040));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8040)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8040)));
          return G__8039__delegate(x, y, z, args)
        };
        G__8039.cljs$lang$arity$variadic = G__8039__delegate;
        return G__8039
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
        var or__3824__auto____8010 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8010)) {
          return or__3824__auto____8010
        }else {
          var or__3824__auto____8011 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8011)) {
            return or__3824__auto____8011
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8012 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8012)) {
          return or__3824__auto____8012
        }else {
          var or__3824__auto____8013 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8013)) {
            return or__3824__auto____8013
          }else {
            var or__3824__auto____8014 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8014)) {
              return or__3824__auto____8014
            }else {
              var or__3824__auto____8015 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8015)) {
                return or__3824__auto____8015
              }else {
                var or__3824__auto____8016 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8016)) {
                  return or__3824__auto____8016
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8017 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8017)) {
          return or__3824__auto____8017
        }else {
          var or__3824__auto____8018 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8018)) {
            return or__3824__auto____8018
          }else {
            var or__3824__auto____8019 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8019)) {
              return or__3824__auto____8019
            }else {
              var or__3824__auto____8020 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8020)) {
                return or__3824__auto____8020
              }else {
                var or__3824__auto____8021 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8021)) {
                  return or__3824__auto____8021
                }else {
                  var or__3824__auto____8022 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8022)) {
                    return or__3824__auto____8022
                  }else {
                    var or__3824__auto____8023 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8023)) {
                      return or__3824__auto____8023
                    }else {
                      var or__3824__auto____8024 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8024)) {
                        return or__3824__auto____8024
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
        var G__8041__delegate = function(x, y, z, args) {
          var or__3824__auto____8025 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8025)) {
            return or__3824__auto____8025
          }else {
            return cljs.core.some.call(null, function(p1__7721_SHARP_) {
              var or__3824__auto____8026 = p1.call(null, p1__7721_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8026)) {
                return or__3824__auto____8026
              }else {
                var or__3824__auto____8027 = p2.call(null, p1__7721_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8027)) {
                  return or__3824__auto____8027
                }else {
                  return p3.call(null, p1__7721_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8041 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8041__delegate.call(this, x, y, z, args)
        };
        G__8041.cljs$lang$maxFixedArity = 3;
        G__8041.cljs$lang$applyTo = function(arglist__8042) {
          var x = cljs.core.first(arglist__8042);
          var y = cljs.core.first(cljs.core.next(arglist__8042));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8042)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8042)));
          return G__8041__delegate(x, y, z, args)
        };
        G__8041.cljs$lang$arity$variadic = G__8041__delegate;
        return G__8041
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
    var G__8043__delegate = function(p1, p2, p3, ps) {
      var ps__8028 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7722_SHARP_) {
            return p1__7722_SHARP_.call(null, x)
          }, ps__8028)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7723_SHARP_) {
            var or__3824__auto____8033 = p1__7723_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8033)) {
              return or__3824__auto____8033
            }else {
              return p1__7723_SHARP_.call(null, y)
            }
          }, ps__8028)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7724_SHARP_) {
            var or__3824__auto____8034 = p1__7724_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8034)) {
              return or__3824__auto____8034
            }else {
              var or__3824__auto____8035 = p1__7724_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8035)) {
                return or__3824__auto____8035
              }else {
                return p1__7724_SHARP_.call(null, z)
              }
            }
          }, ps__8028)
        };
        var spn__4 = function() {
          var G__8044__delegate = function(x, y, z, args) {
            var or__3824__auto____8036 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8036)) {
              return or__3824__auto____8036
            }else {
              return cljs.core.some.call(null, function(p1__7725_SHARP_) {
                return cljs.core.some.call(null, p1__7725_SHARP_, args)
              }, ps__8028)
            }
          };
          var G__8044 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8044__delegate.call(this, x, y, z, args)
          };
          G__8044.cljs$lang$maxFixedArity = 3;
          G__8044.cljs$lang$applyTo = function(arglist__8045) {
            var x = cljs.core.first(arglist__8045);
            var y = cljs.core.first(cljs.core.next(arglist__8045));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8045)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8045)));
            return G__8044__delegate(x, y, z, args)
          };
          G__8044.cljs$lang$arity$variadic = G__8044__delegate;
          return G__8044
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
    var G__8043 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8043__delegate.call(this, p1, p2, p3, ps)
    };
    G__8043.cljs$lang$maxFixedArity = 3;
    G__8043.cljs$lang$applyTo = function(arglist__8046) {
      var p1 = cljs.core.first(arglist__8046);
      var p2 = cljs.core.first(cljs.core.next(arglist__8046));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8046)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8046)));
      return G__8043__delegate(p1, p2, p3, ps)
    };
    G__8043.cljs$lang$arity$variadic = G__8043__delegate;
    return G__8043
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
      var temp__3974__auto____8065 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8065) {
        var s__8066 = temp__3974__auto____8065;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8066)) {
          var c__8067 = cljs.core.chunk_first.call(null, s__8066);
          var size__8068 = cljs.core.count.call(null, c__8067);
          var b__8069 = cljs.core.chunk_buffer.call(null, size__8068);
          var n__2527__auto____8070 = size__8068;
          var i__8071 = 0;
          while(true) {
            if(i__8071 < n__2527__auto____8070) {
              cljs.core.chunk_append.call(null, b__8069, f.call(null, cljs.core._nth.call(null, c__8067, i__8071)));
              var G__8083 = i__8071 + 1;
              i__8071 = G__8083;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8069), map.call(null, f, cljs.core.chunk_rest.call(null, s__8066)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8066)), map.call(null, f, cljs.core.rest.call(null, s__8066)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8072 = cljs.core.seq.call(null, c1);
      var s2__8073 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8074 = s1__8072;
        if(and__3822__auto____8074) {
          return s2__8073
        }else {
          return and__3822__auto____8074
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8072), cljs.core.first.call(null, s2__8073)), map.call(null, f, cljs.core.rest.call(null, s1__8072), cljs.core.rest.call(null, s2__8073)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8075 = cljs.core.seq.call(null, c1);
      var s2__8076 = cljs.core.seq.call(null, c2);
      var s3__8077 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8078 = s1__8075;
        if(and__3822__auto____8078) {
          var and__3822__auto____8079 = s2__8076;
          if(and__3822__auto____8079) {
            return s3__8077
          }else {
            return and__3822__auto____8079
          }
        }else {
          return and__3822__auto____8078
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8075), cljs.core.first.call(null, s2__8076), cljs.core.first.call(null, s3__8077)), map.call(null, f, cljs.core.rest.call(null, s1__8075), cljs.core.rest.call(null, s2__8076), cljs.core.rest.call(null, s3__8077)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8084__delegate = function(f, c1, c2, c3, colls) {
      var step__8082 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8081 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8081)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8081), step.call(null, map.call(null, cljs.core.rest, ss__8081)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7886_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7886_SHARP_)
      }, step__8082.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8084 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8084__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8084.cljs$lang$maxFixedArity = 4;
    G__8084.cljs$lang$applyTo = function(arglist__8085) {
      var f = cljs.core.first(arglist__8085);
      var c1 = cljs.core.first(cljs.core.next(arglist__8085));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8085)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8085))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8085))));
      return G__8084__delegate(f, c1, c2, c3, colls)
    };
    G__8084.cljs$lang$arity$variadic = G__8084__delegate;
    return G__8084
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
      var temp__3974__auto____8088 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8088) {
        var s__8089 = temp__3974__auto____8088;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8089), take.call(null, n - 1, cljs.core.rest.call(null, s__8089)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8095 = function(n, coll) {
    while(true) {
      var s__8093 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8094 = n > 0;
        if(and__3822__auto____8094) {
          return s__8093
        }else {
          return and__3822__auto____8094
        }
      }())) {
        var G__8096 = n - 1;
        var G__8097 = cljs.core.rest.call(null, s__8093);
        n = G__8096;
        coll = G__8097;
        continue
      }else {
        return s__8093
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8095.call(null, n, coll)
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
  var s__8100 = cljs.core.seq.call(null, coll);
  var lead__8101 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8101) {
      var G__8102 = cljs.core.next.call(null, s__8100);
      var G__8103 = cljs.core.next.call(null, lead__8101);
      s__8100 = G__8102;
      lead__8101 = G__8103;
      continue
    }else {
      return s__8100
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8109 = function(pred, coll) {
    while(true) {
      var s__8107 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8108 = s__8107;
        if(and__3822__auto____8108) {
          return pred.call(null, cljs.core.first.call(null, s__8107))
        }else {
          return and__3822__auto____8108
        }
      }())) {
        var G__8110 = pred;
        var G__8111 = cljs.core.rest.call(null, s__8107);
        pred = G__8110;
        coll = G__8111;
        continue
      }else {
        return s__8107
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8109.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8114 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8114) {
      var s__8115 = temp__3974__auto____8114;
      return cljs.core.concat.call(null, s__8115, cycle.call(null, s__8115))
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
      var s1__8120 = cljs.core.seq.call(null, c1);
      var s2__8121 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8122 = s1__8120;
        if(and__3822__auto____8122) {
          return s2__8121
        }else {
          return and__3822__auto____8122
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8120), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8121), interleave.call(null, cljs.core.rest.call(null, s1__8120), cljs.core.rest.call(null, s2__8121))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8124__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8123 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8123)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8123), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8123)))
        }else {
          return null
        }
      }, null)
    };
    var G__8124 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8124__delegate.call(this, c1, c2, colls)
    };
    G__8124.cljs$lang$maxFixedArity = 2;
    G__8124.cljs$lang$applyTo = function(arglist__8125) {
      var c1 = cljs.core.first(arglist__8125);
      var c2 = cljs.core.first(cljs.core.next(arglist__8125));
      var colls = cljs.core.rest(cljs.core.next(arglist__8125));
      return G__8124__delegate(c1, c2, colls)
    };
    G__8124.cljs$lang$arity$variadic = G__8124__delegate;
    return G__8124
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
  var cat__8135 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8133 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8133) {
        var coll__8134 = temp__3971__auto____8133;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8134), cat.call(null, cljs.core.rest.call(null, coll__8134), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8135.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8136__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8136 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8136__delegate.call(this, f, coll, colls)
    };
    G__8136.cljs$lang$maxFixedArity = 2;
    G__8136.cljs$lang$applyTo = function(arglist__8137) {
      var f = cljs.core.first(arglist__8137);
      var coll = cljs.core.first(cljs.core.next(arglist__8137));
      var colls = cljs.core.rest(cljs.core.next(arglist__8137));
      return G__8136__delegate(f, coll, colls)
    };
    G__8136.cljs$lang$arity$variadic = G__8136__delegate;
    return G__8136
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
    var temp__3974__auto____8147 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8147) {
      var s__8148 = temp__3974__auto____8147;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8148)) {
        var c__8149 = cljs.core.chunk_first.call(null, s__8148);
        var size__8150 = cljs.core.count.call(null, c__8149);
        var b__8151 = cljs.core.chunk_buffer.call(null, size__8150);
        var n__2527__auto____8152 = size__8150;
        var i__8153 = 0;
        while(true) {
          if(i__8153 < n__2527__auto____8152) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8149, i__8153)))) {
              cljs.core.chunk_append.call(null, b__8151, cljs.core._nth.call(null, c__8149, i__8153))
            }else {
            }
            var G__8156 = i__8153 + 1;
            i__8153 = G__8156;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8151), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8148)))
      }else {
        var f__8154 = cljs.core.first.call(null, s__8148);
        var r__8155 = cljs.core.rest.call(null, s__8148);
        if(cljs.core.truth_(pred.call(null, f__8154))) {
          return cljs.core.cons.call(null, f__8154, filter.call(null, pred, r__8155))
        }else {
          return filter.call(null, pred, r__8155)
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
  var walk__8159 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8159.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8157_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8157_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8163__8164 = to;
    if(G__8163__8164) {
      if(function() {
        var or__3824__auto____8165 = G__8163__8164.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8165) {
          return or__3824__auto____8165
        }else {
          return G__8163__8164.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8163__8164.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8163__8164)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8163__8164)
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
    var G__8166__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8166 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8166__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8166.cljs$lang$maxFixedArity = 4;
    G__8166.cljs$lang$applyTo = function(arglist__8167) {
      var f = cljs.core.first(arglist__8167);
      var c1 = cljs.core.first(cljs.core.next(arglist__8167));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8167)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8167))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8167))));
      return G__8166__delegate(f, c1, c2, c3, colls)
    };
    G__8166.cljs$lang$arity$variadic = G__8166__delegate;
    return G__8166
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
      var temp__3974__auto____8174 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8174) {
        var s__8175 = temp__3974__auto____8174;
        var p__8176 = cljs.core.take.call(null, n, s__8175);
        if(n === cljs.core.count.call(null, p__8176)) {
          return cljs.core.cons.call(null, p__8176, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8175)))
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
      var temp__3974__auto____8177 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8177) {
        var s__8178 = temp__3974__auto____8177;
        var p__8179 = cljs.core.take.call(null, n, s__8178);
        if(n === cljs.core.count.call(null, p__8179)) {
          return cljs.core.cons.call(null, p__8179, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8178)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8179, pad)))
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
    var sentinel__8184 = cljs.core.lookup_sentinel;
    var m__8185 = m;
    var ks__8186 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8186) {
        var m__8187 = cljs.core._lookup.call(null, m__8185, cljs.core.first.call(null, ks__8186), sentinel__8184);
        if(sentinel__8184 === m__8187) {
          return not_found
        }else {
          var G__8188 = sentinel__8184;
          var G__8189 = m__8187;
          var G__8190 = cljs.core.next.call(null, ks__8186);
          sentinel__8184 = G__8188;
          m__8185 = G__8189;
          ks__8186 = G__8190;
          continue
        }
      }else {
        return m__8185
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
cljs.core.assoc_in = function assoc_in(m, p__8191, v) {
  var vec__8196__8197 = p__8191;
  var k__8198 = cljs.core.nth.call(null, vec__8196__8197, 0, null);
  var ks__8199 = cljs.core.nthnext.call(null, vec__8196__8197, 1);
  if(cljs.core.truth_(ks__8199)) {
    return cljs.core.assoc.call(null, m, k__8198, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8198, null), ks__8199, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8198, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8200, f, args) {
    var vec__8205__8206 = p__8200;
    var k__8207 = cljs.core.nth.call(null, vec__8205__8206, 0, null);
    var ks__8208 = cljs.core.nthnext.call(null, vec__8205__8206, 1);
    if(cljs.core.truth_(ks__8208)) {
      return cljs.core.assoc.call(null, m, k__8207, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8207, null), ks__8208, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8207, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8207, null), args))
    }
  };
  var update_in = function(m, p__8200, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8200, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8209) {
    var m = cljs.core.first(arglist__8209);
    var p__8200 = cljs.core.first(cljs.core.next(arglist__8209));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8209)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8209)));
    return update_in__delegate(m, p__8200, f, args)
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
  var this__8212 = this;
  var h__2192__auto____8213 = this__8212.__hash;
  if(!(h__2192__auto____8213 == null)) {
    return h__2192__auto____8213
  }else {
    var h__2192__auto____8214 = cljs.core.hash_coll.call(null, coll);
    this__8212.__hash = h__2192__auto____8214;
    return h__2192__auto____8214
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8215 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8216 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8217 = this;
  var new_array__8218 = this__8217.array.slice();
  new_array__8218[k] = v;
  return new cljs.core.Vector(this__8217.meta, new_array__8218, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8249 = null;
  var G__8249__2 = function(this_sym8219, k) {
    var this__8221 = this;
    var this_sym8219__8222 = this;
    var coll__8223 = this_sym8219__8222;
    return coll__8223.cljs$core$ILookup$_lookup$arity$2(coll__8223, k)
  };
  var G__8249__3 = function(this_sym8220, k, not_found) {
    var this__8221 = this;
    var this_sym8220__8224 = this;
    var coll__8225 = this_sym8220__8224;
    return coll__8225.cljs$core$ILookup$_lookup$arity$3(coll__8225, k, not_found)
  };
  G__8249 = function(this_sym8220, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8249__2.call(this, this_sym8220, k);
      case 3:
        return G__8249__3.call(this, this_sym8220, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8249
}();
cljs.core.Vector.prototype.apply = function(this_sym8210, args8211) {
  var this__8226 = this;
  return this_sym8210.call.apply(this_sym8210, [this_sym8210].concat(args8211.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8227 = this;
  var new_array__8228 = this__8227.array.slice();
  new_array__8228.push(o);
  return new cljs.core.Vector(this__8227.meta, new_array__8228, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8229 = this;
  var this__8230 = this;
  return cljs.core.pr_str.call(null, this__8230)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8231 = this;
  return cljs.core.ci_reduce.call(null, this__8231.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8232 = this;
  return cljs.core.ci_reduce.call(null, this__8232.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8233 = this;
  if(this__8233.array.length > 0) {
    var vector_seq__8234 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8233.array.length) {
          return cljs.core.cons.call(null, this__8233.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8234.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8235 = this;
  return this__8235.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8236 = this;
  var count__8237 = this__8236.array.length;
  if(count__8237 > 0) {
    return this__8236.array[count__8237 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8238 = this;
  if(this__8238.array.length > 0) {
    var new_array__8239 = this__8238.array.slice();
    new_array__8239.pop();
    return new cljs.core.Vector(this__8238.meta, new_array__8239, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8240 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8241 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8242 = this;
  return new cljs.core.Vector(meta, this__8242.array, this__8242.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8243 = this;
  return this__8243.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8244 = this;
  if(function() {
    var and__3822__auto____8245 = 0 <= n;
    if(and__3822__auto____8245) {
      return n < this__8244.array.length
    }else {
      return and__3822__auto____8245
    }
  }()) {
    return this__8244.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8246 = this;
  if(function() {
    var and__3822__auto____8247 = 0 <= n;
    if(and__3822__auto____8247) {
      return n < this__8246.array.length
    }else {
      return and__3822__auto____8247
    }
  }()) {
    return this__8246.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8248 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8248.meta)
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
  var cnt__8251 = pv.cnt;
  if(cnt__8251 < 32) {
    return 0
  }else {
    return cnt__8251 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8257 = level;
  var ret__8258 = node;
  while(true) {
    if(ll__8257 === 0) {
      return ret__8258
    }else {
      var embed__8259 = ret__8258;
      var r__8260 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8261 = cljs.core.pv_aset.call(null, r__8260, 0, embed__8259);
      var G__8262 = ll__8257 - 5;
      var G__8263 = r__8260;
      ll__8257 = G__8262;
      ret__8258 = G__8263;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8269 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8270 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8269, subidx__8270, tailnode);
    return ret__8269
  }else {
    var child__8271 = cljs.core.pv_aget.call(null, parent, subidx__8270);
    if(!(child__8271 == null)) {
      var node_to_insert__8272 = push_tail.call(null, pv, level - 5, child__8271, tailnode);
      cljs.core.pv_aset.call(null, ret__8269, subidx__8270, node_to_insert__8272);
      return ret__8269
    }else {
      var node_to_insert__8273 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8269, subidx__8270, node_to_insert__8273);
      return ret__8269
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8277 = 0 <= i;
    if(and__3822__auto____8277) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8277
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8278 = pv.root;
      var level__8279 = pv.shift;
      while(true) {
        if(level__8279 > 0) {
          var G__8280 = cljs.core.pv_aget.call(null, node__8278, i >>> level__8279 & 31);
          var G__8281 = level__8279 - 5;
          node__8278 = G__8280;
          level__8279 = G__8281;
          continue
        }else {
          return node__8278.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8284 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8284, i & 31, val);
    return ret__8284
  }else {
    var subidx__8285 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8284, subidx__8285, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8285), i, val));
    return ret__8284
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8291 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8292 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8291));
    if(function() {
      var and__3822__auto____8293 = new_child__8292 == null;
      if(and__3822__auto____8293) {
        return subidx__8291 === 0
      }else {
        return and__3822__auto____8293
      }
    }()) {
      return null
    }else {
      var ret__8294 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8294, subidx__8291, new_child__8292);
      return ret__8294
    }
  }else {
    if(subidx__8291 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8295 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8295, subidx__8291, null);
        return ret__8295
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
  var this__8298 = this;
  return new cljs.core.TransientVector(this__8298.cnt, this__8298.shift, cljs.core.tv_editable_root.call(null, this__8298.root), cljs.core.tv_editable_tail.call(null, this__8298.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8299 = this;
  var h__2192__auto____8300 = this__8299.__hash;
  if(!(h__2192__auto____8300 == null)) {
    return h__2192__auto____8300
  }else {
    var h__2192__auto____8301 = cljs.core.hash_coll.call(null, coll);
    this__8299.__hash = h__2192__auto____8301;
    return h__2192__auto____8301
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8302 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8303 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8304 = this;
  if(function() {
    var and__3822__auto____8305 = 0 <= k;
    if(and__3822__auto____8305) {
      return k < this__8304.cnt
    }else {
      return and__3822__auto____8305
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8306 = this__8304.tail.slice();
      new_tail__8306[k & 31] = v;
      return new cljs.core.PersistentVector(this__8304.meta, this__8304.cnt, this__8304.shift, this__8304.root, new_tail__8306, null)
    }else {
      return new cljs.core.PersistentVector(this__8304.meta, this__8304.cnt, this__8304.shift, cljs.core.do_assoc.call(null, coll, this__8304.shift, this__8304.root, k, v), this__8304.tail, null)
    }
  }else {
    if(k === this__8304.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8304.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8354 = null;
  var G__8354__2 = function(this_sym8307, k) {
    var this__8309 = this;
    var this_sym8307__8310 = this;
    var coll__8311 = this_sym8307__8310;
    return coll__8311.cljs$core$ILookup$_lookup$arity$2(coll__8311, k)
  };
  var G__8354__3 = function(this_sym8308, k, not_found) {
    var this__8309 = this;
    var this_sym8308__8312 = this;
    var coll__8313 = this_sym8308__8312;
    return coll__8313.cljs$core$ILookup$_lookup$arity$3(coll__8313, k, not_found)
  };
  G__8354 = function(this_sym8308, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8354__2.call(this, this_sym8308, k);
      case 3:
        return G__8354__3.call(this, this_sym8308, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8354
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8296, args8297) {
  var this__8314 = this;
  return this_sym8296.call.apply(this_sym8296, [this_sym8296].concat(args8297.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8315 = this;
  var step_init__8316 = [0, init];
  var i__8317 = 0;
  while(true) {
    if(i__8317 < this__8315.cnt) {
      var arr__8318 = cljs.core.array_for.call(null, v, i__8317);
      var len__8319 = arr__8318.length;
      var init__8323 = function() {
        var j__8320 = 0;
        var init__8321 = step_init__8316[1];
        while(true) {
          if(j__8320 < len__8319) {
            var init__8322 = f.call(null, init__8321, j__8320 + i__8317, arr__8318[j__8320]);
            if(cljs.core.reduced_QMARK_.call(null, init__8322)) {
              return init__8322
            }else {
              var G__8355 = j__8320 + 1;
              var G__8356 = init__8322;
              j__8320 = G__8355;
              init__8321 = G__8356;
              continue
            }
          }else {
            step_init__8316[0] = len__8319;
            step_init__8316[1] = init__8321;
            return init__8321
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8323)) {
        return cljs.core.deref.call(null, init__8323)
      }else {
        var G__8357 = i__8317 + step_init__8316[0];
        i__8317 = G__8357;
        continue
      }
    }else {
      return step_init__8316[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8324 = this;
  if(this__8324.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8325 = this__8324.tail.slice();
    new_tail__8325.push(o);
    return new cljs.core.PersistentVector(this__8324.meta, this__8324.cnt + 1, this__8324.shift, this__8324.root, new_tail__8325, null)
  }else {
    var root_overflow_QMARK___8326 = this__8324.cnt >>> 5 > 1 << this__8324.shift;
    var new_shift__8327 = root_overflow_QMARK___8326 ? this__8324.shift + 5 : this__8324.shift;
    var new_root__8329 = root_overflow_QMARK___8326 ? function() {
      var n_r__8328 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8328, 0, this__8324.root);
      cljs.core.pv_aset.call(null, n_r__8328, 1, cljs.core.new_path.call(null, null, this__8324.shift, new cljs.core.VectorNode(null, this__8324.tail)));
      return n_r__8328
    }() : cljs.core.push_tail.call(null, coll, this__8324.shift, this__8324.root, new cljs.core.VectorNode(null, this__8324.tail));
    return new cljs.core.PersistentVector(this__8324.meta, this__8324.cnt + 1, new_shift__8327, new_root__8329, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8330 = this;
  if(this__8330.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8330.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8331 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8332 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8333 = this;
  var this__8334 = this;
  return cljs.core.pr_str.call(null, this__8334)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8335 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8336 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8337 = this;
  if(this__8337.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8338 = this;
  return this__8338.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8339 = this;
  if(this__8339.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8339.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8340 = this;
  if(this__8340.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8340.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8340.meta)
    }else {
      if(1 < this__8340.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8340.meta, this__8340.cnt - 1, this__8340.shift, this__8340.root, this__8340.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8341 = cljs.core.array_for.call(null, coll, this__8340.cnt - 2);
          var nr__8342 = cljs.core.pop_tail.call(null, coll, this__8340.shift, this__8340.root);
          var new_root__8343 = nr__8342 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8342;
          var cnt_1__8344 = this__8340.cnt - 1;
          if(function() {
            var and__3822__auto____8345 = 5 < this__8340.shift;
            if(and__3822__auto____8345) {
              return cljs.core.pv_aget.call(null, new_root__8343, 1) == null
            }else {
              return and__3822__auto____8345
            }
          }()) {
            return new cljs.core.PersistentVector(this__8340.meta, cnt_1__8344, this__8340.shift - 5, cljs.core.pv_aget.call(null, new_root__8343, 0), new_tail__8341, null)
          }else {
            return new cljs.core.PersistentVector(this__8340.meta, cnt_1__8344, this__8340.shift, new_root__8343, new_tail__8341, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8346 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8347 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8348 = this;
  return new cljs.core.PersistentVector(meta, this__8348.cnt, this__8348.shift, this__8348.root, this__8348.tail, this__8348.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8349 = this;
  return this__8349.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8350 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8351 = this;
  if(function() {
    var and__3822__auto____8352 = 0 <= n;
    if(and__3822__auto____8352) {
      return n < this__8351.cnt
    }else {
      return and__3822__auto____8352
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8353 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8353.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8358 = xs.length;
  var xs__8359 = no_clone === true ? xs : xs.slice();
  if(l__8358 < 32) {
    return new cljs.core.PersistentVector(null, l__8358, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8359, null)
  }else {
    var node__8360 = xs__8359.slice(0, 32);
    var v__8361 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8360, null);
    var i__8362 = 32;
    var out__8363 = cljs.core._as_transient.call(null, v__8361);
    while(true) {
      if(i__8362 < l__8358) {
        var G__8364 = i__8362 + 1;
        var G__8365 = cljs.core.conj_BANG_.call(null, out__8363, xs__8359[i__8362]);
        i__8362 = G__8364;
        out__8363 = G__8365;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8363)
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
  vector.cljs$lang$applyTo = function(arglist__8366) {
    var args = cljs.core.seq(arglist__8366);
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
  var this__8367 = this;
  if(this__8367.off + 1 < this__8367.node.length) {
    var s__8368 = cljs.core.chunked_seq.call(null, this__8367.vec, this__8367.node, this__8367.i, this__8367.off + 1);
    if(s__8368 == null) {
      return null
    }else {
      return s__8368
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8369 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8370 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8371 = this;
  return this__8371.node[this__8371.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8372 = this;
  if(this__8372.off + 1 < this__8372.node.length) {
    var s__8373 = cljs.core.chunked_seq.call(null, this__8372.vec, this__8372.node, this__8372.i, this__8372.off + 1);
    if(s__8373 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8373
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8374 = this;
  var l__8375 = this__8374.node.length;
  var s__8376 = this__8374.i + l__8375 < cljs.core._count.call(null, this__8374.vec) ? cljs.core.chunked_seq.call(null, this__8374.vec, this__8374.i + l__8375, 0) : null;
  if(s__8376 == null) {
    return null
  }else {
    return s__8376
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8377 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8378 = this;
  return cljs.core.chunked_seq.call(null, this__8378.vec, this__8378.node, this__8378.i, this__8378.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8379 = this;
  return this__8379.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8380 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8380.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8381 = this;
  return cljs.core.array_chunk.call(null, this__8381.node, this__8381.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8382 = this;
  var l__8383 = this__8382.node.length;
  var s__8384 = this__8382.i + l__8383 < cljs.core._count.call(null, this__8382.vec) ? cljs.core.chunked_seq.call(null, this__8382.vec, this__8382.i + l__8383, 0) : null;
  if(s__8384 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8384
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
  var this__8387 = this;
  var h__2192__auto____8388 = this__8387.__hash;
  if(!(h__2192__auto____8388 == null)) {
    return h__2192__auto____8388
  }else {
    var h__2192__auto____8389 = cljs.core.hash_coll.call(null, coll);
    this__8387.__hash = h__2192__auto____8389;
    return h__2192__auto____8389
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8390 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8391 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8392 = this;
  var v_pos__8393 = this__8392.start + key;
  return new cljs.core.Subvec(this__8392.meta, cljs.core._assoc.call(null, this__8392.v, v_pos__8393, val), this__8392.start, this__8392.end > v_pos__8393 + 1 ? this__8392.end : v_pos__8393 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8419 = null;
  var G__8419__2 = function(this_sym8394, k) {
    var this__8396 = this;
    var this_sym8394__8397 = this;
    var coll__8398 = this_sym8394__8397;
    return coll__8398.cljs$core$ILookup$_lookup$arity$2(coll__8398, k)
  };
  var G__8419__3 = function(this_sym8395, k, not_found) {
    var this__8396 = this;
    var this_sym8395__8399 = this;
    var coll__8400 = this_sym8395__8399;
    return coll__8400.cljs$core$ILookup$_lookup$arity$3(coll__8400, k, not_found)
  };
  G__8419 = function(this_sym8395, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8419__2.call(this, this_sym8395, k);
      case 3:
        return G__8419__3.call(this, this_sym8395, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8419
}();
cljs.core.Subvec.prototype.apply = function(this_sym8385, args8386) {
  var this__8401 = this;
  return this_sym8385.call.apply(this_sym8385, [this_sym8385].concat(args8386.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8402 = this;
  return new cljs.core.Subvec(this__8402.meta, cljs.core._assoc_n.call(null, this__8402.v, this__8402.end, o), this__8402.start, this__8402.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8403 = this;
  var this__8404 = this;
  return cljs.core.pr_str.call(null, this__8404)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8405 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8406 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8407 = this;
  var subvec_seq__8408 = function subvec_seq(i) {
    if(i === this__8407.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8407.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8408.call(null, this__8407.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8409 = this;
  return this__8409.end - this__8409.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8410 = this;
  return cljs.core._nth.call(null, this__8410.v, this__8410.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8411 = this;
  if(this__8411.start === this__8411.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8411.meta, this__8411.v, this__8411.start, this__8411.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8412 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8413 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8414 = this;
  return new cljs.core.Subvec(meta, this__8414.v, this__8414.start, this__8414.end, this__8414.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8415 = this;
  return this__8415.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8416 = this;
  return cljs.core._nth.call(null, this__8416.v, this__8416.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8417 = this;
  return cljs.core._nth.call(null, this__8417.v, this__8417.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8418 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8418.meta)
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
  var ret__8421 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8421, 0, tl.length);
  return ret__8421
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8425 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8426 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8425, subidx__8426, level === 5 ? tail_node : function() {
    var child__8427 = cljs.core.pv_aget.call(null, ret__8425, subidx__8426);
    if(!(child__8427 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8427, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8425
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8432 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8433 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8434 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8432, subidx__8433));
    if(function() {
      var and__3822__auto____8435 = new_child__8434 == null;
      if(and__3822__auto____8435) {
        return subidx__8433 === 0
      }else {
        return and__3822__auto____8435
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8432, subidx__8433, new_child__8434);
      return node__8432
    }
  }else {
    if(subidx__8433 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8432, subidx__8433, null);
        return node__8432
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8440 = 0 <= i;
    if(and__3822__auto____8440) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8440
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8441 = tv.root;
      var node__8442 = root__8441;
      var level__8443 = tv.shift;
      while(true) {
        if(level__8443 > 0) {
          var G__8444 = cljs.core.tv_ensure_editable.call(null, root__8441.edit, cljs.core.pv_aget.call(null, node__8442, i >>> level__8443 & 31));
          var G__8445 = level__8443 - 5;
          node__8442 = G__8444;
          level__8443 = G__8445;
          continue
        }else {
          return node__8442.arr
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
  var G__8485 = null;
  var G__8485__2 = function(this_sym8448, k) {
    var this__8450 = this;
    var this_sym8448__8451 = this;
    var coll__8452 = this_sym8448__8451;
    return coll__8452.cljs$core$ILookup$_lookup$arity$2(coll__8452, k)
  };
  var G__8485__3 = function(this_sym8449, k, not_found) {
    var this__8450 = this;
    var this_sym8449__8453 = this;
    var coll__8454 = this_sym8449__8453;
    return coll__8454.cljs$core$ILookup$_lookup$arity$3(coll__8454, k, not_found)
  };
  G__8485 = function(this_sym8449, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8485__2.call(this, this_sym8449, k);
      case 3:
        return G__8485__3.call(this, this_sym8449, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8485
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8446, args8447) {
  var this__8455 = this;
  return this_sym8446.call.apply(this_sym8446, [this_sym8446].concat(args8447.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8456 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8457 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8458 = this;
  if(this__8458.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8459 = this;
  if(function() {
    var and__3822__auto____8460 = 0 <= n;
    if(and__3822__auto____8460) {
      return n < this__8459.cnt
    }else {
      return and__3822__auto____8460
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8461 = this;
  if(this__8461.root.edit) {
    return this__8461.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8462 = this;
  if(this__8462.root.edit) {
    if(function() {
      var and__3822__auto____8463 = 0 <= n;
      if(and__3822__auto____8463) {
        return n < this__8462.cnt
      }else {
        return and__3822__auto____8463
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8462.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8468 = function go(level, node) {
          var node__8466 = cljs.core.tv_ensure_editable.call(null, this__8462.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8466, n & 31, val);
            return node__8466
          }else {
            var subidx__8467 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8466, subidx__8467, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8466, subidx__8467)));
            return node__8466
          }
        }.call(null, this__8462.shift, this__8462.root);
        this__8462.root = new_root__8468;
        return tcoll
      }
    }else {
      if(n === this__8462.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8462.cnt)].join(""));
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
  var this__8469 = this;
  if(this__8469.root.edit) {
    if(this__8469.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8469.cnt) {
        this__8469.cnt = 0;
        return tcoll
      }else {
        if((this__8469.cnt - 1 & 31) > 0) {
          this__8469.cnt = this__8469.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8470 = cljs.core.editable_array_for.call(null, tcoll, this__8469.cnt - 2);
            var new_root__8472 = function() {
              var nr__8471 = cljs.core.tv_pop_tail.call(null, tcoll, this__8469.shift, this__8469.root);
              if(!(nr__8471 == null)) {
                return nr__8471
              }else {
                return new cljs.core.VectorNode(this__8469.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8473 = 5 < this__8469.shift;
              if(and__3822__auto____8473) {
                return cljs.core.pv_aget.call(null, new_root__8472, 1) == null
              }else {
                return and__3822__auto____8473
              }
            }()) {
              var new_root__8474 = cljs.core.tv_ensure_editable.call(null, this__8469.root.edit, cljs.core.pv_aget.call(null, new_root__8472, 0));
              this__8469.root = new_root__8474;
              this__8469.shift = this__8469.shift - 5;
              this__8469.cnt = this__8469.cnt - 1;
              this__8469.tail = new_tail__8470;
              return tcoll
            }else {
              this__8469.root = new_root__8472;
              this__8469.cnt = this__8469.cnt - 1;
              this__8469.tail = new_tail__8470;
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
  var this__8475 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8476 = this;
  if(this__8476.root.edit) {
    if(this__8476.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8476.tail[this__8476.cnt & 31] = o;
      this__8476.cnt = this__8476.cnt + 1;
      return tcoll
    }else {
      var tail_node__8477 = new cljs.core.VectorNode(this__8476.root.edit, this__8476.tail);
      var new_tail__8478 = cljs.core.make_array.call(null, 32);
      new_tail__8478[0] = o;
      this__8476.tail = new_tail__8478;
      if(this__8476.cnt >>> 5 > 1 << this__8476.shift) {
        var new_root_array__8479 = cljs.core.make_array.call(null, 32);
        var new_shift__8480 = this__8476.shift + 5;
        new_root_array__8479[0] = this__8476.root;
        new_root_array__8479[1] = cljs.core.new_path.call(null, this__8476.root.edit, this__8476.shift, tail_node__8477);
        this__8476.root = new cljs.core.VectorNode(this__8476.root.edit, new_root_array__8479);
        this__8476.shift = new_shift__8480;
        this__8476.cnt = this__8476.cnt + 1;
        return tcoll
      }else {
        var new_root__8481 = cljs.core.tv_push_tail.call(null, tcoll, this__8476.shift, this__8476.root, tail_node__8477);
        this__8476.root = new_root__8481;
        this__8476.cnt = this__8476.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8482 = this;
  if(this__8482.root.edit) {
    this__8482.root.edit = null;
    var len__8483 = this__8482.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8484 = cljs.core.make_array.call(null, len__8483);
    cljs.core.array_copy.call(null, this__8482.tail, 0, trimmed_tail__8484, 0, len__8483);
    return new cljs.core.PersistentVector(null, this__8482.cnt, this__8482.shift, this__8482.root, trimmed_tail__8484, null)
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
  var this__8486 = this;
  var h__2192__auto____8487 = this__8486.__hash;
  if(!(h__2192__auto____8487 == null)) {
    return h__2192__auto____8487
  }else {
    var h__2192__auto____8488 = cljs.core.hash_coll.call(null, coll);
    this__8486.__hash = h__2192__auto____8488;
    return h__2192__auto____8488
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8489 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8490 = this;
  var this__8491 = this;
  return cljs.core.pr_str.call(null, this__8491)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8492 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8493 = this;
  return cljs.core._first.call(null, this__8493.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8494 = this;
  var temp__3971__auto____8495 = cljs.core.next.call(null, this__8494.front);
  if(temp__3971__auto____8495) {
    var f1__8496 = temp__3971__auto____8495;
    return new cljs.core.PersistentQueueSeq(this__8494.meta, f1__8496, this__8494.rear, null)
  }else {
    if(this__8494.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8494.meta, this__8494.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8497 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8498 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8498.front, this__8498.rear, this__8498.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8499 = this;
  return this__8499.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8500 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8500.meta)
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
  var this__8501 = this;
  var h__2192__auto____8502 = this__8501.__hash;
  if(!(h__2192__auto____8502 == null)) {
    return h__2192__auto____8502
  }else {
    var h__2192__auto____8503 = cljs.core.hash_coll.call(null, coll);
    this__8501.__hash = h__2192__auto____8503;
    return h__2192__auto____8503
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8504 = this;
  if(cljs.core.truth_(this__8504.front)) {
    return new cljs.core.PersistentQueue(this__8504.meta, this__8504.count + 1, this__8504.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8505 = this__8504.rear;
      if(cljs.core.truth_(or__3824__auto____8505)) {
        return or__3824__auto____8505
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8504.meta, this__8504.count + 1, cljs.core.conj.call(null, this__8504.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8506 = this;
  var this__8507 = this;
  return cljs.core.pr_str.call(null, this__8507)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8508 = this;
  var rear__8509 = cljs.core.seq.call(null, this__8508.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8510 = this__8508.front;
    if(cljs.core.truth_(or__3824__auto____8510)) {
      return or__3824__auto____8510
    }else {
      return rear__8509
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8508.front, cljs.core.seq.call(null, rear__8509), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8511 = this;
  return this__8511.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8512 = this;
  return cljs.core._first.call(null, this__8512.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8513 = this;
  if(cljs.core.truth_(this__8513.front)) {
    var temp__3971__auto____8514 = cljs.core.next.call(null, this__8513.front);
    if(temp__3971__auto____8514) {
      var f1__8515 = temp__3971__auto____8514;
      return new cljs.core.PersistentQueue(this__8513.meta, this__8513.count - 1, f1__8515, this__8513.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8513.meta, this__8513.count - 1, cljs.core.seq.call(null, this__8513.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8516 = this;
  return cljs.core.first.call(null, this__8516.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8517 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8518 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8519 = this;
  return new cljs.core.PersistentQueue(meta, this__8519.count, this__8519.front, this__8519.rear, this__8519.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8520 = this;
  return this__8520.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8521 = this;
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
  var this__8522 = this;
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
  var len__8525 = array.length;
  var i__8526 = 0;
  while(true) {
    if(i__8526 < len__8525) {
      if(k === array[i__8526]) {
        return i__8526
      }else {
        var G__8527 = i__8526 + incr;
        i__8526 = G__8527;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8530 = cljs.core.hash.call(null, a);
  var b__8531 = cljs.core.hash.call(null, b);
  if(a__8530 < b__8531) {
    return-1
  }else {
    if(a__8530 > b__8531) {
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
  var ks__8539 = m.keys;
  var len__8540 = ks__8539.length;
  var so__8541 = m.strobj;
  var out__8542 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8543 = 0;
  var out__8544 = cljs.core.transient$.call(null, out__8542);
  while(true) {
    if(i__8543 < len__8540) {
      var k__8545 = ks__8539[i__8543];
      var G__8546 = i__8543 + 1;
      var G__8547 = cljs.core.assoc_BANG_.call(null, out__8544, k__8545, so__8541[k__8545]);
      i__8543 = G__8546;
      out__8544 = G__8547;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8544, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8553 = {};
  var l__8554 = ks.length;
  var i__8555 = 0;
  while(true) {
    if(i__8555 < l__8554) {
      var k__8556 = ks[i__8555];
      new_obj__8553[k__8556] = obj[k__8556];
      var G__8557 = i__8555 + 1;
      i__8555 = G__8557;
      continue
    }else {
    }
    break
  }
  return new_obj__8553
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
  var this__8560 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8561 = this;
  var h__2192__auto____8562 = this__8561.__hash;
  if(!(h__2192__auto____8562 == null)) {
    return h__2192__auto____8562
  }else {
    var h__2192__auto____8563 = cljs.core.hash_imap.call(null, coll);
    this__8561.__hash = h__2192__auto____8563;
    return h__2192__auto____8563
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8564 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8565 = this;
  if(function() {
    var and__3822__auto____8566 = goog.isString(k);
    if(and__3822__auto____8566) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8565.keys) == null)
    }else {
      return and__3822__auto____8566
    }
  }()) {
    return this__8565.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8567 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8568 = this__8567.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8568) {
        return or__3824__auto____8568
      }else {
        return this__8567.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8567.keys) == null)) {
        var new_strobj__8569 = cljs.core.obj_clone.call(null, this__8567.strobj, this__8567.keys);
        new_strobj__8569[k] = v;
        return new cljs.core.ObjMap(this__8567.meta, this__8567.keys, new_strobj__8569, this__8567.update_count + 1, null)
      }else {
        var new_strobj__8570 = cljs.core.obj_clone.call(null, this__8567.strobj, this__8567.keys);
        var new_keys__8571 = this__8567.keys.slice();
        new_strobj__8570[k] = v;
        new_keys__8571.push(k);
        return new cljs.core.ObjMap(this__8567.meta, new_keys__8571, new_strobj__8570, this__8567.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8572 = this;
  if(function() {
    var and__3822__auto____8573 = goog.isString(k);
    if(and__3822__auto____8573) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8572.keys) == null)
    }else {
      return and__3822__auto____8573
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8595 = null;
  var G__8595__2 = function(this_sym8574, k) {
    var this__8576 = this;
    var this_sym8574__8577 = this;
    var coll__8578 = this_sym8574__8577;
    return coll__8578.cljs$core$ILookup$_lookup$arity$2(coll__8578, k)
  };
  var G__8595__3 = function(this_sym8575, k, not_found) {
    var this__8576 = this;
    var this_sym8575__8579 = this;
    var coll__8580 = this_sym8575__8579;
    return coll__8580.cljs$core$ILookup$_lookup$arity$3(coll__8580, k, not_found)
  };
  G__8595 = function(this_sym8575, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8595__2.call(this, this_sym8575, k);
      case 3:
        return G__8595__3.call(this, this_sym8575, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8595
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8558, args8559) {
  var this__8581 = this;
  return this_sym8558.call.apply(this_sym8558, [this_sym8558].concat(args8559.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8582 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8583 = this;
  var this__8584 = this;
  return cljs.core.pr_str.call(null, this__8584)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8585 = this;
  if(this__8585.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8548_SHARP_) {
      return cljs.core.vector.call(null, p1__8548_SHARP_, this__8585.strobj[p1__8548_SHARP_])
    }, this__8585.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8586 = this;
  return this__8586.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8587 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8588 = this;
  return new cljs.core.ObjMap(meta, this__8588.keys, this__8588.strobj, this__8588.update_count, this__8588.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8589 = this;
  return this__8589.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8590 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8590.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8591 = this;
  if(function() {
    var and__3822__auto____8592 = goog.isString(k);
    if(and__3822__auto____8592) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8591.keys) == null)
    }else {
      return and__3822__auto____8592
    }
  }()) {
    var new_keys__8593 = this__8591.keys.slice();
    var new_strobj__8594 = cljs.core.obj_clone.call(null, this__8591.strobj, this__8591.keys);
    new_keys__8593.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8593), 1);
    cljs.core.js_delete.call(null, new_strobj__8594, k);
    return new cljs.core.ObjMap(this__8591.meta, new_keys__8593, new_strobj__8594, this__8591.update_count + 1, null)
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
  var this__8599 = this;
  var h__2192__auto____8600 = this__8599.__hash;
  if(!(h__2192__auto____8600 == null)) {
    return h__2192__auto____8600
  }else {
    var h__2192__auto____8601 = cljs.core.hash_imap.call(null, coll);
    this__8599.__hash = h__2192__auto____8601;
    return h__2192__auto____8601
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8602 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8603 = this;
  var bucket__8604 = this__8603.hashobj[cljs.core.hash.call(null, k)];
  var i__8605 = cljs.core.truth_(bucket__8604) ? cljs.core.scan_array.call(null, 2, k, bucket__8604) : null;
  if(cljs.core.truth_(i__8605)) {
    return bucket__8604[i__8605 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8606 = this;
  var h__8607 = cljs.core.hash.call(null, k);
  var bucket__8608 = this__8606.hashobj[h__8607];
  if(cljs.core.truth_(bucket__8608)) {
    var new_bucket__8609 = bucket__8608.slice();
    var new_hashobj__8610 = goog.object.clone(this__8606.hashobj);
    new_hashobj__8610[h__8607] = new_bucket__8609;
    var temp__3971__auto____8611 = cljs.core.scan_array.call(null, 2, k, new_bucket__8609);
    if(cljs.core.truth_(temp__3971__auto____8611)) {
      var i__8612 = temp__3971__auto____8611;
      new_bucket__8609[i__8612 + 1] = v;
      return new cljs.core.HashMap(this__8606.meta, this__8606.count, new_hashobj__8610, null)
    }else {
      new_bucket__8609.push(k, v);
      return new cljs.core.HashMap(this__8606.meta, this__8606.count + 1, new_hashobj__8610, null)
    }
  }else {
    var new_hashobj__8613 = goog.object.clone(this__8606.hashobj);
    new_hashobj__8613[h__8607] = [k, v];
    return new cljs.core.HashMap(this__8606.meta, this__8606.count + 1, new_hashobj__8613, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8614 = this;
  var bucket__8615 = this__8614.hashobj[cljs.core.hash.call(null, k)];
  var i__8616 = cljs.core.truth_(bucket__8615) ? cljs.core.scan_array.call(null, 2, k, bucket__8615) : null;
  if(cljs.core.truth_(i__8616)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8641 = null;
  var G__8641__2 = function(this_sym8617, k) {
    var this__8619 = this;
    var this_sym8617__8620 = this;
    var coll__8621 = this_sym8617__8620;
    return coll__8621.cljs$core$ILookup$_lookup$arity$2(coll__8621, k)
  };
  var G__8641__3 = function(this_sym8618, k, not_found) {
    var this__8619 = this;
    var this_sym8618__8622 = this;
    var coll__8623 = this_sym8618__8622;
    return coll__8623.cljs$core$ILookup$_lookup$arity$3(coll__8623, k, not_found)
  };
  G__8641 = function(this_sym8618, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8641__2.call(this, this_sym8618, k);
      case 3:
        return G__8641__3.call(this, this_sym8618, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8641
}();
cljs.core.HashMap.prototype.apply = function(this_sym8597, args8598) {
  var this__8624 = this;
  return this_sym8597.call.apply(this_sym8597, [this_sym8597].concat(args8598.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8625 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8626 = this;
  var this__8627 = this;
  return cljs.core.pr_str.call(null, this__8627)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8628 = this;
  if(this__8628.count > 0) {
    var hashes__8629 = cljs.core.js_keys.call(null, this__8628.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8596_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8628.hashobj[p1__8596_SHARP_]))
    }, hashes__8629)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8630 = this;
  return this__8630.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8631 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8632 = this;
  return new cljs.core.HashMap(meta, this__8632.count, this__8632.hashobj, this__8632.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8633 = this;
  return this__8633.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8634 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8634.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8635 = this;
  var h__8636 = cljs.core.hash.call(null, k);
  var bucket__8637 = this__8635.hashobj[h__8636];
  var i__8638 = cljs.core.truth_(bucket__8637) ? cljs.core.scan_array.call(null, 2, k, bucket__8637) : null;
  if(cljs.core.not.call(null, i__8638)) {
    return coll
  }else {
    var new_hashobj__8639 = goog.object.clone(this__8635.hashobj);
    if(3 > bucket__8637.length) {
      cljs.core.js_delete.call(null, new_hashobj__8639, h__8636)
    }else {
      var new_bucket__8640 = bucket__8637.slice();
      new_bucket__8640.splice(i__8638, 2);
      new_hashobj__8639[h__8636] = new_bucket__8640
    }
    return new cljs.core.HashMap(this__8635.meta, this__8635.count - 1, new_hashobj__8639, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8642 = ks.length;
  var i__8643 = 0;
  var out__8644 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8643 < len__8642) {
      var G__8645 = i__8643 + 1;
      var G__8646 = cljs.core.assoc.call(null, out__8644, ks[i__8643], vs[i__8643]);
      i__8643 = G__8645;
      out__8644 = G__8646;
      continue
    }else {
      return out__8644
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8650 = m.arr;
  var len__8651 = arr__8650.length;
  var i__8652 = 0;
  while(true) {
    if(len__8651 <= i__8652) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8650[i__8652], k)) {
        return i__8652
      }else {
        if("\ufdd0'else") {
          var G__8653 = i__8652 + 2;
          i__8652 = G__8653;
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
  var this__8656 = this;
  return new cljs.core.TransientArrayMap({}, this__8656.arr.length, this__8656.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8657 = this;
  var h__2192__auto____8658 = this__8657.__hash;
  if(!(h__2192__auto____8658 == null)) {
    return h__2192__auto____8658
  }else {
    var h__2192__auto____8659 = cljs.core.hash_imap.call(null, coll);
    this__8657.__hash = h__2192__auto____8659;
    return h__2192__auto____8659
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8660 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8661 = this;
  var idx__8662 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8662 === -1) {
    return not_found
  }else {
    return this__8661.arr[idx__8662 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8663 = this;
  var idx__8664 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8664 === -1) {
    if(this__8663.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8663.meta, this__8663.cnt + 1, function() {
        var G__8665__8666 = this__8663.arr.slice();
        G__8665__8666.push(k);
        G__8665__8666.push(v);
        return G__8665__8666
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8663.arr[idx__8664 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8663.meta, this__8663.cnt, function() {
          var G__8667__8668 = this__8663.arr.slice();
          G__8667__8668[idx__8664 + 1] = v;
          return G__8667__8668
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8669 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8701 = null;
  var G__8701__2 = function(this_sym8670, k) {
    var this__8672 = this;
    var this_sym8670__8673 = this;
    var coll__8674 = this_sym8670__8673;
    return coll__8674.cljs$core$ILookup$_lookup$arity$2(coll__8674, k)
  };
  var G__8701__3 = function(this_sym8671, k, not_found) {
    var this__8672 = this;
    var this_sym8671__8675 = this;
    var coll__8676 = this_sym8671__8675;
    return coll__8676.cljs$core$ILookup$_lookup$arity$3(coll__8676, k, not_found)
  };
  G__8701 = function(this_sym8671, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8701__2.call(this, this_sym8671, k);
      case 3:
        return G__8701__3.call(this, this_sym8671, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8701
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8654, args8655) {
  var this__8677 = this;
  return this_sym8654.call.apply(this_sym8654, [this_sym8654].concat(args8655.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8678 = this;
  var len__8679 = this__8678.arr.length;
  var i__8680 = 0;
  var init__8681 = init;
  while(true) {
    if(i__8680 < len__8679) {
      var init__8682 = f.call(null, init__8681, this__8678.arr[i__8680], this__8678.arr[i__8680 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8682)) {
        return cljs.core.deref.call(null, init__8682)
      }else {
        var G__8702 = i__8680 + 2;
        var G__8703 = init__8682;
        i__8680 = G__8702;
        init__8681 = G__8703;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8683 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8684 = this;
  var this__8685 = this;
  return cljs.core.pr_str.call(null, this__8685)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8686 = this;
  if(this__8686.cnt > 0) {
    var len__8687 = this__8686.arr.length;
    var array_map_seq__8688 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8687) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8686.arr[i], this__8686.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8688.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8689 = this;
  return this__8689.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8690 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8691 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8691.cnt, this__8691.arr, this__8691.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8692 = this;
  return this__8692.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8693 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8693.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8694 = this;
  var idx__8695 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8695 >= 0) {
    var len__8696 = this__8694.arr.length;
    var new_len__8697 = len__8696 - 2;
    if(new_len__8697 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8698 = cljs.core.make_array.call(null, new_len__8697);
      var s__8699 = 0;
      var d__8700 = 0;
      while(true) {
        if(s__8699 >= len__8696) {
          return new cljs.core.PersistentArrayMap(this__8694.meta, this__8694.cnt - 1, new_arr__8698, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8694.arr[s__8699])) {
            var G__8704 = s__8699 + 2;
            var G__8705 = d__8700;
            s__8699 = G__8704;
            d__8700 = G__8705;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8698[d__8700] = this__8694.arr[s__8699];
              new_arr__8698[d__8700 + 1] = this__8694.arr[s__8699 + 1];
              var G__8706 = s__8699 + 2;
              var G__8707 = d__8700 + 2;
              s__8699 = G__8706;
              d__8700 = G__8707;
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
  var len__8708 = cljs.core.count.call(null, ks);
  var i__8709 = 0;
  var out__8710 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8709 < len__8708) {
      var G__8711 = i__8709 + 1;
      var G__8712 = cljs.core.assoc_BANG_.call(null, out__8710, ks[i__8709], vs[i__8709]);
      i__8709 = G__8711;
      out__8710 = G__8712;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8710)
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
  var this__8713 = this;
  if(cljs.core.truth_(this__8713.editable_QMARK_)) {
    var idx__8714 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8714 >= 0) {
      this__8713.arr[idx__8714] = this__8713.arr[this__8713.len - 2];
      this__8713.arr[idx__8714 + 1] = this__8713.arr[this__8713.len - 1];
      var G__8715__8716 = this__8713.arr;
      G__8715__8716.pop();
      G__8715__8716.pop();
      G__8715__8716;
      this__8713.len = this__8713.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8717 = this;
  if(cljs.core.truth_(this__8717.editable_QMARK_)) {
    var idx__8718 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8718 === -1) {
      if(this__8717.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8717.len = this__8717.len + 2;
        this__8717.arr.push(key);
        this__8717.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8717.len, this__8717.arr), key, val)
      }
    }else {
      if(val === this__8717.arr[idx__8718 + 1]) {
        return tcoll
      }else {
        this__8717.arr[idx__8718 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8719 = this;
  if(cljs.core.truth_(this__8719.editable_QMARK_)) {
    if(function() {
      var G__8720__8721 = o;
      if(G__8720__8721) {
        if(function() {
          var or__3824__auto____8722 = G__8720__8721.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8722) {
            return or__3824__auto____8722
          }else {
            return G__8720__8721.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8720__8721.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8720__8721)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8720__8721)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8723 = cljs.core.seq.call(null, o);
      var tcoll__8724 = tcoll;
      while(true) {
        var temp__3971__auto____8725 = cljs.core.first.call(null, es__8723);
        if(cljs.core.truth_(temp__3971__auto____8725)) {
          var e__8726 = temp__3971__auto____8725;
          var G__8732 = cljs.core.next.call(null, es__8723);
          var G__8733 = tcoll__8724.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8724, cljs.core.key.call(null, e__8726), cljs.core.val.call(null, e__8726));
          es__8723 = G__8732;
          tcoll__8724 = G__8733;
          continue
        }else {
          return tcoll__8724
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8727 = this;
  if(cljs.core.truth_(this__8727.editable_QMARK_)) {
    this__8727.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8727.len, 2), this__8727.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8728 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8729 = this;
  if(cljs.core.truth_(this__8729.editable_QMARK_)) {
    var idx__8730 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8730 === -1) {
      return not_found
    }else {
      return this__8729.arr[idx__8730 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8731 = this;
  if(cljs.core.truth_(this__8731.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8731.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8736 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8737 = 0;
  while(true) {
    if(i__8737 < len) {
      var G__8738 = cljs.core.assoc_BANG_.call(null, out__8736, arr[i__8737], arr[i__8737 + 1]);
      var G__8739 = i__8737 + 2;
      out__8736 = G__8738;
      i__8737 = G__8739;
      continue
    }else {
      return out__8736
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
    var G__8744__8745 = arr.slice();
    G__8744__8745[i] = a;
    return G__8744__8745
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8746__8747 = arr.slice();
    G__8746__8747[i] = a;
    G__8746__8747[j] = b;
    return G__8746__8747
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
  var new_arr__8749 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8749, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8749, 2 * i, new_arr__8749.length - 2 * i);
  return new_arr__8749
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
    var editable__8752 = inode.ensure_editable(edit);
    editable__8752.arr[i] = a;
    return editable__8752
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8753 = inode.ensure_editable(edit);
    editable__8753.arr[i] = a;
    editable__8753.arr[j] = b;
    return editable__8753
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
  var len__8760 = arr.length;
  var i__8761 = 0;
  var init__8762 = init;
  while(true) {
    if(i__8761 < len__8760) {
      var init__8765 = function() {
        var k__8763 = arr[i__8761];
        if(!(k__8763 == null)) {
          return f.call(null, init__8762, k__8763, arr[i__8761 + 1])
        }else {
          var node__8764 = arr[i__8761 + 1];
          if(!(node__8764 == null)) {
            return node__8764.kv_reduce(f, init__8762)
          }else {
            return init__8762
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8765)) {
        return cljs.core.deref.call(null, init__8765)
      }else {
        var G__8766 = i__8761 + 2;
        var G__8767 = init__8765;
        i__8761 = G__8766;
        init__8762 = G__8767;
        continue
      }
    }else {
      return init__8762
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
  var this__8768 = this;
  var inode__8769 = this;
  if(this__8768.bitmap === bit) {
    return null
  }else {
    var editable__8770 = inode__8769.ensure_editable(e);
    var earr__8771 = editable__8770.arr;
    var len__8772 = earr__8771.length;
    editable__8770.bitmap = bit ^ editable__8770.bitmap;
    cljs.core.array_copy.call(null, earr__8771, 2 * (i + 1), earr__8771, 2 * i, len__8772 - 2 * (i + 1));
    earr__8771[len__8772 - 2] = null;
    earr__8771[len__8772 - 1] = null;
    return editable__8770
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8773 = this;
  var inode__8774 = this;
  var bit__8775 = 1 << (hash >>> shift & 31);
  var idx__8776 = cljs.core.bitmap_indexed_node_index.call(null, this__8773.bitmap, bit__8775);
  if((this__8773.bitmap & bit__8775) === 0) {
    var n__8777 = cljs.core.bit_count.call(null, this__8773.bitmap);
    if(2 * n__8777 < this__8773.arr.length) {
      var editable__8778 = inode__8774.ensure_editable(edit);
      var earr__8779 = editable__8778.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8779, 2 * idx__8776, earr__8779, 2 * (idx__8776 + 1), 2 * (n__8777 - idx__8776));
      earr__8779[2 * idx__8776] = key;
      earr__8779[2 * idx__8776 + 1] = val;
      editable__8778.bitmap = editable__8778.bitmap | bit__8775;
      return editable__8778
    }else {
      if(n__8777 >= 16) {
        var nodes__8780 = cljs.core.make_array.call(null, 32);
        var jdx__8781 = hash >>> shift & 31;
        nodes__8780[jdx__8781] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8782 = 0;
        var j__8783 = 0;
        while(true) {
          if(i__8782 < 32) {
            if((this__8773.bitmap >>> i__8782 & 1) === 0) {
              var G__8836 = i__8782 + 1;
              var G__8837 = j__8783;
              i__8782 = G__8836;
              j__8783 = G__8837;
              continue
            }else {
              nodes__8780[i__8782] = !(this__8773.arr[j__8783] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8773.arr[j__8783]), this__8773.arr[j__8783], this__8773.arr[j__8783 + 1], added_leaf_QMARK_) : this__8773.arr[j__8783 + 1];
              var G__8838 = i__8782 + 1;
              var G__8839 = j__8783 + 2;
              i__8782 = G__8838;
              j__8783 = G__8839;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8777 + 1, nodes__8780)
      }else {
        if("\ufdd0'else") {
          var new_arr__8784 = cljs.core.make_array.call(null, 2 * (n__8777 + 4));
          cljs.core.array_copy.call(null, this__8773.arr, 0, new_arr__8784, 0, 2 * idx__8776);
          new_arr__8784[2 * idx__8776] = key;
          new_arr__8784[2 * idx__8776 + 1] = val;
          cljs.core.array_copy.call(null, this__8773.arr, 2 * idx__8776, new_arr__8784, 2 * (idx__8776 + 1), 2 * (n__8777 - idx__8776));
          added_leaf_QMARK_.val = true;
          var editable__8785 = inode__8774.ensure_editable(edit);
          editable__8785.arr = new_arr__8784;
          editable__8785.bitmap = editable__8785.bitmap | bit__8775;
          return editable__8785
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8786 = this__8773.arr[2 * idx__8776];
    var val_or_node__8787 = this__8773.arr[2 * idx__8776 + 1];
    if(key_or_nil__8786 == null) {
      var n__8788 = val_or_node__8787.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8788 === val_or_node__8787) {
        return inode__8774
      }else {
        return cljs.core.edit_and_set.call(null, inode__8774, edit, 2 * idx__8776 + 1, n__8788)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8786)) {
        if(val === val_or_node__8787) {
          return inode__8774
        }else {
          return cljs.core.edit_and_set.call(null, inode__8774, edit, 2 * idx__8776 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8774, edit, 2 * idx__8776, null, 2 * idx__8776 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8786, val_or_node__8787, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8789 = this;
  var inode__8790 = this;
  return cljs.core.create_inode_seq.call(null, this__8789.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8791 = this;
  var inode__8792 = this;
  var bit__8793 = 1 << (hash >>> shift & 31);
  if((this__8791.bitmap & bit__8793) === 0) {
    return inode__8792
  }else {
    var idx__8794 = cljs.core.bitmap_indexed_node_index.call(null, this__8791.bitmap, bit__8793);
    var key_or_nil__8795 = this__8791.arr[2 * idx__8794];
    var val_or_node__8796 = this__8791.arr[2 * idx__8794 + 1];
    if(key_or_nil__8795 == null) {
      var n__8797 = val_or_node__8796.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8797 === val_or_node__8796) {
        return inode__8792
      }else {
        if(!(n__8797 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8792, edit, 2 * idx__8794 + 1, n__8797)
        }else {
          if(this__8791.bitmap === bit__8793) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8792.edit_and_remove_pair(edit, bit__8793, idx__8794)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8795)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8792.edit_and_remove_pair(edit, bit__8793, idx__8794)
      }else {
        if("\ufdd0'else") {
          return inode__8792
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8798 = this;
  var inode__8799 = this;
  if(e === this__8798.edit) {
    return inode__8799
  }else {
    var n__8800 = cljs.core.bit_count.call(null, this__8798.bitmap);
    var new_arr__8801 = cljs.core.make_array.call(null, n__8800 < 0 ? 4 : 2 * (n__8800 + 1));
    cljs.core.array_copy.call(null, this__8798.arr, 0, new_arr__8801, 0, 2 * n__8800);
    return new cljs.core.BitmapIndexedNode(e, this__8798.bitmap, new_arr__8801)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8802 = this;
  var inode__8803 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8802.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8804 = this;
  var inode__8805 = this;
  var bit__8806 = 1 << (hash >>> shift & 31);
  if((this__8804.bitmap & bit__8806) === 0) {
    return not_found
  }else {
    var idx__8807 = cljs.core.bitmap_indexed_node_index.call(null, this__8804.bitmap, bit__8806);
    var key_or_nil__8808 = this__8804.arr[2 * idx__8807];
    var val_or_node__8809 = this__8804.arr[2 * idx__8807 + 1];
    if(key_or_nil__8808 == null) {
      return val_or_node__8809.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8808)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8808, val_or_node__8809], true)
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
  var this__8810 = this;
  var inode__8811 = this;
  var bit__8812 = 1 << (hash >>> shift & 31);
  if((this__8810.bitmap & bit__8812) === 0) {
    return inode__8811
  }else {
    var idx__8813 = cljs.core.bitmap_indexed_node_index.call(null, this__8810.bitmap, bit__8812);
    var key_or_nil__8814 = this__8810.arr[2 * idx__8813];
    var val_or_node__8815 = this__8810.arr[2 * idx__8813 + 1];
    if(key_or_nil__8814 == null) {
      var n__8816 = val_or_node__8815.inode_without(shift + 5, hash, key);
      if(n__8816 === val_or_node__8815) {
        return inode__8811
      }else {
        if(!(n__8816 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8810.bitmap, cljs.core.clone_and_set.call(null, this__8810.arr, 2 * idx__8813 + 1, n__8816))
        }else {
          if(this__8810.bitmap === bit__8812) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8810.bitmap ^ bit__8812, cljs.core.remove_pair.call(null, this__8810.arr, idx__8813))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8814)) {
        return new cljs.core.BitmapIndexedNode(null, this__8810.bitmap ^ bit__8812, cljs.core.remove_pair.call(null, this__8810.arr, idx__8813))
      }else {
        if("\ufdd0'else") {
          return inode__8811
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8817 = this;
  var inode__8818 = this;
  var bit__8819 = 1 << (hash >>> shift & 31);
  var idx__8820 = cljs.core.bitmap_indexed_node_index.call(null, this__8817.bitmap, bit__8819);
  if((this__8817.bitmap & bit__8819) === 0) {
    var n__8821 = cljs.core.bit_count.call(null, this__8817.bitmap);
    if(n__8821 >= 16) {
      var nodes__8822 = cljs.core.make_array.call(null, 32);
      var jdx__8823 = hash >>> shift & 31;
      nodes__8822[jdx__8823] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8824 = 0;
      var j__8825 = 0;
      while(true) {
        if(i__8824 < 32) {
          if((this__8817.bitmap >>> i__8824 & 1) === 0) {
            var G__8840 = i__8824 + 1;
            var G__8841 = j__8825;
            i__8824 = G__8840;
            j__8825 = G__8841;
            continue
          }else {
            nodes__8822[i__8824] = !(this__8817.arr[j__8825] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8817.arr[j__8825]), this__8817.arr[j__8825], this__8817.arr[j__8825 + 1], added_leaf_QMARK_) : this__8817.arr[j__8825 + 1];
            var G__8842 = i__8824 + 1;
            var G__8843 = j__8825 + 2;
            i__8824 = G__8842;
            j__8825 = G__8843;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8821 + 1, nodes__8822)
    }else {
      var new_arr__8826 = cljs.core.make_array.call(null, 2 * (n__8821 + 1));
      cljs.core.array_copy.call(null, this__8817.arr, 0, new_arr__8826, 0, 2 * idx__8820);
      new_arr__8826[2 * idx__8820] = key;
      new_arr__8826[2 * idx__8820 + 1] = val;
      cljs.core.array_copy.call(null, this__8817.arr, 2 * idx__8820, new_arr__8826, 2 * (idx__8820 + 1), 2 * (n__8821 - idx__8820));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8817.bitmap | bit__8819, new_arr__8826)
    }
  }else {
    var key_or_nil__8827 = this__8817.arr[2 * idx__8820];
    var val_or_node__8828 = this__8817.arr[2 * idx__8820 + 1];
    if(key_or_nil__8827 == null) {
      var n__8829 = val_or_node__8828.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8829 === val_or_node__8828) {
        return inode__8818
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8817.bitmap, cljs.core.clone_and_set.call(null, this__8817.arr, 2 * idx__8820 + 1, n__8829))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8827)) {
        if(val === val_or_node__8828) {
          return inode__8818
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8817.bitmap, cljs.core.clone_and_set.call(null, this__8817.arr, 2 * idx__8820 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8817.bitmap, cljs.core.clone_and_set.call(null, this__8817.arr, 2 * idx__8820, null, 2 * idx__8820 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8827, val_or_node__8828, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8830 = this;
  var inode__8831 = this;
  var bit__8832 = 1 << (hash >>> shift & 31);
  if((this__8830.bitmap & bit__8832) === 0) {
    return not_found
  }else {
    var idx__8833 = cljs.core.bitmap_indexed_node_index.call(null, this__8830.bitmap, bit__8832);
    var key_or_nil__8834 = this__8830.arr[2 * idx__8833];
    var val_or_node__8835 = this__8830.arr[2 * idx__8833 + 1];
    if(key_or_nil__8834 == null) {
      return val_or_node__8835.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8834)) {
        return val_or_node__8835
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
  var arr__8851 = array_node.arr;
  var len__8852 = 2 * (array_node.cnt - 1);
  var new_arr__8853 = cljs.core.make_array.call(null, len__8852);
  var i__8854 = 0;
  var j__8855 = 1;
  var bitmap__8856 = 0;
  while(true) {
    if(i__8854 < len__8852) {
      if(function() {
        var and__3822__auto____8857 = !(i__8854 === idx);
        if(and__3822__auto____8857) {
          return!(arr__8851[i__8854] == null)
        }else {
          return and__3822__auto____8857
        }
      }()) {
        new_arr__8853[j__8855] = arr__8851[i__8854];
        var G__8858 = i__8854 + 1;
        var G__8859 = j__8855 + 2;
        var G__8860 = bitmap__8856 | 1 << i__8854;
        i__8854 = G__8858;
        j__8855 = G__8859;
        bitmap__8856 = G__8860;
        continue
      }else {
        var G__8861 = i__8854 + 1;
        var G__8862 = j__8855;
        var G__8863 = bitmap__8856;
        i__8854 = G__8861;
        j__8855 = G__8862;
        bitmap__8856 = G__8863;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8856, new_arr__8853)
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
  var this__8864 = this;
  var inode__8865 = this;
  var idx__8866 = hash >>> shift & 31;
  var node__8867 = this__8864.arr[idx__8866];
  if(node__8867 == null) {
    var editable__8868 = cljs.core.edit_and_set.call(null, inode__8865, edit, idx__8866, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8868.cnt = editable__8868.cnt + 1;
    return editable__8868
  }else {
    var n__8869 = node__8867.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8869 === node__8867) {
      return inode__8865
    }else {
      return cljs.core.edit_and_set.call(null, inode__8865, edit, idx__8866, n__8869)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8870 = this;
  var inode__8871 = this;
  return cljs.core.create_array_node_seq.call(null, this__8870.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8872 = this;
  var inode__8873 = this;
  var idx__8874 = hash >>> shift & 31;
  var node__8875 = this__8872.arr[idx__8874];
  if(node__8875 == null) {
    return inode__8873
  }else {
    var n__8876 = node__8875.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8876 === node__8875) {
      return inode__8873
    }else {
      if(n__8876 == null) {
        if(this__8872.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8873, edit, idx__8874)
        }else {
          var editable__8877 = cljs.core.edit_and_set.call(null, inode__8873, edit, idx__8874, n__8876);
          editable__8877.cnt = editable__8877.cnt - 1;
          return editable__8877
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8873, edit, idx__8874, n__8876)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8878 = this;
  var inode__8879 = this;
  if(e === this__8878.edit) {
    return inode__8879
  }else {
    return new cljs.core.ArrayNode(e, this__8878.cnt, this__8878.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8880 = this;
  var inode__8881 = this;
  var len__8882 = this__8880.arr.length;
  var i__8883 = 0;
  var init__8884 = init;
  while(true) {
    if(i__8883 < len__8882) {
      var node__8885 = this__8880.arr[i__8883];
      if(!(node__8885 == null)) {
        var init__8886 = node__8885.kv_reduce(f, init__8884);
        if(cljs.core.reduced_QMARK_.call(null, init__8886)) {
          return cljs.core.deref.call(null, init__8886)
        }else {
          var G__8905 = i__8883 + 1;
          var G__8906 = init__8886;
          i__8883 = G__8905;
          init__8884 = G__8906;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8884
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8887 = this;
  var inode__8888 = this;
  var idx__8889 = hash >>> shift & 31;
  var node__8890 = this__8887.arr[idx__8889];
  if(!(node__8890 == null)) {
    return node__8890.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8891 = this;
  var inode__8892 = this;
  var idx__8893 = hash >>> shift & 31;
  var node__8894 = this__8891.arr[idx__8893];
  if(!(node__8894 == null)) {
    var n__8895 = node__8894.inode_without(shift + 5, hash, key);
    if(n__8895 === node__8894) {
      return inode__8892
    }else {
      if(n__8895 == null) {
        if(this__8891.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8892, null, idx__8893)
        }else {
          return new cljs.core.ArrayNode(null, this__8891.cnt - 1, cljs.core.clone_and_set.call(null, this__8891.arr, idx__8893, n__8895))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8891.cnt, cljs.core.clone_and_set.call(null, this__8891.arr, idx__8893, n__8895))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8892
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8896 = this;
  var inode__8897 = this;
  var idx__8898 = hash >>> shift & 31;
  var node__8899 = this__8896.arr[idx__8898];
  if(node__8899 == null) {
    return new cljs.core.ArrayNode(null, this__8896.cnt + 1, cljs.core.clone_and_set.call(null, this__8896.arr, idx__8898, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8900 = node__8899.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8900 === node__8899) {
      return inode__8897
    }else {
      return new cljs.core.ArrayNode(null, this__8896.cnt, cljs.core.clone_and_set.call(null, this__8896.arr, idx__8898, n__8900))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8901 = this;
  var inode__8902 = this;
  var idx__8903 = hash >>> shift & 31;
  var node__8904 = this__8901.arr[idx__8903];
  if(!(node__8904 == null)) {
    return node__8904.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8909 = 2 * cnt;
  var i__8910 = 0;
  while(true) {
    if(i__8910 < lim__8909) {
      if(cljs.core.key_test.call(null, key, arr[i__8910])) {
        return i__8910
      }else {
        var G__8911 = i__8910 + 2;
        i__8910 = G__8911;
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
  var this__8912 = this;
  var inode__8913 = this;
  if(hash === this__8912.collision_hash) {
    var idx__8914 = cljs.core.hash_collision_node_find_index.call(null, this__8912.arr, this__8912.cnt, key);
    if(idx__8914 === -1) {
      if(this__8912.arr.length > 2 * this__8912.cnt) {
        var editable__8915 = cljs.core.edit_and_set.call(null, inode__8913, edit, 2 * this__8912.cnt, key, 2 * this__8912.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8915.cnt = editable__8915.cnt + 1;
        return editable__8915
      }else {
        var len__8916 = this__8912.arr.length;
        var new_arr__8917 = cljs.core.make_array.call(null, len__8916 + 2);
        cljs.core.array_copy.call(null, this__8912.arr, 0, new_arr__8917, 0, len__8916);
        new_arr__8917[len__8916] = key;
        new_arr__8917[len__8916 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8913.ensure_editable_array(edit, this__8912.cnt + 1, new_arr__8917)
      }
    }else {
      if(this__8912.arr[idx__8914 + 1] === val) {
        return inode__8913
      }else {
        return cljs.core.edit_and_set.call(null, inode__8913, edit, idx__8914 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8912.collision_hash >>> shift & 31), [null, inode__8913, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8918 = this;
  var inode__8919 = this;
  return cljs.core.create_inode_seq.call(null, this__8918.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8920 = this;
  var inode__8921 = this;
  var idx__8922 = cljs.core.hash_collision_node_find_index.call(null, this__8920.arr, this__8920.cnt, key);
  if(idx__8922 === -1) {
    return inode__8921
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8920.cnt === 1) {
      return null
    }else {
      var editable__8923 = inode__8921.ensure_editable(edit);
      var earr__8924 = editable__8923.arr;
      earr__8924[idx__8922] = earr__8924[2 * this__8920.cnt - 2];
      earr__8924[idx__8922 + 1] = earr__8924[2 * this__8920.cnt - 1];
      earr__8924[2 * this__8920.cnt - 1] = null;
      earr__8924[2 * this__8920.cnt - 2] = null;
      editable__8923.cnt = editable__8923.cnt - 1;
      return editable__8923
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8925 = this;
  var inode__8926 = this;
  if(e === this__8925.edit) {
    return inode__8926
  }else {
    var new_arr__8927 = cljs.core.make_array.call(null, 2 * (this__8925.cnt + 1));
    cljs.core.array_copy.call(null, this__8925.arr, 0, new_arr__8927, 0, 2 * this__8925.cnt);
    return new cljs.core.HashCollisionNode(e, this__8925.collision_hash, this__8925.cnt, new_arr__8927)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8928 = this;
  var inode__8929 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8928.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8930 = this;
  var inode__8931 = this;
  var idx__8932 = cljs.core.hash_collision_node_find_index.call(null, this__8930.arr, this__8930.cnt, key);
  if(idx__8932 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8930.arr[idx__8932])) {
      return cljs.core.PersistentVector.fromArray([this__8930.arr[idx__8932], this__8930.arr[idx__8932 + 1]], true)
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
  var this__8933 = this;
  var inode__8934 = this;
  var idx__8935 = cljs.core.hash_collision_node_find_index.call(null, this__8933.arr, this__8933.cnt, key);
  if(idx__8935 === -1) {
    return inode__8934
  }else {
    if(this__8933.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8933.collision_hash, this__8933.cnt - 1, cljs.core.remove_pair.call(null, this__8933.arr, cljs.core.quot.call(null, idx__8935, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8936 = this;
  var inode__8937 = this;
  if(hash === this__8936.collision_hash) {
    var idx__8938 = cljs.core.hash_collision_node_find_index.call(null, this__8936.arr, this__8936.cnt, key);
    if(idx__8938 === -1) {
      var len__8939 = this__8936.arr.length;
      var new_arr__8940 = cljs.core.make_array.call(null, len__8939 + 2);
      cljs.core.array_copy.call(null, this__8936.arr, 0, new_arr__8940, 0, len__8939);
      new_arr__8940[len__8939] = key;
      new_arr__8940[len__8939 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8936.collision_hash, this__8936.cnt + 1, new_arr__8940)
    }else {
      if(cljs.core._EQ_.call(null, this__8936.arr[idx__8938], val)) {
        return inode__8937
      }else {
        return new cljs.core.HashCollisionNode(null, this__8936.collision_hash, this__8936.cnt, cljs.core.clone_and_set.call(null, this__8936.arr, idx__8938 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8936.collision_hash >>> shift & 31), [null, inode__8937])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8941 = this;
  var inode__8942 = this;
  var idx__8943 = cljs.core.hash_collision_node_find_index.call(null, this__8941.arr, this__8941.cnt, key);
  if(idx__8943 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8941.arr[idx__8943])) {
      return this__8941.arr[idx__8943 + 1]
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
  var this__8944 = this;
  var inode__8945 = this;
  if(e === this__8944.edit) {
    this__8944.arr = array;
    this__8944.cnt = count;
    return inode__8945
  }else {
    return new cljs.core.HashCollisionNode(this__8944.edit, this__8944.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8950 = cljs.core.hash.call(null, key1);
    if(key1hash__8950 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8950, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8951 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8950, key1, val1, added_leaf_QMARK___8951).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8951)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8952 = cljs.core.hash.call(null, key1);
    if(key1hash__8952 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8952, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8953 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8952, key1, val1, added_leaf_QMARK___8953).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8953)
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
  var this__8954 = this;
  var h__2192__auto____8955 = this__8954.__hash;
  if(!(h__2192__auto____8955 == null)) {
    return h__2192__auto____8955
  }else {
    var h__2192__auto____8956 = cljs.core.hash_coll.call(null, coll);
    this__8954.__hash = h__2192__auto____8956;
    return h__2192__auto____8956
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8957 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8958 = this;
  var this__8959 = this;
  return cljs.core.pr_str.call(null, this__8959)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8960 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8961 = this;
  if(this__8961.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8961.nodes[this__8961.i], this__8961.nodes[this__8961.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8961.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8962 = this;
  if(this__8962.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8962.nodes, this__8962.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8962.nodes, this__8962.i, cljs.core.next.call(null, this__8962.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8963 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8964 = this;
  return new cljs.core.NodeSeq(meta, this__8964.nodes, this__8964.i, this__8964.s, this__8964.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8965 = this;
  return this__8965.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8966 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8966.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8973 = nodes.length;
      var j__8974 = i;
      while(true) {
        if(j__8974 < len__8973) {
          if(!(nodes[j__8974] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8974, null, null)
          }else {
            var temp__3971__auto____8975 = nodes[j__8974 + 1];
            if(cljs.core.truth_(temp__3971__auto____8975)) {
              var node__8976 = temp__3971__auto____8975;
              var temp__3971__auto____8977 = node__8976.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8977)) {
                var node_seq__8978 = temp__3971__auto____8977;
                return new cljs.core.NodeSeq(null, nodes, j__8974 + 2, node_seq__8978, null)
              }else {
                var G__8979 = j__8974 + 2;
                j__8974 = G__8979;
                continue
              }
            }else {
              var G__8980 = j__8974 + 2;
              j__8974 = G__8980;
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
  var this__8981 = this;
  var h__2192__auto____8982 = this__8981.__hash;
  if(!(h__2192__auto____8982 == null)) {
    return h__2192__auto____8982
  }else {
    var h__2192__auto____8983 = cljs.core.hash_coll.call(null, coll);
    this__8981.__hash = h__2192__auto____8983;
    return h__2192__auto____8983
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8984 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8985 = this;
  var this__8986 = this;
  return cljs.core.pr_str.call(null, this__8986)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8987 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8988 = this;
  return cljs.core.first.call(null, this__8988.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8989 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8989.nodes, this__8989.i, cljs.core.next.call(null, this__8989.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8990 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8991 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8991.nodes, this__8991.i, this__8991.s, this__8991.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8992 = this;
  return this__8992.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8993 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8993.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9000 = nodes.length;
      var j__9001 = i;
      while(true) {
        if(j__9001 < len__9000) {
          var temp__3971__auto____9002 = nodes[j__9001];
          if(cljs.core.truth_(temp__3971__auto____9002)) {
            var nj__9003 = temp__3971__auto____9002;
            var temp__3971__auto____9004 = nj__9003.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9004)) {
              var ns__9005 = temp__3971__auto____9004;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9001 + 1, ns__9005, null)
            }else {
              var G__9006 = j__9001 + 1;
              j__9001 = G__9006;
              continue
            }
          }else {
            var G__9007 = j__9001 + 1;
            j__9001 = G__9007;
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
  var this__9010 = this;
  return new cljs.core.TransientHashMap({}, this__9010.root, this__9010.cnt, this__9010.has_nil_QMARK_, this__9010.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9011 = this;
  var h__2192__auto____9012 = this__9011.__hash;
  if(!(h__2192__auto____9012 == null)) {
    return h__2192__auto____9012
  }else {
    var h__2192__auto____9013 = cljs.core.hash_imap.call(null, coll);
    this__9011.__hash = h__2192__auto____9013;
    return h__2192__auto____9013
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9014 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9015 = this;
  if(k == null) {
    if(this__9015.has_nil_QMARK_) {
      return this__9015.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9015.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9015.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9016 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9017 = this__9016.has_nil_QMARK_;
      if(and__3822__auto____9017) {
        return v === this__9016.nil_val
      }else {
        return and__3822__auto____9017
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9016.meta, this__9016.has_nil_QMARK_ ? this__9016.cnt : this__9016.cnt + 1, this__9016.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9018 = new cljs.core.Box(false);
    var new_root__9019 = (this__9016.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9016.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9018);
    if(new_root__9019 === this__9016.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9016.meta, added_leaf_QMARK___9018.val ? this__9016.cnt + 1 : this__9016.cnt, new_root__9019, this__9016.has_nil_QMARK_, this__9016.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9020 = this;
  if(k == null) {
    return this__9020.has_nil_QMARK_
  }else {
    if(this__9020.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9020.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9043 = null;
  var G__9043__2 = function(this_sym9021, k) {
    var this__9023 = this;
    var this_sym9021__9024 = this;
    var coll__9025 = this_sym9021__9024;
    return coll__9025.cljs$core$ILookup$_lookup$arity$2(coll__9025, k)
  };
  var G__9043__3 = function(this_sym9022, k, not_found) {
    var this__9023 = this;
    var this_sym9022__9026 = this;
    var coll__9027 = this_sym9022__9026;
    return coll__9027.cljs$core$ILookup$_lookup$arity$3(coll__9027, k, not_found)
  };
  G__9043 = function(this_sym9022, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9043__2.call(this, this_sym9022, k);
      case 3:
        return G__9043__3.call(this, this_sym9022, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9043
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9008, args9009) {
  var this__9028 = this;
  return this_sym9008.call.apply(this_sym9008, [this_sym9008].concat(args9009.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9029 = this;
  var init__9030 = this__9029.has_nil_QMARK_ ? f.call(null, init, null, this__9029.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9030)) {
    return cljs.core.deref.call(null, init__9030)
  }else {
    if(!(this__9029.root == null)) {
      return this__9029.root.kv_reduce(f, init__9030)
    }else {
      if("\ufdd0'else") {
        return init__9030
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9031 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9032 = this;
  var this__9033 = this;
  return cljs.core.pr_str.call(null, this__9033)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9034 = this;
  if(this__9034.cnt > 0) {
    var s__9035 = !(this__9034.root == null) ? this__9034.root.inode_seq() : null;
    if(this__9034.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9034.nil_val], true), s__9035)
    }else {
      return s__9035
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9036 = this;
  return this__9036.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9037 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9038 = this;
  return new cljs.core.PersistentHashMap(meta, this__9038.cnt, this__9038.root, this__9038.has_nil_QMARK_, this__9038.nil_val, this__9038.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9039 = this;
  return this__9039.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9040 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9040.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9041 = this;
  if(k == null) {
    if(this__9041.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9041.meta, this__9041.cnt - 1, this__9041.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9041.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9042 = this__9041.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9042 === this__9041.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9041.meta, this__9041.cnt - 1, new_root__9042, this__9041.has_nil_QMARK_, this__9041.nil_val, null)
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
  var len__9044 = ks.length;
  var i__9045 = 0;
  var out__9046 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9045 < len__9044) {
      var G__9047 = i__9045 + 1;
      var G__9048 = cljs.core.assoc_BANG_.call(null, out__9046, ks[i__9045], vs[i__9045]);
      i__9045 = G__9047;
      out__9046 = G__9048;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9046)
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
  var this__9049 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9050 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9051 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9052 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9053 = this;
  if(k == null) {
    if(this__9053.has_nil_QMARK_) {
      return this__9053.nil_val
    }else {
      return null
    }
  }else {
    if(this__9053.root == null) {
      return null
    }else {
      return this__9053.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9054 = this;
  if(k == null) {
    if(this__9054.has_nil_QMARK_) {
      return this__9054.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9054.root == null) {
      return not_found
    }else {
      return this__9054.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9055 = this;
  if(this__9055.edit) {
    return this__9055.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9056 = this;
  var tcoll__9057 = this;
  if(this__9056.edit) {
    if(function() {
      var G__9058__9059 = o;
      if(G__9058__9059) {
        if(function() {
          var or__3824__auto____9060 = G__9058__9059.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9060) {
            return or__3824__auto____9060
          }else {
            return G__9058__9059.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9058__9059.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9058__9059)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9058__9059)
      }
    }()) {
      return tcoll__9057.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9061 = cljs.core.seq.call(null, o);
      var tcoll__9062 = tcoll__9057;
      while(true) {
        var temp__3971__auto____9063 = cljs.core.first.call(null, es__9061);
        if(cljs.core.truth_(temp__3971__auto____9063)) {
          var e__9064 = temp__3971__auto____9063;
          var G__9075 = cljs.core.next.call(null, es__9061);
          var G__9076 = tcoll__9062.assoc_BANG_(cljs.core.key.call(null, e__9064), cljs.core.val.call(null, e__9064));
          es__9061 = G__9075;
          tcoll__9062 = G__9076;
          continue
        }else {
          return tcoll__9062
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9065 = this;
  var tcoll__9066 = this;
  if(this__9065.edit) {
    if(k == null) {
      if(this__9065.nil_val === v) {
      }else {
        this__9065.nil_val = v
      }
      if(this__9065.has_nil_QMARK_) {
      }else {
        this__9065.count = this__9065.count + 1;
        this__9065.has_nil_QMARK_ = true
      }
      return tcoll__9066
    }else {
      var added_leaf_QMARK___9067 = new cljs.core.Box(false);
      var node__9068 = (this__9065.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9065.root).inode_assoc_BANG_(this__9065.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9067);
      if(node__9068 === this__9065.root) {
      }else {
        this__9065.root = node__9068
      }
      if(added_leaf_QMARK___9067.val) {
        this__9065.count = this__9065.count + 1
      }else {
      }
      return tcoll__9066
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9069 = this;
  var tcoll__9070 = this;
  if(this__9069.edit) {
    if(k == null) {
      if(this__9069.has_nil_QMARK_) {
        this__9069.has_nil_QMARK_ = false;
        this__9069.nil_val = null;
        this__9069.count = this__9069.count - 1;
        return tcoll__9070
      }else {
        return tcoll__9070
      }
    }else {
      if(this__9069.root == null) {
        return tcoll__9070
      }else {
        var removed_leaf_QMARK___9071 = new cljs.core.Box(false);
        var node__9072 = this__9069.root.inode_without_BANG_(this__9069.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9071);
        if(node__9072 === this__9069.root) {
        }else {
          this__9069.root = node__9072
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9071[0])) {
          this__9069.count = this__9069.count - 1
        }else {
        }
        return tcoll__9070
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9073 = this;
  var tcoll__9074 = this;
  if(this__9073.edit) {
    this__9073.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9073.count, this__9073.root, this__9073.has_nil_QMARK_, this__9073.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9079 = node;
  var stack__9080 = stack;
  while(true) {
    if(!(t__9079 == null)) {
      var G__9081 = ascending_QMARK_ ? t__9079.left : t__9079.right;
      var G__9082 = cljs.core.conj.call(null, stack__9080, t__9079);
      t__9079 = G__9081;
      stack__9080 = G__9082;
      continue
    }else {
      return stack__9080
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
  var this__9083 = this;
  var h__2192__auto____9084 = this__9083.__hash;
  if(!(h__2192__auto____9084 == null)) {
    return h__2192__auto____9084
  }else {
    var h__2192__auto____9085 = cljs.core.hash_coll.call(null, coll);
    this__9083.__hash = h__2192__auto____9085;
    return h__2192__auto____9085
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9086 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9087 = this;
  var this__9088 = this;
  return cljs.core.pr_str.call(null, this__9088)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9089 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9090 = this;
  if(this__9090.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9090.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9091 = this;
  return cljs.core.peek.call(null, this__9091.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9092 = this;
  var t__9093 = cljs.core.first.call(null, this__9092.stack);
  var next_stack__9094 = cljs.core.tree_map_seq_push.call(null, this__9092.ascending_QMARK_ ? t__9093.right : t__9093.left, cljs.core.next.call(null, this__9092.stack), this__9092.ascending_QMARK_);
  if(!(next_stack__9094 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9094, this__9092.ascending_QMARK_, this__9092.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9095 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9096 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9096.stack, this__9096.ascending_QMARK_, this__9096.cnt, this__9096.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9097 = this;
  return this__9097.meta
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
        var and__3822__auto____9099 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9099) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9099
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
        var and__3822__auto____9101 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9101) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9101
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
  var init__9105 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9105)) {
    return cljs.core.deref.call(null, init__9105)
  }else {
    var init__9106 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9105) : init__9105;
    if(cljs.core.reduced_QMARK_.call(null, init__9106)) {
      return cljs.core.deref.call(null, init__9106)
    }else {
      var init__9107 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9106) : init__9106;
      if(cljs.core.reduced_QMARK_.call(null, init__9107)) {
        return cljs.core.deref.call(null, init__9107)
      }else {
        return init__9107
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
  var this__9110 = this;
  var h__2192__auto____9111 = this__9110.__hash;
  if(!(h__2192__auto____9111 == null)) {
    return h__2192__auto____9111
  }else {
    var h__2192__auto____9112 = cljs.core.hash_coll.call(null, coll);
    this__9110.__hash = h__2192__auto____9112;
    return h__2192__auto____9112
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9113 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9114 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9115 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9115.key, this__9115.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9163 = null;
  var G__9163__2 = function(this_sym9116, k) {
    var this__9118 = this;
    var this_sym9116__9119 = this;
    var node__9120 = this_sym9116__9119;
    return node__9120.cljs$core$ILookup$_lookup$arity$2(node__9120, k)
  };
  var G__9163__3 = function(this_sym9117, k, not_found) {
    var this__9118 = this;
    var this_sym9117__9121 = this;
    var node__9122 = this_sym9117__9121;
    return node__9122.cljs$core$ILookup$_lookup$arity$3(node__9122, k, not_found)
  };
  G__9163 = function(this_sym9117, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9163__2.call(this, this_sym9117, k);
      case 3:
        return G__9163__3.call(this, this_sym9117, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9163
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9108, args9109) {
  var this__9123 = this;
  return this_sym9108.call.apply(this_sym9108, [this_sym9108].concat(args9109.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9124 = this;
  return cljs.core.PersistentVector.fromArray([this__9124.key, this__9124.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9125 = this;
  return this__9125.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9126 = this;
  return this__9126.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9127 = this;
  var node__9128 = this;
  return ins.balance_right(node__9128)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9129 = this;
  var node__9130 = this;
  return new cljs.core.RedNode(this__9129.key, this__9129.val, this__9129.left, this__9129.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9131 = this;
  var node__9132 = this;
  return cljs.core.balance_right_del.call(null, this__9131.key, this__9131.val, this__9131.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9133 = this;
  var node__9134 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9135 = this;
  var node__9136 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9136, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9137 = this;
  var node__9138 = this;
  return cljs.core.balance_left_del.call(null, this__9137.key, this__9137.val, del, this__9137.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9139 = this;
  var node__9140 = this;
  return ins.balance_left(node__9140)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9141 = this;
  var node__9142 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9142, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9164 = null;
  var G__9164__0 = function() {
    var this__9143 = this;
    var this__9145 = this;
    return cljs.core.pr_str.call(null, this__9145)
  };
  G__9164 = function() {
    switch(arguments.length) {
      case 0:
        return G__9164__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9164
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9146 = this;
  var node__9147 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9147, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9148 = this;
  var node__9149 = this;
  return node__9149
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9150 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9151 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9152 = this;
  return cljs.core.list.call(null, this__9152.key, this__9152.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9153 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9154 = this;
  return this__9154.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9155 = this;
  return cljs.core.PersistentVector.fromArray([this__9155.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9156 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9156.key, this__9156.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9157 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9158 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9158.key, this__9158.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9159 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9160 = this;
  if(n === 0) {
    return this__9160.key
  }else {
    if(n === 1) {
      return this__9160.val
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
  var this__9161 = this;
  if(n === 0) {
    return this__9161.key
  }else {
    if(n === 1) {
      return this__9161.val
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
  var this__9162 = this;
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
  var this__9167 = this;
  var h__2192__auto____9168 = this__9167.__hash;
  if(!(h__2192__auto____9168 == null)) {
    return h__2192__auto____9168
  }else {
    var h__2192__auto____9169 = cljs.core.hash_coll.call(null, coll);
    this__9167.__hash = h__2192__auto____9169;
    return h__2192__auto____9169
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9170 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9171 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9172 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9172.key, this__9172.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9220 = null;
  var G__9220__2 = function(this_sym9173, k) {
    var this__9175 = this;
    var this_sym9173__9176 = this;
    var node__9177 = this_sym9173__9176;
    return node__9177.cljs$core$ILookup$_lookup$arity$2(node__9177, k)
  };
  var G__9220__3 = function(this_sym9174, k, not_found) {
    var this__9175 = this;
    var this_sym9174__9178 = this;
    var node__9179 = this_sym9174__9178;
    return node__9179.cljs$core$ILookup$_lookup$arity$3(node__9179, k, not_found)
  };
  G__9220 = function(this_sym9174, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9220__2.call(this, this_sym9174, k);
      case 3:
        return G__9220__3.call(this, this_sym9174, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9220
}();
cljs.core.RedNode.prototype.apply = function(this_sym9165, args9166) {
  var this__9180 = this;
  return this_sym9165.call.apply(this_sym9165, [this_sym9165].concat(args9166.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9181 = this;
  return cljs.core.PersistentVector.fromArray([this__9181.key, this__9181.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9182 = this;
  return this__9182.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9183 = this;
  return this__9183.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9184 = this;
  var node__9185 = this;
  return new cljs.core.RedNode(this__9184.key, this__9184.val, this__9184.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9186 = this;
  var node__9187 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9188 = this;
  var node__9189 = this;
  return new cljs.core.RedNode(this__9188.key, this__9188.val, this__9188.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9190 = this;
  var node__9191 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9192 = this;
  var node__9193 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9193, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9194 = this;
  var node__9195 = this;
  return new cljs.core.RedNode(this__9194.key, this__9194.val, del, this__9194.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9196 = this;
  var node__9197 = this;
  return new cljs.core.RedNode(this__9196.key, this__9196.val, ins, this__9196.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9198 = this;
  var node__9199 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9198.left)) {
    return new cljs.core.RedNode(this__9198.key, this__9198.val, this__9198.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9198.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9198.right)) {
      return new cljs.core.RedNode(this__9198.right.key, this__9198.right.val, new cljs.core.BlackNode(this__9198.key, this__9198.val, this__9198.left, this__9198.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9198.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9199, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9221 = null;
  var G__9221__0 = function() {
    var this__9200 = this;
    var this__9202 = this;
    return cljs.core.pr_str.call(null, this__9202)
  };
  G__9221 = function() {
    switch(arguments.length) {
      case 0:
        return G__9221__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9221
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9203 = this;
  var node__9204 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9203.right)) {
    return new cljs.core.RedNode(this__9203.key, this__9203.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9203.left, null), this__9203.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9203.left)) {
      return new cljs.core.RedNode(this__9203.left.key, this__9203.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9203.left.left, null), new cljs.core.BlackNode(this__9203.key, this__9203.val, this__9203.left.right, this__9203.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9204, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9205 = this;
  var node__9206 = this;
  return new cljs.core.BlackNode(this__9205.key, this__9205.val, this__9205.left, this__9205.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9207 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9208 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9209 = this;
  return cljs.core.list.call(null, this__9209.key, this__9209.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9210 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9211 = this;
  return this__9211.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9212 = this;
  return cljs.core.PersistentVector.fromArray([this__9212.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9213 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9213.key, this__9213.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9214 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9215 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9215.key, this__9215.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9216 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9217 = this;
  if(n === 0) {
    return this__9217.key
  }else {
    if(n === 1) {
      return this__9217.val
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
  var this__9218 = this;
  if(n === 0) {
    return this__9218.key
  }else {
    if(n === 1) {
      return this__9218.val
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
  var this__9219 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9225 = comp.call(null, k, tree.key);
    if(c__9225 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9225 < 0) {
        var ins__9226 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9226 == null)) {
          return tree.add_left(ins__9226)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9227 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9227 == null)) {
            return tree.add_right(ins__9227)
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
          var app__9230 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9230)) {
            return new cljs.core.RedNode(app__9230.key, app__9230.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9230.left, null), new cljs.core.RedNode(right.key, right.val, app__9230.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9230, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9231 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9231)) {
              return new cljs.core.RedNode(app__9231.key, app__9231.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9231.left, null), new cljs.core.BlackNode(right.key, right.val, app__9231.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9231, right.right, null))
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
    var c__9237 = comp.call(null, k, tree.key);
    if(c__9237 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9237 < 0) {
        var del__9238 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9239 = !(del__9238 == null);
          if(or__3824__auto____9239) {
            return or__3824__auto____9239
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9238, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9238, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9240 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9241 = !(del__9240 == null);
            if(or__3824__auto____9241) {
              return or__3824__auto____9241
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9240)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9240, null)
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
  var tk__9244 = tree.key;
  var c__9245 = comp.call(null, k, tk__9244);
  if(c__9245 === 0) {
    return tree.replace(tk__9244, v, tree.left, tree.right)
  }else {
    if(c__9245 < 0) {
      return tree.replace(tk__9244, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9244, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__9248 = this;
  var h__2192__auto____9249 = this__9248.__hash;
  if(!(h__2192__auto____9249 == null)) {
    return h__2192__auto____9249
  }else {
    var h__2192__auto____9250 = cljs.core.hash_imap.call(null, coll);
    this__9248.__hash = h__2192__auto____9250;
    return h__2192__auto____9250
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9251 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9252 = this;
  var n__9253 = coll.entry_at(k);
  if(!(n__9253 == null)) {
    return n__9253.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9254 = this;
  var found__9255 = [null];
  var t__9256 = cljs.core.tree_map_add.call(null, this__9254.comp, this__9254.tree, k, v, found__9255);
  if(t__9256 == null) {
    var found_node__9257 = cljs.core.nth.call(null, found__9255, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9257.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9254.comp, cljs.core.tree_map_replace.call(null, this__9254.comp, this__9254.tree, k, v), this__9254.cnt, this__9254.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9254.comp, t__9256.blacken(), this__9254.cnt + 1, this__9254.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9258 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9292 = null;
  var G__9292__2 = function(this_sym9259, k) {
    var this__9261 = this;
    var this_sym9259__9262 = this;
    var coll__9263 = this_sym9259__9262;
    return coll__9263.cljs$core$ILookup$_lookup$arity$2(coll__9263, k)
  };
  var G__9292__3 = function(this_sym9260, k, not_found) {
    var this__9261 = this;
    var this_sym9260__9264 = this;
    var coll__9265 = this_sym9260__9264;
    return coll__9265.cljs$core$ILookup$_lookup$arity$3(coll__9265, k, not_found)
  };
  G__9292 = function(this_sym9260, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9292__2.call(this, this_sym9260, k);
      case 3:
        return G__9292__3.call(this, this_sym9260, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9292
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9246, args9247) {
  var this__9266 = this;
  return this_sym9246.call.apply(this_sym9246, [this_sym9246].concat(args9247.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9267 = this;
  if(!(this__9267.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9267.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9268 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9269 = this;
  if(this__9269.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9269.tree, false, this__9269.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9270 = this;
  var this__9271 = this;
  return cljs.core.pr_str.call(null, this__9271)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9272 = this;
  var coll__9273 = this;
  var t__9274 = this__9272.tree;
  while(true) {
    if(!(t__9274 == null)) {
      var c__9275 = this__9272.comp.call(null, k, t__9274.key);
      if(c__9275 === 0) {
        return t__9274
      }else {
        if(c__9275 < 0) {
          var G__9293 = t__9274.left;
          t__9274 = G__9293;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9294 = t__9274.right;
            t__9274 = G__9294;
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
  var this__9276 = this;
  if(this__9276.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9276.tree, ascending_QMARK_, this__9276.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9277 = this;
  if(this__9277.cnt > 0) {
    var stack__9278 = null;
    var t__9279 = this__9277.tree;
    while(true) {
      if(!(t__9279 == null)) {
        var c__9280 = this__9277.comp.call(null, k, t__9279.key);
        if(c__9280 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9278, t__9279), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9280 < 0) {
              var G__9295 = cljs.core.conj.call(null, stack__9278, t__9279);
              var G__9296 = t__9279.left;
              stack__9278 = G__9295;
              t__9279 = G__9296;
              continue
            }else {
              var G__9297 = stack__9278;
              var G__9298 = t__9279.right;
              stack__9278 = G__9297;
              t__9279 = G__9298;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9280 > 0) {
                var G__9299 = cljs.core.conj.call(null, stack__9278, t__9279);
                var G__9300 = t__9279.right;
                stack__9278 = G__9299;
                t__9279 = G__9300;
                continue
              }else {
                var G__9301 = stack__9278;
                var G__9302 = t__9279.left;
                stack__9278 = G__9301;
                t__9279 = G__9302;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9278 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9278, ascending_QMARK_, -1, null)
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
  var this__9281 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9282 = this;
  return this__9282.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9283 = this;
  if(this__9283.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9283.tree, true, this__9283.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9284 = this;
  return this__9284.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9285 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9286 = this;
  return new cljs.core.PersistentTreeMap(this__9286.comp, this__9286.tree, this__9286.cnt, meta, this__9286.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9287 = this;
  return this__9287.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9288 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9288.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9289 = this;
  var found__9290 = [null];
  var t__9291 = cljs.core.tree_map_remove.call(null, this__9289.comp, this__9289.tree, k, found__9290);
  if(t__9291 == null) {
    if(cljs.core.nth.call(null, found__9290, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9289.comp, null, 0, this__9289.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9289.comp, t__9291.blacken(), this__9289.cnt - 1, this__9289.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9305 = cljs.core.seq.call(null, keyvals);
    var out__9306 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9305) {
        var G__9307 = cljs.core.nnext.call(null, in__9305);
        var G__9308 = cljs.core.assoc_BANG_.call(null, out__9306, cljs.core.first.call(null, in__9305), cljs.core.second.call(null, in__9305));
        in__9305 = G__9307;
        out__9306 = G__9308;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9306)
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
  hash_map.cljs$lang$applyTo = function(arglist__9309) {
    var keyvals = cljs.core.seq(arglist__9309);
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
  array_map.cljs$lang$applyTo = function(arglist__9310) {
    var keyvals = cljs.core.seq(arglist__9310);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9314 = [];
    var obj__9315 = {};
    var kvs__9316 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9316) {
        ks__9314.push(cljs.core.first.call(null, kvs__9316));
        obj__9315[cljs.core.first.call(null, kvs__9316)] = cljs.core.second.call(null, kvs__9316);
        var G__9317 = cljs.core.nnext.call(null, kvs__9316);
        kvs__9316 = G__9317;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9314, obj__9315)
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
  obj_map.cljs$lang$applyTo = function(arglist__9318) {
    var keyvals = cljs.core.seq(arglist__9318);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9321 = cljs.core.seq.call(null, keyvals);
    var out__9322 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9321) {
        var G__9323 = cljs.core.nnext.call(null, in__9321);
        var G__9324 = cljs.core.assoc.call(null, out__9322, cljs.core.first.call(null, in__9321), cljs.core.second.call(null, in__9321));
        in__9321 = G__9323;
        out__9322 = G__9324;
        continue
      }else {
        return out__9322
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
  sorted_map.cljs$lang$applyTo = function(arglist__9325) {
    var keyvals = cljs.core.seq(arglist__9325);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9328 = cljs.core.seq.call(null, keyvals);
    var out__9329 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9328) {
        var G__9330 = cljs.core.nnext.call(null, in__9328);
        var G__9331 = cljs.core.assoc.call(null, out__9329, cljs.core.first.call(null, in__9328), cljs.core.second.call(null, in__9328));
        in__9328 = G__9330;
        out__9329 = G__9331;
        continue
      }else {
        return out__9329
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__9332) {
    var comparator = cljs.core.first(arglist__9332);
    var keyvals = cljs.core.rest(arglist__9332);
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
      return cljs.core.reduce.call(null, function(p1__9333_SHARP_, p2__9334_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9336 = p1__9333_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9336)) {
            return or__3824__auto____9336
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9334_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9337) {
    var maps = cljs.core.seq(arglist__9337);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9345 = function(m, e) {
        var k__9343 = cljs.core.first.call(null, e);
        var v__9344 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9343)) {
          return cljs.core.assoc.call(null, m, k__9343, f.call(null, cljs.core._lookup.call(null, m, k__9343, null), v__9344))
        }else {
          return cljs.core.assoc.call(null, m, k__9343, v__9344)
        }
      };
      var merge2__9347 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9345, function() {
          var or__3824__auto____9346 = m1;
          if(cljs.core.truth_(or__3824__auto____9346)) {
            return or__3824__auto____9346
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9347, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9348) {
    var f = cljs.core.first(arglist__9348);
    var maps = cljs.core.rest(arglist__9348);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9353 = cljs.core.ObjMap.EMPTY;
  var keys__9354 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9354) {
      var key__9355 = cljs.core.first.call(null, keys__9354);
      var entry__9356 = cljs.core._lookup.call(null, map, key__9355, "\ufdd0'cljs.core/not-found");
      var G__9357 = cljs.core.not_EQ_.call(null, entry__9356, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9353, key__9355, entry__9356) : ret__9353;
      var G__9358 = cljs.core.next.call(null, keys__9354);
      ret__9353 = G__9357;
      keys__9354 = G__9358;
      continue
    }else {
      return ret__9353
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
  var this__9362 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9362.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9363 = this;
  var h__2192__auto____9364 = this__9363.__hash;
  if(!(h__2192__auto____9364 == null)) {
    return h__2192__auto____9364
  }else {
    var h__2192__auto____9365 = cljs.core.hash_iset.call(null, coll);
    this__9363.__hash = h__2192__auto____9365;
    return h__2192__auto____9365
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9366 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9367 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9367.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9388 = null;
  var G__9388__2 = function(this_sym9368, k) {
    var this__9370 = this;
    var this_sym9368__9371 = this;
    var coll__9372 = this_sym9368__9371;
    return coll__9372.cljs$core$ILookup$_lookup$arity$2(coll__9372, k)
  };
  var G__9388__3 = function(this_sym9369, k, not_found) {
    var this__9370 = this;
    var this_sym9369__9373 = this;
    var coll__9374 = this_sym9369__9373;
    return coll__9374.cljs$core$ILookup$_lookup$arity$3(coll__9374, k, not_found)
  };
  G__9388 = function(this_sym9369, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9388__2.call(this, this_sym9369, k);
      case 3:
        return G__9388__3.call(this, this_sym9369, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9388
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9360, args9361) {
  var this__9375 = this;
  return this_sym9360.call.apply(this_sym9360, [this_sym9360].concat(args9361.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9376 = this;
  return new cljs.core.PersistentHashSet(this__9376.meta, cljs.core.assoc.call(null, this__9376.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9377 = this;
  var this__9378 = this;
  return cljs.core.pr_str.call(null, this__9378)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9379 = this;
  return cljs.core.keys.call(null, this__9379.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9380 = this;
  return new cljs.core.PersistentHashSet(this__9380.meta, cljs.core.dissoc.call(null, this__9380.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9381 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9382 = this;
  var and__3822__auto____9383 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9383) {
    var and__3822__auto____9384 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9384) {
      return cljs.core.every_QMARK_.call(null, function(p1__9359_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9359_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9384
    }
  }else {
    return and__3822__auto____9383
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9385 = this;
  return new cljs.core.PersistentHashSet(meta, this__9385.hash_map, this__9385.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9386 = this;
  return this__9386.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9387 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9387.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9389 = cljs.core.count.call(null, items);
  var i__9390 = 0;
  var out__9391 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9390 < len__9389) {
      var G__9392 = i__9390 + 1;
      var G__9393 = cljs.core.conj_BANG_.call(null, out__9391, items[i__9390]);
      i__9390 = G__9392;
      out__9391 = G__9393;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9391)
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
  var G__9411 = null;
  var G__9411__2 = function(this_sym9397, k) {
    var this__9399 = this;
    var this_sym9397__9400 = this;
    var tcoll__9401 = this_sym9397__9400;
    if(cljs.core._lookup.call(null, this__9399.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9411__3 = function(this_sym9398, k, not_found) {
    var this__9399 = this;
    var this_sym9398__9402 = this;
    var tcoll__9403 = this_sym9398__9402;
    if(cljs.core._lookup.call(null, this__9399.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9411 = function(this_sym9398, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9411__2.call(this, this_sym9398, k);
      case 3:
        return G__9411__3.call(this, this_sym9398, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9411
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9395, args9396) {
  var this__9404 = this;
  return this_sym9395.call.apply(this_sym9395, [this_sym9395].concat(args9396.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9405 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9406 = this;
  if(cljs.core._lookup.call(null, this__9406.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9407 = this;
  return cljs.core.count.call(null, this__9407.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9408 = this;
  this__9408.transient_map = cljs.core.dissoc_BANG_.call(null, this__9408.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9409 = this;
  this__9409.transient_map = cljs.core.assoc_BANG_.call(null, this__9409.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9410 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9410.transient_map), null)
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
  var this__9414 = this;
  var h__2192__auto____9415 = this__9414.__hash;
  if(!(h__2192__auto____9415 == null)) {
    return h__2192__auto____9415
  }else {
    var h__2192__auto____9416 = cljs.core.hash_iset.call(null, coll);
    this__9414.__hash = h__2192__auto____9416;
    return h__2192__auto____9416
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9417 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9418 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9418.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9444 = null;
  var G__9444__2 = function(this_sym9419, k) {
    var this__9421 = this;
    var this_sym9419__9422 = this;
    var coll__9423 = this_sym9419__9422;
    return coll__9423.cljs$core$ILookup$_lookup$arity$2(coll__9423, k)
  };
  var G__9444__3 = function(this_sym9420, k, not_found) {
    var this__9421 = this;
    var this_sym9420__9424 = this;
    var coll__9425 = this_sym9420__9424;
    return coll__9425.cljs$core$ILookup$_lookup$arity$3(coll__9425, k, not_found)
  };
  G__9444 = function(this_sym9420, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9444__2.call(this, this_sym9420, k);
      case 3:
        return G__9444__3.call(this, this_sym9420, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9444
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9412, args9413) {
  var this__9426 = this;
  return this_sym9412.call.apply(this_sym9412, [this_sym9412].concat(args9413.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9427 = this;
  return new cljs.core.PersistentTreeSet(this__9427.meta, cljs.core.assoc.call(null, this__9427.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9428 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9428.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9429 = this;
  var this__9430 = this;
  return cljs.core.pr_str.call(null, this__9430)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9431 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9431.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9432 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9432.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9433 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9434 = this;
  return cljs.core._comparator.call(null, this__9434.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9435 = this;
  return cljs.core.keys.call(null, this__9435.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9436 = this;
  return new cljs.core.PersistentTreeSet(this__9436.meta, cljs.core.dissoc.call(null, this__9436.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9437 = this;
  return cljs.core.count.call(null, this__9437.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9438 = this;
  var and__3822__auto____9439 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9439) {
    var and__3822__auto____9440 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9440) {
      return cljs.core.every_QMARK_.call(null, function(p1__9394_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9394_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9440
    }
  }else {
    return and__3822__auto____9439
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9441 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9441.tree_map, this__9441.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9442 = this;
  return this__9442.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9443 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9443.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9449__delegate = function(keys) {
      var in__9447 = cljs.core.seq.call(null, keys);
      var out__9448 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9447)) {
          var G__9450 = cljs.core.next.call(null, in__9447);
          var G__9451 = cljs.core.conj_BANG_.call(null, out__9448, cljs.core.first.call(null, in__9447));
          in__9447 = G__9450;
          out__9448 = G__9451;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9448)
        }
        break
      }
    };
    var G__9449 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9449__delegate.call(this, keys)
    };
    G__9449.cljs$lang$maxFixedArity = 0;
    G__9449.cljs$lang$applyTo = function(arglist__9452) {
      var keys = cljs.core.seq(arglist__9452);
      return G__9449__delegate(keys)
    };
    G__9449.cljs$lang$arity$variadic = G__9449__delegate;
    return G__9449
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
  sorted_set.cljs$lang$applyTo = function(arglist__9453) {
    var keys = cljs.core.seq(arglist__9453);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__9455) {
    var comparator = cljs.core.first(arglist__9455);
    var keys = cljs.core.rest(arglist__9455);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9461 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9462 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9462)) {
        var e__9463 = temp__3971__auto____9462;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9463))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9461, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9454_SHARP_) {
      var temp__3971__auto____9464 = cljs.core.find.call(null, smap, p1__9454_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9464)) {
        var e__9465 = temp__3971__auto____9464;
        return cljs.core.second.call(null, e__9465)
      }else {
        return p1__9454_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9495 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9488, seen) {
        while(true) {
          var vec__9489__9490 = p__9488;
          var f__9491 = cljs.core.nth.call(null, vec__9489__9490, 0, null);
          var xs__9492 = vec__9489__9490;
          var temp__3974__auto____9493 = cljs.core.seq.call(null, xs__9492);
          if(temp__3974__auto____9493) {
            var s__9494 = temp__3974__auto____9493;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9491)) {
              var G__9496 = cljs.core.rest.call(null, s__9494);
              var G__9497 = seen;
              p__9488 = G__9496;
              seen = G__9497;
              continue
            }else {
              return cljs.core.cons.call(null, f__9491, step.call(null, cljs.core.rest.call(null, s__9494), cljs.core.conj.call(null, seen, f__9491)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9495.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9500 = cljs.core.PersistentVector.EMPTY;
  var s__9501 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9501)) {
      var G__9502 = cljs.core.conj.call(null, ret__9500, cljs.core.first.call(null, s__9501));
      var G__9503 = cljs.core.next.call(null, s__9501);
      ret__9500 = G__9502;
      s__9501 = G__9503;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9500)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9506 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9506) {
        return or__3824__auto____9506
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9507 = x.lastIndexOf("/");
      if(i__9507 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9507 + 1)
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
    var or__3824__auto____9510 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9510) {
      return or__3824__auto____9510
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9511 = x.lastIndexOf("/");
    if(i__9511 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9511)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9518 = cljs.core.ObjMap.EMPTY;
  var ks__9519 = cljs.core.seq.call(null, keys);
  var vs__9520 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9521 = ks__9519;
      if(and__3822__auto____9521) {
        return vs__9520
      }else {
        return and__3822__auto____9521
      }
    }()) {
      var G__9522 = cljs.core.assoc.call(null, map__9518, cljs.core.first.call(null, ks__9519), cljs.core.first.call(null, vs__9520));
      var G__9523 = cljs.core.next.call(null, ks__9519);
      var G__9524 = cljs.core.next.call(null, vs__9520);
      map__9518 = G__9522;
      ks__9519 = G__9523;
      vs__9520 = G__9524;
      continue
    }else {
      return map__9518
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
    var G__9527__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9512_SHARP_, p2__9513_SHARP_) {
        return max_key.call(null, k, p1__9512_SHARP_, p2__9513_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9527 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9527__delegate.call(this, k, x, y, more)
    };
    G__9527.cljs$lang$maxFixedArity = 3;
    G__9527.cljs$lang$applyTo = function(arglist__9528) {
      var k = cljs.core.first(arglist__9528);
      var x = cljs.core.first(cljs.core.next(arglist__9528));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9528)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9528)));
      return G__9527__delegate(k, x, y, more)
    };
    G__9527.cljs$lang$arity$variadic = G__9527__delegate;
    return G__9527
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
    var G__9529__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9525_SHARP_, p2__9526_SHARP_) {
        return min_key.call(null, k, p1__9525_SHARP_, p2__9526_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9529 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9529__delegate.call(this, k, x, y, more)
    };
    G__9529.cljs$lang$maxFixedArity = 3;
    G__9529.cljs$lang$applyTo = function(arglist__9530) {
      var k = cljs.core.first(arglist__9530);
      var x = cljs.core.first(cljs.core.next(arglist__9530));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9530)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9530)));
      return G__9529__delegate(k, x, y, more)
    };
    G__9529.cljs$lang$arity$variadic = G__9529__delegate;
    return G__9529
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
      var temp__3974__auto____9533 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9533) {
        var s__9534 = temp__3974__auto____9533;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9534), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9534)))
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
    var temp__3974__auto____9537 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9537) {
      var s__9538 = temp__3974__auto____9537;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9538)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9538), take_while.call(null, pred, cljs.core.rest.call(null, s__9538)))
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
    var comp__9540 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9540.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9552 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9553 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9553)) {
        var vec__9554__9555 = temp__3974__auto____9553;
        var e__9556 = cljs.core.nth.call(null, vec__9554__9555, 0, null);
        var s__9557 = vec__9554__9555;
        if(cljs.core.truth_(include__9552.call(null, e__9556))) {
          return s__9557
        }else {
          return cljs.core.next.call(null, s__9557)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9552, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9558 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9558)) {
      var vec__9559__9560 = temp__3974__auto____9558;
      var e__9561 = cljs.core.nth.call(null, vec__9559__9560, 0, null);
      var s__9562 = vec__9559__9560;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9561)) ? s__9562 : cljs.core.next.call(null, s__9562))
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
    var include__9574 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9575 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9575)) {
        var vec__9576__9577 = temp__3974__auto____9575;
        var e__9578 = cljs.core.nth.call(null, vec__9576__9577, 0, null);
        var s__9579 = vec__9576__9577;
        if(cljs.core.truth_(include__9574.call(null, e__9578))) {
          return s__9579
        }else {
          return cljs.core.next.call(null, s__9579)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9574, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9580 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9580)) {
      var vec__9581__9582 = temp__3974__auto____9580;
      var e__9583 = cljs.core.nth.call(null, vec__9581__9582, 0, null);
      var s__9584 = vec__9581__9582;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9583)) ? s__9584 : cljs.core.next.call(null, s__9584))
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
  var this__9585 = this;
  var h__2192__auto____9586 = this__9585.__hash;
  if(!(h__2192__auto____9586 == null)) {
    return h__2192__auto____9586
  }else {
    var h__2192__auto____9587 = cljs.core.hash_coll.call(null, rng);
    this__9585.__hash = h__2192__auto____9587;
    return h__2192__auto____9587
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9588 = this;
  if(this__9588.step > 0) {
    if(this__9588.start + this__9588.step < this__9588.end) {
      return new cljs.core.Range(this__9588.meta, this__9588.start + this__9588.step, this__9588.end, this__9588.step, null)
    }else {
      return null
    }
  }else {
    if(this__9588.start + this__9588.step > this__9588.end) {
      return new cljs.core.Range(this__9588.meta, this__9588.start + this__9588.step, this__9588.end, this__9588.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9589 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9590 = this;
  var this__9591 = this;
  return cljs.core.pr_str.call(null, this__9591)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9592 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9593 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9594 = this;
  if(this__9594.step > 0) {
    if(this__9594.start < this__9594.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9594.start > this__9594.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9595 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9595.end - this__9595.start) / this__9595.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9596 = this;
  return this__9596.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9597 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9597.meta, this__9597.start + this__9597.step, this__9597.end, this__9597.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9598 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9599 = this;
  return new cljs.core.Range(meta, this__9599.start, this__9599.end, this__9599.step, this__9599.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9600 = this;
  return this__9600.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9601 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9601.start + n * this__9601.step
  }else {
    if(function() {
      var and__3822__auto____9602 = this__9601.start > this__9601.end;
      if(and__3822__auto____9602) {
        return this__9601.step === 0
      }else {
        return and__3822__auto____9602
      }
    }()) {
      return this__9601.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9603 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9603.start + n * this__9603.step
  }else {
    if(function() {
      var and__3822__auto____9604 = this__9603.start > this__9603.end;
      if(and__3822__auto____9604) {
        return this__9603.step === 0
      }else {
        return and__3822__auto____9604
      }
    }()) {
      return this__9603.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9605 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9605.meta)
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
    var temp__3974__auto____9608 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9608) {
      var s__9609 = temp__3974__auto____9608;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9609), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9609)))
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
    var temp__3974__auto____9616 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9616) {
      var s__9617 = temp__3974__auto____9616;
      var fst__9618 = cljs.core.first.call(null, s__9617);
      var fv__9619 = f.call(null, fst__9618);
      var run__9620 = cljs.core.cons.call(null, fst__9618, cljs.core.take_while.call(null, function(p1__9610_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9619, f.call(null, p1__9610_SHARP_))
      }, cljs.core.next.call(null, s__9617)));
      return cljs.core.cons.call(null, run__9620, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9620), s__9617))))
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
      var temp__3971__auto____9635 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9635) {
        var s__9636 = temp__3971__auto____9635;
        return reductions.call(null, f, cljs.core.first.call(null, s__9636), cljs.core.rest.call(null, s__9636))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9637 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9637) {
        var s__9638 = temp__3974__auto____9637;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9638)), cljs.core.rest.call(null, s__9638))
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
      var G__9641 = null;
      var G__9641__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9641__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9641__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9641__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9641__4 = function() {
        var G__9642__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9642 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9642__delegate.call(this, x, y, z, args)
        };
        G__9642.cljs$lang$maxFixedArity = 3;
        G__9642.cljs$lang$applyTo = function(arglist__9643) {
          var x = cljs.core.first(arglist__9643);
          var y = cljs.core.first(cljs.core.next(arglist__9643));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9643)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9643)));
          return G__9642__delegate(x, y, z, args)
        };
        G__9642.cljs$lang$arity$variadic = G__9642__delegate;
        return G__9642
      }();
      G__9641 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9641__0.call(this);
          case 1:
            return G__9641__1.call(this, x);
          case 2:
            return G__9641__2.call(this, x, y);
          case 3:
            return G__9641__3.call(this, x, y, z);
          default:
            return G__9641__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9641.cljs$lang$maxFixedArity = 3;
      G__9641.cljs$lang$applyTo = G__9641__4.cljs$lang$applyTo;
      return G__9641
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9644 = null;
      var G__9644__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9644__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9644__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9644__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9644__4 = function() {
        var G__9645__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9645 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9645__delegate.call(this, x, y, z, args)
        };
        G__9645.cljs$lang$maxFixedArity = 3;
        G__9645.cljs$lang$applyTo = function(arglist__9646) {
          var x = cljs.core.first(arglist__9646);
          var y = cljs.core.first(cljs.core.next(arglist__9646));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9646)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9646)));
          return G__9645__delegate(x, y, z, args)
        };
        G__9645.cljs$lang$arity$variadic = G__9645__delegate;
        return G__9645
      }();
      G__9644 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9644__0.call(this);
          case 1:
            return G__9644__1.call(this, x);
          case 2:
            return G__9644__2.call(this, x, y);
          case 3:
            return G__9644__3.call(this, x, y, z);
          default:
            return G__9644__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9644.cljs$lang$maxFixedArity = 3;
      G__9644.cljs$lang$applyTo = G__9644__4.cljs$lang$applyTo;
      return G__9644
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9647 = null;
      var G__9647__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9647__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9647__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9647__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9647__4 = function() {
        var G__9648__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9648 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9648__delegate.call(this, x, y, z, args)
        };
        G__9648.cljs$lang$maxFixedArity = 3;
        G__9648.cljs$lang$applyTo = function(arglist__9649) {
          var x = cljs.core.first(arglist__9649);
          var y = cljs.core.first(cljs.core.next(arglist__9649));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9649)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9649)));
          return G__9648__delegate(x, y, z, args)
        };
        G__9648.cljs$lang$arity$variadic = G__9648__delegate;
        return G__9648
      }();
      G__9647 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9647__0.call(this);
          case 1:
            return G__9647__1.call(this, x);
          case 2:
            return G__9647__2.call(this, x, y);
          case 3:
            return G__9647__3.call(this, x, y, z);
          default:
            return G__9647__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9647.cljs$lang$maxFixedArity = 3;
      G__9647.cljs$lang$applyTo = G__9647__4.cljs$lang$applyTo;
      return G__9647
    }()
  };
  var juxt__4 = function() {
    var G__9650__delegate = function(f, g, h, fs) {
      var fs__9640 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9651 = null;
        var G__9651__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9621_SHARP_, p2__9622_SHARP_) {
            return cljs.core.conj.call(null, p1__9621_SHARP_, p2__9622_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9640)
        };
        var G__9651__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9623_SHARP_, p2__9624_SHARP_) {
            return cljs.core.conj.call(null, p1__9623_SHARP_, p2__9624_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9640)
        };
        var G__9651__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9625_SHARP_, p2__9626_SHARP_) {
            return cljs.core.conj.call(null, p1__9625_SHARP_, p2__9626_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9640)
        };
        var G__9651__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9627_SHARP_, p2__9628_SHARP_) {
            return cljs.core.conj.call(null, p1__9627_SHARP_, p2__9628_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9640)
        };
        var G__9651__4 = function() {
          var G__9652__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9629_SHARP_, p2__9630_SHARP_) {
              return cljs.core.conj.call(null, p1__9629_SHARP_, cljs.core.apply.call(null, p2__9630_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9640)
          };
          var G__9652 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9652__delegate.call(this, x, y, z, args)
          };
          G__9652.cljs$lang$maxFixedArity = 3;
          G__9652.cljs$lang$applyTo = function(arglist__9653) {
            var x = cljs.core.first(arglist__9653);
            var y = cljs.core.first(cljs.core.next(arglist__9653));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9653)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9653)));
            return G__9652__delegate(x, y, z, args)
          };
          G__9652.cljs$lang$arity$variadic = G__9652__delegate;
          return G__9652
        }();
        G__9651 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9651__0.call(this);
            case 1:
              return G__9651__1.call(this, x);
            case 2:
              return G__9651__2.call(this, x, y);
            case 3:
              return G__9651__3.call(this, x, y, z);
            default:
              return G__9651__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9651.cljs$lang$maxFixedArity = 3;
        G__9651.cljs$lang$applyTo = G__9651__4.cljs$lang$applyTo;
        return G__9651
      }()
    };
    var G__9650 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9650__delegate.call(this, f, g, h, fs)
    };
    G__9650.cljs$lang$maxFixedArity = 3;
    G__9650.cljs$lang$applyTo = function(arglist__9654) {
      var f = cljs.core.first(arglist__9654);
      var g = cljs.core.first(cljs.core.next(arglist__9654));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9654)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9654)));
      return G__9650__delegate(f, g, h, fs)
    };
    G__9650.cljs$lang$arity$variadic = G__9650__delegate;
    return G__9650
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
        var G__9657 = cljs.core.next.call(null, coll);
        coll = G__9657;
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
        var and__3822__auto____9656 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9656) {
          return n > 0
        }else {
          return and__3822__auto____9656
        }
      }())) {
        var G__9658 = n - 1;
        var G__9659 = cljs.core.next.call(null, coll);
        n = G__9658;
        coll = G__9659;
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
  var matches__9661 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9661), s)) {
    if(cljs.core.count.call(null, matches__9661) === 1) {
      return cljs.core.first.call(null, matches__9661)
    }else {
      return cljs.core.vec.call(null, matches__9661)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9663 = re.exec(s);
  if(matches__9663 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9663) === 1) {
      return cljs.core.first.call(null, matches__9663)
    }else {
      return cljs.core.vec.call(null, matches__9663)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9668 = cljs.core.re_find.call(null, re, s);
  var match_idx__9669 = s.search(re);
  var match_str__9670 = cljs.core.coll_QMARK_.call(null, match_data__9668) ? cljs.core.first.call(null, match_data__9668) : match_data__9668;
  var post_match__9671 = cljs.core.subs.call(null, s, match_idx__9669 + cljs.core.count.call(null, match_str__9670));
  if(cljs.core.truth_(match_data__9668)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9668, re_seq.call(null, re, post_match__9671))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9678__9679 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9680 = cljs.core.nth.call(null, vec__9678__9679, 0, null);
  var flags__9681 = cljs.core.nth.call(null, vec__9678__9679, 1, null);
  var pattern__9682 = cljs.core.nth.call(null, vec__9678__9679, 2, null);
  return new RegExp(pattern__9682, flags__9681)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9672_SHARP_) {
    return print_one.call(null, p1__9672_SHARP_, opts)
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
          var and__3822__auto____9692 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9692)) {
            var and__3822__auto____9696 = function() {
              var G__9693__9694 = obj;
              if(G__9693__9694) {
                if(function() {
                  var or__3824__auto____9695 = G__9693__9694.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9695) {
                    return or__3824__auto____9695
                  }else {
                    return G__9693__9694.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9693__9694.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9693__9694)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9693__9694)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9696)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9696
            }
          }else {
            return and__3822__auto____9692
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9697 = !(obj == null);
          if(and__3822__auto____9697) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9697
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9698__9699 = obj;
          if(G__9698__9699) {
            if(function() {
              var or__3824__auto____9700 = G__9698__9699.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9700) {
                return or__3824__auto____9700
              }else {
                return G__9698__9699.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9698__9699.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9698__9699)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9698__9699)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9720 = new goog.string.StringBuffer;
  var G__9721__9722 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9721__9722) {
    var string__9723 = cljs.core.first.call(null, G__9721__9722);
    var G__9721__9724 = G__9721__9722;
    while(true) {
      sb__9720.append(string__9723);
      var temp__3974__auto____9725 = cljs.core.next.call(null, G__9721__9724);
      if(temp__3974__auto____9725) {
        var G__9721__9726 = temp__3974__auto____9725;
        var G__9739 = cljs.core.first.call(null, G__9721__9726);
        var G__9740 = G__9721__9726;
        string__9723 = G__9739;
        G__9721__9724 = G__9740;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9727__9728 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9727__9728) {
    var obj__9729 = cljs.core.first.call(null, G__9727__9728);
    var G__9727__9730 = G__9727__9728;
    while(true) {
      sb__9720.append(" ");
      var G__9731__9732 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9729, opts));
      if(G__9731__9732) {
        var string__9733 = cljs.core.first.call(null, G__9731__9732);
        var G__9731__9734 = G__9731__9732;
        while(true) {
          sb__9720.append(string__9733);
          var temp__3974__auto____9735 = cljs.core.next.call(null, G__9731__9734);
          if(temp__3974__auto____9735) {
            var G__9731__9736 = temp__3974__auto____9735;
            var G__9741 = cljs.core.first.call(null, G__9731__9736);
            var G__9742 = G__9731__9736;
            string__9733 = G__9741;
            G__9731__9734 = G__9742;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9737 = cljs.core.next.call(null, G__9727__9730);
      if(temp__3974__auto____9737) {
        var G__9727__9738 = temp__3974__auto____9737;
        var G__9743 = cljs.core.first.call(null, G__9727__9738);
        var G__9744 = G__9727__9738;
        obj__9729 = G__9743;
        G__9727__9730 = G__9744;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9720
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9746 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9746.append("\n");
  return[cljs.core.str(sb__9746)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9765__9766 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9765__9766) {
    var string__9767 = cljs.core.first.call(null, G__9765__9766);
    var G__9765__9768 = G__9765__9766;
    while(true) {
      cljs.core.string_print.call(null, string__9767);
      var temp__3974__auto____9769 = cljs.core.next.call(null, G__9765__9768);
      if(temp__3974__auto____9769) {
        var G__9765__9770 = temp__3974__auto____9769;
        var G__9783 = cljs.core.first.call(null, G__9765__9770);
        var G__9784 = G__9765__9770;
        string__9767 = G__9783;
        G__9765__9768 = G__9784;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9771__9772 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9771__9772) {
    var obj__9773 = cljs.core.first.call(null, G__9771__9772);
    var G__9771__9774 = G__9771__9772;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9775__9776 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9773, opts));
      if(G__9775__9776) {
        var string__9777 = cljs.core.first.call(null, G__9775__9776);
        var G__9775__9778 = G__9775__9776;
        while(true) {
          cljs.core.string_print.call(null, string__9777);
          var temp__3974__auto____9779 = cljs.core.next.call(null, G__9775__9778);
          if(temp__3974__auto____9779) {
            var G__9775__9780 = temp__3974__auto____9779;
            var G__9785 = cljs.core.first.call(null, G__9775__9780);
            var G__9786 = G__9775__9780;
            string__9777 = G__9785;
            G__9775__9778 = G__9786;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9781 = cljs.core.next.call(null, G__9771__9774);
      if(temp__3974__auto____9781) {
        var G__9771__9782 = temp__3974__auto____9781;
        var G__9787 = cljs.core.first.call(null, G__9771__9782);
        var G__9788 = G__9771__9782;
        obj__9773 = G__9787;
        G__9771__9774 = G__9788;
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
  pr_str.cljs$lang$applyTo = function(arglist__9789) {
    var objs = cljs.core.seq(arglist__9789);
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
  prn_str.cljs$lang$applyTo = function(arglist__9790) {
    var objs = cljs.core.seq(arglist__9790);
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
  pr.cljs$lang$applyTo = function(arglist__9791) {
    var objs = cljs.core.seq(arglist__9791);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__9792) {
    var objs = cljs.core.seq(arglist__9792);
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
  print_str.cljs$lang$applyTo = function(arglist__9793) {
    var objs = cljs.core.seq(arglist__9793);
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
  println.cljs$lang$applyTo = function(arglist__9794) {
    var objs = cljs.core.seq(arglist__9794);
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
  println_str.cljs$lang$applyTo = function(arglist__9795) {
    var objs = cljs.core.seq(arglist__9795);
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
  prn.cljs$lang$applyTo = function(arglist__9796) {
    var objs = cljs.core.seq(arglist__9796);
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
  printf.cljs$lang$applyTo = function(arglist__9797) {
    var fmt = cljs.core.first(arglist__9797);
    var args = cljs.core.rest(arglist__9797);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9798 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9798, "{", ", ", "}", opts, coll)
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
  var pr_pair__9799 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9799, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9800 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9800, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____9801 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9801)) {
        var nspc__9802 = temp__3974__auto____9801;
        return[cljs.core.str(nspc__9802), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9803 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9803)) {
          var nspc__9804 = temp__3974__auto____9803;
          return[cljs.core.str(nspc__9804), cljs.core.str("/")].join("")
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
  var pr_pair__9805 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9805, "{", ", ", "}", opts, coll)
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
  var normalize__9807 = function(n, len) {
    var ns__9806 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9806) < len) {
        var G__9809 = [cljs.core.str("0"), cljs.core.str(ns__9806)].join("");
        ns__9806 = G__9809;
        continue
      }else {
        return ns__9806
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9807.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9807.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9807.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9807.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9807.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9807.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__9808 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9808, "{", ", ", "}", opts, coll)
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
  var this__9810 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9811 = this;
  var G__9812__9813 = cljs.core.seq.call(null, this__9811.watches);
  if(G__9812__9813) {
    var G__9815__9817 = cljs.core.first.call(null, G__9812__9813);
    var vec__9816__9818 = G__9815__9817;
    var key__9819 = cljs.core.nth.call(null, vec__9816__9818, 0, null);
    var f__9820 = cljs.core.nth.call(null, vec__9816__9818, 1, null);
    var G__9812__9821 = G__9812__9813;
    var G__9815__9822 = G__9815__9817;
    var G__9812__9823 = G__9812__9821;
    while(true) {
      var vec__9824__9825 = G__9815__9822;
      var key__9826 = cljs.core.nth.call(null, vec__9824__9825, 0, null);
      var f__9827 = cljs.core.nth.call(null, vec__9824__9825, 1, null);
      var G__9812__9828 = G__9812__9823;
      f__9827.call(null, key__9826, this$, oldval, newval);
      var temp__3974__auto____9829 = cljs.core.next.call(null, G__9812__9828);
      if(temp__3974__auto____9829) {
        var G__9812__9830 = temp__3974__auto____9829;
        var G__9837 = cljs.core.first.call(null, G__9812__9830);
        var G__9838 = G__9812__9830;
        G__9815__9822 = G__9837;
        G__9812__9823 = G__9838;
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
  var this__9831 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9831.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9832 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9832.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9833 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9833.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9834 = this;
  return this__9834.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9835 = this;
  return this__9835.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9836 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9850__delegate = function(x, p__9839) {
      var map__9845__9846 = p__9839;
      var map__9845__9847 = cljs.core.seq_QMARK_.call(null, map__9845__9846) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9845__9846) : map__9845__9846;
      var validator__9848 = cljs.core._lookup.call(null, map__9845__9847, "\ufdd0'validator", null);
      var meta__9849 = cljs.core._lookup.call(null, map__9845__9847, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9849, validator__9848, null)
    };
    var G__9850 = function(x, var_args) {
      var p__9839 = null;
      if(goog.isDef(var_args)) {
        p__9839 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9850__delegate.call(this, x, p__9839)
    };
    G__9850.cljs$lang$maxFixedArity = 1;
    G__9850.cljs$lang$applyTo = function(arglist__9851) {
      var x = cljs.core.first(arglist__9851);
      var p__9839 = cljs.core.rest(arglist__9851);
      return G__9850__delegate(x, p__9839)
    };
    G__9850.cljs$lang$arity$variadic = G__9850__delegate;
    return G__9850
  }();
  atom = function(x, var_args) {
    var p__9839 = var_args;
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
  var temp__3974__auto____9855 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9855)) {
    var validate__9856 = temp__3974__auto____9855;
    if(cljs.core.truth_(validate__9856.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9857 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9857, new_value);
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
    var G__9858__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9858 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9858__delegate.call(this, a, f, x, y, z, more)
    };
    G__9858.cljs$lang$maxFixedArity = 5;
    G__9858.cljs$lang$applyTo = function(arglist__9859) {
      var a = cljs.core.first(arglist__9859);
      var f = cljs.core.first(cljs.core.next(arglist__9859));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9859)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9859))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9859)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9859)))));
      return G__9858__delegate(a, f, x, y, z, more)
    };
    G__9858.cljs$lang$arity$variadic = G__9858__delegate;
    return G__9858
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9860) {
    var iref = cljs.core.first(arglist__9860);
    var f = cljs.core.first(cljs.core.next(arglist__9860));
    var args = cljs.core.rest(cljs.core.next(arglist__9860));
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
  var this__9861 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9861.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9862 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9862.state, function(p__9863) {
    var map__9864__9865 = p__9863;
    var map__9864__9866 = cljs.core.seq_QMARK_.call(null, map__9864__9865) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9864__9865) : map__9864__9865;
    var curr_state__9867 = map__9864__9866;
    var done__9868 = cljs.core._lookup.call(null, map__9864__9866, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9868)) {
      return curr_state__9867
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9862.f.call(null)})
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
    var map__9889__9890 = options;
    var map__9889__9891 = cljs.core.seq_QMARK_.call(null, map__9889__9890) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9889__9890) : map__9889__9890;
    var keywordize_keys__9892 = cljs.core._lookup.call(null, map__9889__9891, "\ufdd0'keywordize-keys", null);
    var keyfn__9893 = cljs.core.truth_(keywordize_keys__9892) ? cljs.core.keyword : cljs.core.str;
    var f__9908 = function thisfn(x) {
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
                var iter__2462__auto____9907 = function iter__9901(s__9902) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9902__9905 = s__9902;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9902__9905)) {
                        var k__9906 = cljs.core.first.call(null, s__9902__9905);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9893.call(null, k__9906), thisfn.call(null, x[k__9906])], true), iter__9901.call(null, cljs.core.rest.call(null, s__9902__9905)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____9907.call(null, cljs.core.js_keys.call(null, x))
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
    return f__9908.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9909) {
    var x = cljs.core.first(arglist__9909);
    var options = cljs.core.rest(arglist__9909);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9914 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9918__delegate = function(args) {
      var temp__3971__auto____9915 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9914), args, null);
      if(cljs.core.truth_(temp__3971__auto____9915)) {
        var v__9916 = temp__3971__auto____9915;
        return v__9916
      }else {
        var ret__9917 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9914, cljs.core.assoc, args, ret__9917);
        return ret__9917
      }
    };
    var G__9918 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9918__delegate.call(this, args)
    };
    G__9918.cljs$lang$maxFixedArity = 0;
    G__9918.cljs$lang$applyTo = function(arglist__9919) {
      var args = cljs.core.seq(arglist__9919);
      return G__9918__delegate(args)
    };
    G__9918.cljs$lang$arity$variadic = G__9918__delegate;
    return G__9918
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9921 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9921)) {
        var G__9922 = ret__9921;
        f = G__9922;
        continue
      }else {
        return ret__9921
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9923__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9923 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9923__delegate.call(this, f, args)
    };
    G__9923.cljs$lang$maxFixedArity = 1;
    G__9923.cljs$lang$applyTo = function(arglist__9924) {
      var f = cljs.core.first(arglist__9924);
      var args = cljs.core.rest(arglist__9924);
      return G__9923__delegate(f, args)
    };
    G__9923.cljs$lang$arity$variadic = G__9923__delegate;
    return G__9923
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
    var k__9926 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9926, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9926, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____9935 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9935) {
      return or__3824__auto____9935
    }else {
      var or__3824__auto____9936 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9936) {
        return or__3824__auto____9936
      }else {
        var and__3822__auto____9937 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9937) {
          var and__3822__auto____9938 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9938) {
            var and__3822__auto____9939 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9939) {
              var ret__9940 = true;
              var i__9941 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9942 = cljs.core.not.call(null, ret__9940);
                  if(or__3824__auto____9942) {
                    return or__3824__auto____9942
                  }else {
                    return i__9941 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9940
                }else {
                  var G__9943 = isa_QMARK_.call(null, h, child.call(null, i__9941), parent.call(null, i__9941));
                  var G__9944 = i__9941 + 1;
                  ret__9940 = G__9943;
                  i__9941 = G__9944;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9939
            }
          }else {
            return and__3822__auto____9938
          }
        }else {
          return and__3822__auto____9937
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
    var tp__9953 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9954 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9955 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9956 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9957 = cljs.core.contains_QMARK_.call(null, tp__9953.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9955.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9955.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9953, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9956.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9954, parent, ta__9955), "\ufdd0'descendants":tf__9956.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9955, tag, td__9954)})
    }();
    if(cljs.core.truth_(or__3824__auto____9957)) {
      return or__3824__auto____9957
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
    var parentMap__9962 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9963 = cljs.core.truth_(parentMap__9962.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9962.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9964 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9963)) ? cljs.core.assoc.call(null, parentMap__9962, tag, childsParents__9963) : cljs.core.dissoc.call(null, parentMap__9962, tag);
    var deriv_seq__9965 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9945_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9945_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9945_SHARP_), cljs.core.second.call(null, p1__9945_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9964)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9962.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9946_SHARP_, p2__9947_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9946_SHARP_, p2__9947_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9965))
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
  var xprefs__9973 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9975 = cljs.core.truth_(function() {
    var and__3822__auto____9974 = xprefs__9973;
    if(cljs.core.truth_(and__3822__auto____9974)) {
      return xprefs__9973.call(null, y)
    }else {
      return and__3822__auto____9974
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9975)) {
    return or__3824__auto____9975
  }else {
    var or__3824__auto____9977 = function() {
      var ps__9976 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9976) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9976), prefer_table))) {
          }else {
          }
          var G__9980 = cljs.core.rest.call(null, ps__9976);
          ps__9976 = G__9980;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9977)) {
      return or__3824__auto____9977
    }else {
      var or__3824__auto____9979 = function() {
        var ps__9978 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9978) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9978), y, prefer_table))) {
            }else {
            }
            var G__9981 = cljs.core.rest.call(null, ps__9978);
            ps__9978 = G__9981;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9979)) {
        return or__3824__auto____9979
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9983 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9983)) {
    return or__3824__auto____9983
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10001 = cljs.core.reduce.call(null, function(be, p__9993) {
    var vec__9994__9995 = p__9993;
    var k__9996 = cljs.core.nth.call(null, vec__9994__9995, 0, null);
    var ___9997 = cljs.core.nth.call(null, vec__9994__9995, 1, null);
    var e__9998 = vec__9994__9995;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9996)) {
      var be2__10000 = cljs.core.truth_(function() {
        var or__3824__auto____9999 = be == null;
        if(or__3824__auto____9999) {
          return or__3824__auto____9999
        }else {
          return cljs.core.dominates.call(null, k__9996, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9998 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10000), k__9996, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9996), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10000)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10000
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10001)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10001));
      return cljs.core.second.call(null, best_entry__10001)
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
    var and__3822__auto____10006 = mf;
    if(and__3822__auto____10006) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10006
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____10007 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10008 = cljs.core._reset[goog.typeOf(x__2363__auto____10007)];
      if(or__3824__auto____10008) {
        return or__3824__auto____10008
      }else {
        var or__3824__auto____10009 = cljs.core._reset["_"];
        if(or__3824__auto____10009) {
          return or__3824__auto____10009
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10014 = mf;
    if(and__3822__auto____10014) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10014
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____10015 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10016 = cljs.core._add_method[goog.typeOf(x__2363__auto____10015)];
      if(or__3824__auto____10016) {
        return or__3824__auto____10016
      }else {
        var or__3824__auto____10017 = cljs.core._add_method["_"];
        if(or__3824__auto____10017) {
          return or__3824__auto____10017
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10022 = mf;
    if(and__3822__auto____10022) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10022
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10023 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10024 = cljs.core._remove_method[goog.typeOf(x__2363__auto____10023)];
      if(or__3824__auto____10024) {
        return or__3824__auto____10024
      }else {
        var or__3824__auto____10025 = cljs.core._remove_method["_"];
        if(or__3824__auto____10025) {
          return or__3824__auto____10025
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10030 = mf;
    if(and__3822__auto____10030) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10030
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____10031 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10032 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____10031)];
      if(or__3824__auto____10032) {
        return or__3824__auto____10032
      }else {
        var or__3824__auto____10033 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10033) {
          return or__3824__auto____10033
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10038 = mf;
    if(and__3822__auto____10038) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10038
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10039 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10040 = cljs.core._get_method[goog.typeOf(x__2363__auto____10039)];
      if(or__3824__auto____10040) {
        return or__3824__auto____10040
      }else {
        var or__3824__auto____10041 = cljs.core._get_method["_"];
        if(or__3824__auto____10041) {
          return or__3824__auto____10041
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10046 = mf;
    if(and__3822__auto____10046) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10046
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____10047 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10048 = cljs.core._methods[goog.typeOf(x__2363__auto____10047)];
      if(or__3824__auto____10048) {
        return or__3824__auto____10048
      }else {
        var or__3824__auto____10049 = cljs.core._methods["_"];
        if(or__3824__auto____10049) {
          return or__3824__auto____10049
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10054 = mf;
    if(and__3822__auto____10054) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10054
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____10055 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10056 = cljs.core._prefers[goog.typeOf(x__2363__auto____10055)];
      if(or__3824__auto____10056) {
        return or__3824__auto____10056
      }else {
        var or__3824__auto____10057 = cljs.core._prefers["_"];
        if(or__3824__auto____10057) {
          return or__3824__auto____10057
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10062 = mf;
    if(and__3822__auto____10062) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10062
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____10063 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10064 = cljs.core._dispatch[goog.typeOf(x__2363__auto____10063)];
      if(or__3824__auto____10064) {
        return or__3824__auto____10064
      }else {
        var or__3824__auto____10065 = cljs.core._dispatch["_"];
        if(or__3824__auto____10065) {
          return or__3824__auto____10065
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10068 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10069 = cljs.core._get_method.call(null, mf, dispatch_val__10068);
  if(cljs.core.truth_(target_fn__10069)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10068)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10069, args)
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
  var this__10070 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10071 = this;
  cljs.core.swap_BANG_.call(null, this__10071.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10071.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10071.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10071.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10072 = this;
  cljs.core.swap_BANG_.call(null, this__10072.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10072.method_cache, this__10072.method_table, this__10072.cached_hierarchy, this__10072.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10073 = this;
  cljs.core.swap_BANG_.call(null, this__10073.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10073.method_cache, this__10073.method_table, this__10073.cached_hierarchy, this__10073.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10074 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10074.cached_hierarchy), cljs.core.deref.call(null, this__10074.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10074.method_cache, this__10074.method_table, this__10074.cached_hierarchy, this__10074.hierarchy)
  }
  var temp__3971__auto____10075 = cljs.core.deref.call(null, this__10074.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10075)) {
    var target_fn__10076 = temp__3971__auto____10075;
    return target_fn__10076
  }else {
    var temp__3971__auto____10077 = cljs.core.find_and_cache_best_method.call(null, this__10074.name, dispatch_val, this__10074.hierarchy, this__10074.method_table, this__10074.prefer_table, this__10074.method_cache, this__10074.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10077)) {
      var target_fn__10078 = temp__3971__auto____10077;
      return target_fn__10078
    }else {
      return cljs.core.deref.call(null, this__10074.method_table).call(null, this__10074.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10079 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10079.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10079.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10079.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10079.method_cache, this__10079.method_table, this__10079.cached_hierarchy, this__10079.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10080 = this;
  return cljs.core.deref.call(null, this__10080.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10081 = this;
  return cljs.core.deref.call(null, this__10081.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10082 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10082.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10084__delegate = function(_, args) {
    var self__10083 = this;
    return cljs.core._dispatch.call(null, self__10083, args)
  };
  var G__10084 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10084__delegate.call(this, _, args)
  };
  G__10084.cljs$lang$maxFixedArity = 1;
  G__10084.cljs$lang$applyTo = function(arglist__10085) {
    var _ = cljs.core.first(arglist__10085);
    var args = cljs.core.rest(arglist__10085);
    return G__10084__delegate(_, args)
  };
  G__10084.cljs$lang$arity$variadic = G__10084__delegate;
  return G__10084
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10086 = this;
  return cljs.core._dispatch.call(null, self__10086, args)
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
  var this__10087 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10089, _) {
  var this__10088 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10088.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10090 = this;
  var and__3822__auto____10091 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10091) {
    return this__10090.uuid === other.uuid
  }else {
    return and__3822__auto____10091
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10092 = this;
  var this__10093 = this;
  return cljs.core.pr_str.call(null, this__10093)
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
        return cljs.core.reduce.call(null, function(m, p__106014) {
          var vec__106015__106016 = p__106014;
          var k__106017 = cljs.core.nth.call(null, vec__106015__106016, 0, null);
          var v__106018 = cljs.core.nth.call(null, vec__106015__106016, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__106017), clj__GT_js.call(null, v__106018))
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
