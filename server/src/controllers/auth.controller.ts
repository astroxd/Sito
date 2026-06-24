import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { hashSync, compareSync } from "bcrypt";

const JWTSECRET = process.env.JWT_SECRET || "RSAPRIVATEKEY";

export const register = (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Missing params" });
  }
  const avatar = req.file?.filename;

  try {
    if (User.findByEmail(email)) {
      return res
        .status(409)
        .json({ message: "Esiste già un utente con questa mail" });
    }

    if (User.findByUsername(username)) {
      return res.status(409).json({
        message: "Esiste già un utente con questo username, scegline un altro",
      });
    }

    const userId = User.createUser(
      email,
      hashValue(password),
      username,
      avatar,
    );

    const { accessToken, refreshToken } = generateJwt(userId);

    User.updateRefreshToken(userId, refreshToken);

    const user = User.findByEmail(email);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user,
      accessToken: accessToken,
      message: "Utente registrato con successo",
    });
  } catch (error) {
    console.log(error);
  }
  return res.status(401).json({ message: "Errore generico" });
};

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Missing params" });
  }

  try {
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userPassword = User.getPasswordFromEmail(email);

    const passwordMatch = compareSync(password, userPassword!);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateJwt(user.id);
    User.updateRefreshToken(user.id, refreshToken);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user,
      accessToken: accessToken,
    });
  } catch (error) {
    console.log(error);
  }
  return res.status(401).json({ message: "Invalid credentials" });
};

export const refreshToken = (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;
  try {
    const user = User.findByRefreshToken(refreshToken);

    if (!user) return res.sendStatus(403);

    const decodedToken = jwt.verify(refreshToken, JWTSECRET) as {
      userId: number;
    };

    if (decodedToken.userId !== user.id) {
      return res.sendStatus(403);
    }

    const { accessToken } = generateJwt(decodedToken.userId);
    return res.json({ accessToken });
  } catch (error) {
    console.log(error);
  }
  res.sendStatus(403);
};

export const session = (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;

    if (!cookies.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;

    const user = User.findByRefreshToken(refreshToken);

    if (!user) return res.sendStatus(401);

    return res.json({ user });
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

export const logout = (req: Request, res: Response) => {
  const userId = res.locals.userId;

  try {
    User.revokeRefreshToken(userId);

    res.clearCookie("jwt");

    return res.status(200).json({ message: "Logout succeded" });
  } catch (error) {
    return res.status(500).json({ message: "Internal error during logout" });
  }
};

const hashValue = (value: string) => {
  const saltRounds = 10;
  return hashSync(value, saltRounds);
};

const generateJwt = (userId: number | bigint) => {
  const accessToken = jwt.sign(
    {
      userId: userId,
    },
    JWTSECRET,
    { expiresIn: "5m" },
  );

  const refreshToken = jwt.sign(
    {
      userId: userId,
    },
    JWTSECRET,
    { expiresIn: "30d" },
  );

  return { accessToken, refreshToken };
};
