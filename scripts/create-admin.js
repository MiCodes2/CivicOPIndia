const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'citizens.east.blr@gmail.com',
      password: 'Change@2025',
      options: {
        emailRedirectTo: undefined,
      }
    });

    if (error) {
      console.error('Error creating admin:', error.message);
      process.exit(1);
    }

    console.log('✓ Admin account created successfully!');
    console.log('Email:', 'citizens.east.blr@gmail.com');
    console.log('Password:', 'Change@2025');
    console.log('\nNote: If email confirmation is enabled in Supabase, check the email inbox.');
    console.log('Otherwise, you can log in immediately at http://localhost:3000/admin/login');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createAdmin();
