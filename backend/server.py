# backend/server.py - Actualización con autenticación y endpoints adicionales
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import os
import uuid
import logging
import jwt
import hashlib

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "tu-clave-secreta-super-segura-cambiala-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Security
security = HTTPBearer()

# Base de datos en memoria para estimaciones y usuarios
estimates_memory_db: Dict[str, dict] = {}
admin_users = {
    "admin": {
        "username": "admin",
        "password_hash": "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",  # admin123
        "is_admin": True
    }
}

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
    title="Clean Project API with Admin Panel",
    description="API completamente limpia con estimador de proyectos y panel de administración",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS CONFIGURACIÓN
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://curriculum-view.vercel.app",
    "https://trash-git-main-samir-eliass-projects.vercel.app",
    "https://*.vercel.app",
    "https://vercel.app",
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
    allow_origin_regex=r"https://.*\.vercel\.app$",
)

# ========================================
# MODELOS
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

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class HealthCheck(BaseModel):
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "2.0.0"
    database_connected: bool = False
    database_type: str = "memory"
    cors_origins: List[str] = []

# ========================================
# FUNCIONES DE UTILIDAD
# ========================================
def hash_password(password: str) -> str:
    """Hash de la contraseña usando SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verificar contraseña"""
    return hash_password(password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crear token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verificar token JWT"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        return username
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

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

# Router de API
api_router = APIRouter(prefix="/api/v1")

# ========================================
# ENDPOINTS DE AUTENTICACIÓN
# ========================================
@api_router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Endpoint de login para administradores"""
    user = admin_users.get(login_data.username)
    
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": user["username"], "is_admin": user["is_admin"]},
        expires_delta=access_token_expires
    )
    
    logger.info(f"Admin login successful: {login_data.username}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@api_router.get("/auth/verify")
async def verify_admin_token(current_user: str = Depends(verify_token)):
    """Verificar si el token es válido"""
    return {"valid": True, "username": current_user}

# ========================================
# ENDPOINTS EXISTENTES
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

# ========================================
# ENDPOINTS DE ESTIMACIONES
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
async def get_estimates(limit: int = 100, skip: int = 0):
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
async def delete_estimate(estimate_id: str, current_user: str = Depends(verify_token)):
    """Eliminar una estimación (requiere autenticación de admin)"""
    try:
        # Intentar MongoDB primero si está disponible
        if not use_memory_db and client is not None and db is not None:
            try:
                result = await db.project_estimates.delete_one({"id": estimate_id})
                if result.deleted_count > 0:
                    logger.info(f"Admin {current_user} deleted estimate {estimate_id}")
                    return {"message": "Estimate deleted successfully"}
            except Exception as e:
                logger.warning(f"MongoDB delete failed, using memory: {str(e)[:50]}...")
        
        # Usar base de datos en memoria
        if estimate_id in estimates_memory_db:
            del estimates_memory_db[estimate_id]
            logger.info(f"Admin {current_user} deleted estimate {estimate_id} from memory")
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
                "total_hours": 0,
                "estimates_this_month": 0,
                "avg_cost_per_project": 0
            }
        
        total_cost = sum(est['estimated_cost'] for est in estimates)
        total_hours = sum(est['estimated_hours'] for est in estimates)
        avg_hours = total_hours / len(estimates) if estimates else 0
        avg_cost = total_cost / len(estimates) if estimates else 0
        
        # Tipo más común
        types_count = {}
        for est in estimates:
            project_type = est['project_type']
            types_count[project_type] = types_count.get(project_type, 0) + 1
        
        most_common_type = max(types_count.items(), key=lambda x: x[1])[0] if types_count else "N/A"
        
        # Estimaciones este mes
        current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month_estimates = sum(1 for est in estimates 
                                 if datetime.fromisoformat(est['timestamp'].replace('Z', '+00:00')) >= current_month)
        
        return {
            "total_estimates": len(estimates),
            "total_projects_cost": round(total_cost, 2),
            "avg_project_hours": round(avg_hours, 1),
            "most_common_type": most_common_type,
            "total_hours": total_hours,
            "estimates_this_month": this_month_estimates,
            "avg_cost_per_project": round(avg_cost, 2)
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

# ========================================
# ENDPOINTS ADMINISTRATIVOS
# ========================================
@api_router.get("/admin/estimates", response_model=List[ProjectEstimate])
async def get_all_estimates_admin(current_user: str = Depends(verify_token)):
    """Obtener todas las estimaciones (solo para admin)"""
    try:
        # Intentar MongoDB primero si está disponible
        if not use_memory_db and client is not None and db is not None:
            try:
                estimates = await db.project_estimates.find().sort("timestamp", -1).to_list(length=None)
                return [ProjectEstimate(**estimate) for estimate in estimates]
            except Exception as e:
                logger.warning(f"MongoDB read failed, using memory: {str(e)[:50]}...")
        
        # Usar base de datos en memoria
        estimates_list = list(estimates_memory_db.values())
        estimates_list.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return [ProjectEstimate(**estimate) for estimate in estimates_list]
            
    except Exception as e:
        logger.error(f"Error fetching all estimates: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching estimates: {str(e)}")

@api_router.get("/admin/stats/detailed")
async def get_detailed_stats(current_user: str = Depends(verify_token)):
    """Obtener estadísticas detalladas para admin"""
    try:
        # Obtener estimaciones
        if not use_memory_db and client is not None and db is not None:
            try:
                estimates = await db.project_estimates.find().to_list(length=None)
            except Exception as e:
                estimates = list(estimates_memory_db.values())
        else:
            estimates = list(estimates_memory_db.values())
        
        if not estimates:
            return {
                "basic_stats": {
                    "total_estimates": 0,
                    "total_cost": 0,
                    "total_hours": 0
                },
                "project_types": {},
                "complexity_distribution": {},
                "monthly_stats": {},
                "team_composition": {},
                "most_used_features": {}
            }
        
        # Estadísticas básicas
        total_cost = sum(est['estimated_cost'] for est in estimates)
        total_hours = sum(est['estimated_hours'] for est in estimates)
        
        # Distribución por tipo
        project_types = {}
        complexity_dist = {}
        team_totals = {'frontend': 0, 'backend': 0, 'designer': 0, 'qa': 0}
        feature_count = {}
        
        for est in estimates:
            # Tipos de proyecto
            p_type = est['project_type']
            project_types[p_type] = project_types.get(p_type, 0) + 1
            
            # Complejidad
            complexity = est['complexity']
            complexity_dist[complexity] = complexity_dist.get(complexity, 0) + 1
            
            # Equipo
            for role, count in est.get('team', {}).items():
                if role in team_totals:
                    team_totals[role] += count
            
            # Features
            for feature, enabled in est.get('features', {}).items():
                if enabled:
                    feature_count[feature] = feature_count.get(feature, 0) + 1
        
        # Estadísticas mensuales (últimos 6 meses)
        monthly_stats = {}
        for i in range(6):
            month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=32)
            month_end = month_end.replace(day=1) - timedelta(days=1)
            
            month_estimates = [
                est for est in estimates
                if month_start <= datetime.fromisoformat(est['timestamp'].replace('Z', '+00:00')) <= month_end
            ]
            
            month_key = month_start.strftime('%Y-%m')
            monthly_stats[month_key] = {
                "count": len(month_estimates),
                "total_cost": sum(est['estimated_cost'] for est in month_estimates),
                "total_hours": sum(est['estimated_hours'] for est in month_estimates)
            }
        
        return {
            "basic_stats": {
                "total_estimates": len(estimates),
                "total_cost": round(total_cost, 2),
                "total_hours": total_hours,
                "avg_cost": round(total_cost / len(estimates), 2),
                "avg_hours": round(total_hours / len(estimates), 1)
            },
            "project_types": project_types,
            "complexity_distribution": complexity_dist,
            "monthly_stats": monthly_stats,
            "team_composition": team_totals,
            "most_used_features": dict(sorted(feature_count.items(), key=lambda x: x[1], reverse=True)[:10])
        }
        
    except Exception as e:
        logger.error(f"Error getting detailed stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting detailed stats: {str(e)}")

# Incluir el router principal
app.include_router(api_router)

# Middleware de logging
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

# Eventos de startup y shutdown
@app.on_event("startup")
async def startup_db_client():
    logger.info("🚀 Starting up Clean Project API with Admin Panel")
    logger.info(f"🌐 CORS origins configured: {len(origins)} origins")
    
    if client is not None and db is not None:
        logger.info("📡 MongoDB client configured, will test on first request")
    else:
        logger.info("💾 Using in-memory database")
    
    # Agregar algunas estimaciones de ejemplo si la DB está vacía
    if len(estimates_memory_db) == 0:
        sample_estimates = [
            {
                "id": str(uuid.uuid4()),
                "project_name": "TeloApp Demo",
                "project_type": "location-app",
                "complexity": "medium",
                "features": {
                    "authentication": True,
                    "database": True,
                    "api": True,
                    "maps": True,
                    "search": True,
                    "deployment": True,
                    "cors": True
                },
                "team": {"frontend": 1, "backend": 1, "designer": 0, "qa": 0},
                "hourly_rate": 50.0,
                "estimated_hours": 280,
                "estimated_weeks": 7,
                "estimated_cost": 14000.0,
                "breakdown": {"frontend": 112, "backend": 112, "design": 28, "qa": 28},
                "timestamp": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "project_name": "E-commerce Platform",
                "project_type": "e-commerce",
                "complexity": "complex",
                "features": {
                    "authentication": True,
                    "database": True,
                    "api": True,
                    "payments": True,
                    "cms": True,
                    "search": True,
                    "deployment": True
                },
                "team": {"frontend": 2, "backend": 2, "designer": 1, "qa": 1},
                "hourly_rate": 60.0,
                "estimated_hours": 720,
                "estimated_weeks": 12,
                "estimated_cost": 43200.0,
                "breakdown": {"frontend": 180, "backend": 180, "design": 45, "qa": 45},
                "timestamp": datetime.utcnow() - timedelta(days=5)
            }
        ]
        
        for estimate in sample_estimates:
            estimates_memory_db[estimate["id"]] = estimate
        
        logger.info("📊 Sample estimates added for demonstration")

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