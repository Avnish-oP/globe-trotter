const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  sanitizeUser,
  generateRandomToken 
} = require('../utils/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validatePasswordChange,
  validatePasswordReset 
} = require('../utils/validation');
const { auth } = require('../middleware/auth'); // Use the same auth middleware as sections
const { asyncHandler } = require('../utils/errorHandler');
const { upload, uploadImage, deleteImage, extractPublicId } = require('../utils/cloudinary');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
  console.log('📝 Registration request received:', JSON.stringify(req.body, null, 2));
  
  const {
    name,
    email,
    password,
    country_origin,
    fav_activities = [],
    fav_places = [],
    travel_style,
    preferred_currency = 'USD',
    travel_experience_level = 'beginner',
    profile_picture_url
  } = req.body;

  // Check if user already exists
  const existingUser = await query(
    'SELECT user_id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create new user
  const newUser = await query(`
    INSERT INTO users (
      name, email, password_hash, country_origin, 
      fav_activities, fav_places, travel_style,
      preferred_currency, travel_experience_level, profile_picture_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING user_id, name, email, country_origin, 
             fav_activities, fav_places, travel_style,
             preferred_currency, travel_experience_level,
             profile_picture_url, created_at
  `, [
    name, email, hashedPassword, country_origin,
    fav_activities, fav_places, travel_style,
    preferred_currency, travel_experience_level, profile_picture_url
  ]);

  const user = newUser.rows[0];

  // Generate JWT token
  const token = generateToken({
    userId: user.user_id,
    email: user.email
  });

  // Update last login
  await query(
    'UPDATE users SET last_login = NOW() WHERE user_id = $1',
    [user.user_id]
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: sanitizeUser(user),
      token
    }
  });
}));

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const userResult = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const user = userResult.rows[0];

  // Check if account is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.user_id,
    email: user.email
  });

  // Update last login
  await query(
    'UPDATE users SET last_login = NOW() WHERE user_id = $1',
    [user.user_id]
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: sanitizeUser(user),
      token
    }
  });
}));

/**
 * @route GET /api/auth/me
 * @desc Get current user info - Simple version
 * @access Private
 */
router.get('/me', (req, res) => {
  // For now, return a mock user to test the frontend
  res.json({
    success: true,
    data: {
      user: {
        user_id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }
    }
  });
});

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const userResult = await query(
    'SELECT * FROM users WHERE user_id = $1',
    [req.user.user_id] // Fixed to use user_id
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: sanitizeUser(userResult.rows[0])
    }
  });
}));

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', auth, asyncHandler(async (req, res) => {
  const {
    name,
    bio,
    country_origin,
    phone_number,
    date_of_birth,
    fav_activities,
    fav_places,
    travel_style,
    preferred_currency,
    travel_experience_level,
    notification_preferences,
    privacy_settings,
    profile_picture_url
  } = req.body;

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  const addField = (field, value) => {
    if (value !== undefined) {
      updateFields.push(`${field} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  };

  addField('name', name);
  addField('bio', bio);
  addField('country_origin', country_origin);
  addField('phone_number', phone_number);
  addField('date_of_birth', date_of_birth);
  addField('fav_activities', fav_activities);
  addField('fav_places', fav_places);
  addField('travel_style', travel_style);
  addField('preferred_currency', preferred_currency);
  addField('travel_experience_level', travel_experience_level);
  addField('notification_preferences', JSON.stringify(notification_preferences));
  addField('privacy_settings', JSON.stringify(privacy_settings));
  addField('profile_picture_url', profile_picture_url);
  addField('updated_at', new Date());

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update'
    });
  }

  values.push(req.user.userId);

  const updateQuery = `
    UPDATE users 
    SET ${updateFields.join(', ')} 
    WHERE user_id = $${paramCount}
    RETURNING *
  `;

  const result = await query(updateQuery, values);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: sanitizeUser(result.rows[0])
    }
  });
}));

/**
 * @route POST /api/auth/upload-profile-picture
 * @desc Upload profile picture to Cloudinary
 * @access Private
 */
router.post('/upload-profile-picture', auth, upload.single('profilePicture'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get the current user to check for existing profile picture
    const userResult = await query(
      'SELECT profile_picture_url FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    const currentUser = userResult.rows[0];

    // Delete old profile picture if it exists
    if (currentUser && currentUser.profile_picture_url) {
      try {
        const publicId = extractPublicId(currentUser.profile_picture_url);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (deleteError) {
        console.warn('Warning: Could not delete old profile picture:', deleteError.message);
        // Continue with upload even if deletion fails
      }
    }

    // Update user's profile_picture_url in database
    const updatedUser = await query(`
      UPDATE users 
      SET profile_picture_url = $1, updated_at = NOW() 
      WHERE user_id = $2
      RETURNING *
    `, [req.file.path, req.user.userId]);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profile_picture_url: req.file.path,
        user: sanitizeUser(updatedUser.rows[0])
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
}));

/**
 * @route DELETE /api/auth/delete-profile-picture
 * @desc Delete profile picture from Cloudinary and database
 * @access Private
 */
router.delete('/delete-profile-picture', auth, asyncHandler(async (req, res) => {
  // Get the current user's profile picture URL
  const userResult = await query(
    'SELECT profile_picture_url FROM users WHERE user_id = $1',
    [req.user.userId]
  );

  const user = userResult.rows[0];

  if (!user || !user.profile_picture_url) {
    return res.status(404).json({
      success: false,
      message: 'No profile picture found'
    });
  }

  try {
    // Delete from Cloudinary
    const publicId = extractPublicId(user.profile_picture_url);
    if (publicId) {
      await deleteImage(publicId);
    }

    // Remove from database
    const updatedUser = await query(`
      UPDATE users 
      SET profile_picture_url = NULL, updated_at = NOW() 
      WHERE user_id = $1
      RETURNING *
    `, [req.user.userId]);

    res.json({
      success: true,
      message: 'Profile picture deleted successfully',
      data: {
        user: sanitizeUser(updatedUser.rows[0])
      }
    });

  } catch (error) {
    console.error('Profile picture deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture'
    });
  }
}));

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', auth, validatePasswordChange, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get current user with password
  const userResult = await query(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [req.user.userId]
  );

  const user = userResult.rows[0];

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const newHashedPassword = await hashPassword(newPassword);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
    [newHashedPassword, req.user.userId]
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', validatePasswordReset, asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const userResult = await query(
    'SELECT user_id, name FROM users WHERE email = $1',
    [email]
  );

  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: 'If an account with this email exists, you will receive a password reset link'
  });

  if (userResult.rows.length > 0) {
    // Generate reset token (in a real app, you'd send this via email)
    const resetToken = generateRandomToken();
    
    // Store reset token in database (you'd need to add a reset_token field to users table)
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE user_id = $3',
      [resetToken, new Date(Date.now() + 3600000), userResult.rows[0].user_id] // 1 hour expiry
    );

    // In a real application, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }
}));

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Private
 */
router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route DELETE /api/auth/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account', auth, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required to delete account'
    });
  }

  // Get user password hash
  const userResult = await query(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [req.user.userId]
  );

  const user = userResult.rows[0];

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Incorrect password'
    });
  }

  // Soft delete - deactivate account
  await query(
    'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1',
    [req.user.userId]
  );

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

module.exports = router;
