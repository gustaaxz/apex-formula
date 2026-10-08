# Carro 0.3.0 — suspensão, contatos, aero e largada

Revisão de 08/10/2026. Implementa os quatro pedidos atuais do usuário. A geração de referência continua sendo 2023–2025, com oito marchas e DRS convencional. Os relatórios de 0.1 e 0.2 foram preservados; a revisão 0.3 é publicada em [gustaaxz/apex-formula](https://github.com/gustaaxz/apex-formula), com os arquivos descritos em PUBLICACAO-GITHUB.md.

## Suspensão individual e carroceria

Cada roda possui sua própria mola, amortecedor, altura do solo, compressão, carga e estado de contato. As rodas amostram posições diferentes da pista e das zebras. A carroceria integra movimento vertical, inclinação longitudinal e rolagem a partir das forças dos quatro contatos, gravidade, aceleração, frenagem, curva e pressão aerodinâmica. A transferência de carga modifica a aderência, com sensibilidade à carga calculada por contato. Uma roda descarregada não produz aderência fictícia.

No 3D, a carroceria se move separadamente das rodas. Os braços se reposicionam entre os pontos da carroceria e cada roda; o cockpit e a câmera do bico acompanham a carroceria. A câmera externa acompanha a posição do veículo. A inclinação real da pista participa da pose.

Calibrações do protótipo: entre-eixos 3,60 m, bitola 1,96 m, centro de gravidade 0,30 m; mola 110.000 N/m e amortecedor 4.800 N·s/m por contato, batente progressivo a partir de 45 mm de compressão adicional. A compressão é relativa à carga estática. Esses números não são especificações publicadas de Ferrari, Red Bull ou outra equipe.

Ensaio em plano, massa total 830 kg, sem aero: os quatro contatos sustentam 8.142,30 N. A 12 m/s² de aceleração, cada contato dianteiro cai de 2.205,21 para 1.790,21 N e cada traseiro sobe de 1.865,94 para 2.280,94 N. Na frenagem de 20 m/s², os dianteiros chegam a 2.896,87 N. Uma irregularidade sob uma única roda gera diferença de carga e movimento da carroceria; a oscilação se acomoda com amortecimento.

## Colisão entre carros

Contato entre jogador e IA e entre IA e IA usa retângulos orientados de 5,70 × 2,30 m. A detecção considera a orientação do carro, seguida de impulso, atrito, rotação e correção da interpenetração. Contatos são resolvidos também nos boxes. O cálculo físico continua mesmo durante o intervalo que evita contabilizar repetidamente o mesmo dano.

O impacto transfere velocidade para o outro carro; não aplica a antiga redução arbitrária de 35% por cima do impulso. A IA mantém deslocamento e rotação decorrentes do contato, enquanto seu controlador tenta recuperar a trajetória. As asas dianteira e traseira recebem dano conforme a posição do impacto, afetando suas forças aerodinâmicas e a aparência. A parada repara essas asas.

Ensaio frontal com carros de 830/800 kg a 30/10 m/s: momento linear antes e depois de **32.900 kg·m/s**; velocidades após contato de 69,84/75,60 km/h. Ensaios adicionais cobrem impacto lateral, contato fora do centro, formas perpendiculares, ausência de contato, separação, perda de energia e encontro frontal a 90 m/s por carro. O passo interno é de no máximo 1/240 s.

## Aerodinâmica

Asa dianteira, asa traseira e assoalho produzem cargas distintas, com arrasto separado. As forças crescem com o quadrado da velocidade relativa modelada. Altura e inclinação do assoalho, velocidade lateral, regulagem aerodinâmica e dano alteram a força e o equilíbrio dianteiro/traseiro. DRS reduz a contribuição da asa traseira e o arrasto; não remove arbitrariamente carga da asa dianteira ou de todo o assoalho.

A esteira de outro carro depende da distância, desvio lateral e alinhamento entre os veículos no mundo. Seguir perto reduz arrasto e carga, com perda maior na frente. Sair lateralmente da esteira restaura o ar limpo. O indicador **AR SUJO** ajuda a reconhecer a condição.

Ensaio a 60 m/s, altura inicial estática: carga total de 9.360 N em ar limpo; ao seguir a 25 m, 7.767,70 N, com arrasto de 2.287,91 N contra 2.664 N em ar limpo. Com DRS em ar limpo, a asa traseira cai de 2.340 para 1.287 N; asa dianteira e assoalho conservam suas contribuições. São resultados da calibração do jogo, não medições de um carro real.

## Embreagem de largada

O controle começa puxado em 100%. O motor pode ganhar rotação sem acionar as rodas. Você decide quando e quanto soltar: não existe liberação automática da embreagem, controle de tração ou controle automático de largada. O motor tem rotação própria, inércia, reação da transmissão, acoplamento parcial e limite de rotação. Soltar sem aceleração suficiente pode apagá-lo. As trocas sequenciais continuam com corte breve de potência e desacoplamento durante a troca.

| Comando | Efeito |
|---|---|
| W / acelerador | Acelerar o motor |
| SHIFT segurado | Embreagem totalmente puxada |
| Soltar SHIFT | Acoplar completamente |
| J / K | Soltar / puxar 10% por comando |
| Controle EMBREAGEM na tela | Dosagem contínua; 100% puxada, 0% acoplada |
| View/Select no gamepad | Segurar a embreagem; aceita valor analógico quando oferecido |
| SHIFT + I | Religar motor com embreagem puxada |

Para largar, mantenha freio e embreagem puxada, ganhe rotação, espere as luzes e solte o freio e a embreagem progressivamente. Em aclive/declive, o carro pode rolar sem freio. A abertura da embreagem também desconecta a frenagem do motor e a energia elétrica aplicada à transmissão.

O reinício por I é uma conveniência do jogo: não reproduz o procedimento de partida externa de uma F1. O protótipo omite anti-stall automático por escolha de pilotagem sem assistência; o regulamento real permite anti-stall. A curva de capacidade da embreagem e a inércia são calibrações. O grid ainda imobiliza os carros enquanto as luzes estão acesas; detecção de falsa largada física permanece pendente.

## Verificação e reprodução

- **49 testes automáticos aprovados**: 29 regressões e 20 testes dos novos sistemas.
- Volta completa nos seis circuitos fictícios sem contato ou saída de pista pelo controlador exclusivo de testes; também corrida de cinco voltas e entrada/serviço/saída dos boxes com comandos explícitos.
- Grid com 20 carros por 35 s: 42 eventos de contato entre adversários, todos os estados finitos.
- Pneus continuam diferentes: 100 km/h até quase zero, médios, seco, aero 5, combustível 30 kg e freio 100%: **58,32 m a 20 °C; 28,76 m a 85 °C; 27,74 m a 100 °C; 48,58 m a 140 °C**.
- Resultados: [dinâmica](dynamics-validation-0.3.json), [carro](car-validation-0.3.json), [navegador](browser-dynamics-validation-0.3.json).
- Executar `npm test`, `npm run audit:car` e `npm run audit:dynamics`. O laboratório `tests/browser-lab.html` envia eventos aos comandos reais do jogo. O ensaio `tests/car-bench.html` executa a mesma física. Não existe controlador de teste embarcado em `index.html`.

## Fontes e limites

[FIA — regulamento técnico 2025, edição de 11/12/2024](https://www.fia.com/sites/default/files/fia_2025_formula_1_technical_regulations_-_issue_01_-_2024-12-11_1.pdf), artigos 9.3 e 10.2: princípio de embreagem puxada/desacoplada, comando pelo piloto, exceção para trocas/anti-stall e suspensão mecânica. O modelo não declara conformidade integral com o regulamento; indicadores didáticos e comandos de teclado são recursos de jogo.

[Formula 1 — glossário técnico](https://www.formula1.com/en/latest/article/f1-glossary-p-t.GBhLQtpeu9b8LrK5VM0F1): suspensão e influência de ar turbulento/vácuo. A forma da esteira, coeficientes, curvas de assoalho e danos são aproximações, sem CFD ou dados proprietários. Referências e telemetria do câmbio permanecem em [CARRO-0.2.md](CARRO-0.2.md).

Ainda faltam massa não suspensa e elasticidade vertical dos pneus com dinâmica própria, geometria/cambagem/convergência calibradas, barras antirrolagem, inércia e escorregamento angular de cada roda, diferencial, quatro temperaturas/pressões, mapas completos do motor e validação com volante/pedais reais. As forças laterais ainda são agregadas por eixo. As colisões são planares e não simulam capotamento, deformação estrutural, detritos ou rodas se tocando com geometria detalhada. A IA compartilha os contatos e suspensão visual, mas continua com controlador longitudinal/lateral simplificado. Todas as pendências seguem em [PLANO-DE-MELHORIAS.md](PLANO-DE-MELHORIAS.md).
