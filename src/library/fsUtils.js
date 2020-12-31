const { readJSON, writeJSON } = require("fs-extra");
const path = require("path");

const placesPath = path.join(__dirname, "../services/places/places.json");

const readDB = async (filePath) => {
  try {
    const fileJson = await readJSON(filePath);
    return fileJson;
  } catch (error) {
    throw new Error(error);
  }
};

const writeDB = async (filePath, fileContent) => {
  try {
    await writeJSON(filePath, fileContent);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getPlaces: async () => readDB(placesPath),
  writePlaces: async (mediaData) => writeDB(placesPath, mediaData),
};
