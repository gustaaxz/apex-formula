# Etapas de evolução — APEX Formula

Data: 15/10/2026.

Este roteiro organiza a análise crítica em entregas para avaliação do usuário. Complementa o PLANO-DE-MELHORIAS.md. O estado de cada etapa é registrado abaixo; a pilotagem manual e as pistas originais continuam sendo a base do projeto.

## Forma de trabalho

1. Executar uma etapa por vez, com objetivos e critérios definidos.
2. Ao concluir, apresentar mudanças, verificações, limitações e roteiro de avaliação no jogo.
3. Receber a avaliação do usuário antes de iniciar a etapa seguinte. Correções da etapa atual precedem novas funcionalidades.
4. Registrar o estado de cada entrega neste documento.

## Roteiro

| Etapa | Objetivo | Entrega verificável | Estado |
| --- | --- | --- | --- |
| 1 | Resultados de corrida confiáveis | Chegadas, classificação final, penalidades, pontos e recompensas coerentes | Implementada; continuidade autorizada |
| 2 | Voltas e sessões válidas | Checkpoints ordenados, reposicionamento seguro e classificação sem tempo inválido | Implementada e validada; continuidade autorizada |
| 3 | Corridas com adversários coerentes | Trajetórias contínuas, boxes, prevenção de contato e neutralizações | Implementada; continuidade autorizada |
| 4 | Carreira e campeonato independentes | Salvamentos separados, tabela de rivais e progressão consistente | Implementada; continuidade autorizada |
| 5 | Pilotagem mais compreensível | Ajustes de controle, treino guiado e feedback de perda de aderência | Implementada; continuidade autorizada; conforto humano pendente |
| 6 | Repetição e evolução pessoal | Fantasma, comparação de voltas e relatório pós-corrida | Implementada; aguardando avaliação |

## Etapa 1 — resultados de corrida confiáveis

### Problema original, corrigido nesta entrega

Race.rank() ordena os carros pela distância. finishRace() soma penalidades ao tempo mostrado, mas usa race.position para distribuir pontos e recompensas. Não existe registro completo da chegada de cada participante.

Implementação e roteiro de avaliação: [RESULTADOS-ETAPA-1.md](RESULTADOS-ETAPA-1.md). O resultado definitivo agora vem de um registro de chegadas e penalidades; a ordenação por distância permanece apenas durante a corrida.

### Objetivos

- E1.1: registrar o instante de chegada interpolado no passo da simulação, voltas completadas e estado de cada participante.
- E1.2: definir o encerramento a partir da chegada do líder; retardatários encerram ao cruzar a linha depois da bandeirada. Não exigir deles o total de voltas do vencedor.
- E1.3: produzir uma classificação final que considere voltas completadas, chegada, penalidades e abandonos. Tempos corrigidos decidem a ordem entre concluintes com a mesma quantidade de voltas; abandonos aparecem identificados e sem pontuação nesta primeira entrega.
- E1.4: utilizar esse resultado como fonte única da posição final, pontos, créditos e reputação dependentes da colocação.
- E1.5: mostrar na tela final tempo registrado, punição, tempo corrigido, diferença em voltas e abandono, conforme o caso.
- E1.6: impedir recompensas duplicadas ao reabrir ou atualizar a apresentação do resultado.

### Critérios de conclusão

- A chega em 100 s e B em 102 s: A vence sem punição; com +5 s para A, B vence e recebe os pontos da vitória.
- Um carro uma volta atrás permanece atrás de um concluinte com mais voltas, ainda que seu tempo de sessão seja menor.
- Um retardatário recebe a bandeirada na primeira passagem pela linha após a chegada do líder.
- Um abandono não recebe vitória ou pontos por estar momentaneamente à frente na distância acumulada.
- Cada chegada é registrada uma única vez; o tempo não depende da taxa de atualização gráfica.
- Classificação apresentada, posição do jogador e recompensas concordam entre si.
- Participantes ainda em pista não recebem tempos de chegada inventados. A interface distingue resultado provisório de definitivo quando necessário.
- Treino e contra o relógio preservam suas regras próprias.
- A suíte existente continua passando e testes novos cobrem os cenários acima.

