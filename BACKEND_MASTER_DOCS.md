# Documentación Maestra del Backend - Garage System

Este documento detalla la arquitectura, funcionamiento interno, estructuras de datos y lógica de negocio del backend desarrollado en **NestJS**.

---

## 1. Arquitectura General

El proyecto sigue una arquitectura modular basada en **NestJS**, utilizando **TypeORM** para la base de datos (PostgreSQL) y **Redis** para caché y manejo de sesiones/bloqueos.

### Tecnologías Clave
*   **Framework:** NestJS (Node.js)
*   **Base de Datos:** PostgreSQL 15
*   **ORM:** TypeORM (Patrón Repository)
*   **Caché/Session:** Redis 7
*   **Real-time:** Socket.IO (Gateway)
*   **Colas/Email:** Nodemailer (Simulado/SMTP)

---

## 2. Estructura de Carpetas (`/src`)

El código está organizado por **Módulos de Dominio**. Cada carpeta representa una funcionalidad completa.

```text
src/
├── app.module.ts           # Módulo raíz que importa todo.
├── main.ts                 # Punto de entrada (Bootstrap, CORS, Pipes).
├── appointments/           # Lógica de Citas (Agendamiento).
├── auth/                   # Login, Registro, Recuperación de Pass.
├── common/                 # Utilidades compartidas (Constantes, Configs).
├── guards/                 # Seguridad (Roles, Dueño de Vehículo).
├── jwt/                    # Manejo de Tokens (Creación/Verificación).
├── mail/                   # Servicio de envío de correos.
├── notifications/          # WebSockets (Socket.io) para alertas.
├── redis/                  # Conexión y servicios de Redis.
├── schedules/              # Disponibilidad de Mecánicos.
├── users/                  # Gestión de Usuarios (Admin, Mecánico, Cliente).
├── vehicles/               # Gestión de Autos.
└── work-orders/            # Órdenes de Trabajo (Reparaciones).
```

---

## 3. Base de Datos y Entidades (Modelos)

A continuación, se detallan las entidades principales y sus relaciones.

### A. Usuario (`User`)
Tabla: `user`
*   **Roles:** `ADMIN`, `MECHANIC`, `CLIENT`.
*   **Relaciones:**
    *   `OneToMany` -> `Vehicle` (Un cliente tiene muchos autos).
    *   `OneToMany` -> `Appointment` (Como cliente o como mecánico).
    *   `OneToMany` -> `MechanicSchedule` (Un mecánico tiene muchos horarios).

### B. Vehículo (`Vehicle`)
Tabla: `vehicle`
*   **Datos:** Patente, Marca, Modelo, Año, Color.
*   **Relaciones:**
    *   `ManyToOne` -> `User` (Dueño).
    *   `OneToMany` -> `WorkOrder` (Historial de reparaciones).

### C. Orden de Trabajo (`WorkOrder`)
Tabla: `work_order`
*   **Core del Negocio.** Representa una reparación.
*   **Estados:** `PENDING_APPROVAL`, `IN_PROGRESS`, `WAITING_PARTS`, `COMPLETED`, `CANCELLED`.
*   **Relaciones:**
    *   `ManyToOne` -> `Vehicle`.
    *   `ManyToOne` -> `User` (Mecánico asignado).
    *   `OneToMany` -> `WorkOrderItem` (Repuestos y Servicios).

### D. Ítem de Orden (`WorkOrderItem`)
Tabla: `work_order_item`
*   **Tipos:** `SPARE_PART` (Repuesto), `SERVICE` (Mano de obra).
*   **Lógica:** Puede requerir aprobación del cliente si el precio cambia.

### E. Horario Mecánico (`MechanicSchedule`)
Tabla: `mechanic_schedule`
*   Define qué días y horas trabaja un mecánico.
*   **Estructura:**
    *   `date`: Fecha (YYYY-MM-DD).
    *   `availableHours`: Array de strings `["09:00", "10:00"]`.

### F. Cita (`Appointment`)
Tabla: `appointment`
*   Reserva de un bloque de tiempo.
*   **Estados:** `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`.
*   **Validación:** No puede solaparse con otra cita del mismo mecánico (margen de 1 hora).

---

## 4. Módulos y Funcionamiento Detallado

