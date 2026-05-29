# ValidatorAI Frontend

Next.js App Router frontend for the Karnataka KCET ValidatorAI platform.

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:5000`.

The frontend only calls backend REST APIs through Axios. It does not import database clients or Mongoose.
