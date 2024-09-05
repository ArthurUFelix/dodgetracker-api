import 'dotenv/config'

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

export default {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URI,
    migrations: {
      directory: "./knex/migrations",
    }
  },
}
