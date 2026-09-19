# PUFF RUSH V3.81 — RANKING GLOBAL

Base: V3.75 FINAL TEST. Evolução exclusiva da camada de ranking da V3.80.

## REGRA TRAVADA
Nenhuma alteração intencional em jogabilidade, física, fases, velocidade, obstáculos, moedas, som, progressão FREE/VIP, Puff ou capa. A V3.75 continua sendo a base-mãe.

## O que mudou
- Ranking deixou de usar a lista local do navegador.
- Cada aparelho recebe um player_id próprio.
- Apelido permanece simples (3–15 caracteres).
- TOP 20 consulta um banco Supabase compartilhado.
- Jogador vê sua posição mesmo fora do TOP 20.
- Se o banco ainda não estiver configurado, a tela informa que o ranking global aguarda conexão — não inventa jogadores locais.

## Para ativar globalmente
1. Crie/use um projeto Supabase EXCLUSIVO do Puff Rush.
2. Execute `supabase-ranking.sql` no SQL Editor.
3. Em `ranking-config.js`, cole apenas Project URL e ANON/PUBLISHABLE key.
4. Nunca coloque `service_role` no jogo.
5. Publique esta pasta no mesmo projeto/site quando o teste estiver aprovado.

## VIP futuro
A Área VIP deve ser construída em módulo separado e carregada somente quando o jogador entrar nela (lazy loading). Assim mapas, imagens, sons e fases VIP não pesam no carregamento inicial do FREE. O núcleo V3.75 continua congelado; a VIP entra como expansão isolada.

## Segurança
Esta versão tem validação básica de formato e mantém somente o maior score. Antes de prêmio real, adicionar validação de partidas no servidor/anti-cheat; código no navegador pode ser adulterado.
