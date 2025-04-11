# Deployment Guide for EzerAI

This guide provides instructions for deploying the EzerAI application in various environments.

## Prerequisites

Before deploying EzerAI, ensure you have the following:

- Node.js (v16+)
- npm (v8+)
- PostgreSQL (v14+)
- Git

## Local Development Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ezerai.git
cd ezerai
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set Up Environment Variables

```bash
# In the server directory
cp .env.example .env
```

Edit the `.env` file with your database credentials and other configuration:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ezerai
DB_USER=yourusername
DB_PASSWORD=yourpassword

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

# ShiFi Integration
SHIFI_CLIENT_ID=your_shifi_client_id
SHIFI_CLIENT_SECRET=your_shifi_client_secret
SHIFI_REDIRECT_URI=http://localhost:5000/api/shifi/callback

# CRM Integrations
GHL_CLIENT_ID=your_ghl_client_id
GHL_CLIENT_SECRET=your_ghl_client_secret
GHL_REDIRECT_URI=http://localhost:5000/api/crm/ghl/callback

CLOSE_CLIENT_ID=your_close_client_id
CLOSE_CLIENT_SECRET=your_close_client_secret
CLOSE_REDIRECT_URI=http://localhost:5000/api/crm/close/callback

HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:5000/api/crm/hubspot/callback
```

### 4. Set Up the Database

```bash
# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE ezerai;"
psql -U postgres -c "CREATE USER yourusername WITH PASSWORD 'yourpassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ezerai TO yourusername;"

# Run database migrations
cd ../server
npm run db:migrate
```

### 5. Start the Development Servers

```bash
# Start the backend server
npm run dev

# In a separate terminal, start the frontend
cd ../client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Production Deployment

### Option 1: Traditional Server Deployment

#### 1. Prepare the Server

Install Node.js, npm, and PostgreSQL on your server.

#### 2. Clone and Set Up the Repository

```bash
git clone https://github.com/yourusername/ezerai.git
cd ezerai

# Install dependencies
cd server
npm install --production
cd ../client
npm install
npm run build
```

#### 3. Set Up Environment Variables

Create a `.env` file in the server directory with production settings:

```
PORT=5000
NODE_ENV=production
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=ezerai_prod
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_production_jwt_secret
# Add other production environment variables
```

#### 4. Set Up the Database

```bash
# Create the PostgreSQL database on your production server
psql -U postgres -c "CREATE DATABASE ezerai_prod;"
psql -U postgres -c "CREATE USER your_production_db_user WITH PASSWORD 'your_production_db_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ezerai_prod TO your_production_db_user;"

# Run database migrations
cd ../server
NODE_ENV=production npm run db:migrate
```

#### 5. Configure Nginx as a Reverse Proxy

Install Nginx:

```bash
sudo apt-get update
sudo apt-get install nginx
```

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/ezerai
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        root /path/to/ezerai/client/build;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/ezerai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Set Up PM2 for Process Management

Install PM2:

```bash
npm install -g pm2
```

Start the server with PM2:

```bash
cd /path/to/ezerai/server
pm2 start server.js --name "ezerai-api"
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

#### 1. Create a Dockerfile for the Server

Create a file named `Dockerfile` in the server directory:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### 2. Create a Dockerfile for the Client

Create a file named `Dockerfile` in the client directory:

```dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create a file named `nginx.conf` in the client directory:

```nginx
server {
    listen 80;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://server:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. Create a Docker Compose File

Create a file named `docker-compose.yml` in the root directory:

```yaml
version: '3'

services:
  postgres:
    image: postgres:14-alpine
    container_name: ezerai-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ezerai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  server:
    build: ./server
    container_name: ezerai-server
    depends_on:
      - postgres
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ezerai
      DB_USER: postgres
      DB_PASSWORD: postgres
      JWT_SECRET: your_production_jwt_secret
      # Add other environment variables
    ports:
      - "5000:5000"
    restart: unless-stopped

  client:
    build: ./client
    container_name: ezerai-client
    depends_on:
      - server
    ports:
      - "80:80"
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 4. Build and Run with Docker Compose

```bash
docker-compose up -d
```

### Option 3: Cloud Deployment (AWS)

#### 1. Set Up AWS Resources

- Create an EC2 instance (t2.micro or larger)
- Set up an RDS PostgreSQL database
- Configure a security group to allow traffic on ports 22, 80, 443, and 5000

#### 2. Deploy the Application

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

Install Git, Node.js, and other dependencies:

```bash
sudo yum update -y
sudo yum install -y git
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 16
```

Clone the repository and set up the application:

```bash
git clone https://github.com/yourusername/ezerai.git
cd ezerai

# Install and build client
cd client
npm install
npm run build

# Install server dependencies
cd ../server
npm install --production
```

Create a `.env` file with your AWS RDS database credentials and other settings.

Start the server:

```bash
npm install -g pm2
pm2 start server.js --name "ezerai-api"
pm2 save
pm2 startup
```

