import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin client for privileged operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Fetch the cost of a real tree from the `rewards` table (category = 'real_tree').
// If not found, fallback to 2000 points.
async function getTreeCost(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('rewards')
    .select('points_cost')
    .eq('category', 'real_tree')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching tree cost:', error.message);
    // Fallback to default if any issue occurs
    return 2000;
  }

  return data?.points_cost ?? 2000;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create a request-specific Supabase client to get the user.
    // This method relies on the user's JWT being passed in the Authorization header.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError?.message ?? 'User not found.');
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Determine the cost of a real tree redemption
    const TREE_COST = await getTreeCost();

    // 3. Fetch the user's current profile from the 'profiles' table using the admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('total_points, real_tree_redemption_pending')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError.message);
      throw new Error('Failed to fetch user profile.');
    }

    // 4. Check for pending redemption and sufficient points
    if (profile.real_tree_redemption_pending) {
      return new Response(JSON.stringify({ error: 'A real tree redemption is already pending.' }), {
        status: 409, // Conflict
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.total_points < TREE_COST) {
      return new Response(JSON.stringify({ error: 'Not enough points to redeem a real tree.' }), {
        status: 403, // Forbidden
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Update the user's profile
    const newTotalPoints = profile.total_points - TREE_COST;
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        total_points: newTotalPoints,
        real_tree_redemption_pending: true, 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError.message);
      throw new Error('Failed to update user profile.');
    }

    // 6. Create a record in the 'real_tree_requests' table for tracking
    console.log('Inserting into real_tree_requests for user:', user.id);
    const { data: requestData, error: insertError } = await supabaseAdmin
      .from('real_tree_requests')
      .insert({
        user_id: user.id,
        points_cost_at_request: TREE_COST,
        status: 'approved_and_collected', // Set to auto-approved
      }).select().single();

    if (insertError) {
      console.error('CRITICAL: Error inserting into real_tree_requests:', insertError.message);
    }
    
    // 7. Add the tree to the user's "real forest"
    if (requestData) {
        const { error: collectError } = await supabaseAdmin
            .from('collected_real_trees')
            .insert({
                user_id: user.id,
                name: `My Real Tree #${(Math.random() * 1000).toFixed(0)}`, // Default name
                species: 'TBC by Greenity',
                date_redeemed: requestData.requested_at,
            });

        if (collectError) {
            console.error('CRITICAL: Error inserting into collected_real_trees:', collectError.message);
        }
    }


    return new Response(JSON.stringify({ success: true, message: 'Real tree redemption successful! It has been added to your forest.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
