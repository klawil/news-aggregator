function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // eslint-disable-line no-param-reassign
  }

  return array;
}

function formatDate(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

const knex = require('knex')(require('./knex.conf.js'));
const path = require('path');
const epub = require('epub-gen');
const converter = require('kindlegen');
const fs = require('fs');
const gmail = require('gmail-send')(require('./gmail.conf.js'));

const epub_output = path.join(__dirname, 'temp.epub');
const mobi_output = path.join(__dirname, 'temp.mobi');
const title = `Today's News - ${formatDate(new Date())}`;

let epubData = {
  title,
  author: 'Multiple',
  output: epub_output,
  css: fs.readFileSync('./template.css'),
  content: []
};

knex
  .raw(`
    SELECT id, title, body
    FROM articles a1
    INNER JOIN (
      SELECT
        MIN(publish_date) AS publish_date,
        source_id
      FROM articles
      WHERE
        body != 'no-article' AND
        body IS NOT NULL
      GROUP BY source_id
    ) a2 ON a1.source_id = a2.source_id AND a1.publish_date = a2.publish_date
    WHERE
      body != 'no-article' AND
      body IS NOT NULL
    ORDER BY a1.source_id
  `)
  .then((response) => response[0])
  .then(shuffle)
  .then((first_articles) => {
    epubData.content = first_articles
      .map((article) => ({
        title: article.title,
        data: article.body
      }));
   })
  .then(() => knex
    .raw(`
      SELECT id, title, body
      FROM articles a1
      INNER JOIN (
        SELECT
          MIN(a1.publish_date) AS publish_date,
          a1.source_id
        FROM articles a1
        LEFT JOIN (
          SELECT
            MIN(publish_date) AS publish_date,
            source_id
          FROM articles
          WHERE
            body != 'no-article' AND
            body IS NOT NULL
          GROUP BY source_id
        ) a2 ON a1.source_id = a2.source_id
        WHERE
          a1.publish_date > a2.publish_date AND
          body != 'no-article' AND
          body IS NOT NULL
        GROUP BY a1.source_id
      ) a2 ON a1.source_id = a2.source_id AND a1.publish_date = a2.publish_date
      WHERE
        body != 'no-article' AND
        body IS NOT NULL
      ORDER BY a1.source_id
    `)
  )
  .then((response) => response[0])
  .then(shuffle)
  .then((first_articles) => {
    first_articles
      .forEach((article) => epubData.content.push({
        title: article.title,
        data: article.body
      }));
  })
  .then(() => (new epub(epubData)).promise)
  .then(() => new Promise((resolve, reject) => {
    converter(fs.readFileSync(epub_output), (error, mobi) => {
      if (error) {
        return reject(error);
      }

      fs.writeFileSync(mobi_output, mobi);

      resolve();
    });
  }))
  .then(() => new Promise((resolve, reject) => gmail({
    subject: title,
    text: title,
    files: [
      {
        path: mobi_output,
        filename: `${title}.mobi`
      }
    ]
  }, (err, res) => {
    if (err) {
      return reject(err);
    }

    resolve(res);
  })))
  .then(() => fs.unlinkSync(epub_output))
  .then(() => fs.unlinkSync(mobi_output))
  .finally(knex.destroy);
