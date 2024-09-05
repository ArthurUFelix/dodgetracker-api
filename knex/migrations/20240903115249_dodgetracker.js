/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('dodges', (table) => {
    table.increments('id')
    table.string('summonerId')
    table.string('rank', 15)
    table.integer('lp')
    table.integer('lpLost')
    table.integer('profileIconId')
    table.string('gameName', 40)
    table.string('tagLine', 10)
    table.timestamp('time').defaultTo(knex.raw('CURRENT_TIMESTAMP'))
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  
};
