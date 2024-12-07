const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '24h';


const authController = {
  // Register a new user
  register: async (req, res) => {
    try {
      const { email, password, category, aboutUs } = req.body;

      // Check if user already exists
      if (await User.exists({ email })) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password and create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        email,
        password: hashedPassword,
        category,
        aboutUs,
        membersArray: [],
      });
      const jwt = require('jsonwebtoken');
      // Save user to database and create JWT token
      const savedUser = await newUser.save();
      // const token = jwt.sign({ userId: savedUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      const token = jwt.sign({ userId: savedUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: savedUser._id,
          email: savedUser.email,
          category: savedUser.category
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error registering user', error: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Create JWT token
      const token = jwt.sign({ userId: user._id },process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          category: user.category
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  }
};

module.exports = authController;