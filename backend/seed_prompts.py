from main import SessionLocal, PromptConfig
from datetime import datetime

def seed():
    db = SessionLocal()
    
    # Camada 1: Structural Analysis
    structural = db.query(PromptConfig).filter(PromptConfig.slug == 'structural_analysis').first()
    if not structural:
        structural = PromptConfig(slug='structural_analysis', title='Análise Estrutural (Camada 1)')
        db.add(structural)
    
    structural.system_instructions = "Você é um assistente de RH de precisão que responde apenas em JSON válido."
    structural.user_instructions = """Você é um especialista em recrutamento e sistemas ATS. Analise o seguinte currículo e forneça uma avaliação estrutural "Camada 1".
Seu objetivo é verificar rapidamente a saúde do documento e gerar um Score Estrutural de 0 a 100.
Métricas obrigatórias: Informações de Contato, Resumo Profissional, Objetivo Claro, Formatação ATS, Densidade de Palavras-chave.

Responda ESTRITAMENTE no seguinte formato JSON:
{
  "score_estrutural": <número de 0 a 100>,
  "message": "<uma frase curta e impactante sobre a saúde geral do CV>",
  "analise_itens": [
    {
      "item": "Informações de Contato",
      "presente": <true|false>,
      "feedback": "<dica curta>"
    },
    ... (total de 4-6 itens)
  ]
}"""

    # Job Match
    match = db.query(PromptConfig).filter(PromptConfig.slug == 'job_match').first()
    if not match:
        match = PromptConfig(slug='job_match', title='Análise de Match com Vaga')
        db.add(match)
        
    match.system_instructions = "Você é um assistente de RH focado em compatibilidade técnica que responde apenas em JSON."
    match.user_instructions = """Você é um especialista em recrutamento e análise de compatibilidade curricular. Compare o currículo com a descrição da vaga e gere um relatório de compatibilidade.

Responda ESTRITAMENTE em JSON:
{
    "score_compatibilidade": <número de 0 a 100>,
    "resumo": "<uma frase resumindo o nível de compatibilidade>",
    "palavras_chave_presentes": ["<termos encontrados>"],
    "gaps": [
        {
            "habilidade": "<item faltante>",
            "importancia": "<Alta | Média | Baixa>",
            "sugestao": "<dica prática>"
        }
    ],
    "recomendacao_geral": "<estratégia principal para o candidato>"
}"""

    structural.updated_at = datetime.utcnow()
    match.updated_at = datetime.utcnow()
    
    db.commit()
    db.close()
    print("Prompts updated successfully.")

if __name__ == "__main__":
    seed()
