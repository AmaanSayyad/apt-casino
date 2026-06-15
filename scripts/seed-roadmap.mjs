#!/usr/bin/env node
/**
 * Upsert public roadmap into Supabase.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Dynamic import of ESM config from src (via relative path — no bundler)
const { mapPublicRoadmapToDbRows, PUBLIC_ROADMAP_ITEMS } = await import(
  '../src/lib/config/publicRoadmap.js'
);

const supabase = createClient(url, key, { auth: { persistSession: false } });
const rows = mapPublicRoadmapToDbRows();
const keepIds = new Set(PUBLIC_ROADMAP_ITEMS.map((r) => r.id));

// Remove milestones dropped from the curated public list (e.g. superseded by tier listings).
const { data: existing } = await supabase.from('roadmap_items').select('id');
const staleIds = (existing ?? []).map((r) => r.id).filter((id) => !keepIds.has(id));
if (staleIds.length > 0) {
  const { error: delErr } = await supabase.from('roadmap_items').delete().in('id', staleIds);
  if (delErr) {
    console.warn('Could not delete stale roadmap rows:', delErr.message);
  } else {
    console.log(`Removed ${staleIds.length} stale roadmap item(s)`);
  }
}

const { error } = await supabase.from('roadmap_items').upsert(rows, { onConflict: 'id' });

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log(`Seeded ${PUBLIC_ROADMAP_ITEMS.length} roadmap items into public.roadmap_items`);
