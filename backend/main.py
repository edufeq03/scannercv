from datetime import datetime, timedelta
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks, Depends, Request, Header
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
from openai import AsyncOpenAI
from dotenv import load_dotenv

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

import aiosmtplib
from email.message import EmailMessage
import mimetypes

load_dotenv(override=True)

def log_debug(message):
    with open("debug.log", "a", encoding="utf-8") as f:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"[{timestamp}] {message}\n")
    print(message)

log_debug("--- SERVER STARTING / RELOADING ---")

# --- STORAGE CONFIGURATION ---
STORAGE_BASE_DIR = "storage"
UPLOAD_DIR = os.path.join(STORAGE_BASE_DIR, "uploads")
REPORT_DIR = os.path.join(STORAGE_BASE_DIR, "reports")

TERMOS_DIR = os.path.join(STORAGE_BASE_DIR, "termos_aceite_parceiro")

# Ensure storage directories exist
for directory in [UPLOAD_DIR, REPORT_DIR, TERMOS_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)
        log_debug(f"Diretório criado: {directory}")

# --- DATABASE CONFIGURATION ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./scannercv.db")

# For SQLite, we need connect_args={"check_same_thread": False}
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, index=True)
    phone = Column(String)
    filename = Column(String)
    status = Column(String, default="Processando")
    source = Column(String, default="orgânico") # 'orgânico' or a recruiter code
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
    created_at = Column(DateTime, default=datetime.utcnow)

class PromptConfig(Base):
    __tablename__ = "prompt_configs"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True) # e.g., 'structural_analysis', 'job_match'
    title = Column(String)
    system_instructions = Column(String)
    user_instructions = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- S-01: Admin Auth via Header ---
def verify_admin(authorization: str = Header(None)):
    """Validates admin access via Authorization: Bearer <token> header."""
    expected = os.getenv("ADMIN_PASSWORD")
    if not expected:
        raise HTTPException(status_code=500, detail="ADMIN_PASSWORD não configurado no servidor.")
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Header Authorization: Bearer <token> ausente.")
    
    token = authorization.replace("Bearer ", "", 1)
    if token != expected:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return token

# --- S-03: Recruiter Auth via Database ---
def verify_recruiter(recruiter_key: str = None, db: Session = Depends(get_db)):
    """Validates recruiter access by checking the code against the database."""
    if not recruiter_key:
        raise HTTPException(status_code=403, detail="Código de recrutador obrigatório.")
    record = db.query(RecruiterCode).filter(RecruiterCode.code == recruiter_key).first()
    if not record:
        raise HTTPException(status_code=403, detail="Código de recrutador inválido.")
    return record

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

app = FastAPI(title="ScannerCV API")

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

# --- S-02: Validate critical env vars on startup ---
@app.on_event("startup")
async def validate_config():
    pwd = os.getenv("ADMIN_PASSWORD")
    if not pwd or len(pwd.strip()) < 6:
        log_debug("⚠️  ADMIN_PASSWORD não configurado ou muito curto! Defina no .env.")
    else:
        log_debug("✅ ADMIN_PASSWORD configurado.")
    
    if not os.getenv("OPENAI_API_KEY"):
        log_debug("⚠️  OPENAI_API_KEY não configurado. Sistema usará dados mock.")
    else:
        log_debug("✅ OPENAI_API_KEY configurado.")
    
    log_debug(f"✅ CORS: {ALLOWED_ORIGINS}")
    log_debug(f"✅ Rate Limit: {os.getenv('DAILY_SCAN_LIMIT', '5')} análises/dia")
    log_debug(f"✅ Modelo OpenAI: {OPENAI_MODEL}")
    log_debug("--- CONFIG VALIDADA ---")

# Root route is now handled by serve_frontend below

