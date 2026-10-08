# Largada pelo acelerador — APEX Formula 0.4.1

Revisão de 08/10/2026 para [gustaaxz/apex-formula](https://github.com/gustaaxz/apex-formula). Inclui também os seis mapas e o HUD da revisão 0.4, ainda não publicados anteriormente.

Aguarde as luzes apagarem e acelere com W, seta para cima, RT ou o botão ACEL. Foram retirados SHIFT/J/K/I, View/Select, o controle deslizante e o botão de toque da embreagem. Paradas, repartidas, ré e saída dos boxes usam o mesmo acelerador. O motor não apaga ao parar por falta de acionamento da embreagem.

O acoplamento interno é dosado automaticamente em baixa velocidade e abre quando a rotação cai. Não altera o torque do motor, a aderência dos pneus ou a frenagem para garantir uma largada perfeita: ainda pode haver patinação. As oito marchas permanecem manuais, assim como a direção e o freio. ABS e controle de tração continuam desligados. A embreagem explícita permanece disponível apenas como entrada do modelo para os ensaios físicos anteriores; não existe esse comando no jogo.

## Validação

- **87 testes aprovados, nenhum reprovado**, registrados em [TESTES-0.4.1.txt](TESTES-0.4.1.txt).
- Sete testes novos: acelerador no grid e após as luzes; espera sem avançar sozinho; dosagem parcial; três ciclos de aceleração/parada/repartida; frenagem até parar nas oito marchas; ré; patinação e efeito da pista molhada.
- Os ensaios de volta e boxes agora enviam somente volante, acelerador, freio e trocas manuais. Os seis circuitos completam voltas no seco e na chuva, além da entrada, parada, serviço e saída dos boxes. O controlador de teste não faz parte do jogo.
- [Teste no navegador](browser-launch-0.4.1.json): somente W, 0 km/h no grid, 108,1 km/h após cinco segundos, motor funcionando e primeira marcha mantida. Nenhum controle de embreagem presente no HUD.

## Alterações por arquivo

- `vehicle.js`: acoplamento automático em baixa velocidade e rotação, retenção do carro durante as luzes e limites físicos de cada trecho.
- `simulation.js`: mensagens de largada e boxes orientadas ao acelerador, integradas aos novos mapas e ao relógio de setores.
- `game.js`: remove comandos e estado de embreagem do teclado, toque e gamepad; atualiza ajuda, indicadores e mensagens.
- `index.html` e `style.css`: retiram controle e botão de embreagem, reorganizam os seis botões de toque e preservam a telemetria aerodinâmica.
- `tests/launch.test.cjs`: valida os sete cenários da nova largada.
- `tests/helpers.cjs`: piloto de teste usa as entradas disponíveis ao jogador, sem enviar embreagem.
- `tests/browser-lab.html` e `tests/maps-browser.html`: protocolos de largada apenas pelo acelerador.
- `README.md`, `LEIA-ME.md`, `package.json` e `docs/PLANO-DE-MELHORIAS.md`: versão, instruções, testes e decisão posterior do usuário.
- `docs/TESTES-0.4.1.txt` e `docs/browser-launch-0.4.1.json`: resultados da revisão atual. Relatórios e imagens 0.3/0.4 permanecem históricos.

O inventário completo dos commits e arquivos enviados está em [PUBLICACAO-0.4.1.md](PUBLICACAO-0.4.1.md). As pistas continuam originais e fictícias; o modelo físico continua aproximado.
