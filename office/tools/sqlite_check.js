const fs = require('fs');
let out;
try { const { DatabaseSync } = require('node:sqlite'); const d = new DatabaseSync(':memory:'); out = 'OK node ' + process.versions.node + ' electron ' + process.versions.electron + ' ' + JSON.stringify(d.prepare('select sqlite_version() v').get()); }
catch (e) { out = 'NO ' + process.versions.node + ' ' + e.message; }
fs.writeFileSync('D:\\Mithaq\\tools\\sqlite_check.txt', out);
