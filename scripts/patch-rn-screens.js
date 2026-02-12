const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-screens',
  'ios',
  'RNSScreenStackHeaderConfig.mm'
);

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('#include <utility>')) {
    content = '#include <utility>\n' + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Patched RNSScreenStackHeaderConfig.mm: added #include <utility>');
  } else {
    console.log('RNSScreenStackHeaderConfig.mm already patched');
  }
} else {
  console.log('RNSScreenStackHeaderConfig.mm not found, skipping patch');
}
