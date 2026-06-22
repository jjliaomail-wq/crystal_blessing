const fs = require('fs');
const https = require('https');
const envContent = fs.readFileSync('C:/Antigravity/P9/.env', 'utf8');
const keyMatch = envContent.match(/UNSPLASH_KEY=(.*)/);
const unsplashKey = keyMatch[1].trim();
const destDir = 'c:/Antigravity/P14/public/images/crystals/';

const missing = [
  { q: 'Moonstone gem', f: 'moonstone.jpg' },
  { q: 'Tiger Eye stone', f: 'tiger-eye.jpg' },
  { q: 'Sodalite stone', f: 'sodalite.jpg' },
  { q: 'Pyrite stone', f: 'pyrite.jpg' }
];

async function downloadImage(query, filename) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashKey}&per_page=1`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            const file = fs.createWriteStream(destDir + filename);
            https.get(json.results[0].urls.small, imgRes => {
              imgRes.pipe(file);
              file.on('finish', () => { file.close(); console.log('Downloaded ' + filename); resolve(); });
            }).on('error', err => reject(err));
          } else { console.log('Still no results for ' + query); resolve(); }
        } catch (e) { resolve(); }
      });
    }).on('error', err => reject(err));
  });
}

(async function() {
  for (let m of missing) { await downloadImage(m.q, m.f); await new Promise(r => setTimeout(r, 1000)); }
})();
