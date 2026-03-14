# Stage 1: Build Frontend
FROM node:18-slim AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Final Image (Python Backend + Static Frontend)
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend assets from Stage 1 to a static folder in the backend
COPY --from=build-frontend /app/frontend/dist ./static

# Expose port (Easypanel usually listens on 80 or 8080)
EXPOSE 8080

# Environment variables (to be set in Easypanel)
ENV DATABASE_URL=sqlite:///./storage/scannercv.db
ENV PORT=8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
