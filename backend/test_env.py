import os
from dotenv import load_dotenv

load_dotenv(override=True)
pwd = os.getenv("ADMIN_PASSWORD")
print(f"PASSWORD: [{pwd}]")
print(f"LENGTH: {len(pwd) if pwd else 'None'}")
