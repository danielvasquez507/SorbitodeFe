# Sorbito de Fé

Aplicación web de gestión financiera personal que integra IMAP para leer correos de notificaciones bancarias, clasificarlos con **Google Gemini AI**, y visualizarlos en un dashboard con gráficos interactivos.

## Tecnologías

**Frontend:** React 18, Vite, TailwindCSS, Recharts, TanStack Query  
**Backend:** Node.js, Express, Better-SQLite3  
**IA:** Google Gemini API (gemini-3.5-flash-lite)  
**Infra:** Docker Compose

## Características

- 📧 Sincronización automática de correos bancarios vía IMAP
- 🤖 Clasificación de comercios con IA (Gemini)
- 📊 Gráficos de evolución y distribución por categoría
- 🧾 Gestión de Pagos (deudas, pagos parciales y totales)
- 📐 Matriz Global de gastos por responsable y categoría
- 🔄 Terminal de Procesos con historial de ejecuciones
- 📋 Historial de Transacciones con filtros avanzados

## Configuración

Copia el archivo de ejemplo y completa tus credenciales:

```bash
cp backend/.env.example backend/.env
```

### Variables requeridas (`backend/.env`)

```env
IMAP_USER=tu_correo@gmail.com
IMAP_PASSWORD=tu_app_password
IMAP_HOST=imap.gmail.com
GEMINI_API_KEY=tu_api_key
```

## Levantar con Docker

```bash
docker-compose up -d
```

La aplicación estará disponible en `http://localhost:3000`.
