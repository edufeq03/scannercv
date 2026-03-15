"""
interview.py — Interview Training Module for ScannerCV.
Handles session management, multi-language prompts, LLM evaluation, and report generation.
Integrates with Evolution API (WhatsApp) and supports text + audio responses.
"""
import os
import uuid
import json
import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from audio_handler import download_audio, transcribe_audio

# ─── Router ───────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/api/interview", tags=["Interview Training"])

# ─── Environment ──────────────────────────────────────────────────────────────
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "scannercv")

# ─── Multi-Language Prompts ───────────────────────────────────────────────────
PROMPTS = {
    "scenario_creator": {
        "pt": (
            "Você é um entrevistador técnico sênior e mentor de carreira brasileiro. "
            "Com base na descrição da vaga abaixo, crie um cenário realista de entrevista. "
            "Defina: o cargo-alvo, a empresa fictícia ou real, a fase da entrevista (ex: 2ª fase com Engineering Manager), "
            "e gere exatamente {n_questions} perguntas técnicas e comportamentais progressivas. "
            "Misture perguntas técnicas específicas da vaga com perguntas comportamentais (STAR). "
            "Responda ESTRITAMENTE em JSON:\n"
            '{{"cenario": "descrição do cenário em 2 frases", "empresa": "nome", "cargo": "nome do cargo", '
            '"fase": "fase da entrevista", "perguntas": ["pergunta 1", "pergunta 2", ...]}}\n\n'
            "DESCRIÇÃO DA VAGA:\n{job_description}"
        ),
        "en": (
            "You are a senior technical interviewer and career mentor. "
            "Based on the job description below, create a realistic interview scenario. "
            "Define: the target role, the fictional or real company, the interview stage (e.g., 2nd round with Engineering Manager), "
            "and generate exactly {n_questions} progressive technical and behavioral questions. "
            "Mix job-specific technical questions with behavioral questions (STAR method). "
            "Respond STRICTLY in JSON:\n"
            '{{"cenario": "scenario in 2 sentences", "empresa": "company name", "cargo": "role name", '
            '"fase": "interview stage", "perguntas": ["question 1", "question 2", ...]}}\n\n'
            "JOB DESCRIPTION:\n{job_description}"
        ),
        "es": (
            "Eres un entrevistador técnico senior y mentor de carrera. "
            "Con base en la descripción del puesto a continuación, crea un escenario de entrevista realista. "
            "Define: el puesto objetivo, la empresa ficticia o real, la fase de la entrevista (ej: 2ª ronda con Engineering Manager), "
            "y genera exactamente {n_questions} preguntas técnicas y conductuales progresivas. "
            "Mezcla preguntas técnicas específicas del puesto con preguntas conductuales (método STAR). "
            "Responde ESTRICTAMENTE en JSON:\n"
            '{{"cenario": "escenario en 2 frases", "empresa": "nombre de empresa", "cargo": "nombre del puesto", '
            '"fase": "fase de entrevista", "perguntas": ["pregunta 1", "pregunta 2", ...]}}\n\n'
            "DESCRIPCIÓN DEL PUESTO:\n{job_description}"
        ),
    },
    "system_interviewer": {
        "pt": "Você é um entrevistador técnico sênior brasileiro conduzindo uma simulação de entrevista. Responda apenas em JSON válido.",
        "en": "You are a senior technical interviewer conducting an interview simulation. Respond only in valid JSON.",
        "es": "Eres un entrevistador técnico senior conduciendo una simulación de entrevista. Responde solo en JSON válido.",
    },
    "response_evaluator": {
        "pt": (
            "Avalie a resposta do candidato para a pergunta de entrevista abaixo. "
            "Dê um score de 0 a 100 e um feedback construtivo curto (2-3 frases). "
            "Seja justo mas exigente como um recrutador real.\n"
            "Responda em JSON: {{\"score\": <número>, \"feedback\": \"texto\", \"proximo_comentario\": \"uma frase de transição para a próxima pergunta\"}}\n\n"
            "PERGUNTA: {question}\n\nRESPOSTA DO CANDIDATO: {answer}"
        ),
        "en": (
            "Evaluate the candidate's answer to the interview question below. "
            "Give a score from 0 to 100 and short constructive feedback (2-3 sentences). "
            "Be fair but demanding like a real recruiter.\n"
            "Respond in JSON: {{\"score\": <number>, \"feedback\": \"text\", \"proximo_comentario\": \"one transition sentence to next question\"}}\n\n"
            "QUESTION: {question}\n\nCANDIDATE'S ANSWER: {answer}"
        ),
        "es": (
            "Evalúa la respuesta del candidato a la pregunta de entrevista a continuación. "
            "Da una puntuación de 0 a 100 y un feedback constructivo corto (2-3 frases). "
            "Sé justo pero exigente como un reclutador real.\n"
            "Responde en JSON: {{\"score\": <número>, \"feedback\": \"texto\", \"proximo_comentario\": \"una frase de transición a la siguiente pregunta\"}}\n\n"
            "PREGUNTA: {question}\n\nRESPUESTA DEL CANDIDATO: {answer}"
        ),
    },
    "report_generator": {
        "pt": (
            "Você é um consultor de carreira sênior. Analise o desempenho completo do candidato na entrevista simulada. "
            "Gere um relatório final detalhado.\n"
            "Responda em JSON:\n"
            '{{"overall_score": <0-100>, "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"], '
            '"improvements": ["melhoria 1", "melhoria 2", "melhoria 3"], '
            '"detailed_feedback": "análise aprofundada de 3-4 frases sobre o desempenho geral", '
            '"recommendation": "recomendação estratégica de 2-3 frases para os próximos passos"}}\n\n'
            "VAGA: {job_description}\n\nPERGUNTAS E RESPOSTAS:\n{qa_pairs}"
        ),
        "en": (
            "You are a senior career consultant. Analyze the candidate's complete performance in the simulated interview. "
            "Generate a detailed final report.\n"
            "Respond in JSON:\n"
            '{{"overall_score": <0-100>, "strengths": ["strength 1", "strength 2", "strength 3"], '
            '"improvements": ["improvement 1", "improvement 2", "improvement 3"], '
            '"detailed_feedback": "in-depth analysis of 3-4 sentences about overall performance", '
            '"recommendation": "strategic recommendation of 2-3 sentences for next steps"}}\n\n'
            "JOB: {job_description}\n\nQUESTIONS AND ANSWERS:\n{qa_pairs}"
        ),
        "es": (
            "Eres un consultor de carrera senior. Analiza el desempeño completo del candidato en la entrevista simulada. "
            "Genera un informe final detallado.\n"
            "Responde en JSON:\n"
            '{{"overall_score": <0-100>, "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"], '
            '"improvements": ["mejora 1", "mejora 2", "mejora 3"], '
            '"detailed_feedback": "análisis profundo de 3-4 frases sobre el desempeño general", '
            '"recommendation": "recomendación estratégica de 2-3 frases para los próximos pasos"}}\n\n'
            "PUESTO: {job_description}\n\nPREGUNTAS Y RESPUESTAS:\n{qa_pairs}"
        ),
    },
    "welcome_message": {
        "pt": (
            "🤖 *ScannerCV Interview Bot*\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "Olá! 👋 Vou simular uma entrevista técnica com base na vaga que você enviou.\n\n"
            "📋 *Vaga:* {cargo} - {empresa}\n"
            "🎯 *Cenário:* {cenario}\n\n"
            "💡 Você pode responder por *TEXTO* ou *ÁUDIO* 🎙️\n"
            "Vamos lá! Relaxe e responda naturalmente.\n\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "📌 *Pergunta 1 de {total}:*\n\n"
            "_{pergunta}_\n"
            "━━━━━━━━━━━━━━━━━━━━━━"
        ),
        "en": (
            "🤖 *ScannerCV Interview Bot*\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "Hello! 👋 I'll simulate a technical interview based on the job you submitted.\n\n"
            "📋 *Role:* {cargo} - {empresa}\n"
            "🎯 *Scenario:* {cenario}\n\n"
            "💡 You can answer by *TEXT* or *AUDIO* 🎙️\n"
            "Let's go! Relax and answer naturally.\n\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "📌 *Question 1 of {total}:*\n\n"
            "_{pergunta}_\n"
            "━━━━━━━━━━━━━━━━━━━━━━"
        ),
        "es": (
            "🤖 *ScannerCV Interview Bot*\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "¡Hola! 👋 Voy a simular una entrevista técnica basada en la vacante que enviaste.\n\n"
            "📋 *Puesto:* {cargo} - {empresa}\n"
            "🎯 *Escenario:* {cenario}\n\n"
            "💡 Puedes responder por *TEXTO* o *AUDIO* 🎙️\n"
            "¡Vamos! Relájate y responde naturalmente.\n\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "📌 *Pregunta 1 de {total}:*\n\n"
            "_{pergunta}_\n"
            "━━━━━━━━━━━━━━━━━━━━━━"
        ),
    },
    "next_question": {
        "pt": "📌 *Pergunta {n} de {total}:*\n\n_{pergunta}_",
        "en": "📌 *Question {n} of {total}:*\n\n_{pergunta}_",
        "es": "📌 *Pregunta {n} de {total}:*\n\n_{pergunta}_",
    },
    "completion_message": {
        "pt": (
            "🤖 ━━━━━━━━━━━━━━━━━━━━━━\n"
            "✅ *Entrevista Concluída!*\n\n"
            "📊 *Seu Score:* {score}/100\n"
            "🟢 *Pontos fortes:* {strengths}\n"
            "🟡 *Melhorar:* {improvements}\n"
            "🎙️ {audio_count} de {total} respostas foram por áudio\n\n"
            "📄 Veja seu relatório completo:\n{report_url}\n"
            "━━━━━━━━━━━━━━━━━━━━━━"
        ),
        "en": (
            "🤖 ━━━━━━━━━━━━━━━━━━━━━━\n"
            "✅ *Interview Complete!*\n\n"
            "📊 *Your Score:* {score}/100\n"
            "🟢 *Strengths:* {strengths}\n"
            "🟡 *Improve:* {improvements}\n"
            "🎙️ {audio_count} of {total} answers were by audio\n\n"
            "📄 See your full report:\n{report_url}\n"
            "━━━━━━━━━━━━━━━━━━━━━━"
        ),
        "es": (
            "🤖 ━━━━━━━━━━━━━━━━━━━━━━\n"
            "✅ *¡Entrevista Completada!*\n\n"
            "📊 *Tu Puntuación:* {score}/100\n"
            "🟢 *Fortalezas:* {strengths}\n"
            "🟡 *Mejorar:* {improvements}\n"
            "🎙️ {audio_count} de {total} respuestas fueron por audio\n\n"
            "📄 Ve tu informe completo:\n{report_url}\n"
            "━━━━━━━━━━━━━━━━━━━━━━"
        ),
    },
}


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────
class InterviewStartRequest(BaseModel):
    phone: str
    language: str = "pt"
    job_description: str
    n_questions: int = 5

