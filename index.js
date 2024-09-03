const express = require('express');
const app = express();

const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }
});

let lastRequest = {}

const parseDodge = async (data) => {
  const req = await fetch(`https://br1.api.riotgames.com/lol/summoner/v4/summoners/${data.summonerId}?api_key=${process.env.RIOT_API_KEY}`)
  const res = await req.json()

  const req2 = await fetch(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/${res.puuid}?api_key=${process.env.RIOT_API_KEY}`)
  const res2 = await req2.json()

  const toInsert = {
    summonerId: data.summonerId,
    rank: data.tier,
    lp: data.leaguePoints,
    lpLost: lastRequest[data.summonerId].lp - data.leaguePoints,
    profileIconId: res.profileIconId,
    gameName: res2.gameName,
    tagLine: res2.tagLine,
  }

  console.log('inserting', toInsert)
  const dodge = await knex('dodges').insert(toInsert)
  return dodge;
}

const getPlayersData = async () => {
  const [reqM, reqG, reqC] = await Promise.all([
    fetch(`https://br1.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_API_KEY}`),
    fetch(`https://br1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_API_KEY}`),
    fetch(`https://br1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_API_KEY}`),
  ])

  const newDodges = []
  const resBySummoner = (await Promise.all([reqM.json(),reqG.json(),reqC.json()])).reduce((acc, crr) => {
    for (const sumInfo of crr.entries) {
      const found = lastRequest[sumInfo.summonerId]
      if (found &&
        found.lp !== sumInfo.leaguePoints &&
        found.wins === sumInfo.wins &&
        found.losses === sumInfo.losses
      ) {
        newDodges.push({ ...sumInfo, tier: crr.tier })
      }

      acc[sumInfo.summonerId] = {
        lp: sumInfo.leaguePoints,
        wins: sumInfo.wins,
        losses: sumInfo.losses,
        rank: crr.tier,
      }
    }

    return acc
  }, {})

  for (const dodgeInfo of newDodges) {
    await parseDodge(dodgeInfo)
  }

  lastRequest = resBySummoner

  setTimeout(async () => {
    getPlayersData()
  }, 5000)
}

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  getPlayersData()
});
