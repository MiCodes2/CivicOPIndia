const fs = require('fs');
const env=fs.readFileSync('.env.local','utf8'); env.split(/\n/).forEach(l=>{const m=l.match(/^\s*([A-Z0-9_]+)=(.*)$/i); if(m) process.env[m[1]]=m[2];});
const { createClient } = require('@supabase/supabase-js');
(async()=>{
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const ids=[2,6,5,33,27,34];
  const { data, error } = await s.from('activities').select('id,image_url').in('id',ids);
  if (error) { console.error('err', error); process.exit(1); }
  data.forEach(r => console.log(r.id, '->', r.image_url));
})();
