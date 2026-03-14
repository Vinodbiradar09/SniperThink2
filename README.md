# Sniperthink2 — File Processing System

Upload a PDF or TXT file, and the system will process it in the background and tell you the word count, paragraph count, and top keywords.

## How it works

1. You upload a file via the API
2. The system saves the file and creates a job
3. A background worker picks up the job and processes the file
4. You can check the job status anytime
5. Once done, you can fetch the results

## Requirements

- Node.js 22+
- Docker Desktop

## Running locally without Docker

Install dependencies:
```bash
npm install
```

Set up your `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sniperthink2?schema=public"
PORT=4005
REDIS_URL=redis://localhost:6379
```

Run migrations:
```bash
npx prisma migrate dev --name init 
npx prisma generate 
```

Build the project:
```bash
npm run build
```

Start the three processes in separate terminals:
```bash
# Terminal 1 — API server
npm start

# Terminal 2 — Worker
npm run start:worker

# Terminal 3 — Watchdog
npm run start:watchdog
```

## Running with Docker
```bash
docker compose up --build
```

That's it. All three services start automatically.

API runs on `http://localhost:4006`

## API Endpoints

**Upload a file**
```
POST /api/uploads
Body: form-data
  - name: your name
  - email: your email
  - file: .txt or .pdf (max 10MB)
```

**Check job status**
```
GET /api/jobs/:jobId/status
```

**Get results**
```
GET /api/jobs/:jobId/result
```

## Example

Upload a file and you get back a job ID:
```json
{
  "message": "File uploaded successfully",
  "jobId": "abc-123"
}
```

Check the status:
```json
{
  "jobId": "abc-123",
  "status": "processing",
  "progress": 60
}
```

Once completed, get the results:
```json
{
  "jobId": "abc-123",
  "wordCount": 1200,
  "paragraphCount": 35,
  "topKeywords": ["system", "data", "process"]
}
```

## Job States

- `PENDING` — job is waiting to be picked up
- `PROCESSING` — worker is actively processing the file
- `COMPLETED` — processing done, results are ready
- `FAILED` — something went wrong after 3 retries
