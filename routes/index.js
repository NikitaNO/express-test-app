const express = require('express');
const router = express.Router();
const request = require('request-promise-native');
const baseURL = 'https://swapi.co/api';

const sortArrayByKey = (array, key) => {
  if (key === 'name') {
    return array.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  } else if (key === 'mass') {
    return array.sort((a, b) => a.mass - b.mass);
  } else if (key === 'height') {
    return array.sort((a, b) => a.height - b.height);
  } else {
    return array;
  }
};

const getItemPages = (pageArray, itemName) => {
  const allCharacters = [];
  // (!) We use many requests because API doesn't allow us to get all 50 characters by one request
  return Promise.all(pageArray.map(page => {
      return request({ url: `${baseURL}/${itemName}/?page=${page}`, json: true })
          .then(({ results }) => allCharacters.push(...results));
  })).then(() => allCharacters);
};

const getResidentsForPlanet = (({ residents }) => {
  if (residents.length < 1) return [];
  return Promise.all(residents.map(resident => request({ url: resident, json: true }).then(({ name }) => name)));
});

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/character/:name', (req, res) => {
  request({ url: `${baseURL}/people/?search=${req.params.name}`, json: true }).then(({ results }) => {
    res.render('character', { message: false, character: results[0] });
  }).catch(() => {
    res.render('character', { message: 'No data' });
  });
});

router.get('/characters', (req, res) => {
  getItemPages([1, 2, 3, 4, 5], 'people')
      .then(allCharacters => {
        req.query.sort
            ? res.send(sortArrayByKey(allCharacters, req.query.sort ))
            : res.send(allCharacters);
      })
      .catch(() => {
        res.status(400).send('Fetching error');
      });
});

router.get('/planetresidents', (req, res) => {
  const resultPlanets = {};
  const allPlanets = [];
  let page = 1;

  if (req.query.page) page = req.query.page;
  request({ url: `${baseURL}/planets?page=${page}`, json: true })
      .then(({ results: planets }) => {
        allPlanets.push(...planets);
        return Promise.all(planets.map(planet => getResidentsForPlanet(planet)));
      })
      .then(result => {
        allPlanets.forEach((planet, index) => {
          resultPlanets[planet.name] = result[index];
        });
      })
      .then(() => {
        res.send(resultPlanets);
      })
      .catch(() => {
        res.status(400).send('Fetching error');
      });
});

module.exports = router;
