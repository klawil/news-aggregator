exports.up = (knex) => knex.schema.createTable('feeds', (table) => {
  table.increments('id').primary();
  table.integer('source_id');
  table.string('url', 500);
})
  .then(() => knex('feeds')
    .insert([
      {
        source_id: 1,
        url: 'http://feeds.reuters.com/reuters/topNews'
      },
      {
        source_id: 2,
        url: 'http://www.npr.org/rss/rss.php?id=1001'
      },
      {
        source_id: 3,
        url: 'http://newsrss.bbc.co.uk/rss/newsonline_world_edition/americas/rss.xml'
      },
      {
        source_id: 4,
        url: 'http://thehill.com/rss/syndicator/19110'
      },
      {
        source_id: 5,
        url: 'https://www.theamericanconservative.com/articles/feed/'
      },
      {
        source_id: 6,
        url: 'https://www.washingtontimes.com/rss/headlines/news/'
      },
    ]));

exports.down = (knex) => knex.schema.dropTableIfExists('feeds');
