const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Load models
const User = require('./models/User');
const Room = require('./models/Room');
const Booking = require('./models/Booking');

// Mock request, response, and next for controller testing
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

const mockNext = (res) => {
  return (err) => {
    if (err) {
      res.statusCode = res.statusCode || 500;
      res.body = { success: false, message: err.message };
    }
  };
};

async function runTests() {
  console.log('\n================================================================');
  console.log('   RAJM_A_HAL PALACE - ROOMS & BOOKING MANAGEMENT TEST SUITE');
  console.log('================================================================\n');

  let mongoConnected = false;
  let mongoServer = null;
  try {
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
    roomSeeding: false,
    initialAvailability: false,
    bookingCreation: false,
    availabilityUpdate: false,
    doubleBookingPrevention: false,
    bookingHistory: false,
    bookingCancellation: false,
    nonOverlappingSuccess: false,
  };

  const testEmail = 'royal_tester@rajmahal.com';
  let testUser = null;
  let testRoom = null;
  let activeBookingId = null;

  try {
    // 1. Clean up existing test data to run in a sandboxed, repeatable state
    await User.deleteMany({ email: testEmail });
    
    // Create test user
    testUser = await User.create({
      name: 'Maharaja Test Booker',
      email: testEmail,
      password: 'royalpassword123',
      role: 'customer',
      isVerified: true,
    });

    // 2. Test 1: Room Seeding and Verification
    console.log('[Test 1/8] Verifying Room Database & Auto-Seeding...');
    // Clear room database if it is a fresh test run, but let's keep it safe.
    // Let's run seedRooms to guarantee we have rooms
    const seedRooms = require('./utils/seedRooms');
    await seedRooms();

    const roomsCount = await Room.countDocuments();
    console.log(`  - Total rooms found in DB: ${roomsCount}`);
    
    if (roomsCount >= 6) {
      console.log('  \x1b[32m✔ Success:\x1b[0m Room database is populated with RajMahal luxury suites.');
      results.roomSeeding = true;
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Room database is incomplete.');
    }

    // Select a room for test bookings
    testRoom = await Room.findOne({ roomNumber: 'R-101' }); // Peacock Heritage Chamber
    if (!testRoom) {
      testRoom = await Room.findOne();
    }
    console.log(`  - Selected room for test bookings: "${testRoom.name}" (Rate: ₹${testRoom.pricePerNight}/night)`);

    // Clean up any old booking of this room by this user
    await Booking.deleteMany({ user: testUser._id });

    // 3. Test 2: Initial Room Availability Check
    console.log('\n[Test 2/8] Testing Initial Room Availability...');
    const { checkAvailability } = require('./controllers/roomController');

    // Create dates in local timezone to avoid UTC mismatch causing "date in the past" errors
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const tYear = tomorrow.getFullYear();
    const tMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tDay = String(tomorrow.getDate()).padStart(2, '0');
    const dayAfterTomorrowStr = `${tYear}-${tMonth}-${tDay}`;


    let req = {
      query: {
        checkIn: todayStr,
        checkOut: dayAfterTomorrowStr,
      },
    };
    let res = mockResponse();
    let next = mockNext(res);

    await checkAvailability(req, res, next);

    if (res.statusCode !== 500 && res.body && res.body.success) {
      const isRoomListed = res.body.data.some(r => r._id.toString() === testRoom._id.toString());
      console.log(`  - Total available rooms listed for range (${todayStr} to ${dayAfterTomorrowStr}): ${res.body.count}`);
      console.log(`  - Is test room "${testRoom.name}" available? ${isRoomListed ? 'Yes' : 'No'}`);

      if (isRoomListed) {
        console.log('  \x1b[32m✔ Success:\x1b[0m Initial availability successfully verified.');
        results.initialAvailability = true;
      } else {
        console.log('  \x1b[31m✘ Failed:\x1b[0m Test room was not listed in available rooms.');
      }
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Availability controller threw an error:', res.body.message);
    }

    // 4. Test 3: Booking Creation
    console.log('\n[Test 3/8] Testing Booking Creation & Total Price Calculation...');
    const { createBooking } = require('./controllers/bookingController');

    req = {
      user: testUser,
      body: {
        roomId: testRoom._id.toString(),
        checkIn: todayStr,
        checkOut: dayAfterTomorrowStr,
        guests: { adults: 2, children: 0 },
        specialRequests: 'Feather pillows and welcome rose water, please.',
      },
    };
    res = mockResponse();
    next = mockNext(res);

    await createBooking(req, res, next);

    if (res.statusCode === 201 && res.body && res.body.success) {
      activeBookingId = res.body.data._id;
      const calculatedPrice = res.body.data.totalPrice;
      const expectedPrice = testRoom.pricePerNight * 2; // 2 nights

      console.log(`  - Booking Created with ID: ${activeBookingId}`);
      console.log(`  - Calculated Total Price: ₹${calculatedPrice}`);
      console.log(`  - Expected Total Price  : ₹${expectedPrice}`);

      if (calculatedPrice === expectedPrice && res.body.data.status === 'confirmed') {
        console.log('  \x1b[32m✔ Success:\x1b[0m Booking created and confirmed with correct price calculation.');
        results.bookingCreation = true;
      } else {
        console.log('  \x1b[31m✘ Failed:\x1b[0m Incorrect price calculation or booking status.');
      }
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Booking controller threw an error:', res.body ? res.body.message : 'Unknown');
    }

    // 5. Test 4: Availability Update (Verifying Room is no longer available on those dates)
    console.log('\n[Test 4/8] Testing Room Availability Update (Overlap check)...');
    req = {
      query: {
        checkIn: todayStr,
        checkOut: dayAfterTomorrowStr,
      },
    };
    res = mockResponse();
    next = mockNext(res);

    await checkAvailability(req, res, next);

    if (res.statusCode !== 500 && res.body && res.body.success) {
      const isRoomStillListed = res.body.data.some(r => r._id.toString() === testRoom._id.toString());
      console.log(`  - Available rooms count: ${res.body.count}`);
      console.log(`  - Is test room "${testRoom.name}" still listed as available? ${isRoomStillListed ? 'Yes' : 'No'}`);

      if (!isRoomStillListed) {
        console.log('  \x1b[32m✔ Success:\x1b[0m Room availability was correctly blocked for booked dates.');
        results.availabilityUpdate = true;
      } else {
        console.log('  \x1b[31m✘ Failed:\x1b[0m Room remains listed as available despite the confirmed booking.');
      }
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Check availability controller failed.');
    }

    // 6. Test 5: Prevent Double Bookings (Conflicts)
    console.log('\n[Test 5/8] Testing Double Booking Prevention (Conflict Rejection)...');
    // Attempting to book the SAME room overlapping from today to tomorrow
    req = {
      user: testUser,
      body: {
        roomId: testRoom._id.toString(),
        checkIn: todayStr,
        checkOut: dayAfterTomorrowStr,
        guests: { adults: 1, children: 0 },
      },
    };
    res = mockResponse();
    next = mockNext(res);

    await createBooking(req, res, next);

    console.log(`  - Response status code on overlap booking attempt: ${res.statusCode}`);
    console.log(`  - Rejection message received: "${res.body ? res.body.message : 'None'}"`);

    if (res.statusCode === 409 || res.statusCode === 400) {
      console.log('  \x1b[32m✔ Success:\x1b[0m Double booking was successfully prevented.');
      results.doubleBookingPrevention = true;
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Double booking conflict was not rejected.');
    }

    // 7. Test 6: Verify Booking on Non-Overlapping Dates succeeds
    console.log('\n[Test 6/8] Verify Booking on Non-Overlapping Future Dates matches available rooms...');
    const futureCheckIn = new Date();
    futureCheckIn.setDate(futureCheckIn.getDate() + 10);
    const futureCheckInStr = futureCheckIn.toISOString().split('T')[0];

    const futureCheckOut = new Date();
    futureCheckOut.setDate(futureCheckOut.getDate() + 12);
    const futureCheckOutStr = futureCheckOut.toISOString().split('T')[0];

    req = {
      query: {
        checkIn: futureCheckInStr,
        checkOut: futureCheckOutStr,
      },
    };
    res = mockResponse();
    next = mockNext(res);

    await checkAvailability(req, res, next);

    if (res.statusCode !== 500 && res.body && res.body.success) {
      const isRoomAvailableInFuture = res.body.data.some(r => r._id.toString() === testRoom._id.toString());
      console.log(`  - Available rooms in future range (${futureCheckInStr} to ${futureCheckOutStr}): ${res.body.count}`);
      console.log(`  - Is test room "${testRoom.name}" available in future range? ${isRoomAvailableInFuture ? 'Yes' : 'No'}`);

      if (isRoomAvailableInFuture) {
        console.log('  \x1b[32m✔ Success:\x1b[0m Non-overlapping dates are correctly identified as available.');
        results.nonOverlappingSuccess = true;
      } else {
        console.log('  \x1b[31m✘ Failed:\x1b[0m Room was incorrectly blocked for non-overlapping future dates.');
      }
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Check availability query crashed.');
    }

    // 8. Test 7: Store booking history per user
    console.log('\n[Test 7/8] Testing Retrieval of Booking History Per User...');
    const { getMyBookings } = require('./controllers/bookingController');

    req = {
      user: testUser,
    };
    res = mockResponse();
    next = mockNext(res);

    await getMyBookings(req, res, next);

    if (res.statusCode !== 500 && res.body && res.body.success) {
      console.log(`  - Retrieved bookings count for user: ${res.body.count}`);
      const userHasBooking = res.body.data.some(b => b._id.toString() === activeBookingId.toString());

      if (userHasBooking && res.body.data[0].room.name === testRoom.name) {
        console.log('  \x1b[32m✔ Success:\x1b[0m Booking history retrieved successfully and contains the correct booking.');
        results.bookingHistory = true;
      } else {
        console.log('  \x1b[31m✘ Failed:\x1b[0m Booking history retrieved but does not contain correct records.');
      }
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Booking history controller failed.');
    }

    // 9. Test 8: Booking Cancellation
    console.log('\n[Test 8/8] Testing Booking Cancellation...');
    const { cancelBooking } = require('./controllers/bookingController');

    req = {
      user: testUser,
      params: {
        id: activeBookingId.toString(),
      },
    };
    res = mockResponse();
    next = mockNext(res);

    await cancelBooking(req, res, next);

    if (res.statusCode !== 500 && res.body && res.body.success) {
      console.log(`  - Booking status after cancellation: "${res.body.data.status}"`);

      // Verify that room is available again on these dates
      const availRes = mockResponse();
      const availNext = mockNext(availRes);
      await checkAvailability({
        query: {
          checkIn: todayStr,
          checkOut: dayAfterTomorrowStr,
        },
      }, availRes, availNext);

      const isRoomAvailableNow = availRes.body.data.some(r => r._id.toString() === testRoom._id.toString());
      console.log(`  - Is room available again after cancellation? ${isRoomAvailableNow ? 'Yes' : 'No'}`);

      if (res.body.data.status === 'cancelled' && isRoomAvailableNow) {
        console.log('  \x1b[32m✔ Success:\x1b[0m Booking cancelled successfully, and room was freed up.');
        results.bookingCancellation = true;
      } else {
        console.log('  \x1b[31m✘ Failed:\x1b[0m Cancellation status updated but room remains blocked.');
      }
    } else {
      console.log('  \x1b[31m✘ Failed:\x1b[0m Cancel booking controller crashed:', res.body ? res.body.message : 'Unknown');
    }

    // Clean up test user & bookings
    await Booking.deleteMany({ user: testUser._id });
    await User.deleteMany({ email: testEmail });

  } catch (error) {
    console.error(`\n\x1b[31m✘ Testing Interrupted by uncaught error: ${error.message}\x1b[0m`);
    console.error(error.stack);
  } finally {
    if (mongoConnected) {
      await mongoose.connection.close();
      console.log('\n[Database] Connection to MongoDB closed gracefully.');
    }
    if (mongoServer) {
      await mongoServer.stop();
      console.log('[Database] In-memory MongoDB Server stopped.');
    }


    // Final Report Card
    console.log('\n================================================================');
    console.log('                        FINAL REPORT CARD');
    console.log('================================================================');
    console.log(`1. Room Schema & Auto-Seeding Verified : ${results.roomSeeding ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`2. Date Range Initial Availability     : ${results.initialAvailability ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`3. Booking Creation & Auto-pricing     : ${results.bookingCreation ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`4. Room Availability Blocking (Overlap) : ${results.availabilityUpdate ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`5. Double Booking Conflict Rejection   : ${results.doubleBookingPrevention ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`6. Booking on Non-Overlapping Dates    : ${results.nonOverlappingSuccess ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`7. Booking History Retrieval Per User  : ${results.bookingHistory ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log(`8. Booking Cancellation & Release      : ${results.bookingCancellation ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);
    console.log('================================================================\n');
  }
}

runTests();
