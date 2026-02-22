// Script to update existing events from midnight UTC to 10:00 AM IST
// Run with: node scripts/fix_event_times.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixEventTimes() {
  console.log('Fetching events...');
  
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, event_date');
  
  if (error) {
    console.error('Error fetching events:', error);
    process.exit(1);
  }
  
  console.log(`Found ${events.length} events`);
  
  for (const event of events) {
    const oldDate = new Date(event.event_date);
    if (isNaN(oldDate.getTime())) {
      console.warn(`Skipping event ${event.id} because event_date is invalid:`, event.event_date);
      continue;
    }

    // Check if time is midnight or 5:30 AM (which indicates it was stored without time)
    const hours = oldDate.getUTCHours();
    const mins = oldDate.getUTCMinutes();
    
    // If stored as midnight UTC (which shows as 5:30 AM IST), update to 4:30 AM UTC (10:00 AM IST)
    if (hours === 0 && mins === 0) {
      // Get the date part and set to 10:00 AM IST = 04:30 UTC
      const year = oldDate.getUTCFullYear();
      const month = oldDate.getUTCMonth();
      const day = oldDate.getUTCDate();
      
      const newDate = new Date(Date.UTC(year, month, day, 4, 30, 0)); // 04:30 UTC = 10:00 IST
      
      console.log(`Updating "${event.title}": ${oldDate.toISOString()} -> ${newDate.toISOString()}`);
      
      const { error: updateError } = await supabase
        .from('events')
        .update({ event_date: newDate.toISOString() })
        .eq('id', event.id);
      
      if (updateError) {
        console.error(`  Error updating event ${event.id}:`, updateError);
      } else {
        console.log(`  ✓ Updated`);
      }
    } else {
      console.log(`Skipping "${event.title}" - already has time: ${hours}:${mins} UTC`);
    }
  }
  
  console.log('Done!');
}

fixEventTimes().catch(console.error);
