const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fungsi untuk menjalankan perintah shell
function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to execute ${command}`, error);
    return false;
  }
  return true;
}

// Periksa apakah .env sudah ada
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.log('Creating .env file from .env.example');
  fs.copyFileSync(
    path.join(__dirname, '.env.example'),
    path.join(__dirname, '.env')
  );
}

// Instal dependensi
console.log('Installing dependencies...');
if (!runCommand('npm install')) {
  process.exit(1);
}

console.log('\n');
console.log('='.repeat(50));
console.log('Setup completed successfully!');
console.log('='.repeat(50));
console.log('\nTo start the development server, run:');
console.log('\n  npm run dev');
console.log('\nTo deploy to Vercel:');
console.log('\n  1. Push your code to GitHub');
console.log('  2. Import your repository in Vercel dashboard');
console.log('  3. Configure environment variables in Vercel dashboard');
console.log('\nEnjoy your application!'); 