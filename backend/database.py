from typing import Generator 
from sqlalchemy import create_engine 
from sqlalchemy .orm import sessionmaker ,declarative_base ,Session 
from backend .config import settings 

engine =create_engine (
settings .mysql_connection_string ,
pool_pre_ping =True ,
pool_recycle =3600 ,
pool_size =10 ,
max_overflow =20 ,
echo =settings .DEBUG ,
)

SessionLocal =sessionmaker (
autocommit =False ,
autoflush =False ,
bind =engine 
)

Base =declarative_base ()

def get_db ()->Generator [Session ,None ,None ]:
    """
    FastAPI dependency that yields a new SQLAlchemy database session
    for each request and closes it automatically when finished.

    Usage in FastAPI route:
        @app.get("/users")
        def read_users(db: Session = Depends(get_db)):
            ...
    """
    db =SessionLocal ()
    try :
        yield db 
    finally :
        db .close ()
