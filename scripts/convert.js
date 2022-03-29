// transforms a basic dim list into a little light wishlist
// https://wishlists.littlelight.club/#/
//
// for some script basics and file system references
// https://devdojo.com/bo-iliev/how-to-write-your-first-nodejs-script
const fs = require('fs');
const path = require('path');
const cloneDeep = require('lodash.clonedeep');
const dir = require('node-dir');

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

const CWD = process.cwd();



// //joining path of directory
// const directoryPath = path.join(__dirname, 'Documents');

// //passsing directoryPath and callback function
// fs.readdir(directoryPath, function (err, files) {
//     //handling error
//     if (err) {
//         return console.log('Unable to scan directory: ' + err);
//     }
//     //listing all files using forEach
//     files.forEach(function (file) {
//         // Do whatever you want to do with the file
//         console.log(file);
//     });
// });

function collectData() {
  const dataPath = path.join(CWD, 'data');

  let rolls = [];

  // dir.readFiles(dataPath, { match: /.json$/, recursive: false }, function (err, content, fileName, next) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       wishlist = JSON.parse(fs.readFileSync(fileName));
  //       rolls = rolls.concat(wishlist.data);
  //       console.log(`Added rolls from ${fileName}. Rolls: ${rolls.length}`)
  //       next()
  //     }
  //   }
  // );

  var files = dir.files(dataPath, { sync:true });
  files.filter(fileName => fileName.endsWith('.json')).forEach((fileName) => {
    wishlist = JSON.parse(fs.readFileSync(fileName));
    rolls = rolls.concat(wishlist.data);
    console.log(`Added rolls from ${fileName}. Rolls: ${rolls.length}`)
  })

  // console.log({ collectDataFiles: files })

  return rolls;
}

// collectData()



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
  else {
    roll.description = "[Hama]";
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


function sortRolls(a, b) {
  if (a.name === b.name){
    return a.hash < b.hash ? -1 : 1
  } else {
    return a.name < b.name ? -1 : 1
  }
}


function massageList() {
  const args = process.argv.slice(2)
  let name = args[0];

  const sourceName = name.endsWith('.json') ? name : `${name}.json`

  // let wishlist;

  // try {
  //   const fileName = path.join(CWD, 'data', sourceName);
  //   console.log(`Converting "${fileName}" to DIM wishlist...`)
  //   wishlist = JSON.parse(fs.readFileSync(fileName));
  // }
  // catch (e) {
  //   console.log(e)
  // }
  let data = collectData();

  // add mapped names and known adepts to wishlist data
  // const { data } = wishlist;
  // wishlist.data = addAdeptRolls(addNamesToRolls(data));
  data = addAdeptRolls(addNamesToRolls(data));

  // sort rolls by name, fallback on hash
  data = data.sort(sortRolls);

  // rename the list according to the original name
  const listName = name.replace('.json', '');
  // wishlist.name = listName;
  const wishlist = { name: listName, description: 'hama-rolls', data }

  // write out the updated little light list
  const outputFilename = path.join(CWD, 'lists', sourceName);
  fs.writeFileSync(outputFilename, JSON.stringify(wishlist));

  // WIP: create dim wishlist
  createDimList(wishlist)
}

// call like: node .\scripts\convert.js "Basic_PvE_Weapons_2022.03.26"
massageList();
