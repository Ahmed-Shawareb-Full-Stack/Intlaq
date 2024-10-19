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
  pgm.alterColumn('user', 'type', { type: 'varchar(255)' });

  pgm.dropType('user_type');

  pgm.createType('user_type', ['EMPLOYEE', 'EMPLOYER']);

  pgm.sql(`
    ALTER TABLE "user"
    ALTER COLUMN type TYPE user_type
    USING (type::text::user_type);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE user
    ALTER COLUMN type TYPE varchar(255)
    USING (type::text::varchar(255));
  `);

  pgm.dropType('user_type');

  pgm.createType('user_type', ['employee', 'employer']);

  pgm.alterColumn('user', 'type', { type: 'user_type' });
};
