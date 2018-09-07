const knex = require('knex')(require('./knex.conf.js'));
const JSDOM = require('jsdom').JSDOM;
const fetch = require('node-fetch');

function parseArticle(article) {
  let articleFooter = `<p>${article.name}<br>${article.slant_string}<br>${article.quality_string}</p>`;

  return fetch(article.url)
    .then((response) => response.text())
    .then((html) => new JSDOM(html))
    .then((dom) => dom.window.document)
    .then((document) => parseArticleBody(article, document))
    .then((body) => knex('articles')
      .where('id', article.id)
      .update({
        body: typeof body === 'undefined'
          ? 'no-article'
          : body.replace(/[\u0800-\uFFFF]/g, '').trim() + articleFooter
      }))
    .then(() => console.log(article.url))
    .catch((err) => {
      console.log(article.url);
      console.log(`-- ${err.message}`);
    });
}

function parseArticleBody(article, document) {
  let body_selector;
  let p_selector;

  switch (article.source_id) {
    case 1:
      body_selector = 'div.StandardArticleBody_body';
      break;
    case 2:
      p_selector = 'div#storytext>p';
      break;
    case 3:
      p_selector = 'div.story-body__inner>p,div#story-body>p';
      break;
    case 4:
      p_selector = 'div.field-name-body>div>div>p,div.field-name-body>div>div>div';
      break;
    case 5:
      body_selector = 'div.post-content';
      break;
    case 6:
      p_selector = 'div.bigtext>p';
      break;
    default:
      console.log(`Unrecognized source ${article.source_id}`);
      return;
  }

  if (typeof body_selector !== 'undefined') {
    let baseString = document.querySelector(body_selector).innerHTML

    if (baseString === '') {
      return;
    }

    return baseString;
  } else if (typeof p_selector !== 'undefined') {
    let baseString = [ ...document.querySelectorAll(p_selector) ]
      .map((element) => element.innerHTML)
      .join('</p><p>');

    if (baseString === '') {
      return;
    }

    return '<p>' + baseString + '</p>';
  }
}

knex('articles')
  .column({
    id: 'articles.id',
    name: 'sources.name',
    url: 'articles.url',
    slant_string: 'sources.slant_string',
    quality_string: 'sources.quality_string',
    source_id: 'articles.source_id'
  })
  .leftJoin('sources', 'articles.source_id', 'sources.id')
  .whereNull('body')
  .orderBy('publish_date', 'DESC')
  .then((articles) => Promise.all(articles.map(parseArticle)))
  .finally(knex.destroy);
