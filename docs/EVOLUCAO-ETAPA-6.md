# Etapa 6 — voltas, fantasma e informação de corrida

Entrega local em 15/10/2026, incluindo o pedido adicional de setores nos mapas e classificação completa dos adversários. Implementação concluída para avaliação.

## Objetivos entregues

- **E6.1 — referência pessoal:** no contra o relógio, salvar a trajetória de uma volta limpa e reproduzi-la como fantasma translúcido. A referência depende da geometria da pista, versão da física, clima, composto, combustível inicial, aero, distribuição de freio e opções físicas. Ajustes de câmera, som e controles não separam referências.
- **E6.2 — comparar desempenho:** delta em relação à referência compatível, setores e tempos por curva, média, amplitude e desvio padrão das voltas limpas. A comparação usa uma referência anterior, evitando comparar a volta nova consigo mesma.
- **E6.3 — relatório da sessão:** listar voltas e validade, estratégia inicial, recursos finais, passagens pelos boxes, tempo no pit lane, serviço parado, contatos, advertências, penalidades e reposicionamentos. O tempo do piloto termina na sua chegada ou abandono, sem incluir a espera acelerada pelos rivais.
- **E6.4 — repetir rapidamente:** o botão **Repetir desafio** do contra o relógio inicia uma nova tentativa com o mesmo acerto, sem aguardar novamente as luzes. A reinicialização também está disponível pela pausa.
- **E6.5 — setores visíveis:** cores, nomes S1/S2/S3 e limites demarcados no mapa do menu e no minimapa. Os limites correspondem aos mesmos terços de pista utilizados na cronometragem.
- **E6.6 — pelotão completo:** classificação dos 20 pilotos com número, escuderia, situação, voltas, melhor e última volta, composto, paradas e penalidades. Volta mais rápida válida destacada em roxo, tanto na tabela quanto no HUD. O painel eletrônico do circuito também apresenta os 20 participantes em duas colunas.

## Onde avaliar

1. No menu, observe o mapa: S1 é verde, S2 azul e S3 âmbar. Há marcas nos limites de cada setor. Entre em uma sessão para conferir os mesmos setores no minimapa.
2. Durante a corrida, clique em **≡**, ao lado da pausa, para abrir **Classificação completa**. Também há acesso em **Pausa → Classificação completa**. A sessão fica pausada enquanto você consulta a tabela; use **Voltar** para retornar. A tabela permite rolagem horizontal e vertical conforme a tela.
3. Complete voltas válidas. A tabela e o HUD passam a identificar o piloto da volta mais rápida, com **VR** em roxo. **INV** marca uma última volta inválida. Tempos ausentes aparecem como “—”; não são estimados a partir do ritmo da IA. A volta mais rápida não concede ponto extra.
4. Ao terminar treino, classificação, corrida ou contra o relógio, abra **Análise da sessão**. O relatório também pode ser consultado durante uma pausa. Confira setores, curvas, variação entre voltas, compostos, paradas e incidentes.
5. No **Contra o relógio**, complete uma volta limpa com clima estático. A referência é gravada na passagem pela linha, sem exigir encerrar toda a sessão. Nas voltas seguintes, o fantasma usa a melhor referência aceita; o delta acompanha essa referência.
6. Ao terminar, clique em **Repetir desafio**. A tentativa começa antes da linha, em primeira, com a configuração anterior e o fantasma disponível. Em **Pausa → Ocultar/mostrar fantasma**, alterne sua apresentação. Para avaliar persistência, recarregue e inicie com a mesma pista, clima e acerto; alterar esses parâmetros deve separar as referências.

As escuderias e os pilotos são fictícios. A carreira e o campeonato usam os dados do jogador salvos na etapa 4. Se seu número coincidir com o de um adversário, a sessão reserva seu número e atribui outro disponível ao adversário.

## Regras do fantasma

Uma volta elegível precisa concluir os checkpoints na ordem e permanecer válida para cronometragem. Boxes, contato, punição, neutralização/bandeira de advertência, sentido inverso, reposicionamento e mudança de acerto impedem que ela se torne referência. Uma tentativa inválida ou mais lenta não substitui a melhor referência existente.

O fantasma é exclusivo do contra o relógio com clima estático. Clima dinâmico permanece disponível como sessão livre, sem referência persistente. Treino, classificação, GP, carreira, campeonato e escola não gravam fantasmas. As voltas dessas sessões continuam disponíveis para análise enquanto a sessão permanece aberta.

O fantasma é apenas um objeto visual: não participa de colisões, classificação, vácuo, ar sujo ou direção de prova. Ele desaparece próximo ao carro para não cobrir a visão, durante voltas inválidas, nos boxes e após o fim da sessão. O replay termina no tempo da referência, sem extrapolar ou teletransportar para começar de novo antes da próxima volta.