class SimulationAnswerRequest(BaseModel):
    """For web-based simulation mode (no WhatsApp needed)."""
    session_id: str
    answer: str
    message_type: str = "text"  # "text" or "audio"


# ─── Helper: Send WhatsApp message via Evolution API ──────────────────────────
async def send_whatsapp_message(phone: str, text: str):
    """Send a text message via Evolution API. Fails silently if not configured."""
    api_url = os.getenv("EVOLUTION_API_URL", "")
    api_key = os.getenv("EVOLUTION_API_KEY", "")
    instance = os.getenv("EVOLUTION_INSTANCE", "scannercv")

    if not api_url:
        print(f"[Interview] WhatsApp skip: EVOLUTION_API_URL not set. Phone: {phone}")
        return None

    import httpx
    # Sanitize phone: remove +, spaces, dashes, etc.
    clean_phone = "".join(filter(str.isdigit, phone))
    
    # Prepend 55 (Brazil) if it seems to be a domestic number (8-11 digits)
    if len(clean_phone) <= 11 and not clean_phone.startswith("55"):
        clean_phone = "55" + clean_phone

    url = f"{api_url}/message/sendText/{instance}"
    headers = {"apikey": api_key, "Content-Type": "application/json"}
    payload = {"number": clean_phone, "text": text}
    
    print(f"[Interview] Sending WhatsApp to {clean_phone} via {url} (SSL Verify=False)")
    try:
        # verify=False because Evolution API often uses self-signed certificates
        async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
            resp = await client.post(url, json=payload, headers=headers)
            print(f"[Interview] WhatsApp response ({resp.status_code}): {resp.text[:200]}")
            return resp.json()
    except Exception as e:
        print(f"[Interview] Failed to send WhatsApp message: {e}")
        return None


