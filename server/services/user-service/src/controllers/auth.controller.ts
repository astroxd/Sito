import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { hashSync, compare } from "bcrypt";
import { logger } from "@anime-hub/common";

const JWTSECRET = process.env.JWT_SECRET || "RSAPRIVATEKEY";

export const register = async (req: Request, res: Response) => {
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

  try {
    if (await User.findByEmail(email)) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists" });
    }

    if (await User.findByUsername(username)) {
      return res.status(409).json({
        message:
          "A user with this username already exists, please choose another one",
      });
    }

    const userId = await User.createUser(email, hashValue(password), username);

    const { accessToken, refreshToken } = generateJwt(userId);

    await User.updateRefreshToken(userId, refreshToken);

    const user = await User.findByEmail(email);
    const avatarUploadData = await User.updateAvatar(user?.id!);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      data: {
        user: {
          ...user,
          defaultAvatarUrl: User.formatUserAvatar(
            user!.id,
            user!.username,
            null,
          ),
        },
        avatarUploadData,
        accessToken: accessToken,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    logger.error(error);
  }
  return res.status(401).json({ message: "Generic error" });
};

export const login = async (req: Request, res: Response) => {
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
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userPassword = await User.getPasswordFromEmail(email);

    const passwordMatch = await compare(password, userPassword!);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateJwt(user.id);
    await User.updateRefreshToken(user.id, refreshToken);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      data: {
        user: {
          ...user,
          defaultAvatarUrl: User.formatUserAvatar(user.id, user.username, null),
        },
        accessToken: accessToken,
      },
      message: "Login succeded",
    });
  } catch (error) {
    logger.error(error);
  }
  return res.status(401).json({ message: "Invalid credentials" });
};

export const refreshToken = async (req: Request, res: Response) => {
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
    const user = await User.findByRefreshToken(refreshToken);

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
    logger.error(error);
  }
  return res.sendStatus(403);
};

export const session = async (req: Request, res: Response) => {
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

    const user = await User.findByRefreshToken(refreshToken);

    if (!user) return res.sendStatus(401);

    return res.json({
      user: {
        ...user,
        defaultAvatarUrl: User.formatUserAvatar(user.id, user.username, null),
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  /* #swagger.tags = ['Authentication']
     #swagger.description = 'Log out the user, revoke the refresh token and clear cookies.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = { schema: { $ref: '#/definitions/ErrorResponse' } }
     #swagger.responses[500] = { schema: { $ref: '#/definitions/ErrorResponse' } }
  */
  const userId = req.userId!;

  try {
    await User.revokeRefreshToken(userId);

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

const generateJwt = (userId: number) => {
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
