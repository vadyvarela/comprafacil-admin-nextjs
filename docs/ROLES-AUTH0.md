# Cargos no Auth0 — documento superado

O modelo que este documento descrevia — cargos guardados no claim
`https://Kumprafacil.com/roles`, uma Post-Login Action a injectá-los, e a matriz
`MODULE_ACCESS` no Next.js a decidir a partir deles — **já não é o que o código
faz**.

Ver **[AUTHZ.md](./AUTHZ.md)**.

O que mudou, em resumo: o Auth0 continua a autenticar, mas quem é membro de que
loja com que cargo passou a ser uma tabela da API (`memberships`), e é a API que
autoriza cada pedido. O backoffice recebe as permissões resolvidas em `/api/me`.

## O que continua a ser preciso no Auth0

Só a parte de autenticação:

1. **Uma API registada** no Auth0 (Applications → APIs), com um identificador —
   é o `audience`. A API valida os access tokens contra ele
   (`AUTH0_API_AUDIENCE`), e o backoffice pede tokens para ele
   (`AUTH0_AUDIENCE`).
2. **Um claim de email no access token.** O Auth0 não o inclui por omissão; é
   preciso uma Action que o acrescente com namespace
   (`AUTH0_EMAIL_CLAIM`, por omissão `https://Kumprafacil.com/email`). Sem ele a
   API não consegue ligar quem entra a um convite.
3. **Uma aplicação M2M** com `read:roles` e `read:role_members` — mas só para
   correr uma vez o `authz:import-members`, que traz a equipa actual para a base
   de dados. Depois disso deixa de ser usada e pode ser desactivada.

## O que deixou de ser preciso

- A Post-Login Action que injecta `https://Kumprafacil.com/roles`. Pode sair
  **depois** de a equipa estar importada.
- Os cargos criados no Auth0 (Roles). Passam a viver em `memberships`.
- `create:users`, `create:role_members`, `create:user_tickets` na aplicação M2M:
  os convites passaram a ser nossos, com email pelo Resend.