# ─── Helper: Call LLM ─────────────────────────────────────────────────────────
async def call_llm(openai_client, system_prompt: str, user_prompt: str, model: str = None) -> dict:
    """Call OpenAI and parse the JSON response."""
    if not model:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    response = await openai_client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
    )
    return json.loads(response.choices[0].message.content)


# ─── Endpoint: Start Interview ────────────────────────────────────────────────
def register_routes(app_router: APIRouter, get_db, openai_client, InterviewSession, InterviewMessage, InterviewReport, log_debug):
    """Register all interview routes. Called from main.py with dependencies."""

    @app_router.post("/start")
    async def start_interview(req: InterviewStartRequest, db: Session = Depends(get_db)):
        """Start a new interview simulation session."""
        lang = req.language if req.language in ["pt", "en", "es"] else "pt"

        if len(req.job_description.strip()) < 50:
            raise HTTPException(status_code=400, detail="Job description too short (minimum 50 characters).")

        if req.n_questions < 3 or req.n_questions > 8:
            req.n_questions = 5

        session_id = str(uuid.uuid4())

        # If OpenAI is available, generate scenario
        if openai_client.api_key:
            try:
                system_prompt = PROMPTS["system_interviewer"][lang]
                user_prompt = PROMPTS["scenario_creator"][lang].format(
                    n_questions=req.n_questions,
                    job_description=req.job_description[:3000],
                )
                scenario_data = await call_llm(openai_client, system_prompt, user_prompt)
            except Exception as e:
                log_debug(f"[Interview] LLM scenario error: {e}")
                scenario_data = _get_mock_scenario(lang, req.n_questions)
        else:
            scenario_data = _get_mock_scenario(lang, req.n_questions)

        questions = scenario_data.get("perguntas", [])
        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate interview questions.")

        # Sanitize and standardize phone number
        clean_phone = "".join(filter(str.isdigit, req.phone))
        if len(clean_phone) <= 11 and not clean_phone.startswith("55"):
            clean_phone = "55" + clean_phone

        # Save session
        session = InterviewSession(
            id=session_id,
            phone=clean_phone,
            language=lang,
            job_description=req.job_description,
            status="active",
            scenario=json.dumps(scenario_data, ensure_ascii=False),
            current_question=0,
            total_questions=len(questions),
        )
        db.add(session)

        # Save first interviewer message
        first_msg = InterviewMessage(
            session_id=session_id,
            role="interviewer",
            content=questions[0],
            message_type="text",
            question_number=1,
        )
        db.add(first_msg)
        db.commit()

        # Send WhatsApp welcome + first question
        welcome = PROMPTS["welcome_message"][lang].format(
            cargo=scenario_data.get("cargo", "N/A"),
            empresa=scenario_data.get("empresa", "N/A"),
            cenario=scenario_data.get("cenario", ""),
            total=len(questions),
            pergunta=questions[0],
        )
        await send_whatsapp_message(clean_phone, welcome)

        log_debug(f"[Interview] Session {session_id} started for {clean_phone} ({lang})")

        return {
            "session_id": session_id,
            "status": "active",
            "scenario": scenario_data,
            "current_question": 1,
            "total_questions": len(questions),
            "first_question": questions[0],
        }

    @app_router.post("/answer")
    async def submit_answer(req: SimulationAnswerRequest, db: Session = Depends(get_db)):
        """
        Submit an answer for the current question (web simulation mode).
        Evaluates the answer, advances to next question or generates report.
        """
        session = db.query(InterviewSession).filter(InterviewSession.id == req.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")
        if session.status != "active":
            raise HTTPException(status_code=400, detail="Session is no longer active.")

        scenario = json.loads(session.scenario)
        questions = scenario.get("perguntas", [])
        current_idx = session.current_question
        lang = session.language

        if current_idx >= len(questions):
            raise HTTPException(status_code=400, detail="All questions already answered.")

        current_question = questions[current_idx]

        # Save candidate message
        candidate_msg = InterviewMessage(
            session_id=req.session_id,
            role="candidate",
            content=req.answer,
            message_type=req.message_type,
            question_number=current_idx + 1,
        )
        db.add(candidate_msg)

        # Evaluate response via LLM
        if openai_client.api_key:
            try:
                eval_prompt = PROMPTS["response_evaluator"][lang].format(
                    question=current_question,
                    answer=req.answer,
                )
                evaluation = await call_llm(
                    openai_client,
                    PROMPTS["system_interviewer"][lang],
                    eval_prompt,
                )
            except Exception as e:
                log_debug(f"[Interview] LLM eval error: {e}")
                evaluation = {"score": 60, "feedback": "Unable to evaluate.", "proximo_comentario": ""}
        else:
            evaluation = {"score": 65, "feedback": "(Mock) Good answer structure.", "proximo_comentario": "Let's move on."}

        # Update candidate message with score + feedback
        candidate_msg.score = evaluation.get("score", 0)
        candidate_msg.feedback = evaluation.get("feedback", "")

        # Advance to next question
        session.current_question = current_idx + 1
        next_idx = current_idx + 1

        response_data = {
            "session_id": req.session_id,
            "question_answered": current_idx + 1,
            "score": evaluation.get("score", 0),
            "feedback": evaluation.get("feedback", ""),
            "transition": evaluation.get("proximo_comentario", ""),
        }

        if next_idx < len(questions):
            # There are more questions
            next_question = questions[next_idx]

            # Save interviewer message
            interviewer_msg = InterviewMessage(
                session_id=req.session_id,
                role="interviewer",
                content=next_question,
                message_type="text",
                question_number=next_idx + 1,
            )
            db.add(interviewer_msg)

            response_data["status"] = "active"
            response_data["next_question"] = next_question
            response_data["next_question_number"] = next_idx + 1
            response_data["total_questions"] = len(questions)

            # Send via WhatsApp
            transition_text = evaluation.get("proximo_comentario", "")
            question_text = PROMPTS["next_question"][lang].format(
                n=next_idx + 1, total=len(questions), pergunta=next_question,
            )
            msg_text = f"{transition_text}\n\n{question_text}" if transition_text else question_text
            await send_whatsapp_message(session.phone, msg_text)
        else:
            # Interview complete — generate report
            session.status = "completed"
            session.completed_at = datetime.utcnow()

            report_data = await _generate_report(
                db, session, openai_client, InterviewMessage, InterviewReport, log_debug,
            )
            response_data["status"] = "completed"
            response_data["report"] = report_data

            # Send completion message via WhatsApp
            base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
            report_url = f"{base_url}/entrevista/resultado/{req.session_id}"

            audio_count = db.query(InterviewMessage).filter(
                InterviewMessage.session_id == req.session_id,
                InterviewMessage.role == "candidate",
                InterviewMessage.message_type == "audio",
            ).count()

            completion_msg = PROMPTS["completion_message"][lang].format(
                score=report_data.get("overall_score", 0),
                strengths=", ".join(report_data.get("strengths", [])[:2]),
                improvements=", ".join(report_data.get("improvements", [])[:2]),
                audio_count=audio_count,
                total=len(questions),
                report_url=report_url,
            )
            await send_whatsapp_message(session.phone, completion_msg)

        db.commit()
        return response_data

    @app_router.post("/webhook")
    async def interview_webhook(request: Request, db: Session = Depends(get_db)):
        """
        Receive messages from Evolution API webhook.
        Detects text vs audio, transcribes audio, and processes the answer.
        """
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body.")

        # Evolution API sends various event types; we only care about incoming messages
        event = body.get("event")
        sender = body.get("data", {}).get("key", {}).get("remoteJid", "unknown")
        print(f"[Interview] Webhook received: {event} from {sender}")

        if event != "messages.upsert":
            return {"status": "ignored", "reason": f"event={event}"}

        data = body.get("data", {})
        message = data.get("message", {})
        key = data.get("key", {})

        # Ignore messages sent by us (fromMe=True)
        if key.get("fromMe", False):
            return {"status": "ignored", "reason": "own message"}

        # Extract and standardize phone number
        remote_jid = key.get("remoteJid", "")
        phone_raw = remote_jid.replace("@s.whatsapp.net", "").replace("@g.us", "")
        phone = "".join(filter(str.isdigit, phone_raw)) # Keep only digits
        
        # Ensure 55 prefix for consistency in DB lookup
        if len(phone) <= 11 and not phone.startswith("55"):
            phone = "55" + phone

        if not phone:
            print(f"[Interview] Webhook ignore: could not extract phone from {remote_jid}")
            return {"status": "ignored", "reason": "no phone"}

        print(f"[Interview] Webhook message from {phone}. Searching active session...")

        # Find active session for this phone
        session = db.query(InterviewSession).filter(
            InterviewSession.phone == phone,
            InterviewSession.status == "active",
        ).order_by(InterviewSession.created_at.desc()).first()

        if not session:
            print(f"[Interview] Webhook ignore: no active session found for {phone}")
            return {"status": "ignored", "reason": "no active session for this phone"}

        print(f"[Interview] Webhook processing answer for session {session.id}")

        # Determine message type and extract content
        msg_type = "text"
        answer_text = ""

        if "conversation" in message:
            answer_text = message["conversation"]
        elif "extendedTextMessage" in message:
            answer_text = message["extendedTextMessage"].get("text", "")
        elif "audioMessage" in message:
            msg_type = "audio"
            audio_msg = message["audioMessage"]

            # Download audio from Evolution API
            message_id = key.get("id", "")
            audio_url = f"{EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/{EVOLUTION_INSTANCE}"

            try:
                import httpx
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        audio_url,
                        json={"message": {"key": key}, "convertToMp4": False},
                        headers={"apikey": EVOLUTION_API_KEY},
                    )
                    audio_data = resp.json()

                import base64
                audio_bytes = base64.b64decode(audio_data.get("base64", ""))

                # Transcribe with Whisper
                transcription = await transcribe_audio(
                    audio_bytes, openai_client, session.language, "audio.ogg"
                )
                answer_text = transcription.get("text", "")
                audio_duration = transcription.get("duration")
            except Exception as e:
                log_debug(f"[Interview] Audio transcription error: {e}")
                answer_text = "(Audio could not be transcribed)"
                audio_duration = None
        else:
            # Unknown message type (image, video, etc.)
            return {"status": "ignored", "reason": "unsupported message type"}

        if not answer_text.strip():
            return {"status": "ignored", "reason": "empty message"}

        # Process as answer via the submit_answer logic
        req = SimulationAnswerRequest(
            session_id=session.id,
            answer=answer_text,
            message_type=msg_type,
        )
        result = await submit_answer(req, db)
        return result

    @app_router.get("/report/{session_id}")
    async def get_report(session_id: str, db: Session = Depends(get_db)):
        """Get the interview report for a completed session."""
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

        report = db.query(InterviewReport).filter(InterviewReport.session_id == session_id).first()

        # Get all messages for the session
        messages = db.query(InterviewMessage).filter(
            InterviewMessage.session_id == session_id
        ).order_by(InterviewMessage.created_at.asc()).all()

        scenario = json.loads(session.scenario) if session.scenario else {}

        # Build Q&A pairs
        qa_pairs = []
        current_q = None
        for msg in messages:
            if msg.role == "interviewer":
                current_q = {
                    "question_number": msg.question_number,
                    "question": msg.content,
                }
            elif msg.role == "candidate" and current_q:
                current_q["answer"] = msg.content
                current_q["message_type"] = msg.message_type
                current_q["score"] = msg.score
                current_q["feedback"] = msg.feedback
                current_q["audio_duration"] = msg.audio_duration
                qa_pairs.append(current_q)
                current_q = None

        return {
            "session_id": session_id,
            "status": session.status,
            "language": session.language,
            "scenario": scenario,
            "job_description": session.job_description,
            "qa_pairs": qa_pairs,
            "report": {
                "overall_score": report.overall_score if report else None,
                "strengths": json.loads(report.strengths) if report and report.strengths else [],
                "improvements": json.loads(report.improvements) if report and report.improvements else [],
                "detailed_feedback": report.detailed_feedback if report else None,
                "recommendation": report.recommendation if report else None,
            } if report else None,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        }

    @app_router.get("/status/{session_id}")
    async def get_status(session_id: str, db: Session = Depends(get_db)):
        """Get the current status of an interview session."""
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

        return {
            "session_id": session_id,
            "status": session.status,
            "current_question": session.current_question,
            "total_questions": session.total_questions,
            "language": session.language,
        }

    return app_router