### Módulo de Autenticación (`AuthModule`)
*   **Login:** Valida credenciales contra la BD. Si falla 3 veces, bloquea la cuenta usando Redis (`LOGIN_BLOCK`).
*   **Tokens:** Genera JWTs con propósitos específicos (`SESSION`, `CONFIRM_EMAIL`, `RESET_PASSWORD`).
*   **Seguridad:** Las contraseñas se hashean con `bcryptjs`.

### Módulo de Guardias (`Guards`)
*   **`JwtAuthGuard`:** Verifica que el token sea válido y no haya expirado.
*   **`RoleGuard`:** Verifica si el usuario tiene el rol necesario (`@Roles(ROLE.ADMIN)`).
*   **`VehicleOwnerGuard`:** Asegura que un cliente solo pueda ver/editar sus propios autos.

### Módulo de Citas y Horarios (`Schedules` & `Appointments`)
1.  **Disponibilidad:** El endpoint `GET /schedules/available` busca en la BD todos los `MechanicSchedule` futuros que tengan horas disponibles.
2.  **Crear Cita:**
    *   El cliente envía `mechanicId`, `vehicleId` y `date`.
    *   El sistema verifica si el mecánico tiene esa hora en su `availableHours`.
    *   Si es válido, crea la `Appointment` y **remueve** esa hora del `availableHours` del mecánico para que nadie más la tome.

### Módulo de Órdenes de Trabajo (`WorkOrders`)
1.  **Creación:** El mecánico crea la orden asociada a una patente.
2.  **Flujo de Aprobación:**
    *   Si se agregan ítems, el estado puede pasar a `PENDING_APPROVAL`.
    *   El cliente debe aprobar los costos desde su interfaz.
3.  **Finalización:** Al pasar a `COMPLETED`, se notifica al cliente.

### Módulo de Notificaciones (`Notifications`)
*   **Tecnología:** WebSockets (Socket.IO).
*   **Funcionamiento:**
    *   El frontend se conecta al Gateway.
    *   Cuando ocurre un evento (ej. "Auto Listo"), el backend emite un evento `notification` a la sala privada del usuario (`user_ID`).
    *   También se guardan en BD para ver el historial (`GET /notifications/unread`).

---

## 5. Configuración y Variables de Entorno (`.env`)

El sistema se configura mediante variables de entorno críticas:

*   `ADMIN_EMAILS`: Lista separada por comas de correos que se convierten en ADMIN automáticamente al loguearse.
*   `JWT_SECRET`: Clave para firmar tokens.
*   `DATABASE_...`: Credenciales de conexión a Postgres.
*   `REDIS_...`: Conexión a Redis.

---

## 6. Comandos de Mantenimiento

*   **Levantar Entorno:** `docker compose up -d`
*   **Ver Logs:** `docker compose logs -f backend`
*   **Reiniciar Backend:** `docker compose restart backend`
*   **Limpiar Todo (Reset):** `docker compose down -v` (Borra BD y volúmenes).

---

## 7. Seguridad Implementada

1.  **Rate Limiting:** Protección contra fuerza bruta en login (Redis).
2.  **Data Sanitization:** Uso de DTOs con `class-validator` y `class-transformer` para limpiar entradas.
3.  **Role-Based Access Control (RBAC):** Decoradores personalizados para restringir endpoints.
4.  **Safe Entities:** Funciones utilitarias (`toSafeUser`) para eliminar contraseñas antes de enviar respuestas JSON.

---

## 8. Catálogo Completo de Endpoints

A continuación, se listan todos los endpoints disponibles, sus métodos HTTP, roles requeridos y parámetros.

