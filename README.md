# APEX Formula â€” ediÃ§Ã£o local 0.4.1

Jogo 3D de monopostos com cockpit, 19 adversÃ¡rios e estratÃ©gia. ProtÃ³tipo jogÃ¡vel com fÃ­sica aproximada e grÃ¡ficos procedurais. A versÃ£o 0.4.1 revisa os seis circuitos originais, os cenÃ¡rios e o HUD, preservando a pilotagem manual. A revisÃ£o 0.4.1 permite largar apenas pelo acelerador. Leia [largada e publicaÃ§Ã£o](docs/LARGADA-0.4.1.md), [mapas, instrumentos e validaÃ§Ã£o](docs/MAPAS-HUD-0.4.md), [mudanÃ§as e calibraÃ§Ã£o do carro](docs/CARRO-0.3.md) e o [plano completo de melhorias](docs/PLANO-DE-MELHORIAS.md).

## Jogar

Extraia a pasta inteira e abra **index.html** no Edge ou Chrome; no Windows tambÃ©m pode usar **JOGAR.cmd**. O jogo funciona offline, sem instalar pacotes. Precisa de WebGL com aceleraÃ§Ã£o grÃ¡fica. Mantenha todos os arquivos juntos, incluindo tracks.js, timing.js, chassis.js, vehicle.js e a pasta vendor.

## Controles

| Comando | AÃ§Ã£o |
|---|---|
| W / seta para cima | Acelerar |
| S / seta para baixo | Frear |
| A / D / setas laterais | EsterÃ§ar |
| E / Q | Subir / reduzir marcha |
| Z | Alternar rÃ© / primeira com o carro parado |
| L | Ligar / desligar limitador de boxes |
| EspaÃ§o | ERS de ultrapassagem |
| V | Alternar modo de energia |
| F | Abrir / fechar DRS quando disponÃ­vel |
| B | Solicitar / cancelar boxes |
| C | Alternar cockpit / cÃ¢mera externa / bico |
| R | Consultar engenheiro |
| Esc | Pausar / continuar |
| H | Ocultar / mostrar instrumentos auxiliares |
| X | Reposicionar e parar, com penalidade de 5 s |
| BotÃ£o direito + movimento do mouse | Olhar para os lados |

Gamepad padrÃ£o: RT/LT acelerador/freio; analÃ³gico esquerdo direÃ§Ã£o; direito olhar; RB/LB marchas; A ERS; X DRS; Y rÃ¡dio; B boxes; Start pausa. O mapeamento depende do navegador. Teclas Z/L tambÃ©m estÃ£o disponÃ­veis para rÃ© e limitador. Telas estreitas tÃªm botÃµes de toque de pedais, direÃ§Ã£o e marchas.

## Pilotar sem assistÃªncia

Espere as luzes apagarem e acelere com W, seta para cima, RT ou o pedal de toque. O acoplamento ocorre automaticamente na largada, nas paradas e na saÃ­da dos boxes; nÃ£o hÃ¡ comando de embreagem. Soltar o acelerador nÃ£o faz o carro sair sozinho. **Toda a trajetÃ³ria, frenagem e troca de marcha ficam com vocÃª.** As oito marchas e a rÃ© continuam manuais. ABS, controle de traÃ§Ã£o, assistÃªncia de direÃ§Ã£o/freio e cÃ¢mbio automÃ¡tico continuam desativados, inclusive em saves antigos. A linha visual opcional nÃ£o controla o carro.

Suba a marcha perto de 11.500 RPM, indicado pelos LEDs. Se mantiver a primeira, a velocidade fica perto de 108 km/h. ReduÃ§Ãµes que excederiam 15.000 RPM sÃ£o recusadas. Pare antes de selecionar a rÃ© com Z.

Use menos acelerador nas marchas baixas e ao sair de curvas. Frear forte enquanto esterÃ§a pode travar rodas e fazer o carro seguir reto; solte parte do freio antes de virar. Teclado tem pedais binÃ¡rios: use toques curtos. Um gamepad permite dosar pedais e direÃ§Ã£o.

Pneus frios e superaquecidos tÃªm menos aderÃªncia. Dianteiros/traseiros aquecem conforme o trabalho e esfriam parados; as temperaturas de cada eixo aparecem no HUD. Escolha slicks no seco, intermediÃ¡rios em chuva leve e chuva em pista muito molhada. Aquecimento e desgaste importam na frenagem e nas curvas.

DRS Ã© liberado em trechos de baixa curvatura e relativamente secos, com adversÃ¡rio a menos de um segundo; contra o relÃ³gio dispensa o adversÃ¡rio. Frear fecha a asa. O hÃ­brido segue uma aproximaÃ§Ã£o da geraÃ§Ã£o 2023â€“2025.

