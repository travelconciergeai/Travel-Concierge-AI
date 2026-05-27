import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { mockData } from "../mockData.jsx";
import { Placeholder, Button, Card, Drawer, Modal, OptimizeMenu, SectionHeader, SmartImg, Stat, TabRow, Tag, Topbar, useToast } from "../ui.jsx";

// Plans — pricing.

const PlansScreen = ({ setRoute }) => {
  const toast = useToast();
  return (
    <div className="min-h-screen">
      <Topbar subtitle="Voya · Planos" title="Como você quer viajar com a Voya"
        right={<Button variant="ghost">Falar com o time</Button>}/>

      <div className="px-10 pb-16">
        <div className="text-center max-w-[640px] mx-auto mb-10">
          <p className="text-[15px] text-ink-600 leading-relaxed">
            Comece grátis. <span className="serif-i text-ink-700">Cresça quando quiser.</span> Cancelamento simples,
            sem letrinhas, e o concierge da Voya cuidando do que você não tem tempo de fazer.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 max-w-[1100px] mx-auto">
          {mockData.plans.map(p => (
            <Card key={p.id} className={`p-7 flex flex-col relative ${p.highlight ? 'ring-2 ring-ink-900 shadow-lift' : ''}`}>
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Tag tone="ink"><Icon.Sparkles size={11}/> {p.tag}</Tag>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <div className="text-[18px] font-medium text-ink-900">{p.name}</div>
                {!p.highlight && <Tag tone={p.id==='signature'?'gold':'ink'}>{p.tag}</Tag>}
              </div>
              <div className="text-[12px] text-ink-500 mt-1">{p.desc}</div>
              <div className="mt-5 flex items-baseline gap-1">
                <div className="text-[40px] tracking-tight font-medium text-ink-900 leading-none">{p.price}</div>
                {p.period && <div className="text-[14px] text-ink-500">{p.period}</div>}
              </div>
              <ul className="space-y-2.5 mt-6 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink-800">
                    <Icon.Check size={14} className="text-sage-700 mt-0.5 shrink-0"/> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-7"
                variant={p.highlight?'primary':p.id==='signature'?'accent':'secondary'}
                onClick={() => toast({title:`${p.cta} ✓`, tone:'success', desc:'Esta é uma demonstração'})}>
                {p.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="max-w-[1100px] mx-auto mt-10">
          <Card className="p-7 grid grid-cols-[1fr_1fr_1fr_1fr] gap-6">
            <FAQ q="Posso trocar de plano depois?" a="Sim, a qualquer momento. Migrações são proporcionais."/>
            <FAQ q="Concierge humano significa o quê?" a="Um expert da sua região com nome, telefone e responsabilidade pela sua viagem."/>
            <FAQ q="Funciona para empresas?" a="Sim — temos Voya Business com gestão de viagens corporativas."/>
            <FAQ q="Posso cancelar?" a="Sem letrinhas. Cancela com um clique, mantém o que já pagou no mês."/>
          </Card>
        </div>
      </div>
    </div>
  );
};

const FAQ = ({ q, a }) => (
  <div>
    <div className="text-[13px] font-medium text-ink-900">{q}</div>
    <div className="text-[12.5px] text-ink-600 mt-1.5 leading-relaxed">{a}</div>
  </div>
);

window.PlansScreen = PlansScreen;
export { PlansScreen };
