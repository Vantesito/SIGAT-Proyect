# ICC710 - Comprensión del contexto social
Proyecto: SIGAT - Sistema de Información Geográfica y Análisis de Tratamientos

Integrantes
-Líder técnico / integración: José Rivera  
-Frontend: Ignacio Arancibia  
-Backend: Fernando Jelvez  
# Descripción del Proyecto  
SIGAT es una plataforma web diseñada específicamente para funcionarios de la salud y administración hospitalaria. Su objetivo principal es facilitar el análisis epidemiológico y la gestión de pacientes mediante la visualización de datos en mapas de calor. 

El sistema garantiza la anonimización de los datos, registrando la ubicación de los pacientes mediante un sistema de cuadrantes en lugar de direcciones exactas. Esto permite a las autoridades sanitarias visualizar la concentración de casos, estudiar factores ambientales o de higiene en zonas específicas, y planificar estratégicamente la expansión de la red de salud sin comprometer la privacidad de las personas.

# Características Principales
-Gestión de Pacientes (CRUD): Permite ingresar, modificar y eliminar registros de pacientes, incluyendo datos clave como RUT, diagnóstico (enfermedad) y tiempo de tratamiento.  
-Privacidad por Diseño: Georreferenciación basada en zonas/cuadrantes para proteger la identidad del paciente.  
-Filtros Avanzados: Capacidad de segmentar la búsqueda de datos por tipo de enfermedad y ciudad.  
-Visualización Espacial Avanzada: Mapas de calor interactivos e independientes de proveedores privativos, utilizando capas dinámicas para mostrar la densidad de casos y brotes geográficos.   

#Documentación
- La documentación se encontrará dentro de cada carpeta (Frontend / Backend) en su respectivo apartado 

# Tecnologías Utilizadas
-Frontend: React  
-Mapas y Georreferenciación: OpenLayers API (para el renderizado de capas y mapas de calor interactivos)  
-Backend: Java (Spring Boot)  
-Calidad de Código y Análisis: SonarQube  
-Infraestructura: Docker  

#  Requisitos Previos
Para levantar este proyecto en un entorno local, asegúrate de tener instalado:  
- [Docker](https://www.docker.com/) y Docker Compose  
- Node.js (versión 18 o superior)  
- Java JDK 17+

# 📦 Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/tu-usuario/SIGAT.git](https://github.com/tu-usuario/SIGAT.git)
   cd SIGAT
