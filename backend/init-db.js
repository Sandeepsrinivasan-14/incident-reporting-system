const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dev.db');
const fs = require('fs');

const sql = fs.readFileSync('schema.sql', 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('DB init error', err);
  } else {
    console.log('DB initialized');

    const insertSql = "INSERT OR IGNORE INTO users (email, password, role) VALUES ('reporter@test.com', '', 'REPORTER'), ('resolver@test.com', '', 'RESOLVER');";

    db.run(insertSql, (e) => {
      if (e) console.error(e);
      else console.log('Test users ready');
      db.close();
    });
  }
});
