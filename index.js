const rssParserConstructor = require('rss-parser');
const rssParser = new rssParserConstructor();
const knex = require('knex')(require('./knex.conf.js'));
// const fetch = require('node-fetch');

function feedHandler(resolve, reject, feed, err, data) {
  // Hanlde errors
  if (err) {
    console.log(`Error ${feed.id}`);
    reject({
      feed,
      err
    });
    return;
  }

  // Count the articles
  let articleInserts = [];
  data.items.forEach((article) => {
    articleInserts.push({
      source_id: feed.source_id,
      title: article.title,
      url: article.link,
      publish_date: new Date(article.pubDate)
    });
  });
  console.log(`Done ${feed.id}`);
  resolve(articleInserts);
}

function checkArticlesForExistence(articles) {
  if (articles.length === 0) {
    return [];
  }

  let promises = articles
    .map((article) => knex('articles')
      .where({
        url: article.url
      })
      .then((data) => {
        if (data.length === 0) {
          return article;
        }

        return false;
      })
    );

  return Promise.all(promises);
}

function insertArticles(articles) {
  articles = articles.filter((article) => article !== false);

  if (articles.length === 0) {
    console.log('No New Articles');
    return;
  }

  return knex('articles')
    .insert(articles);
}

// Get all of the RSS feeds to parse
knex('feeds')
  .then((rssFeeds) => {
    let promises = rssFeeds
      .map((feed) =>
        (new Promise((resolve, reject) => rssParser.parseURL(
          feed.url,
          feedHandler.bind(null, resolve, reject, feed)
        )))
          .then(checkArticlesForExistence)
          .then(insertArticles)
      );

    return Promise.all(promises);
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(knex.destroy);

/*
rssParser.parseURL('http://www.npr.org/rss/rss.php?id=1001', (err, feed) => {
  console.log(feed.title);

  console.log(feed.items.length);
  let dbEntry = {
    url: feed.items[0].link,
    title: feed.items[0].title,
    date: new Date(feed.items[0].pubDate),
    source: 'Reuters'
  };
  console.log(JSON.stringify(dbEntry));
});
*/
