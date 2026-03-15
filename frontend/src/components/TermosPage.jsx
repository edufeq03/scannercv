import React from 'react';
import { Shield, ArrowLeft, Sparkles, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="bg-white rounded-[40px] p-10 md:p-14 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-orange-50 text-[#FE9000] rounded-2xl">
              <Scale size={32} />
            </div>
            <div>
              <h1 className="font-outfit text-3xl font-black text-slate-900 uppercase tracking-tight">Termos de Uso e LGPD</h1>
              <p className="text-slate-500 font-medium">Última atualização: Março de 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:font-outfit prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
            <h3>1. Aceite dos Termos</h3>
            <p>Ao utilizar a plataforma ScannerCV e submeter seu currículo para análise, você concorda expressamente com as práticas descritas nesta política e em nossos termos de serviço.</p>

            <h3>2. Coleta e Uso de Dados (LGPD)</h3>
            <p>Em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), informamos que:</p>
            <ul>
              <li><strong>Dados Coletados:</strong> Coletamos seu nome, e-mail, telefone e o documento anexado (currículo em PDF).</li>
              <li><strong>Finalidade:</strong> Os dados são utilizados EXCLUSIVAMENTE para a prestação do serviço de análise automatizada do seu perfil profissional e comunicação sobre os resultados via e-mail ou WhatsApp.</li>
              <li><strong>Compartilhamento:</strong> Seus dados pessoais não serão vendidos ou repassados a terceiros não relacionados à prestação deste serviço corporativo. Seus dados e o conteúdo do currículo são anonimizados e enviados para os servidores da OpenAI estritamente para fim de processamento da análise estrutural (que não treina modelos com seus dados através da API).</li>
            </ul>

            <h3>3. Da Parceria e Consultoria</h3>
            <p>Se você chegou a esta plataforma através do link de um recrutador parceiro ou consultor de carreira afiliado à ScannerCV, você concorda que:</p>
            <ul>
              <li>Este profissional terá acesso aos seus dados de contato (Nome, E-mail, Telefone) para fins de agendamento de sessões estratégicas ou mentoria, caso haja interesse comercial.</li>
              <li>O parceiro respeitará as mesmas diretrizes de sigilo estipuladas por nossa plataforma.</li>
            </ul>

            <h3>4. Exclusão de Dados</h3>
            <p>Você tem o direito de solicitar a exclusão permanente dos seus dados e arquivos de nossos servidores a qualquer momento. Para isso, basta responder ao e-mail comercial enviado com a sua análise ou entrar em contato com o administrador do sistema.</p>
            
            <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
              <Shield className="text-[#094074] shrink-0" size={24} />
              <p className="text-sm text-slate-600 m-0">
                Nosso compromisso é com a sua recolocação e a evolução da sua carreira. Levamos a segurança e o sigilo de suas informações profissionais de forma rigorosa.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
