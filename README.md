# fragments

Web API using node

Used various extensions, started installing npm and then prettier, ESLint, Logging and Pino, and several other packages.

Prettier: npm install --save-dev --save-exact prettier
(made files which explain how to format and what to ignore when formatting.)

ESLint: npm init @eslint/config@latest
(install based in how youll be needing to lint)
(audit fix any vulnerabilities, make configureing file )
(add lint to scripts and check)

Logging and Pino: npm install --save pino pino-pretty pino-http
(make logger.js to configure the instance)

App Setup: npm install --save express cors helmet compression
(cors: middleware that tracks the session of the user,
Helmet: protecting app from vulnerabilities)

Server Setup: npm install --save stoppable
(make server file and run lint to make sure no errors - npm run lint)

Running curl: curl http://localhost:8080 (works with curl.exe instead in powershell)
Running jq: curl -s localhost:8080 | jq (works with .exe for both curl and jq)

Checking right headers: curl -i localhost:8080 (also curl.exe)

Adding lint, start, dev, and debug to scripts (will automatically start the server)
"scripts": {
"test": "echo \"Error: no test specified\" && exit 1",
"lint": "eslint \"./src/\*_/_.js\"",
"start": "node src/server.js",
"dev": "node --env-file=debug.env --watch ./src/server.js",
"debug": "node --env-file=debug.env --inspect=0.0.0.0:9229 --watch ./src/server.js"
},

{start runs the server, dev runs in "watch" mode, and debug is dev but with node inspector on port 9229 so a debugger can be attached}

Start: npm start
Dev: npm run dev
Debug: npm run debug

Then, added debug script to allow connecting a debugger like VSCode. End with commit.
