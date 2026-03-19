import sqlite3
import json
from datetime import datetime

def seed_specialists():
    conn = sqlite3.connect('scannercv.db')
    cursor = conn.cursor()

    # Clear existing to avoid duplicates if re-run
    cursor.execute("DELETE FROM specialists")

    specialists = [
        (
            "Brenda Sales",
            "https://i.pravatar.cc/150?u=brenda",
            "Especialista em Carreira & LinkedIn",
            "Tecnologia",
            "Ajudo profissionais de tecnologia a se destacarem no mercado através de um posicionamento estratégico e currículos que passam em qualquer ATS.",
            "R$ 197 / sessão",
            4.9,
            2,
            124,
            "Premium",
            95,
            json.dumps(["LinkedIn", "Currículo Tech", "Entrevistas"]),
            1
        ),
        (
            "Ricardo Mendonça",
            "https://i.pravatar.cc/150?u=ricardo",
            "Consultor de Transição de Carreira",
            "Geral",
            "Especialista em transição para cargos de liderança. Foco em resultados mensuráveis e storytelling profissional.",
            "R$ 250 / sessão",
            4.8,
            6,
            89,
            "Profissional",
            88,
            json.dumps(["Liderança", "Transição de Carreira", "Soft Skills"]),
            1
        ),
        (
            "Ana Clara Souza",
            "https://i.pravatar.cc/150?u=ana",
            "Mentora de Carreira para Mulheres",
            "Finanças",
            "Focada no empoderamento e crescimento de mulheres no setor financeiro e administrativo.",
            "R$ 150 / sessão",
            5.0,
            1,
            210,
            "Profissional",
            92,
            json.dumps(["Finanças", "Plano de Carreira", "Networking"]),
            1
        ),
        (
            "Marcos Oliveira",
            "https://i.pravatar.cc/150?u=marcos",
            "Especialista em R&S e Outplacement",
            "Vendas",
            "Ex-recrutador de multinacionais, ensino o que os RHs realmente buscam em um candidato de alta performance.",
            "R$ 180 / sessão",
            4.7,
            24,
            56,
            "Base",
            82,
            json.dumps(["Vendas", "Processos Seletivos", "Negociação Salarial"]),
            1
        )
    ]

    cursor.executemany('''
        INSERT INTO specialists (
            name, photo_url, title, niche, bio, price_info, 
            rating, response_time, total_clients, plan, 
            quality_score, expertise_areas, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', specialists)

    conn.commit()
    conn.close()
    print("Marketplace de especialistas semeado com sucesso!")

if __name__ == "__main__":
    seed_specialists()
