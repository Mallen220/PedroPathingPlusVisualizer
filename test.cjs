const fs = require('fs');
let code = fs.readFileSync('src/lib/components/dialogs/ExportImageDialog.svelte', 'utf-8');
const lines = code.split('\n');
console.log("Lines around downloadImage implementation:");
for(let i=122; i<132; i++) {
  console.log(i+1, lines[i]);
}
