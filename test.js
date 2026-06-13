const fs = require('fs');
try {
  eval(fs.readFileSync('js/components.js', 'utf8'));
  console.log("Syntax OK");
} catch(e) {
  console.log(e);
}
