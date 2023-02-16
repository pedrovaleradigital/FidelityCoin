const basePath = process.cwd();
const fs = require("fs");

const namePrefix = "Fidelity NFT";
const description = "Fidelity NFT colllection, created as Loyalty Program Solution, with Superpowered NFT and expiration Token";
const baseUri = "ipfs://QmNtNgKcTdFhm945zFMgYNaKFH8YM3ZgK83yzvhztPstjp";

// read json data
let rawdata = fs.readFileSync(`${basePath}/ipfs/_metadata.json`);
let data = JSON.parse(rawdata);
var group = "";

data.forEach((item) => {

  item.name = `${namePrefix} ${group} #${item.edition}`;
  item.description = description;
  item.image = `${baseUri}/${item.edition}.png`;

  fs.writeFileSync(
    `${basePath}/ipfs/metadata/${item.edition}.json`,
    JSON.stringify(item, null, 2)
  );
});

console.log(`Updated baseUri for images to ===> ${baseUri}`);
console.log(`Updated description for images to ===> ${description}`);
console.log(`Updated name prefix for images to ===> ${namePrefix}`);
