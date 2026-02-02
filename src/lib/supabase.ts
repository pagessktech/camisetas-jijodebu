import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utuicwdncxmtzvtthowr.supabase.co';
const supabaseAnonKey = 'sb_publishable_SzR7bY2V_DNU3ciG2i_7eQ_dp_oNoaw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
