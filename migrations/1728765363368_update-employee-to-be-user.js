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
  // Remove email column from employee table
  pgm.dropColumn('employee', 'email');

  // Add user_id column to employee table
  pgm.addColumn('employee', {
    user_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
    },
  });

  // Add foreign key constraint to link employee with user table
  pgm.addConstraint('employee', 'employee_user_id_fkey', {
    foreignKeys: {
      columns: 'user_id',
      references: '"user"(user_id)',
      onDelete: 'CASCADE',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remove foreign key constraint
  pgm.dropConstraint('employee', 'employee_user_id_fkey');

  // Remove user_id column from employee table
  pgm.dropColumn('employee', 'user_id');

  // Add email column back to employee table
  pgm.addColumn('employee', {
    email: {
      type: 'varchar(255)',
      notNull: true,
    },
  });
};
