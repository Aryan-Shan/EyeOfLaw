from pydantic import BaseModel
from typing import List, Dict, Optional

class ViolationBase(BaseModel):
    timestamp: str
    location: str
    latitude: float
    longitude: float
    vehicle_type: str
    plate_number: str
    violation_type: str
    confidence: float
    severity: str
    image_path: str
    status: str
    plate_crop_path: Optional[str] = None

class ViolationResponse(ViolationBase):
    id: int

class ViolationListResponse(BaseModel):
    total: int
    violations: List[ViolationResponse]

class StatCard(BaseModel):
    title: str
    value: str
    change: str
    type: str # 'positive', 'negative', 'neutral'

class AnalyticsOverview(BaseModel):
    kpis: Dict[str, StatCard]
    violation_distribution: List[Dict[str, str | int]]
    hourly_trends: List[Dict[str, str | int]]
    weekly_trends: List[Dict[str, str | int]]

class HotspotInfo(BaseModel):
    location: str
    latitude: float
    longitude: float
    risk_score: float
    count: int
    trend: str # 'increasing', 'decreasing', 'stable'
    recommendation: str

class Recommendation(BaseModel):
    id: int
    title: str
    location: str
    priority: str # 'Critical', 'High', 'Medium', 'Low'
    action: str
    trigger: str
    timestamp: str
    status: str # 'Active', 'Approved', 'Dismissed'

class SimulationResponse(BaseModel):
    success: bool
    added_count: int
