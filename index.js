import express from 'express';
import 'dotenv/config'
import knex from './knex/knex.js';
import './cron.js'
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL)
const app = express();

app.get('/', (_, res) => {
  res.send('nice')
})

app.get('/dodges', async (req, res) => {
  const { queue = 'FLEX' } = req.query
  const dodges = await knex('dodges')
    .where('queue', queue)
    .orderBy('time', 'DESC')
    .select(['id', 'rank', 'lp', 'lpLost', 'profileIconId', 'gameName', 'tagLine', 'time', 'queue'])

  res.send(JSON.stringify(dodges))
})

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  console.log('Limpando redis fi')
  redis.flushdb()
});
