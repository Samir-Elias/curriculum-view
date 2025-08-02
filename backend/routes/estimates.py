# backend/routes/estimates.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

# Base de datos en memoria para estimaciones (como fallback)
estimates_memory_db: Dict[str, dict] = {}

router = APIRouter(prefix="/estimates", tags=["Project Estimates"])

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

@router.post("/", response_model=ProjectEstimate)
async def create_estimate(estimate_data: ProjectEstimateCreate):
    """Crear una nueva estimación de proyecto"""
    try:
        estimate = ProjectEstimate(**estimate_data.dict())
        
        # Guardar en memoria (puedes integrar MongoDB después)
        estimates_memory_db[estimate.id] = estimate.dict()
        
        logger.info(f"Created project estimate: {estimate.project_name}")
        return estimate
            
    except Exception as e:
        logger.error(f"Error creating estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating estimate: {str(e)}")

@router.get("/", response_model=List[ProjectEstimate])
async def get_estimates(limit: int = 50, skip: int = 0):
    """Obtener lista de estimaciones"""
    try:
        # Obtener de memoria y ordenar por timestamp
        estimates_list = list(estimates_memory_db.values())
        estimates_list.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Aplicar paginación
        paginated = estimates_list[skip:skip+limit]
        
        return [ProjectEstimate(**estimate) for estimate in paginated]
            
    except Exception as e:
        logger.error(f"Error fetching estimates: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching estimates: {str(e)}")

@router.get("/{estimate_id}", response_model=ProjectEstimate)
async def get_estimate_by_id(estimate_id: str):
    """Obtener una estimación específica"""
    try:
        if estimate_id in estimates_memory_db:
            return ProjectEstimate(**estimates_memory_db[estimate_id])
        
        raise HTTPException(status_code=404, detail="Estimate not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching estimate: {str(e)}")

@router.delete("/{estimate_id}")
async def delete_estimate(estimate_id: str):
    """Eliminar una estimación"""
    try:
        if estimate_id in estimates_memory_db:
            del estimates_memory_db[estimate_id]
            return {"message": "Estimate deleted successfully"}
        
        raise HTTPException(status_code=404, detail="Estimate not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting estimate: {str(e)}")

@router.get("/stats/summary")
async def get_estimates_stats():
    """Obtener estadísticas de las estimaciones"""
    try:
        estimates_list = list(estimates_memory_db.values())
        
        if not estimates_list:
            return {
                "total_estimates": 0,
                "total_projects_cost": 0,
                "avg_project_hours": 0,
                "most_common_type": "N/A",
                "total_hours": 0
            }
        
        total_cost = sum(est['estimated_cost'] for est in estimates_list)
        total_hours = sum(est['estimated_hours'] for est in estimates_list)
        avg_hours = total_hours / len(estimates_list) if estimates_list else 0
        
        # Tipo más común
        types_count = {}
        for est in estimates_list:
            project_type = est['project_type']
            types_count[project_type] = types_count.get(project_type, 0) + 1
        
        most_common_type = max(types_count.items(), key=lambda x: x[1])[0] if types_count else "N/A"
        
        return {
            "total_estimates": len(estimates_list),
            "total_projects_cost": total_cost,
            "avg_project_hours": round(avg_hours, 1),
            "most_common_type": most_common_type,
            "total_hours": total_hours
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")