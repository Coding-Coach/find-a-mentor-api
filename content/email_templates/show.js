const express = require('express')
const fs = require('fs');

const app = express()
const port = 3003;
const layout = fs.readFileSync('content/email_templates/layout.html', {encoding: 'utf8'});

function injectData(template, data) {
  return template.replace(/{{(.*?)}}/, (_,prop) => data[prop]);
}

app.get('/:templateName', function (req, res) {
  const {templateName} = req.params;
  const template = fs.readFileSync(`content/email_templates/${templateName}.html`, {encoding: 'utf8'});
  const content = injectData(layout.replace('$$$Content$$$', template), {
    name: 'Brent'
  });
  res.send(content);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});