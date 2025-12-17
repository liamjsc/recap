import { seedTeams } from './seeds/teams';
import { closePool } from './pool';

async function runSeeds(): Promise<void> {
  console.log('Starting database seeding...\n');

  try {
    await seedTeams();
    console.log('\nSeeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

runSeeds();
