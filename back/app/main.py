from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json

from . import models, schemas, auth, database
from .database import SessionLocal, engine
from .ml import get_fertilizer_recommendations  

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fertilizer Map API", version="1.0.0")

#CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#auth endpoints
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return auth.create_user(db=db, user=user)

@app.post("/login")
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

#field endpoints
@app.post("/fields/", response_model=schemas.Field)
def create_field(
    field: schemas.FieldCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return auth.create_user_field(db=db, field=field, user_id=current_user.id)

@app.get("/fields/", response_model=List[schemas.Field])
def get_fields(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    fields = db.query(models.Field).filter(models.Field.owner_id == current_user.id).all()
    return fields

@app.get("/fields/{field_id}/fertilizer-map")
def get_fertilizer_map(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    field = db.query(models.Field).filter(
        models.Field.id == field_id,
        models.Field.owner_id == current_user.id
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
   
    result = get_fertilizer_recommendations(field.boundary)
    
    return {
        "field_id": field_id,
        "field_name": field.name,
        **result  #распаковка всех данныех из result
    }

@app.get("/")
def root():
    return {"message": "Fertilizer Map API is running"}

@app.get("/fields/public")
def get_public_fields(db: Session = Depends(get_db)):
    fields = db.query(models.Field).limit(10).all()
    return fields