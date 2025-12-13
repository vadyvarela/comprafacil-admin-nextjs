# Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Payment Gateway Configuration
GTW_URL=https://your-gateway-url.com
GTW_TOKEN=your-gateway-token
CMS_ACCESS_TOKEN=your-access-token
```

**Importante:**
- Essas variáveis são usadas apenas no servidor (API routes)
- Não use o prefixo `NEXT_PUBLIC_` - os tokens ficam seguros no servidor
- O arquivo `.env.local` não deve ser commitado no git

