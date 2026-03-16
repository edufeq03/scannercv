import sqlite3

def migrate():
    conn = sqlite3.connect("scannercv.db")
    cursor = conn.cursor()
    
    print("Checking 'leads' table schema...")
    cursor.execute("PRAGMA table_info(leads)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if "followup_sent" not in columns:
        print("Adding 'followup_sent' column to 'leads' table...")
        cursor.execute("ALTER TABLE leads ADD COLUMN followup_sent INTEGER DEFAULT 0")
        print("Column 'followup_sent' added.")
    else:
        print("Column 'followup_sent' already exists.")
        
    if "source" not in columns:
        print("Adding 'source' column to 'leads' table...")
        cursor.execute("ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'orgânico'")
        print("Column 'source' added.")
    else:
        print("Column 'source' already exists.")

    print("Checking 'recruiter_codes' table schema...")
    cursor.execute("PRAGMA table_info(recruiter_codes)")
    columns_rc = [row[1] for row in cursor.fetchall()]

    if "phone" not in columns_rc:
        print("Adding 'phone' column to 'recruiter_codes' table...")
        cursor.execute("ALTER TABLE recruiter_codes ADD COLUMN phone TEXT")
        print("Column 'phone' added.")
    else:
        print("Column 'phone' already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
