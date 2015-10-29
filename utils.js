;(function ( namespace, undefined ) {

    var FONT_FAMILY_REGEX = /font-family:\s*(?:&#39;)*['"]*(.+?)['"]*(?:&#39;)*\s*;/i;
    
    namespace.getFamilyName = function (css) {
      if(FONT_FAMILY_REGEX.test(css)) {
        var matches = css.match(FONT_FAMILY_REGEX);
        return matches[1].split(',')[0].trim();
      } else {
        return "";
      }
    }
})(window.RevelDigital = window.RevelDigital || {});
