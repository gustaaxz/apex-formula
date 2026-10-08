# Plano persistente de melhorias — APEX Formula

Atualizado em 08/10/2026. Este arquivo guarda decisões e pendências para próximas etapas. A auditoria original está em `AUDITORIA-REALISMO.md`; suas medições de 06/10 permanecem como histórico da versão 0.1.0.

## Decisões do usuário

- Implementar suspensão por roda, movimento da carroceria, colisões entre carros, aerodinâmica detalhada e embreagem manual de largada.
- Prioridade atual: **o carro e a sensação de pilotagem**.
- Retirar assistência de pilotagem e corrigir transmissão e temperatura dos pneus.
- Usar dados reais como referência, indicando as aproximações de calibração.
- Guardar todas as mudanças necessárias; evoluir pistas e demais sistemas depois do carro.
- A instrução atual de retirar assistências substitui as opções de ABS, controle de tração, frenagem e câmbio automático do [briefing original preservado](BRIEFING-ORIGINAL.md).

## Etapa atual — carro

| Item | Estado | Critério de conclusão |
|---|---|---|
| C01 — direção livre e remoção de trajetória/frenagem automáticas | Concluído em 0.2.0 | Sem comando, o carro não acompanha a curva; esterçar parado não move a posição. Saves antigos não reativam assistência. |
| C02 — oito relações de câmbio, RPM, torque, limitador e ré | Concluído em 0.2.0 | Marchas têm relações derivadas de telemetria; primeira não chega a 293 km/h; troca muda RPM; reduções perigosas são rejeitadas. |
| C03 — pneus frios, ótimos e superaquecidos | Concluído em 0.2.0 | Ensaios iguais geram distâncias diferentes; composto, água, desgaste e calor alteram grip. |
| C04 — aderência combinada ao frear/virar/acelerar | Concluído em 0.2.0 | Tração e frenagem usam o limite de força dos pneus, com perda de aderência e bloqueio. |
| C05 — força aerodinâmica, combustível e relevo no carro | Concluído em 0.2.0 | Massa e downforce entram nas forças; aclive afeta velocidade. |
| C06 — energia consistente e upgrades do motor | Concluído em 0.2.0 | Não recuperar energia cinética parado; melhoria de motor afeta torque/potência. |
| C07 — visual, volante e instrumentos coerentes com física | Concluído em 0.2.0 | Mesh segue posição/orientação livres; volante e RPM mostram os estados do veículo. |
| C08 — testes, instruções e referência de calibração | Concluído em 0.2.0 | Testes repetíveis de marcha, temperatura, entrada de comandos e estabilidade; fontes e limites registrados. |

| C09 — suspensão por roda e carroceria | Concluído em 0.3.0 | Quatro molas/amortecedores, contato independente, heave/pitch/roll e transferência de peso; braços e rodas acompanham no 3D. |
| C10 — colisões entre carros | Concluído em 0.3.0 | Contatos orientados jogador/IA e IA/IA, impulso, atrito, rotação, separação e dano de asa. |
| C11 — aerodinâmica por componente | Concluído em 0.3.0 | Assoalho sensível à altura/inclinação, asas, arrasto, DRS, vácuo/ar sujo e dano de asa. |
| C12 — embreagem de largada | Concluído em 0.3.0 | Demanda manual, motor desacoplado no grid, dosagem, patinação, apagamento e reinício manual. |

## Próximas melhorias do carro

- [ ] Quatro pneus individuais, pressão, carga e temperaturas de superfície/carcaça.
- [x] Suspensão independente por contato, amortecimento, altura do assoalho e transferência lateral de carga (0.3.0).
- [ ] Massa não suspensa e deformação vertical do pneu com dinâmica própria; cambagem, convergência, barras antirrolagem e geometria dos braços calibrada.
- [ ] Rodas com inércia e velocidades angulares individuais; modelo de diferencial e frenagem regenerativa por eixo mais detalhado.
- [ ] Curvas de força versus escorregamento calibradas por dados, deformação dos pneus e comportamento sobre zebras.
- [ ] Motor e turbocompressor com mapas verificados, fluxo de combustível e equilíbrio do híbrido por volta.
- [x] Vácuo e ar turbulento por distância/posição/orientação e dano de asa alterando equilíbrio (0.3.0).
- [ ] Calibrar aero e esteira contra dados públicos adicionais; vento lateral, porpoising e assoalho raspando.
- [ ] Expandir danos de asa para suspensão, pneu, transmissão e motor; detritos e falhas progressivas.
- [ ] Calibração de volante/pedais, zonas mortas, sensibilidade, retorno de força e ensaio humano com hardware.
- [ ] Áudio de motor e mudanças com gravações adequadas, vibração e movimentos de cabeça baseados nas forças medidas.

## Integridade competitiva — depois da etapa do carro

