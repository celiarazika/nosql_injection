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

// Route principale
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>NoSQL Injection Lab</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .endpoint {
          background: #f9f9f9;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #007bff;
        }
        code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1> NoSQL Injection Lab</h1>
        <p>Application volontairement vulnérable à des fins pédagogiques</p>
        
        <div class="warning">
          <strong> Avertissement</strong><br>
          Cette application contient des vulnérabilités intentionnelles. Ne jamais déployer en production!
        </div>

        <h2>Endpoints disponibles</h2>
        
        <div class="endpoint">
          <strong>POST /login</strong><br>
          Authentification utilisateur (VULNÉRABLE)<br>
          Body: <code>{"username": "admin", "password": "Admin123!"}</code>
        </div>

        <div class="endpoint">
          <strong>POST /search</strong><br>
          Recherche d'utilisateurs (VULNÉRABLE)<br>
          Body: <code>{"username": "alice"}</code>
        </div>

        <div class="endpoint">
          <strong>GET /users</strong><br>
          Liste tous les utilisateurs (sans secrets)
        </div>

        <h2>Utilisateurs de test</h2>
        <ul>
          <li>admin / Admin123!</li>
          <li>alice / alice2024</li>
          <li>bob / bobsecure</li>
          <li>charlie / charlie456</li>
        </ul>

        <h2>Objectifs</h2>
        <ol>
          <li>Contourner l'authentification sans connaître le mot de passe</li>
          <li>Extraire le secret de l'admin</li>
          <li>Énumérer tous les utilisateurs</li>
          <li>Utiliser les opérateurs $ne, $gt, $regex, $where</li>
        </ol>
      </div>
    </body>
    </html>
  `);
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
