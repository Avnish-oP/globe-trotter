@echo off
cd backend

if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
)

echo Starting GlobeTrotter backend server...
npm start
