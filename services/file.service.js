const fs = require("fs");
const File = require("../models/File");
const config = require("config");
const { join, resolve, sep } = require("path");

const filePath = join(resolve(), "files");

class FileService {
  createDir(req, file) {
    const path = this.getPath(req, file);

    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(path)) {
          fs.mkdirSync(path, { recursive: true });
          return resolve({ message: "File was created" });
        } else {
          return reject({ message: "File already exists" });
        }
      } catch (e) {
        return reject({ message: "File error" });
      }
    });
  }

  deleteFile(req, file) {
    const path = this.getPath(req, file);
    try {
      if (file.type === "dir") {
        fs.rmdirSync(path);
      } else {
        fs.unlinkSync(path);
      }
      return true;
    } catch (e) {
      console.log("error service");
      return false;
    }
  }

  getPath(req, file) {
    return `${req.filePath}${sep}${sep}${file.user}${sep}${sep}${file.path}`;
  }
}

module.exports = new FileService();
