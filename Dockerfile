FROM node:16-bullseye as build

WORKDIR /app

COPY ./package.json ./package.json

COPY ./yarn.lock ./yarn.lock

RUN yarn install

COPY ./src ./src

COPY ./tsconfig.json ./tsconfig.json

RUN mkdir -p /out

RUN yarn build && mv ./dist /out/bot

RUN mv ./node_modules /out/node_modules


FROM node:16-alpine as runner 

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/none" \
    --shell "/sbin/nologin" \
    --no-create-home \
    bot

WORKDIR /app

COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/bot ./

RUN chown -R bot:bot /app

USER bot

CMD ["node", "index.js"]
