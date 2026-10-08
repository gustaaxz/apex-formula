# Carro — versão 0.2.0

Implementado e medido em 08/10/2026. Prioridade: carro do jogador. O plano completo está em [PLANO-DE-MELHORIAS.md](PLANO-DE-MELHORIAS.md). A auditoria de 0.1.0 permanece como histórico; seus números não descrevem esta versão.

## Mudanças entregues

- Direção, posição e orientação livres no plano da pista. Não há retorno automático à trajetória nem limite artificial de 65° para girar o carro. Esterçar parado não desloca o veículo.
- Removidas assistência de trajetória, frenagem assistida, ABS, controle de tração e mudanças automáticas. Configurações antigas não podem reativá-las. A linha visual de corrida é opcional e não controla o carro.
- Oito relações de câmbio e ré, rotação ligada à velocidade, torque por relação, corte de potência ao trocar, limitador de giro, freio motor e proteção contra reduções que excedam 15.000 RPM. E sobe, Q reduz, Z alterna primeira/ré com velocidade abaixo de 3,6 km/h.
- Aceleração, frenagem e força lateral compartilham a capacidade de cada eixo. Acelerar demais pode patinar; frear demais pode travar rodas e tirar capacidade de fazer curvas. O painel indica esses estados.
- Temperaturas dianteira e traseira separadas, aquecimento por trabalho e resfriamento. Grip baixo com pneus frios e superaquecidos; água, composto, desgaste e dano também reduzem aderência. O indicador usa o pior estado dos eixos, inclusive MISTO quando um está frio e o outro quente.
- Arrasto e carga aerodinâmica dependentes da velocidade e do acerto; combustível entra na massa, relevo acrescenta força da gravidade, DRS altera forças aerodinâmicas e upgrades de motor alteram torque/potência.
- ERS consome energia ao entregar potência e recupera energia de frenagem em movimento. Frear parado não carrega a bateria.
- Boxes sem direção ou frenagem automáticas. L liga/desliga o limitador, que corta potência acima de 80 km/h; o motorista precisa reduzir a velocidade e estacionar na marca. X reposiciona e para o carro com a penalidade existente.
- Cockpit, câmeras, pneus dianteiros, volante, marcha e LEDs acompanham o estado do veículo. Controles de toque agora incluem subir e reduzir marcha.

## Câmbio: dado observado versus calibração do jogo

A FIA exige **oito marchas à frente e uma ré** na geração usada como referência. O protótipo já mostrava oito números, mas usava uma divisão artificial de velocidade; por isso a correção mantém oito relações derivadas da telemetria em vez de acrescentar marchas inexistentes.

