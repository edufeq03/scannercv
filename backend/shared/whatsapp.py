import os
import httpx

async def send_whatsapp(phone: str, text: str) -> bool:
    """Envia mensagem WhatsApp via Evolution API. Retorna True se sucesso."""
    api_url  = os.getenv("EVOLUTION_API_URL", "").rstrip("/")
    api_key  = os.getenv("EVOLUTION_API_KEY", "")
    instance = os.getenv("EVOLUTION_INSTANCE", "scannercv")
    ssl_ok   = os.getenv("EVOLUTION_SSL_VERIFY", "false").lower() != "false"
    
    if not api_url:
        print(f"[WA] EVOLUTION_API_URL não configurado, skip.")
        return False
    
    # Normalize phone: remove non-digits
    clean = "".join(filter(str.isdigit, phone))
    
    # Simple Brazil normalization (adds 55 if missing and likely Brazilian)
    if len(clean) <= 11 and not clean.startswith("55"):
        clean = "55" + clean
        
    try:
        async with httpx.AsyncClient(timeout=15.0, verify=ssl_ok) as client:
            resp = await client.post(
                f"{api_url}/message/sendText/{instance}",
                json={"number": clean, "text": text},
                headers={"apikey": api_key, "Content-Type": "application/json"}
            )
            # Log response for debugging if needed
            # print(f"[WA] Response for {clean}: {resp.status_code} - {resp.text}")
            return resp.status_code in (200, 201)
    except Exception as e:
        print(f"[WA] Erro ao enviar para {clean}: {e}")
        return False
