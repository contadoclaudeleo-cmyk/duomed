# Passo a passo: proteção das questões, das vidas, do Plus e do ranking

Nesta versão, as questões, a correção, as vidas, o Plus e o XP do ranking moram no **servidor (Supabase)**.
O site só recebe a questão **sem a resposta**, e quem corrige e tira a vida é o servidor.
Mexer no celular ou no navegador não dá vidas, não dá Plus e não mostra respostas.

> **Importante:** faça os passos 1 a 3 **antes** de publicar o site novo.
> Sem eles, o site novo não consegue buscar as questões.

Onde colar os arquivos: Supabase > seu projeto > **SQL Editor** > **New query**.
Abra o arquivo no Bloco de Notas, copie tudo (Ctrl+A, Ctrl+C), cole e clique em **Run**.

## 1. Criar as tabelas e as regras

Rode `supabase/estudo.sql`.

## 2. Mandar as questões para o servidor

Rode, **na ordem**, os arquivos da pasta `supabase/importar/`:
`questoes-1.sql`, `questoes-2.sql`, ... até o último.

- Rode cada um numa query nova (ou apague a anterior antes de colar).
- No último aparece `questoes_no_servidor`, que deve dar **5001**.
- Essa pasta não vai para o GitHub (as questões não ficam públicas). Ela é criada de novo
  sempre que você roda `npm run estrutura` (ou `npm run dev` / `npm run build`).
- Mudou alguma questão? Rode `npm run estrutura` e depois todos os arquivos de novo.
  Pode repetir sem problema.

## 3. Trazer o que cada pessoa já tinha feito (só uma vez)

Rode `supabase/estudo-migracao.sql`. Ele copia para o servidor as vidas de cada pessoa,
as questões que ela já respondeu (para a revisão e o gabarito continuarem funcionando)
e o XP desta semana (para o ranking não zerar no meio da semana).

## 4. Conferir a segurança das tabelas

1. Rode `supabase/progresso.sql` (cada pessoa só lê e altera o próprio progresso).
2. Rode `supabase/auditoria.sql` e mande o resultado para o Claude conferir.

## 5. Proteger o login (senhas)

No Supabase, menu **Authentication**:

1. **Rate Limits**: em "sign ups and sign ins", coloque **10** por 5 minutos (por IP).
   Assim ninguém consegue testar milhares de senhas.
2. **Sign In / Providers > Email**: senha mínima de **8** caracteres. Em "Password
   requirements", escolha letras e números.
3. **CAPTCHA** (recomendado, grátis): é o "confirme que você não é um robô".
   - Crie uma conta grátis em cloudflare.com, abra **Turnstile** e adicione um site com os
     domínios `contadoclaudeleo-cmyk.github.io` e `localhost`.
   - O Cloudflare mostra duas chaves:
     - **Secret Key** (secreta): cole **só** no Supabase, em Authentication >
       **Attack Protection** > Enable CAPTCHA protection > provedor Turnstile.
       Não mande para ninguém, nem para o Claude.
     - **Site Key** (pública): no GitHub, abra o repositório > Settings >
       Secrets and variables > Actions > aba **Variables** > New repository variable,
       com o nome `TURNSTILE_SITEKEY` e a Site Key como valor.
   - Ligue as duas coisas juntas: com o CAPTCHA ligado no Supabase e sem a Site Key no
     site, ninguém consegue entrar com e-mail e senha.

O app também trava o login por **15 minutos depois de 5 senhas erradas** no mesmo e-mail.
Essa trava fica no aparelho. Contra quem sabe programar, quem segura de verdade são o
limite por IP e o CAPTCHA do passo 5. Travar a conta no servidor depois de 5 erros só
existe nos planos pagos do Supabase (Team/Enterprise).

## 6. Publicar

Com tudo acima feito, diga ao Claude **"pode publicar"**.
