import pool from "./pool.js";
import bcrypt from "bcrypt";
import { generateJwtToken, verifyJwtToken } from "./helpers.js";

class AuthController {
  async signIn(req, res) {
    try {
      const { username, password } = req.body;
      const user = await pool.query(
        `SELECT * FROM Users WHERE username = $1 LIMIT 1`,
        [username]
      );

      if (user.rows.length !== 1) {
        return res.status(400).json({
          status: false,
          message: "Пользователя с таким ником не существует",
        });
      }

      const validPassword = bcrypt.compareSync(password, user.rows[0].password);
      if (!validPassword) {
        return res.status(400).json({
          status: false,
          message: "Пароли не совпадают",
        });
      }

      const token = generateJwtToken(username);
      return res.status(200).json({ status: true, token });
    } catch (error) {
      console.error("signIn error:", error);
      return res.status(500).json({ status: false, message: "Ошибка сервера" });
    }
  }

  async signUp(req, res) {
    try {
      const { username, password } = req.body;
      const user = await pool.query(
        `SELECT * FROM Users WHERE username = $1 LIMIT 1`,
        [username]
      );

      if (user.rows.length !== 0) {
        return res.status(400).json({
          status: false,
          message: "Пользователь с таким ником существует",
        });
      } else if (username.length < 4) {
        return res.status(400).json({
          status: false,
          message: "Длина имени должна быть >= 4 символов",
        });
      } else if (password.length < 8) {
        return res.status(400).json({
          status: false,
          message: "Длина пароля должна быть >= 8 символов",
        });
      }

      const token = generateJwtToken(username);
      const hashPassword = bcrypt.hashSync(password, 5);
      await pool.query(
        `INSERT INTO Users (username, password) VALUES ($1, $2) RETURNING *`,
        [username, hashPassword]
      );
      return res.status(200).json({ status: true, token });
    } catch (error) {
      console.error("signUp error:", error);
      return res.status(500).json({ status: false, message: "Ошибка сервера" });
    }
  }

  async verifyToken(req, res) {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader) return res.sendStatus(400);

      const token = authHeader.split(" ")[1];
      if (!token) return res.sendStatus(400);

      const isVerified = verifyJwtToken(token);
      if (isVerified) return res.sendStatus(200);
      return res.sendStatus(400);
    } catch (error) {
      console.error("verifyToken error:", error);
      return res.sendStatus(500);
    }
  }
}

export default new AuthController();
