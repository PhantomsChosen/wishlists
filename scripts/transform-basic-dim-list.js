// transforms a basic dim list into a little light wishlist
//
// for some script basics and file system references
// https://devdojo.com/bo-iliev/how-to-write-your-first-nodejs-script
const fs = require('fs');
const rolls = require("../data/initial-rolls.json");


function createItem(weaponId, perks) {
  return {
    description: '',
    hash: +weaponId,
    name: '',
    plugs: [
      [perks[0]], [perks[1]], [perks[2]], [perks[3]]
    ],
    tags: []
  }
}


function translateItem(str) {
  // seperate into two parts
  const words = str.split('?');

  // strips all non numeric symbol: myString.replace(/\D/g,'');
  const weaponId = words[0].replace(/\D/g, '');

  // important perks should be array positions 1, 2, 3, 4 (skip 0 and any others)
  const allPerks = words[1].split(',');
  const perks = [+allPerks[1], +allPerks[2], +allPerks[3], +allPerks[4]];

  return createItem(weaponId, perks);
}


function translateRolls() {

  const results = rolls.map(str => translateItem(str))

  const wishlist = {
    description: "",
    name: "hama rolls s15",
    data: results
  }

  let data = JSON.stringify(wishlist, null, 2);
  fs.writeFileSync(`${process.cwd()}/lists/hama-rolls-s15-initial.json`, data);
}

translateRolls();
