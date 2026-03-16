from datetime import datetime, timedelta
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware
import time
import asyncio
import pdfplumber
import io
import os
import json
from shared.whatsapp import send_whatsapp
from sqlalchemy import func
import secrets
import string
from jose import JWTError, jwt
import bcrypt

from pydantic import BaseModel as PydanticModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger



from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

import aiosmtplib
from email.message import EmailMessage
import mimetypes

load_dotenv(override=True)

def extract_pdf_text(content: bytes) -> str:
    """Helper to consistently extract text from PDF bytes."""
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return text
    except Exception as e:
        logger.info(f"Erro na extração de texto do PDF: {str(e)}")
        return ""

# --- LOGGING CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("debug.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("scannercv")

logger.info("--- SERVER STARTING / RELOADING ---")

# --- STORAGE CONFIGURATION ---
STORAGE_BASE_DIR = "storage"
UPLOAD_DIR = os.path.join(STORAGE_BASE_DIR, "uploads")
REPORT_DIR = os.path.join(STORAGE_BASE_DIR, "reports")

TERMOS_DIR = os.path.join(STORAGE_BASE_DIR, "termos_aceite_parceiro")

# Ensure storage directories exist
for directory in [UPLOAD_DIR, REPORT_DIR, TERMOS_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)
        logger.info(f"Diretório criado: {directory}")

# --- DATABASE CONFIGURATION ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./scannercv.db")

# For SQLite, we need connect_args={"check_same_thread": False}
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, index=True)
    phone = Column(String)
    filename = Column(String)
    status = Column(String, default="Processando")
    source = Column(String, default="orgânico") # 'orgânico' or a recruiter code
    followup_sent = Column(Integer, default=0) # 0 = False, 1 = True (SQLite compatibility)
    created_at = Column(DateTime, default=datetime.utcnow)

class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    action = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class RecruiterCode(Base):
    __tablename__ = "recruiter_codes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    must_change_password = Column(Integer, default=1) # 1=True for SQLite
    created_at = Column(DateTime, default=datetime.utcnow)

class ScanResult(Base):
    __tablename__ = "scan_results"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    name = Column(String)
    score_estrutural = Column(Integer)
    analise_json = Column(String)  # JSON da Camada 1
    created_at = Column(DateTime, default=datetime.utcnow)

class PublicResult(Base):
    __tablename__ = "public_results"
    token = Column(String, primary_key=True, index=True)
    result_json = Column(String)
    filename = Column(String)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class PromptConfig(Base):
    __tablename__ = "prompt_configs"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True) # e.g., 'structural_analysis', 'job_match'
    title = Column(String)
    system_instructions = Column(String)
    user_instructions = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BlogPost(Base):
    __tablename__ = "blog_posts"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    title = Column(String)
    excerpt = Column(String)
    content = Column(String) # Markdown content
    category = Column(String)
    date = Column(String) # For display, e.g., "15 de Março, 2026"
    created_at = Column(DateTime, default=datetime.utcnow)

# --- INTERVIEW TRAINING MODULE MODELS ---
class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(String, primary_key=True)              # UUID
    phone = Column(String, index=True)
    language = Column(String, default="pt")             # pt | en | es
    job_description = Column(String)
    status = Column(String, default="active")           # active | completed | expired
    scenario = Column(String)                          # JSON from LLM
    current_question = Column(Integer, default=0)
    total_questions = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class InterviewMessage(Base):
    __tablename__ = "interview_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    role = Column(String)                              # 'interviewer' | 'candidate'
    content = Column(String)                           # text or audio transcription
    message_type = Column(String, default="text")      # 'text' | 'audio'
    audio_url = Column(String, nullable=True)
    audio_duration = Column(Float, nullable=True)
    question_number = Column(Integer, nullable=True)
    score = Column(Float, nullable=True)
    feedback = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class InterviewReport(Base):
    __tablename__ = "interview_reports"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    overall_score = Column(Float)
    strengths = Column(String)                         # JSON array
    improvements = Column(String)                      # JSON array
    detailed_feedback = Column(String)
    recommendation = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# --- CONFIGURABLE MODEL ---
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# --- JWT & AUTH CONFIGURATION ---
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def generate_temp_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))

def create_jwt(data: dict) -> str:
    from datetime import timezone
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({**data, "exp": expire}, JWT_SECRET_KEY, algorithm=ALGORITHM)

