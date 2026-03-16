from main import SessionLocal, PromptConfig, BlogPost
db = SessionLocal()
print("--- PROMPT CONFIGS ---")
prompts = db.query(PromptConfig).all()
for p in prompts:
    print(f"Slug: {p.slug}\nTitle: {p.title}")
    print(f"System: {p.system_instructions[:100]}...")
    print(f"User Template: {p.user_instructions}\n")

if not prompts:
    print("NO PROMPTS FOUND!")

print("\n--- BLOG POSTS ---")
posts = db.query(BlogPost).all()
for post in posts:
    print(f"Slug: {post.slug}, Title: {post.title}")
db.close()
