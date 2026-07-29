const allowedOrigins = [
  'https://movil-haircutfivefriends-production.up.railway.app',
  'https://authservice-haircutfivefriends-production.up.railway.app',
  'https://frontend-haircutfivefriends-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8081',
];

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