Combustível, estado/temperatura dos pneus e bateria podem evoluir entre voltas, mesmo com o mesmo acerto. As condições no início da volta são guardadas como contexto; a compatibilidade é de configuração, não uma garantia de recursos idênticos a cada passagem. Para comparar condições mais estáveis, escolha explicitamente as opções físicas desejadas antes da tentativa.

## Precisão e limites

- A trajetória é amostrada a 10 Hz em tempo de simulação, com início e chegada interpolados. A apresentação interpola posição lateral, progresso e ângulo entre amostras. A aparência é simplificada e translúcida.
- Cada referência comporta até 10 minutos de volta; são mantidas até oito combinações de pista/acerto, priorizando as mais recentemente melhoradas. Uma volta válida mais longa continua sendo cronometrada, mas não gera fantasma.
- Tempos por curva são aproximados por interpolação entre os 120 pontos de controle. Não representam mini-setores oficiais. Setores usam os limites já empregados pelo cronômetro.
- Consistência usa apenas voltas limpas e exige duas delas para medir variação. Voltas cronometradas com boxes ou incidentes aparecem identificadas e ficam fora desse cálculo.
- O relatório mantém até 200 tentativas completas e os últimos 100 eventos da sessão. Ele é consultado na sessão atual; não há arquivo permanente de relatórios ou exportação CSV.
- O tempo de pit lane é medido entre entrada e saída; serviço corresponde ao período parado no estado de troca. A precisão segue a amostragem do passo físico. Uma passagem ainda aberta aparece como incompleta.
- Na classificação em pista, o intervalo é mostrado em metros de progresso validado, não como um tempo de chegada inventado. A classificação definitiva mantém as regras corrigidas por voltas, chegada e penalidades da etapa 1.

## Salvamento e compatibilidade

As referências usam `apex-ghosts-v1`, com versão, validação e limite de tamanho. Dados inválidos são ignorados; antes de substituí-los, o original é preservado em `apex-ghosts-v1-recovery`. Uma versão futura desconhecida não é sobrescrita. Se a gravação falhar, a nova referência permanece disponível apenas na sessão, com aviso na interface.

Os antigos tempos numéricos `apex-best-course-v1-*` permanecem intactos. Eles não contêm trajetória ou configuração suficiente para se tornarem fantasmas compatíveis, portanto não são importados como referências. Carreira, campeonato e controles mantêm suas chaves próprias. Os dados continuam locais ao navegador e à origem usada para abrir o jogo.

Alterações futuras de física exigem atualizar o identificador `PHYSICS` em `personal.js`. A geometria da pista também participa da assinatura, evitando reaproveitar uma referência de outro traçado.

## Verificação técnica

- `npm test`: **205 testes aprovados**, incluindo 20 novos testes de referências, persistência, interpolação, compatibilidade, relatórios e cronometragem dos adversários. Saída: `TESTES-ETAPA-6.txt`.
- Uma volta completa e um pit stop foram executados com física real e entradas explícitas em testes. A gravação também foi comparada com telemetria a 30, 60 e 120 Hz, produzindo as mesmas amostras persistentes.
- `node tools/results-browser-check.cjs --stage6`: **47 cenários aprovados, sem erros de execução**, incluindo regressão das etapas anteriores e nove cenários da etapa 6. Os nove cenários foram repetidos após o ajuste final do limite de gravação. Relatório: `personal-stage6-browser.json`.
- As telas são testadas em desktop e largura de 390 px. As verificações de interface usam passagens e incidentes controlados; não representam corridas pilotadas por uma pessoa. Os testes físicos são separados.
- Capturas: `personal-stage6-map-menu.png`, `personal-stage6-map-hud.png`, `personal-stage6-leaderboard.png`, `personal-stage6-leaderboard-mobile.png`, `personal-stage6-analysis.png`, `personal-stage6-analysis-mobile.png` e `personal-stage6-ghost.png`.

Código principal: `personal.js` registra e valida referências/relatórios; `personal-view.js` apresenta análise e classificação completa; `simulation.js` cronometra o pelotão; `game.js` integra mapas, fantasma e telas. Testes: `tests/personal.test.cjs`, `tests/personal-fixtures.js` e `tools/personal-browser-scenarios.cjs`.

## Avaliação do usuário

Conferir se os setores são identificáveis no mapa, se a classificação permite acompanhar todos os pilotos sem perder informações, se o fantasma é visível sem atrapalhar a visão e se a comparação por curva ajuda a escolher onde melhorar. Avaliar também se a distinção entre tempo de boxes e serviço é clara. A avaliação de conforto em teclado/gamepad físico da etapa 5 continua válida e pode ser feita junto desta revisão.
