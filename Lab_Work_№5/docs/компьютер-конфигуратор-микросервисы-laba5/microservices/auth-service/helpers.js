import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const generateJwtToken = (username) => {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyJwtToken = (token) => {
  return jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return false;
    else return true;
  });
};
