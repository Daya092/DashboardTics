# DashboardTics

# Para ejecutar:
- python3 -m http.server 8000
en otra terminal:
- python3 proxy.py


url: https://solid-potato-4j75rxjjwrgxhqqr4-3000.app.github.dev/

## Endpoints válidos

### 1) Obtener todas las lecturas
- Método: `GET`
- URL: `http://localhost:3000/api/lecturas`

#### Respuesta esperada
- Status: `200`
- Cuerpo: JSON con todas las lecturas ordenadas por fecha descendente.

### 2) Obtener las últimas lecturas
- Método: `GET`
- URL: `http://localhost:3000/api/lecturas/ultimas`

#### Respuesta esperada
- Status: `200`
- Cuerpo: JSON con las últimas 20 lecturas ordenadas por fecha descendente.

### 3) Crear una nueva lectura
- Método: `POST`
- URL: `http://localhost:3000/api/lecturas`
- Headers:
  - `Content-Type: application/json`

#### Body válido (JSON)
```json
{
  "nombre_usuario": "usuario_prueba",
  "temperatura": 23.75,
  "humedad": 55.20
}
```

#### Ejemplo alternativo
```json
{
  "nombre_usuario": "sensor_oficina",
  "temperatura": 29.40,
  "humedad": 42.10
}
```

#### Respuesta esperada
- Status: `201`
- Cuerpo: JSON con los datos guardados y el `id` generado.