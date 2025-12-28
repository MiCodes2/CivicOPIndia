const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  try {
    // Check events table
    const { error: eventsError } = await supabase.from('events').select('id').limit(1);
    if (eventsError) {
      console.log('Events table does not exist or error:', eventsError.message);
    } else {
      console.log('Events table exists');
    }

    // Check if there's an images table
    const { error: imagesError } = await supabase.from('images').select('id').limit(1);
    if (imagesError) {
      console.log('Images table does not exist or error:', imagesError.message);
    } else {
      console.log('Images table exists');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkTables();