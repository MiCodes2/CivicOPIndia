import { describe, it, expect, vi } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/search/stopwords/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [{ id: 1, word: 'the' }], error: null }),
    insert: vi.fn().mockResolvedValue({ data: [{ id: 2, word: 'and' }], error: null }),
    delete: vi.fn().mockResolvedValue({ data: [{ id: 2 }], error: null }),
  })
}));

describe('Search stopwords API', () => {
  it('GET returns list', async () => {
    const req = new Request('http://localhost/api/search/stopwords');
    const res = await GET(req);
    const json = await res.json();
    expect(json.stopwords).toBeDefined();
  });

  it('POST inserts', async () => {
    const req = new Request('http://localhost/api/search/stopwords', { method: 'POST', body: JSON.stringify({ word: 'and' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    const json = await res.json();
    expect(json.inserted).toBeDefined();
  });

  it('DELETE removes', async () => {
    const req = new Request('http://localhost/api/search/stopwords?id=2', { method: 'DELETE' });
    const res = await DELETE(req);
    const json = await res.json();
    expect(json.deleted).toBeDefined();
  });
});