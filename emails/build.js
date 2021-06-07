const fs = require('fs');

const layout = fs.readFileSync('emails/layout.html', { encoding: 'utf8' });
if (!fs.existsSync('emails/full')) {
  fs.mkdirSync('emails/full');
}

fs.readdirSync('emails/templates', { encoding: 'utf-8' }).forEach(file => {
  const part = fs.readFileSync(`emails/templates/${file}`, {
    encoding: 'utf8',
  });
  const template = layout.replace('$$$Content$$$', part);
  fs.writeFileSync(`emails/full/${file}`, template, {
    encoding: 'utf8',
  });
});
