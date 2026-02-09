// Script d'initialisation de la base de données
db = db.getSiblingDB('vulnerable_app');

// Création de la collection users
db.createCollection('users');

// Insertion des utilisateurs de test
db.users.insertMany([
  {
    username: 'admin',
    password: 'Admin123!',
    email: 'admin@vulnerable.local',
    role: 'admin',
    secret: 'FLAG{nosql_injection_master}'
  },
  {
    username: 'alice',
    password: 'alice2024',
    email: 'alice@vulnerable.local',
    role: 'user',
    secret: 'Ma couleur préférée est le bleu'
  },
  {
    username: 'bob',
    password: 'bobsecure',
    email: 'bob@vulnerable.local',
    role: 'user',
    secret: 'Mon film préféré est Matrix'
  },
  {
    username: 'charlie',
    password: 'charlie456',
    email: 'charlie@vulnerable.local',
    role: 'moderator',
    secret: 'Je collectionne les timbres'
  }
]);

print('Database initialized with test users');