@app.post("/api/scan")
async def scan_cv(request: Request, file: UploadFile = File(...), client_ip: str = Depends(check_rate_limit), db: Session = Depends(get_db)):

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são suportados.")

    try:
        content = await file.read()
        text = ""
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        
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
        
        prompt = f"{user_instr_template}\n\nCurrículo:\n{text[:4000]}"
        
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": sys_instr},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        result_json = json.loads(response.choices[0].message.content)

        # Log usage on success
        usage = UsageLog(ip_address=client_ip, action="scan")
        db.add(usage)
        db.commit()

        return {
            "filename": file.filename,
            "result": result_json
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
        cv_text = ""
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    cv_text += extracted + "\n"

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
        log_debug(f"Error in /api/match: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar a compatibilidade.")

async def process_deep_analysis_and_email(name: str, email: str, phone: str, filename: str, content: bytes):
    log_debug(f"--- INICIANDO ANÁLISE PROFUNDA (CAMADA 2) P/ {email} ---")
    
    try:
        # 1. Extract text again
        text = ""
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        
        if not text.strip():
            log_debug("CV text empty, aborting deep analysis.")
            return

        log_debug(f"Texto extraído ({len(text)} chars). Chamando OpenAI...")

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
        log_debug(f"--- ANÁLISE PROFUNDA CONCLUÍDA. PDF GERADO: {pdf_path} ---")
        await send_email_report(email, name, pdf_path)
        
        # Cleanup (Disabled for debugging, but pointing to correct path if enabled)
        # if os.path.exists(pdf_path):
        #     os.remove(pdf_path)
            
    except Exception as e:
        log_debug(f"FAILED DEEP ANALYSIS FOR {email}: {e}")

async def send_email_report(to_email: str, name: str, pdf_filename: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", smtp_user)

    if not all([smtp_server, smtp_port, smtp_user, smtp_pass]):
        log_debug(f"Missing SMTP configuration. Server: {bool(smtp_server)}, Port: {bool(smtp_port)}, User: {bool(smtp_user)}, Pass: {bool(smtp_pass)}")
        return

    log_debug(f"Enviando e-mail via {smtp_server}:{smtp_port} para {to_email}...")

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
        log_debug(f"Email successfully sent to {to_email}")
    except Exception as e:
        log_debug(f"Failed to send email to {to_email}: {e}")

def generate_pdf_report(filename, name, data):
    doc = SimpleDocTemplate(filename, pagesize=letter, leftMargin=50, rightMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    brand_color = colors.HexColor("#2563eb")  # Blue 600
    text_color = colors.HexColor("#1e293b")   # Slate 800
    muted_color = colors.HexColor("#64748b")  # Slate 500
    
    title_style = ParagraphStyle(
        'PremiumTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=brand_color,
        spaceAfter=12,
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
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold',
        borderPadding=(0, 0, 5, 0),
        borderWidth=0,
        borderColor=brand_color
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
        spaceAfter=8,
        bulletFontName='Helvetica-Bold'
    )

    story = []
    
    # --- HEADER / BRANDING ---
    story.append(Paragraph("ScannerCV", title_style))
    story.append(Paragraph(f"Raio-X Profissional de Currículo | Gerado para {name}", subtitle_style))
    
    # --- INTRO SECTION ---
    story.append(Paragraph("Análise de Impacto Geral", h2_style))
    story.append(Paragraph(data.get("analise_detalhada", ""), body_style))
    story.append(Spacer(1, 10))
    
    # --- STRENGTHS & GAPS TABLE ---
    # We use a table for a side-by-side or distinct block feel
    section_data = [
        [Paragraph("<b>PONTOS FORTES</b>", body_style), Paragraph("<b>PONTOS DE ATENÇÃO</b>", body_style)]
    ]
    
    # Interleave lists for the table
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
        ('LINEBELOW', (0,0), (-1,0), 1, brand_color),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('TOPPADDING', (0,1), (-1,-1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))
    
    # --- PRACTICAL ACTION PLAN ---
    story.append(Paragraph("Plano de Ação Tático", h2_style))
    story.append(Paragraph("Siga estas recomendações para aumentar sua taxa de conversão em entrevistas:", body_style))
    story.append(Spacer(1, 10))
    
    for dica in data.get("dicas_praticas", []):
        story.append(Paragraph(f"<b>Ação:</b> {dica}", bullet_style))
    
    # --- FOOTER ---
    story.append(Spacer(1, 40))
    footer_text = "Esta análise foi gerada por Inteligência Artificial treinada em padrões globais de recrutamento. Use-a como um guia para otimizar sua presença no mercado."
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
        
        log_debug(f"Lead salvo no DB: {name} ({email}) - ID: {db_lead.id}")
        
        # Schedule the deep analysis to run in the background without blocking the UI
        background_tasks.add_task(process_deep_analysis_and_email, name, email, phone, file.filename, content)
        
        return {"message": "Lead salvo com sucesso. Análise profunda iniciada em background."}
    except Exception as e:
        log_debug(f"Error saving lead: {e}")
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
    
    recruiters = db.query(RecruiterCode).all()
    result = []
    
    for r in recruiters:
        # Count leads for this recruiter
        lead_count = db.query(Lead).filter(Lead.source == r.code).count()
        result.append({
            "id": r.id,
            "code": r.code,
            "name": r.name,
            "lead_count": lead_count
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

@app.post("/api/admin/recruiter-codes")
async def create_recruiter_code(code: str = Form(...), name: str = Form(...), admin_key: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Admin: create a new recruiter access code."""
    existing = db.query(RecruiterCode).filter(RecruiterCode.code == code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Código já existe.")
    rc = RecruiterCode(code=code, name=name)
    db.add(rc)
    db.commit()
    return {"message": f"Código '{code}' criado para {name}."}

from pydantic import BaseModel

class InviteRequest(BaseModel):
    token: str
    name: str
    email: str
    code: str

@app.post("/api/recruiter/invite")
async def process_invite(invite: InviteRequest, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Very basic validation or token check could go here
    # Check if code already exists
    existing = db.query(RecruiterCode).filter(RecruiterCode.code == invite.code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Este código já está em uso por outro parceiro. Escolha outro.")

    # Generate Terms PDF
    timestamp = int(time.time())
    pdf_filename = f"Termo_Aceite_{invite.code}_{timestamp}.pdf"
    pdf_path = os.path.join(TERMOS_DIR, pdf_filename)
    
    client_ip = request.client.host
    generate_terms_pdf(pdf_path, invite.name, invite.email, invite.code, client_ip)
    
    # Send email to Admin
    admin_email = os.getenv("FROM_EMAIL") or os.getenv("SMTP_USERNAME")
    if admin_email:
        background_tasks.add_task(send_admin_new_partner_email, admin_email, invite.name, invite.code, pdf_path)

    # Save to DB (S-03: auth is 100% via database now, no more os.environ hack)
    new_rc = RecruiterCode(code=invite.code, name=invite.name)
    db.add(new_rc)
    db.commit()

    return {"message": "Parceria aceita com sucesso."}

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
        log_debug(f"Error sending admin email: {e}")

# --- INTERVIEW TRAINING MODULE ROUTES ---
from interview import router as interview_router, register_routes as register_interview_routes
register_interview_routes(
    interview_router, get_db, openai_client,
    InterviewSession, InterviewMessage, InterviewReport, log_debug,
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
