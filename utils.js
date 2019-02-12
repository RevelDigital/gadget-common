;(function ( namespace, undefined ) {

    var FONT_FAMILY_REGEX = /font-family:\s*(?:[&#39;&#34;])*['"]*(.+?)['"]*(?:[&#39;&#34;])*\s*;/i;
    
    namespace.getFamilyName = function (css) {
      if(FONT_FAMILY_REGEX.test(css)) {
        var matches = css.match(FONT_FAMILY_REGEX);
        return $.trim(matches[1].split(',')[0]);
      } else {
        return "";
      }
    }
    
    namespace.getQueryStringValue = function (key) {  
        return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
    }
    
})(window.RevelDigital = window.RevelDigital || {});
