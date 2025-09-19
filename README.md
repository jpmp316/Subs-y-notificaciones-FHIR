


# 📘 Proyecto FHIR con HAPI + RabbitMQ + Callback Node.js

Este proyecto levanta una infraestructura simple para manejar notificaciones de **FHIR Subscriptions** usando:

* [HAPI FHIR JPA Server](https://hapifhir.io) como servidor FHIR.
* [RabbitMQ](https://www.rabbitmq.com/) como broker de mensajería.
* Un **servicio callback en Node.js** que recibe notificaciones de HAPI y las publica en RabbitMQ.

---

## 📦 Requisitos

* [Docker](https://www.docker.com/get-started)
* [Docker Compose](https://docs.docker.com/compose/install/)
* Al menos **2 GB de RAM libre** (HAPI puede consumir bastante memoria).

---

## 🚀 Cómo ejecutar el proyecto

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/jpmp316/Subs-y-notificaciones-FHIR.git
   cd Subs-y-notificaciones-FHIR
   ```

2. **Levantar los contenedores**

   ```bash
   docker-compose up --build
   ```

   Esto levanta:

   * HAPI FHIR en [http://localhost:8080/fhir](http://localhost:8080/fhir)
   * RabbitMQ con consola en [http://localhost:15672](http://localhost:15672) (user: `guest`, pass: `guest`)
   * Callback service en [http://localhost:3000](http://localhost:3000)

   Si todo va bien, deberías ver en logs del callback:

   ```
   ✅ Conectado a RabbitMQ
   🚀 Callback service en puerto 3000
   ```

---

## 🏥 Crear recursos FHIR y probar la suscripción

### 1. Crear una **Subscription**

```bash
curl -X POST http://localhost:8080/fhir/Subscription \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Subscription",
    "status": "active",
    "criteria": "Patient?",
    "channel": {
      "type": "rest-hook",
      "endpoint": "http://fhir-callback:3000/callback",
      "payload": "application/fhir+json",
      "header": ["Content-Type: application/fhir+json"]
    }
  }'
```

### 2. Crear un **Patient**

```bash
curl -X POST http://localhost:8080/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "name": [
      {
        "family": "Martínez",
        "given": ["Carlos"]
      }
    ],
    "gender": "male",
    "birthDate": "1988-06-12"
  }'
```

### 3. Revisar los logs del callback

En la terminal donde corre el `fhir-callback`, deberías ver:

```
📩 Callback recibido (PUT). Publicando a RabbitMQ...
```

### 4. Verificar en RabbitMQ

* Entra a [http://localhost:15672](http://localhost:15672) con `guest/guest`.
* Ve a la cola **fhir.queue**.
* Debes ver un mensaje con el contenido del recurso `Patient`.

---

## 📂 Estructura del proyecto

```
.
├── docker-compose.yml
├── callback-service/
│   ├── Dockerfile
│   └── index.js   # Servicio callback Node.js
```

---

## 🛠️ Notas importantes

* El servicio callback soporta tanto `PUT /callback` como `PUT /callback/Patient/{id}`.
* Si HAPI cambia el formato del endpoint, no habrá problema.
* Para depuración de HAPI:

  ```bash
  docker logs -f hapi-fhir
  ```
* Para depuración del callback:

  ```bash
  docker logs -f fhir-callback
  ```

---



---

👉 Con este flujo ya puedes levantar tu entorno completo, probar notificaciones en FHIR y enviarlas a RabbitMQ.

---

¿Quieres que lo deje como **README.md en formato markdown final listo para copiar/pegar** o prefieres que lo escriba como pasos numerados más estilo "tutorial práctico" en texto plano?
