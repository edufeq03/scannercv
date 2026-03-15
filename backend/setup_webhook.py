import os
import requests
from dotenv import load_dotenv

# Carrega as variáveis do .env
load_dotenv()

# Configurações do ambiente
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "https://evolution.ignotec.com.br")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "scw0lUJwFFdE6GvqW4I9PKJKeXZqyc9e")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "HosteldeLuz")

# URL do seu ScannerCV (Ajuste se mudar o domínio)
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
    
    try:
        # verify=False caso o SSL da Evolution seja auto-assinado
        response = requests.post(url, json=payload, headers=headers, verify=False)
        
        if response.status_code in [200, 201]:
            print("✅ Webhook configurado com sucesso!")
            print(f"Configuração: {response.json()}")
        else:
            print(f"❌ Erro ao configurar Webhook (Status {response.status_code})")
            print(f"Resposta: {response.text}")
            
    except Exception as e:
        print(f"💥 Falha ao conectar na Evolution API: {e}")

if __name__ == "__main__":
    setup_webhook()
