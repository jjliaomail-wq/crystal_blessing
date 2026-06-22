const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');
const search = "      range: 'Sheefunction appendToSheet(row) {";
const replace = `      range: 'Sheet1!A1:H1',
    });
  } catch(e) {}
  return sheetsClient;
}

function appendToSheet(row) {`;
c = c.replace(search, replace);
fs.writeFileSync('server.js', c, 'utf8');
console.log('Fixed server.js');
