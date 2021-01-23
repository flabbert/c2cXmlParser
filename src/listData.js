const fs = require('fs');
const getBonuses = require('./services/mongodb').getBonuses;
const getProducingBuildings = require('./services/mongodb').getProducingBuildings;

const sortBuildings = (a, b) => {
  if (!a.techGridX) {
    return 0;
  }
  const aint = parseInt(a.techGridX);
  const bint = parseInt(b.techGridX);

  if (aint > bint) {
    return -1;
  }
  if (aint < bint) {
    return 1;
  }
  return 0;
};
getBonuses().then((data) => {
  data.forEach((bonus) => {
    if (bonus.BonusClassType === 'BONUSCLASS_MANUFACTURED') {
      if (bonus) {
        getProducingBuildings(bonus.Type).then((bonusArray) => {
          const [bonusInfo] = bonusArray;
          console.log(bonusInfo);
          const sortedArray = bonusArray.sort(sortBuildings);
          sortedArray.forEach((bonusInfo) => {
            fs.appendFile(
              'ParsedBonusInfo.csv',
              `${bonus.Type},${bonusInfo.Type},${bonusInfo.Module},${bonusInfo.tech},${bonusInfo.techGridX},${bonusInfo.techCost}\n`,
              function (err) {
                if (err) throw err;
                console.log('Saved!');
              }
            );
          });
          const [firstProduction] = sortedArray;
          fs.appendFile(
            'ParsedFirstProduction.csv',
            `${bonus.Type},${bonusInfo.Type},${bonusInfo.Module},${bonusInfo.tech},${bonusInfo.techGridX},${bonusInfo.techCost}\n`,
            function (err) {
              if (err) throw err;
              console.log('Saved!');
            }
          );

          return bonusInfo;
        });
      }
    }
  });
});

getProducingBuildings('BONUS_FIREARMS').then((data) => {});
