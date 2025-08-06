# -------- Backend build --------
FROM node:18 AS backend-build

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ ./
RUN npm run build


# -------- Frontend build --------
FROM node:18 AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ ./
RUN npm run build


# -------- Production container --------
FROM node:18 AS app

WORKDIR /app

# Copy built backend files
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package*.json ./backend/

# Copy built frontend build to backend/public
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Install only prod dependencies for backend
WORKDIR /app/backend
RUN npm ci --only=production

# Expose port
EXPOSE 5000

# Start backend (which also serves frontend)
CMD ["node", "dist/index.js"]
