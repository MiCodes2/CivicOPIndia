const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)(?:\/[^&\s]*)?/gi;
const driveRegex = /https?:\/\/(?:www\.)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(?:view|preview)(?:\?[^&\s]*usp=sharing)?/gi;

const twitterUrl = 'https://x.com/east_bengaluru/status/1813571389799960733/video/1';
const driveUrl = 'https://drive.google.com/file/d/1i6FrEGJEM_TTEhm0oq0krL8216yd759S/view?usp=sharing';

console.log('Twitter URL:', twitterUrl);
const twitterMatch = twitterRegex.exec(twitterUrl);
console.log('Twitter match:', twitterMatch);
if (twitterMatch) {
  const [, username, tweetId] = twitterMatch;
  console.log('Username:', username, 'Tweet ID:', tweetId);
  console.log('Embed URL:', `https://platform.x.com/embed/Tweet.html?id=${tweetId}`);
}

console.log('\nDrive URL:', driveUrl);
const driveMatch = driveRegex.exec(driveUrl);
console.log('Drive match:', driveMatch);
if (driveMatch) {
  const [, fileId] = driveMatch;
  console.log('File ID:', fileId);
  console.log('Embed URL:', `https://drive.google.com/file/d/${fileId}/preview`);
}