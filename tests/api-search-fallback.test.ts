import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/search/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: vi.fn().mockImplementation((name: string, params: any) => {
      if (name === 'search_activities') return Promise.resolve({ data: [], error: null });
      if (name === 'search_activities_count') return Promise.resolve({ data: [{ search_activities_count: 2 }], error: null });
      if (name === 'search_facets') return Promise.resolve({ data: [{ types: [], tags: [] }], error: null });
      if (name === 'search_trigram') return Promise.resolve({ data: [{ id: 't1', title: 'Trigram result', content: 'x' }], error: null });
      return Promise.resolve({ data: [], error: null });
    })
  })
}));

describe('GET /api/search fallback', () => {
  it('falls back to trigram when primary returns no results', async () => {
    const req = new Request('http://localhost/api/search?q=fuzzy');
    const res = await GET(req);
    const json = await res.json();
    expect(json.fallback).toBe(true);
    expect(json.results.length).toBe(1);
  });
});
