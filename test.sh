#!/bin/bash

docker build --tag l0coful/puppeteer-api .
docker run -d -p 8000:8000 --restart unless-stopped --name puppeteer-api -e "SALT=abcdef" l0coful/puppeteer-api
sleep 5s
curl -X POST -H "Content-Type: application/json" -d '{"url": "http://example.com","hash":"129f2756eac7b62b5b7f428175e5a4e3"}' http://localhost:8000/scrape
docker logs puppeteer-api
docker stop puppeteer-api
docker rm puppeteer-api