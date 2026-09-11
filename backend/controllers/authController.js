const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * Helper utility to sign JWT tokens.
 * @param {String} id The user record database ID
 * @returns {String} Signed JWT token string
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * @desc    Register a new user account (with email verification)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    // 1. Validate inputs
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    // 3. Create user (isVerified is true in development mode for testing ease)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      isVerified: process.env.NODE_ENV === 'development' ? true : false,
    });

    // 4. Generate verification token
    const verifyToken = user.getVerificationToken();

    // 5. Save verification parameters (skips validate pre-save hooks to prevent password double-hash)
    await user.save({ validateBeforeSave: false });

    // 6. Construct Verification Link
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verifyToken}`;

    // 7. Compose highly-polished luxury HTML email body
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Georgia', serif;
            background-color: #050505;
            color: #FFFFF0;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .email-wrapper {
            width: 100%;
            background-color: #050505;
            padding: 40px 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0d0d0d;
            border: 1px solid #D4AF37;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          }
          .email-header {
            background-color: #1f010a; /* Royal Maroon */
            border-bottom: 1px solid #D4AF37;
            padding: 40px 20px;
            text-align: center;
          }
          .logo {
            font-size: 28px;
            color: #D4AF37; /* Royal Gold */
            letter-spacing: 0.25em;
            font-weight: 700;
            margin: 0;
            text-transform: uppercase;
          }
          .tagline {
            font-size: 11px;
            color: #FFFFF0;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-top: 5px;
            opacity: 0.8;
          }
          .email-body {
            padding: 40px 30px;
            text-align: center;
            line-height: 1.8;
          }
          .greeting {
            font-size: 22px;
            color: #D4AF37;
            margin-bottom: 20px;
          }
          .message {
            font-size: 15px;
            color: #FFFFF0;
            margin-bottom: 35px;
            opacity: 0.95;
          }
          .btn-gold {
            display: inline-block;
            background: linear-gradient(135deg, #b38728 0%, #fbf5b7 50%, #aa771c 100%);
            color: #050505 !important;
            text-decoration: none !important;
            padding: 15px 35px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            border-radius: 2px;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            margin-bottom: 35px;
          }
          .expiry-warning {
            font-size: 12px;
            color: #b5b5b5;
            margin-top: 20px;
          }
          .email-footer {
            background-color: #050505;
            border-top: 1px solid rgba(212, 175, 55, 0.1);
            padding: 30px 20px;
            text-align: center;
            font-size: 11px;
            color: #b5b5b5;
            letter-spacing: 0.05em;
          }
          .footer-divider {
            width: 50px;
            height: 1px;
            background-color: #D4AF37;
            margin: 15px auto;
            opacity: 0.5;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1 class="logo">RAJM<span style="color:#FFFFF0;">A</span>HAL</h1>
              <div class="tagline">Timeless Majesty &bull; Jaipur</div>
            </div>
            <div class="email-body">
              <h2 class="greeting">Pranam, ${name}!</h2>
              <p class="message">
                Thank you for registering at RajMahal Palace & Resorts. To commence your royal experience and verify your stay, please confirm your email address by clicking the luxury portal button below.
              </p>
              <a href="${verifyUrl}" class="btn-gold" target="_blank">Verify Account</a>
              <p class="expiry-warning">
                This verification portal invitation is private and will expire in 24 hours.
              </p>
            </div>
            <div class="email-footer">
              <p>RajMahal Palace, Palace Road, Jaipur, Rajasthan, 302001, India</p>
              <div class="footer-divider"></div>
              <p>&copy; 2026 RajMahal Palace & Resorts. All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // 8. Try sending verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Begin Your Royal Stay - Confirm Your RajMahal Account',
        message: `Welcome to RajMahal, ${user.name}! Please copy and paste this link in your browser to verify your email address: ${verifyUrl}`,
        html: emailHtml,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully! Please check your email inbox to verify your account.',
      });
    } catch (emailError) {
      console.error(`[Email Error] Failed to send verification email: ${emailError.message}`);
      
      // Rollback database token fields if email fails
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });

      // In development mode, bypass email error gracefully since auto-verification is enabled!
      if (process.env.NODE_ENV === 'development') {
        return res.status(201).json({
          success: true,
          message: 'Account registered successfully! (Email verification bypassed in development mode)',
        });
      }

      res.status(500);
      throw new Error('Registration completed but verification email could not be sent. Please contact support.');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify user email using token
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    // 1. Hash incoming url token using SHA-256 to compare with DB value
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2. Query DB for matching unexpired token
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() },
    });

    // Determine if client expects HTML (browser click) or JSON
    const expectsHtml = req.headers.accept && req.headers.accept.includes('text/html');

    // 3. Handle expired or invalid token
    if (!user) {
      if (expectsHtml) {
        return res.status(400).send(getStyledVerificationTemplate({
          success: false,
          title: 'Verification Expired',
          message: 'This security portal invitation has expired or is invalid. Please request a new verification link.',
        }));
      } else {
        res.status(400);
        throw new Error('Verification token is invalid or has expired.');
      }
    }

    // 4. Update verification flags
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // 5. Send highly-polished HTML confirmation landing page or JSON response
    if (expectsHtml) {
      res.status(200).send(getStyledVerificationTemplate({
        success: true,
        title: 'Account Verified',
        message: `Pranam, ${user.name}! Your account has been verified. You may now close this page and log in.`,
      }));
    } else {
      res.status(200).json({
        success: true,
        message: 'Your email address has been successfully verified! You may now login.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token (Login with Verification constraint)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Validate inputs
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // 2. Find user. Explicitly select password field since it is omitted by default
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password credentials');
    }

    // 3. Match passwords using schema custom instance method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password credentials');
    }

    // 4. Guard: Enforce verified email address constraint
    if (!user.isVerified) {
      res.status(403);
      throw new Error('Your email address has not been verified yet. Please check your inbox for verification link.');
    }

    // 5. Return user profile and signed JWT token
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user's profile info
 * @route   GET /api/auth/profile
 * @access  Private (Protected)
 */
const getUserProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(404);
      throw new Error('User account not found');
    }

    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper template to render gorgeous royal branded landing pages for verified users.
 */
function getStyledVerificationTemplate({ success, title, message }) {
  const brandColor = success ? '#1f010a' : '#220000';
  const icon = success ? '✔' : '✘';
  const iconColor = success ? '#D4AF37' : '#ff4444';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} | RajMahal Palace</title>
      <style>
        body {
          font-family: 'Georgia', serif;
          background-color: #050505;
          color: #FFFFF0;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .card {
          background-color: #0d0d0d;
          border: 1px solid #D4AF37;
          box-shadow: 0 15px 40px rgba(0,0,0,0.9);
          border-radius: 4px;
          max-width: 480px;
          width: 90%;
          text-align: center;
          overflow: hidden;
        }
        .header {
          background-color: ${brandColor};
          padding: 30px;
          border-bottom: 1px solid #D4AF37;
        }
        .logo {
          font-size: 24px;
          color: #D4AF37;
          letter-spacing: 0.2em;
          margin: 0;
          text-transform: uppercase;
        }
        .content {
          padding: 40px 30px;
        }
        .icon-wrap {
          font-size: 50px;
          color: ${iconColor};
          margin-bottom: 15px;
          text-shadow: 0 0 15px rgba(212,175,55,0.4);
        }
        h2 {
          font-size: 22px;
          color: #D4AF37;
          margin: 0 0 15px 0;
          letter-spacing: 0.05em;
        }
        p {
          font-size: 15px;
          line-height: 1.6;
          color: #FFFFF0;
          opacity: 0.9;
          margin: 0;
        }
        .footer {
          padding: 20px;
          font-size: 11px;
          color: #b5b5b5;
          letter-spacing: 0.05em;
          border-top: 1px solid rgba(212,175,55,0.05);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo">RAJM<span>A</span>HAL</h1>
        </div>
        <div class="content">
          <div class="icon-wrap">${icon}</div>
          <h2>${title}</h2>
          <p>${message}</p>
        </div>
        <div class="footer">
          &copy; 2026 RajMahal Palace & Resorts. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  getUserProfile,
};
