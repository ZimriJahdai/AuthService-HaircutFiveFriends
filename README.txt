NODE_ENV=development
PORT=3005
 
# Database PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_NAME=HaircutFiveFriends
DB_USERNAME=root
DB_PASSWORD=admin
DB_SQL_LOGGING=false
 
# JWT Configuration
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=The5FadeFriends
JWT_AUDIENCE=The5FadeFriends
 
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_ENABLE_SSL=true
SMTP_USERNAME=tomaniston78@gmail.com
SMTP_PASSWORD=pytr wxge eaqp ygrk
EMAIL_FROM=tomaniston78@gmail.com
EMAIL_FROM_NAME=Auth HaircutFiveFriends
 
# Cloudinary (upload de perfiles)
CLOUDINARY_CLOUD_NAME=djuxr89ny
CLOUDINARY_API_KEY=756418949615516
CLOUDINARY_API_SECRET=kueZn4ZlPo8fPEI6LwiYtnwTBiQ
CLOUDINARY_BASE_URL=https://res.cloudinary.com/djuxr89ny/image/upload/
CLOUDINARY_FOLDER=HaircutFiveFriends/images
CLOUDINARY_DEFAULT_AVATAR_FILENAME=default-avatar_ewzxwx.png
 
# File Upload
UPLOAD_PATH=./uploads
 
# Frontend URL
FRONTEND_URL=http://localhost:5173
 
# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ADMIN_ALLOWED_ORIGINS=http://localhost:5173
 
# Verification Tokens (en horas)
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1