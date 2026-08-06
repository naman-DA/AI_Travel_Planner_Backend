import slugify from "slugify";
import { Destination } from "../models/destination.models.js";
import { ApiError } from "../utils/ApiError.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary
} from "../utils/cloudinary.js";

// Generate Slug

const generateSlug = (name, city, country) => {
    return slugify(`${name}-${city}-${country}`, {
        lower: true,
        strict: true,
        trim: true,
    });
};

// Upload Gallery Images

const uploadGalleryImages = async (files = []) => {
    const uploadedImages = [];

    for (const file of files) {
        const response = await uploadOnCloudinary(
            file.path,
            "ai-travel-planner/destinations"
        );

        if (!response) {
            throw new ApiError(500, "Failed to upload destination image.");
        }

        uploadedImages.push({
            url: response.secure_url,
            publicId: response.public_id,
            caption: "",
            isCover: false,
        });
    }

    return uploadedImages;
};

// Delete Destination Images

const deleteGalleryImages = async (images = []) => {
    for (const image of images) {
        if (image.publicId) {
            await deleteFromCloudinary(image.publicId);
        }
    }
};

// Create Destination

const createDestination = async ({
    destinationData,
    coverImage,
    galleryImages = [],
}) => {

  // Generate slug

  const slug = generateSlug(
    destinationData.name,
    destinationData.city,
    destinationData.country
  );

  // Duplicate check
  
  const existingDestination = await Destination.findOne({ slug, });

  if (existingDestination) {
    throw new ApiError(409, "Destination already exists.");
  }

  let uploadedCoverImage = null;
  let uploadedGalleryImages = [];

  try {
  //  Upload Cover
    
    if (coverImage) {
      const response = await uploadOnCloudinary(
          coverImage.path,
          "ai-travel-planner/destinations/cover"
      );

      if (!response) {
        throw new ApiError(500, "Failed to upload cover image.");
      }

      uploadedCoverImage = {
        url: response.secure_url,
        publicId: response.public_id,
        caption: destinationData.name,
      };
    }
    
    // Upload Gallery
    
    if (galleryImages.length > 0) {
      uploadedGalleryImages = await uploadGalleryImages(galleryImages);
    }

    //  Create Destination

    const destination = await Destination.create({
      ...destinationData,
      slug,
      coverImage: uploadedCoverImage,
      galleryImages: uploadedGalleryImages,
    });
        
    return destination;

  } 
    
  catch (error) {
    //  Rollback Cloudinary

    if (uploadedCoverImage?.publicId) {
      await deleteFromCloudinary(uploadedCoverImage.publicId); 
    }
  
    await deleteGalleryImages(uploadedGalleryImages);

    throw error;
  }
};

//  Get All Destinations

const getAllDestinations = async ({
    page = 1,
    limit = 10,
    search = "",
    country,
    state,
    city,
    destinationType,
    travelStyle,
    minRating,
    isFeatured,
    sort = "newest"
}) => {
    page = Number(page);
    limit = Number(limit);

    const query = {
        isActive: true
    };

    // Search

    if (search) {
        query.$or = [
            {
                name: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                city: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                state: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                country: {
                    $regex: search,
                    $options: "i"
                }
            }
        ];
    }

    // Filters

    if (country) {
        query.country = country;
    }

    if (state) {
        query.state = state;
    }

    if (city) {
        query.city = city;
    }

    if (destinationType) {
        query.destinationType = destinationType;
    }

    if (travelStyle) {
        query.travelStyles = travelStyle;
    }

    if (minRating) {
        query.averageRating = {
            $gte: Number(minRating)
        };
    }

    if (isFeatured !== undefined) {
        query.isFeatured =
            isFeatured === "true";
    }

    // Sorting

    let sortOption = {
        createdAt: -1
    };

    switch (sort) {
        case "rating":
            sortOption = {
                averageRating: -1
            };

            break;

        case "popularity":
            sortOption = {
                popularityScore: -1
            };

            break;

        case "alphabetical":
            sortOption = {
                name: 1
            };

            break;

        case "oldest":
            sortOption = {
                createdAt: 1
            };

            break;

        default:
            sortOption = {
                createdAt: -1
            };
    }

    const skip =
        (page - 1) * limit;

    const [destinations, total] =
        await Promise.all([
            Destination.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
                // .populate("hotels")
                // .populate("restaurants")
                // .populate("activities"),

            Destination.countDocuments(query)
        ]);

    return {
        destinations,
        pagination: {
            page,
            limit,
            total,
            totalPages:
                Math.ceil(total / limit)
        }
    };
};

