const Room = require('../models/Room');

const sampleRooms = [
  {
    roomNumber: 'M-101',
    name: 'Maharaja Presidential Suite',
    type: 'suite',
    pricePerNight: 250000,
    maxGuests: 4,
    description: 'Our largest suite, fully outfitted with hand-carved mahogany panels, private dining salon, bulletproof windows, personal gym, and a round-the-clock dedicated butler.',
    amenities: [
      '3,200 SQ FT',
      'Imperial Bed',
      '24h Royal Valet',
      'Hand-carved Mahogany Panels',
      'Private Dining Salon',
      'Bulletproof Windows',
      'Personal Gym',
      'Private Jacuzzi',
    ],
    images: ['https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800'],
    isAvailable: true,
  },
  {
    roomNumber: 'M-102',
    name: 'Maharani Signature Suite',
    type: 'suite',
    pricePerNight: 120000,
    maxGuests: 3,
    description: 'Exquisitely feminine design with delicate pink rose frescoes, gold foil carvings, custom ivory vanity, private swing balcony, and deep copper soaking tub.',
    amenities: [
      '1,800 SQ FT',
      'Royal Bed',
      'Copper Tub',
      'Delicate frescoes',
      'Gold Foil Carvings',
      'Ivory Vanity',
      'Private Swing Balcony',
    ],
    images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800'],
    isAvailable: true,
  },
  {
    roomNumber: 'V-101',
    name: 'Palace Garden Villa',
    type: 'villa',
    pricePerNight: 95000,
    maxGuests: 4,
    description: 'A completely detached luxury residence featuring an private heated lap pool, outdoor sand-stone shower, lush private garden courtyard, and separate lounge house.',
    amenities: [
      '1,500 SQ FT',
      'Private Plunge',
      'Private Garden',
      'Heated Lap Pool',
      'Outdoor Sand-stone Shower',
      'Separate Lounge House',
    ],
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800'],
    isAvailable: true,
  },
  {
    roomNumber: 'S-101',
    name: 'Grand Royal Sanctuary',
    type: 'suite',
    pricePerNight: 85000,
    maxGuests: 2,
    description: 'Spacious and elegant chambers featuring high arches, hand-painted murals depicting Jaipur\'s history, a plush Italian-marble bathroom, and custom mini wine cellar.',
    amenities: [
      '1,350 SQ FT',
      'King Bed',
      'Private Bar',
      'High Arches',
      'Hand-painted Murals',
      'Italian-marble Bathroom',
      'Mini Wine Cellar',
    ],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800'],
    isAvailable: true,
  },
  {
    roomNumber: 'V-102',
    name: 'Lotus Temple Pavilion',
    type: 'villa',
    pricePerNight: 75000,
    maxGuests: 2,
    description: 'Gently floating at the edge of the reflective lotus pool. Hand-tiled mosaics, glass ceilings for nighttime stargazing, and private balcony directly above water.',
    amenities: [
      '1,100 SQ FT',
      'Pool Facing',
      'In-room Steam',
      'Reflective Lotus Pool Side',
      'Hand-tiled Mosaics',
      'Glass Ceilings',
      'Private Over-water Balcony',
    ],
    images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800'],
    isAvailable: true,
  },
  {
    roomNumber: 'R-101',
    name: 'Peacock Heritage Chamber',
    type: 'room',
    pricePerNight: 55000,
    maxGuests: 2,
    description: 'Adorned with intricate hand-painted blue peacock murals, classical stone columns, a traditional carved hanging swing (jhoola), and stunning courtyard views.',
    amenities: [
      '900 SQ FT',
      'Queen Bed',
      'Royal Swing',
      'Peacock Murals',
      'Stone Columns',
      'Traditional Jhoola Swing',
      'Courtyard Views',
    ],
    images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800'],
    isAvailable: true,
  },
];

/**
 * Automatically seeds the database with RajMahal's signature rooms and suites
 * if the Room collection is empty.
 */
const seedRooms = async () => {
  try {
    const count = await Room.countDocuments();
    if (count === 0) {
      console.log('[Seed] Room collection is empty. Seeding RajMahal luxury chambers...');
      await Room.insertMany(sampleRooms);
      console.log('[Seed] Successfully seeded 6 luxury rooms and suites.');
    } else {
      console.log(`[Seed] Room collection already has ${count} records. Skipping seed.`);
    }
  } catch (error) {
    console.error(`[Error] Seeding failed: ${error.message}`);
  }
};

module.exports = seedRooms;
