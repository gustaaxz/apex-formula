# Plano persistente de melhorias — APEX Formula

Atualizado em 15/10/2026. Este arquivo guarda decisões e pendências para próximas etapas. A auditoria original está em `AUDITORIA-REALISMO.md`; suas medições de 06/10 permanecem como histórico da versão 0.1.0.

## Decisões do usuário

- Implementar suspensão por roda, movimento da carroceria, colisões entre carros, aerodinâmica detalhada e embreagem manual de largada.
- Prioridade atual: **os seis mapas originais, a circulação dos carros, curvas desafiadoras, cenários e HUD**, preservando o carro e a pilotagem manual.
- Revisão de prioridade em 15/10/2026: evoluir pelas [etapas de desenvolvimento](ETAPAS-DE-EVOLUCAO.md). Etapas 1 a 6 implementadas; a etapa 6 aguarda avaliação. O conforto humano de teclado/gamepad da etapa 5 continua pendente. Veja [fantasma, mapas e classificação](EVOLUCAO-ETAPA-6.md).
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
| C12 — largada | Revisado em 0.4.1 | Por solicitação posterior, foi retirada a exigência de embreagem manual; a saída usa apenas o acelerador, com acoplamento interno automático. |

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

- [x] Invalidar recorde após sair completamente da pista ou usar reposicionamento; cronometrar setores e delta por distância na versão 0.4.0.
- [x] Contagem de voltas e posições de corrida por pontos de controle ordenados, com recuperação sem progresso indevido (etapa 2, parte de R12).
- [ ] Classificação dos adversários por voltas efetivas na sessão classificatória e fiscalização mais detalhada (restante de R12).
- [x] Registrar chegadas e reordenar resultado e pontos por penalidades de tempo (R13), implementado na [etapa 1](RESULTADOS-ETAPA-1.md), aguardando avaliação do usuário. Checkpoints obrigatórios continuam pendentes.
- [x] Evitar crédito indevido de volta ao reposicionar ou cruzar linha em sentido inverso (etapa 2).
- [ ] Fazer adversários obedecerem à mesma física, combustível, pneus, ERS e danos do jogador.
- A etapa 3 acrescentou limites aproximados de aderência, temperatura, combustível, energia e danos aos adversários. A integração completa com a física livre do jogador continua pendente.
- [ ] Melhorar defesa, ataque, prevenção de contato e estratégia da IA; simular classificação com voltas efetivas.
- [ ] Safety Car com reagrupamento, VSC por delta, zonas de bandeiras e regras de ultrapassagem completas.
- A [etapa 3](ADVERSARIOS-ETAPA-3.md) implementou fila, relargada na linha, VSC por delta e devolução de posição nas regras locais. Zonas por trecho e procedimentos oficiais completos continuam pendentes.
- [ ] Limites, parada e entrada/saída dos boxes verificáveis; infrações e serviço por componente.
- [ ] Fixar temporada de referência. DRS convencional corresponde à geração até 2025; Active Aero/Overtake/Recharge de 2026 exigem outra configuração.

## Pistas originais e HUD — revisão 0.4.0 concluída

- [x] Identificar APX-01 a APX-06, estilos, extensão, curvas e setores a partir da geometria.
- [x] Suavizar curvas impossíveis, reservar reta de largada e boxes nivelados e abrir escapes nas curvas.
- [x] Unificar proteções visuais e limites físicos para jogador e IA; corrigir acúmulo de velocidade residual após contatos da IA.
- [x] Verificar voltas no seco/chuva, serviço de boxes e grid de vinte carros em todos os mapas.
- [x] Posicionar decoração com afastamento de todos os trechos; acrescentar marcos regionais, público agrupado, placas e painel ao vivo.
- [x] Acrescentar setores, delta, próxima curva, temperatura por eixo, pedais, RPM, asas, limitador, minimapa e radar.
- [x] Conferir menu e HUD em desktop, retrato estreito e paisagem.

Detalhes e resultados: [MAPAS-HUD-0.4.md](MAPAS-HUD-0.4.md).

## Pistas reais — nenhuma réplica está concluída

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
- [ ] Resolução, qualidade de reflexos, qualidade de sombras e motion blur configuráveis; validar qualidade em outras resoluções; a sobreposição do menu estreito foi corrigida em 0.3.0. Validar pedais e câmbio por toque em aparelhos físicos.
- [x] Campeonato com classificação dos rivais, calendário e progresso independente; migração do salvamento e histórico de temporadas (etapa 4).
- [ ] Contratos negociáveis e desenvolvimento de equipe na carreira.
- [ ] Multiplayer com servidor e sincronização; não há serviço online implementado.
- [ ] Testes de latência, frame times e desempenho em outras máquinas, resoluções e controles.

## Registro de entrega

Entregue localmente em 08/10/2026: versão 0.2.0, itens C01–C08, 29 testes automáticos aprovados. O modelo continua aproximado; as limitações acima permanecem abertas. Consulte CARRO-0.2.md, car-validation.json e browser-car-validation.json para dados, protocolo, fontes e evidência. O ensaio de 100 km/h a quase zero mediu 54,11 m a 20 °C, 28,19 m a 85 °C e 43,95 m a 140 °C. Telemetria pública e derivação do câmbio foram preservadas para repetição offline. Esta revisão ainda não foi sincronizada com GitHub.


Entrega local 0.3.0 em 08/10/2026: C09–C12 implementados e novas verificações físicas/renderizadas. Relatório e limites em CARRO-0.3.md, dynamics-validation-0.3.json e browser-dynamics-validation-0.3.json. O histórico 0.1/0.2 foi preservado. Publicação da revisão 0.3 no GitHub em 08/10/2026: [gustaaxz/apex-formula](https://github.com/gustaaxz/apex-formula). Consulte PUBLICACAO-GITHUB.md para os commits e as alterações por arquivo. Os registros 0.1/0.2 mantêm o estado histórico de suas entregas.
