import os
import json
import ssl
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

# Configurações
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "https://evolution.ignotec.com.br")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "scw0lUJwFFdE6GvqW4I9PKJKeXZqyc9e")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "HosteldeLuz")

SCANNERCV_URL = "https://scannercv.ignotec.com.br"
WEBHOOK_URL = f"{SCANNERCV_URL}/api/interview/webhook"

def try_set_webhook(endpoint_path):
    url = f"{EVOLUTION_API_URL}/{endpoint_path}/{EVOLUTION_INSTANCE}"
    print(f"\nTentando (Trying): {url}")
    
    headers = {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    
    # O erro 400 indicou que a API espera as propriedades dentro de um objeto "webhook"
    payload = {
        "webhook": {
            "enabled": True,
            "url": WEBHOOK_URL,
            "webhook_by_events": False,
            "events": ["MESSAGES_UPSERT"]
        }
    }
    
    data = json.dumps(payload).encode("utf-8")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            res_data = response.read().decode("utf-8")
            print(f"✅ SUCESSO! Status: {response.status}")
            print(f"Resposta: {res_data}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"❌ Erro {e.code}: {body}")
        return False
    except Exception as e:
        print(f"💥 Falha: {e}")
        return False

def run_setup():
    print(f"🚀 Configurando Webhook para: {WEBHOOK_URL}")
    
    # Tenta o endpoint que deu erro 400 (agora com o payload corrigido)
    if try_set_webhook("webhook/set"):
        return
    
    # Tenta um endpoint alternativo caso o primeiro falhe por outro motivo
    print("\n⚠️ Tentando endpoint alternativo...")
    if try_set_webhook("instance/setWebhook"):
        return

    print("\n❌ Não foi possível configurar automaticamente.")

if __name__ == "__main__":
    run_setup()
