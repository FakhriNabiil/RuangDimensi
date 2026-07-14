# Cara Setup Project

Monorepo ini terdiri dari dua bagian: `backend/` (Flask) dan `frontend/` (React + Vite).

## Prasyarat

- Node.js 18+
- Python 3.11 atau 3.12 (hindari 3.14)
- MiniStack + StackPort sudah aktif atau menggunakan docker compose

isi ```docker-compose.yml```
```
services:
  stackport:
    image: davireis/stackport:latest
    ports:
      - "8080:8080"
    environment:
      - AWS_ENDPOINT_URL=http://ministack:4566
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
    depends_on:
      ministack:
        condition: service_healthy

```

## 1. Clone

```bash
git clone https://github.com/FakhriNabiil/RuangDimensi.git
cd RuangDimensi
```

## 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: ./venv/Scripts/Activate.ps1
pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
```

Isi `.env`:

```env
# Flask
JWT_SECRET=change-me-to-a-random-secret-string
JWT_EXPIRY_HOURS=24

# Frontend
FRONTEND_URL=http://localhost:5173

# AWS / MiniStack
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# DynamoDB Tables
DYNAMODB_USERS_TABLE=Users
DYNAMODB_ASSETS_TABLE=Assets

# S3
S3_BUCKET_NAME=3d-assets-store

# EC2 worker simulation
WORKER_COUNT=3
WORKER_FAULT_RATE=0.2
```

Jalankan:

```bash
flask run
```

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # Windows: copy .env.example .env
```

Isi `.env`:

```env
VITE_API_URL=http://127.0.0.1:5000
VITE_S3_BASE_URL=http://localhost:4566
VITE_S3_BUCKET=3d-asset-store
```

Jalankan:

```bash
npm run dev
```

Frontend jalan di `http://localhost:5173`