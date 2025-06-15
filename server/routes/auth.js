const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const fixedUser = { username: 'reviewer', password: 'password123' };

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === fixedUser.username && password === fixedUser.password) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '48h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

module.exports = router;