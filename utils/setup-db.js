// Script untuk setup database Supabase
const { setupDatabase } = require('./schema/setup');

// Jalankan setup database
setupDatabase()
  .then(() => {
    console.log('Database setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error setting up database:', error);
    process.exit(1);
  }); 