# ─── Internal: Generate Report ────────────────────────────────────────────────
async def _generate_report(db, session, openai_client, InterviewMessage, InterviewReport, log_debug):
    """Generate the final interview report using LLM."""
    lang = session.language

    # Gather all Q&A pairs
    messages = db.query(InterviewMessage).filter(
        InterviewMessage.session_id == session.id
    ).order_by(InterviewMessage.created_at.asc()).all()

    qa_text = ""
    for msg in messages:
        prefix = "ENTREVISTADOR" if msg.role == "interviewer" else "CANDIDATO"
        qa_text += f"\n[{prefix}] (Q{msg.question_number}): {msg.content}"
        if msg.role == "candidate" and msg.score is not None:
            qa_text += f" [Score individual: {msg.score}]"

    if openai_client.api_key:
        try:
            report_prompt = PROMPTS["report_generator"][lang].format(
                job_description=session.job_description[:2000],
                qa_pairs=qa_text[:4000],
            )
            report_data = await call_llm(
                openai_client,
                PROMPTS["system_interviewer"][lang],
                report_prompt,
            )
        except Exception as e:
            log_debug(f"[Interview] LLM report error: {e}")
            report_data = _get_mock_report(lang)
    else:
        report_data = _get_mock_report(lang)

    # Save report
    report = InterviewReport(
        session_id=session.id,
        overall_score=report_data.get("overall_score", 0),
        strengths=json.dumps(report_data.get("strengths", []), ensure_ascii=False),
        improvements=json.dumps(report_data.get("improvements", []), ensure_ascii=False),
        detailed_feedback=report_data.get("detailed_feedback", ""),
        recommendation=report_data.get("recommendation", ""),
    )
    db.add(report)
    db.commit()

    return report_data


