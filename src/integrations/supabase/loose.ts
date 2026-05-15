// Loose-typed Supabase client wrapper. Use until generated types catch up with the schema.
import { supabase as typed } from "./client";
export const supabase = typed as any;
