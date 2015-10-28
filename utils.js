function getFamilyName(css) {
  var regex = /font-family:\s*(?:&#39;)*['"]*(.+?)['"]*(?:&#39;)*\s*;/i;
  if(regex.test(css)) {
    var matches = css.match(regex);
    return matches[1].split(',')[1].trim();
  } else {
    return "";
  }
}