exports.up = (knex) => knex.schema.createTable('sources', (table) => {
  table.increments('id').primary();
  table.string('name', 50);
  table.string('slant', 45);
  table.string('quality', 45);
})
  .then(() => knex('sources')
    .insert([
      { // 1
        name: 'Reuters',
        slant: 'Mainstream',
        quality: '1 - Original Fact Reporting'
      },
      { // 2
        name: 'NPR',
        slant: 'Mainstream',
        quality: '2 - Fact Reporting'
      },
      { // 3
        name: 'BBC',
        slant: 'Mainstream',
        quality: '2 - Fact Reporting'
      },
      { // 4
        name: 'The Hill',
        slant: 'Skews Conservative',
        quality: '2 - Fact Reporting'
      },
      { // 5
        name: 'The American Conservative',
        slant: 'Hyper-Partisan Conservative',
        quality: '5 - Opinion; Fair Persuasion'
      },
      { // 6
        name: 'The Washington Times',
        slant: 'Hyper-Partisan Conservative',
        quality: '5 - Opinion; Fair Persuasion'
      }
    ]));

exports.down = (knex) => knex.schema.dropTableIfExists('sources');