# ─── Mock Data ─────────────────────────────────────────────────────────────────
def _get_mock_scenario(lang: str, n_questions: int) -> dict:
    scenarios = {
        "pt": {
            "cenario": "Você está na 2ª fase de entrevista com o Engineering Manager da squad de Payments.",
            "empresa": "TechCorp Brasil",
            "cargo": "Desenvolvedor Full-Stack Sênior",
            "fase": "2ª fase - Engineering Manager",
            "perguntas": [
                "Me conta sobre um projeto complexo que você liderou nos últimos 2 anos.",
                "Como você garantiria idempotência em transações financeiras distribuídas?",
                "Descreva uma situação em que você teve um conflito técnico com um colega. Como resolveu?",
                "Se eu te der um sistema legado monolítico, como você planejaria a migração para microserviços?",
                "Onde você se vê em 3 anos e como esta posição se encaixa nos seus planos?",
            ],
        },
        "en": {
            "cenario": "You are in the 2nd round interview with the Engineering Manager of the Payments squad.",
            "empresa": "TechCorp",
            "cargo": "Senior Full-Stack Developer",
            "fase": "2nd round - Engineering Manager",
            "perguntas": [
                "Tell me about a complex project you led in the last 2 years.",
                "How would you ensure idempotency in distributed financial transactions?",
                "Describe a situation where you had a technical conflict with a colleague. How did you resolve it?",
                "If I give you a legacy monolithic system, how would you plan the migration to microservices?",
                "Where do you see yourself in 3 years and how does this position fit your plans?",
            ],
        },
        "es": {
            "cenario": "Estás en la 2ª ronda de entrevista con el Engineering Manager del squad de Payments.",
            "empresa": "TechCorp",
            "cargo": "Desarrollador Full-Stack Senior",
            "fase": "2ª ronda - Engineering Manager",
            "perguntas": [
                "Cuéntame sobre un proyecto complejo que lideraste en los últimos 2 años.",
                "¿Cómo garantizarías la idempotencia en transacciones financieras distribuidas?",
                "Describe una situación en la que tuviste un conflicto técnico con un colega. ¿Cómo lo resolviste?",
                "Si te doy un sistema monolítico legado, ¿cómo planificarías la migración a microservicios?",
                "¿Dónde te ves en 3 años y cómo encaja esta posición en tus planes?",
            ],
        },
    }
    data = scenarios.get(lang, scenarios["pt"])
    data["perguntas"] = data["perguntas"][:n_questions]
    return data


