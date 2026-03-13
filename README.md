# D1Shop - Aplicación híbrida

App web para compra en línea de productos de la canasta familiar (D1). Incluye **Inicio** (categorías y ofertas), **Carrito** y **Método de pago**, según el mockup.

## Requisitos

- Node.js 18+
- PostgreSQL con la base de datos `d1shop` creada

## Base de datos

1. Crear la base de datos y tablas (usa el script que tienes en tu carpeta):
   ```bash
   psql -U postgres -d d1shop -f "ruta\a\d1shop_database.sql"
   ```
2. Insertar usuario demo para probar la app:
   ```bash
   psql -U postgres -d d1shop -f seed-demo-user.sql
   ```
   Si el script principal ya inserta usuarios, omite este paso.

## Configuración

1. Copiar variables de entorno:
   ```bash
   copy .env.example .env
   ```
2. Editar `.env` con tu usuario y contraseña de PostgreSQL.

## Instalación y ejecución

```bash
cd d1shop-app
npm install
npm start
```

Abre en el navegador: **http://localhost:3000**

## Estructura

```
d1shop-app/
├── server.js          # API Express + PostgreSQL
├── package.json
├── .env.example
├── seed-demo-user.sql  # Usuario demo (opcional)
├── public/
│   ├── index.html     # SPA (3 pantallas)
│   ├── manifest.json  # PWA
│   ├── css/styles.css
│   └── js/
│       ├── api.js     # Llamadas al backend
│       └── app.js     # Navegación y vistas
└── README.md
```

## Pantallas (mockup)

- **Inicio**: búsqueda, categorías (Electrónica, Moda, Hogar, Belleza), ofertas destacadas y productos por categoría.
- **Carrito**: ítems con cantidad (+/-), eliminar, total y botones "Regresar a la Tienda" / "Continuar a la Compra".
- **Pago**: datos de tarjeta, opciones en línea (PayPal, Google Pay, etc.), resumen del pedido y "Proceder con la Compra".

La barra inferior permite ir a Inicio, Carrito y Pago. La app puede usarse como PWA (instalable en móvil) usando el `manifest.json`.
