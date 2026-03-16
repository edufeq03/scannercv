import os
from main import generate_pdf_report

def verify():
    output_path = "test_premium_report.pdf"
    name = "Eduardo Targine Capella"
    data = {
        "pontos_fortes": [
            "Experiência sólida em desenvolvimento frontend com React",
            "Domínio de arquiteturas baseadas em microsserviços",
            "Certificações relevantes em AWS e Cloud Computing"
        ],
        "pontos_atencao": [
            "Falta de métricas quantitativas em experiências passadas",
            "Resumo profissional pode ser mais conciso",
            "Ausência de link para portfólio no cabeçalho"
        ],
        "analise_detalhada": "O currículo demonstra um profissional técnico sênior com vasta experiência em ferramentas modernas. O maior 'gap' é a demonstração de impacto de negócio através de números.",
        "dicas_praticas": [
            "Adicione números: 'Aumentou a performance em 40%'",
            "Inclua o link do seu GitHub no topo",
            "Use verbos de ação como 'Liderei' e 'Arquitetei'"
        ]
    }
    
    print(f"Gerando PDF de teste em: {output_path}...")
    generate_pdf_report(output_path, name, data)
    
    if os.path.exists(output_path):
        print("PDF gerado com sucesso!")
    else:
        print("Erro: PDF não foi gerado.")

if __name__ == "__main__":
    verify()
