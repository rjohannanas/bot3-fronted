FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY pnpm-lock.yaml package.json ./

# Instalar pnpm
RUN npm install -g pnpm@9

# Instalar todas las dependencias (producción y desarrollo) para la construcción
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Construir la aplicación Next.js
RUN pnpm run build

# Crear una imagen final ligera
FROM node:20-alpine AS runner

WORKDIR /app

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copiar dependencias de producción
COPY --from=builder /app/node_modules ./node_modules

# Copiar archivos de la aplicación
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Cambiar propietario de los archivos
RUN chown -R nextjs:nodejs .next

# Cambiar a usuario no root
USER nextjs

# Exponer el puerto
EXPOSE 3000

# Entorno de producción
ENV NODE_ENV=production

# Iniciar la aplicación Next.js
CMD ["npm", "start"]

# Comentario: Esta imagen usa el modo de producción de Next.js y es optimizada para Cloud Run.