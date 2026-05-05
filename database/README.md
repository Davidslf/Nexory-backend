# Base de Datos NEXORY

## Instalación

1. **Crear la base de datos:**
```bash
mysql -u root -p < schema.sql
```

2. **Opcional - Insertar datos de ejemplo:**
```bash
mysql -u root -p < seed.sql
```

## Nota sobre Passwords

Los passwords en `seed.sql` son placeholders. Para generar passwords reales:

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('tu_password', 10);
console.log(hash);
```

Luego actualiza el `seed.sql` con el hash generado.

## Usuarios por Defecto

- **Admin:** admin@nexory.com / admin123
- **Operador:** operator@nexory.com / operator123

⚠️ **IMPORTANTE:** Cambia estos passwords en producción.
