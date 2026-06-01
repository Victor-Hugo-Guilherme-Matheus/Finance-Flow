# 💸 FinanceFlow

Aplicativo web de finanças pessoais com interface **mobile-first**, desenvolvido com React, TypeScript e Firebase.

---

## 📱 Visão Geral

O FinanceFlow é um app de gestão financeira pessoal que permite:

- 📊 Visualizar receitas, despesas e saldo total em tempo real
- 💳 Registrar transações (receitas, despesas e transferências)
- 🎯 Criar e acompanhar metas financeiras
- 🏆 Desbloquear conquistas conforme você avança nas metas
- 💱 Converter moedas em tempo real com a API Frankfurter
- 👤 Gerenciar perfil com foto, idioma e tema escuro/claro
- 🌍 Suporte a múltiplos idiomas (Português e Inglês)

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Descrição |
|---|---|
| React 18 | Biblioteca de interface |
| TypeScript | Tipagem estática |
| Vite | Bundler e servidor de desenvolvimento |
| Tailwind CSS | Estilização |
| Firebase Auth | Autenticação de usuários |
| Firestore | Banco de dados em nuvem |
| Framer Motion | Animações |
| Recharts | Gráficos financeiros |
| Lucide React | Ícones |

---

## 🌐 API Externa — Frankfurter

O app utiliza a [Frankfurter API](https://frankfurter.dev) para conversão de moedas em tempo real.

- ✅ Gratuita e sem necessidade de API Key
- ✅ Cobertura de 201 moedas de 82 bancos centrais
- ✅ Dados atualizados diariamente

### Endpoints utilizados

Não é necessário nenhuma configuração adicional para usar esta API.

---

## 🔥 Configuração do Firebase

O projeto usa o Firebase para autenticação e banco de dados. Para configurar:

### 1. Crie um projeto no Firebase
Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um novo projeto.

### 2. Ative os serviços
- **Authentication** → Email/senha
- **Firestore Database** → Modo de teste → Região: `southamerica-east1`

### 3. Registre o app web
No console do Firebase, clique em **Adicionar app** → ícone Web (`</>`).

## 🚀 Como Executar

```bash
# Instale as dependências
npm install

# Rode em modo de desenvolvimento
npm run dev

# Build de produção
npm run build
```
