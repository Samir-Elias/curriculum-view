# server.py - Versión con fallback a base de datos en memoria

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import os
import uuid
import logging

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Base de datos en memoria como fallback
in_memory_db: Dict[str, dict] = {}

# Configuración de MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "clean_database")

# Intentar conectar a MongoDB
client = None
db = None
use_memory_db = True

try:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    use_memory_db = False
    logger.info("MongoDB client configured - will test connection on first request")
except Exception as e:
    logger.warning(f"MongoDB not available, using in-memory database: {e}")
    use_memory_db = True

# Crear la aplicación FastAPI
app = FastAPI(
    title="Clean Project API",
    description="API completamente limpia sin marcas de agua",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configurar CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://payments-project.onrender.com",
    "https://*.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Modelos Pydantic
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"
    metadata: Optional[dict] = None

class StatusCheckCreate(BaseModel):
    client_name: str
    status: str = "active"
    metadata: Optional[dict] = None

class StatusCheckUpdate(BaseModel):
    client_name: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[dict] = None

class HealthCheck(BaseModel):
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"
    database_connected: bool = False
    database_type: str = "memory"

# Función para verificar MongoDB
async def check_mongodb():
    global use_memory_db
    if client and db:
        try:
            await client.admin.command('ping', serverSelectionTimeoutMS=5000)
            use_memory_db = False
            return True
        except Exception as e:
            logger.warning(f"MongoDB not available: {e}")
            use_memory_db = True
            return False
    return False

# Router de API
api_router = APIRouter(prefix="/api/v1")

@api_router.get("/", response_model=HealthCheck)
async def root():
    """Endpoint raíz con información de salud de la API"""
    db_connected = await check_mongodb()
    db_type = "mongodb" if db_connected else "memory"
    
    return HealthCheck(
        database_connected=db_connected,
        database_type=db_type
    )

@api_router.get("/health", response_model=HealthCheck)
async def health_check():
    """Endpoint de verificación de salud"""
    db_connected = await check_mongodb()
    db_type = "mongodb" if db_connected else "memory"
    
    return HealthCheck(
        database_connected=db_connected,
        database_type=db_type
    )

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    """Crear un nuevo status check"""
    try:
        status_obj = StatusCheck(**input.dict())
        
        if not use_memory_db and db:
            # Intentar usar MongoDB
            try:
                result = await db.status_checks.insert_one(status_obj.dict())
                if result.inserted_id:
                    logger.info(f"Created status check in MongoDB for client: {input.client_name}")
                    return status_obj
            except Exception as e:
                logger.warning(f"MongoDB insert failed, using memory: {e}")
        
        # Usar base de datos en memoria
        in_memory_db[status_obj.id] = status_obj.dict()
        logger.info(f"Created status check in memory for client: {input.client_name}")
        return status_obj
        
    except Exception as e:
        logger.error(f"Error creating status check: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(limit: int = 100, skip: int = 0):
    """Obtener lista de status checks con paginación"""
    try:
        if not use_memory_db and db:
            # Intentar usar MongoDB
            try:
                status_checks = await db.status_checks.find().skip(skip).limit(limit).to_list(length=limit)
                return [StatusCheck(**check) for check in status_checks]
            except Exception as e:
                logger.warning(f"MongoDB read failed, using memory: {e}")
        
        # Usar base de datos en memoria
        checks = list(in_memory_db.values())[skip:skip+limit]
        return [StatusCheck(**check) for check in checks]
        
    except Exception as e:
        logger.error(f"Error fetching status checks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/status/{status_id}", response_model=StatusCheck)
async def get_status_check_by_id(status_id: str):
    """Obtener un status check específico por ID"""
    try:
        if not use_memory_db and db:
            # Intentar usar MongoDB
            try:
                status_check = await db.status_checks.find_one({"id": status_id})
                if status_check:
                    return StatusCheck(**status_check)
            except Exception as e:
                logger.warning(f"MongoDB read failed, using memory: {e}")
        
        # Usar base de datos en memoria
        if status_id in in_memory_db:
            return StatusCheck(**in_memory_db[status_id])
        
        raise HTTPException(status_code=404, detail="Status check not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching status check by ID: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Incluir el router
app.include_router(api_router)

# Middleware de logging
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = datetime.utcnow()
    response = await call_next(request)
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    return response

# Evento de inicio
@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting up Clean Project API")
    db_connected = await check_mongodb()
    if db_connected:
        logger.info("✅ Using MongoDB Atlas")
    else:
        logger.info("⚠️  Using in-memory database (data will not persist)")

# Evento de cierre
@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down Clean Project API")
    if client:
        client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8000)),
        log_level="info"
    )