### Autenticación (`/auth`)
| Método | Endpoint | Rol | Descripción | Body/Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth` | Público | Registro de usuario nuevo. | `{ email, password, name }` |
| `POST` | `/auth/login` | Público | Iniciar sesión. | `{ email, password }` |
| `POST` | `/auth/request-password-reset` | Público | Solicitar cambio de contraseña. | `{ email }` |
| `POST` | `/auth/reset-password` | Público | Cambiar contraseña con token. | Query: `token`, Body: `{ newPassword }` |
| `POST` | `/auth/request-unlock` | Público | Solicitar desbloqueo de cuenta. | `{ email }` |
| `GET` | `/auth/confirm-email` | Público | Confirmar email de registro. | Query: `token` |
| `GET` | `/auth/unlock-account` | Público | Desbloquear cuenta. | Query: `token` |

### Usuarios (`/users`)
| Método | Endpoint | Rol | Descripción | Body/Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Auth | Ver mi perfil. | - |
| `PATCH` | `/users/me` | Auth | Actualizar mi perfil. | `{ name, phone }` |
| `PATCH` | `/users/me/password` | Auth | Cambiar mi contraseña. | `{ oldPassword, newPassword }` |
| `DELETE` | `/users/me` | Auth | Eliminar mi cuenta. | - |
| `POST` | `/users/create-mechanic` | **ADMIN** | Crear un usuario Mecánico. | `{ email, password, name }` |
| `GET` | `/users` | **ADMIN** | Listar todos los usuarios. | - |
| `PATCH` | `/users/:id/role` | **ADMIN** | Cambiar rol de usuario. | `{ role: 'ADMIN' | 'MECHANIC' }` |
| `DELETE` | `/users/:id` | **ADMIN** | Eliminar usuario por ID. | - |

### Vehículos (`/users/me/vehicles`)
| Método | Endpoint | Rol | Descripción | Body/Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users/me/vehicles` | **CLIENT** | Listar mis vehículos. | - |
| `POST` | `/users/me/vehicles` | **CLIENT** | Agregar vehículo. | `{ licensePlate, brand, model, year, color }` |
| `PATCH` | `/users/me/vehicles/:id` | **CLIENT** | Editar vehículo. | `{ brand, model, ... }` |
| `DELETE` | `/users/me/vehicles/:id` | **CLIENT** | Eliminar vehículo. | - |
| `PATCH` | `/users/me/vehicles/:id/status` | **MECHANIC** | Cambiar estado (Disponible/En Taller). | `{ status: 'AVAILABLE' | 'IN_SERVICE' }` |

### Horarios (`/schedules`)
| Método | Endpoint | Rol | Descripción | Body/Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/schedules/available` | Auth | Ver horarios disponibles (Futuros). | - |
| `POST` | `/schedules` | **MECHANIC** | Crear horario de trabajo. | `{ date: 'YYYY-MM-DD', availableHours: ['09:00'] }` |
| `GET` | `/schedules/my` | **MECHANIC** | Ver mis horarios creados. | - |
| `PATCH` | `/schedules/:id` | **MECHANIC** | Editar horas de un día. | `{ availableHours: [...] }` |
| `DELETE` | `/schedules/:id` | **MECHANIC** | Eliminar un día de trabajo. | - |

### Citas (`/appointments`)
| Método | Endpoint | Rol | Descripción | Body/Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/appointments` | **CLIENT** | Solicitar cita. | `{ mechanicId, vehicleId, date: 'YYYY-MM-DDTHH:mm' }` |
| `GET` | `/appointments/client` | **CLIENT** | Ver mis citas. | - |
| `GET` | `/appointments/mechanic` | **MECHANIC** | Ver citas solicitadas a mí. | - |
| `PATCH` | `/appointments/:id/accept` | **MECHANIC** | Aceptar cita. | - |
| `PATCH` | `/appointments/:id/reject` | **MECHANIC** | Rechazar cita. | `{ reason: '...' }` |
| `DELETE` | `/appointments/:id` | **CLIENT** | Cancelar cita pendiente. | - |

### Órdenes de Trabajo (`/work-orders`)
| Método | Endpoint | Rol | Descripción | Body/Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/work-orders` | **MECHANIC** | Crear orden de trabajo. | `{ licensePlate, description, estimatedCost, items: [] }` |
| `GET` | `/work-orders/mechanic` | **MECHANIC** | Ver mis órdenes asignadas. | - |
| `GET` | `/work-orders/client` | **CLIENT** | Ver historial de mis autos. | - |
| `PATCH` | `/work-orders/:id` | **MECHANIC** | Actualizar estado general. | `{ status: 'COMPLETED' }` |
| `POST` | `/work-orders/:id/items` | **MECHANIC** | Agregar repuestos/servicios. | `{ items: [{ name, type, price }] }` |
| `PATCH` | `/work-orders/items/:itemId/approve` | **CLIENT** | Aprobar ítem extra. | - |
| `POST` | `/work-orders/:id/notes` | Auth | Agregar nota/comentario. | `{ content, imageUrl }` |
