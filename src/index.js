import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { Redis } from 'ioredis'
import { WebSocketServer } from 'ws'
import knex from './knex/knex.js'
import './cron.js'

const redis = new Redis(process.env.REDIS_URL)
const app = express();
app.use(cors())

app.get('/', (_, res) => {
  res.send('nice')
})

app.get('/dodges', async (req, res) => {
  const flexDodges = await knex('dodges')
    .orderBy('time', 'DESC')
    .where({ queue: 'FLEX' })
    .limit(50)
    .select(['id', 'rank', 'lp', 'lpLost', 'profileIconId', 'gameName', 'tagLine', 'time', 'queue'])
  const soloDodges = await knex('dodges')
    .orderBy('time', 'DESC')
    .where({ queue: 'SOLO' })
    .limit(50)
    .select(['id', 'rank', 'lp', 'lpLost', 'profileIconId', 'gameName', 'tagLine', 'time', 'queue'])

  res.send(JSON.stringify([...soloDodges, ...flexDodges]))
})

const server = app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  console.log('Limpando redis fi')
  redis.flushdb()
});

const wss = new WebSocketServer({ server, path: '/ws' })

export { wss }