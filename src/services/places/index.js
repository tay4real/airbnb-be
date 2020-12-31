const express = require("express");
const { check, validationResult, checkSchema } = require("express-validator");
const uniqid = require("uniqid");
const multer = require("multer");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../library/cloudinary");
const { getPlaces, writePlaces } = require("../../library/fsUtils");

const addressValidation = [
  check("street").exists().withMessage("Street is required"),
  check("city").exists().withMessage("City is required"),
  check("zipcode").exists().withMessage("Zip code is required"),
  check("country").exists().withMessage("Country is required"),
  check("latitude").exists().withMessage("Latitude is required"),
  check("longitude").exists().withMessage("Longitude is required"),
];

const placesValidation = [
  check("title")
    .exists()
    .withMessage("Title is required")
    .isLength({ min: 1 })
    .withMessage("Title cannot be empty")
    .isString()
    .withMessage("Title must be a string"),
  check("description")
    .exists()
    .withMessage("Description is required")
    .isLength({ min: 1 })
    .withMessage("Description cannot be empty")
    .isString()
    .withMessage("Description must be a string"),
];

const placesRouter = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "strive-school/airbnb",
  },
});

const cloudinaryMulter = multer({ storage: storage });

placesRouter.get("/", async (req, res, next) => {
  try {
    const places = await getPlaces();

    if (req.query && req.query.title) {
      const filteredPlace = places.filter(
        (place) =>
          place.hasOwnProperty("title") && place.title === req.query.title
      );
      res.send(filteredPlace);
    } else {
      res.send(places);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

placesRouter.get("/:search", async (req, res, next) => {
  try {
    const places = await getPlaces();

    const searchResult = places.filter(
      (place) =>
        place._id === req.params.search ||
        place.title === req.params.search ||
        place.address.city === req.params.search ||
        place.address.zipcode === req.params.search ||
        place.address.country === req.params.search
    );

    if (searchResult) {
      res.send(searchResult);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

placesRouter.post("/", placesValidation, async (req, res, next) => {
  try {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      const error = new Error();
      error.httpStatusCode = 400;
      error.message = validationErrors;
      next(error);
    } else {
      const places = await getPlaces();

      places.push({
        _id: uniqid(),
        ...req.body,
        photos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await writePlaces(places);
      res.status(201).send("ok");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

placesRouter.put(
  "/:id",
  [placesValidation, addressValidation],
  async (req, res, next) => {
    try {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        const error = new Error();
        error.httpStatusCode = 400;
        error.message = validationErrors;
        next(error);
      } else {
        const places = await getPlaces();

        const placeIndex = places.findIndex(
          (place) => place._id === req.params._id
        );

        if (placeIndex !== -1) {
          // place found
          const updatedPlaces = [
            ...places.slice(0, placeIndex),
            { ...places[placeIndex], ...req.body },
            ...media.slice(placeIndex + 1),
          ];
          await writePlaces(updatedPlaces);
          res.send(updatedPlaces);
        } else {
          const err = new Error();
          err.httpStatusCode = 404;
          next(err);
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = placesRouter;
