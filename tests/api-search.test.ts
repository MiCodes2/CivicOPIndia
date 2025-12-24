import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/search/route';

// Mock createClient
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: vi.fn().mockImplementation((name: string, params: any) => {
      if (name === 'search_activities') {
        return Promise.resolve({ data: [{ id: '1', title: 'Test Activity', content: 'some content', activity_date: '2020-01-01' }], error: null });
      }
      if (name === 'search_activities_count') {
        return Promise.resolve({ data: [{ search_activities_count: 1 }], error: null });
      }
      if (name === 'search_facets') {
        return Promise.resolve({ data: [{ types: [{ type: 'Other', count: 1 }], tags: [{ tag: 'test', count: 1 }] }], error: null });
      }
      return Promise.resolve({ data: [], error: null });
    })
  })
}));

describe('GET /api/search', () => {
  it('returns results, total and facets', async () => {
    const req = new Request('http://localhost/api/search?q=test');
    const res = await GET(req);
    const json = await res.json();
    expect(json.results.length).toBe(1);
    expect(json.total).toBe(1);
    expect(json.facets).toBeDefined();
    expect(json.facets.types[0].type).toBe('Other');
    expect(json.facets.tags[0].tag).toBe('test');
  });
});
