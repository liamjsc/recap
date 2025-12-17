#!/usr/bin/env ts-node
import { scheduleSyncService } from '../services/scheduleSync.service';
import { closePool } from '../db/pool';

async function main() {
  try {
    console.log('🏀 Syncing NBA schedule...\n');

    // Sync upcoming week
    const result = await scheduleSyncService.syncUpcomingWeek();

    console.log('\n✅ Sync complete!');
    console.log(`   Games added: ${result.gamesAdded}`);
    console.log(`   Games updated: ${result.gamesUpdated}`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
      result.errors.forEach((err) => console.log(`   - ${err}`));
    }
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
