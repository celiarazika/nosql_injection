FROM node:20-alpine

# Métadonnées OBLIGATOIRES
LABEL maintainer="DIABLE Team"
LABEL description="NoSQL Injection Lab - Educational vulnerable application"
LABEL version="1.0"

WORKDIR /app

# Installer curl pour health check
RUN apk add --no-cache curl

COPY package*.json ./

RUN npm install

COPY . .

# Variables d'environnement
ENV DEBUG_MODE=false
ENV MONGODB_URI=mongodb://mongodb:27017/vulnerable_app
ENV NODE_ENV=development

EXPOSE 3000

# Health check OBLIGATOIRE
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
