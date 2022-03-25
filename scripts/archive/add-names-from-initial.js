// transforms a basic dim list into a little light wishlist
// https://wishlists.littlelight.club/#/
//
// for some script basics and file system references
// https://devdojo.com/bo-iliev/how-to-write-your-first-nodejs-script
const fs = require('fs');
const nameMap = require("../../maps/name-map.json");
const wishlist = require("../../data/Basic_PvE_Weapons_2022.03.24.2.json");

const noNameList = [];


function addName(roll) {
  const { hash } = roll;
  const name = nameMap[hash];

  if (name) {
    roll.name = name;
  }
  else if (!noNameList.includes(hash)) {
    noNameList.push(hash);
    console.log(`No name found for hash: ${hash}`);
  }
}

function addNamesToRolls() {
  // just assigns name to the existing json data
  wishlist.data.map(roll => addName(roll));
  fs.writeFileSync(`${process.cwd()}/lists/hama-rolls-s15-named.json`, JSON.stringify(wishlist, null, 2));
}

addNamesToRolls();
