import { Request, Response } from "express";
import { User } from "../models/user.model";

export const updateAvatar = async (req: Request, res: Response) => {
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
  const userId = req.userId!;

  try {
    const foundUser = await User.findById(userId);

    if (!foundUser) {
      return res.status(400).json({ message: "No user found with this ID" });
    }

    const uploadData = await User.updateAvatar(userId);

    return res.status(200).json({ data: uploadData });
  } catch (error) {
    console.error(error);
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const updateAvatarConfirm = async (req: Request, res: Response) => {
  const userId = req.userId!;

  try {
    const foundUser = await User.findById(userId);

    if (!foundUser) {
      return res.status(400).json({ message: "No user found with this ID" });
    }
    const updatedAt = await User.updateAvatarUpdatedAt(userId);

    const avatarUrl = User.formatUserAvatar(
      foundUser.id,
      foundUser.username,
      updatedAt,
    );

    return res
      .status(200)
      .json({ data: { avatarUrl }, message: "Avatar updated successfully" });
  } catch (error) {
    console.error(error);
  }
  return res.status(500).json({ message: "Internal server error" });
};
