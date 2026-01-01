const { formatContent } = require('./lib/formatContent.ts');

const testContent = `A recent viral post titled "As if the roads aren't trash enough already" captures a reality.`;

console.log('=== INPUT ===');
console.log(testContent);

console.log('\n=== AFTER formatContent ===');
const formatted = formatContent(testContent);
console.log(formatted);

console.log('\n=== HEX CHECK ===');
const match = formatted.match(/aren.{0,10}t/);
if (match) {
  console.log('Found:', match[0]);
  console.log('HEX:', Buffer.from(match[0]).toString('hex'));
}
