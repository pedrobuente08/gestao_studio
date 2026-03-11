# Microserviço ML Service

O microserviço ML Service é responsável por fornecer funcionalidades relacionadas a machine learning (ML) para a aplicação. Suas principais responsabilidades incluem:

1. **Previsão de Preços**: Utiliza modelos de machine learning treinados para prever o preço de procedimentos baseados em parâmetros como tamanho, complexidade e localização do corpo.

2. **Treinamento de Modelos**: Realiza o treinamento de modelos de machine learning personalizados para usuários, utilizando dados de sessões de tatoo.

3. **Status de Modelos**: Fornece informações sobre o status dos modelos de machine learning associados a usuários, indicando se estão ativos ou não.

4. **Treinamento Semanal**: Executa um trabalho de treinamento semanal para atualizar e melhorar os modelos de machine learning existentes.

## Endpoints

### 1. Previsão de Preços

- **Endpoint**: `POST /ml/predict`
- **Descrição**: Retorna a sugestão de preço via CatBoost para os parâmetros fornecidos.
- **Parâmetros de Entrada**:
  - `size`: Tamanho do tatoo (enumeração de `TattooSize`).
  - `complexity`: Complexidade do tatoo (enumeração de `TattooComplexity`).
  - `bodyLocation`: Localização do corpo onde será realizado o tatoo (enumeração de `BodyLocation`).
- **Resposta**:
  - `predictedPrice`: Preço previsto para o procedimento.
  - `similarProcedures`: Lista de procedimentos similares com seus preços.

### 2. Status de Modelos

- **Endpoint**: `GET /ml/status`
- **Descrição**: Retorna o status do modelo de machine learning associado ao usuário.
- **Parâmetros de Entrada**: Nenhum.
- **Resposta**:
  - Informações sobre o modelo, incluindo se está ativo ou não, e detalhes adicionais.

### 3. Treinamento Manual

- **Endpoint**: `POST /ml/train-manual`
- **Descrição**: Inicia o treinamento manual de um modelo de machine learning para o usuário.
- **Parâmetros de Entrada**: Nenhum.
- **Resposta**:
  - Informações sobre o progresso ou status do treinamento.

## Implementação

O microserviço ML Service é implementado em TypeScript e utiliza as seguintes tecnologias e bibliotecas:

- **NestJS**: Framework para construção de aplicativos Node.js escaláveis.
- **Prisma**: ORM para interação com o banco de dados.
- **HttpService**: Para realizar chamadas HTTP externas.
- **CatBoost**: Biblioteca de machine learning utilizada para treinar e fazer previsões.

## Arquitetura

O microserviço segue uma arquitetura modular, com os principais componentes organizados da seguinte forma:

- **Controllers**: Responsáveis por lidar com as requisições HTTP e chamar os serviços apropriados.
- **Services**: Implementam a lógica de negócios, incluindo o treinamento de modelos, previsão de preços e obtenção de status.
- **DTOs (Data Transfer Objects)**: Definem os tipos de dados utilizados para entrada e saída dos endpoints.

## Dependências

- **@nestjs/common**: Módulos comuns do NestJS.
- **@nestjs/core**: Módulo principal do NestJS.
- **@nestjs/http**: Módulo para realizar chamadas HTTP.
- **@nestjs/prisma**: Módulo para integração com o Prisma.
- **@nestjs/swagger**: Para documentação da API.
- **class-validator**: Para validação de dados.
- **class-transformer**: Para transformação de dados.
- **prisma**: ORM para interação com o banco de dados.
- **axios**: Para realizar chamadas HTTP externas.
- **catboost**: Biblioteca de machine learning.

## Configuração

O microserviço utiliza variáveis de ambiente para configuração, incluindo:

- `ML_SERVICE_URL`: URL base do serviço de machine learning.
- `PRISMA_DATABASE_URL`: URL do banco de dados.
- `CATBOOST_MODEL_PATH`: Caminho para o modelo de machine learning treinado.

## Contribuição

Para contribuir com o microserviço ML Service, siga as etapas abaixo:

1. **Clone o Repositório**: `git clone <URL_DO_REPOSITORIO>`
2. **Instale as Dependências**: `npm install`
3. **Configure as Variáveis de Ambiente**: Crie um arquivo `.env` com as variáveis necessárias.
4. **Inicie o Serviço**: `npm run start`
5. **Realize as Modificações**: Faça as alterações necessárias nos arquivos.
6. **Teste as Alterações**: Verifique se as funcionalidades continuam funcionando corretamente.
7. **Commit e Push**: `git commit -m "Descrição das alterações"` e `git push origin <BRANCH>`

## Licença

Este microserviço está licenciado sob a [MIT License](LICENSE).

---

Este documento fornece uma visão geral do microserviço ML Service, detalhando suas funcionalidades, endpoints, implementação e como contribuir para o projeto.
