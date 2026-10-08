# APEX Formula — edição local 0.4.1

Jogo 3D de monopostos com cockpit, 19 adversários e estratégia. Protótipo jogável com física aproximada e gráficos procedurais. A versão 0.4.1 revisa os seis circuitos originais, os cenários e o HUD, preservando a pilotagem manual. A revisão 0.4.1 permite largar apenas pelo acelerador. Leia [largada e publicação](docs/LARGADA-0.4.1.md), [mapas, instrumentos e validação](docs/MAPAS-HUD-0.4.md), [mudanças e calibração do carro](docs/CARRO-0.3.md) e o [plano completo de melhorias](docs/PLANO-DE-MELHORIAS.md).

## Jogar

Extraia a pasta inteira e abra **index.html** no Edge ou Chrome; no Windows também pode usar **JOGAR.cmd**. O jogo funciona offline, sem instalar pacotes. Precisa de WebGL com aceleração gráfica. Mantenha todos os arquivos juntos, incluindo tracks.js, timing.js, chassis.js, vehicle.js e a pasta vendor.

## Controles

| Comando | Ação |
|---|---|
| W / seta para cima | Acelerar |
| S / seta para baixo | Frear |
| A / D / setas laterais | Esterçar |
| E / Q | Subir / reduzir marcha |
| Z | Alternar ré / primeira com o carro parado |
| L | Ligar / desligar limitador de boxes |
| Espaço | ERS de ultrapassagem |
| V | Alternar modo de energia |
| F | Abrir / fechar DRS quando disponível |
| B | Solicitar / cancelar boxes |
| C | Alternar cockpit / câmera externa / bico |
| R | Consultar engenheiro |
| Esc | Pausar / continuar |
| H | Ocultar / mostrar instrumentos auxiliares |
| X | Reposicionar e parar, com penalidade de 5 s |
| Botão direito + movimento do mouse | Olhar para os lados |

Gamepad padrão: RT/LT acelerador/freio; analógico esquerdo direção; direito olhar; RB/LB marchas; A ERS; X DRS; Y rádio; B boxes; Start pausa. O mapeamento depende do navegador. Teclas Z/L também estão disponíveis para ré e limitador. Telas estreitas têm botões de toque de pedais, direção e marchas.

## Pilotar sem assistência

Espere as luzes apagarem e acelere com W, seta para cima, RT ou o pedal de toque. O acoplamento ocorre automaticamente na largada, nas paradas e na saída dos boxes; não há comando de embreagem. Soltar o acelerador não faz o carro sair sozinho. **Toda a trajetória, frenagem e troca de marcha ficam com você.** As oito marchas e a ré continuam manuais. ABS, controle de tração, assistência de direção/freio e câmbio automático continuam desativados, inclusive em saves antigos. A linha visual opcional não controla o carro.

Suba a marcha perto de 11.500 RPM, indicado pelos LEDs. Se mantiver a primeira, a velocidade fica perto de 108 km/h. Reduções que excederiam 15.000 RPM são recusadas. Pare antes de selecionar a ré com Z.

Use menos acelerador nas marchas baixas e ao sair de curvas. Frear forte enquanto esterça pode travar rodas e fazer o carro seguir reto; solte parte do freio antes de virar. Teclado tem pedais binários: use toques curtos. Um gamepad permite dosar pedais e direção.

Pneus frios e superaquecidos têm menos aderência. Dianteiros/traseiros aquecem conforme o trabalho e esfriam parados; as temperaturas de cada eixo aparecem no HUD. Escolha slicks no seco, intermediários em chuva leve e chuva em pista muito molhada. Aquecimento e desgaste importam na frenagem e nas curvas.

DRS é liberado em trechos de baixa curvatura e relativamente secos, com adversário a menos de um segundo; contra o relógio dispensa o adversário. Frear fecha a asa. O híbrido segue uma aproximação da geração 2023–2025.

## Boxes

Solicite com B; entre pela direita aproximadamente 360 m antes da linha. Reduza e ative L: o limitador corta potência acima de 80 km/h, sem frear automaticamente. Controle o volante e pare no centro da marca amarela, cerca de 90 m antes da linha. Não há direção/frenagem automáticas nos boxes. Após a troca, acelere, observe o tráfego e retorne à pista pela esquerda na saída indicada.

Escolha o próximo composto em Pausa → Estratégia de boxes. A parada troca pneus e repara o dano agregado. Não há reabastecimento.

## Conteúdo e limites

- Seis pistas **fictícias**: Costa Verde, Marina Neon, Alta Velocità, Sierra Blanca, Dunas de Yas e Silver Coast. Não são réplicas de Interlagos, Marina Bay, Monza, Barcelona, Yas Marina ou Silverstone.
- Treino, classificação por referência, Grand Prix, contra o relógio, carreira e campeonato local; clima, cinco compostos, ERS, DRS, danos agregados, rádio e cockpit animado.
- Carro do jogador com modelo de dois eixos, forças combinadas, massa, aero, relevo, transmissão e temperatura. Agora há quatro contatos de mola/amortecedor, movimento físico da carroceria e transferência lateral de carga. A força lateral dos pneus ainda é agregada por eixo. Não é um simulador profissional.
- Colisões entre jogador/IA e IA/IA usam formas orientadas, impulso, atrito, rotação e separação. As asas dianteira/traseira têm dano próprio. Aero inclui asa dianteira, traseira, assoalho, altura, DRS, vácuo e ar sujo.
- HUD com próxima curva numerada, distância, setores cronometrados, delta para a melhor volta válida, pedais, temperaturas por eixo, asas, limitador e radar de proximidade. O minimapa mostra os carros nas posições reais e destaca três setores.
- Voltas com o carro inteiro fora da pista ou reposicionamento não geram recorde. Os recordes dos novos traçados são separados dos antigos.
- IA e direção de prova ainda são simplificadas. Penalidades finais, progresso obrigatório por checkpoints, paradas, Safety Car/VSC e classificação real por voltas seguem no plano de melhorias. Reduza manualmente nas neutralizações.
- Multiplayer, force feedback dedicado, circuitos/carros oficiais, acabamento fotorrealista e falhas físicas por componente continuam pendentes.
- Salvamentos ficam no navegador e dependem da origem (arquivo ou localhost). A voz depende do sistema; desempenho depende do computador e dos gráficos.

## Testes e desenvolvimento

Sem compilação. Node.js 20+ permite executar:

`npm test` — 87 testes de física, pistas, boxes, grid e cronometragem.

`npm run audit:car` — medições da versão atual, em docs/car-validation-0.4.json.

`npm run audit:dynamics` — suspensão, aero, embreagem, colisões, grid e voltas, em docs/dynamics-validation-0.4.json.

`npm run audit:maps` — geometria, voltas no seco/chuva e boxes de todos os circuitos, em docs/maps-validation-0.4.json.

`node tools/gear-reference.cjs` — refaz as relações a partir da telemetria salva, offline.

`npm run audit:realism` — **histórico 0.1.0**, com FAIL esperados; não valida o carro atual.

O laboratório tests/browser-lab.html envia comandos aos listeners reais do jogo. Seus controles de teste não fazem parte de index.html. Os testes de volta usam um controlador exclusivo de teste, ausente do jogo.

Arquivos principais: index.html, style.css, game.js, tracks.js, timing.js, simulation.js, vehicle.js e chassis.js. O laboratório tests/maps-browser.html permite inspecionar as curvas e testar o HUD; seu reposicionamento é exclusivo do teste. Three.js 0.160.1 está incluído em vendor/ com sua licença MIT. Consulte docs/ para fontes, resultados e pendências.
