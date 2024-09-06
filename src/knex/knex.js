import Knex from 'knex';

export default Knex({
  client: "pg",
  connection: process.env.DATABASE_URI,
  migrations: {
    directory: "./migrations",
  }
});