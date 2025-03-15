# Stellar Navigation Computer

A retro-style BBS terminal interface for navigating star systems.

## Features
- View nearest star systems
- Warp to different locations
- Procedurally generated star names
- ASCII table display
- Classic terminal interface

## Try It
Visit [https://stevedeeds.github.io/ST/](https://stevedeeds.github.io/ST/)

## Commands
- `?` - Show available commands
- `l` - List nearest star systems
- `w####` - Warp to system (e.g., W0627)

## Local Development
1. Clone the repository
2. Start a local server:
```bash
cd public
npm start
```
3. Visit `http://localhost:8000`

## Production
```bash
npm run build
firebase deploy --only hosting
```