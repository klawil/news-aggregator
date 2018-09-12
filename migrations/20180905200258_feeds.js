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
      {
        source_id: 7,
        url: 'http://www.msnbc.com/feeds/latest'
      },
      {
        source_id: 8,
        url: 'http://feeds.washingtonpost.com/rss/politics'
      },
      {
        source_id: 8,
        url: 'http://feeds.washingtonpost.com/rss/national'
      },
      {
        source_id: 8,
        url: 'http://feeds.washingtonpost.com/rss/world'
      },
      {
        source_id: 8,
        url: 'http://feeds.washingtonpost.com/rss/business'
      },
      {
        source_id: 9,
        url: 'http://www.politico.com/rss/congress.xml'
      },
      {
        source_id: 9,
        url: 'http://www.politico.com/rss/economy.xml'
      },
      {
        source_id: 9,
        url: 'http://www.politico.com/rss/energy.xml'
      },
      {
        source_id: 9,
        url: 'http://www.politico.com/rss/politics08.xml'
      },
    ]));

exports.down = (knex) => knex.schema.dropTableIfExists('feeds');