- [ ] Invalidar volta fora dos limites; impedir recordes e classificação com voltas inválidas (auditoria R12).
- [ ] Registrar chegadas e reordenar resultado e pontos por penalidades de tempo (R13).
- [ ] Evitar crédito indevido de volta ao reposicionar ou cruzar linha em sentido inverso.
- [ ] Fazer adversários obedecerem à mesma física, combustível, pneus, ERS e danos do jogador.
- [ ] Melhorar defesa, ataque, prevenção de contato e estratégia da IA; simular classificação com voltas efetivas.
- [ ] Safety Car com reagrupamento, VSC por delta, zonas de bandeiras e regras de ultrapassagem completas.
- [ ] Limites, parada e entrada/saída dos boxes verificáveis; infrações e serviço por componente.
- [ ] Fixar temporada de referência. DRS convencional corresponde à geração até 2025; Active Aero/Overtake/Recharge de 2026 exigem outra configuração.

## Pistas — nenhuma réplica real está concluída

- [ ] Escolher circuito e versão/ano antes da reconstrução.
- [ ] Substituir pontos desenhados à mão por linha central e bordas provenientes de fonte geográfica verificável.
- [ ] Validar extensão, sequência e número de curvas, sentido, largura variável, inclinações, elevações e zebras.
- [ ] Construir pit lane, setores, linha de chegada, pontos de detecção e zonas de DRS/aerodinâmica a partir de mapas oficiais.
- [ ] Posicionar placas de frenagem, proteções, escapes e construções conforme levantamento; remover repetição genérica.
- [ ] Comparar uma pista real por vez com mapas/telemetria antes de desenvolver a seguinte.

Referências escolhidas na auditoria: Interlagos, Marina Bay, Monza, Barcelona-Catalunya, Yas Marina e Silverstone. Os circuitos atuais Costa Verde, Marina Neon, Alta Velocità, Sierra Blanca, Dunas de Yas e Silver Coast permanecem fictícios.

## Demais lacunas do briefing

- [ ] Chuva espacial, poças, aquaplanagem, linha seca e evolução do grip por região.
- [ ] Acabamento de carros/cockpit e cenários, materiais, iluminação e reflexos de pista.
- [ ] Animações de mãos, braços, trocas de marcha e mecânicos; peças e detritos de danos.
- [ ] Cruzamento natural das mãos em curvas fechadas, acionamento de paddles e correções de perda de aderência; movimentos de cabeça em frenagem/aceleração/impactos e motion blur periférico.
- [ ] Animação completa de levantar o carro, retirar/instalar quatro rodas e substituir asas; rodas girando e bloqueando visualmente com sua dinâmica individual.
- [ ] Telões e painéis eletrônicos com informações reais da sessão, paddock, fiscais e público conforme cada circuito.
- [ ] Sons de turbo, transmissão, trocas, pneus escorregando, zebras e público; alertas de carros ao lado, previsão de chuva e temperatura por eixo no rádio.
- [ ] Escolha de carro/equipe na corrida rápida, contratos por proposta e reputação por infrações; comparar e medir os seis upgrades separadamente.
- [ ] Distâncias de 25/50/100% baseadas no calendário escolhido e no circuito, substituindo a base única de 58 voltas.
- [ ] Resolução, qualidade de reflexos, qualidade de sombras e motion blur configuráveis; validar qualidade em outras resoluções; a sobreposição do menu estreito foi corrigida em 0.3.0. Validar pedais e câmbio/embreagem por toque em aparelhos físicos.
- [ ] Campeonato com classificação dos rivais e calendário definido; contratos e desenvolvimento de equipe na carreira.
- [ ] Multiplayer com servidor e sincronização; não há serviço online implementado.
- [ ] Testes de latência, frame times e desempenho em outras máquinas, resoluções e controles.

## Registro de entrega

Entregue localmente em 08/10/2026: versão 0.2.0, itens C01–C08, 29 testes automáticos aprovados. O modelo continua aproximado; as limitações acima permanecem abertas. Consulte CARRO-0.2.md, car-validation.json e browser-car-validation.json para dados, protocolo, fontes e evidência. O ensaio de 100 km/h a quase zero mediu 54,11 m a 20 °C, 28,19 m a 85 °C e 43,95 m a 140 °C. Telemetria pública e derivação do câmbio foram preservadas para repetição offline. Esta revisão ainda não foi sincronizada com GitHub.


Entrega local 0.3.0 em 08/10/2026: C09–C12 implementados e novas verificações físicas/renderizadas. Relatório e limites em CARRO-0.3.md, dynamics-validation-0.3.json e browser-dynamics-validation-0.3.json. O histórico 0.1/0.2 foi preservado. Publicação da revisão 0.3 no GitHub em 08/10/2026: [gustaaxz/apex-formula](https://github.com/gustaaxz/apex-formula). Consulte PUBLICACAO-GITHUB.md para os commits e as alterações por arquivo. Os registros 0.1/0.2 mantêm o estado histórico de suas entregas.
