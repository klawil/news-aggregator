exports.up = (knex) => knex.schema.createTable('sources', (table) => {
  table.increments('id').primary();
  table.string('name', 50);
  table.integer('slant');
  table.string('slant_string', 45);
  table.integer('quality');
  table.string('quality_string', 45);
})
  .then(() => knex('sources')
    .insert([
      { // 1
        name: 'Reuters',
        slant: 0,
        slant_string: 'Neutral',
        quality: 62,
        quality_string: 'Original Fact Reporting'
      },
      { // 2
        name: 'NPR',
        slant: -5,
        slant_string: 'Neutral',
        quality: 56,
        quality_string: 'Original Fact Reporting/Fact Reporting'
      },
      { // 3
        name: 'BBC',
        slant: -3,
        slant_string: 'Neutral',
        quality: 54,
        quality_string: 'Fact Reporting'
      },
      { // 4
        name: 'The Hill',
        slant: 9,
        slant_string: 'Skews Right',
        quality: 54,
        quality_string: 'Fact Reporting'
      },
      { // 5
        name: 'The American Conservative',
        slant: 28,
        slant_string: 'Hyper-Partisan Right',
        quality: 33,
        quality_string: 'Analysis'
      },
      { // 6
        name: 'The Washington Times',
        slant: 20,
        slant_string: 'Hyper-Partisan Right',
        quality: 33,
        quality_string: 'Analysis'
      },
      { // 7
        name: 'MSNBC',
        slant: -19,
        slant_string: 'Hyper-Partisan Left',
        quality: 34,
        quality_string: 'Analysis'
      },
      { // 8
        name: 'The Washington Post',
        slant: -10,
        slant_string: 'Skews Left',
        quality: 51,
        quality_string: 'Fact Reporting'
      },
      { // 9
        name: 'Politico',
        slant: -3,
        slant_string: 'Neutral',
        quality: 55,
        quality_string: 'Fact Reporting'
      },
      { // 10
        name: 'Truthout',
        slant: -24,
        slant_string: 'Hyper-Partisan Left',
        quality: 36,
        quality_string: 'Analysis'
      },
    ]));

exports.down = (knex) => knex.schema.dropTableIfExists('sources');
