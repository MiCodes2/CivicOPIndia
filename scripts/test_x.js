const fs = require('fs');
(async () => {
  try {
    const env = fs.readFileSync('.env.local','utf8');
    env.split(/\n/).forEach(line=>{
      line=line.trim();
      if(!line||line.startsWith('#')) return;
      const idx=line.indexOf('=');
      if(idx>0){
        const k=line.slice(0,idx);
        const v=line.slice(idx+1);
        process.env[k]=v;
      }
    });
    const { Client } = await import('twitter-api-sdk');
    const token = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN || process.env.BEARER_TOKEN;
    if(!token) throw new Error('missing token');
    const client = new Client(token);
    const resp = await client.users.findUserByUsername('CivicOp_india', { 'user.fields': ['public_metrics'] });
    console.log(JSON.stringify(resp, null, 2));
  } catch(e){
    console.error('error', e);
    process.exit(1);
  }
})();
