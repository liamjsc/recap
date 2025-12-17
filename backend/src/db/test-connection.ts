import { pool } from './pool';

async function testDatabaseConnection(): Promise<void> {
  console.log('🔄 Testing database connection...\n');

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db');
    client.release();

    console.log('✅ Database connected successfully!');
    console.log(`   Time: ${result.rows[0]?.now}`);
    console.log(`   Database: ${result.rows[0]?.db}`);

    // Check if we can list tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`   Tables: ${tablesResult.rows.map((r) => r.table_name).join(', ')}`);
    } else {
      console.log('   Tables: (none - run migrations)');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
