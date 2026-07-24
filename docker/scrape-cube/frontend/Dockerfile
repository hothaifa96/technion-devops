FROM node:24.18.0-trixie as builder

WORKDIR /app

COPY pack*.json ./

RUN npm install 

COPY . .

RUN npm run build

FROM nginx

COPY --from=builder /app/build /usr/share/nginx/html

CMD ["nginx","-g","daemon off;"]