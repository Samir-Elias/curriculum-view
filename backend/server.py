# backend/server.py - Actualización para incluir el estimador
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
estimates_memory_db: Dict[str, dict] = {}  # Nueva DB para estimaciones

# Configuración de MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "clean_database")

# Variables globales para MongoDB
client = None
db = None
use_memory_db = True

# Intentar conectar a MongoDB
try:
    if MONGO_URL and MONGO_URL != "mongodb://localhost:27017":
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        logger.info("MongoDB client configured")
    else:
        logger.info("No MongoDB URL provided, using memory database")
        use_memory_db = True
except Exception as e:
    logger.warning(f"MongoDB client configuration failed: {e}")
    client = None
    db = None
    use_memory_db = True

# Crear la aplicación FastAPI
app = FastAPI(
    title="Clean Project API with Project Estimator",
    description="API completamente limpia con estimador de proyectos",
    version="1.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS CONFIGURACIÓN
origins = [
    # Desarrollo local
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    
    # Tu dominio específico en Vercel
    "https://curriculum-view.vercel.app",
    "https://trash-git-main-samir-eliass-projects.vercel.app",
    
    # Patrones de Vercel
    "https://*.vercel.app",
    "https://vercel.app",
    
    # Render
    "https://payments-project.onrender.com",
    "https://*.onrender.com",
]

if os.getenv("ENVIRONMENT") == "development":
    origins.extend([
        "http://localhost:*",
        "http://127.0.0.1:*",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    allow_origin_regex="https://.*\.vercel\.app$",
)

# ========================================
# MODELOS EXISTENTES (tu código actual)
# ========================================
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

class HealthCheck(BaseModel):
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.1.0"
    database_connected: bool = False
    database_type: str = "memory"
    cors_origins: List[str] = []

# ========================================
# NUEVOS MODELOS PARA ESTIMADOR
# ========================================
class ProjectEstimate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_name: str
    project_type: str
    complexity: str
    features: Dict[str, bool]
    team: Dict[str, int]
    hourly_rate: float
    estimated_hours: int
    estimated_weeks: int
    estimated_cost: float
    breakdown: Dict[str, int]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ProjectEstimateCreate(BaseModel):
    project_name: str
    project_type: str
    complexity: str
    features: Dict[str, bool]
    team: Dict[str, int]
    hourly_rate: float
    estimated_hours: int
    estimated_weeks: int
    estimated_cost: float
    breakdown: Dict[str, int]

# Router de API
api_router = APIRouter(prefix="/api/v1")

async def test_mongodb_connection():
    """Función para probar la conexión a MongoDB de forma segura"""
    global use_memory_db
    
    if client is None or db is None:
        return False
    
    try:
        await client.admin.command('ping', serverSelectionTimeoutMS=3000)
        use_memory_db = False
        return True
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {str(e)[:100]}...")
        use_memory_db = True
        return False

# ========================================
# ENDPOINTS EXISTENTES (tu código actual)
# ========================================
@api_router.get("/", response_model=HealthCheck)
async def root():
    """Endpoint raíz con información de salud de la API"""
    db_connected = await test_mongodb_connection()
    db_type = "mongodb" if db_connected else "memory"
    
    return HealthCheck(
        database_connected=db_connected,
        database_type=db_type,
        cors_origins=origins[:5]
    )

@api_router.get("/health", response_model=HealthCheck)
async def health_check():
    """Endpoint de verificación de salud"""
    db_connected = await test_mongodb_connection()
    db_type = "mongodb" if db_connected else "memory"
    
    logger.info(f"Health check - DB connected: {db_connected}, Type: {db_type}")
    
    return HealthCheck(
        database_connected=db_connected,
        database_type=db_type,
        cors_origins=origins[:5]
    )

# ... (tus otros endpoints existentes de status checks) ...

# ========================================
# NUEVOS ENDPOINTS PARA ESTIMADOR
# ========================================
@api_router.post("/estimates", response_model=ProjectEstimate)
async def create_estimate(estimate_data: ProjectEstimateCreate):
    """Crear una nueva estimación de proyecto"""
    try:
        estimate = ProjectEstimate(**estimate_data.dict())
        
        # Intentar MongoDB primero si está disponible
        if not use_memory_db and client is not None and db is not None:
            try:
                result = await db.project_estimates.insert_one(estimate.dict())
                if result.inserted_id:
                    logger.info(f"Created estimate in MongoDB: {estimate.project_name}")
                    return estimate
            except Exception as e:
                logger.warning(f"MongoDB insert failed, using memory: {str(e)[:50]}...")
        
        # Usar base de datos en memoria
        estimates_memory_db[estimate.id] = estimate.dict()
        logger.info(f"Created estimate in memory: {estimate.project_name}")
        return estimate
            
    except Exception as e:
        logger.error(f"Error creating estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating estimate: {str(e)}")

@api_router.get("/estimates", response_model=List[ProjectEstimate])
async def get_estimates(limit: int = 50, skip: int = 0):
    """Obtener lista de estimaciones"""
    try:
        # Intentar MongoDB primero si está disponible
        if not use_memory_db and client is not None and db is not None:
            try:
                estimates = await db.project_estimates.find().sort("timestamp", -1).skip(skip).limit(limit).to_list(length=limit)
                return [ProjectEstimate(**estimate) for estimate in estimates]
            except Exception as e:
                logger.warning(f"MongoDB read failed, using memory: {str(e)[:50]}...")
        
        # Usar base de datos en memoria
        estimates_list = list(estimates_memory_db.values())
        estimates_list.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Aplicar paginación
        paginated = estimates_list[skip:skip+limit]
        return [ProjectEstimate(**estimate) for estimate in paginated]
            
    except Exception as e:
        logger.error(f"Error fetching estimates: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching estimates: {str(e)}")

@api_router.get("/estimates/{estimate_id}", response_model=ProjectEstimate)
async def get_estimate_by_id(estimate_id: str):
    """Obtener una estimación específica"""
    try:
        # Intentar MongoDB primero si está disponible
        if not use_memory_db and client is not None and db is not None:
            try:
                estimate = await db.project_estimates.find_one({"id": estimate_id})
                if estimate:
                    return ProjectEstimate(**estimate)
            except Exception as e:
                logger.warning(f"MongoDB read failed, using memory: {str(e)[:50]}...")
        
        # Usar base de datos en memoria
        if estimate_id in estimates_memory_db:
            return ProjectEstimate(**estimates_memory_db[estimate_id])
        
        raise HTTPException(status_code=404, detail="Estimate not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching estimate: {str(e)}")

@api_router.delete("/estimates/{estimate_id}")
async def delete_estimate(estimate_id: str):
    """Eliminar una estimación"""
    try:
        # Intentar MongoDB primero si está disponible
        if not use_memory_db and client is not None and db is not None:
            try:
                result = await db.project_estimates.delete_one({"id": estimate_id})
                if result.deleted_count > 0:
                    return {"message": "Estimate deleted successfully"}
            except Exception as e:
                logger.warning(f"MongoDB delete failed, using memory: {str(e)[:50]}...")
        
        # Usar base de datos en memoria
        if estimate_id in estimates_memory_db:
            del estimates_memory_db[estimate_id]
            return {"message": "Estimate deleted successfully"}
        
        raise HTTPException(status_code=404, detail="Estimate not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting estimate: {str(e)}")

@api_router.get("/estimates-stats/summary")
async def get_estimates_stats():
    """Obtener estadísticas de las estimaciones"""
    try:
        # Intentar MongoDB primero si está disponible
        if not use_memory_db and client is not None and db is not None:
            try:
                estimates = await db.project_estimates.find().to_list(length=None)
            except Exception as e:
                estimates = list(estimates_memory_db.values())
        else:
            estimates = list(estimates_memory_db.values())
        
        if not estimates:
            return {
                "total_estimates": 0,
                "total_projects_cost": 0,
                "avg_project_hours": 0,
                "most_common_type": "N/A",
                "total_hours": 0
            }
        
        total_cost = sum(est['estimated_cost'] for est in estimates)
        total_hours = sum(est['estimated_hours'] for est in estimates)
        avg_hours = total_hours / len(estimates) if estimates else 0
        
        # Tipo más común
        types_count = {}
        for est in estimates:
            project_type = est['project_type']
            types_count[project_type] = types_count.get(project_type, 0) + 1
        
        most_common_type = max(types_count.items(), key=lambda x: x[1])[0] if types_count else "N/A"
        
        return {
            "total_estimates": len(estimates),
            "total_projects_cost": round(total_cost, 2),
            "avg_project_hours": round(avg_hours, 1),
            "most_common_type": most_common_type,
            "total_hours": total_hours
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

# Incluir el router principal
app.include_router(api_router)

# Middleware de logging (tu código existente)
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = datetime.utcnow()
    
    origin = request.headers.get("origin")
    if origin:
        logger.info(f"Request from origin: {origin}")
    
    response = await call_next(request)
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    return response

# Eventos de startup y shutdown (tu código existente)
@app.on_event("startup")
async def startup_db_client():
    logger.info("🚀 Starting up Clean Project API with Project Estimator")
    logger.info(f"🌐 CORS origins configured: {len(origins)} origins")
    
    if client is not None and db is not None:
        logger.info("📡 MongoDB client configured, will test on first request")
    else:
        logger.info("💾 Using in-memory database")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("👋 Shutting down Clean Project API")
    if client is not None:
        client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8000)),
        log_level="info"
    )