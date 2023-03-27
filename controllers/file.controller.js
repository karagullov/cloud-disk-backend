const fileService = require("../services/file.service");
const User = require("../models/User");
const File = require("../models/File");
const { sep, resolve, join } = require("path");
const fs = require("fs");
const Uuid = require("uuid");

const filePath = join(resolve(), "files");
const staticPath = join(resolve(), "static");

class FileController {
  async createDir(req, res) {
    try {
      const { name, type, parent } = req.body;
      const file = new File({ name, type, parent, user: req.user.id });
      const parentFile = await File.findOne({ _id: parent });
      if (!parentFile) {
        file.path = name;
        await fileService.createDir(req, file);
      } else {
        file.path = `${parentFile.path}${sep}${sep}${file.name}`;
        await fileService.createDir(req, file);
        parentFile.childs.push(file._id);
        await parentFile.save();
      }
      await file.save();
      return res.json(file);
    } catch (e) {
      console.log(e);
      return res.status(400).json(e);
    }
  }

  async getFiles(req, res) {
    try {
      const { sort, parent } = req.query;
      let files;

      switch (sort) {
        case "name":
          files = await File.find({ user: req.user.id, parent }).sort({
            name: 1,
          });
          break;
        case "type":
          files = await File.find({ user: req.user.id, parent }).sort({
            type: 1,
          });
          break;
        case "date":
          files = await File.find({ user: req.user.id, parent }).sort({
            date: 1,
          });
          break;
        default:
          files = await File.find({ user: req.user.id, parent });
      }

      res.json(files);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Can not get files" });
    }
  }

  async uploadFile(req, res) {
    try {
      const file = req.files.file;
      const parent = await File.findOne({
        user: req.user.id,
        _id: req.body.parent,
      });

      const user = await User.findOne({ _id: req.user.id });
      if (user.usedSpace + file.size > user.diskSpace) {
        return res.status(400).json({ message: "There no space on the disk" });
      }
      user.usedSpace = user.usedSpace + file.size;

      let path;
      if (parent) {
        path = `${req.filePath}${sep}${sep}${user._id}${sep}${sep}${parent.path}${sep}${sep}${file.name}`;
      } else {
        path = `${req.filePath}${sep}${sep}${user._id}${sep}${sep}${file.name}`;
      }

      if (fs.existsSync(path)) {
        return res.status(400).json({ message: "File already exist" });
      }
      file.mv(path);
      const type = file.name.split(".").pop();

      const dbFile = new File({
        name: file.name,
        type,
        size: file.size,
        path: parent ? parent.path + sep + sep + file.name : file.name,
        parent: parent ? parent._id : null,
        user: user._id,
      });

      await dbFile.save();
      await user.save();

      res.json(dbFile);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Uplod file" });
    }
  }

  async downloadFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });
      const path = fileService.getPath(req, file);
      if (fs.existsSync(path)) {
        return res.download(path, file.name);
      }
      res.status(500).json({ message: "Download error" });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Download error" });
    }
  }

  async deleteFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });
      if (!file) {
        return res.status(400).json({ message: "File not found" });
      }

      const response = fileService.deleteFile(req, file);
      if (!response) {
        return res.status(500).json({ message: "Delete error" });
      }

      await file.deleteOne();
      return res.status(200).json({ message: "File was deleted" });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Delete error maybe dir is not empty" });
    }
  }

  async searchFile(req, res) {
    try {
      const searchName = req.query.search;
      let files = await File.find({ user: req.user.id });
      files = files.filter((file) => file.name.includes(searchName));
      return res.json(files);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Search error" });
    }
  }

  async uploadAvatar(req, res) {
    try {
      const file = req.files.file;
      const user = await User.findById(req.user.id);
      const avatarName = Uuid.v4() + ".jpg";
      file.mv(staticPath + sep + sep + avatarName);
      user.avatar = avatarName;
      await user.save();
      return res.json(user);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Upload avater error" });
    }
  }

  async deleteAvatar(req, res) {
    try {
      const user = await User.findById(req.user.id);
      fs.unlinkSync(staticPath + sep + sep + user.avatar);
      user.avatar = null;
      await user.save();
      return res.json(user);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Delete avater error" });
    }
  }
}

module.exports = new FileController();
