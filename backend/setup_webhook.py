import os
import json
import ssl
import urllib.request
import urllib.error
from dotenv import load_dotenv

# Carrega as variáveis do .env
load_dotenv()

# Configurações do ambiente
# Prioriza o que está no .env, mas mantém os backups conhecidos
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "https://evolution.ignotec.com.br")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "scw0lUJwFFdE6GvqW4I9PKJKeXZqyc9e")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "HosteldeLuz")

# URL do seu ScannerCV
SCANNERCV_URL = "https://scannercv.ignotec.com.br"
WEBHOOK_URL = f"{SCANNERCV_URL}/api/interview/webhook"

def setup_webhook():
    print(f"🚀 Iniciando configuração de Webhook...")
    print(f"📍 API: {EVOLUTION_API_URL}")
    print(f"🆔 Instância: {EVOLUTION_INSTANCE}")
    print(f"🔗 Retorno (ScannerCV): {WEBHOOK_URL}")
    
    # Endpoint padrão para setar webhook
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
    
    # Ignora verificação de SSL para APIs locais ou auto-assinadas
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            res_data = response.read().decode("utf-8")
            print(f"✅ Sucesso! Status: {response.status}")
            print(f"Resposta: {res_data}")
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"❌ Erro HTTP {e.code}: {e.reason}")
        print(f"Mensagem do servidor: {error_body}")
        
        # Tentativa bônus: algumas versões usam uma estrutura diferente ou endpoint diferente
        if e.code == 400:
            print("\n💡 Dica: O erro 400 pode ser por conta da versão da API.")
            print("Verifique se o nome da instância 'HosteldeLuz' está correto e ativo no painel.")
            
    except Exception as e:
        print(f"💥 Falha inesperada: {e}")

if __name__ == "__main__":
    setup_webhook()
