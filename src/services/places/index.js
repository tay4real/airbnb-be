const express = require("express");
const { check, validationResult, checkSchema } = require("express-validator");
const uniqid = require("uniqid");
const multer = require("multer");
const moment = require("moment");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../library/cloudinary");
const { getPlaces, writePlaces } = require("../../library/fsUtils");

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
  check("price")
    .exists()
    .withMessage("Price is required")
    .isLength({ min: 1 })
    .withMessage("Price cannot be empty"),
  check("address.street")
    .exists()
    .withMessage("Street is required")
    .isLength({ min: 1 })
    .withMessage("Street cannot be empty"),
  check("address.city")
    .exists()
    .withMessage("City is required")
    .isLength({ min: 1 })
    .withMessage("City cannot be empty"),
  check("address.zipcode")
    .exists()
    .withMessage("Zip Code is required")
    .isLength({ min: 1 })
    .withMessage("Zip Code cannot be empty"),
  check("address.country")
    .exists()
    .withMessage("Country is required")
    .isLength({ min: 1 })
    .withMessage("Country cannot be empty"),
  check("address.latitude")
    .exists()
    .withMessage("Latitude is required")
    .isLength({ min: 1 })
    .withMessage("Latitude cannot be empty"),
];

// const addressValidation = [
//   check("street").exists().withMessage("Street is required"),
//   check("city").exists().withMessage("City is required"),
//   check("zipcode").exists().withMessage("Zip code is required"),
//   check("country").exists().withMessage("Country is required"),
//   check("latitude").exists().withMessage("Latitude is required"),
//   check("longitude").exists().withMessage("Longitude is required"),
// ];

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

// placesRouter.post(
//   "/",
//   cloudinaryMulter.array("photos"),
//   placesValidation,
//   async (req, res, next) => {
//     try {
//       const validationErrors = validationResult(req);

//       if (!validationErrors.isEmpty()) {
//         const error = new Error();
//         error.httpStatusCode = 400;
//         error.message = validationErrors;
//         next(error);
//       } else {
//         const imageURLs = [];
//         const arrayOfPromises = req.files.map((file) =>
//           imageURLs.push(file.path)
//         );

//         await Promise.all(arrayOfPromises);

//         const currentPlaces = await getPlaces();
//         const newPlace = {
//           _id: uniqid(),
//           ...req.body,
//           photos: imageURLs,
//           bookings: [],
//           reviews: [],
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         };

//         // newPlace.photos = imageURLs;
//         // newPlace.bookings = [];
//         // newPlace.reviews = [];
//         // newPlace._id = uniqid();
//         // newPlace.createdAt = new Date();
//         // newDate.updatedAt = new Date();

//         // places.push({
//         //
//         // });
//         await writePlaces([...currentPlaces, newPlace]);
//         res.status(201).send("ok");
//       }
//     } catch (error) {
//       console.log(error);
//       next(error);
//     }
//   }
// );

// placesRouter.post(
//   "/",
//   cloudinaryMulter.array("images"),
//   async (req, res, next) => {
//     try {
//       const places = await getPlaces();

//       const imageURLs = [];
//       const arrayOfPromises = req.files.map((file) =>
//         imageURLs.push(file.path)
//       );

//       await Promise.all(arrayOfPromises);

//       places.push({
//         _id: uniqid(),
//         ...req.body,
//         imgURLs: imageURLs,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       });

//       await writePlaces(places);
//       res.json(places);
//     } catch (error) {
//       console.log(error);
//       next(error);
//     }
//   }
// );

// CREATE a new game (using Cloudinary as CDN for Images)
placesRouter.post(
  "/",
  cloudinaryMulter.array("images"),
  async (req, res, next) => {
    try {
      const reqPlace = JSON.parse(req.body.place);

      const newPlace = {
        id: uniqid(),
        ...reqPlace,
      };

      const imageURLs = [];
      const arrayOfPromises = req.files.map((file) =>
        imageURLs.push(file.path)
      );

      await Promise.all(arrayOfPromises);

      newPlace.imageURLs = imageURLs;
      newPlace.bookings = [];
      newPlace.reviews = [];
      newPlace.createdAt = new Date();
      newPlace.updatedAt = new Date();

      const currentPlaces = await getPlaces();

      await writePlaces([...currentPlaces, newPlace]);

      res.status(201).send(newPlace.id);
    } catch (ex) {
      console.log(ex);
      next(ex);
    }
  }
);

placesRouter.put("/:id", placesValidation, async (req, res, next) => {
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
        (place) => place._id === req.params.id
      );

      if (placeIndex !== -1) {
        // place found
        const updatedPlaces = [
          ...places.slice(0, placeIndex),
          { ...places[placeIndex], ...req.body },
          ...places.slice(placeIndex + 1),
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
});

placesRouter.delete("/:id", async (req, res, next) => {
  try {
    const places = await getPlaces();

    const placeFound = places.find((place) => place._id === req.params.id);

    if (placeFound) {
      const filteredPlace = places.filter(
        (place) => place._id !== req.params.id
      );

      await writePlaces(filteredPlace);
      res.send(filteredPlace);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = placesRouter;
