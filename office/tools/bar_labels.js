const fs = require('fs');
const d = JSON.parse(fs.readFileSync('D:\\Mithaq\\tools\\bartest\\bar\\lawyers.json', 'utf8'));
const labels = {}, statuses = {}; let phones = 0, emails = 0;
for (const l of d.lawyers) { for (const k of Object.keys(l.info)) labels[k] = (labels[k] || 0) + 1; statuses[l.status] = (statuses[l.status] || 0) + 1; if (l.phones.length) phones++; if (l.email) emails++ }
const ex = d.lawyers.find(l => l.phones.length && Object.keys(l.info).length >= 3);
fs.writeFileSync('D:\\Mithaq\\tools\\bar_labels.txt', JSON.stringify({ total: d.total, labels, statuses, phones, emails, exampleKeys: ex && { mno: ex.mno, info: ex.info, nPhones: ex.phones.length } }, null, 1), 'utf8');
