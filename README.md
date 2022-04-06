# How to use this repo

- Clone this repo
- copy .env.example to .env
- Run command: `npm install`
- Run command: `node ace generate:key`. This command will generate. Copy that key set as APP_KEY in .env file.

**This repo includes all auth routes with user registration**

## Deply script


cd /home/forge/project-folder

git pull origin $FORGE_SITE_BRANCH

npm install --no-save

npm run build


#pm2 start npm --name "site-domain" --watch -- start (first time only)

pm2 restart site-domain

node ace migration:run