def decode_jwt(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- S-01: Admin Auth via Header ---
security = HTTPBearer()

def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validates admin access via JWT or static password (for initial login/testing)."""
    token = credentials.credentials
    admin_pass = os.getenv("ADMIN_PASSWORD")
    
    # 1. Check if it's the static ADMIN_PASSWORD (fallback/legacy)
    if token == admin_pass:
        return "admin"
        
    # 2. Check if it's a JWT with admin role
    try:
        payload = decode_jwt(token)
        if payload.get("role") == "admin":
            return "admin"
    except Exception:
        pass
        
    raise HTTPException(status_code=403, detail="Acesso administrativo negado.")


# --- S-03: Recruiter Auth via JWT ---
recruiter_bearer = HTTPBearer()

def verify_recruiter(
    credentials: HTTPAuthorizationCredentials = Depends(recruiter_bearer),
    db: Session = Depends(get_db)
) -> RecruiterCode:
    """Validates recruiter access via JWT token in Authorization: Bearer <token> header."""
    try:
        payload = decode_jwt(credentials.credentials)
        recruiter_id: str = payload.get("sub")
        if recruiter_id is None:
            raise HTTPException(status_code=403, detail="Token inválido: subject ausente.")
    except JWTError:
        raise HTTPException(status_code=403, detail="Token expirado ou inválido.")

    recruiter = db.query(RecruiterCode).filter(RecruiterCode.id == int(recruiter_id)).first()
    if not recruiter:
        raise HTTPException(status_code=403, detail="Consultor não encontrado.")
    return recruiter

# --- Q-01: Reusable Rate Limiter Dependency ---
def check_rate_limit(request: Request, db: Session = Depends(get_db)):
    """Reusable rate limiting dependency for scan and match endpoints."""
    client_ip = request.client.host
    is_local = client_ip in ["127.0.0.1", "::1", "localhost"]
    daily_limit = int(os.getenv("DAILY_SCAN_LIMIT", "5"))

    if openai_client.api_key and not is_local:
        cutoff = datetime.utcnow() - timedelta(hours=24)
        count = db.query(UsageLog).filter(
            UsageLog.ip_address == client_ip,
            UsageLog.created_at >= cutoff
        ).count()
        if count >= daily_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Você atingiu o limite de {daily_limit} análises gratuitas por dia. Volte amanhã ou fale com um consultor para acesso ilimitado."
            )
    return client_ip

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup: Validate critical env vars ---
    if not os.getenv("JWT_SECRET_KEY"):
        logger.info("❌ CRITICAL: JWT_SECRET_KEY não configurado! Abortando.")
        raise RuntimeError("JWT_SECRET_KEY é obrigatório para o sistema de autenticação.")

    admin_email = os.getenv("ADMIN_EMAIL")
    if not admin_email:
        logger.info("❌ CRITICAL: ADMIN_EMAIL não configurado! Abortando.")
        raise RuntimeError("ADMIN_EMAIL deve ser configurado no ambiente.")
    else:
        logger.info(f"✅ ADMIN_EMAIL configurado: {admin_email}")

    pwd = os.getenv("ADMIN_PASSWORD")
    if not pwd or len(pwd.strip()) < 8:
        logger.info("❌ CRITICAL: ADMIN_PASSWORD não configurado ou muito curto (min 8 chars)! Abortando.")
        raise RuntimeError("ADMIN_PASSWORD deve ter no mínimo 8 caracteres.")
    else:
        logger.info("✅ ADMIN_PASSWORD configurado e seguro.")
    
    if not os.getenv("OPENAI_API_KEY"):
        logger.info("⚠️  OPENAI_API_KEY não configurado. Sistema usará dados mock.")
    else:
        logger.info("✅ OPENAI_API_KEY configurado.")
    
    ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    logger.info(f"✅ CORS: {ALLOWED_ORIGINS_RAW}")
    logger.info(f"✅ Rate Limit: {os.getenv('DAILY_SCAN_LIMIT', '5')} análises/dia")
    logger.info(f"✅ Modelo OpenAI: {OPENAI_MODEL}")
    logger.info("--- CONFIG VALIDADA ---")
    
    # --- Startup: Scheduler ---
    scheduler.add_job(
        send_followup_messages,
        IntervalTrigger(hours=1),
        id="followup_job", replace_existing=True
    )
    scheduler.start()
    logger.info("✅ Scheduler iniciado (Follow-up 48h).")

    yield

    # --- Shutdown ---
    scheduler.shutdown()
    logger.info("--- SERVER SHUTTING DOWN ---")

app = FastAPI(title="ScannerCV API", lifespan=lifespan)

# --- S-04: Restrict CORS ---
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

# --- AUTH ENDPOINTS ---

class LoginRequest(PydanticModel):
    email: str
    password: str

@app.post("/api/auth/login")
async def unified_login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    admin_pass = os.getenv("ADMIN_PASSWORD")
    
    # --- 1. ADMIN LOGIN ---
    admin_email = os.getenv("ADMIN_EMAIL", "").lower().strip()
    if email == admin_email and admin_pass:
        if req.password == admin_pass:
            token = create_jwt({"sub": "admin", "role": "admin"})
            return {
                "access_token": token,
                "token_type": "bearer",
                "recruiter": {
                    "id": 0,
                    "name": "Administrador",
                    "code": "admin",
                    "email": email,
                    "role": "admin"
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Senha administrativa incorreta.")

    # --- 2. RECRUITER LOGIN ---
    recruiter = db.query(RecruiterCode).filter(
        RecruiterCode.email == email
    ).first()

    if not recruiter or not recruiter.password_hash:
        logger.info(f"[AUTH] Login falhou para: {req.email}")
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

    if not verify_password(req.password, recruiter.password_hash):
        logger.info(f"[AUTH] Senha incorreta para: {req.email}")
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

    token = create_jwt({"sub": str(recruiter.id), "code": recruiter.code, "role": "partner"})

    return {
        "access_token": token,
        "token_type": "bearer",
        "recruiter": {
            "id": recruiter.id,
            "name": recruiter.name,
            "code": recruiter.code,
            "email": recruiter.email,
            "must_change_password": bool(recruiter.must_change_password),
            "role": "partner"
        }
    }

@app.get("/api/auth/me")
async def get_me(recruiter: RecruiterCode = Depends(verify_recruiter)):
    return {
        "id": recruiter.id,
        "name": recruiter.name,
        "code": recruiter.code,
        "email": recruiter.email,
        "must_change_password": bool(recruiter.must_change_password)
    }

class ChangePasswordRequest(PydanticModel):
    current_password: str
    new_password: str

@app.post("/api/auth/change-password")
async def change_password(
    req: ChangePasswordRequest,
    recruiter: RecruiterCode = Depends(verify_recruiter),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, recruiter.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Nova senha deve ter ao menos 8 caracteres.")
    
    recruiter.password_hash = hash_password(req.new_password)
    recruiter.must_change_password = 0 # 0=False for SQLite
    db.commit()
    logger.info(f"[AUTH] Senha alterada com sucesso para {recruiter.email}")
    return {"message": "Senha alterada com sucesso."}

scheduler = AsyncIOScheduler()

async def send_followup_messages():
    """W-04: Envia lembrete 48h após a análise (Reativação)."""
    if not os.getenv("EVOLUTION_API_URL") or os.getenv("FOLLOWUP_ENABLED", "true").lower() == "false":
        return
    
    db = SessionLocal()
    try:
        cutoff_start = datetime.utcnow() - timedelta(hours=49)
        cutoff_end   = datetime.utcnow() - timedelta(hours=47)
        
        # In SQLite, followup_sent is handled as 0/1
        leads = db.query(Lead).filter(
            Lead.created_at.between(cutoff_start, cutoff_end),
            Lead.followup_sent == 0,
            Lead.phone != None,
            Lead.phone != ""
        ).all()
        
        from shared.whatsapp import send_whatsapp
        for lead in leads:
            msg = (
                f"👋 Oi, {lead.name}! Tudo bem?\n\n"
                f"Vi que você analisou seu currículo há 2 dias no ScannerCV. 📊\n\n"
                f"Uma dica rápida: *quantifique seus resultados com números* nas experiências. "
                f"Isso aumenta em até 3x a taxa de chamada para entrevistas!\n\n"
                f"Gostaria de uma sessão personalizada para turbinar seu CV? "
                f"Um consultor especializado pode revisar seu perfil em detalhes.\n\n"
                f"Responda *SIM* para falar com um consultor. 🚀"
            )
            sent = await send_whatsapp(lead.phone, msg)
            if sent:
                lead.followup_sent = 1
                db.commit()
                logger.info(f"[Scheduler] Follow-up enviado para {lead.phone}")
                
    finally:
        db.close()


# Root route is now handled by serve_frontend below

@app.post("/api/scan")
async def scan_cv(request: Request, file: UploadFile = File(...), client_ip: str = Depends(check_rate_limit), db: Session = Depends(get_db)):

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são suportados.")

    try:
        content = await file.read()
        text = extract_pdf_text(content)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Não foi possível extrair texto do PDF.")

        # If no API key is provided, return mock data for local testing
        if not openai_client.api_key:
            return get_mock_response(file.filename)

        # Fetch dynamic prompt
        config = db.query(PromptConfig).filter(PromptConfig.slug == 'structural_analysis').first()
        sys_instr = config.system_instructions if config else "Você é um assistente de RH de precisão que responde apenas em JSON válido."
        user_instr_template = config.user_instructions if config else """
        Você é um especialista em recrutamento e sistemas ATS. Analise o seguinte currículo e forneça uma avaliação estrutural "Camada 1".
        Seu objetivo é verificar rapidamente a saúde do documento e gerar um Score Estrutural de 0 a 100.
        Métricas obrigatórias: Informações de Contato, Resumo Profissional, Objetivo Claro, Formatação ATS, Densidade de Palavras-chave.
        Responda ESTRITAMENTE em formato JSON com score_estrutural, message e analise_itens.
        """
        
        # Robustness: always append JSON instruction to user prompt
        json_instruction = "\n\nIMPORTANTE: Responda ESTRITAMENTE em formato JSON com as chaves 'score_estrutural' (0-100), 'message' (resumo curto) e 'analise_itens' (lista de objetos com 'item', 'presente', 'feedback')."
        prompt = f"{user_instr_template}\n\nCurrículo:\n{text[:4000]}{json_instruction}"
        
        logger.info(f"Calling OpenAI for structural analysis of {file.filename}...")
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": sys_instr},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        raw_content = response.choices[0].message.content
        logger.info(f"OpenAI raw response: {raw_content[:200]}...")
        
        try:
            result_json = json.loads(raw_content)
        except Exception as parse_err:
            logger.info(f"Failed to parse OpenAI JSON: {parse_err}. Raw content: {raw_content}")
            raise HTTPException(status_code=500, detail="A inteligência artificial retornou um formato inválido. Tente novamente.")

        # Robustness: Key Mapping Fallbacks
        
        # 1. Fallback for score_estrutural
        if "score_estrutural" not in result_json:
            for k in ["score", "rating", "pontuacao", "eval_score"]:
                if k in result_json:
                    result_json["score_estrutural"] = result_json[k]
                    break
        
        # 2. Fallback for message
        if "message" not in result_json:
            for k in ["feedback", "summary", "resumo", "details", "eval_message"]:
                if k in result_json:
                    result_json["message"] = result_json[k]
                    break
                    
        # 3. Fallback for analise_itens
        if "analise_itens" not in result_json:
            for k in ["items", "evaluation", "itens", "checklist"]:
                if k in result_json:
                    result_json["analise_itens"] = result_json[k]
                    break

        # 1. Save results to History (F-01)
        token = secrets.token_hex(8)
        pub = PublicResult(
            token=token,
            result_json=json.dumps(result_json, ensure_ascii=False),
            filename=file.filename,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(pub)
        
        # W-06: Alerta de score baixo
        phone = await request.form()
        phone_val = phone.get("phone")
        
        # Secure score access
        try:
            score = int(result_json.get("score_estrutural", 0))
        except:
            score = 0
            
        if score < 50 and phone_val and os.getenv("EVOLUTION_API_URL"):
            from shared.whatsapp import send_whatsapp
            alerta = (
                f"🚨 *ScannerCV — Alerta sobre seu Currículo*\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"Analisamos seu currículo e encontramos pontos críticos.\n\n"
                f"📊 *Score: {score}/100*\n\n"
                f"Currículos abaixo de 50 têm 3x menos chances nos filtros ATS.\n\n"
                f"Responda *QUERO AJUDA* para falar com um especialista. 🎯"
            )
            background_tasks.add_task(send_whatsapp, phone_val, alerta)

        # Log usage on success
        usage = UsageLog(ip_address=client_ip, action="scan")
        db.add(usage)
        db.commit()

        logger.info(f"Scan analysis for {file.filename} completed successfully. Score: {result_json.get('score_estrutural')}")
        return {
            "filename": file.filename,
            "result": result_json,
            "share_token": token
        }

    except Exception as e:
        print(f"Error processing CV: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar o currículo.")

@app.post("/api/match")
async def match_cv_to_job(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(...),
    client_ip: str = Depends(check_rate_limit),
    db: Session = Depends(get_db)
):
    """
    Job Match: receive a CV PDF + job description text.
    Returns compatibility score, matched keywords, and skill gaps.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são suportados.")
    if not job_description or len(job_description.strip()) < 50:
        raise HTTPException(status_code=400, detail="Cole a descrição completa da vaga (mínimo 50 caracteres).")

    try:
        content = await file.read()
        cv_text = extract_pdf_text(content)

        if not cv_text.strip():
            raise HTTPException(status_code=400, detail="Não foi possível extrair texto do PDF.")

        if not openai_client.api_key:
            # Mock for local dev
            return {
                "match": {
                    "score_compatibilidade": 72,
                    "resumo": "Seu perfil tem boa aderência à vaga, mas faltam algumas competências-chave.",
                    "palavras_chave_presentes": ["Python", "SQL", "Análise de Dados"],
                    "gaps": [
                        {"habilidade": "Power BI", "importancia": "Alta", "sugestao": "Adicione um projeto pessoal ou curso online de Power BI ao seu portfólio."},
                        {"habilidade": "Experiência em E-commerce", "importancia": "Média", "sugestao": "Destaque qualquer experiência em vendas online, mesmo que indireta."}
                    ],
                    "recomendacao_geral": "Adapte seu resumo profissional para mencionar explicitamente as palavras-chave da vaga. Quantifique seus resultados com métricas de negócio."
                }
            }

        prompt = f"""
        Você é um especialista em recrutamento e análise de compatibilidade curricular.
        Compare o currículo com a descrição da vaga abaixo e gere um relatório de compatibilidade.

        Responda ESTRITAMENTE em JSON:
        {{
            "score_compatibilidade": <número de 0 a 100>,
            "resumo": "<uma frase resumindo o nível de compatibilidade>",
            "palavras_chave_presentes": ["<lista de termos da vaga que JÁ estão no CV>"],
            "gaps": [
                {{
                    "habilidade": "<habilidade ou requisito que FALTA no CV>",
                    "importancia": "<Alta | Média | Baixa>",
                    "sugestao": "<dica curta e prática de como preencher esse gap>"
                }}
            ],
            "recomendacao_geral": "<parágrafo de 2-3 frases com a recomendação estratégica principal>"
        }}

        CURRÍCULO:
        {cv_text[:4000]}

        DESCRIÇÃO DA VAGA:
        {job_description[:3000]}
        """

        response = await openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Você é um consultor de carreira sênior que responde apenas em JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        result_json = json.loads(response.choices[0].message.content)

        # Log usage on success (Q-01: rate limit applies to match too)
        usage = UsageLog(ip_address=client_ip, action="match")
        db.add(usage)
        db.commit()

        return {"match": result_json}

    except Exception as e:
        logger.info(f"Error in /api/match: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar a compatibilidade.")

async def process_deep_analysis_and_email(name: str, email: str, phone: str, filename: str, content: bytes):
    logger.info(f"--- INICIANDO ANÁLISE PROFUNDA (CAMADA 2) P/ {email} ---")
    
    try:
        # 1. Extract text again
        text = extract_pdf_text(content)
        
        if not text.strip():
            logger.info("CV text empty, aborting deep analysis.")
            return

        logger.info(f"Texto extraído ({len(text)} chars). Chamando OpenAI...")

        # 2. Call OpenAI for Camada 2
        prompt = f"""
        Você é um mentor de carreira sênior e especialista em recolocação. 
        Sua missão é dar um diagnóstico profundo "Camada 2" para este currículo. 
        Não seja superficial. Critique como um recrutador exigente do mercado de tecnologia/negócios.
        
        Avalie:
        - Impacto: O currículo foca em tarefas ou em resultados? (Busque números e métricas).
        - Verbos de Ação: O candidato usa palavras fortes (Liderou, Implementou, Automatizou)?
        - Alinhamento STAR: As experiências seguem o método STAR (Situação, Tarefa, Ação, Resultado)?
        - Design e Escaneabilidade: O documento convida à leitura ou é cansativo?
        
        Responda em JSON rigoroso:
        {{
            "pontos_fortes": ["Destaque 3 conquistas ou aspectos positivos Reais"],
            "pontos_atencao": ["Liste 3 erros críticos ou pontos que 'queimam' o candidato"],
            "analise_detalhada": "Um diagnóstico sênior de 3 a 4 frases sobre o momento de carreira dele",
            "dicas_praticas": ["Passo a passo tático: Faça X, altere Y para Z, use a palavra W"]
        }}
        
        Currículo de {name}:
        {text[:5000]}
        """

        if not openai_client.api_key:
            print("Missing API KEY. Mocking deep analysis.")
            result_json = {
                "pontos_fortes": ["Estrutura inicial limpa", "Dados de contato visíveis"],
                "pontos_atencao": ["Falta quantificar resultados", "Pouca descrição técnica nas experiências"],
                "analise_detalhada": "O currículo está bem estruturado, mas falha em demonstrar impacto real. Troque listas de obrigações por conquistas numéricas.",
                "dicas_praticas": ["Use verbos de ação fortes (Liderei, Otimizei).", "Adicione números: 'Aumentou vendas em 20%'."]
            }
        else:
            response = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={ "type": "json_object" },
                messages=[
                    {"role": "system", "content": "Você é um mentor de carreira sênior respondendo em JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4
            )
            result_json = json.loads(response.choices[0].message.content)

        # 3. Generate PDF Report
        pdf_filename = f"Analise_CV_{name.replace(' ', '_')}_{int(time.time())}.pdf"
        pdf_path = os.path.join(REPORT_DIR, pdf_filename)
        generate_pdf_report(pdf_path, name, result_json)
        
        # 4. Email logic
        logger.info(f"--- ANÁLISE PROFUNDA CONCLUÍDA. PDF GERADO: {pdf_path} ---")
        await send_email_report(email, name, pdf_path)

        # F-06: WhatsApp notification of completion
        if phone and os.getenv("EVOLUTION_API_URL"):
            from shared.whatsapp import send_whatsapp
            fortes = result_json.get("pontos_fortes", [])[:2]
            fortes_txt = "\n".join(f"• {f}" for f in fortes) if fortes else "Veja no relatório"
            msg_wa = (
                f"🎯 *ScannerCV — Sua análise chegou!*\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"Olá, {name}! 📬\n\n"
                f"Sua análise profunda foi enviada para {email}.\n\n"
                f"🟢 *Seus destaques identificados:*\n{fortes_txt}\n\n"
                f"📄 O relatório completo com seu plano de ação está no e-mail.\n"
                f"━━━━━━━━━━━━━━━━━━━━━━"
            )
            await send_whatsapp(phone, msg_wa)
            logger.info(f"WhatsApp de conclusão enviado para {phone}")

        
        # Cleanup (Disabled for debugging, but pointing to correct path if enabled)
        # if os.path.exists(pdf_path):
        #     os.remove(pdf_path)
            
    except Exception as e:
        logger.info(f"FAILED DEEP ANALYSIS FOR {email}: {e}")

async def send_email_report(to_email: str, name: str, pdf_filename: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", smtp_user)

    if not all([smtp_server, smtp_port, smtp_user, smtp_pass]):
        logger.info(f"Missing SMTP configuration. Server: {bool(smtp_server)}, Port: {bool(smtp_port)}, User: {bool(smtp_user)}, Pass: {bool(smtp_pass)}")
        return

    logger.info(f"Enviando e-mail via {smtp_server}:{smtp_port} para {to_email}...")

    msg = EmailMessage()
    msg['Subject'] = 'Sua Análise Profunda do Currículo - ScannerCV'
    msg['From'] = from_email
    msg['To'] = to_email
    
    body = f"""
    Olá, {name}!
    
    Agradecemos por usar o ScannerCV.
    Nossa inteligência artificial avançada (Camada 2) concluiu a análise profunda do seu currículo.
    
    Em anexo, você encontrará um relatório detalhado com os pontos fortes da sua trajetória, 
    pontos de atenção que podem estar bloqueando suas entrevistas, e um plano de ação tático 
    com dicas exclusivas para reescrever seu CV e chamar a atenção dos recrutadores.
    
    Sucesso na sua carreira!
    Equipe ScannerCV
    """
    msg.set_content(body)

    with open(pdf_filename, 'rb') as f:
        pdf_data = f.read()

    msg.add_attachment(pdf_data, maintype='application', subtype='pdf', filename=f"ScannerCV_Relatorio_{name}.pdf")

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_server,
            port=int(smtp_port),
            username=smtp_user,
            password=smtp_pass,
            use_tls=True if int(smtp_port) == 465 else False,
            start_tls=True if int(smtp_port) == 587 else False,
        )
        logger.info(f"Email successfully sent to {to_email}")
    except Exception as e:
        logger.info(f"Failed to send email to {to_email}: {e}")

def generate_pdf_report(filename, name, data):
    doc = SimpleDocTemplate(filename, pagesize=letter, leftMargin=50, rightMargin=50, topMargin=30, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    brand_color = colors.HexColor("#2563eb")  # Blue 600
    text_color = colors.HexColor("#1e293b")   # Slate 800
    muted_color = colors.HexColor("#64748b")  # Slate 500
    
    title_style = ParagraphStyle(
        'PremiumTitle',
        parent=styles['Heading1'],
        fontSize=26,
        textColor=brand_color,
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'PremiumSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=muted_color,
        spaceAfter=30,
        fontName='Helvetica'
    )
    
    h2_style = ParagraphStyle(
        'PremiumH2',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=brand_color,
        spaceBefore=25,
        spaceAfter=12,
        fontName='Helvetica-Bold',
    )
    
    body_style = ParagraphStyle(
        'PremiumBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=text_color,
        leading=16,
        fontName='Helvetica'
    )
    
    bullet_style = ParagraphStyle(
        'PremiumBullet',
        parent=body_style,
        leftIndent=20,
        bulletIndent=10,
        spaceAfter=10,
        bulletFontName='Helvetica-Bold'
    )

    story = []
    
    # --- HEADER / LOGO ---
    logo_path = os.getenv("PDF_LOGO_PATH", "logo.png")
    header_data = [
        [Paragraph("ScannerCV", title_style), ""]
    ]
    
    if os.path.exists(logo_path):
        try:
            img = Image(logo_path, width=80, height=40)
            img.hAlign = 'RIGHT'
            header_data[0][1] = img
        except Exception as e:
            logger.info(f"Erro ao carregar logo no PDF: {e}")

    header_table = Table(header_data, colWidths=[380, 100])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Paragraph(f"Relatório de Diagnóstico Profissional | Gerado para {name}", subtitle_style))
    
    # --- DIVIDER ---
    story.append(Spacer(1, 2))
    story.append(Table([[""]], colWidths=[480], rowHeights=[1], style=[('LINEBELOW', (0,0), (-1,0), 2, brand_color)]))
    story.append(Spacer(1, 20))

    # --- INTRO SECTION ---
    story.append(Paragraph("Análise de Impacto de Carreira", h2_style))
    story.append(Paragraph(data.get("analise_detalhada", ""), body_style))
    story.append(Spacer(1, 15))
    
    # --- STRENGTHS & GAPS ---
    section_data = [
        [
            Paragraph("<b>PONTOS FORTES</b>", ParagraphStyle('H_F', parent=body_style, textColor=colors.HexColor("#16a34a"))), 
            Paragraph("<b>PONTOS DE ATENÇÃO</b>", ParagraphStyle('H_A', parent=body_style, textColor=colors.HexColor("#dc2626")))
        ]
    ]
    
    max_len = max(len(data.get("pontos_fortes", [])), len(data.get("pontos_atencao", [])))
    for i in range(max_len):
        forte = data.get("pontos_fortes", [])[i] if i < len(data.get("pontos_fortes", [])) else ""
        atencao = data.get("pontos_atencao", [])[i] if i < len(data.get("pontos_atencao", [])) else ""
        section_data.append([
            Paragraph(f"• {forte}" if forte else "", body_style),
            Paragraph(f"• {atencao}" if atencao else "", body_style)
        ])
    
    table = Table(section_data, colWidths=[240, 240])
    table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (0,0), (-1,0), 0.5, muted_color),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,1), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.1, colors.transparent), # Invisible grid for layout
    ]))
    story.append(table)
    story.append(Spacer(1, 25))
    
    # --- PRACTICAL ACTION PLAN ---
    story.append(Paragraph("Plano de Ação Tático", h2_style))
    story.append(Paragraph("Implemente as mudanças abaixo para otimizar sua escaneabilidade em sistemas ATS:", body_style))
    story.append(Spacer(1, 10))
    
    for dica in data.get("dicas_praticas", []):
        story.append(Paragraph(f"<b>Ação Recomendada:</b> {dica}", bullet_style))
    
    # --- FOOTER ---
    story.append(Spacer(1, 60))
    footer_text = (
        "<b>Confidencialidade:</b> Este relatório é destinado exclusivamente ao candidato mencionado. "
        "ScannerCV utiliza padrões globais de recrutamento e inteligência artificial para este diagnóstico. "
        "A reprodução total ou parcial deste conteúdo é proibida."
    )
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=body_style, fontSize=8, textColor=muted_color, alignment=1)))
    
    doc.build(story)

