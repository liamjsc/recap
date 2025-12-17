#!/usr/bin/env ts-node
import { env } from '../config/env';
import { gamesRepository, teamsRepository } from '../db/repositories';
import { nbaService, NBAGame } from '../services/nba.service';
import { closePool } from '../db/pool';

interface NBAGamesResponse {
  data: NBAGame[];
  meta: {
    next_cursor?: number;
    per_page: number;
  };
}

/**
 * Fetch all games with pagination
 */
async function fetchAllGames(startDate: string, endDate: string): Promise<NBAGame[]> {
  const allGames: NBAGame[] = [];
  let cursor: number | undefined;
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      per_page: '100',
    });

    if (cursor) {
      params.append('cursor', cursor.toString());
    }

    const url = `${env.nbaApiUrl}/games?${params}`;
    console.log(`Fetching page ${page}...`);

    // Retry logic with exponential backoff
    let response: Response | null = null;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: env.nbaApiKey,
        },
      });

      if (response.ok) {
        break;
      }

      if (response.status === 429) {
        retries++;
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`  Rate limited, waiting ${waitTime / 1000}s (retry ${retries}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw new Error(`NBA API error: ${response.statusText}`);
      }
    }

    if (!response || !response.ok) {
      throw new Error('Max retries exceeded');
    }

    const data = (await response.json()) as NBAGamesResponse;
    allGames.push(...data.data);

    console.log(`  Got ${data.data.length} games (total: ${allGames.length})`);

    if (!data.meta.next_cursor) {
      break;
    }

    cursor = data.meta.next_cursor;
    page++;

    // Longer delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return allGames;
}

/**
 * Sync a single game
 */
async function syncGame(nbaGame: NBAGame): Promise<boolean> {
  try {
    // Find teams by external ID
    const teams = await teamsRepository.findAll();
    const homeTeam = teams.find((t) => t.externalId === nbaGame.home_team.id);
    const awayTeam = teams.find((t) => t.externalId === nbaGame.visitor_team.id);

    if (!homeTeam || !awayTeam) {
      console.error(`Teams not found for game ${nbaGame.id}`);
      return false;
    }

    // Check if game exists
    const existingGame = await gamesRepository.findByExternalId(nbaGame.id.toString());

    // Parse date correctly
    const [year, month, day] = nbaGame.date.split('-').map(Number);
    const gameDate = new Date(year!, month! - 1, day!);
    const status = nbaService.mapGameStatus(nbaGame);

    if (existingGame) {
      await gamesRepository.update(existingGame.id, {
        status,
        homeScore: nbaGame.home_team_score || undefined,
        awayScore: nbaGame.visitor_team_score || undefined,
      });
    } else {
      await gamesRepository.create({
        externalId: nbaGame.id.toString(),
        gameDate,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        status,
        homeScore: nbaGame.home_team_score || undefined,
        awayScore: nbaGame.visitor_team_score || undefined,
      });
    }

    return true;
  } catch (error) {
    console.error(`Error syncing game ${nbaGame.id}:`, error);
    return false;
  }
}

async function main() {
  // Break into monthly chunks to avoid rate limiting
  const months = [
    { start: '2024-10-22', end: '2024-10-31' },
    { start: '2024-11-01', end: '2024-11-30' },
    { start: '2024-12-01', end: '2024-12-31' },
    { start: '2025-01-01', end: '2025-01-31' },
    { start: '2025-02-01', end: '2025-02-28' },
    { start: '2025-03-01', end: '2025-03-31' },
    { start: '2025-04-01', end: '2025-04-30' },
    { start: '2025-05-01', end: '2025-05-31' },
    { start: '2025-06-01', end: '2025-06-30' },
    { start: '2025-07-01', end: '2025-07-31' },
    { start: '2025-08-01', end: '2025-08-31' },
    { start: '2025-09-01', end: '2025-09-30' },
    { start: '2025-10-01', end: '2025-10-31' },
    { start: '2025-11-01', end: '2025-11-30' },
    { start: '2025-12-01', end: '2025-12-17' },
  ];

  console.log('🏀 Backfilling NBA season schedule (month by month)');
  console.log(`   From: 2024-10-22`);
  console.log(`   To: 2025-12-17\n`);

  let totalSynced = 0;
  let totalErrors = 0;

  try {
    for (const month of months) {
      console.log(`\n📅 Processing ${month.start} to ${month.end}...`);

      try {
        const games = await fetchAllGames(month.start, month.end);
        console.log(`   Fetched ${games.length} games`);

        let synced = 0;
        for (const game of games) {
          const success = await syncGame(game);
          if (success) synced++;
        }

        console.log(`   ✅ Synced ${synced}/${games.length} games`);
        totalSynced += synced;
        totalErrors += games.length - synced;

        // Wait between months to avoid rate limiting
        console.log('   Waiting 5s before next month...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`   ❌ Failed: ${error}`);
        console.log('   Waiting 30s before retry...');
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }

    console.log('\n✅ Backfill complete!');
    console.log(`   Total games synced: ${totalSynced}`);
    console.log(`   Total errors: ${totalErrors}`);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
  } finally {
    await closePool();
  }
}

main();
