---
title: "NoSQL Injection"
tag: "web"
difficulty: "moyen"
goal: "contourner l'authentification ou extraire des données en exploitant des requêtes NoSQL mal sécurisées"
fix: "Validation des entrées, parameterized queries, principe du moindre privilège, sanitization, ORM/ODM"
---

# Théorie

## Définition

L'injection NoSQL exploite les requêtes mal sécurisées vers des bases de données NoSQL (MongoDB, CouchDB, etc.) pour contourner l'authentification, extraire des données ou modifier le comportement applicatif.

## Origine de la vulnérabilité

Les applications construisent des requêtes en concaténant directement les entrées utilisateur sans validation. Contrairement au SQL, NoSQL utilise des structures JSON/objets permettant d'injecter des opérateurs spéciaux ($ne, $gt, $where, $regex) qui modifient la logique de la requête.

## Contextes d'apparition

- Formulaires d'authentification sans validation stricte du type
- APIs REST acceptant des objets JSON arbitraires
- Filtres de recherche dynamiques
- Query builders non sécurisés
- Applications Node.js + MongoDB sans ORM/ODM

## Principe d'exploitation

Un attaquant envoie des objets JSON contenant des opérateurs MongoDB au lieu de valeurs simples. Par exemple, `{"username": {"$ne": null}}` transforme une comparaison d'égalité en condition "différent de null", retournant tout utilisateur valide. Le problème fondamental est la **confiance aveugle dans les entrées utilisateur**.

---

# Lab

## Objectif

Exploiter une application vulnérable aux injections NoSQL pour comprendre les mécanismes d'attaque et les mesures de sécurisation.

## Configuration

Application Node.js + MongoDB en environnement Docker isolé.

## Architecture

```
Client → Node.js App (Port 3000) → MongoDB (Port 27017)
```

**Flux normal** : Requêtes légitimes avec valeurs simples  
**Flux attaqué** : Injection d'opérateurs MongoDB via JSON pour modifier la logique

## Techniques d'exploitation

1. **Bypass d'authentification** : Utilisation de `$ne` pour contourner la vérification
2. **Extraction de données** : Regex injection avec `$regex` pour énumérer les utilisateurs
3. **Exécution JavaScript** : Opérateur `$where` pour injecter du code

# Débrief

## Pourquoi ça a marché?

1. **Absence de validation du type** : acceptation d'objets JSON complexes sans vérification
2. **Construction dynamique de requêtes** : concaténation directe des inputs
3. **Manque de sanitization** : opérateurs MongoDB ($ne, $gt, $regex) non filtrés
4. **Confiance dans le Content-Type** : traitement automatique du JSON sans contrôle
5. **Absence de whitelist** : aucune restriction sur les champs autorisés

## Localisation des vulnérabilités

### Niveau Application
- Pas de vérification que les inputs sont des strings simples
- Passage direct des objets JSON dans les requêtes MongoDB
- Acceptation de toute structure JSON

### Niveau Validation
- Absence de schéma de validation (Joi, Yup)
- Pas de type checking côté serveur
- Pas de whitelist de champs
- Traitement aveugle du JSON

### Niveau Architecture
- Absence d'ORM/ODM avec requêtes paramétrées
- Mots de passe non hashés
- Absence de rate limiting
- Logs insuffisants pour la détection

## Corrections

{{fix}}

### Stratégies de protection

#### Validation (Priorité haute)

- **Validation stricte du type** : schémas Joi/Yup pour garantir types et formats
- **Sanitization** : bibliothèques comme express-mongo-sanitize pour filtrer les opérateurs ($, .)
- **Whitelist stricte** : n'accepter que les champs explicitement autorisés avec types validés

#### ORM/ODM (Mongoose)

- **Mode strict** : schémas Mongoose avec validation automatique des types
- **strictQuery activé** : ignorer les champs non définis dans le schéma
- **Requêtes paramétrées** : utiliser l'abstraction de l'ORM plutôt que requêtes directes

#### Sécurité générale

- **Hashing des mots de passe** : bcrypt/argon2 pour le stockage
- **Rate limiting** : limiter les tentatives sur endpoints sensibles
- **Désactivation de $where** : bloquer l'exécution JavaScript en production
- **Principe du moindre privilège** : utilisateur MongoDB avec permissions minimales

#### Monitoring et détection

- **Logging des anomalies** : détecter les tentatives d'injection (types non-string)
- **WAF** : filtrer les patterns suspects ($ne, $gt, $regex)
- **Alertes** : notification sur requêtes malformées

### Principes clés

- **Ne jamais faire confiance aux entrées utilisateur**
- **Valider TYPE + CONTENU** systématiquement
- **Traiter JSON comme potentiellement malveillant**
- **Defense in depth** : validation + ORM + monitoring + WAF
- **NoSQL n'est pas "No Injection"** : les injections existent aussi en NoSQL
