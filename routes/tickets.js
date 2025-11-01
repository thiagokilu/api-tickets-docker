import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Endpoints para gerenciar tickets (PostgreSQL)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       required:
 *         - title
 *         - priority
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do ticket
 *           example: 1
 *         title:
 *           type: string
 *           description: Título do ticket
 *           example: Erro ao acessar o painel
 *         priority:
 *           type: string
 *           description: Prioridade do ticket
 *           example: Alta
 *         status:
 *           type: string
 *           description: Status atual do ticket
 *           example: Recebido
 *         user_name:
 *           type: string
 *           description: Nome do usuário que criou o ticket
 *           example: Thiago
 *         data:
 *           type: string
 *           description: Data de criação
 *           example: "16/10/2025 14:55:00"
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Lista todos os tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Lista de tickets retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 *       500:
 *         description: Erro ao buscar tickets
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tickets ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Busca um ticket pelo ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do ticket
 *     responses:
 *       200:
 *         description: Ticket encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket não encontrado
 *       500:
 *         description: Erro ao buscar ticket
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM tickets WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar ticket" });
  }
});

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Cria um novo ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Erro de login
 *               priority:
 *                 type: string
 *                 example: Alta
 *               user_name:
 *                 type: string
 *                 example: Thiago
 *     responses:
 *       201:
 *         description: Ticket criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Campos obrigatórios ausentes
 *       500:
 *         description: Erro ao criar ticket
 */
router.post("/", async (req, res) => {
  try {
    const { data, title, priority, status, feedbacks } = req.body;

    if (!title || !priority) {
      return res
        .status(400)
        .json({ error: "Título e prioridade são obrigatórios" });
    }

    const result = await pool.query(
      `INSERT INTO tickets (data, title, priority, status, feedbacks)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING *`,
      [
        data || new Date(),
        title,
        priority,
        status || "Recebido",
        JSON.stringify(feedbacks || []),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erro ao criar ticket:", error);
    res.status(500).json({ error: "Erro ao criar ticket" });
  }
});

/**
 * @swagger
 * /tickets/{id}:
 *   patch:
 *     summary: Atualiza um ticket existente
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket atualizado com sucesso
 *       404:
 *         description: Ticket não encontrado
 *       500:
 *         description: Erro ao atualizar ticket
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, priority, status } = req.body;

    const result = await pool.query(
      `UPDATE tickets
       SET title = COALESCE($1, title),
           priority = COALESCE($2, priority),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [title, priority, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar ticket" });
  }
});

/**
 * @swagger
 * /tickets/{id}:
 *   delete:
 *     summary: Deleta um ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do ticket
 *     responses:
 *       200:
 *         description: Ticket deletado com sucesso
 *       404:
 *         description: Ticket não encontrado
 *       500:
 *         description: Erro ao deletar ticket
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM tickets WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    res.json({
      message: "Ticket deletado com sucesso",
      ticket: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar ticket" });
  }
});

export default router;
