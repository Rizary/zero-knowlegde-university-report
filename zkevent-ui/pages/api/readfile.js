// File: pages/api/my-json.js

import fs from 'fs';
import path from 'path';

export default (req, res) => {
  // Let's say your json is in /public/assets/my-json.json
  const filePath = path.resolve('./public', 'zkproof', 'merkleproof.wasm');
  const jsonA = fs.readFileSync(filePath);

  res.statusCode = 200
  res.json({result: jsonA});
}