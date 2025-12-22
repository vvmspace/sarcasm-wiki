#!/bin/bash

# cd to the directory of the script
cd $(dirname $0)

git checkout .
git pull
npm i
npm run dev:pm2:restart:cron