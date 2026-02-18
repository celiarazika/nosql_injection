const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir des fichiers statiques
app.use(express.static('public'));

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/vulnerable_app';
let db;

// Connexion à MongoDB
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
  .then(client => {
    console.log('✓ Connected to MongoDB');
    db = client.db();
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });

// ENDPOINT VULNÉRABLE 1: Login avec injection NoSQL
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // VULNÉRABILITÉ: Pas de validation du type
    // Accepte directement les objets JSON
    const user = await db.collection('users').findOne({
      username: username,
      password: password
    });

    if (user) {
      res.json({
        success: true,
        message: 'Login successful!',
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          secret: user.secret
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// ENDPOINT VULNÉRABLE 2: Recherche avec injection NoSQL
app.post('/search', async (req, res) => {
  try {
    const { username } = req.body;

    // VULNÉRABILITÉ: Construction de requête avec input non validé
    const users = await db.collection('users').find({
      username: username
    }).toArray();

    if (users.length > 0) {
      res.json({
        success: true,
        count: users.length,
        users: users.map(u => ({
          username: u.username,
          email: u.email,
          role: u.role
        }))
      });
    } else {
      res.json({
        success: false,
        message: 'No users found'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// ENDPOINT VULNÉRABLE 3: Recherche avec $where
app.post('/advanced-search', async (req, res) => {
  try {
    const { query } = req.body;

    // VULNÉRABILITÉ CRITIQUE: $where avec JavaScript injection
    const users = await db.collection('users').find({
      $where: query
    }).toArray();

    res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        username: u.username,
        email: u.email,
        role: u.role
      }))
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Query error',
      error: err.message
    });
  }
});

// Endpoint de liste (non vulnérable)
app.get('/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}).toArray();
    res.json({
      success: true,
      users: users.map(u => ({
        username: u.username,
        email: u.email,
        role: u.role
      }))
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Health check endpoint (DIABLE standard)
app.get('/health', async (req, res) => {
  try {
    // Vérifier la connexion MongoDB
    const pingResult = await db.admin().ping();
    const dbStatus = pingResult.ok === 1 ? 'ok' : 'error';
    
    const healthCheck = {
      status: 'healthy',
      service: 'nosql-injection-lab',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
          type: 'MongoDB',
          uri: 'mongodb://mongodb:27017/vulnerable_app'
        },
        application: {
          status: 'ok',
          uptime: process.uptime()
        }
      }
    };

    res.status(200).json(healthCheck);
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'nosql-injection-lab',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// Reset endpoint (DIABLE standard)
app.post('/reset', async (req, res) => {
  try {
    // Supprimer tous les utilisateurs
    await db.collection('users').deleteMany({});
    
    // Réinsérer les données initiales
    await db.collection('users').insertMany([
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

    res.json({
      success: true,
      message: 'Database reset successfully',
      users_restored: 4
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Reset failed',
      error: err.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
