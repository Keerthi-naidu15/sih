import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

walk('./src', filePath => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Handle text gradients
    content = content.replace(/bg-clip-text\s+text-transparent\s+bg-gradient-to-[a-z]+\s+from-[^\s]+\s+(via-[^\s]+\s+)?to-[^\s]+/g, 'text-green-500');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-[^\s]+\s+(via-[^\s]+\s+)?to-[^\s]+\s+bg-clip-text\s+text-transparent/g, 'text-green-500');

    // Handle background gradients
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-emerald-600\s+to-lime-500/g, 'bg-emerald-600');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-green-600\s+to-emerald-400/g, 'bg-green-600');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-green-600\s+to-emerald-500/g, 'bg-green-600');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-green-500\s+to-emerald-600/g, 'bg-green-600');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-green-[0-9]+\s+(via-[^\s]+\s+)?to-[^\s]+/g, 'bg-green-600');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-blue-[0-9]+\s+(via-[^\s]+\s+)?to-[^\s]+/g, 'bg-blue-600');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-orange-[0-9]+\s+(via-[^\s]+\s+)?to-[^\s]+/g, 'bg-orange-600');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-\[#241710\]\s+via-\[#3d2719\]\s+to-\[#241710\]/g, 'bg-[#3d2719]');
    content = content.replace(/bg-gradient-to-[a-z]+\s+from-gray-900\s+to-\[#0a0a0a\]/g, 'bg-gray-900');

    // Handle template literals dynamic classes
    content = content.replace(/'from-green-600 to-green-400'/g, "'bg-green-600'");
    content = content.replace(/'from-blue-600 to-blue-400'/g, "'bg-blue-600'");
    content = content.replace(/'from-orange-600 to-orange-400'/g, "'bg-orange-600'");
    content = content.replace(/bg-gradient-to-r \$\{theme\.btn\}/g, '${theme.btn}');

    // Clean up residual
    content = content.replace(/bg-clip-text text-transparent/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  }
});
