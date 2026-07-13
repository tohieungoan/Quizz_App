FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy code backend
COPY . .

# Expose cổng 3000
EXPOSE 3000

# Khởi chạy backend
CMD ["npm", "start"]
