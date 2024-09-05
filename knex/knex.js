import Knex from 'knex';
import 'dotenv/config'

export default Knex({
  client: "pg",
  connection: process.env.DATABASE_URI,
  migrations: {
    directory: "./migrations",
  }
});