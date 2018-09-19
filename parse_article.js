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
  let removeSelectors = [
    'img'
  ];
  let divs_to_select = [
    'p',
    'h3',
    'ul',
    'div',
    'blockquote',
    'h2'
  ];

  switch (article.source_id) {
    case 1:
      div_selector = [
        'div.StandardArticleBody_body'
      ];

      removeSelectors = [
        ...removeSelectors,
        '.Image_container',
        '.module',
        '.Slideshow_container',
        '.StandardArticleBody_trustBadgeContainer'
      ];
      break;
    case 2:
      div_selector = [
        'div#storytext'
      ];

      removeSelectors = [
        ...removeSelectors,
        'div.container',
        'div.bucketwrap'
      ];
      break;
    case 3:
      div_selector = [
        'div.story-body__inner',
        'div#story-body'
      ];

      removeSelectors = [
        ...removeSelectors,
        '.story-body__unordered-list',
        '.mpu-ad',
        '.news_idt__image-slider'
      ];
      break;
    case 4:
      div_selector = [
        'div.field-name-body>div>div'
      ];

      removeSelectors = [
        ...removeSelectors,
        '.rollover-people-block',
        '.dfp-tag-wrapper'
      ];
      break;
    case 5:
      div_selector = [
        'div.post-content'
      ];

      removeSelectors = [
        ...removeSelectors,
        '#related_content'
      ];
      break;
    case 6:
      div_selector = [
        'div.bigtext'
      ];

      removeSelectors = [
        ...removeSelectors,
        'div.bigtext>div'
      ];
      break;
    case 7:
      div_selector = [
        '.field'
      ];
      break;
    case 8:
      div_selector = [
        'article'
      ];

      removeSelectors = [
        ...removeSelectors,
        'article>div',
        '.interstitial-link'
      ];
      break;
    case 9:
      div_selector = [
        '.story-text'
      ];

      removeSelectors = [
        ...removeSelectors,
        'p.story-continued',
        'div.story-intro',
        'div.story-share',
        'div.story-interrupt',
        'div.story-supplement',
        'aside',
        'div.shifty-wrapper'
      ];
      break;
    case 10:
      div_selector = [
        '.primary-content-column',
        'div.text'
      ];

      removeSelectors = [
        ...removeSelectors,
        '.banner_wrapper',
        'form',
        '.connatix'
      ];
      break;
    case 11:
      div_selector = [
        '.deep-read'
      ];
      break;
    default:
      throw new Error(`Unrecognized source: ${article.source_id}`);
  }

  removeSelectors
    .forEach((selector) => document.querySelectorAll(selector)
      .forEach((node) => node.parentElement.removeChild(node)));

  div_selector = div_selector
    .map((selector) => divs_to_select.map((div) => `${selector}>${div}`))
    .reduce((all_selectors, new_selectors) => all_selectors.concat(new_selectors), []);
  div_selector = div_selector.join(',');
  let baseString = [ ...document.querySelectorAll(div_selector) ]
    .map((element) => element.outerHTML)
    .join('');

  if (baseString === '') {
    return;
  }

  return baseString.replace(/[\u{10000}-\u{10FFFF}]/ug, '');
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
