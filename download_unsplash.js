const fs = require('fs');
const path = require('path');
const https = require('https');

// Extract Unsplash Key from P9 .env since P14 .env doesn't have it
const envContent = fs.readFileSync('C:/Antigravity/P9/.env', 'utf8');
const keyMatch = envContent.match(/UNSPLASH_KEY=(.*)/);
const unsplashKey = keyMatch ? keyMatch[1].trim() : '';

const queries = [
  "Amethyst raw crystal stone macro",
  "Rose Quartz raw crystal stone",
  "Black Obsidian raw stone",
  "Clear Quartz crystal point macro",
  "Citrine raw crystal stone",
  "Moonstone gem macro",
  "Labradorite rough stone flash",
  "Aquamarine raw crystal stone",
  "Tiger Eye rough stone macro",
  "Green Phantom Quartz crystal",
  "Rhodonite rough stone",
  "Smoky Quartz raw crystal",
  "Moldavite rough tektite stone",
  "Sodalite raw blue stone",
  "Malachite rough green stone macro",
  "Garnet raw red crystal stone",
  "Lapis Lazuli raw blue stone gold flecks",
  "Black Tourmaline rough stone",
  "Fluorite raw crystal stone",
  "Pyrite fool's gold rough stone macro"
];

const names = [
  "amethyst", "rose-quartz", "obsidian", "clear-quartz", "citrine",
  "moonstone", "labradorite", "aquamarine", "tiger-eye", "phantom",
  "rhodonite", "smoky-quartz", "moldavite", "sodalite", "malachite",
  "garnet", "lapis", "tourmaline", "fluorite", "pyrite"
];

const destDir = path.join(__dirname, 'public', 'images', 'crystals');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

async function downloadImage(query, filename) {
  return new Promise((resolve, reject) => {
    const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashKey}&per_page=1`;
    https.get(searchUrl, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            // Get the regular sized image
            const imgUrl = json.results[0].urls.small;
            
            const file = fs.createWriteStream(path.join(destDir, filename));
            https.get(imgUrl, imgRes => {
              imgRes.pipe(file);
              file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${filename}`);
                resolve();
              });
            }).on('error', err => reject(err));
          } else {
            console.log(`No results for ${query}`);
            resolve();
          }
        } catch (e) {
          console.error(e);
          resolve();
        }
      });
    }).on('error', err => reject(err));
  });
}

async function run() {
  for (let i = 0; i < queries.length; i++) {
    await downloadImage(queries[i], `${names[i]}.jpg`);
    await new Promise(r => setTimeout(r, 1000)); // Rate limit 1 req/sec
  }
  console.log("Done!");
}

run();
