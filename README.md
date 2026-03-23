# Calculadora de Precificação 3D

Aplicação web simples para rodar localmente no navegador e ajudar na precificação de produtos impressos em 3D.

## Funcionalidades

- Cadastro de produto com:
  - Nome;
  - Preço do kg do filamento;
  - Peso em gramas;
  - Duração de impressão (horas e minutos);
  - Imagem do produto.
- Cálculo automático de:
  - **Custo**: `(preço do kg / 1000) * peso em gramas`;
  - **Preço de venda sugerido**: `custo * 5`.
- Tabela única com todos os produtos cadastrados.
- Persistência local dos dados no navegador (`localStorage`).
- Exportação da tabela em dois formatos:
  - CSV (dados puros, com imagem em Base64 na coluna `imagem_base64`);
  - PDF com imagem visível na tabela.

## Como rodar localmente

Basta abrir o arquivo `index.html` no navegador.

Se preferir usar servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse: `http://localhost:8000`.
