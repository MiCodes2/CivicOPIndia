"use client";

import { useState } from 'react';

export default function EncodingTestPage() {
  const [test1] = useState("This is a test with an apostrophe: don't");
  const [test2] = useState("This has &#039; entity");
  const [test3] = useState("This has &amp;#039; double encoded");
  
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-6">Entity Encoding Test</h1>
      
      <div className="border p-4 rounded bg-white">
        <h2 className="font-bold mb-2">Test 1: Normal apostrophe in string</h2>
        <p className="mb-2 text-sm text-gray-600">String: {JSON.stringify(test1)}</p>
        <div className="border-l-4 border-blue-500 pl-4">
          <div dangerouslySetInnerHTML={{ __html: test1 }} />
        </div>
      </div>

      <div className="border p-4 rounded bg-white">
        <h2 className="font-bold mb-2">Test 2: String with &#039; entity</h2>
        <p className="mb-2 text-sm text-gray-600">String: {JSON.stringify(test2)}</p>
        <div className="border-l-4 border-blue-500 pl-4">
          <div dangerouslySetInnerHTML={{ __html: test2 }} />
        </div>
      </div>

      <div className="border p-4 rounded bg-white">
        <h2 className="font-bold mb-2">Test 3: String with &amp;#039; double encoded</h2>
        <p className="mb-2 text-sm text-gray-600">String: {JSON.stringify(test3)}</p>
        <div className="border-l-4 border-blue-500 pl-4">
          <div dangerouslySetInnerHTML={{ __html: test3 }} />
        </div>
      </div>

      <div className="border p-4 rounded bg-yellow-50">
        <h2 className="font-bold mb-2">What you should see:</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Test 1: "don't" with normal apostrophe</li>
          <li>Test 2: "don't" with normal apostrophe (entity should decode)</li>
          <li>Test 3: "&#039;" literally displayed (because &amp; prevents decoding)</li>
        </ul>
      </div>

      <div className="border p-4 rounded bg-green-50">
        <h2 className="font-bold mb-2">📝 Quick Fix Test</h2>
        <p className="mb-4">Type something with an apostrophe in a real post editor, then check if it displays correctly here.</p>
        <div className="bg-white p-3 border rounded">
          Type: We're testing isn't working
        </div>
      </div>
    </div>
  );
}