@app.post("/api/lead")
async def scan_lead(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    source: str = Form("orgânico"),
    analise_json: str = Form(None), # Novo: permite salvar o resultado da Camada 1 no histórico

    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são suportados.")
        
    try:
        content = await file.read()
        
        # Save original CV to storage
        safe_filename = f"{int(time.time())}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Save the lead to persistent DB
        db_lead = Lead(
            name=name,
            email=email,
            phone=phone,
            filename=safe_filename,
            source=source
        )
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        
        logger.info(f"Lead salvo no DB: {name} ({email}) - ID: {db_lead.id}")
        
        # F-01: Save to history
        if analise_json:
            try:
                aj = json.loads(analise_json)
                scan_rec = ScanResult(
                    email=email.lower().strip(),
                    name=name,
                    score_estrutural=aj.get("score_estrutural", 0),
                    analise_json=analise_json
                )
                db.add(scan_rec)
            except Exception as e:
                logger.info(f"Erro ao salvar histórico ScanResult: {e}")

        
        # F-01: Save to history
        # Try to find recent scan results from usage log? No, we should have the scan result JSON available if called from frontend.
        # However, the frontend sends POST /api/lead separately. 
        # For simplicity, we assume we want to store this as a ScanResult record.
        # We need the Layer 1 result_json which isn't passed here. 
        # FIX: The roadmap says "After db.commit of lead, scan_rec = ScanResult(...)". 
        # This implies we might need to pass the result_json to this endpoint or fetch it.
        # For now, let's just save the record with a placeholder or handle it via frontend if possible.
        # Roadmap prompt says "In LandingPage.jsx, after preenchendo email... exiba cards".
        
        # W-02: Welcome WhatsApp
        if phone and os.getenv("EVOLUTION_API_URL"):
            from shared.whatsapp import send_whatsapp
            boas_vindas = (
                f"✅ *ScannerCV — Análise Recebida!*\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"Olá, {name}! 🎯\n\n"
                f"Recebemos seu currículo e a análise já está sendo processada.\n\n"
                f"📬 Em até *10 minutos* você receberá seu relatório em *{email}*."
            )
            background_tasks.add_task(send_whatsapp, phone, boas_vindas)

        # W-01: Notify Recruiter
        if source and source != "orgânico":
            recruiter = db.query(RecruiterCode).filter(RecruiterCode.code == source).first()
            if recruiter and recruiter.phone:
                from shared.whatsapp import send_whatsapp
                msg_rec = (
                    f"🔔 *ScannerCV — Novo Lead Chegou!*\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"Olá, {recruiter.name}! 👋\n\n"
                    f"O ScannerCV capturou um novo potencial cliente para você.\n\n"
                    f"👤 *Nome:* {name}\n"
                    f"📧 *E-mail:* {email}\n"
                    f"📱 *WhatsApp:* {phone}\n\n"
                    f"⚡ Entre em contato agora para maximizar a conversão!"
                )
                background_tasks.add_task(send_whatsapp, recruiter.phone, msg_rec)

        # Schedule the deep analysis to run in the background without blocking the UI
        background_tasks.add_task(process_deep_analysis_and_email, name, email, phone, file.filename, content)
        
        return {"message": "Lead salvo com sucesso. Análise profunda iniciada em background."}

    except Exception as e:
        logger.info(f"Error saving lead: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao agendar a análise.")

@app.get("/api/admin/leads")
async def get_leads(admin_key: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Admin: sees ALL leads + usage stats."""
    
    leads = db.query(Lead).order_by(Lead.created_at.desc()).all()
    leads_data = [
        {
            "id": l.id,
            "name": l.name,
            "email": l.email,
            "phone": l.phone,
            "filename": l.filename,
            "status": l.status,
            "source": l.source,
            "created_at": l.created_at,
        }
        for l in leads
    ]
    total_scans = db.query(UsageLog).count()
    return {"leads": leads_data, "total_scans": total_scans}

@app.get("/api/recruiter/leads")
async def get_recruiter_leads(recruiter: RecruiterCode = Depends(verify_recruiter), db: Session = Depends(get_db)):
    """Recruiter: sees their own leads (authenticated via database)."""
    leads = db.query(Lead).filter(Lead.source == recruiter.code).order_by(Lead.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "name": l.name,
            "email": l.email,
            "phone": l.phone,
            "status": l.status,
            "source": l.source,
            "created_at": l.created_at,
        }
        for l in leads
    ]

@app.get("/api/admin/recruiters")
async def get_admin_recruiters(admin_key: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Admin: sees all registered recruiters and their lead counts."""
    
    # Optimized query with GROUP BY
    counts = db.query(
        Lead.source, 
        func.count(Lead.id)
    ).group_by(Lead.source).all()
    
    counts_dict = {source: count for source, count in counts if source}
    
    recruiters = db.query(RecruiterCode).all()
    result = []
    
    for r in recruiters:
        result.append({
            "id": r.id,
            "code": r.code,
            "name": r.name,
            "email": r.email,
            "lead_count": counts_dict.get(r.code, 0)
        })
    
    return result

@app.get("/api/admin/prompts")
async def get_prompts(admin_key: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Admin: get all prompt configurations."""
    
    prompts = db.query(PromptConfig).all()
    
    # Initialize defaults if empty
    if not prompts:
        defaults = [
            {
                "slug": "structural_analysis",
                "title": "Análise Estrutural (Camada 1)",
                "system": "Você é um assistente de RH de precisão que responde apenas em JSON válido.",
                "user": "Você é um especialista em recrutamento e sistemas ATS. Analise o seguinte currículo e forneça uma avaliação estrutural \"Camada 1\"..."
            },
            {
                "slug": "job_match",
                "title": "Análise de Match com Vaga",
                "system": "Você é um assistente de RH focado em compatibilidade técnica que responde apenas em JSON.",
                "user": "Você é um especialista em recrutamento e análise de compatibilidade curricular. Compare o currículo com a descrição da vaga..."
            }
        ]
        for d in defaults:
            p = PromptConfig(
                slug=d["slug"], 
                title=d["title"], 
                system_instructions=d["system"], 
                user_instructions=d["user"]
            )
            db.add(p)
        db.commit()
        prompts = db.query(PromptConfig).all()

    return prompts

# --- BLOG ENDPOINTS ---

@app.get("/api/blog")
async def get_blog_posts(db: Session = Depends(get_db)):
    """Public: List all blog posts."""
    posts = db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()
    return posts

@app.get("/api/blog/{slug}")
async def get_blog_post(slug: str, db: Session = Depends(get_db)):
    """Public: Get a specific blog post by slug."""
    print(f"[BLOG] Request for slug: '{slug}'")
    from sqlalchemy import func
    post = db.query(BlogPost).filter(func.lower(BlogPost.slug) == func.lower(slug)).first()
    if not post:
        print(f"[BLOG] Post '{slug}' not found in DB")
        raise HTTPException(status_code=404, detail="Post não encontrado.")
    return post

@app.post("/api/admin/blog")
async def save_blog_post(
    admin_key: str = Depends(verify_admin),
    id: int = Form(None),
    slug: str = Form(...),
    title: str = Form(...),
    excerpt: str = Form(...),
    content: str = Form(...),
    category: str = Form(...),
    date: str = Form(...),
    db: Session = Depends(get_db)
):
    """Admin: Create or update a blog post."""
    # Basic slug sanitization
    slug = slug.lower().strip().replace(" ", "-")
    import re
    slug = re.sub(r'[^a-z0-9\-]', '', slug)

    if id:
        post = db.query(BlogPost).filter(BlogPost.id == id).first()
        if not post: raise HTTPException(status_code=404)
    else:
        post = BlogPost(slug=slug)
        db.add(post)

    post.slug = slug
    post.title = title
    post.excerpt = excerpt
    post.content = content
    post.category = category
    post.date = date
    
    try:
        db.commit()
        return {"message": "Post salvo com sucesso.", "id": post.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Erro ao salvar post. O slug pode já estar em uso.")

@app.delete("/api/admin/blog/{post_id}")
async def delete_blog_post(post_id: int, admin_key: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Admin: Delete a blog post."""
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404)
    db.delete(post)
    db.commit()
    return {"message": "Post excluído."}

@app.post("/api/admin/blog/generate")
async def generate_blog_content(
    topic: str = Form(...),
    admin_key: str = Depends(verify_admin)
):
    """Admin: AI-assisted blog content generation."""
    if not openai_client.api_key:
        return {
            "title": f"Dica sobre {topic}",
            "excerpt": f"Breve resumo sobre como {topic} impacta sua carreira.",
            "content": f"# {topic}\n\nEste é um conteúdo gerado automaticamente para teste.\n\n- Dica 1\n- Dica 2",
            "category": "Dicas de Carreira"
        }

    prompt = f"""
    Como um especialista em carreira e recrutamento, escreva um post de blog curto e impactante sobre o tema: "{topic}".
    
    O post deve ter:
    1. Um título chamativo.
    2. Um resumo curto (excerpt) para o card.
    3. Conteúdo formatado em Markdown (com headers, listas e negrito).
    4. Uma categoria curta (ex: 'Dicas de Currículo', 'Entrevistas', 'LinkedIn').
    
    Responda ESTRITAMENTE em JSON com as chaves: title, excerpt, content, category.
    """
    
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Você é um redator de blog de carreira sênior que escreve em Português do Brasil."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na IA: {str(e)}")

@app.post("/api/admin/prompts")
async def update_prompt(
    slug: str = Form(...),
    system_instructions: str = Form(...),
    user_instructions: str = Form(...),
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Admin: update a specific prompt's instructions."""
    
    prompt = db.query(PromptConfig).filter(PromptConfig.slug == slug).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt não encontrado.")
    
    prompt.system_instructions = system_instructions
    prompt.user_instructions = user_instructions
    db.commit()
    
    return {"status": "success", "message": f"Prompt '{slug}' atualizado com sucesso."}

# --- NEW ENDPOINTS V2.0 ---

@app.get("/api/historico")
async def get_historico(email: str, db: Session = Depends(get_db)):
    if not email or "@" not in email:
        raise HTTPException(400, "E-mail inválido.")
    rows = db.query(ScanResult).filter(
        ScanResult.email == email.lower().strip()
    ).order_by(ScanResult.created_at.desc()).limit(10).all()
    return [{"id":r.id,"score":r.score_estrutural,"data":r.created_at} for r in rows]

@app.get("/api/resultado/{token}")
async def get_public_result(token: str, db: Session = Depends(get_db)):
    pub = db.query(PublicResult).filter(PublicResult.token == token).first()
    if not pub:
        raise HTTPException(404, "Resultado não encontrado.")
    if pub.expires_at < datetime.utcnow():
        raise HTTPException(410, "Link expirado.")
    return {"result":json.loads(pub.result_json), "filename":pub.filename}

@app.get("/api/admin/metrics")
async def get_metrics(admin_key: str = Depends(verify_admin),
                      db: Session = Depends(get_db)):
    thirty_ago = datetime.utcnow() - timedelta(days=30)
    scans_dia = db.query(
        func.date(UsageLog.created_at).label("dia"),
        func.count(UsageLog.id).label("total")
    ).filter(UsageLog.created_at >= thirty_ago
    ).group_by(func.date(UsageLog.created_at)).all()
    
    total_leads = db.query(Lead).count()
    total_scans = db.query(UsageLog).filter(UsageLog.action == "scan").count()
    conversao = round(total_leads/total_scans*100, 1) if total_scans else 0
    
    top_sources = db.query(Lead.source, func.count(Lead.id).label("n")
    ).group_by(Lead.source).order_by(func.count(Lead.id).desc()).limit(5).all()
    
    total_parceiros = db.query(RecruiterCode).count()
    total_entrev = db.query(InterviewSession).count()
    entrev_ok = db.query(InterviewSession).filter(InterviewSession.status == "completed").count()
    
    return {
        "total_leads": total_leads, "total_scans": total_scans,
        "taxa_conversao": conversao,
        "total_parceiros": total_parceiros,
        "scans_por_dia": [{"dia":str(r.dia),"total":r.total} for r in scans_dia],
        "top_sources": [{"source":r.source,"total":r.n} for r in top_sources],
        "total_entrevistas": total_entrev, "concluidas": entrev_ok
    }

@app.post("/api/admin/leads/{lead_id}/reenviar")
async def reenviar_relatorio(
    lead_id: int,
    background_tasks: BackgroundTasks,
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead não encontrado.")
    
    file_path = os.path.join(UPLOAD_DIR, lead.filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "Arquivo de CV não encontrado no storage.")
    
    with open(file_path, "rb") as f:
        content = f.read()
    
    background_tasks.add_task(
        process_deep_analysis_and_email,
        lead.name, lead.email, lead.phone, lead.filename, content
    )
    return {"message": f"Reanálise agendada para {lead.email}."}


@app.post("/api/admin/recruiter-codes")
async def create_recruiter_code(
    code: str = Form(...), 
    name: str = Form(...), 
    email: str = Form(...),
    admin_key: str = Depends(verify_admin), 
    db: Session = Depends(get_db)
):
    """Admin: create a new recruiter access code."""
    existing = db.query(RecruiterCode).filter(RecruiterCode.code == code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Código já existe.")
    
    temp_pass = generate_temp_password()
    hashed = hash_password(temp_pass)
    
    rc = RecruiterCode(
        code=code, 
        name=name, 
        email=email.lower().strip(), 
        password_hash=hashed,
        must_change_password=1
    )
    db.add(rc)
    db.commit()
    
    # Optional: could send email here too
    return {
        "message": f"Código '{code}' criado para {name}.",
        "temporary_password": temp_pass
    }

@app.put("/api/admin/recruiter-codes/{recruiter_id}")
async def update_recruiter(
    recruiter_id: int,
    name: str = Form(None),
    code: str = Form(None),
    email: str = Form(None),
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Admin: update an existing recruiter's details."""
    rc = db.query(RecruiterCode).filter(RecruiterCode.id == recruiter_id).first()
    if not rc:
        raise HTTPException(status_code=404, detail="Recrutador não encontrado.")
    
    if name:
        rc.name = name
    if email:
        rc.email = email.lower().strip()
    if code and code != rc.code:
        # Check if new code is unique
        existing = db.query(RecruiterCode).filter(RecruiterCode.code == code).first()
        if existing:
            raise HTTPException(status_code=409, detail="Este código já está em uso.")
        rc.code = code
        
    db.commit()
    return {"message": "Recrutador atualizado com sucesso.", "id": recruiter_id}

@app.delete("/api/admin/recruiter-codes/{recruiter_id}")
async def delete_recruiter(
    recruiter_id: int,
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Admin: delete a recruiter."""
    rc = db.query(RecruiterCode).filter(RecruiterCode.id == recruiter_id).first()
    if not rc:
        raise HTTPException(status_code=404, detail="Recrutador não encontrado.")
    
    db.delete(rc)
    db.commit()
    return {"message": "Recrutador removido com sucesso."}

from pydantic import BaseModel

class InviteRequest(BaseModel):
    name: str
    email: str
    code: str
    phone: str = None


@app.post("/api/recruiter/invite")
async def process_invite(invite: InviteRequest, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if code already exists
    existing = db.query(RecruiterCode).filter(RecruiterCode.code == invite.code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Este código já está em uso por outro parceiro. Escolha outro.")

    # Generate Secure Password
    temp_pass = generate_temp_password()
    hashed_pass = hash_password(temp_pass)

    # Generate Terms PDF
    timestamp = int(time.time())
    pdf_filename = f"Termo_Aceite_{invite.code}_{timestamp}.pdf"
    pdf_path = os.path.join(TERMOS_DIR, pdf_filename)
    
    client_ip = request.client.host if request.client else "127.0.0.1"
    generate_terms_pdf(pdf_path, invite.name, invite.email, invite.code, client_ip)
    
    # Send email to Admin
    admin_email = os.getenv("FROM_EMAIL") or os.getenv("SMTP_USERNAME")
    if admin_email:
        background_tasks.add_task(send_admin_new_partner_email, admin_email, invite.name, invite.code, pdf_path)
    
    # Send Welcome Email to Partner
    background_tasks.add_task(send_welcome_credentials_email, invite.email, invite.name, temp_pass, invite.code)

    # Save to DB
    new_rc = RecruiterCode(
        code=invite.code, 
        name=invite.name, 
        email=invite.email.lower().strip(),
        password_hash=hashed_pass,
        phone=invite.phone,
        must_change_password=1
    )
    db.add(new_rc)
    db.commit()

    # W-05: Notify Admin via WhatsApp
    admin_phone = os.getenv("ADMIN_PHONE", "")
    if admin_phone and os.getenv("EVOLUTION_API_URL"):
        admin_msg = (
            f"🤝 *ScannerCV — Novo Parceiro Cadastrado!*\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"👤 *Nome:* {invite.name}\n"
            f"📧 *E-mail:* {invite.email}\n"
            f"🔑 *Código:* {invite.code}\n"
            f"🕐 *Data:* {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC\n\n"
            f"📋 O termo de LGPD assinado foi enviado para o seu e-mail."
        )
        background_tasks.add_task(send_whatsapp, admin_phone, admin_msg)

    return {"message": "Parceria aceita com sucesso. Verifique seu e-mail para as credenciais de acesso."}

async def send_welcome_credentials_email(target_email: str, name: str, password: str, code: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    app_url = os.getenv("APP_BASE_URL", "https://scannercv.com.br")

    if not all([smtp_server, smtp_port, smtp_user, smtp_pass]):
        logger.info("⚠️ SMTP não configurado. Não foi possível enviar e-mail de boas-vindas.")
        return

    msg = EmailMessage()
    msg['Subject'] = 'Bem-vindo ao ScannerCV - Suas Credenciais de Acesso'
    msg['From'] = smtp_user
    msg['To'] = target_email

    content = f"""
    Olá {name},

    Sua parceria com a ScannerCV foi ativada com sucesso!

    Aqui estão suas credenciais para acessar o painel do parceiro:

    Link do Painel: {app_url}/login
    Seu E-mail: {target_email}
    Senha Temporária: {password}

    Seu Link de Divulgação: {app_url}/p/{code}

    * Por segurança, você será solicitado a alterar sua senha no primeiro acesso.

    Seja bem-vindo(a)!
    Equipe ScannerCV
    """
    msg.set_content(content)

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_server,
            port=int(smtp_port),
            username=smtp_user,
            password=smtp_pass,
            use_tls=True if int(smtp_port) == 465 else False,
            start_tls=True if int(smtp_port) == 587 else False,
        )
        logger.info(f"✅ E-mail de boas-vindas enviado para {target_email}")
    except Exception as e:
        logger.info(f"❌ Erro ao enviar e-mail de boas-vindas: {e}")

def generate_terms_pdf(filename, name, email, code, ip_address):
    doc = SimpleDocTemplate(filename, pagesize=letter, leftMargin=50, rightMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, spaceAfter=20, alignment=1)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=11, leading=16, spaceAfter=12)
    
    story = []
    story.append(Paragraph("TERMO DE COMPROMISSO E SIGILO DE DADOS (LGPD)", title_style))
    story.append(Spacer(1, 20))
    
    text1 = f"Pelo presente instrumento, a pessoa identificada como <b>{name}</b> (E-mail: {email}), doravante denominada CONSULTOR PARCEIRO, vinculada ao código de acesso único <b>'{code}'</b> na plataforma ScannerCV, firma o compromisso legal de sigilo e confidencialidade sobre todos os dados pessoais gerenciados."
    story.append(Paragraph(text1, body_style))
    
    text2 = "O CONSULTOR PARCEIRO se compromete, sob as normas da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), a utilizar os dados de Nome, E-mail e Telefone dos candidatos que ingressarem sob sua URL de referência de forma estritamente confidencial e vinculada apenas à prospecção de serviços de consultoria profissional."
    story.append(Paragraph(text2, body_style))
    
    text3 = "Das proibições: Fica estritamente vedada a venda, comercialização, repasse a entidades terceiras ou a utilização destes dados para disparo em massa de assuntos não relacionados à carreira do candidato submetido."
    story.append(Paragraph(text3, body_style))
    
    text4 = "Este termo constitui um registro oficial da concordância e responsabilização direta do CONSULTOR PARCEIRO pelo vazamento ou mau uso dos dados obtidos através do painel de recrutador."
    story.append(Paragraph(text4, body_style))
    
    story.append(Spacer(1, 30))
    story.append(Paragraph(f"<b>DATA E HORA DO ACEITE:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} (UTC)", body_style))
    story.append(Paragraph(f"<b>IP DO ASSINANTE:</b> {ip_address}", body_style))
    
    doc.build(story)

async def send_admin_new_partner_email(admin_email: str, partner_name: str, partner_code: str, pdf_path: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    if not all([smtp_server, smtp_port, smtp_user, smtp_pass]):
         return
         
    msg = EmailMessage()
    msg['Subject'] = f'Novo Parceiro ScannerCV Registrado: {partner_name}'
    msg['From'] = smtp_user
    msg['To'] = admin_email
    
    msg.set_content(f"Olá Admin,\n\nUm novo parceiro registrou aceitou os termos de LGPD.\n\nParceiro: {partner_name}\nCódigo: {partner_code}\n\nO termo assinado com IP e Data está em anexo para sua segurança e validação jurídica.\n\nEquipe ScannerCV.")
    
    try:
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()
        msg.add_attachment(pdf_data, maintype='application', subtype='pdf', filename=f"Termo_LGPD_{partner_code}.pdf")
        
        await aiosmtplib.send(
            msg,
            hostname=smtp_server,
            port=int(smtp_port),
            username=smtp_user,
            password=smtp_pass,
            use_tls=True if int(smtp_port) == 465 else False,
            start_tls=True if int(smtp_port) == 587 else False,
        )
    except Exception as e:
        logger.info(f"Error sending admin email: {e}")

# --- INTERVIEW TRAINING MODULE ROUTES ---
from interview import router as interview_router, register_routes as register_interview_routes
register_interview_routes(
    interview_router, get_db, openai_client,
    InterviewSession, InterviewMessage, InterviewReport, logger.info,
)
app.include_router(interview_router)

# --- FRONTEND SERVING ---
# Mount static files (HTML, JS, CSS)
# The "static" folder is where the built frontend will be copied in the Docker image
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="static_assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Empty path or root path serves the frontend
        if not full_path or full_path == "":
            index_path = os.path.join("static", "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)

        # If the path looks like an API call (starts with /api), don't serve index.html
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        
        # Avoid serving index.html for static assets that are missing (optional but cleaner)
        if "." in full_path and not full_path.endswith(".html"):
             raise HTTPException(status_code=404)

        # Serve the React app for all other routes
        index_path = os.path.join("static", "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "Frontend build not found. Please build the frontend and put it in the 'static' folder."}

def get_mock_response(filename):
    return {
        "filename": filename,
        "result": {
            "score_estrutural": 65,
            "analise_itens": [
                {
                    "item": "Informações de Contato",
                    "presente": True,
                    "feedback": "Contato bem definido (telefone, e-mail)."
                },
                {
                    "item": "Resumo Profissional",
                    "presente": False,
                    "feedback": "Falta um resumo profissional claro no início do documento."
                },
                {
                    "item": "Formatação Limpa (ATS)",
                    "presente": True,
                    "feedback": "Boa estrutura de texto sem elementos gráficos que quebrem a leitura."
                },
                {
                    "item": "Uso de Palavras-chave",
                    "presente": False,
                    "feedback": "Poucas tecnologias citadas de forma clara."
                }
            ],
            "message": "(Mock) Lembre-se de configurar a API_KEY da OpenAI no .env!"
        }
    }
