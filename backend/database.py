from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from backend.config import settings

# -------------------------------------------------------------------
# SQLAlchemy Engine Creation
# -------------------------------------------------------------------
# connection_args configures pymysql timeouts/settings if needed.
# pool_pre_ping=True automatically checks connection validity before
# executing SQL queries, preventing "MySQL Server Has Gone Away" errors.
engine = create_engine(
    settings.mysql_connection_string,
    pool_pre_ping=True,
    pool_recycle=3600,   # Recycles connections every hour
    pool_size=10,        # Number of connections to keep in pool
    max_overflow=20,     # Maximum extra connections allowed
    echo=settings.DEBUG, # Logs generated SQL statements when in DEBUG mode
)

# -------------------------------------------------------------------
# Session Factory & Base Model
# -------------------------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Declarative Base class from which all database models inherit
Base = declarative_base()


# -------------------------------------------------------------------
# FastAPI Database Dependency
# -------------------------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a new SQLAlchemy database session
    for each request and closes it automatically when finished.
    
    Usage in FastAPI route:
        @app.get("/users")
        def read_users(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()