/**
 * Fix malformed HTML content in activity ID 61
 * This script sanitizes and repairs broken HTML attributes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fixActivity61() {
  console.log('Fetching activity ID 61...');
  
  const { data: activity, error: fetchError } = await supabase
    .from('activities')
    .select('*')
    .eq('id', 61)
    .single();

  if (fetchError) {
    console.error('Error fetching activity:', fetchError);
    return;
  }

  if (!activity) {
    console.log('Activity 61 not found');
    return;
  }

  console.log('Current content length:', activity.content?.length || 0);
  console.log('Content preview:', activity.content?.substring(0, 200));

  // Fix malformed HTML attributes
  let fixedContent = activity.content || '';
  
  // Fix broken div tags with malformed attributes (like twitter-video-embed="" w-full="" etc)
  // This regex finds divs where attributes are split incorrectly
  fixedContent = fixedContent.replace(
    /<div\s+class="([^"]+)"\s+([a-z-]+)=""\s+([a-z-]+)=""\s+([a-z-]+)=""\s+([a-z-]+)=""\s+([a-z-]+)=""\s+([a-z-]+)=""\s+([a-z-]+)=""\s+([a-z-]+)=""/gi,
    '<div class="$1 $2 $3 $4 $5 $6 $7 $8 $9"'
  );

  // More generic fix for any tag with split class attributes
  fixedContent = fixedContent.replace(
    /\s+([a-z-]+)=""/gi,
    ''
  );

  // Fix any remaining broken class structures
  fixedContent = fixedContent.replace(
    /class="([^"]*)" ([a-z-]+)="" /gi,
    'class="$1 $2" '
  );

  // Remove any duplicate spaces in class names
  fixedContent = fixedContent.replace(/class="([^"]*)"/g, (match, classes) => {
    const cleanClasses = classes.split(/\s+/).filter(Boolean).join(' ');
    return `class="${cleanClasses}"`;
  });

  console.log('\n---Fixed content preview:');
  console.log(fixedContent.substring(0, 500));

  // Update the activity
  const { error: updateError } = await supabase
    .from('activities')
    .update({ content: fixedContent })
    .eq('id', 61);

  if (updateError) {
    console.error('Error updating activity:', updateError);
    return;
  }

  console.log('\n✅ Activity 61 content fixed successfully!');
}

fixActivity61().catch(console.error);
