function getFamilyName(css) {
  var regex = /font-family:\s*(.+?)\s*;/; 
  if(regex.test(css)) {
    var matches = css.match(regex);
    return matches[1].split(',')[0].trim();
  } else {
    return "";
  }
}