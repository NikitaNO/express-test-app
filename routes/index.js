const express = require('express');
const router = express.Router();
const request = require('request');

router.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

module.exports = router;
