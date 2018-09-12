const rssParserConstructor = require('rss-parser');
const rssParser = new rssParserConstructor();
const knex = require('knex')(require('./knex.conf.js'));

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
  let articleInserts = data.items
    .filter((article) => {
      let skip_strings = [];

      switch (feed.source_id) {
        case 7:
          skip_strings.push('/watch/');
          break;
        case 10:
          skip_strings.push('/art/');
          break;
      }

      return skip_strings
        .reduce((previous, currentString) =>
          previous &&
          article.link.indexOf(currentString) === -1,
          true);
    })
    .map((article) => ({
      source_id: feed.source_id,
      title: article.title,
      url: article.link,
      publish_date: new Date(article.pubDate)
    }))
    .sort((article1, article2) => {
      if (article1.publish_date < article2.publish_date) {
        return 1;
      }

      return -1;
    })
    .slice(0, 5);
  console.log(`Done with feed ${feed.id}`);
  resolve(articleInserts);
}

function collectArticles(articleListArray) {
  let articles = [];
  articleListArray
    .forEach((articleList) => {
      articles = articles.concat(articleList);
    });

  return articles
    .sort((article1, article2) => {
      if (article1.publish_date < article2.publish_date) {
        return 1;
      }

      return -1;
    })
    .slice(0, 5);
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

function getFeeds() {
  return knex('feeds')
    .then((rssFeeds) => {
      let promises = rssFeeds
        .reduce((feedCollection, feed) => {
          if (typeof feedCollection[feed.source_id - 1] === 'undefined') {
            feedCollection[feed.source_id - 1] = [];
          }

          feedCollection[feed.source_id - 1].push(feed);

          return feedCollection;
        }, [])
        .map((feedList) =>
          Promise.all(feedList.map((feed) =>
            (new Promise((resolve, reject) => rssParser.parseURL(
              feed.url,
              feedHandler.bind(null, resolve, reject, feed)
            )))
          ))
            .then(collectArticles)
            .then(insertArticles)
        );

      return Promise.all(promises);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(knex.destroy);
}

// Truncate the articles table
knex('articles').truncate().then(getFeeds);
