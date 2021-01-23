const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB;
const client = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true });

const connection = client.connect();

const addBonus = (bonuses) => {
  connection
    .then(() => {
      const db = client.db('caveman2cosmos');
      db.collection('Bonuses')
        .insertMany(bonuses)
        .catch((insertErr) => {
          console.log('error happened');
        });
    })
    .catch((err) => {
      console.log(err);
    });
};
const addBuilding = (buildings) => {
  connection
    .then(() => {
      const db = client.db('caveman2cosmos');
      db.collection('Buildings')
        .insertMany(buildings)
        .then(() => {
          console.log(buildings, 'inserted');
        })
        .catch((insertErr) => {
          console.log('error happened');
        });
    })
    .catch((err) => {
      console.log(err);
    });
};
const addSpecialBuilding = (specialBuildings) => {
  connection
    .then(() => {
      const db = client.db('caveman2cosmos');
      db.collection('SpecialBuildings')
        .insertMany(specialBuildings)
        .then(() => {
          console.log(specialBuildings, 'inserted');
        })
        .catch((insertErr) => {
          console.log('error happened');
        });
    })
    .catch((err) => {
      console.log(err);
    });
};
const addTech = (techs) => {
  connection
    .then(() => {
      const db = client.db('caveman2cosmos');
      db.collection('Techs')
        .insertMany(techs)
        .catch((insertErr) => {
          console.log('error happened');
        });
    })
    .catch((err) => {
      console.log(err);
    });
};
const getBonuses = () => {
  return new Promise((resolve, reject) => {
    connection.then(() => {
      const db = client.db('caveman2cosmos');
      return db
        .collection('Bonuses')
        .find({})
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  });
};
const getProducingBuildings = (Bonus) => {
  return new Promise((resolve) => {
    connection.then(() => {
      const db = client.db('caveman2cosmos');
      db.collection('Buildings')
        .find({ bonuses: { $elemMatch: { type: Bonus } } })
        .toArray()
        .then((data) => {
          const BonusInfo = data.map((d) => {
            return getTech(d.PrereqTech).then((tech) => {
              return {
                Type: d.Type,
                Module: d.module,
                tech: tech ? tech.Type : d.PrereqTech,
                techGridX: tech ? tech.iGridX : null,
                techCost: tech ? tech.iCost : null,
              };
            });
          });
          Promise.all(BonusInfo).then((data) => {
            resolve(data);
          });
        });
    });
  });
};
const getTech = (tech) => {
  return new Promise((resolve, reject) => {
    connection.then(() => {
      const db = client.db('caveman2cosmos');
      db.collection('Techs')
        .findOne({ Type: tech })
        .then((data) => {
          resolve(data);
        });
    });
  });
};
const disconnect = () => {
  console.log('disconnecting');
  client.close();
  return;
};

module.exports = {
  addBuilding,
  addBonus,
  getBonuses,
  addTech,
  addSpecialBuilding,
  getProducingBuildings,
  disconnect,
};
