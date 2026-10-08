# Mapas e HUD — APEX Formula 0.4.0

Revisão de 08/10/2026. Os seis mapas são **circuitos fictícios**, com traçados próprios. País, tema ou nome semelhante não indica que o jogo reproduza Interlagos, Marina Bay, Monza, Barcelona, Yas Marina ou Silverstone.

## Identificação dos circuitos

| ID | Circuito | Extensão | Curvas identificadas | Menor raio aproximado | Maior inclinação longitudinal amostrada |
|---|---|---|---|---|---|
| APX-01 | Costa Verde | 6.86 km | 14 | 53.4 m | 2.44% |
| APX-02 | Marina Neon | 7.44 km | 15 | 50.9 m | 0.00% |
| APX-03 | Alta Velocità | 6.43 km | 13 | 36.2 m | 0.00% |
| APX-04 | Sierra Blanca | 7.10 km | 13 | 49.3 m | 7.35% |
| APX-05 | Dunas de Yas | 7.20 km | 14 | 51.5 m | 0.00% |
| APX-06 | Silver Coast | 7.26 km | 14 | 31.7 m | 0.00% |

As curvas são numeradas por mudanças efetivas de curvatura, em vez de contar os pontos usados no desenho. O número inclui cada lobo de uma sequência de esses. Os três setores são divisões iguais da distância do circuito original. Não são setores de pistas oficiais.

| Circuito | Identidade e desafio |
|---|---|
| Costa Verde | Floresta tropical, relevo suave e Esses da Mata; equilibrar aceleração com mudanças de direção. |
| Marina Neon | Skyline, janelas iluminadas e complexo da marina; Chicane da Marina exige precisão nas curvas lentas. |
| Alta Velocità | Bosque, pavilhão e retas longas; frear antes dos Esses do Bosque. |
| Sierra Blanca | Montanhas, vila e torre; Curva do Mirante e transições graduais de relevo. |
| Dunas de Yas | Areia, dunas, palmeiras e arquitetura urbana; Gancho das Dunas e frenagens técnicas. |
| Silver Coast | Árvores, água e farol; Esses do Farol e ritmo entre curvas rápidas e lentas. |

## Mudanças para circular melhor

- Geometria fechada com tangentes normalizadas e curvas sem laços; a curva final foi redesenhada para entrar progressivamente na reta.
- Reta comum de largada e boxes plana, com entrada à direita, marca de serviço e saída alinhadas. O jogador continua controlando volante, freio, marchas e embreagem.
- Asfalto de 14,5 m, linhas de limite, zebras concentradas nas curvas e áreas de escape maiores no lado externo. Proteções visuais usam os mesmos limites físicos dos carros.
- Árvores, edifícios, arquibancadas e marcos passam por verificação de distância contra toda a pista e o corredor dos boxes. Isso evita decoração invadindo outro trecho próximo.
- Contatos da IA agora decompõem a velocidade na tangente da pista, impedindo acúmulo artificial do componente residual após a rotação. Jogador e adversários respeitam as mesmas proteções, inclusive após a separação de uma colisão. A IA ainda usa condução simplificada.
- Inclinação abrupta junto à reta de Sierra Blanca suavizada. Altura da superfície usada pela suspensão acompanha a pista renderizada.

## Cenários e instrumentos

Placas de 150/100/50 m antecedem as curvas identificadas; placas T1, T2 etc. marcam seus ápices. Postos de fiscais, bandeiras, arquibancadas com público, marcos de cada tema e um painel de posições ao vivo complementam o paddock. O público foi agrupado em instâncias para reduzir o custo de desenhar centenas de objetos separados.

O HUD mostra a próxima curva, sentido, categoria e distância até o ápice. São referências visuais: não esterçam, freiam nem limitam a velocidade do jogador. Também mostra temperaturas dianteira/traseira, integridade das duas asas, estado do limitador, acelerador/freio recebidos pelos controles e faixa de rotação.

O minimapa colore S1/S2/S3, mostra a passagem dos boxes e desenha os carros em suas coordenadas reais. O radar usa posição e orientação do jogador, num raio de 40 m: carros próximos ficam em amarelo ou vermelho. Ele não usa apenas a diferença de distância de volta, evitando apontar carros numa outra parte do circuito como se estivessem ao lado.

Os tempos de setores e chegada interpolam os cruzamentos dentro do passo de simulação. O delta compara o tempo atual com a melhor volta válida da sessão **na mesma distância**. Antes da primeira referência, aparece “sem volta de referência”. Setores concluídos mostram o tempo atual; setores ainda não concluídos podem mostrar o tempo da volta anterior, em cinza.

Sair completamente da pista ou reposicionar invalida o recorde dessa volta. Ela continua sendo registrada como volta de sessão. Os recordes da versão 0.4 usam uma chave separada no navegador, para não comparar os traçados novos com os anteriores. Checkpoints obrigatórios contra atalhos e regras completas de classificação continuam pendentes.

