# APEX Formula — edição local 0.3.0

Jogo 3D de monopostos com cockpit, 19 adversários e estratégia. Protótipo jogável com física aproximada e gráficos procedurais. A versão 0.3.0 prioriza o carro do jogador. Leia [mudanças e calibração do carro](docs/CARRO-0.3.md) e o [plano completo de melhorias](docs/PLANO-DE-MELHORIAS.md).

## Jogar

Extraia a pasta inteira e abra **index.html** no Edge ou Chrome; no Windows também pode usar **JOGAR.cmd**. O jogo funciona offline, sem instalar pacotes. Precisa de WebGL com aceleração gráfica. Mantenha todos os arquivos juntos, incluindo chassis.js, vehicle.js e a pasta vendor.

## Controles

| Comando | Ação |
|---|---|
| W / seta para cima | Acelerar |
| S / seta para baixo | Frear |
| A / D / setas laterais | Esterçar |
| SHIFT (segurar / soltar) | Puxar toda a embreagem / acoplar completamente |
| J / K | Soltar / puxar a embreagem em passos de 10% |
| Controle deslizante EMBREAGEM | Dosar livremente de 0% acoplada a 100% puxada |
| SHIFT + I | Religar o motor apagado (conveniência do jogo) |
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

Gamepad padrão: RT/LT acelerador/freio; analógico esquerdo direção; direito olhar; RB/LB marchas; A ERS; X DRS; Y rádio; B boxes; Start pausa; View/Select segura a embreagem. O mapeamento depende do navegador. Teclas Z/L também estão disponíveis para ré e limitador. Telas estreitas têm botões de toque de pedais, direção e marchas.

## Pilotar sem assistência

Na largada, a embreagem começa puxada. Segure o freio se houver inclinação; acelere com W antes das luzes apagarem e solte progressivamente com J ou pelo controle na tela. K puxa novamente. SHIFT puxa tudo; ao soltar SHIFT, o acoplamento é imediato. Não existe controle automático de largada ou tração. Sem aceleração suficiente, soltar pode apagar o motor; SHIFT + I o religa. Espere as luzes apagarem para sair. **Toda a trajetória, frenagem e troca de marcha ficam com você.** ABS, controle de tração, assistência de direção/freio e câmbio automático foram removidos, inclusive de saves antigos. A linha visual opcional não controla o carro.

Suba a marcha perto de 11.500 RPM, indicado pelos LEDs. Se mantiver a primeira, a velocidade fica perto de 108 km/h. Reduções que excederiam 15.000 RPM são recusadas. Pare antes de selecionar a ré com Z.

Use menos acelerador nas marchas baixas e ao sair de curvas. Frear forte enquanto esterça pode travar rodas e fazer o carro seguir reto; solte parte do freio antes de virar. Teclado tem pedais binários: use toques curtos. Um gamepad permite dosar pedais e direção.

Pneus frios e superaquecidos têm menos aderência. Dianteiros/traseiros aquecem conforme o trabalho e esfriam parados; passe o mouse pela temperatura para ver os eixos. Escolha slicks no seco, intermediários em chuva leve e chuva em pista muito molhada. Aquecimento e desgaste importam na frenagem e nas curvas.

DRS é liberado em trechos de baixa curvatura e relativamente secos, com adversário a menos de um segundo; contra o relógio dispensa o adversário. Frear fecha a asa. O híbrido segue uma aproximação da geração 2023–2025.

## Boxes

Solicite com B; entre pela direita aproximadamente 360 m antes da linha. Reduza e ative L: o limitador corta potência acima de 80 km/h, sem frear automaticamente. Controle o volante e pare no centro da marca amarela, cerca de 90 m antes da linha. Não há direção/frenagem automáticas nos boxes. Após a troca, dose a embreagem, acelere, observe o tráfego e retorne à pista pela esquerda na saída indicada.

Escolha o próximo composto em Pausa → Estratégia de boxes. A parada troca pneus e repara o dano agregado. Não há reabastecimento.

## Conteúdo e limites

- Seis pistas **fictícias**: Costa Verde, Marina Neon, Alta Velocità, Sierra Blanca, Dunas de Yas e Silver Coast. Não são réplicas de Interlagos, Marina Bay, Monza, Barcelona, Yas Marina ou Silverstone.
- Treino, classificação por referência, Grand Prix, contra o relógio, carreira e campeonato local; clima, cinco compostos, ERS, DRS, danos agregados, rádio e cockpit animado.
- Carro do jogador com modelo de dois eixos, forças combinadas, massa, aero, relevo, transmissão e temperatura. Agora há quatro contatos de mola/amortecedor, movimento físico da carroceria e transferência lateral de carga. A força lateral dos pneus ainda é agregada por eixo. Não é um simulador profissional.
- Colisões entre jogador/IA e IA/IA usam formas orientadas, impulso, atrito, rotação e separação. As asas dianteira/traseira têm dano próprio. Aero inclui asa dianteira, traseira, assoalho, altura, DRS, vácuo e ar sujo.
- IA e direção de prova ainda são simplificadas. Penalidades finais, voltas inválidas, paradas, Safety Car/VSC e classificação estão no plano de melhorias. Reduza manualmente nas neutralizações.
- Multiplayer, force feedback dedicado, circuitos/carros oficiais, acabamento fotorrealista e falhas físicas por componente continuam pendentes.
- Salvamentos ficam no navegador e dependem da origem (arquivo ou localhost). A voz depende do sistema; desempenho depende do computador e dos gráficos.

## Testes e desenvolvimento

Sem compilação. Node.js 20+ permite executar:

`npm test` — 49 testes de física e regressão.

`npm run audit:car` — medições da versão atual, em docs/car-validation-0.3.json.

`npm run audit:dynamics` — suspensão, aero, embreagem, colisões, grid e voltas, em docs/dynamics-validation-0.3.json.

`node tools/gear-reference.cjs` — refaz as relações a partir da telemetria salva, offline.

`npm run audit:realism` — **histórico 0.1.0**, com FAIL esperados; não valida o carro atual.

O laboratório tests/browser-lab.html envia comandos aos listeners reais do jogo. Seus controles de teste não fazem parte de index.html. Os testes de volta usam um controlador exclusivo de teste, ausente do jogo.

Arquivos principais: index.html, style.css, game.js, simulation.js, vehicle.js e chassis.js. Three.js 0.160.1 está incluído em vendor/ com sua licença MIT. Consulte docs/ para fontes, resultados e pendências.
