# Etapa 3 — adversários, boxes e neutralizações

Implementada em 15/10/2026 após autorização para continuar diretamente da etapa 2. Continuidade para a etapa 4 autorizada posteriormente pelo usuário.

## Entrega

- O controlador dos adversários foi separado em opponents.js. Deslocamento lateral tem velocidade e aceleração limitadas, com verificação de faixa ocupada, distância de frenagem e decisões de ataque, defesa e acompanhamento.
- Entrada dos boxes, parada para serviço, saída e retorno ao traçado são estados contínuos. A IA planeja a frenagem antes da entrada para respeitar 80 km/h, para no ponto de serviço e aguarda uma janela de tráfego para retornar.
- Os pontos de serviço dos adversários são distribuídos pelo corredor. Paradas continuam simplificadas: uma parada programada e escolha de composto conforme a pista molhada; não há otimização completa de estratégia por volta.
- Aceleração, frenagem e velocidade de curva dos adversários respondem a aderência, desgaste, temperatura, massa de combustível, aerodinâmica e danos. Há consumo de combustível, bateria/recuperação de energia e troca de marchas própria da IA.
- A direção de prova foi separada em race-control.js. Uma mudança de colocação causada por boxes ou abandono não é interpretada como ultrapassagem proibida.
- Uma ultrapassagem sob SC/VSC é detectada entre os dois participantes envolvidos. O infrator tem cinco segundos para devolver a posição; devolver não pune o outro piloto. Não devolver gera +5 segundos. A regra também vale para IA, e sua penalidade entra no resultado definitivo.
- Carros parados, abandonados, entrando nos boxes e em recuperação não geram exigência de devolução nessas situações previstas pelas regras locais.
- O VSC compara o progresso a uma referência de 40 m/s: delta zero ou positivo é permitido. Há três segundos de adaptação inicial; adiantamento maior que 0,5 s por mais de dois segundos gera +5 s, com intervalo de dez segundos entre punições desse tipo. O HUD mostra o delta e destaca o adiantamento.
- O Safety Car tem posição virtual própria, fila capturada, ritmo de 28 m/s e redução da IA em função do carro à frente. Após o tempo mínimo, aguarda o agrupamento, com limite de espera adicional, e anuncia a entrada do SC. As ultrapassagens só são liberadas quando o líder cruza a próxima linha de relargada. Um participante isolado é liberado sem aguardar outra volta.
- Sob SC, exceder 35 m/s ou passar à frente do carro de segurança na liderança por tempo sustentado gera punição nas condições de tolerância do controlador. O jogador continua responsável por acelerar, frear e esterçar.
- Avisos de devolução, delta e relargada aparecem no HUD. Em telas estreitas, têm prioridade sobre o rádio e a indicação auxiliar de curva enquanto estão ativos.

## Avaliação no navegador

O jogo normal continua abrindo por index.html, offline. Os exemplos controlados usam a tela real do jogo e não salvam progresso:

1. Sirva a pasta por HTTP local, por exemplo com `python -m http.server 8765 --bind 127.0.0.1`.
2. Abra http://127.0.0.1:8765/tests/race-control-browser.html.
3. Confira VSC correto, VSC adiantado, Devolver posição, Não devolver, Relargada e Parada da IA.

Nos exemplos VSC adiantado e Não devolver, o laboratório deve indicar +5 s. Devolver posição deve manter zero punição. O exemplo dos boxes verifica parada e retorno sem salto lateral. A física fica pausada somente no laboratório depois da preparação, para permitir inspecionar o aviso.

Na corrida normal, avalie se os adversários deixam espaço, se o ritmo é adequado, se a fila se forma de maneira compreensível e se os avisos permitem cumprir as regras sem dúvida.

## Verificação

- Suíte completa: 147 testes, com 24 testes dedicados à etapa 3. Incluem os seis circuitos nos boxes, passagem bloqueada na saída, faixa ocupada, efeitos de pneus/combustível/danos, devolução, exceções, VSC, relargada, neutralização após a bandeirada e precedência da chegada sobre esgotamento de combustível.
- `node tools/results-browser-check.cjs --stage3`: 21 cenários no Chrome, incluindo regressões das etapas 1 e 2 e HUD desktop/móvel. Relatório em race-stage3-browser.json.
- `node tools/race-dynamics-audit.cjs`: 12 ensaios com 20 carros, seis circuitos no seco e na chuva, durante 60 segundos simulados por ensaio. Todos mantiveram estados finitos. Nesta máquina, a média por passo de 1/60 s ficou entre 0,53 e 0,67 ms, sem renderização. Isso não mede FPS nem garante desempenho em outros computadores.
- Evidências visuais: race-stage3-vsc-bad.png e race-stage3-mobile.png.

## Limitações

A IA continua sendo um controlador aproximado que acompanha o traçado; não usa integralmente o modelo livre de dois eixos do jogador. Há situações de contato e tráfego que exigem avaliação humana. As neutralizações são regras locais do jogo: não reproduzem um regulamento oficial completo. Zonas de bandeiras por trecho, procedimentos de retardatários, investigação de incidentes, múltiplas estratégias de parada e classificação dos adversários por voltas efetivas permanecem para evolução posterior.