Fonte dos dados: Carlos Sainz, Ferrari, treino livre 2 de Singapura de 2023, sessão 9159, piloto 55. Foram obtidas 18.470 amostras públicas pelo [OpenF1](https://openf1.org/docs/). OpenF1 é um distribuidor não oficial de telemetria; os dados não são uma ficha técnica emitida pela Ferrari.

Filtro: mesma marcha nas amostras adjacentes, velocidade acima de 40 km/h, RPM acima de 5.000, acelerador acima de 25%, freio desligado; remover valores RPM/velocidade a mais de 8% da mediana por marcha. A mediana restante estima a relação efetiva RPM/(km/h).

| Marcha | Amostras filtradas | Velocidades observadas (km/h) | A 11.500 RPM, calculado (km/h) | A 12.500 RPM, calculado (km/h) | Ensaio de 45 s do jogo (km/h) |
|---|---:|---:|---:|---:|---:|
| 1 | 533 | 41–99 | 99.38 | 108.03 | 108.01 |
| 2 | 742 | 57–131 | 129.65 | 140.92 | 140.93 |
| 3 | 1362 | 74–163 | 151.57 | 164.75 | 164.8 |
| 4 | 1205 | 104–201 | 179.25 | 194.83 | 194.82 |
| 5 | 696 | 164–231 | 215.23 | 233.95 | 233.98 |
| 6 | 659 | 191–266 | 250.28 | 272.04 | 271.96 |
| 7 | 593 | 251–300 | 286.76 | 311.7 | 311.52 |
| 8 | 82 | 287–315 | 323.33 | 351.44 | 317.59 |

**As velocidades observadas não são limites de cada marcha.** Trocas escolhidas pelo piloto, raio dinâmico do pneu, patinagem e sincronização dos canais introduzem incerteza. Não se obtêm números de dentes nem relação final oficial desta inferência. O ensaio do jogo parte parado em cada marcha; em oitava o equilíbrio entre potência e arrasto impede atingir o limite teórico de giro.

No jogo, 11.500 RPM é a indicação para subir marcha e 12.500 RPM é o corte calibrado. A ré usa uma relação aproximada independente. Curva de torque (até 540 Nm / 540 kW), raio de roda de 0,36 m, massa seca de 800 kg, entre-eixos de 3,6 m, aero e forças dos pneus são aproximações explícitas, não especificações verificadas da Ferrari. O híbrido entrega até 120 kW nesta configuração; não representa integralmente a geração 2026.

Os dados brutos estão em [sainz-singapore-2023-fp2.json.gz](sainz-singapore-2023-fp2.json.gz). A derivação pode ser repetida offline com `node tools/gear-reference.cjs`; adicionar `--refresh` baixa novamente a mesma sessão pública. O resumo com horários e amostras de evidência está em [car-reference-data.json](car-reference-data.json).

## Pneus: ensaio igual, temperaturas diferentes

Pista reta e seca; pneu médio novo; combustível 30 kg; aero 5/10; freio pressionado a 100%; de 100 km/h até no máximo 0,36 km/h. Sem ABS, as rodas podem travar. As temperaturas continuam evoluindo durante a frenagem. Resultados do modelo, não números certificados de um carro real.

| Temperatura inicial | Distância | Tempo |
|---|---:|---:|
| 20 °C | 54.11 m | 3.98 s |
| 70 °C | 31.73 m | 2.35 s |
| 85 °C | 28.19 m | 2.08 s |
| 100 °C | 27.27 m | 2.02 s |
| 140 °C | 43.95 m | 3.26 s |

O ensaio resolve a igualdade de frenagem entre 20 °C e 85 °C. O modelo também piora quando superaquecido. A faixa de trabalho foi calibrada para o jogo: macio 85–105 °C, médio 90–110 °C, duro 95–115 °C, intermediário 65–85 °C e chuva 45–65 °C. São escolhas de simulação; não são faixas oficiais publicadas dos compostos Pirelli.

## Verificação

- 29 testes automáticos passaram: regressões de sessão, marcha, temperaturas, desgaste, frenagem combinada, patinagem, ERS, massa, relevo, aero, DRS, upgrades, ré, limitador e estabilidade em passos de 60/120 Hz.
- Um piloto exclusivamente de teste completou uma volta nos seis circuitos, uma corrida de cinco voltas e uma parada completa. Ele envia pedais, direção e mudanças explícitas. Esse controlador não está presente no jogo.
- A volta conservadora de teste serve para verificar controle e estabilidade; não demonstra ritmo real de F1. As pistas continuam fictícias.
- O relatório reproduzível está em [car-validation.json](car-validation.json), gerado por `npm run audit:car`. Rodar `npm test` executa a suíte de regressão. `npm run audit:realism` reproduz apenas a auditoria histórica de 0.1.0; seus FAIL registram defeitos daquela versão.
- A verificação no navegador e sua evidência ficam em [browser-car-validation.json](browser-car-validation.json), após os testes dos comandos reais.

## Limites que continuam abertos

Modelo aproximado de dois eixos no plano horizontal; altura acompanha o terreno. Não há quatro rodas com inércia individual, pressão/carcaça, suspensão independente, rolagem de carroceria, diferencial físico nem embreagem manual. O bloqueio/patinagem é estimado por demanda de força e não por velocidades angulares de cada roda. A distribuição de carga inclui transferência longitudinal simplificada.

A IA ainda usa o modelo antigo simplificado; paradas adversárias, classificação por referência, voltas fora dos limites, penalidades finais, Safety Car/VSC e calendário precisam de outra etapa. Os seis circuitos não são réplicas dos circuitos reais. A experiência em volante/pedais e force feedback ainda não foi validada por um piloto humano.

## Referências

- [FIA — regulamento técnico 2025, edição de 11/12/2024](https://www.fia.com/sites/default/files/fia_2025_formula_1_technical_regulations_-_issue_01_-_2024-12-11_1.pdf): artigos 9.7 e 9.8 (oito marchas/ré), 9.9 (troca pelo piloto), 9.2.2 (controle de tração) e 11.4.1 (ABS).
- [OpenF1 — documentação e campos de telemetria](https://openf1.org/docs/) e [dados da sessão/piloto usados](https://api.openf1.org/v1/car_data?session_key=9159&driver_number=55).
- [Pirelli — gestão de calor em Singapura](https://press.pirelli.com/managing-the-heat-under-the-lights-in-singapore/): contexto qualitativo de temperatura e superaquecimento; não fornece a curva térmica usada no jogo.
