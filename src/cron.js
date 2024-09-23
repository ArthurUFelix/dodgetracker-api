import Redis from 'ioredis'
import cron from 'node-cron'
import knex from './knex/knex.js'
import { wss } from './index.js'

const redis = new Redis(process.env.REDIS_URL)

const leaderboardUrl = 'https://br1.api.riotgames.com/lol/league/v4/'
const summonerUrl = 'https://br1.api.riotgames.com/lol/summoner/v4/summoners/'
const accountUrl = 'https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/'

const insertDodge = async (data) => {
  const summonerRes = await fetch(`${summonerUrl}${data.summonerId}?api_key=${process.env.RIOT_API_KEY}`).then(res => res.json())
  const accountRes = await fetch(`${accountUrl}${summonerRes.puuid}?api_key=${process.env.RIOT_API_KEY}`).then(res => res.json())

  const [dodge] = await knex('dodges')
  .returning(['id', 'rank', 'lp', 'lpLost', 'profileIconId', 'gameName', 'tagLine', 'time', 'queue'])
  .insert({
    summonerId: data.summonerId,
    rank: data.tier,
    lp: data.leaguePoints,
    lpLost: data.lpLost,
    queue: data.queue,
    profileIconId: summonerRes.profileIconId,
    gameName: accountRes.gameName,
    tagLine: accountRes.tagLine,
  })

  return dodge;
}

const fetchQueueLeaderboard = async (queue) => {
  const queueTypes = {
    SOLO: 'RANKED_SOLO_5x5',
    FLEX: 'RANKED_FLEX_SR',
  }
  const leaderboardResponse = await Promise.all([
    fetch(`${leaderboardUrl}masterleagues/by-queue/${queueTypes[queue]}?api_key=${process.env.RIOT_API_KEY}`).then(res => res.json()),
    fetch(`${leaderboardUrl}grandmasterleagues/by-queue/${queueTypes[queue]}?api_key=${process.env.RIOT_API_KEY}`).then(res => res.json()),
    fetch(`${leaderboardUrl}challengerleagues/by-queue/${queueTypes[queue]}?api_key=${process.env.RIOT_API_KEY}`).then(res => res.json()),
  ])

  const newDodges = []
  const latestSumInfo = JSON.parse(await redis.get(`LAST_SUMMONER_INFO_${queue}`) || '{}')

  const resBySummoner = {}
  for (const league of leaderboardResponse) {
    for (const sumInfo of league.entries) {
      const found = latestSumInfo[sumInfo.summonerId]
      const lpLost = (found?.lp || 0) - sumInfo.leaguePoints
      if (found &&
        found.lp !== sumInfo.leaguePoints &&
        found.wins === sumInfo.wins &&
        found.losses === sumInfo.losses &&
        [5, 15].includes(lpLost)
      ) {
        const dodge = await insertDodge({
          ...sumInfo,
          tier: league.tier,
          lpLost,
          queue,
        })
        newDodges.push(dodge)
      }

      resBySummoner[sumInfo.summonerId] = {
        lp: sumInfo.leaguePoints,
        wins: sumInfo.wins,
        losses: sumInfo.losses,
        rank: league.tier,
      }
    }
  }

  const sortedByLp = leaderboardResponse.reduce((acc, crr) => [...acc, ...crr.entries], []).sort((a, b) => b.leaguePoints - a.leaguePoints)
  const challenger = Math.max(500, sortedByLp[199]?.leaguePoints + 1)
  const grandmaster = Math.max(200, sortedByLp[699]?.leaguePoints + 1)
  await redis.set(`${queue}_LP_CUT`, JSON.stringify({ challenger, grandmaster }))

  if (newDodges.length) {
    console.log('sending dodges to ws', newDodges)
    wss.clients.forEach(function(client) {
      client.send(JSON.stringify(newDodges));
    });
  }

  await redis.set(`LAST_SUMMONER_INFO_${queue}`, JSON.stringify(resBySummoner))
}

export default cron.schedule('*/10 * * * * *', () => {
  fetchQueueLeaderboard('SOLO')
  fetchQueueLeaderboard('FLEX')
});