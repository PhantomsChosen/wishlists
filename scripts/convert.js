// transforms a basic dim list into a little light wishlist
// https://wishlists.littlelight.club/#/
//
// for some script basics and file system references
// https://devdojo.com/bo-iliev/how-to-write-your-first-nodejs-script
const fs = require('fs');
const cloneDeep = require('lodash.clonedeep');

const adeptMap = require("../maps/adept-map.json");
const combinePerks = require('./combinePerks');
const nameMap = require("../maps/name-map.json");

const noNameList = [];

const tagMap = {
  Controller: 'controller',
  GodPVE: 'god-pve',
  GodPVP: 'god-pvp',
  Mouse: 'mnk',
  PVE: 'pve',
  PVP: 'pvp',
}


function addName(roll) {
  const { hash, description } = roll;
  const name = nameMap[hash];

  if (name) {
    roll.name = name;
  }
  else if (!noNameList.includes(hash)) {
    noNameList.push(hash);
    console.log(`No name found for hash id: ${hash}`);
  }

  // remove returns from description
  // filters out "empty" extra returns
  // trims white space around each phrase
  // glues back together with a space
  if (description) {
    roll.description = `[Hama] ${description.split("\n").filter(x => x).map(str => str.trim()).join(' ')}`;
  }

  return roll;
}

function addNamesToRolls(rolls) {
  console.log(`Adding known weapon names to rolls...`)
  // just assigns name to the existing json data
  return rolls.map(roll => addName(roll));
}




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


function addAdeptRolls(rolls) {
  // just assigns name to the existing json data
  const adepts = [];

  console.log(`Original Rolls: ${rolls.length}`)

  rolls.forEach(roll => {
    const adeptRoll = convertToAdept(roll);
    if (adeptRoll) adepts.push(adeptRoll)
  });

  console.log(`Adept Rolls: ${adepts.length}`)

  const dataWithAdepts = [... new Set([...rolls, ...adepts])]
  console.log(`Total Unique Rolls: ${dataWithAdepts.length}`)
  return dataWithAdepts
}



function createDimList(wishlist) {
  const fileName = "hama-rolls.txt"

  fs.unlink(fileName, function (err) {
    if (err && err.code == 'ENOENT') {
      // file doesn't exist
      console.info("File doesn't exist, won't remove it.");
    }
    else if (err) {
      // other errors, e.g. maybe we don't have enough permission
      console.error("Error occurred while trying to remove file");
    }
    else {
      console.info(`removed`);
    }
  });

  const file = fs.createWriteStream(fileName, { flags: 'a' }); // a to append
  const writeLine = (line) => file.write(`${line}\n`);
  const lineBreak = () => file.write(`\n\n`);

  // add title and description
  const { name: listName, data: rolls, description: listDescription } = wishlist;
  writeLine(`title:${listName}`);
  writeLine(`description:${listDescription}`);
  lineBreak();

  // output like:
  // // <name> - (<tags>)
  // //notes: <description> <tags>
  // dimwishlist:item=20935540&perks=839105230,3142289711,1168162263,1546637391
  rolls.forEach(roll => {
    const { description, hash, name, plugs, tags } = roll;

    let note = description;

    let tagString = '';
    if (tags.length) {
      tagString = tags.map(tag => tagMap[tag] || tag).join(', ');
      if (!note.endsWith('.')) note = `${note}.`
      note = `${note} tags: ${tagString}`
    }

    writeLine(`// ${name} - (${tagString})`);

    if (description) writeLine(`//notes: ${note}`);

    combinePerks(roll.plugs).forEach(perkSet => {
      writeLine(`dimwishlist:item=${hash}&perks=${perkSet}`)
    })

    lineBreak();
  });

  file.end();
}


function massageList() {
  const args = process.argv.slice(2)
  let name = args[0];

  const sourceName = name.endsWith('.json') ? name : `${name}.json`

  let wishlist;

  try {
    const fileName = `${process.cwd()}/data/${sourceName}`;
    console.log(`Converting "${fileName}" to DIM wishlist...`)
    wishlist = JSON.parse(fs.readFileSync(fileName));
  }
  catch (e) {
    console.log(e)
  }

  // add mapped names and known adepts to wishlist data
  const { data } = wishlist;
  wishlist.data = addAdeptRolls(addNamesToRolls(data));

  // rename the list according to the original name
  const listName = name.replace('.json', '');
  wishlist.name = listName;

  // write out the updated little light list
  fs.writeFileSync(`${process.cwd()}/lists/${sourceName}`, JSON.stringify(wishlist));

  // WIP: create dim wishlist
  createDimList(wishlist)
}

massageList();