### Avaliação do usuário

Verificar se a tela final permite entender a posição, se punições realmente mudam o resultado e se a transição entre bandeirada e resultado é confortável. A implementação deverá incluir um roteiro reproduzível para conferir a punição sem depender de provocar uma infração durante uma corrida completa.

### Fora desta entrega

IA com nova física, fiscalização completa de checkpoints, contratos, circuitos novos, gráficos, multiplayer e separação dos salvamentos. As limitações de validade de progresso ainda existentes serão explicitadas até a etapa 2.

## Etapa 2 — voltas e sessões válidas

Entrega e avaliação: [PERCURSO-ETAPA-2.md](PERCURSO-ETAPA-2.md). Por instrução posterior do usuário, seguir diretamente para a etapa 3 após a validação.

- Exigir passagem ordenada por checkpoints, sem crédito de volta por salto ou retorno em sentido inverso.
- Definir como o reposicionamento recupera o percurso sem gerar progresso indevido.
- Não atribuir tempo de classificação quando não houver volta válida; definir posição de largada correspondente.
- Testar corte de caminho, marcha a ré, reposicionamento e volta limpa.

## Etapa 3 — adversários e direção de prova

Entrega e avaliação: [ADVERSARIOS-ETAPA-3.md](ADVERSARIOS-ETAPA-3.md). Continuidade para a etapa 4 autorizada pelo usuário.

- Substituir mudanças instantâneas de faixa nos boxes por trajetórias contínuas.
- Melhorar percepção de tráfego, prevenção de contato, ataque e defesa.
- Aproximar limites de aceleração, frenagem e aderência dos adversários aos do jogador, medindo o custo de processamento.
- Fiscalizar ultrapassagens sob neutralização por eventos entre participantes, considerando abandonos e boxes.
- Definir fila, ritmo e relargada do Safety Car e delta do VSC.

Pode ser dividida em entregas de boxes, disputas e neutralizações para manter a avaliação pequena.

## Etapa 4 — carreira e campeonato

Entrega e avaliação: [CARREIRA-ETAPA-4.md](CARREIRA-ETAPA-4.md). Continuidade para a etapa 5 autorizada pelo usuário.

- Separar progresso, calendário e pontuação por modo.
- Manter a classificação dos rivais entre etapas e apresentar disputa pelo título.
- Versionar e validar salvamentos; preservar e migrar o progresso existente quando possível.
- Levar o efeito do upgrade de energia para a simulação de passo fixo.
- Testar alternância entre modos, conclusão de temporada e carregamento de dados antigos.

## Etapa 5 — aprendizado e feedback

Entrega e avaliação: [APRENDIZADO-ETAPA-5.md](APRENDIZADO-ETAPA-5.md). Continuidade para a etapa 6 autorizada pelo usuário.

- Remapear comandos e ajustar sensibilidade e zonas mortas.
- Criar exercícios curtos de marchas, frenagem e boxes, preservando a pilotagem manual.
- Explicar travamento, patinagem, temperatura e combustível por sinais visuais e sonoros.
- Validar legibilidade e conforto com avaliação humana no teclado e gamepad.

## Etapa 6 — voltas e repetição

Entrega e avaliação: [EVOLUCAO-ETAPA-6.md](EVOLUCAO-ETAPA-6.md). Inclui setores demarcados nos mapas, classificação dos 20 pilotos, escuderias, números e volta mais rápida, conforme pedido adicional.

- Salvar um fantasma da melhor volta válida por pista e configuração compatível.
- Comparar setores, curvas e consistência.
- Apresentar resumo de estratégia, incidentes e tempo de boxes.
- Permitir reiniciar desafios rapidamente.

## Trabalho técnico ao longo das etapas

Formatar e separar os trechos alterados de game.js conforme necessário, sem uma reescrita geral prévia. Medir desempenho antes de otimizar. Acrescentar testes de regras e integração com valor de regressão; conferir a interface quando houver mudanças visuais.

## Base verificada

Na análise anterior à preparação deste roteiro, npm test concluiu com 87 testes aprovados e nenhuma falha. Isso não substitui avaliação de jogabilidade nem valida mudanças futuras.
