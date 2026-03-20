process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_GYLte8HZkcQ1@ep-sweet-glitter-ana5t5rb-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
async function test() {
  const { getLab2Results } = await import('./lib/db.js');
  try {
    console.log('Fetching...');
    const data = await getLab2Results();
    console.log('Success, keys:', Object.keys(data));
  } catch(e) {
    console.error('ERROR:', e.stack);
  }
}
test();
