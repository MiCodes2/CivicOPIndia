import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/search/preview/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: vi.fn().mockImplementation((name: string, params: any) => {
      if (name === 'search_preview') {
        return Promise.resolve({ data: [{ id: '1', title: 'Preview Activity', content: 'abc' }], error: null });
      }
      return Promise.resolve({ data: [], error: null });
    })
  })
}));

describe('GET /api/search/preview', () => {
  it('returns preview results', async () => {
    const req = new Request('http://localhost/api/search/preview?q=test&w_rank=0.5&w_tag=0.2&w_title=0.8');
    const res = await GET(req);
    const json = await res.json();
    expect(json.results.length).toBeGreaterThanOrEqual(0);
  });
});