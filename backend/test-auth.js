const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Load User model
const User = require('./models/User');

// Mock request, response, and next for middleware testing
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const mockNext = () => {
  return (err) => {
    if (err) {
      throw err;
    }
  };
};

async function runTests() {
  console.log('\n==================================================');
  console.log('   RAJM_A_HAL PALACE - AUTHENTICATION TEST SUITE');
  console.log('==================================================\n');
  let mongoConnected = false;
  let mongoServer = null;
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rajmahal';
    console.log(`[Connecting] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('[Connected] MongoDB Connected Successfully.\n');
    mongoConnected = true;
  } catch (error) {
    console.warn(`[Warning] Primary MongoDB connection failed: ${error.message}`);
    console.log(`[Database] Spinning up in-memory MongoDB Server fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      console.log(`[Database] In-memory MongoDB Server running at: ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('[Connected] MongoDB Connected Successfully (In-Memory).\n');
      mongoConnected = true;
    } catch (innerError) {
      console.error(`\x1b[31m[Failed] Connection to MongoDB failed: ${innerError.message}\x1b[0m`);
      process.exit(1);
    }
  }

  const results = {
    userCreation: false,
    passwordHashing: false,
    passwordVerification: false,
    jwtGeneration: false,
    routeProtectionSuccess: false,
    routeProtectionFailure: false
  };

  const testEmail = 'tester@rajmahal.com';
  const rawPassword = 'royalpassword123';

  try {
    // 1. Clean up any existing test user to start fresh
    await User.deleteMany({ email: testEmail });

    // 2. Test MongoDB User Creation & Signup
    console.log('[Test 1/6] Testing User Registration Schema & Creation...');
    const user = await User.create({
      name: 'Test Noble Resident',
      email: testEmail,
      password: rawPassword,
      role: 'customer'
    });

    if (user && user._id) {
      console.log(`  \x1b[32m✔ Success:\x1b[0m User created successfully inside MongoDB (ID: ${user._id})`);
      results.userCreation = true;
    }

    // 3. Test Password Hashing
    console.log('\n[Test 2/6] Testing Bcryptjs Password Hashing...');
    // Retrieve user including password from database to verify hashing
    const dbUser = await User.findOne({ email: testEmail }).select('+password');
    console.log(`  - Original Password String: "${rawPassword}"`);
    console.log(`  - Database Stored String  : "${dbUser.password}"`);

    if (dbUser.password !== rawPassword && dbUser.password.startsWith('$2a$')) {
      console.log('  \x1b[32m✔ Success:\x1b[0m Password was safely hashed using Blowfish Bcrypt salt.');
      results.passwordHashing = true;
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Password remains in raw/unsafe format.');
    }

    // 4. Test Password Verification Logic
    console.log('\n[Test 3/6] Testing Password Verification...');
    const matchCorrect = await dbUser.matchPassword(rawPassword);
    const matchIncorrect = await dbUser.matchPassword('wrongpassword');

    console.log(`  - Verification with correct password: ${matchCorrect}`);
    console.log(`  - Verification with incorrect password: ${matchIncorrect}`);

    if (matchCorrect === true && matchIncorrect === false) {
      console.log('  \x1b[32m✔ Success:\x1b[0m Password comparison matches and fails correctly.');
      results.passwordVerification = true;
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Incorrect verification logic detected.');
    }

    // 5. Test JWT Token Generation
    console.log('\n[Test 4/6] Testing JSON Web Token Generation...');
    const jwtSecret = process.env.JWT_SECRET || 'supersecretkeyrajmahal123';
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });
    console.log(`  - Generated Token String: "${token.substring(0, 35)}..."`);

    const decoded = jwt.verify(token, jwtSecret);
    console.log(`  - Decoded payload ID: ${decoded.id}`);

    if (decoded && decoded.id === user._id.toString()) {
      console.log('  \x1b[32m✔ Success:\x1b[0m Signed JWT token verified and decoded successfully.');
      results.jwtGeneration = true;
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Token validation mismatch.');
    }

    // 6. Test Protected Route Middleware (Success Case)
    console.log('\n[Test 5/6] Testing Protect Middleware (Authorized request)...');
    const { protect } = require('./middleware/authMiddleware');
    
    // Create a mock request with the correct Bearer Token header
    const reqSuccess = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const resSuccess = mockResponse();
    const nextSuccess = mockNext();

    await protect(reqSuccess, resSuccess, nextSuccess);

    if (reqSuccess.user && reqSuccess.user._id.toString() === user._id.toString()) {
      console.log(`  \x1b[32m✔ Success:\x1b[0m Middleware validated token and attached user profile.`);
      console.log(`  - Attached User Name: "${reqSuccess.user.name}"`);
      console.log(`  - Is password field hidden? ${reqSuccess.user.password === undefined ? 'Yes (Secure)' : 'No (Unsafe!)'}`);
      results.routeProtectionSuccess = true;
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Middleware failed to attach user.');
    }

    // 7. Test Protected Route Middleware (Failure Case - Bad Token)
    console.log('\n[Test 6/6] Testing Protect Middleware (Unauthorized request)...');
    const reqFailure = {
      headers: {
        authorization: 'Bearer bad_or_malformed_token_string'
      }
    };
    const resFailure = mockResponse();
    const nextFailure = (err) => {
      if (err) {
        // Expected route
        resFailure.statusCode = 401;
        resFailure.body = { success: false, message: err.message };
      }
    };

    await protect(reqFailure, resFailure, nextFailure);

    if (resFailure.statusCode === 401) {
      console.log(`  \x1b[32m✔ Success:\x1b[0m Malformed tokens correctly blocked with 401 Unauthorized.`);
      console.log(`  - Rejection message: "${resFailure.body.message}"`);
      results.routeProtectionFailure = true;
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Malformed token allowed access.');
    }

    // Clean up tester profile from DB
    await User.deleteMany({ email: testEmail });

  } catch (error) {
    console.error(`\n\x1b[31m✘ Testing Interrupted by uncaught error: ${error.message}\x1b[0m`);
    console.error(error.stack);
  } finally {
    // Close mongoose connection and stop in-memory server if running
    if (mongoConnected) {
      await mongoose.connection.close();
      console.log('\n[Database] Connection to MongoDB closed gracefully.');
    }
    if (mongoServer) {
      await mongoServer.stop();
      console.log('[Database] In-memory MongoDB Server stopped.');
    }

    // Print Final Concise Report Card
    console.log('\n==================================================');
    console.log('                FINAL REPORT CARD');
    console.log('==================================================');
    console.log(`1. User Creation inside DB      : ${results.userCreation ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`2. Password Encryption (Bcrypt)  : ${results.passwordHashing ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`3. Password Match Comparisons    : ${results.passwordVerification ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`4. JWT Security Token Signing    : ${results.jwtGeneration ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`5. JWT Validation Middleware    : ${results.routeProtectionSuccess ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`6. Unauthorized Access Rejection : ${results.routeProtectionFailure ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log('==================================================\n');
  }

}

runTests();
