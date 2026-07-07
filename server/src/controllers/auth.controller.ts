import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { hashSync, compareSync } from "bcrypt";
import { existsSync, unlinkSync } from "node:fs";

const JWTSECRET = process.env.JWT_SECRET || "RSAPRIVATEKEY";

export const register = (req: Request, res: Response) => {
  /* #swagger.tags = ['Authentication']
     #swagger.description = 'Register a new user. Supports optional avatar upload using multipart/form-data.'
     #swagger.consumes = ['multipart/form-data']
     #swagger.parameters['avatar'] = {
        in: 'formData',
        type: 'file',
        required: false,
        description: 'Optional profile picture file'
     }
     #swagger.parameters['email'] = { in: 'formData', required: true, type: 'string', example: 'user@example.com' }
     #swagger.parameters['username'] = { in: 'formData', required: true, type: 'string', example: 'john_doe' }
     #swagger.parameters['password'] = { in: 'formData', required: true, type: 'string', example: 'password123' }
     
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/AuthResponse' } 
     }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[409] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[401] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Missing params" });
  }
  const avatar = req.file?.filename;

  try {
    if (User.findByEmail(email)) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists" });
    }

    if (User.findByUsername(username)) {
      return res.status(409).json({
        message:
          "A user with this username already exists, please choose another one",
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
      message: "User registered successfully",
    });
  } catch (error) {
    console.log(error);
  }
  return res.status(401).json({ message: "Generic error" });
};

export const login = (req: Request, res: Response) => {
  /* #swagger.tags = ['Authentication']
     #swagger.description = 'Authenticate user, set refresh token in httpOnly cookie and return access token.'
     #swagger.parameters['body'] = {
        in: 'body',
        name: 'LoginBody',
        description: 'User login credentials',
        required: true,
        schema: { $ref: '#/definitions/LoginBody' }
     }
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/AuthResponse' } 
     }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[401] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
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
      message: "Login succeded",
    });
  } catch (error) {
    console.log(error);
  }
  return res.status(401).json({ message: "Invalid credentials" });
};

export const refreshToken = (req: Request, res: Response) => {
  /* #swagger.tags = ['Authentication']
     #swagger.description = 'Renew access token using the refresh token provided via httpOnly cookie.'
     #swagger.responses[200] = { 
        schema: { accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." } 
     }
     #swagger.responses[401] = { description: 'Unauthorized - Missing token cookie' }
     #swagger.responses[403] = { description: 'Forbidden - Invalid token' }
  */
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
  /* #swagger.tags = ['Authentication']
     #swagger.description = 'Retrieve current session and user details. Requires both a valid Bearer Token and the jwt refresh token cookie.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['cookie'] = {
        in: 'cookie',
        name: 'jwt',
        type: 'string',
        required: true,
        description: 'Refresh token stored in httpOnly cookie'
     }
     #swagger.responses[200] = { 
        schema: { user: { $ref: '#/definitions/UserObject' } } 
     }
     #swagger.responses[401] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  try {
    const cookies = req.cookies;

    if (!cookies.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;

    const user = User.findByRefreshToken(refreshToken);

    if (!user) return res.sendStatus(401);

    return res.json({
      user,
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

export const logout = (req: Request, res: Response) => {
  /* #swagger.tags = ['Authentication']
     #swagger.description = 'Log out the user, revoke the refresh token and clear cookies.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;

  try {
    User.revokeRefreshToken(userId);

    res.clearCookie("jwt");

    return res.status(200).json({ message: "Logout succeded" });
  } catch (error) {
    return res.status(500).json({ message: "Internal error during logout" });
  }
};

export const updateAvatar = (req: Request, res: Response) => {
  /* #swagger.tags = ['Authentication']
     #swagger.description = 'Update the profile picture (avatar) for the authenticated user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.consumes = ['multipart/form-data']
     #swagger.parameters['avatar'] = {
        in: 'formData',
        type: 'file',
        required: true,
        description: 'New avatar image file'
     }
     #swagger.responses[200] = { 
        schema: { $ref: '#/definitions/AvatarUpdateResponse' } 
     }
     #swagger.responses[400] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = res.locals.userId;
  const newAvatar = req.file?.filename!;

  try {
    const foundUser = User.findById(userId);

    if (!foundUser) {
      return res.status(400).json({ message: "No user found with this ID" });
    }

    if (foundUser.avatar && existsSync(`static/avatar/${foundUser.avatar}`)) {
      unlinkSync(`static/avatar/${foundUser.avatar}`);
    }

    User.updateAvatar(userId, newAvatar);

    return res.status(200).json({
      data: {
        id: foundUser.id,
        avatar: User.formatUserAvatar(foundUser.username, newAvatar),
      },
      message: "Avatar updated successfully",
    });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({ message: "Internal server error" });
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
