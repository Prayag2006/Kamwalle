
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const app = initializeApp({
  projectId: 'kamwala-app-xyz123'
});

getAuth().listUsers(10)
  .then((listUsersResult) => {
    console.log('Successfully fetched users:', listUsersResult.users.length);
    process.exit(0);
  })
  .catch((error) => {
    console.log('Error fetching users:', error);
    process.exit(1);
  });
