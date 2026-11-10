// Node 18+ has fetch built in - no npm install needed
const os = require("os");

const API_URL = process.env.API_URL || "https://jsonplaceholder.typicode.com/posts";
const TOP = Number(process.env.TOP || 3);

async function main() {
  console.log(`[${new Date().toISOString()}] javascript job on ${os.hostname()}`);
  console.log(`GET ${API_URL}`);

  const res = await fetch(API_URL, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const posts = await res.json();

  const perUser = {};
  for (const p of posts) perUser[p.userId] = (perUser[p.userId] || 0) + p.body.length;

  console.log(`fetched ${posts.length} posts, top ${TOP} users by characters written:`);
  Object.entries(perUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP)
    .forEach(([user, chars]) => console.log(`  user ${user}: ${chars} chars`));
}

main().catch((err) => {
  console.error(`job failed: ${err.message}`);
  process.exit(1);
});
