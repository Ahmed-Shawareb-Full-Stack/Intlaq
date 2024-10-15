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
  pgm.createTable('job_posting_programming_language', {
    id: 'id',
    job_posting_id: {
      type: 'uuid',
      notNull: true,
      references: '""job_posting"(job_posting_id)"',
      onDelete: 'CASCADE',
    },
    programming_language_id: {
      type: 'integer',
      notNull: true,
      references: '"programming_language(language_id)"',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint(
    'job_posting_programming_language',
    'unique_job_posting_programming_language',
    {
      unique: ['job_posting_id', 'programming_language_id'],
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('job_posting_programming_language');
};