#### 3. Set Up Nginx

```bash
sudo amazon-linux-extras install nginx1
sudo systemctl start nginx
sudo systemctl enable nginx
```

Configure Nginx as described in the traditional server deployment section.

## SSL Configuration

For production deployments, it's recommended to secure your application with SSL:

### Using Let's Encrypt

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Update your Nginx configuration to redirect HTTP to HTTPS:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Rest of your configuration...
}
```

## Continuous Integration/Continuous Deployment (CI/CD)

### GitHub Actions

Create a file named `.github/workflows/deploy.yml`:

```yaml
name: Deploy EzerAI

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install client dependencies
      run: |
        cd client
        npm install
        
    - name: Build client
      run: |
        cd client
        npm run build
        
    - name: Install server dependencies
      run: |
        cd server
        npm install
        
    - name: Deploy to production server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/ezerai
          git pull
          cd client
          npm install
          npm run build
          cd ../server
          npm install --production
          pm2 restart ezerai-api
```

## Monitoring and Logging

### PM2 Monitoring

```bash
pm2 monit
```

### Setting Up Application Logging

Update the server.js file to include logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'ezerai-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Use logger throughout your application
```

## Backup and Disaster Recovery

### Database Backup

Set up a cron job to regularly backup your PostgreSQL database:

```bash
crontab -e
```

Add the following line to backup the database daily at 2 AM:

```
0 2 * * * pg_dump -U postgres ezerai > /path/to/backups/ezerai_$(date +\%Y\%m\%d).sql
```

### Automated Backup Rotation

Create a script to manage backup rotation:

```bash
#!/bin/bash
# backup_rotation.sh

BACKUP_DIR="/path/to/backups"
DAYS_TO_KEEP=7

# Remove backups older than DAYS_TO_KEEP
find $BACKUP_DIR -name "ezerai_*.sql" -type f -mtime +$DAYS_TO_KEEP -delete
```

Make the script executable and add it to cron:

```bash
chmod +x backup_rotation.sh
crontab -e
```

Add the following line to run the rotation script daily at 3 AM:

```
0 3 * * * /path/to/backup_rotation.sh
```

## Troubleshooting

### Common Issues and Solutions

1. **Database Connection Issues**
   - Check database credentials in .env file
   - Ensure PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify network connectivity: `telnet your_db_host 5432`

2. **Node.js Server Won't Start**
   - Check for syntax errors in server code
   - Verify port availability: `netstat -tuln | grep 5000`
   - Check logs: `pm2 logs ezerai-api`

3. **Nginx Configuration Issues**
   - Test configuration: `sudo nginx -t`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

4. **SSL Certificate Problems**
   - Verify certificate paths in Nginx configuration
   - Check certificate expiration: `openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem`

## Performance Optimization

1. **Enable Nginx Caching**

   Add to your Nginx configuration:

   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=ezerai_cache:10m max_size=1g inactive=60m;
   
   server {
       # Other configurations...
       
       location /api {
           proxy_cache ezerai_cache;
           proxy_cache_valid 200 10m;
           proxy_cache_bypass $http_pragma;
           proxy_cache_revalidate on;
           # Other proxy settings...
       }
   }
   ```

2. **Database Optimization**

   - Add indexes to frequently queried columns
   - Configure connection pooling in the server configuration
   - Consider implementing query caching

3. **Node.js Performance**

   - Use clustering to take advantage of multiple CPU cores
   - Implement proper error handling and memory management
   - Consider using a load balancer for horizontal scaling

## Security Considerations

1. **Implement Rate Limiting**

   Add rate limiting middleware to protect against brute force attacks:

   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests from this IP, please try again after 15 minutes'
   });
   
   app.use('/api/', apiLimiter);
   ```

2. **Set Security Headers**

   Use Helmet.js to set security headers:

   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

3. **Implement CORS Properly**

   ```javascript
   const cors = require('cors');
   
   const corsOptions = {
     origin: process.env.NODE_ENV === 'production' 
       ? 'https://yourdomain.com' 
       : 'http://localhost:3000',
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization']
   };
   
   app.use(cors(corsOptions));
   ```

## Scaling the Application

As your user base grows, consider these scaling strategies:

1. **Vertical Scaling**
   - Upgrade to more powerful servers with more CPU, RAM, and storage

2. **Horizontal Scaling**
   - Deploy multiple instances of the application behind a load balancer
   - Implement sticky sessions or use Redis for session storage

3. **Database Scaling**
   - Implement read replicas for read-heavy workloads
   - Consider database sharding for very large datasets

4. **Microservices Architecture**
   - Break down the monolithic application into microservices
   - Use message queues for asynchronous communication between services

## Conclusion

This deployment guide covers various options for deploying the EzerAI application, from local development to production environments. Choose the deployment strategy that best fits your requirements and infrastructure.

For additional support or questions, please contact the development team or refer to the project documentation.