O HUD compacto preserva embreagem e controles de toque em telas estreitas. Na largada em retrato, os painéis de tempo e mapa aparecem depois das luzes, deixando o comando de largada legível.

## Verificação

- **80 testes aprovados**, incluindo as regressões do carro, cronometragem, limites compartilhados, geometria, seis grids de vinte carros, voltas no seco/chuva e seis paradas completas. Os novos testes de grid cobrem os primeiros 45 segundos e as curvas iniciais de cada mapa; não representam uma corrida completa de vinte carros. Saída: [TESTES-0.4.txt](TESTES-0.4.txt).
- Em cada mapa, um controlador exclusivo dos testes completou uma volta no seco com medium e teto solicitado de 52 m/s, e outra na chuva intensa com wet e teto de 35 m/s. Não houve contato, penalidade ou saída de pista nessas doze voltas. O controlador não existe no jogo jogável.
- As seis entradas, paradas manuais, trocas e saídas dos boxes terminaram sem contato ou penalidade. O teste usa comandos explícitos de pedais e volante a 120 Hz, com a física subdividida a 240 Hz.
- A separação mínima amostrada entre trechos não locais ficou acima de 98 m; nenhum cruzamento foi encontrado. O teste exclui vizinhos de menos de 125 m pela distância ao longo da pista e verifica segmentos a aproximadamente 12 m. Não substitui levantamento geográfico.
- Inspeção no navegador dos seis cenários e respectivos HUDs; nenhuma exceção de execução. A biblioteca Three.js incluída mantém seu aviso antigo de versão do formato de script. Os FPS observados no laboratório variaram com reconstruções dos mapas e não representam um benchmark universal.
- Menu e HUD conferidos a 320×720, 390×844 e 896×414; controles dentro da tela, sem rolagem horizontal. O menu estreito tem rolagem vertical para acessar todo o conteúdo.

Medições: [maps-validation-0.4.json](maps-validation-0.4.json), [browser-maps-validation-0.4.json](browser-maps-validation-0.4.json), [browser-hud-validation-0.4.json](browser-hud-validation-0.4.json). Relatórios históricos 0.1/0.2/0.3 foram preservados. As auditorias atuais escrevem novos relatórios 0.4.

## Arquivos alterados

| Arquivo | Finalidade |
|---|---|
| tracks.js | Catálogo, traçados, curvas, setores, alturas, limites e afastamento da decoração. |
| timing.js | Tempos de volta/setor, referência de delta e validade para recordes. |
| simulation.js | Integra catálogo e relógio; aplica proteções à IA e invalida recordes por saída/reposicionamento. |
| chassis.js | Corrige decomposição de velocidade dos contatos da IA e limita separações nas proteções compartilhadas. |
| vehicle.js | Consulta os limites de cada trecho, incluindo escapes e boxes. |
| game.js | Cenários, público agrupado, placas, painel ao vivo, minimapa, radar e atualização do HUD. |
| index.html / style.css | Novos instrumentos, identificação dos mapas, carregamento dos módulos e adaptação de layout. |
| tests/track-metrics.cjs, tracks.test.cjs, maps-audit.cjs | Métricas, voltas, boxes, grids e auditoria dos seis mapas. |
| tests/timing.test.cjs | Cruzamentos interpolados, delta, invalidação e sentido inverso. |
| tests/maps-browser.html | Inspeção visual e comandos pelos listeners reais; fixtures exclusivos do laboratório. |
| tests/car-bench.html / simulation.test.cjs | Carregamento dos módulos e faixa de extensão/duração adequada aos novos circuitos. |
| tests/car-audit.cjs / dynamics-audit.cjs | Preservam os relatórios 0.3 e passam a gravar a validação atual em arquivos 0.4. |
| package.json / README.md / PLANO-DE-MELHORIAS.md | Versão, comandos, instruções e registro do trabalho concluído e das pendências. |

## Prévias

[HUD atual](hud-0.4.png) · [Costa Verde](mapas-0.4/APX-01.png) · [Marina Neon](mapas-0.4/APX-02.png) · [Alta Velocità](mapas-0.4/APX-03.png) · [Sierra Blanca](mapas-0.4/APX-04.png) · [Dunas de Yas](mapas-0.4/APX-05.png) · [Silver Coast](mapas-0.4/APX-06.png). As vistas das curvas foram capturadas no laboratório de inspeção.

## Pendências preservadas

As pistas oficiais ainda exigem fontes geográficas, ano de referência e validação de largura, elevação, curvas e boxes. A IA não usa a mesma física completa do jogador. Não há validação humana com volante/pedais, regras completas de corrida ou acabamento fotorrealista. Essas melhorias permanecem registradas no [plano de melhorias](PLANO-DE-MELHORIAS.md).
