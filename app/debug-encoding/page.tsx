"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatContent } from '@/lib/formatContent';

export default function DebugEncodingPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('activities')
        .select('id, title, content')
        .limit(3)
        .order('id', { ascending: false });
      setActivities(data || []);
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Encoding Debug Page</h1>
      
      {activities.map(activity => (
        <div key={activity.id} className="mb-8 border p-4 rounded">
          <h2 className="font-bold mb-2">Activity {activity.id}</h2>
          
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Raw Database Content:</h3>
            <pre className="text-xs bg-gray-100 p-2 overflow-x-auto">
              {activity.content?.substring(0, 300)}
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600">After formatContent():</h3>
            <pre className="text-xs bg-gray-100 p-2 overflow-x-auto">
              {formatContent(activity.content || '').substring(0, 300)}
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Rendered with dangerouslySetInnerHTML:</h3>
            <div 
              className="bg-white p-2 border"
              dangerouslySetInnerHTML={{ __html: formatContent(activity.content || '') }}
            />
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600">Detection:</h3>
            <ul className="text-sm">
              <li>Contains ': {activity.content?.includes("'") ? '✓ YES' : '✗ NO'}</li>
              <li>Contains &#039;: {activity.content?.includes('&#039;') ? '⚠️ YES' : '✓ NO'}</li>
              <li>Contains &amp;#039;: {activity.content?.includes('&amp;#039;') ? '⚠️ YES' : '✓ NO'}</li>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
