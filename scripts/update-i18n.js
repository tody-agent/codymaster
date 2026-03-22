const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, '../public/i18n');
const langs = fs.readdirSync(i18nDir);
for (const lang of langs) {
  const commonFile = path.join(i18nDir, lang, 'common.json');
  if (fs.existsSync(commonFile)) {
    const data = JSON.parse(fs.readFileSync(commonFile, 'utf8'));
    if (data.nav) {
      if (!data.nav.playbook) data.nav.playbook = "Playbook";
      if (!data.nav.cli) data.nav.cli = "CLI";
      fs.writeFileSync(commonFile, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Updated ${lang}/common.json`);
    }
  }
}
