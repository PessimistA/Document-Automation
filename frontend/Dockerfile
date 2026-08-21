# Hafif bir Node.js imajı kullan
FROM node:22-alpine

WORKDIR /app

# Sadece paket listelerini kopyalayıp npm install yap
COPY package*.json ./
RUN npm install

# Kalan tüm React kodlarımızı kopyala
COPY . .

# Vite sunucusunu Docker dışından erişilebilir hale getir
CMD ["npm", "run", "dev", "--", "--host"]