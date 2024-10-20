/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable(
    'employee_profile_views',
    {
      employee_id: {
        type: 'uuid',
        notNull: true,
        references: '"employee"(employee_id)',
        onDelete: 'CASCADE',
      },
      employer_id: {
        type: 'uuid',
        notNull: true,
        references: '"employer"(employer_id)',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('current_timestamp'),
      },
      updated_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('current_timestamp'),
      },
    },
    {
      indexes: {
        employee_profile_views_employee_id_employer_id_key: {
          columns: ['employee_id', 'employer_id'],
          unique: true,
        },
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('employee_profile_views');
};
