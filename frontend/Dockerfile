# Stage 1: Build the application
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and lock file
COPY package*.json ./
COPY package-lock.json* ./

# Install all dependencies including devDependencies for building
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Development stage
FROM node:22-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./

# Install all dependencies including devDependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the development server port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host"]

# Stage 3: Production stage
FROM nginx:alpine AS production

# Copy the built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

# Set the default target to production
FROM production
