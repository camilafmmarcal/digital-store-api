Digital Store API
API REST para gerenciamento de usuários, categorias e produtos de uma loja virtual, desenvolvida com Node.js, Express, MySQL e Sequelize.
Tecnologias
- Node.js e Express 5
- MySQL e Sequelize 6
- JWT e bcryptjs
- Swagger (OpenAPI 3.0)
- Jest e Supertest
Funcionalidades
- Cadastro, consulta, atualização e exclusão de usuários
- Login e autenticação com JWT
- CRUD de categorias
- CRUD de produtos
- Associação de produtos a categorias, imagens e opções
- Paginação e filtros básicos de listagem
- Documentação interativa no Swagger
Pré-requisitos
- Node.js e npm
- MySQL em execução
- Banco de dados acessível por usuário com permissão para executar migrations
Instalação e configuração
1. Clone o repositório e entre na pasta do projeto:
   git clone <URL_DO_REPOSITORIO>
   cd geracaotech-backend
2. Instale as dependências:
   npm ci
3. Copie .env.example para .env e configure as variáveis de ambiente:
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=digital_store
   DB_USER=root
   DB_PASSWORD=sua_senha_local
   JWT_SECRET=gere_uma_chave_aleatoria_com_pelo_menos_32_caracteres
   Para gerar uma chave JWT aleatória:
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   Nunca publique o arquivo .env nem credenciais reais.
4. Crie o banco no MySQL:
   CREATE DATABASE IF NOT EXISTS digital_store
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
5. Execute as migrations:
   npm run db:migrate
6. Inicie a API:
   npm run dev
   Para execução sem nodemon: npm start.
Endereços locais
- API: http://localhost:3000/
- Swagger UI: http://localhost:3000/api-docs/
- OpenAPI JSON: http://localhost:3000/api-docs.json
Endpoints
Método	Caminho	Autenticação	Finalidade
POST	/v1/user	Não	Cadastrar usuário
POST	/v1/user/token	Não	Gerar token JWT
GET	/v1/user/:id	Sim	Consultar usuário
PUT	/v1/user/:id	Sim	Atualizar usuário
DELETE	/v1/user/:id	Sim	Excluir usuário
GET	/v1/category/search	Não	Listar categorias
GET	/v1/category/:id	Não	Consultar categoria
POST	/v1/category	Sim	Criar categoria
PUT	/v1/category/:id	Sim	Atualizar categoria
DELETE	/v1/category/:id	Sim	Excluir categoria
GET	/v1/product/search	Não	Listar produtos
GET	/v1/product/:id	Não	Consultar produto
POST	/v1/product	Sim	Criar produto
PUT	/v1/product/:id	Sim	Atualizar produto
DELETE	/v1/product/:id	Sim	Excluir produto


Para rotas protegidas, envie o cabeçalho Authorization: Bearer <TOKEN>. A documentação Swagger apresenta os corpos das requisições e exemplos de uso.
Exemplo de autenticação
POST /v1/user/token
{
  "email": "usuario@example.com",
  "password": "senha_do_usuario"
}
A resposta de sucesso inclui o campo token. Na interface Swagger, clique em Authorize e informe apenas o token.
Testes
npm test
A suíte inicial contém seis testes de leitura e de respostas HTTP, executados com Jest e Supertest. Ela não cobre integralmente as operações de escrita. Antes de executar testes que criem ou excluam dados, configure um banco de testes isolado.
Estrutura do projeto
src/
  app.js
  server.js
  config/
  controllers/
  docs/swagger.yaml
  middleware/
  migrations/
  models/
  routes/
tests/
  api.test.js
Segurança e limitações conhecidas
- Senhas de usuários são armazenadas com hash bcrypt.
- A autenticação usa JWT com expiração.
- Não envie .env, node_modules ou credenciais ao repositório.
- A cobertura automatizada ainda precisa ser ampliada para CRUD, erros e transações.
- O último npm audit --omit=dev identificou vulnerabilidades moderadas em dependências transitivas; sua correção deve preservar a compatibilidade com Sequelize 6.
Banco de dados
As migrations criam as tabelas users, categories, products, product_images, product_options e product_categories. Os relacionamentos incluem imagens e opções de produtos e associação muitos-para-muitos entre produtos e categorias.
Licença
ISC, conforme package.json.