require('dotenv').config();
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const addBonus = require('./services/mongodb').addBonus;
const addBuilding = require('./services/mongodb').addBuilding;
const addSpecialBuilding = require('./services/mongodb').addSpecialBuilding;
const addTech = require('./services/mongodb').addTech;

const disconnect = require('./services/mongodb').disconnect;
const walk = require('./folderWalk').walk;

const parser = new xml2js.Parser();

const parseBonusInfo = (data) => {
  parser.parseString(data, function (err, result) {
    const { Civ4BonusInfos } = result;
    console.log(Civ4BonusInfos);
    if (!Civ4BonusInfos) return;
    const { BonusInfos } = Civ4BonusInfos;
    const Bonuses = BonusInfos[0].BonusInfo;
    const bonuses = [];
    Bonuses.forEach((b) => {
      const keys = Object.keys(b);
      const databaseBonus = {};
      keys.forEach((k) => {
        if (b[k].length === 1) {
          databaseBonus[k] = b[k][0];
        }
      });
      bonuses.push(databaseBonus);
    });
    addBonus(bonuses);
    console.log('Done');
    return;
  });
};
const parseBonuses = (element) => {
  const bonuses = [];
  const freeBonus = element['FreeBonus'] ? parseFreeBonus(element['FreeBonus'][0], element['iNumFreeBonuses'][0]) : null;
  delete element['FreeBonus'];
  const freeBonusArray = element['ExtraFreeBonuses'] ? parseExtraFreeBonus(element['ExtraFreeBonuses']) : null;
  delete element['ExtraFreeBonuses'];
  if (freeBonus) {
    bonuses.push(freeBonus);
  }
  if (freeBonusArray) {
    freeBonusArray.forEach((fba) => {
      bonuses.push(fba);
    });
  }
  if (bonuses.length > 0) {
    return bonuses;
  }
  return null;
};
const parseExtraFreeBonus = (element) => {
  const bonuses = [];
  const { ExtraFreeBonus } = element[0];
  ExtraFreeBonus.forEach((efb) => {
    bonuses.push(parseFreeBonus(efb['FreeBonus'][0], efb['iNumFreeBonuses'][0]));
  });
  return bonuses;
};
const parseFreeBonus = (bonus, amount) => {
  return {
    type: bonus,
    amount,
  };
};
const parseSpecialBuildingInfo = (data, folderObject) => {
  parser.parseString(data, (err, result) => {
    const { Civ4SpecialBuildingInfos } = result;
    const { SpecialBuildingInfos } = Civ4SpecialBuildingInfos;
    const Buildings = SpecialBuildingInfos[0].SpecialBuildingInfo;
    const buildings = [];
    Buildings.forEach((b) => {
      const databaseBuilding = {};
      databaseBuilding.module = folderObject.module;
      let keys = Object.keys(b);
      keys.forEach((k) => {
        if (b[k].length === 1) {
          databaseBuilding[k] = b[k][0];
        }
      });
      buildings.push(databaseBuilding);
    });
    addSpecialBuilding(buildings);
  });
};
const parseBuildingInfo = (data, folderObject) => {
  parser.parseString(data, (err, result) => {
    const { Civ4BuildingInfos } = result;
    const { BuildingInfos } = Civ4BuildingInfos;
    const Buildings = BuildingInfos[0].BuildingInfo;
    const buildings = [];
    Buildings.forEach((b) => {
      const databaseBuilding = {};
      databaseBuilding.module = folderObject.module;
      databaseBuilding.bonuses = parseBonuses(b);
      let keys = Object.keys(b);
      keys.forEach((k) => {
        if (b[k].length === 1) {
          databaseBuilding[k] = b[k][0];
        }
      });
      buildings.push(databaseBuilding);
    });
    addBuilding(buildings);
  });
};
const parseTechInfo = (data) => {
  parser.parseString(data, (err, result) => {
    const { Civ4TechInfos } = result;
    const { TechInfos } = Civ4TechInfos;
    const Techs = TechInfos[0].TechInfo;
    const techs = [];
    Techs.forEach((b) => {
      const keys = Object.keys(b);
      const databaseTech = {};
      keys.forEach((k) => {
        if (b[k].length === 1) {
          databaseTech[k] = b[k][0];
        }
      });
      techs.push(databaseTech);
    });
    addTech(techs);
    return;
  });
};

const convertXml = (folderObject, type) => {
  fs.readFile(folderObject.fullPath, (err, data) => {
    switch (type) {
      case 'TECH':
        parseTechInfo(data, folderObject);
        break;
      case 'BUILDING':
        parseBuildingInfo(data, folderObject);
        break;
      case 'SPECIALBUILDING':
        parseSpecialBuildingInfo(data, folderObject);
      case 'BONUS':
        parseBonusInfo(data, folderObject);
        break;
      default:
        break;
    }
  });
};

walk(`C:${path.sep}code${path.sep}caveman2cosmos${path.sep}Assets${path.sep}`, (err, data) => {
  const BuildingInfosFileNames = [];
  const BonusInfosFileNames = [];
  const TechInfosFileNames = [];
  const SpecialBuildingInfosFileNames = [];
  data.forEach((d) => {
    const folderArray = d.split('\\');
    const folderObject = {
      fileName: folderArray.pop(),
      module: folderArray.pop(),
      fullPath: d,
    };
    if (folderObject.fileName.includes('CIV4BuildingInfos.xml')) {
      BuildingInfosFileNames.push(folderObject);
      convertXml(folderObject, 'BUILDING');
      fs.writeFile('BuildingInfos.json', JSON.stringify(BuildingInfosFileNames), () => {});
    }
    if (folderObject.fileName.includes('CIV4TechInfos.xml')) {
      TechInfosFileNames.push(folderObject);
      convertXml(folderObject, 'TECH');
      fs.writeFile('TechInfosFileNames.json', JSON.stringify(TechInfosFileNames), () => {});
    }
    if (folderObject.fileName.includes('CIV4BonusInfos.xml')) {
      BonusInfosFileNames.push(folderObject);
      convertXml(folderObject, 'BONUS');
      fs.writeFile('BonusInfosFileNames.json', JSON.stringify(BonusInfosFileNames), () => {});
    }
    if (folderObject.fileName.includes('CIV4SpecialBuildingInfos.xml')) {
      SpecialBuildingInfosFileNames.push(folderObject);
      convertXml(folderObject, 'SPECIALBUILDING');
      fs.writeFile('SpecialBuildingInfosFileNames.json', JSON.stringify(SpecialBuildingInfosFileNames), () => {});
    }
  });
});
//convertXml(`C:${path.sep}code${path.sep}caveman2cosmos${path.sep}Assets${path.sep}XML${path.sep}Buildings${path.sep}CIV4DerpBuilding.xml`, 'BUILDING');
