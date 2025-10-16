import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import pool from "./db.js"; // conexão com Postgres
import ticketsRoutes from "./routes/tickets.js"; // rotas da API

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Configuração do Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Nexa",
      version: "1.0.0",
      description:
        "Documentação oficial da API Nexa. Esta API permite gerenciar tickets, prioridades e status de forma eficiente.",
      contact: {
        name: "Thiago",
        url: "https://thiagodev.site/",
        email: "thiagoestudante457@gmail.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Usa o pool se quiser testar a conexão
pool
  .connect()
  .then(() => console.log("✅ Conectado ao Postgres"))
  .catch((err) => console.error("❌ Erro ao conectar ao Postgres:", err));

app.use("/api/tickets", ticketsRoutes);

app.listen(4000, () => {
  console.log(
    "🚀 Servidor rodando em http://localhost:4000\n📘 Swagger: http://localhost:4000/api-docs/"
  );
});
