const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, 'src/environments/environment.prod.ts');
const apiUrl = process.env.API_URL || 'http://localhost:3000/api/v1';

const content = `export const environment = {
    production: true,
    apiUrl: '${apiUrl}'
};
`;

fs.writeFileSync(envFile, content);
console.log(`Environment file updated with API_URL: ${apiUrl}`);
