from datetime import datetime, timedelta
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks, Depends, Request

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

import aiosmtplib
from email.message import EmailMessage
import mimetypes

load_dotenv()

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

# Ensure storage directories exist
for directory in [UPLOAD_DIR, REPORT_DIR]:
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

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="ScannerCV API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

# Root route is now handled by serve_frontend below

@app.post("/api/scan")
async def scan_cv(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    client_ip = request.client.host
    
    # Rate limit check: 1 scan per IP per 24 hours
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    usage_count = db.query(UsageLog).filter(
        UsageLog.ip_address == client_ip,
        UsageLog.created_at >= twenty_four_hours_ago
    ).count()

    if usage_count >= 1:
        log_debug(f"Rate limit hit for IP: {client_ip}")
        raise HTTPException(
            status_code=429, 
            detail="Você atingiu o limite de 1 análise gratuita por dia. Volte amanhã ou fale com um consultor para acesso ilimitado."
        )

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

        prompt = f"""
        Você é um especialista em recrutamento e sistemas ATS. Analise o seguinte currículo e forneça uma avaliação estrutural "Camada 1".
        Seu objetivo é verificar rapidamente a saúde do documento e gerar um Score Estrutural de 0 a 100.
        
        Métricas obrigatórias a analisar:
        1. "Informações de Contato" (Confirme se há telefone, e-mail e LinkedIn).
        2. "Resumo Profissional" (Verifique se há um parágrafo que venda o peixe do candidato).
        3. "Objetivo Claro" (O candidato diz o que quer ou está "atirando para todo lado"?).
        4. "Formatação ATS" (Verifique se o texto está limpo e fácil para um robô ler).
        5. "Densidade de Palavras-chave" (Identifique termos técnicos da área de atuação).
        
        Responda ESTRITAMENTE em formato JSON:
        {{
            "score_estrutural": 80,
            "message": "Mensagem curta geral (incentive a fazer a análise profunda)",
            "analise_itens": [
                {{"item": "Nome da Métrica", "presente": true/false, "feedback": "Feedback curto e direto"}}
            ]
        }}
        
        Currículo:
        {text[:4000]}
        """
        
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": "Você é um assistente de RH de precisão que responde apenas em JSON válido."},
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
            filename=safe_filename
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
async def get_leads(admin_key: str = None, db: Session = Depends(get_db)):
    """Admin: sees ALL leads + usage stats."""
    if admin_key != os.getenv("ADMIN_PASSWORD", "scannercv123"):
        raise HTTPException(status_code=403, detail="Acesso negado.")
    
    leads = db.query(Lead).order_by(Lead.created_at.desc()).all()
    total_scans = db.query(UsageLog).count()
    return {"leads": leads, "total_scans": total_scans}

@app.get("/api/recruiter/leads")
async def get_recruiter_leads(recruiter_key: str = None, db: Session = Depends(get_db)):
    """Recruiter: sees all leads (limited fields), no admin stats.
    RECRUITER_CODES env var = comma-separated list of valid keys, e.g. 'rh_alpha,rh_beta'
    """
    valid_codes = [c.strip() for c in os.getenv("RECRUITER_CODES", "").split(",") if c.strip()]
    if not recruiter_key or recruiter_key not in valid_codes:
        raise HTTPException(status_code=403, detail="Código de recrutador inválido.")

    leads = db.query(Lead).order_by(Lead.created_at.desc()).all()
    # Return limited fields: no phone, no filename
    return [
        {
            "id": l.id,
            "name": l.name,
            "email": l.email,
            "status": l.status,
            "created_at": l.created_at,
        }
        for l in leads
    ]

@app.post("/api/admin/recruiter-codes")
async def create_recruiter_code(admin_key: str = None, code: str = Form(...), name: str = Form(...), db: Session = Depends(get_db)):
    """Admin: create a new recruiter access code."""
    if admin_key != os.getenv("ADMIN_PASSWORD", "scannercv123"):
        raise HTTPException(status_code=403, detail="Acesso negado.")
    existing = db.query(RecruiterCode).filter(RecruiterCode.code == code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Código já existe.")
    rc = RecruiterCode(code=code, name=name)
    db.add(rc)
    db.commit()
    return {"message": f"Código '{code}' criado para {name}."}

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
