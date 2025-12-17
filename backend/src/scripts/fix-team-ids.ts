import { pool } from '../db/pool';

/**
 * Fix team external_id values to match balldontlie API IDs
 * The balldontlie API uses different IDs than our seeded data
 */

// Mapping from abbreviation to balldontlie API team ID
const BALLDONTLIE_TEAM_IDS: Record<string, number> = {
  ATL: 1,
  BOS: 2,
  BKN: 3,
  CHA: 4,
  CHI: 5,
  CLE: 6,
  DAL: 7,
  DEN: 8,
  DET: 9,
  GSW: 10,
  HOU: 11,
  IND: 12,
  LAC: 13,
  LAL: 14,
  MEM: 15,
  MIA: 16,
  MIL: 17,
  MIN: 18,
  NOP: 19,
  NYK: 20,
  OKC: 21,
  ORL: 22,
  PHI: 23,
  PHX: 24,
  POR: 25,
  SAC: 26,
  SAS: 27,
  TOR: 28,
  UTA: 29,
  WAS: 30,
};

async function fixTeamIds() {
  console.log('🔧 Fixing team external_ids to match balldontlie API...\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update each team's external_id
    for (const [abbr, externalId] of Object.entries(BALLDONTLIE_TEAM_IDS)) {
      const result = await client.query(
        'UPDATE teams SET external_id = $1 WHERE abbreviation = $2 RETURNING id, name, abbreviation',
        [externalId, abbr]
      );

      if (result.rows[0]) {
        console.log(`✅ ${result.rows[0].abbreviation} (${result.rows[0].name}) -> external_id: ${externalId}`);
      } else {
        console.log(`⚠️ Team ${abbr} not found in database`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ All team external_ids updated successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to update team IDs:', error);
    throw error;
  } finally {
    client.release();
  }

  // Now clear all games since they were synced with wrong team IDs
  console.log('\n🗑️ Clearing games table (synced with wrong team IDs)...');
  await pool.query('DELETE FROM videos');
  await pool.query('DELETE FROM games');
  console.log('✅ Games and videos cleared');

  await pool.end();
}

fixTeamIds().catch(console.error);
