import sqlite3
import os
import bcrypt

# Configuration
DB_PATH = "scannercv.db"

def hash_password(password: str):
    # Generates a hashed password using bcrypt directly to avoid passlib issues
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"❌ Banco de dados {DB_PATH} não encontrado.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("🔍 Verificando estrutura da tabela 'recruiter_codes'...")
    
    # Add columns if they don't exist
    columns = [
        ("email", "TEXT"),
        ("password_hash", "TEXT"),
        ("must_change_password", "INTEGER DEFAULT 1")
    ]

    cursor.execute("PRAGMA table_info(recruiter_codes)")
    existing_columns = [col[1] for col in cursor.fetchall()]

    for col_name, col_type in columns:
        if col_name not in existing_columns:
            print(f"➕ Adicionando coluna '{col_name}'...")
            try:
                cursor.execute(f"ALTER TABLE recruiter_codes ADD COLUMN {col_name} {col_type}")
            except sqlite3.OperationalError as e:
                print(f"⚠️ Erro ao adicionar coluna {col_name}: {e}")

    conn.commit()

    print("🛠️ Migrando registros existentes...")
    cursor.execute("SELECT id, code, name, email, password_hash FROM recruiter_codes")
    rows = cursor.fetchall()

    count = 0
    for row in rows:
        rid, code, name, email, pwd_hash = row
        
        updates = []
        params = []

        # If email is missing, use a placeholder or generic one based on code
        if not email:
            new_email = f"{code}@parceiro.scannercv.com.br"
            updates.append("email = ?")
            params.append(new_email)
            print(f"📧 Gerando e-mail para {name}: {new_email}")

        # If password hash is missing, hash the current code as initial password
        if not pwd_hash:
            new_hash = hash_password(code)
            updates.append("password_hash = ?")
            params.append(new_hash)
            updates.append("must_change_password = 1")
            print(f"🔑 Gerando hash para {name} (senha inicial = código)")

        if updates:
            query = f"UPDATE recruiter_codes SET {', '.join(updates)} WHERE id = ?"
            params.append(rid)
            cursor.execute(query, params)
            count += 1

    conn.commit()
    conn.close()
    print(f"✅ Migração concluída. {count} registros atualizados.")

if __name__ == "__main__":
    migrate()
    print("\n⚠️ IMPORTANTE: Lembre-se de avisar os parceiros existentes que seus e-mails de acesso foram padronizados.")
