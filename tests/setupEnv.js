process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/clinic_test';
process.env.JWT_SECRET = 'this-is-a-dummy-jwt-secret-with-at-least-32-chars';
process.env.CLINIC_TZ = 'Asia/Hebron';
process.env.COOKIE_SECURE = 'false';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
