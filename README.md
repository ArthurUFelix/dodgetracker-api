
# Dodgetracker API

Keep track of current dodges in League of Legends high elo + LP cut of grandmaster and challenger queues.

## Requirements

- [Riot API Key](https://developer.riotgames.com/docs/portal#web-apis_api-keys)
- Redis Server
- PostgreSql Server

## Setup

- Create a `.env` file at root directory. Example:
```env
PORT=
RIOT_API_KEY=
REDIS_URL=
DATABASE_URI=
```
- `npm install`
- `npm run migrate`
- `npm run start`

