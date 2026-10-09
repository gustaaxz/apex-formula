# Publicação no GitHub — APEX Formula 0.3.0

Data: 08/10/2026. Repositório: [gustaaxz/apex-formula](https://github.com/gustaaxz/apex-formula). [Histórico dos commits](https://github.com/gustaaxz/apex-formula/commits/main/).

A publicação inclui código do jogo, testes, ferramentas de calibração, telemetria pública, relatórios e imagens de evidência. O histórico remoto existente é preservado. Os 14 arquivos da versão inicial no GitHub foram comparados com a versão inicial local e correspondem. Os 49 testes da versão atual foram executados novamente antes do envio: 49 aprovados, nenhum reprovado.

Os onze commits abaixo agrupam mudanças por assunto. A mensagem de cada commit explica todos os arquivos que ele altera. Os registros das revisões 0.1 e 0.2 são históricos; seus números e estados de publicação se referem àquelas entregas.

As seis pistas continuam fictícias. Os parâmetros de suspensão, aerodinâmica e pneus são aproximações documentadas, e os ensaios não certificam fidelidade a um carro real.

## 01. feat: adicionar suspensão individual, aerodinâmica e colisões

- **chassis.js**: Cria quatro contatos de mola/amortecedor, integra altura, pitch e roll da carroceria, calcula asas/assoalho/DRS/esteira e resolve impactos entre carros com impulso, rotação e dano.

## 02. feat: implementar carro livre, câmbio e pneus sem assistências

- **vehicle.js**: Modela posição e velocidade livres, oito marchas e ré, motor e embreagem manual com apagamento/repartida, aderência por carga/temperatura/desgaste/chuva, frenagem combinada, patinagem, arrasto e energia. Remove assistência automática de direção, frenagem, ABS e tração.

## 03. feat: integrar dinâmica do carro e contatos na corrida

- **simulation.js**: Liga chassis e veículo à corrida; usa passos internos de até 1/240 s, contatos jogador/IA e IA/IA também nos boxes, preserva reação da IA aos impactos e permite acelerar o motor com embreagem puxada na largada. Atualiza pneus, DRS, danos, limitador e serviço de boxes sem guiar ou frear automaticamente o jogador.

## 04. feat: animar carroceria e adicionar controle manual de largada

- **game.js**: Separa carroceria e rodas na cena, anima quatro rodas e oito braços de suspensão, acompanha heave/pitch/roll nas câmeras, implementa SHIFT/J/K/slider/controle para embreagem e I para repartir, atualiza som, instrumentos e diagnóstico de renderização.
- **index.html**: Carrega chassis.js e vehicle.js antes da simulação, identifica a versão 0.3.0 e apresenta controles manuais, indicador/slider de embreagem e botão de toque.
- **style.css**: Ajusta o indicador e slider da embreagem, mantém controles utilizáveis com foco e corrige o menu estreito com rolagem para evitar sobreposição do botão de início.

## 05. test: validar carro e dinâmica com 49 testes

- **tests/simulation.test.cjs**: Atualiza os testes da corrida para pilotagem manual, oito marchas, largada, boxes, pneus, energia e impactos, mantendo as regressões dos seis circuitos.
- **tests/helpers.cjs**: Centraliza pistas de ensaio, avanço com passo fixo, frenagem e piloto explícito de teste para repetir cenários sem assistência ao jogador.
- **tests/car.test.cjs**: Testa direção livre, ausência de assistências, limites de marcha, RPM, temperaturas dos pneus, freios, patinagem, aero, consumo e volta/boxes completos.
- **tests/dynamics.test.cjs**: Acrescenta 20 verificações de suspensão independente, carroceria, carga por roda, aero/DRS/esteira, embreagem/apagamento e conservação/estabilidade de colisões.
- **tests/car-audit.cjs**: Mede frenagem térmica, velocidades por marcha, aceleração e voltas completas, produzindo relatório da versão atual sem apagar o histórico 0.1.
- **tests/dynamics-audit.cjs**: Mede cargas, transferência de peso, resposta a irregularidades, aero, largada e impactos, incluindo integração de 20 carros.
- **tests/realism-audit.cjs**: Reproduz a auditoria do modelo original 0.1; os critérios que falham registram problemas históricos e o comando retorna 1 quando encontra esses problemas.
- **tests/car-bench.html**: Oferece bancada no navegador para repetir frenagens com pneus em cinco temperaturas usando a física entregue.
- **tests/browser-lab.html**: Oferece página de validação de eventos de teclado, largada, contatos e poses do carro renderizado no navegador.

## 06. chore: versionar 0.3.0 e documentar controles do jogo

- **package.json**: Atualiza a versão para 0.3.0, reúne os 49 testes e os comandos de auditoria e corrige a descrição em português.
- **README.md**: Atualiza apresentação, recursos, limitações, instruções de largada/embreagem/boxes e comandos para executar testes e auditorias.
- **LEIA-ME.md**: Atualiza o guia em português com oito marchas, pilotagem sem assistências, embreagem manual, repartida e limites da simulação.

## 07. docs: preservar auditoria inicial e validação do carro 0.2

- **docs/BRIEFING-ORIGINAL.md**: Preserva o pedido original para comparar o escopo entregue e os recursos ainda pendentes.
- **docs/AUDITORIA-REALISMO.md**: Registra problemas medidos na versão inicial e confirma que os seis traçados são fictícios.
- **docs/simulation-v0.1.0.cjs**: Guarda o modelo original para repetir os ensaios históricos mesmo após alterar a física atual.
- **docs/realism-measurements.json**: Guarda medições e critérios da auditoria original 0.1.
- **docs/PAINEL-AUDITORIA.html**: Apresenta resultados da auditoria inicial em um painel local consultável.
- **docs/painel-auditoria.jpg**: Guarda evidência visual do painel da auditoria.
- **docs/teste-direcao-livre.jpg**: Guarda evidência visual do ensaio de direção livre.
- **docs/CARRO-0.2.md**: Documenta a revisão 0.2, dados de referência do câmbio, pneus, ensaios e limitações daquela entrega.
- **docs/TESTES-0.2.txt**: Preserva o resumo dos 29 testes aprovados na revisão 0.2.
- **docs/car-validation.json**: Preserva as medições estruturadas de frenagem, câmbio e voltas da revisão 0.2.
- **docs/car-audit-output.txt**: Preserva a saída textual completa da auditoria do carro 0.2.
- **docs/browser-car-validation.json**: Preserva protocolo e resultados da validação no navegador da revisão 0.2.
- **docs/ensaio-pneus-0.2.jpg**: Guarda a imagem do ensaio térmico de frenagem da revisão 0.2.
- **docs/revision-manifest.json**: Preserva os hashes SHA-256 da entrega histórica 0.2; seu estado de publicação descreve aquela data.

## 08. data: preservar telemetria usada na calibração do câmbio

- **docs/sainz-singapore-2023-fp2.json.gz**: Armazena a telemetria pública OpenF1 de Carlos Sainz no FP2 de Singapura 2023 para permitir repetição offline.
- **docs/car-reference-data.json**: Armazena fontes, filtros, amostras e relações RPM/velocidade derivadas para as oito marchas; distingue medições públicas de calibrações aproximadas.

## 09. tools: permitir recalcular relações de marcha da telemetria

- **tools/gear-reference.cjs**: Lê a telemetria compactada, filtra amostras e recalcula as relações RPM/velocidade por marcha, permitindo conferir a referência sem rede.

## 10. docs: registrar validação da dinâmica e plano de melhorias

- **docs/CARRO-0.3.md**: Explica suspensão, carroceria, contatos, aerodinâmica e embreagem, apresenta números dos ensaios e explicita limites do modelo.
- **docs/PLANO-DE-MELHORIAS.md**: Marca os recursos do carro já concluídos, preserva as pendências de realismo e registra a publicação da revisão 0.3.
- **docs/TESTES-0.3.txt**: Registra 49 testes aprovados, ensaios do navegador e integração de 20 carros, com limites de validação.
- **docs/car-validation-0.3.json**: Guarda medições atuais de frenagem, marchas, aceleração e voltas completas.
- **docs/car-audit-0.3.txt**: Guarda a saída textual da auditoria atual do carro.
- **docs/dynamics-validation-0.3.json**: Guarda medições atuais de suspensão, transferência de carga, aero, embreagem, colisão e estabilidade do grid completo.
- **docs/dynamics-audit-0.3.txt**: Guarda a saída textual da auditoria de dinâmica.
- **docs/browser-dynamics-validation-0.3.json**: Consolida verificações de teclado, embreagem, renderização, menu estreito e pneus, incluindo a limitação dos avisos de instrumentação do navegador.
- **docs/browser-launch-0.3.json**: Guarda estados medidos antes, durante e depois da largada manual.
- **docs/browser-gp-contact-0.3.json**: Preserva o ensaio intermediário no navegador de contatos em Grand Prix, identificado como anterior à correção final de freio parado.
- **docs/browser-mobile-menu-0.3.json**: Guarda medidas do menu em 320 px e confirma que o cartão do evento não cobre o botão de início.
- **docs/browser-tyres-0.3.json**: Guarda cinco ensaios térmicos de frenagem executados no navegador.
- **docs/carro-0.3.png**: Guarda evidência visual da carroceria e suspensão na revisão 0.3.
- **docs/ensaio-pneus-0.3.png**: Guarda evidência visual da bancada de frenagem térmica atual.
- **docs/PUBLICACAO-GITHUB.md**: Lista os dez commits por assunto e descreve cada arquivo incluído, com repositório, validação e escopo da publicação.
- **docs/revision-manifest-0.3.json**: Atualiza o destino da revisão 0.3 e os hashes SHA-256 de todos os arquivos entregues, excluindo o próprio manifesto para evitar referência circular.


## 11. docs: conferir integridade dos arquivos publicados

- **docs/revision-manifest-0.3.json**: alinha o SHA-256 de JOGAR.cmd com os bytes preservados no GitHub, recalcula o hash deste documento e informa que os hashes correspondem aos bytes do Download ZIP. Atributos de checkout podem converter finais de linha em arquivos de texto.
- **docs/PUBLICACAO-GITHUB.md**: registra a comparação dos 57 arquivos publicados com a pasta local e explica este commit final de integridade.

A comparação confirmou os mesmos 57 caminhos e conteúdos, incluindo imagens, biblioteca 3D, dados de telemetria, testes e documentos. A única diferença de bytes antes deste ajuste era JOGAR.cmd: o arquivo já publicado usa LF, e a pasta local usa CRLF. Seu conteúdo é igual após normalizar finais de linha; os atributos do Git declaram CRLF para checkout de arquivos .cmd. O manifesto considera os bytes publicados, e o ZIP de distribuição local preserva essa mesma cópia do arquivo.
