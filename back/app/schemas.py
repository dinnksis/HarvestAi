from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any

class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email:str
    password: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class FieldBase(BaseModel):
    name: str
    boundary: dict  # GeoJSON
    area_hectares: Optional[float] = None

class FieldCreate(FieldBase):
    pass

class Field(FieldBase):
    id: int
    owner_id: int
    
    class Config:
        from_attributes = True

class FertilizerPoint(BaseModel):
    x: float
    y: float
    value: float  

class FertilizerMapResponse(BaseModel):
    field_id: int
    field_name: str
    fertilizer_map: List[FertilizerPoint]
    legend: dict