exports.up = (knex) => knex.schema.createTable('articles', (table) => {
  table.increments('id').primary();
  table.integer('source_id');
  table.string('title', 200);
  table.string('url', 500);
  table.dateTime('publish_date');
  table.text('body', 'mediumtext');
});

exports.down = (knex) => knex.schema.dropTableIfExists('articles');
