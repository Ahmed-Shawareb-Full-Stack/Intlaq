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
  pgm.createIndex('address', 'city_id');
  pgm.createIndex('employee', 'experience_level');
  pgm.createIndex('job_posting', 'city_id', {
    name: 'idx_job_posting_city_id',
  });
  pgm.createIndex('job_posting', 'required_experience', {
    name: 'idx_job_posting_required_experience',
  });
  pgm.createIndex('application', 'status', { name: 'idx_application_status' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropIndex('address', 'city_id');
  pgm.dropIndex('employee', 'experience_level');
  pgm.dropIndex('job_posting', 'city_id', { name: 'idx_job_posting_city_id' });
  pgm.dropIndex('job_posting', 'required_experience', {
    name: 'idx_job_posting_required_experience',
  });
  pgm.dropIndex('application', 'status', { name: 'idx_application_status' });
};
