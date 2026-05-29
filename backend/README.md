# ValidatorAI KCET Backend

Express.js + TypeScript + MongoDB Atlas backend for Karnataka KCET counselling.

```bash
npm install
copy .env.example .env
npm run dev
```

Required env vars:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_with_a_long_random_secret
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
PORT=5000
CLIENT_URL=http://localhost:3000
```

Useful commands:

```bash
npm run seed
npm run ingest:cutoffs
npm run build
npm start
```

Key routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/predict`
- `POST /api/upload-pdf`
- `POST /api/ai/counsel`
- `POST /api/ai/compare`
