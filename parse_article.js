const knex = require('knex')(require('./knex.conf.js'));
const JSDOM = require('jsdom').JSDOM;
const fetch = require('node-fetch');
const ProgressBar = require('progress');

let bar;

function make2Characters(str) {
  return ('00' + str).slice(-2);
}

function parseArticle(article) {
  let date = article.publish_date;

  let articleHeader = date === null
    ? ''
    : `<p>${date.getFullYear()}-${make2Characters(date.getMonth() + 1)}-${make2Characters(date.getDate())} ${make2Characters(date.getHours())}:${make2Characters(date.getMinutes())}</p>`;
  let articleFooter = `<p>${article.name}<br>${article.slant_string}<br>${article.quality_string}</p>`;
  let localBody;

  return fetch(article.url)
    .then((response) => response.text())
    .then((html) => new JSDOM(html))
    .then((dom) => dom.window.document)
    .then((document) => parseArticleBody(article, document))
    .then((body) => {
      localBody = body;

      return knex('articles')
        .where('id', article.id)
        .update({
          body: typeof body === 'undefined'
            ? 'no-article'
            : articleHeader + body.trim() + articleFooter
        });
    })
    .then(() => {
      if (typeof localBody === 'undefined') {
        throw new Error('No article body found');
      }

      bar.tick();
    })
    .catch((err) => {
      bar.interrupt(article.url);
      bar.interrupt(`-- ${err.message}`);
      bar.tick();
    });
}

function parseArticleBody(article, document) {
  let div_selector;
  let removeSelectors = [];

  switch (article.source_id) {
    case 1:
      div_selector = [
        'div.StandardArticleBody_body>p',
        'div.StandardArticleBody_body>h3'
      ];

      removeSelectors = [
        ...removeSelectors,
        '.Image_container',
        '.module',
        '.Slideshow_container'
      ];
      break;
    case 2:
      div_selector = [
        'div#storytext>p'
      ];
      break;
    case 3:
      div_selector = [
        'div.story-body__inner>p',
        'div#story-body>p',
        'div.story-body__inner>ul',
        'div#story-body>ul',
        'div.story-body__inner>h3',
        'div#story-body>h3'
      ];

      removeSelectors = [
        ...removeSelectors,
        '.story-body__unordered-list'
      ];
      break;
    case 4:
      div_selector = [
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
      div_selector = [
        'div.post-content>p',
        'div.post-content>blockquote'
      ];

      removeSelectors = [
        ...removeSelectors,
        '#related_content'
      ];
      break;
    case 6:
      div_selector = [
        'div.bigtext>p'
      ];
      break;
    case 7:
      div_selector = [
        '.field>p'
      ];
      break;
    case 8:
      div_selector = [
        'article>p'
      ];
      break;
    case 9:
      div_selector = [
        '.story-text>p'
      ];

      removeSelectors = [
        ...removeSelectors,
        'p.story-continued'
      ];
      break;
    case 10:
      div_selector = [
        '.primary-content-column>p',
        '.primary-content-column>ul',
        '.primary-content-column>blockquote',
        '.primary-content-column>h2',
        'div.text>p',
        'div.text>ul',
        'div.text>blockquote',
        'div.text>h2'
      ];
      break;
    case 11:
      div_selector = [
        '.deep-read>p'
      ];
      break;
    default:
      throw new Error(`Unrecognized source: ${article.source_id}`);
  }

  removeSelectors
    .forEach((selector) => document.querySelectorAll(selector)
      .forEach((node) => node.parentElement.removeChild(node)));

  div_selector = div_selector.join(',');
  let baseString = [ ...document.querySelectorAll(div_selector) ]
    .map((element) => element.outerHTML)
    .join('');

  if (baseString === '') {
    return;
  }

  return baseString;
}

knex('articles')
  .column({
    id: 'articles.id',
    name: 'sources.name',
    url: 'articles.url',
    publish_date: 'articles.publish_date',
    slant_string: 'sources.slant_string',
    quality_string: 'sources.quality_string',
    source_id: 'articles.source_id'
  })
  .leftJoin('sources', 'articles.source_id', 'sources.id')
  .whereNull('body')
  .orderBy('publish_date', 'DESC')
  .then((articles) => {
    bar = new ProgressBar('[:bar] :current/:total (:percent) :etas', { total: articles.length });

    return Promise.all(articles.map(parseArticle));
  })
  .finally(knex.destroy);