def _get_mock_report(lang: str) -> dict:
    reports = {
        "pt": {
            "overall_score": 72,
            "strengths": ["Comunicação clara e objetiva", "Experiência técnica relevante", "Boa estrutura de respostas"],
            "improvements": ["Aprofundar justificativas técnicas", "Usar mais métricas e dados concretos", "Explorar mais o método STAR"],
            "detailed_feedback": "(Mock) O candidato demonstrou boa desenvoltura na comunicação, mas precisa aprofundar as justificativas técnicas com exemplos mais concretos e métricas de impacto.",
            "recommendation": "(Mock) Recomendamos praticar respostas usando o método STAR e incluir KPIs e métricas de impacto em cada experiência relatada.",
        },
        "en": {
            "overall_score": 72,
            "strengths": ["Clear and objective communication", "Relevant technical experience", "Good answer structure"],
            "improvements": ["Deepen technical justifications", "Use more metrics and concrete data", "Explore the STAR method more"],
            "detailed_feedback": "(Mock) The candidate demonstrated good communication skills but needs to deepen technical justifications with more concrete examples and impact metrics.",
            "recommendation": "(Mock) We recommend practicing answers using the STAR method and including KPIs and impact metrics in each reported experience.",
        },
        "es": {
            "overall_score": 72,
            "strengths": ["Comunicación clara y objetiva", "Experiencia técnica relevante", "Buena estructura de respuestas"],
            "improvements": ["Profundizar justificaciones técnicas", "Usar más métricas y datos concretos", "Explorar más el método STAR"],
            "detailed_feedback": "(Mock) El candidato demostró buenas habilidades de comunicación pero necesita profundizar las justificaciones técnicas con ejemplos más concretos y métricas de impacto.",
            "recommendation": "(Mock) Recomendamos practicar respuestas usando el método STAR e incluir KPIs y métricas de impacto en cada experiencia relatada.",
        },
    }
    return reports.get(lang, reports["pt"])
