const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL AND type IN ('table', 'index')", (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  let out = '';
  rows.forEach(row => {
    if(!row.name || row.name === 'sqlite_sequence') return;
    out += row.sql + ';\n\n';
  });
  fs.writeFileSync('schema.sql', out);
});
