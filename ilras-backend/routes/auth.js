const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User'); // Import the User model we just made
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google-login', async (req, res) => {
  const { token, role } = req.body; // Token and Role sent from Frontend
  console.log('Received login request with token:', token ? 'Token exists' : 'No token');

  try {
    // 1. Fetch user info from Google using the provided access token via google-auth-library
    client.setCredentials({ access_token: token });
    const response = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    // 2. Get User Info from the response
    const userData = response.data;
    console.log('Google User Info Received:', userData.email);
    const { name, email, picture, sub } = userData;

    // 3. Check if user already exists in our MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      // 4. If NEW user, create them
      user = new User({
        name,
        email,
        picture,
        googleId: sub,
        role: role || 'student', // Use provided role or default
      });
      await user.save();
      console.log('✨ New User Created and Saved to MongoDB:', name);
    } else {
      console.log('✅ Existing User Found in MongoDB:', name);
      if (user.isBlocked) {
        return res.status(403).json({ success: false, message: 'Your account has been blocked by the administrator.' });
      }
    }

    // 5. Create a Session Token (JWT) for our app
    const sessionToken = jwt.sign(
      { _id: user._id, name: user.name, email: user.email, role: user.role, picture: user.picture },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Session lasts 7 days
    );

    // 6. Send success response
    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      },
      token: sessionToken
    });

  } catch (error) {
    console.error('Auth Error:', error);
    res.status(400).json({ success: false, message: 'Invalid Google Token' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { _id: user._id, name: user.name, email: user.email, role: user.role, picture: user.picture },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
      },
      token
    });
  } catch (error) {
    console.error('Register Error Stack:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // 1.5 Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by the administrator.' });
    }

    // 2. If user registered via Google, they might not have a password
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Please login with Google.' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // 4. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP and save it
    user.loginOtp = crypto.createHash('sha256').update(otp).digest('hex');
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // 5. Send Email
    const message = `Your ILRAS Login OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Please do not share it with anyone.`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your ILRAS Login OTP',
        message
      });
      console.log(`OTP sent to ${user.email} (Testing: ${otp})`);
      res.json({ success: true, requireOtp: true, message: 'OTP sent to email. Please verify.' });
    } catch (err) {
      console.log('Error sending OTP email:', err);
      user.loginOtp = undefined;
      user.loginOtpExpire = undefined;
      await user.save();
      // For local development fallback if SMTP isn't configured right
      res.json({ success: true, requireOtp: true, message: 'Email sending failed, but console logged the OTP for dev.' });
    }

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      loginOtp: hashedOtp,
      loginOtpExpire: { $gt: Date.now() } // Ensure OTP hasn't expired
    }).select('+loginOtp +loginOtpExpire'); // Need to explicitly select since they are select:false in schema

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    await user.save();

    // Create session token (JWT)
    const token = jwt.sign(
      { _id: user._id, name: user.name, email: user.email, role: user.role, picture: user.picture },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
      },
      token
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying OTP' });
  }
});

// POST /api/auth/github-login
router.post('/github-login', async (req, res) => {
  const { code, role } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'GitHub code is required' });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Invalid GitHub code', details: tokenData });
    }

    // 2. Fetch User Profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const githubUser = await userResponse.json();

    // 3. Fetch User Emails (primary email might be private)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const emails = await emailResponse.json();
    
    // Find primary email
    const primaryEmailObj = emails.find(e => e.primary) || emails[0];
    const email = primaryEmailObj ? primaryEmailObj.email : null;

    if (!email) {
      return res.status(400).json({ success: false, message: 'No public email found in GitHub account.' });
    }

    // 4. Find or Create User
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: githubUser.name || githubUser.login,
        email,
        picture: githubUser.avatar_url,
        githubId: githubUser.id,
        role: role || 'student',
      });
      await user.save();
      console.log('✨ New User Created from GitHub:', user.name);
    } else {
      console.log('✅ Existing User Found from GitHub:', user.name);
      if (user.isBlocked) {
        return res.status(403).json({ success: false, message: 'Your account has been blocked by the administrator.' });
      }
    }

    // 5. Create Token
    const sessionToken = jwt.sign(
      { _id: user._id, name: user.name, email: user.email, role: user.role, picture: user.picture },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      },
      token: sessionToken
    });

  } catch (error) {
    console.error('GitHub Auth Error:', error);
    res.status(500).json({ success: false, message: 'Failed to authenticate with GitHub' });
  }
});

// POST /api/auth/seed-admin
router.post('/seed-admin', async (req, res) => {
  try {
    const email = 'haranhari4518@gmail.com';
    let user = await User.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin12345", salt);
    
    if (!user) {
      user = new User({
        name: 'Hariharan (Super Admin)',
        email,
        password: hashedPassword,
        role: 'admin'
      });
      await user.save();
      console.log('✨ Super Admin Seeded');
      return res.json({ message: "Admin account seeded successfully" });
    } else {
      user.password = hashedPassword;
      user.role = 'admin';
      await user.save();
      console.log('🔄 Super Admin Updated');
      return res.json({ message: "Admin account updated successfully" });
    }
  } catch (error) {
    console.error('Seed Admin Error:', error);
    res.status(500).json({ message: "Server error during seeding" });
  }
});
// POST /api/auth/forgotpassword
router.post('/forgotpassword', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    if (!user.password && user.googleId) {
       return res.status(400).json({ success: false, message: 'You logged in using Google. Please continue using Google to sign in.' });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset url (we assume frontend is running on localhost:5173 for local dev)
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested a password reset for your ILRAS account.\n\nPlease make a put request to: \n\n${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message
      });
      console.log(`Reset URL for ${user.email}: ${resetUrl}`);
      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.log(err);
      console.log(`Fallback - Reset URL for ${user.email}: ${resetUrl}`); // For local testing if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      // If SMTP fails, we still return success=true for testing in dev.
      // Typically we'd return 500 but we want the user to be able to use the link from terminal.
      res.status(200).json({ success: true, data: 'Email sending failed, but link printed to console.' });
    }
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/auth/resetpassword/:token
router.put('/resetpassword/:token', async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token or token has expired' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Clear reset token and expire
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;