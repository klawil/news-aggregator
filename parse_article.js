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
          : body.trim() + articleFooter
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
  let removeSelectors = [];

  switch (article.source_id) {
    case 1:
      body_selector = 'div.StandardArticleBody_body';

      removeSelectors = [
        ...removeSelectors,
        '.Image_container',
        '.module',
        '.Slideshow_container'
      ];
      break;
    case 2:
      p_selector = [
        'div#storytext>p'
      ];
      break;
    case 3:
      p_selector = [
        'div.story-body__inner>p',
        'div#story-body>p',
        'div.story-body__inner>ul',
        'div#story-body>ul',
        'div.story-body__inner>h3',
        'div#story-body>h3'
      ];
      break;
    case 4:
      p_selector = [
        'div.field-name-body>div>div>p',
        'div.field-name-body>div>div>div'
      ];

      removeSelectors = [
        ...removeSelectors,
        '.rollover-people-block',
        '.dfp-tag-wrapper'
      ];
      break;
    case 5:
      body_selector = 'div.post-content';

      removeSelectors = [
        ...removeSelectors,
        '#related_content'
      ];
      break;
    case 6:
      p_selector = [
        'div.bigtext>p'
      ];
      break;
    default:
      console.log(`Unrecognized source ${article.source_id}`);
      return;
  }

  removeSelectors
    .forEach((selector) => document.querySelectorAll(selector)
      .forEach((node) => node.parentElement.removeChild(node)));

  if (typeof body_selector !== 'undefined') {
    let baseString = document.querySelector(body_selector).innerHTML

    if (baseString === '') {
      return;
    }

    return baseString;
  } else if (typeof p_selector !== 'undefined') {
    p_selector = p_selector.join(',');
    let baseString = [ ...document.querySelectorAll(p_selector) ]
      .map((element) => element.outerHTML)
      .join('');

    if (baseString === '') {
      return;
    }

    return baseString;
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
