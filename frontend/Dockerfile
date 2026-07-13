FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn frontend
COPY . .

# Expose cổng của Vite
EXPOSE 5173

# Khởi chạy dev server
CMD ["npm", "run", "dev", "--", "--host"]
