import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env.PORT || 3005;
const BASE_PATH = '/api/v1';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'The5FadeFriends Auth API',
      version: '1.0.0',
      description: 'Swagger documentation for AuthService',
    },
    servers: [
      {
        url: `http://localhost:${PORT}${BASE_PATH}`,
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['src/**/*.routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
