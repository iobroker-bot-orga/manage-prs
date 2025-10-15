const fs = require("node:fs");

const fileName = './.gitignore';

if (!fs.existsSync(fileName)) {
    console.log(`❌ ${fileName} does not exist, cannot create PR.`);
    process.exit(0);
}

console.log(`✓ ${fileName} exists.`);

let fileContent = fs.readFileSync(fileName, 'utf8');
if (fileContent.includes('.commitinfo')) {
    console.log(`✔️ ${fileName} already contains ".commitinfo", no need for a PR.`);
    process.exit(0);
}

fs.appendFileSync(fileName, '\n#ignore .commitinfo created by ioBroker release script\n.commitinfo\n');
console.log(`✔️ .commitinfo appended to ${fileName}. PR will be created`);

process.exit(0);

