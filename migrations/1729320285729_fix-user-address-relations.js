/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropColumn('employee', 'address_id');

  pgm.addColumn('address', {
    employee_id: {
      type: 'uuid',
      notNull: false,
      references: '"employee"(employee_id)',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  // Drop user_id column from address table
  pgm.dropColumn('address', 'user_id');

  // Recreate address_id column in employee table
  pgm.addColumn('employee', {
    address_id: {
      type: 'uuid',
      notNull: true,
    },
  });
};
