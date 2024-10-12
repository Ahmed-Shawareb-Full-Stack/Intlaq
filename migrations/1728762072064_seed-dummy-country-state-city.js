/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.sql(`
      -- Insert countries
      INSERT INTO country (country_id, name) VALUES
      (1, 'Egypt'),
      (2, 'Saudi Arabia');
  
      -- Insert states for Egypt
      INSERT INTO state (state_id, name, country_id) VALUES
      (1, 'Cairo', 1),
      (2, 'Alexandria', 1),
      (3, 'Giza', 1);
  
      -- Insert states for Saudi Arabia
      INSERT INTO state (state_id, name, country_id) VALUES
      (4, 'Riyadh', 2),
      (5, 'Mecca', 2),
      (6, 'Jeddah', 2);
  
      -- Insert cities for Cairo
      INSERT INTO city (city_id, name, state_id) VALUES
      (1, 'Nasr City', 1),
      (2, 'Maadi', 1),
      (3, 'Heliopolis', 1);
  
      -- Insert cities for Alexandria
      INSERT INTO city (city_id, name, state_id) VALUES
      (4, 'Montazah', 2),
      (5, 'Sidi Gaber', 2),
      (6, 'Agami', 2);
  
      -- Insert cities for Giza
      INSERT INTO city (city_id, name, state_id) VALUES
      (7, 'Dokki', 3),
      (8, '6th of October City', 3),
      (9, 'Sheikh Zayed City', 3);
  
      -- Insert cities for Riyadh
      INSERT INTO city (city_id, name, state_id) VALUES
      (10, 'Al Olaya', 4),
      (11, 'Al Malaz', 4),
      (12, 'Diriyah', 4);
  
      -- Insert cities for Mecca
      INSERT INTO city (city_id, name, state_id) VALUES
      (13, 'Al Haram', 5),
      (14, 'Aziziyah', 5),
      (15, 'Rusaifah', 5);
  
      -- Insert cities for Jeddah
      INSERT INTO city (city_id, name, state_id) VALUES
      (16, 'Al Balad', 6),
      (17, 'Corniche', 6),
      (18, 'Al Safa', 6);
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`
      -- Delete cities
      DELETE FROM city WHERE city_id BETWEEN 1 AND 18;

      -- Delete states
      DELETE FROM state WHERE state_id BETWEEN 1 AND 6;

      -- Delete countries
      DELETE FROM country WHERE country_id IN (1, 2);
    `);
};
