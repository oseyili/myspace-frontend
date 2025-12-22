databases:
  - name: myspace-db
    plan: free
    region: virginia
    postgresMajorVersion: "18"

services:
  # --------------------
  # BACKEND (Node API)
  # --------------------
  - type: web
    name: myspace-backend
    runtime: node
    repo: https://github.com/oseyili/myspace-backend
    branch: main
    plan: free
    region: virginia
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: myspace-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production

staticSites:
  # --------------------
  # FRONTEND (Vite)
  # --------------------
  - name: myspace-frontend
    repo: https://github.com/oseyili/myspace-frontend
    branch: main
    plan: free
    region: virginia
    buildCommand: npm ci && npm run build
    publishPath: dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://myspace-backend.onrender.com
