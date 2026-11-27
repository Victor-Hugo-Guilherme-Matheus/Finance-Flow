# 🗄️ Banco de dados (Cloud Firestore)

## Como os dados estão organizados

Tudo o que um usuário cria fica **dentro do documento dele**. Para ver o que alguém fez, basta abrir no console do Firebase `users` → *uid do usuário*.

```
users/
└── {uid}                         ← perfil: nome, e-mail, telefone, iniciais
    ├── transactions/
    │   └── {id}                  ← uma receita, despesa ou transferência
    ├── goals/
    │   └── {id}                  ← uma meta financeira
    ├── cards/
    │   └── {id}                  ← um cartão (só os 4 últimos dígitos)
    └── settings/
        ├── preferences           ← notificações e segurança
        └── profilePhoto          ← foto de perfil (separada do perfil)
```

O `{uid}` é o mesmo id do usuário no **Authentication**, então dá para cruzar as duas telas do console.

### Antes × depois

| Antes | Depois |
|---|---|
| `transactions`, `goals`, `cards`, `preferences` soltas na raiz, misturando todos os usuários | Cada usuário tem as próprias subcoleções |
| Para saber de quem era uma transação era preciso ler o campo `userId` e procurar o usuário | O caminho já diz o dono: `users/{uid}/transactions/...` |
| Foto em base64 dentro do perfil (o documento ficava ilegível) | Foto em `settings/profilePhoto` |
| `createdAt` era Timestamp e `updatedAt` era texto | Os dois são Timestamp do servidor |
| Cartões num array dentro de um único documento | Um documento por cartão |
| Regras de "modo de teste" (abertas e depois vencidas) | Regras que validam dono, campos e tipos |

## Campos de cada documento

**`users/{uid}`**

| Campo | Tipo | Exemplo |
|---|---|---|
| `fullName` | string | `"Victor Hugo"` |
| `email` | string | `"victor@exemplo.com"` |
| `phone` | string | `"(21) 99999-9999"` |
| `avatarInitials` | string | `"VH"` |
| `createdAt` / `updatedAt` | timestamp | horário do servidor |

**`users/{uid}/transactions/{id}`**

| Campo | Tipo | Observação |
|---|---|---|
| `name` | string | obrigatório |
| `amount` | number | sempre positivo; o sinal vem do `type` |
| `type` | string | `income`, `expense` ou `transfer` |
| `category` | string | `food`, `transport`, `bills`… |
| `date` | string | `AAAA-MM-DD`, data da movimentação |
| `description`, `paymentMethod`, `notes` | string | opcionais |
| `history` | array | `{ date, action }`: created, updated… |
| `createdAt` / `updatedAt` | timestamp | horário do servidor |

**`users/{uid}/goals/{id}`**: `name`, `targetAmount`, `currentAmount`, `deadline` (`AAAA-MM-DD`), `category`, `icon`, `color`, `status` (`active` / `completed` / `closed`), `history`, `createdAt`, `updatedAt`.

**`users/{uid}/cards/{id}`**: `name`, `lastDigits` (4 dígitos), `expiry` (`MM/AA`), `brand`, `holderName`, `type` (`credit` / `debit`), `isPrimary`, `isHidden`, `updatedAt`. O número completo e o CVV **nunca** são salvos, e as regras recusam qualquer campo extra.

## Segurança

As regras ficam em [`firestore.rules`](../firestore.rules):

- cada usuário só lê e grava dentro de `users/{seu uid}`;
- cada tipo de documento só aceita os campos listados acima, com o tipo certo;
- `createdAt` e `updatedAt` precisam ser o horário do servidor (ninguém consegue forjar datas);
- o e-mail do perfil não pode ser trocado pelo app (é o login da conta);
- qualquer outro caminho, inclusive as coleções antigas da raiz, é bloqueado.

Não é preciso criar índices compostos: as consultas ordenam só por um campo dentro da subcoleção do usuário.

## Migração dos dados antigos

O script [`scripts/migrar-banco.mjs`](../scripts/migrar-banco.mjs) move os dados do formato antigo para o novo, mantendo os mesmos ids.

```bash
# 1. Baixe uma chave da conta de serviço:
#    Console → ⚙️ Configurações do projeto → Contas de serviço → Gerar nova chave privada
#    (NÃO envie esse arquivo para o GitHub; o .gitignore já ignora *-firebase-adminsdk-*.json)
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/Downloads/financeflow-2f2f5-firebase-adminsdk-xxxx.json"
#    No Windows (PowerShell): $env:GOOGLE_APPLICATION_CREDENTIALS="C:\caminho\da\chave.json"

# 2. Simulação: mostra uma tabela por usuário e não grava nada
npm run db:migrar

# 3. Copia para o formato novo (as coleções antigas continuam lá)
npm run db:migrar -- --apply

# 4. Depois de conferir no app, apaga as coleções antigas
npm run db:migrar -- --apply --delete-old
```

Documentos antigos cujo `userId` não pertence a nenhum usuário são listados e mantidos onde estão, para você decidir o que fazer com eles.

Os testes da migração rodam com `npm test`.
