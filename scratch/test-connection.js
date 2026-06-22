import net from 'net';

const testPort = (port) => {
  return new Promise((resolve) => {
    const client = net.connect({ host: 'aws-0-eu-west-1.pooler.supabase.com', port }, () => {
      console.log(`Successfully connected to port ${port}!`);
      client.destroy();
      resolve(true);
    });
    client.on('error', (err) => {
      console.error(`Error connecting to port ${port}:`, err.message);
      resolve(false);
    });
  });
};

async function run() {
  await testPort(5432);
  await testPort(6543);
}

run();
