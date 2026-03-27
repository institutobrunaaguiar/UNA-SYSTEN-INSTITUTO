# Admin — Gestão de Usuários — Design Spec

**Data:** 2026-03-27
**Status:** Aprovado

## Contexto

A aplicação não tem sistema de autenticação. O objetivo é adicionar gestão de usuários restrita à área `/settings`, usando Supabase Auth (email + senha). O restante da aplicação permanece sem login.

## Decisoes

| Decisao | Escolha |
|---|---|
| Escopo do login | Apenas /settings exige autenticação |
| Backend de auth | Supabase Auth (email + password) |
| Perfis e roles | Tabela `user_profiles` no schema public |
| Criação de usuários | Route Handler com service role key (server-side) |
| Níveis de acesso | 3: admin, operador, visualizador |

## Níveis de Acesso

| Nível | Permissões |
|---|---|
| admin | Acesso total. Gerencia usuários, vê e edita tudo |
| operador | Cria/edita propostas, calendário, pacientes. Sem acesso a /settings |
| visualizador | Somente leitura em todas as seções. Sem criar/editar |

> Nota: as permissões por nível são registradas no perfil mas **não bloqueiam rotas** nesta versão (exceto /settings que exige qualquer sessão válida). A granularidade de permissão pode ser expandida em versão futura.

## Banco de Dados

### Tabela: user_profiles

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | Igual ao `auth.users.id` |
| nome | text | Nome de exibição |
| role | text | 'admin' \| 'operador' \| 'visualizador' |
| ativo | boolean | Default true |
| created_at | timestamptz | Default now() |

SQL de criação:
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','operador','visualizador')),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON user_profiles USING (true);
```

## Arquitetura de Componentes

```
app/settings/
  page.tsx                     # Verifica sessão, redireciona para /login se ausente
  login/
    page.tsx                   # Página pública de login
  layout.tsx                   # Middleware de sessão para /settings/*

components/admin/
  admin-content.tsx            # Orquestra abas: Usuários / Cadastrar
  admin-lista-usuarios.tsx     # Tabela com todos os usuários
  admin-cadastrar-usuario.tsx  # Formulário de criação
  admin-editar-usuario.tsx     # Sheet de edição (nome, role, ativo)

app/api/admin/
  create-user/route.ts         # POST — cria usuário via supabase admin SDK
  update-user/route.ts         # PATCH — atualiza role/ativo via supabase admin SDK
  delete-user/route.ts         # DELETE — desativa usuário (ativo = false)
```

## Fluxo de Login

1. Usuário acessa `/settings`
2. `settings/layout.tsx` checa `supabase.auth.getSession()` no servidor
3. Sem sessão → redirect para `/settings/login`
4. Login page chama `supabase.auth.signInWithPassword({ email, password })`
5. Sucesso → redirect para `/settings`
6. Botão "Sair" chama `supabase.auth.signOut()` → redirect para `/settings/login`

## Tela: Lista de Usuários (admin-lista-usuarios.tsx)

Tabela com colunas: Nome | E-mail | Nível | Status | Ações (···)

Ações por linha (menu dropdown):
- **Editar** — abre Sheet com nome, role e toggle ativo/inativo
- **Desativar / Reativar** — toggle direto sem abrir sheet
- **Remover** — confirma via dialog antes de deletar

Badges de nível:
- `admin` → roxo (`bg-indigo-900 text-indigo-300`)
- `operador` → azul (`bg-blue-900 text-blue-300`)
- `visualizador` → cinza (`bg-stone-800 text-stone-400`)

## Tela: Cadastrar Usuário (admin-cadastrar-usuario.tsx)

Campos:
- Nome completo (text, obrigatório)
- E-mail (email, obrigatório, único)
- Senha inicial (password, min 8 caracteres)
- Nível de acesso (select: Admin / Operador / Visualizador)

Ao submeter:
1. POST `/api/admin/create-user` com `{ nome, email, password, role }`
2. Route Handler usa `supabaseAdmin.auth.admin.createUser()` + INSERT em `user_profiles`
3. Sucesso → toast "Usuário criado" + limpa formulário
4. Erro (email duplicado etc) → exibe mensagem inline

## Route Handlers

### POST /api/admin/create-user
```typescript
// Usa SUPABASE_SERVICE_ROLE_KEY
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
await supabaseAdmin.from("user_profiles").insert({
  id: data.user.id,
  nome,
  role,
})
```

### PATCH /api/admin/update-user
```typescript
await supabaseAdmin.from("user_profiles")
  .update({ nome, role, ativo })
  .eq("id", userId)
```

### DELETE /api/admin/delete-user
```typescript
// Soft delete — só desativa
await supabaseAdmin.from("user_profiles")
  .update({ ativo: false })
  .eq("id", userId)
```

## Primeiro Usuário Admin

Deve ser criado manualmente no Supabase Dashboard (Authentication → Users → Add user) antes de usar o sistema. Depois, inserir na tabela `user_profiles`:

```sql
INSERT INTO user_profiles (id, nome, role)
VALUES ('<uuid-do-usuario>', 'Admin', 'admin');
```
