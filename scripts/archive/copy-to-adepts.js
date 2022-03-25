// transforms a basic dim list into a little light wishlist
// https://wishlists.littlelight.club/#/
//
// for some script basics and file system references
// https://devdojo.com/bo-iliev/how-to-write-your-first-nodejs-script
const fs = require('fs');
const cloneDeep = require('lodash.clonedeep');

const adeptMap = require("../../maps/adept-map.json");
const wishlist = require("../lists/hama-rolls-s15-named.json");

const noNameList = [];



function convertToAdept(roll) {
  const { hash } = roll;
  const adeptId = adeptMap[hash];

  if (adeptId) {
    const adept = cloneDeep(roll);
    adept.name = `${roll.name} (Adept)`;
    adept.hash = adeptId
    return adept
  }
}


function copyToAdeptRoll() {
  const { data } = wishlist;
  // just assigns name to the existing json data
  const adepts = [];

  console.log(`Normal Rolls: ${data.length}`)

  data.forEach(roll => {
    const adeptRoll = convertToAdept(roll);
    if (adeptRoll) adepts.push(adeptRoll)
  });
  console.log(`Adept Rolls: ${adepts.length}`)

  // add the adept copies to the wishlist data
  wishlist.data = [...data, ...adepts];
  console.log(`Total Rolls: ${wishlist.data.length}`)

  // uniq = [...new Set(array)];
  wishlist.data = [... new Set(wishlist.data)];
  console.log(`Unique Rolls: ${wishlist.data.length}`)

  fs.writeFileSync(`${process.cwd()}/lists/hama-rolls-s15-plus-adept.json`, JSON.stringify(wishlist, null, 2));
}

copyToAdeptRoll();
