#!/usr/bin/env ts-node
import { videoDiscoveryService } from '../services/videoDiscovery.service';
import { closePool } from '../db/pool';

async function main() {
  try {
    console.log('🎬 Discovering highlight videos...\n');

    const limit = parseInt(process.argv[2] || '10', 10);
    const results = await videoDiscoveryService.discoverVideosForFinishedGames(limit);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    console.log('\n✅ Discovery complete!');
    console.log(`   Videos found: ${successful}/${results.length}`);

    if (failed.length > 0) {
      console.log(`\n   Failed games:`);
      failed.forEach((r) => console.log(`   - Game ${r.gameId}: ${r.error}`));
    }
  } catch (error) {
    console.error('❌ Discovery failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
