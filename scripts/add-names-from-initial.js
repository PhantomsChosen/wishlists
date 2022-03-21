// transforms a basic dim list into a little light wishlist
//
// for some script basics and file system references
// https://devdojo.com/bo-iliev/how-to-write-your-first-nodejs-script
const fs = require('fs');
const nameMap = require("../maps/name-map.json");
const wishlist = require("../data/Basic_PvE_Weapons_rolls_to_look_for.json");

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

function addName(roll) {
  const name = nameMap[roll.hash];
  if (name) {
    roll.name = name;
  }
  else {
    console.log(`No name found for hash: ${roll.hash}`);
  }
}


function translateRolls() {
  // just assigns name to the existing json data
  wishlist.data.map(roll => addName(roll));
  fs.writeFileSync(`${process.cwd()}/lists/hama-rolls-s15-named.json`, JSON.stringify(wishlist, null, 2));
}

translateRolls();