## Boxes

Solicite com B; entre pela direita aproximadamente 360 m antes da linha. Reduza e ative L: o limitador corta potÃªncia acima de 80 km/h, sem frear automaticamente. Controle o volante e pare no centro da marca amarela, cerca de 90 m antes da linha. NÃ£o hÃ¡ direÃ§Ã£o/frenagem automÃ¡ticas nos boxes. ApÃ³s a troca, acelere, observe o trÃ¡fego e retorne Ã  pista pela esquerda na saÃ­da indicada.

Escolha o prÃ³ximo composto em Pausa â†’ EstratÃ©gia de boxes. A parada troca pneus e repara o dano agregado. NÃ£o hÃ¡ reabastecimento.

## ConteÃºdo e limites

- Seis pistas **fictÃ­cias**: Costa Verde, Marina Neon, Alta VelocitÃ , Sierra Blanca, Dunas de Yas e Silver Coast. NÃ£o sÃ£o rÃ©plicas de Interlagos, Marina Bay, Monza, Barcelona, Yas Marina ou Silverstone.
- Treino, classificaÃ§Ã£o por referÃªncia, Grand Prix, contra o relÃ³gio, carreira e campeonato local; clima, cinco compostos, ERS, DRS, danos agregados, rÃ¡dio e cockpit animado.
- Carro do jogador com modelo de dois eixos, forÃ§as combinadas, massa, aero, relevo, transmissÃ£o e temperatura. Agora hÃ¡ quatro contatos de mola/amortecedor, movimento fÃ­sico da carroceria e transferÃªncia lateral de carga. A forÃ§a lateral dos pneus ainda Ã© agregada por eixo. NÃ£o Ã© um simulador profissional.
- ColisÃµes entre jogador/IA e IA/IA usam formas orientadas, impulso, atrito, rotaÃ§Ã£o e separaÃ§Ã£o. As asas dianteira/traseira tÃªm dano prÃ³prio. Aero inclui asa dianteira, traseira, assoalho, altura, DRS, vÃ¡cuo e ar sujo.
- HUD com prÃ³xima curva numerada, distÃ¢ncia, setores cronometrados, delta para a melhor volta vÃ¡lida, pedais, temperaturas por eixo, asas, limitador e radar de proximidade. O minimapa mostra os carros nas posiÃ§Ãµes reais e destaca trÃªs setores.
- Voltas com o carro inteiro fora da pista ou reposicionamento nÃ£o geram recorde. Os recordes dos novos traÃ§ados sÃ£o separados dos antigos.
- IA e direÃ§Ã£o de prova ainda sÃ£o simplificadas. Penalidades finais, progresso obrigatÃ³rio por checkpoints, paradas, Safety Car/VSC e classificaÃ§Ã£o real por voltas seguem no plano de melhorias. Reduza manualmente nas neutralizaÃ§Ãµes.
- Multiplayer, force feedback dedicado, circuitos/carros oficiais, acabamento fotorrealista e falhas fÃ­sicas por componente continuam pendentes.
- Salvamentos ficam no navegador e dependem da origem (arquivo ou localhost). A voz depende do sistema; desempenho depende do computador e dos grÃ¡ficos.

## Testes e desenvolvimento

Sem compilaÃ§Ã£o. Node.js 20+ permite executar:

`npm test` â€” 87 testes de fÃ­sica, pistas, boxes, grid e cronometragem.

`npm run audit:car` â€” mediÃ§Ãµes da versÃ£o atual, em docs/car-validation-0.4.json.

`npm run audit:dynamics` â€” suspensÃ£o, aero, embreagem, colisÃµes, grid e voltas, em docs/dynamics-validation-0.4.json.

`npm run audit:maps` â€” geometria, voltas no seco/chuva e boxes de todos os circuitos, em docs/maps-validation-0.4.json.

`node tools/gear-reference.cjs` â€” refaz as relaÃ§Ãµes a partir da telemetria salva, offline.

`npm run audit:realism` â€” **histÃ³rico 0.1.0**, com FAIL esperados; nÃ£o valida o carro atual.

O laboratÃ³rio tests/browser-lab.html envia comandos aos listeners reais do jogo. Seus controles de teste nÃ£o fazem parte de index.html. Os testes de volta usam um controlador exclusivo de teste, ausente do jogo.

Arquivos principais: index.html, style.css, game.js, tracks.js, timing.js, simulation.js, vehicle.js e chassis.js. O laboratÃ³rio tests/maps-browser.html permite inspecionar as curvas e testar o HUD; seu reposicionamento Ã© exclusivo do teste. Three.js 0.160.1 estÃ¡ incluÃ­do em vendor/ com sua licenÃ§a MIT. Consulte docs/ para fontes, resultados e pendÃªncias.
