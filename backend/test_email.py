import asyncio
import os
import aiosmtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

async def test_email():
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", smtp_user)
    
    # Substitua pelo seu e-mail para receber o teste
    to_email = input("Digite o e-mail de destino para o teste (ex: seu_email@gmail.com): ")

    if not all([smtp_server, smtp_port, smtp_user, smtp_pass]):
        print("❌ ERRO: Faltam configurações no .env!")
        print(f"SMTP_SERVER: {bool(smtp_server)}")
        print(f"SMTP_PORT: {bool(smtp_port)}")
        print(f"SMTP_USERNAME: {bool(smtp_user)}")
        print(f"SMTP_PASSWORD: {bool(smtp_pass)}")
        return

    print(f"\n⏳ Tentando conectar em {smtp_server}:{smtp_port}...")

    msg = EmailMessage()
    msg['Subject'] = '🚀 Teste de E-mail - ScannerCV'
    msg['From'] = from_email
    msg['To'] = to_email
    
    body = f"""
    Olá!
    
    Se você está lendo isso, a configuração de e-mail do ScannerCV está funcionando perfeitamente!
    
    Servidor: {smtp_server}
    Porta: {smtp_port}
    Usuário Autenticado: {smtp_user}
    """
    msg.set_content(body)

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
        print("✅ SUCESSO! E-mail enviado. Verifique sua caixa de entrada (e a pasta de SPAM).")
    except Exception as e:
        print(f"❌ FALHA NO ENVIO!")
        print(f"Detalhes do erro: {e}")

if __name__ == "__main__":
    asyncio.run(test_email())
