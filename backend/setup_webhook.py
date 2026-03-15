import os
import json
import ssl
import urllib.request
from dotenv import load_dotenv

# Carrega as variáveis do .env
load_dotenv()

# Configurações do ambiente
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "https://evolution.ignotec.com.br")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "scw0lUJwFFdE6GvqW4I9PKJKeXZqyc9e")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "HosteldeLuz")

# URL do seu ScannerCV
SCANNERCV_URL = "https://scannercv.ignotec.com.br"
WEBHOOK_URL = f"{SCANNERCV_URL}/api/interview/webhook"

def setup_webhook():
    print(f"🚀 Configurando Webhook para instância: {EVOLUTION_INSTANCE}")
    print(f"🔗 Apontando para: {WEBHOOK_URL}")
    
    url = f"{EVOLUTION_API_URL}/webhook/set/{EVOLUTION_INSTANCE}"
    
    headers = {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "enabled": True,
        "url": WEBHOOK_URL,
        "webhook_by_events": False,
        "events": [
            "MESSAGES_UPSERT"
        ]
    }
    
    data = json.dumps(payload).encode("utf-8")
    
    # Ignora verificação de SSL (equivalente ao verify=False do requests)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            res_data = response.read().decode("utf-8")
            if response.status in [200, 201]:
                print("✅ Webhook configurado com sucesso!")
                print(f"Resposta: {res_data}")
            else:
                print(f"❌ Erro ao configurar Webhook (Status {response.status})")
                print(f"Resposta: {res_data}")
            
    except Exception as e:
        print(f"💥 Falha ao conectar na Evolution API: {e}")

if __name__ == "__main__":
    setup_webhook()
