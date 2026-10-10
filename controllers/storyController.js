import fs from "fs";
import imageKit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import { inngest } from "../inngest/index.js";
import User from "../models/User.js";
export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, media_type, background_color } = req.body;
    const media = req.file;
    let media_url = "";
    console.log(media)
    console.log(req.body)
    if (media_type === "image" || media_type === "video") {
      const fileBuffer = fs.readFileSync(media.path);
      const fileBase64=fileBuffer.toString("base64")
      const response = await imageKit.files.upload({
        file: fileBase64,
        fileName: media.originalname,
        folder: "stories",
      });
      media_url = response.url || imageKit.helper.buildSrc({
                src: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '512' }
                ]
              });
    }
    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });
    await inngest.send({
        name:'app/story-delete',
        data:{storyId:story._id}
    })
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
export const getStories = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId);
        const userIds = [userId, ...user.connections, ...user.following];
        const stories = await Story.find({
            user: { $in: userIds },
        }).populate("user").sort({ createdAt: -1 });
        res.json({ success: true, stories });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