// Get Destination By ID

const getDestinationById = async (
    destinationId
) => {
    const destination =
        await Destination.findById(destinationId).lean();
            // .populate("hotels")
            // .populate("restaurants")
            // .populate("activities")
            // .populate("reviews");

    if (!destination) {
        throw new ApiError(
            404,
            "Destination not found."
        );
    }

    return destination;
};

// Search Destinations

const searchDestinations = async (
    keyword
) => {
    if (!keyword) {
        return [];
    }

    return await Destination.find({
        isActive: true,
        $or: [
            {
                name: {
                    $regex: keyword,
                    $options: "i"
                }
            },
            {
                city: {
                    $regex: keyword,
                    $options: "i"
                }
            },
            {
                country: {
                    $regex: keyword,
                    $options: "i"
                }
            },
            {
                searchKeywords: {
                    $in: [
                        new RegExp(
                            keyword,
                            "i"
                        )
                    ]
                }
            }
        ]
    })
        .sort({
            popularityScore: -1
        })
        .limit(20)
        .lean();
};

// Filter Destinations

const filterDestinations = async ({
    country,
    destinationType,
    travelStyle,
    suitableFor,
    minBudget,
    maxBudget,
    minRating
}) => {
    const query = {
        isActive: true
    };

    if (country) {
        query.country = country;
    }

    if (destinationType) {
        query.destinationType = destinationType;
    }

    if (travelStyle) {
        query.travelStyles = travelStyle;
    }

    if (suitableFor) {
        query.suitableFor = suitableFor;
    }

    if (
        minBudget ||
        maxBudget
    ) {
        query["averageDailyBudget.budget"] = {};

        if (minBudget) {
            query["averageDailyBudget.budget"].$gte =
                Number(minBudget);
        }

        if (maxBudget) {
            query["averageDailyBudget.budget"].$lte =
                Number(maxBudget);
        }
    }

    if (minRating) {
        query.averageRating = {
            $gte: Number(minRating)
        };
    }

    return await Destination.find(query)
        .sort({
            popularityScore: -1
        })
        .lean();
        // .populate("activities")
        // .populate("hotels")
        // .populate("restaurants");
};

// Update Destination

const updateDestination = async ({
    destinationId,
    destinationData,
    coverImage,
    galleryImages = [],
}) => {
    const destination = await Destination.findById(destinationId);

    if (!destination) {
        throw new ApiError(404, "Destination not found.");
    }

    try {
        // Update Cover Image

        if (coverImage) {
            if (destination.coverImage?.publicId) {
                await deleteFromCloudinary(
                    destination.coverImage.publicId
                );
            }

            const uploadedCover = await uploadOnCloudinary(
                coverImage.path,
                "ai-travel-planner/destinations/cover"
            );

            if (!uploadedCover) {
                throw new ApiError(
                    500,
                    "Failed to upload cover image."
                );
            }

            destination.coverImage = {
                url: uploadedCover.secure_url,
                publicId: uploadedCover.public_id,
                caption:
                    destinationData.name ||
                    destination.name,
            };
        }

        // Update Gallery Images

        if (galleryImages.length > 0) {
            await deleteGalleryImages(
                destination.galleryImages
            );

            destination.galleryImages =
                await uploadGalleryImages(
                    galleryImages
                );
        }

        // Update Remaining Fields

        Object.entries(destinationData).forEach(([key, value]) => {
            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                destination[key] = value;
            }
        });

        if (
            destinationData.name ||
            destinationData.city
        ) {
            destination.slug = generateSlug(
                destinationData.name || destination.name,
                destinationData.city || destination.city,
                destinationData.country || destination.country
            );
        }

        await destination.save();

        return destination;
    } 
    catch (error) {
        throw error;
    }
};

// Delete Destination

const deleteDestination = async (destinationId) => {
    const destination = await Destination.findById(
        destinationId
    );

    if (!destination) {
        throw new ApiError(404, "Destination not found.");
    }

    // Delete Cover

    if (destination.coverImage?.publicId) {
        await deleteFromCloudinary(
            destination.coverImage.publicId
        );
    }

    // Delete Gallery 

    await deleteGalleryImages(
        destination.galleryImages
    );

    // Delete Document 

    await destination.deleteOne();

    return true;
};

export const destinationService = {
    createDestination,
    getDestinationById,
    getAllDestinations,
    updateDestination,
    deleteDestination,
    searchDestinations,
    filterDestinations
};