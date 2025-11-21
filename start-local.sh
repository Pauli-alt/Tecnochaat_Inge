#!/bin/bash

echo "======================================"
echo "   Iniciando TecnoChat en local...    "
echo "======================================"

# Detectar el directorio raíz del proyecto
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#######################################
# Levantar backend-java
#######################################
echo ""
echo "➡️  Levantando backend-java..."
cd "$BASE_DIR/backend-java" || exit 1

# Construir si no existe build
if [ ! -d "build" ]; then
    echo "   Compilando backend-java por primera vez..."
    ./gradlew build
fi

# Ejecutar el servidor Ice en background
./gradlew run > "$BASE_DIR/backend-java.log" 2>&1 &
JAVA_PID=$!

echo "   backend-java corriendo en PID: $JAVA_PID"
echo "   Logs: backend-java.log"


#######################################
# Levantar proxy-node
#######################################
echo ""
echo "➡️  Levantando proxy-node..."
cd "$BASE_DIR/proxy-node" || exit 1

if [ ! -d "node_modules" ]; then
    echo "   Instalando dependencias de proxy-node..."
    npm install
fi

npm run dev > "$BASE_DIR/proxy-node.log" 2>&1 &
PROXY_PID=$!

echo "   proxy-node corriendo en PID: $PROXY_PID"
echo "   Logs: proxy-node.log"


#######################################
# Levantar web-app
#######################################
echo ""
echo "➡️  Levantando web-app..."
cd "$BASE_DIR/web-app" || exit 1

if [ ! -d "node_modules" ]; then
    echo "   Instalando dependencias de web-app..."
    npm install
fi

npm run dev > "$BASE_DIR/web-app.log" 2>&1 &
WEB_PID=$!

echo "   web-app corriendo en PID: $WEB_PID"
echo "   Logs: web-app.log"


#######################################
# Resumen
#######################################
echo ""
echo "======================================"
echo "     Todos los servicios están arriba "
echo "======================================"
echo "Backend Java (Ice):      PID $JAVA_PID"
echo "Proxy Node:              PID $PROXY_PID"
echo "Web App (Webpack Dev):   PID $WEB_PID"
echo ""
echo "🌐 Para abrir la web:"
echo "   Usualmente: http://localhost:8080"
echo ""
echo "Para detener todo, usa:"
echo "   kill $JAVA_PID $PROXY_PID $WEB_PID"
echo ""
