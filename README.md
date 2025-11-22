# Grupo5_TecnoChat


## Integrantes: 
- Paula Andrea Ferreira A00403846
- Valeria Piza Saavedra A00405037
- Manuela Marin Millan  A00

## Descripción General

En este proyecto creamos un chat grupal en tiempo real que conecta un cliente web con un servidor en Java, utilizando un proxy desarrollado en Node.js como intermediario.

Nuestro objetivo fue lograr cumplir con la rubrica y que diferentes tecnologías se comunicaran entre sí: el navegador (cliente web), el servidor de sockets (Java) y el proxy HTTP (Node).
De esta forma, conseguimos que varios usuarios puedan chatear al mismo tiempo desde sus navegadores, enviar mensajes privados y participar en grupos.

## Componentes del proyecto 

El sistema está formado por tres partes principales que trabajan juntas:

- Backend Java (Servidor Principal)
Es el encargado de manejar toda la lógica del chat.
Se comunica con clientes TCP y expone servicios RPC mediante ZeroC Ice. Se ocupa de distribuir los mensajes, mantener el historial y gestionar los grupos.

- Servidor Proxy HTTP (Node.js + Express)
Este componente funciona como un puente entre el cliente web y el servidor Java.
Recibe las peticiones del navegador y las traduce a llamadas RPC (Ice) hacia el backend Java.
También devuelve las respuestas del servidor al navegador.

- Cliente Web (Interfaz de Usuario)
Es la parte visual del sistema, desarrollada con HTML, CSS y JavaScript.
Desde aquí los usuarios pueden conectarse, escribir mensajes, ver el chat en tiempo real y crear grupos con otros usuarios conectados.

## Cómo Funciona la Comunicación

El cliente web envía un mensaje o una acción al proxy usando HTTP.

El proxy (Node.js) traduce esa información y la envía por RPC (ZeroC Ice) al backend en Java (servicios `ChatService` y `CallService`).

El servidor Java procesa el mensaje y lo distribuye a los usuarios correspondientes (grupal, privado o por grupo), además de exponer historiales, creación de grupos y llamadas.

La respuesta regresa al proxy, que la entrega de nuevo al cliente web.

Finalmente, el navegador actualiza la interfaz del chat en tiempo real.

## Requisitos Previos

- Java JDK 23 o superior
- Gradle instalado (o usa el wrapper `./gradlew` tras generar el wrapper con `gradle wrapper`)
- ZeroC Ice 3.7 para Java, incluyendo la herramienta `slice2java` disponible en el PATH
- ZeroC Ice para Node.js (paquete npm `ice`) y, si necesitas generar stubs adicionales, `slice2js` en el PATH
- Node.js (v18 o superior)
- npm
- Navegador web moderno
- https://www.zeroc.com/ice/downloads/3.7/java 


## Instrucciones para Ejecutar el Sistema

### Arranque rápido con script
Desde la raíz del repo:
1. Da permisos si es necesario: `chmod +x start-local.sh`
2. Ejecuta: `./start-local.sh`
   - Levanta backend Java (`runServer`) en puerto TCP 6789 e Ice en 10000.
   - Levanta proxy-node en puerto 3001 usando Ice (host/puerto configurables con `ICE_HOST` y `ICE_PORT`).
   - Levanta web-app (webpack dev server, usualmente en http://localhost:8080).
3. Detén todo con `kill <PIDs>` que el script imprime o `pkill -f "com.tecnochat.server.Server" node webpack`.

### Arranque manual
- Backend Java:
  - `cd backend-java`
  - `./gradlew build`
  - `./gradlew --no-daemon runServer` (expone TCP 6789 e Ice 10000)
- Proxy HTTP (Node):
  - `cd proxy-node`
  - `npm install`
  - `ICE_HOST=localhost ICE_PORT=10000 PORT=3001 npm run start`
- Cliente Web:
  - `cd web-app`
  - `npm install`
  - `npm run dev` (abre http://localhost:8080)

## Funcionalidades Principales

- Chat en tiempo real:
Todos los usuarios conectados pueden enviarse mensajes instantáneamente. Cada mensaje se distribuye a los demás clientes sin necesidad de recargar la página.

- Mensajes privados:
Podemos conversar directamente con otra persona de manera individual, sin que los demás vean la conversación.

- Grupos:
Tenemos la opción de crear grupos y enviar mensajes dentro de ellos.
El sistema valida que no se creen grupos vacíos, es decir, solo se permite crear un grupo si hay participantes disponibles.

- Historial de mensajes:
Podemos consultar los mensajes anteriores tanto de conversaciones individuales como de grupos.
En la interfaz hay una cajita o espacio de selección donde escogemos si queremos ver el historial de un usuario o de un grupo, y luego escribimos el nombre correspondiente para cargarlo.

- Lista de usuarios conectados:
El sistema muestra en todo momento las personas que están conectadas al chat, para saber con quiénes se puede conversar o crear grupos.

- Desconexión segura:
Cada usuario puede salir del chat de forma segura sin afectar la comunicación de los demás.

- Llamadas (RPC):
Iniciar y terminar llamadas usando `CallService` vía proxy HTTP/Ice.
